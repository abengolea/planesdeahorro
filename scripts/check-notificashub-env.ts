/**
 * Diagnóstico: por qué no cargan NOTIFICASHUB_* en local (cwd, archivo, encoding, dotenv).
 *
 *   npx tsx scripts/check-notificashub-env.ts
 *
 * No imprime valores de *SECRET*; solo longitudes y si están definidas.
 */
import { config } from 'dotenv';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const envLocal = resolve(root, '.env.local');
const envFile = resolve(root, '.env');

function maskSecret(len: number): string {
  return len ? `(definido, ${len} caracteres)` : '(vacío)';
}

function analyzeRawFile(path: string, label: string): void {
  console.log(`\n--- ${label} ---`);
  console.log('Ruta:', path);
  if (!existsSync(path)) {
    console.log('Estado: no existe');
    return;
  }
  const st = statSync(path);
  console.log('Estado: existe, tamaño', st.size, 'bytes');

  const buf = readFileSync(path);
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
    console.log(
      'PROBLEMA: archivo UTF-16 LE (BOM). dotenv suele fallar. Guardá el archivo como UTF-8 (sin BOM) en el editor.'
    );
  } else if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
    console.log('PROBLEMA: archivo UTF-16 BE. Guardá como UTF-8.');
  } else if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
    console.log('Nota: UTF-8 con BOM. Suele funcionar; si no, guardá UTF-8 sin BOM.');
  }

  const raw = buf.toString('utf8');
  const lines = raw.split(/\r?\n/);
  let foundUrl = false;

  const notificaLines: { n: number; preview: string }[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (/NOTIFICASHUB|notificashub/i.test(lines[i])) {
      notificaLines.push({
        n: i + 1,
        preview: JSON.stringify(lines[i].slice(0, 120)),
      });
    }
  }
  if (notificaLines.length) {
    console.log('Líneas que contienen "NOTIFICASHUB" (preview JSON para ver caracteres raros):');
    for (const x of notificaLines) console.log(`  ${x.n}:`, x.preview);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('#') || !trimmed) continue;
    if (/^NOTIFICASHUB_URL\s*=/.test(trimmed)) {
      foundUrl = true;
      const m = trimmed.match(/^NOTIFICASHUB_URL\s*=\s*(.*)$/);
      const val = (m?.[1] ?? '').trim().replace(/^["']|["']$/g, '');
      console.log(`Línea ~${i + 1} NOTIFICASHUB_URL:`, val ? `OK (${val.length} chars, empieza con ${val.slice(0, 12)}…)` : 'VACÍO después del =');
    }
    if (/^NOTIFICASHUB_TENANT_ID\s*=/.test(trimmed)) {
      const m = trimmed.match(/^NOTIFICASHUB_TENANT_ID\s*=\s*(.*)$/);
      const val = (m?.[1] ?? '').trim();
      console.log(`Línea ~${i + 1} NOTIFICASHUB_TENANT_ID:`, val || 'VACÍO');
    }
    if (/^NOTIFICASHUB_INBOUND_SECRET\s*=/.test(trimmed)) {
      const m = trimmed.match(/^NOTIFICASHUB_INBOUND_SECRET\s*=\s*(.*)$/);
      const val = (m?.[1] ?? '').trim();
      console.log(`Línea ~${i + 1} NOTIFICASHUB_INBOUND_SECRET:`, maskSecret(val.length));
    }
  }
  if (!foundUrl) {
    console.log('En el texto (UTF-8) no aparece una línea que empiece por NOTIFICASHUB_URL=');
    const keys: string[] = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const m = t.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/);
      if (m) keys.push(m[1]);
    }
    if (keys.length) {
      console.log(
        'Claves detectadas en este archivo (solo nombres, sin valores):',
        keys.slice(0, 40).join(', '),
        keys.length > 40 ? '…' : ''
      );
    }
    console.log(
      'Si ves NOTIFICASHUB_* en el editor pero no acá: guardá .env.local (Ctrl+S) o confirmá que editás el mismo path que arriba.'
    );
  }
}

function afterDotenv(): void {
  console.log('\n--- Tras cargar dotenv (igual que test-notificashub-send) ---');
  config({ path: envFile });
  config({ path: envLocal, override: true });

  const url = process.env.NOTIFICASHUB_URL?.trim();
  const tenant = process.env.NOTIFICASHUB_TENANT_ID?.trim();
  const secret = process.env.NOTIFICASHUB_INBOUND_SECRET?.trim();

  console.log('process.env.NOTIFICASHUB_URL:', url ? `OK (${url.length} chars)` : 'NO DEFINIDA');
  console.log('process.env.NOTIFICASHUB_TENANT_ID:', tenant || 'NO DEFINIDA');
  console.log('process.env.NOTIFICASHUB_INBOUND_SECRET:', maskSecret(secret?.length ?? 0));

  if (!url && existsSync(envLocal)) {
    console.log(
      '\nSi el archivo tiene la línea pero acá dice NO DEFINIDA: probá guardar .env.local como UTF-8 sin BOM, sin espacios alrededor del =, una variable por línea.'
    );
  }
}

console.log('Directorio de trabajo (cwd):', root);
analyzeRawFile(envLocal, '.env.local');
analyzeRawFile(envFile, '.env');
afterDotenv();
