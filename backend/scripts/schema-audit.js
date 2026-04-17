import fs from 'fs';
import path from 'path';

const sql = fs.readFileSync(path.join(process.cwd(), 'compiled-schema.sql'), 'utf-8');

const tables = new Set();
const tableMatches = [...sql.matchAll(/CREATE TABLE IF NOT EXISTS\s+([a-zA-Z0-9_]+)/g)];
tableMatches.forEach(m => tables.add(m[1]));

const references = [...sql.matchAll(/REFERENCES\s+([a-zA-Z0-9_]+)\(id\)/g)];
const errors = [];
references.forEach(m => {
  const target = m[1];
  if (!tables.has(target) && target !== 'users' && target !== 'tenants') {
    errors.push(`Reference to unknown table: ${target}`);
  }
});

if (errors.length > 0) {
  console.log("SCHEMA ERRORS FOUND:");
  const uniqueErrors = [...new Set(errors)];
  uniqueErrors.forEach(e => console.log(e));
} else {
  console.log("Schema integrity check passed. No broken foreign keys.");
}

console.log("Total tables defined: " + tables.size);
