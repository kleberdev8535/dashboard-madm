const fs = require('fs');
const path = require('path');

const replacements = [
  ['mÃªs', 'mês'], ['MÃªs', 'Mês'], ['Â·', '·'], ['â€"', '—'],
  ['DocumentaÃ§Ã£o', 'Documentação'], ['PendÃªncias', 'Pendências'],
  ['EmissÃ£o', 'Emissão'], ['ConversÃ£o', 'Conversão'],
  ['EvoluÃ§Ã£o', 'Evolução'], ['concluÃ­do', 'concluído'],
  ['ConcluÃ­do', 'Concluído'], ['estÃ¡', 'está'],
  ['VisÃ£o', 'Visão'], ['IndicadoresÂ ', 'Indicadores '],
  ['RibeirÃ£o', 'Ribeirão'], ['IndicadoresÂ', 'Indicadores'],
  ['operaÃ§Ã£o', 'operação'], ['Ã©', 'é'], ['Ã³', 'ó'], ['Ã§', 'ç'],
  ["text-sm' style={ color: '#64748b' } className=' ml-9", "text-sm ml-9\" style={{ color: '#64748b' }}"],
  ["text-sm' style={ color: '#64748b' } className='", "text-sm\" style={{ color: '#64748b' }}"],
  ['text-white font-semibold text-sm flex', 'font-semibold text-sm flex'],
  ['text-white font-semibold mb-4 text-sm', 'font-semibold mb-4 text-sm" style={{ color: "#0f172a" }} className="'],
  ['Â ', ' '], ['â€™', "'"],
];

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  for (const [from, to] of replacements) {
    if (content.includes(from)) { content = content.split(from).join(to); changed = true; }
  }
  if (changed) { fs.writeFileSync(filePath, content, 'utf8'); console.log('Fixed:', filePath); }
}

function walkDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walkDir(full);
    else if (item.endsWith('.tsx') || item.endsWith('.ts')) fixFile(full);
  }
}

walkDir(path.join(__dirname, 'frontend/src'));
console.log('Done');
