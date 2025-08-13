// scripts/generate-icons-list.mjs
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.resolve(__dirname, '../public/icons');
const LIST_FILE = path.join(ICONS_DIR, '_list.json');

function isSvg(file) {
  return /\.svg$/i.test(file);
}

async function main() {
  try {
    await fs.mkdir(ICONS_DIR, { recursive: true });
    const entries = await fs.readdir(ICONS_DIR, { withFileTypes: true });

    // prendi solo file .svg (escludi _list.json stesso)
    const svgs = entries
      .filter(d => d.isFile() && isSvg(d.name) && d.name !== '_list.svg' && d.name !== '_list.json')
      .map(d => d.name)
      .sort((a,b) => a.localeCompare(b));

    // scrivi JSON pulito
    const json = JSON.stringify(svgs, null, 2) + '\n';
    await fs.writeFile(LIST_FILE, json, 'utf-8');

    console.log(`✅ Aggiornato ${path.relative(process.cwd(), LIST_FILE)} (${svgs.length} icone)`);
  } catch (err) {
    console.error('❌ Impossibile aggiornare _list.json:', err);
    process.exitCode = 1;
  }
}

main();
