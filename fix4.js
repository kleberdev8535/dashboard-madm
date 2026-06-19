const fs = require('fs');
const path = require('path');
const base = 'c:\\Users\\kleber.ribeiro\\Documents\\Projetos MADM\\corporate-insights-platform';

// Fix performance page - broken className pattern
let perf = fs.readFileSync(path.join(base, 'frontend/src/app/(dashboard)/dashboard/performance/page.tsx'), 'utf8');
console.log('Performance - around "Acumulado":', JSON.stringify(perf.substring(perf.indexOf('Acumulado') - 80, perf.indexOf('Acumulado') + 30)));
console.log('Performance - around "Ranking":', JSON.stringify(perf.substring(perf.indexOf('Ranking de Colab'), perf.indexOf('Ranking de Colab') + 60)));
console.log('Performance - around "equipe ||":', JSON.stringify(perf.substring(perf.indexOf("equipe ||"), perf.indexOf("equipe ||") + 30)));
