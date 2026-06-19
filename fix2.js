const fs = require('fs');

function fix(filePath) {
  const buf = fs.readFileSync(filePath);
  let s = buf.toString('utf8');
  let original = s;

  // Fix broken className patterns from PowerShell
  s = s.replace(/className="text-sm' style=\{ color: '#64748b' \} className=' ml-9"/g, 'className="text-sm ml-9" style={{ color: \'#64748b\' }}');
  s = s.replace(/className="text-sm' style=\{ color: '#64748b' \} className='"/g, 'className="text-sm" style={{ color: \'#64748b\' }}');

  // Fix — dash (em dash bytes: e2 80 94)
  s = s.replace(/â/g, '—');
  // Fix mês (c3 aa = ê broken as c3 83 c2 aa)
  s = s.replace(/mÃªes/g, 'mês');
  s = s.replace(/MÃªes/g, 'Mês');
  // Fix · (c2 b7 broken as c3 82 c2 b7)
  s = s.replace(/ÃÂ·/g, '·');
  s = s.replace(/Â·/g, '·');
  // Trophy emoji broken
  s = s.replace(/ð/g, '🏆');
  // Warning emoji broken
  s = s.replace(/â ï¸/g, '⚠️');
  // Fix Ranking title with broken emoji
  s = s.replace(/title="ð Ranking Consultores"/g, 'title="🏆 Ranking Consultores"');
  s = s.replace(/title="â ï¸ Gargalos Operacionais"/g, 'title="⚠️ Gargalos Operacionais"');
  // Fix equipe dash
  s = s.replace(/\{linha\.equipe \|\| '\\u00e2\\u0080\\u0094'\}/g, "{linha.equipe || '—'}");
  s = s.replace(/\{linha\.equipe \|\| 'â€"'\}/g, "{linha.equipe || '—'}");
  // Fix Ranking — text
  s = s.replace(/Ranking de Colaboradores â€" Mês/g, 'Ranking de Colaboradores — Mês');
  // Fix performance page header
  s = s.replace(/className="text-sm' style=\{ color: '#64748b' \} className='[\s\n]+Acumulado/g, 'className="text-sm" style={{ color: \'#64748b\' }}>\n            Acumulado');

  if (s !== original) {
    fs.writeFileSync(filePath, s, 'utf8');
    console.log('Fixed:', filePath);
  }
}

const files = [
  'frontend/src/app/(dashboard)/dashboard/page.tsx',
  'frontend/src/app/(dashboard)/dashboard/performance/page.tsx',
  'frontend/src/app/(dashboard)/dashboard/comercial/page.tsx',
  'frontend/src/app/(dashboard)/dashboard/backoffice/page.tsx',
  'frontend/src/app/(dashboard)/dashboard/ribeirao-preto/page.tsx',
  'frontend/src/app/(dashboard)/dashboard/umbler/page.tsx',
];

const base = __dirname;
files.forEach(f => {
  try { fix(require('path').join(base, f)); } catch(e) { console.log('skip', f, e.message); }
});
console.log('Done');
