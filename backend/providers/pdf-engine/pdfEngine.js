import puppeteer from 'puppeteer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

// ─── Shared CSS (injected into every PDF) ──────────────────────
function loadBaseCSS() {
  const cssPath = path.join(TEMPLATES_DIR, 'base.css');
  if (!fs.existsSync(cssPath)) return '';
  return fs.readFileSync(cssPath, 'utf8');
}

// ─── Browser Launch Helper ────────────────────────────────────
async function launchBrowser() {
  return puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--font-render-hinting=none',
    ],
  });
}

// ─── Core PDF Generation ──────────────────────────────────────
/**
 * Generates a branded PDF buffer from a Handlebars template.
 *
 * @param {string} templateName - Name of the .hbs file (without extension)
 * @param {object} data - Template data (document-specific fields)
 * @param {object} branding - Tenant branding object
 * @param {string} branding.logo_url - Agency logo URL
 * @param {string} branding.agency_name - Agency name
 * @param {string} branding.agency_address - Agency address
 * @param {string} branding.agency_phone - Agency phone
 * @param {string} branding.agency_email - Agency email
 * @param {string} branding.agency_website - Agency website
 * @param {string} branding.gstin - GSTIN number
 * @param {string} branding.pan - PAN number
 * @param {string} branding.primary_color - Brand primary color
 * @param {string} branding.secondary_color - Brand secondary color
 * @param {object} [options] - PDF generation options
 * @param {string} [options.format] - Page format (default: 'A4')
 * @param {boolean} [options.landscape] - Landscape orientation
 * @returns {Promise<Buffer>} PDF buffer
 */
async function generatePdf(templateName, data, branding = {}, options = {}) {
  const template = loadTemplate(templateName);
  const baseCSS = loadBaseCSS();

  const html = template({
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
    baseCSS,
    generated_at: new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
  });

  const browser = await launchBrowser();
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 15000 });

    const pdfBuffer = await page.pdf({
      format: options.format || 'A4',
      landscape: options.landscape || false,
      printBackground: true,
      margin: {
        top: '15mm',
        bottom: '20mm',
        left: '12mm',
        right: '12mm',
      },
      displayHeaderFooter: true,
      headerTemplate: '<div></div>',
      footerTemplate: `
        <div style="width:100%; font-size:8px; color:#999; text-align:center; padding:5px 20mm;">
          <span class="pageNumber"></span> / <span class="totalPages"></span>
        </div>
      `,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// ─── Fetch tenant branding helper ─────────────────────────────
/**
 * Fetches branding data for a tenant from Supabase.
 * Used by controllers before calling generatePdf.
 */
async function fetchTenantBranding(supabaseAdmin, tenantId) {
  const { data, error } = await supabaseAdmin
    .from('tenants')
    .select('name, logo_url, primary_color, secondary_color, agency_address, agency_phone, agency_email, agency_website, gstin, pan, invoice_bank_text')
    .eq('id', tenantId)
    .single();

  if (error) throw error;
  return data;
}


// ─── Graceful Shutdown (no-op since browser is now ephemeral) ──
async function closeBrowser() {
  // Browser instances are now created and destroyed per-PDF generation.
  // This function is kept for API compatibility with existing imports.
}

process.on('SIGTERM', closeBrowser);
process.on('SIGINT', closeBrowser);

export { generatePdf, fetchTenantBranding, closeBrowser };
