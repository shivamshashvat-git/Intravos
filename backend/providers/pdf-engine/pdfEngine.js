import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../core/config/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Handlebars Helpers ───────────────────────────────────────
Handlebars.registerHelper('formatCurrency', (value) => {
  const num = parseFloat(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
});

Handlebars.registerHelper('formatDate', (value) => {
  if (!value) return '';
  const d = new Date(value);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
});

Handlebars.registerHelper('inc', (val) => parseInt(val, 10) + 1);

Handlebars.registerHelper('eq', (a, b) => a === b);

Handlebars.registerHelper('or', (...args) => {
  args.pop(); // remove Handlebars options object
  return args.some(Boolean);
});

Handlebars.registerHelper('uppercase', (str) => String(str || '').toUpperCase());

Handlebars.registerHelper('defaultVal', (val, fallback) => val || fallback);

// ─── Template Cache ───────────────────────────────────────────
const templateCache = new Map();
const TEMPLATES_DIR = path.join(__dirname, 'templates', 'pdf');

function loadTemplate(templateName) {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName);
  }

  const filePath = path.join(TEMPLATES_DIR, `${templateName}.hbs`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF template not found: ${templateName} (looked in ${filePath})`);
  }

  const source = fs.readFileSync(filePath, 'utf8');
  const compiled = Handlebars.compile(source);
  templateCache.set(templateName, compiled);
  return compiled;
}

// ─── Shared CSS ──────────────────────
function loadBaseCSS() {
  const cssPath = path.join(TEMPLATES_DIR, 'base.css');
  if (!fs.existsSync(cssPath)) return '';
  return fs.readFileSync(cssPath, 'utf8');
}

// ─── Core PDF Generation (Gotenberg) ──────────────────────────
/**
 * Generates a branded PDF buffer from a Handlebars template using Gotenberg.
 *
 * @param {string} templateName - Name of the .hbs file (without extension)
 * @param {object} data - Template data (document-specific fields)
 * @param {object} branding - Tenant branding object
 * @param {object} [options] - PDF generation options
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePdf(templateName, data, branding = {}, options = {}) {
  const gotenbergUrl = config.gotenberg.url;
  if (!gotenbergUrl) {
    throw new Error('GOTENBERG_URL environment variable is not set');
  }

  try {
    const template = loadTemplate(templateName);
    const baseCSS = loadBaseCSS();

    // Prepare data
    const templateData = {
      ...data,
      branding: {
        logo_url: branding.logo_url || '',
        agency_name: branding.agency_name || branding.name || '',
        agency_address: branding.agency_address || '',
        agency_phone: branding.agency_phone || branding.phone || '',
        agency_email: branding.agency_email || branding.email || '',
        agency_website: branding.agency_website || branding.website || '',
        gstin: branding.gstin || '',
        pan: branding.pan || '',
        primary_color: branding.primary_color || '#1A365D',
        secondary_color: branding.secondary_color || '#2B6CB0',
      },
      baseCSS, // Injected via Handlebars {{{baseCSS}}} in templates
      generated_at: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    // Compile HTML
    const html = template(templateData);

    // Create a form data for Gotenberg
    const formData = new FormData();
    
    // Gotenberg expectations: 
    // - index.html is the main file
    // - footer.html (optional) for page numbering
    formData.append('index.html', new Blob([html], { type: 'text/html' }), 'index.html');

    // PDF options (Gotenberg 8 Chromium specific fields)
    formData.append('paperWidth', '8.27'); // A4 inches
    formData.append('paperHeight', '11.69');
    formData.append('marginTop', '0.59'); // 15mm approx
    formData.append('marginBottom', '0.78'); // 20mm approx
    formData.append('marginLeft', '0.47'); // 12mm approx
    formData.append('marginRight', '0.47'); // 12mm approx
    formData.append('printBackground', 'true');
    
    if (options.landscape) {
      formData.append('landscape', 'true');
    }

    // Footer template for page numbers (similar to Puppeteer implementation)
    const footerHtml = `
      <div style="width:100%; font-size:8px; color:#999; text-align:center; padding:5px 20mm; font-family: sans-serif;">
        <span class="pageNumber"></span> / <span class="totalPages"></span>
      </div>
    `;
    formData.append('footer.html', new Blob([footerHtml], { type: 'text/html' }), 'footer.html');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const endpoint = `${gotenbergUrl.replace(/\/$/, '')}/forms/chromium/convert/html`;
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gotenberg Server Error: ${response.status} - ${errorText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);

  } catch (error) {
    // Return a clean error message for the caller
    throw new Error(`Failed to generate PDF [${templateName}]: ${error.message}`);
  }
}

// ─── Fetch tenant branding helper ─────────────────────────────
async function fetchTenantBranding(supabaseAdmin, tenantId) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('name, logo_url, primary_color, secondary_color, agency_address, agency_phone, agency_email, agency_website, gstin, pan, invoice_bank_text')
    .eq('id', tenantId)
    .single();

  if (error) throw error;
  return data;
}

// ─── Graceful Shutdown (Legacy API Compatibility) ──
async function closeBrowser() {
  // Gotenberg manages its own chromium lifecycle.
}

export { generatePdf, fetchTenantBranding, closeBrowser };
