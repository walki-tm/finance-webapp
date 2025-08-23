// scripts/generate-icons-list.mjs
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICONS_DIR = path.resolve(__dirname, '../public/icons');
const MAIN_DIR = path.join(ICONS_DIR, 'main');
const SUB_DIR = path.join(ICONS_DIR, 'subcategories');
const MAIN_LIST = path.join(ICONS_DIR, 'main-icons.json');
const SUB_LIST = path.join(ICONS_DIR, 'sub-icons.json');
const LEGACY_LIST = path.join(ICONS_DIR, '_list.json'); // Keep for backward compatibility

function isSvg(file) {
  return /\.svg$/i.test(file);
}

async function getIconsFromDir(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    return entries
      .filter(d => d.isFile() && isSvg(d.name))
      .map(d => d.name)
      .sort((a,b) => a.localeCompare(b));
  } catch (err) {
    console.warn(`⚠️ Directory ${dirPath} not found, returning empty array`);
    return [];
  }
}

async function main() {
  try {
    // Create directories if they don't exist
    await fs.mkdir(MAIN_DIR, { recursive: true });
    await fs.mkdir(SUB_DIR, { recursive: true });

    // Get icons from both directories
    const mainIcons = await getIconsFromDir(MAIN_DIR);
    const subIcons = await getIconsFromDir(SUB_DIR);

    // Write separate lists
    await fs.writeFile(MAIN_LIST, JSON.stringify(mainIcons, null, 2) + '\n', 'utf-8');
    await fs.writeFile(SUB_LIST, JSON.stringify(subIcons, null, 2) + '\n', 'utf-8');
    
    // Keep legacy list for backward compatibility (all icons combined)
    const allIcons = [...mainIcons, ...subIcons].sort((a,b) => a.localeCompare(b));
    await fs.writeFile(LEGACY_LIST, JSON.stringify(allIcons, null, 2) + '\n', 'utf-8');

    console.log(`✅ Aggiornato main-icons.json (${mainIcons.length} icone main)`);
    console.log(`✅ Aggiornato sub-icons.json (${subIcons.length} icone sottocategorie)`);
    console.log(`✅ Aggiornato _list.json (${allIcons.length} icone totali per compatibilità)`);
  } catch (err) {
    console.error('❌ Impossibile aggiornare liste icone:', err);
    process.exitCode = 1;
  }
}

main();
