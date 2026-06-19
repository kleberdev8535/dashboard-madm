const fs = require('fs');
const path = require('path');

// Read the file as raw bytes and detect/replace mojibake sequences
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'latin1'); // read as latin1 to see raw bytes
  let changed = false;

  // \xc3\xb0\xc5\xb8\xe2\x80\xa0 = ðŸ† = 🏆 (U+1F3C6 as UTF-8 re-read as latin1)
  // UTF-8 bytes of 🏆: F0 9F 8F 86 -> read as latin1 -> ð\x9f\x8f\x86
  // But PowerShell may have double-encoded: c3 b0 c5 b8 e2 80 a0
  // Let's just replace what we see visually in the file

  // Approach: read as utf8, replace the visible broken characters
  let c = fs.readFileSync(filePath, 'utf8');
  const orig = c;

  // These are the actual broken strings visible in the file (read as UTF-8)
  // Trophy 🏆 broken as: ðŸ†
  // The bytes: c3 b0 c5 b8 e2 80 a0 = ðŸ† in UTF-8
  const trophy = 'ðŸ†'; // ðŸ†
  const trophystr = '🏆';

  // Warning ⚠️ broken as: âš ï¸
  const warning = 'â ï¸'; // âš ï¸
  const warningstr = '⚠️';

  // em dash — broken as: â€"
  const emdash = 'â'; // probably "
  const emdash2 = 'â'; // —

  c = c.split(trophy).join(trophystr);
  c = c.split(warning).join(warningstr);
  c = c.split('â').join('—');
  c = c.split('â').join('–');
  c = c.split('â').join('"');
  c = c.split('â').join('"');
  c = c.split('â').join("'");

  // Fix the className pattern that's still broken
  // text-sm' style={ color: '#64748b' } className='
  c = c.replace(/className="text-sm' style=\{ color: '#64748b' \} className=' ([\w-]+)"/g, "className=\"text-sm $1\" style={{ color: '#64748b' }}");

  if (c !== orig) {
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Fixed:', filePath);
  } else {
    console.log('No change:', filePath);
  }
}

const base = 'c:\\Users\\kleber.ribeiro\\Documents\\Projetos MADM\\corporate-insights-platform';
const files = [
  'frontend/src/app/(dashboard)/dashboard/page.tsx',
  'frontend/src/app/(dashboard)/dashboard/performance/page.tsx',
];

files.forEach(f => fixFile(path.join(base, f)));
