/**
 * CORPORATE INSIGHTS PLATFORM — Google Apps Script
 * Cole este código no Apps Script da planilha:
 *   Extensões → Apps Script → Cole aqui → Salvar → Implantar → Novo Implante
 *   Tipo: App da Web | Executar como: Eu | Acesso: Qualquer pessoa
 *
 * Parâmetros disponíveis:
 *   ?action=tabs              → lista todas as abas de datas disponíveis
 *   ?action=data&tab=01-06-26 → dados de uma aba específica
 *   ?action=all               → dados de todas as abas (uso interno/importação)
 *   ?action=summary           → resumo por status de cada aba
 *   ?secret=SEU_TOKEN         → proteção básica (configure TOKEN abaixo)
 */

// ─── CONFIGURAÇÃO ────────────────────────────────────────────────────────────
const TOKEN = 'madm2024'; // Troque por uma senha forte
const ABA_IGNORAR = ['Mês - Performance', 'Resumo', 'Config', 'Dashboard'];

// Mapeamento dos nomes de coluna da planilha → campos do dashboard
// Ajuste os nomes das colunas conforme o cabeçalho real da sua planilha
const MAPA_COLUNAS = {
  // Coluna na planilha    → campo no JSON
  'Nome':                   'consultorNome',
  'Consultor':              'consultorNome',
  'Assessor':               'consultorNome',
  'Status':                 'status',
  'Etapa':                  'status',
  'Cliente':                'clienteNome',
  'Nome do Cliente':        'clienteNome',
  'CPF':                    'cpf',
  'Telefone':               'telefone',
  'Produto':                'produto',
  'Observação':             'observacao',
  'Obs':                    'observacao',
  'Data':                   'dataCriacao',
  'Data Cadastro':          'dataCriacao',
  'Unidade':                'unidade',
  'Equipe':                 'equipe',
};

// Mapeamento de status da planilha → status do sistema
const MAPA_STATUS = {
  'lead':                   'LEAD',
  'leads':                  'LEAD',
  'primeiro contato':       'PRIMEIRO_CONTATO',
  'em contato':             'EM_CONTATO',
  'sem retorno':            'SEM_RETORNO',
  'coleta de documentos':   'COLETA_DOCUMENTACAO',
  'coleta documentação':    'COLETA_DOCUMENTACAO',
  'documentação':           'COLETA_DOCUMENTACAO',
  'pendências':             'PENDENCIAS',
  'pendencias':             'PENDENCIAS',
  'aguardando emissão':     'AGUARDANDO_EMISSAO',
  'aguardando':             'AGUARDANDO_EMISSAO',
  'emitido':                'EMITIDO',
  'assinado':               'ASSINADO',
  'auditoria':              'AUDITORIA',
  'finalizado':             'FINALIZADO',
  'concluído':              'FINALIZADO',
  'cancelado':              'CANCELADO',
  'pro':                    'PRO',
  'prontuário':             'PRO',
  'sanada':                 'SANADA',
  'reset':                  'RESET',
};

// ─── ENDPOINT PRINCIPAL ───────────────────────────────────────────────────────
function doGet(e) {
  const params = e.parameter || {};

  // Verificação de token
  if (params.secret !== TOKEN) {
    return jsonResponse({ erro: 'Não autorizado', code: 401 }, 401);
  }

  const action = params.action || 'tabs';

  try {
    switch (action) {
      case 'tabs':    return jsonResponse(getTabs());
      case 'data':    return jsonResponse(getDadosAba(params.tab));
      case 'all':     return jsonResponse(getTodosDados());
      case 'summary': return jsonResponse(getSummary());
      default:        return jsonResponse({ erro: 'Ação inválida. Use: tabs, data, all, summary' });
    }
  } catch (err) {
    return jsonResponse({ erro: err.message });
  }
}

// ─── LISTA DE ABAS DISPONÍVEIS ────────────────────────────────────────────────
function getTabs() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const abas = ss.getSheets()
    .map(s => s.getName())
    .filter(nome => !ABA_IGNORAR.includes(nome) && isDataValida(nome));

  return {
    tabs: abas,
    total: abas.length,
    planilha: ss.getName(),
  };
}

// ─── DADOS DE UMA ABA ESPECÍFICA ──────────────────────────────────────────────
function getDadosAba(nomeAba) {
  if (!nomeAba) throw new Error('Parâmetro "tab" obrigatório. Ex: ?action=data&tab=01-06-26');

  const ss   = SpreadsheetApp.getActiveSpreadsheet();
  const aba  = ss.getSheetByName(nomeAba);
  if (!aba) throw new Error(`Aba "${nomeAba}" não encontrada`);

  const dados = lerAba(aba, nomeAba);
  return { tab: nomeAba, total: dados.length, registros: dados };
}

// ─── TODOS OS DADOS (todas as abas) ───────────────────────────────────────────
function getTodosDados() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const abas  = ss.getSheets().filter(s => !ABA_IGNORAR.includes(s.getName()) && isDataValida(s.getName()));
  const todos = [];

  abas.forEach(aba => {
    const registros = lerAba(aba, aba.getName());
    todos.push(...registros);
  });

  return { total: todos.length, registros: todos };
}

// ─── RESUMO POR STATUS DE CADA DIA ────────────────────────────────────────────
function getSummary() {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const abas  = ss.getSheets().filter(s => !ABA_IGNORAR.includes(s.getName()) && isDataValida(s.getName()));
  const resumo = [];

  abas.forEach(aba => {
    const registros = lerAba(aba, aba.getName());
    const contagem  = {};

    registros.forEach(r => {
      const st = r.status || 'SEM_STATUS';
      contagem[st] = (contagem[st] || 0) + 1;
    });

    resumo.push({
      data:      aba.getName(),
      total:     registros.length,
      contagem,
    });
  });

  return { dias: resumo.length, resumo };
}

// ─── LER UMA ABA E CONVERTER PARA JSON ────────────────────────────────────────
function lerAba(aba, nomeAba) {
  const valores = aba.getDataRange().getValues();
  if (valores.length < 2) return [];

  const cabecalhos = valores[0].map(c => String(c).trim());
  const registros  = [];

  for (let i = 1; i < valores.length; i++) {
    const linha  = valores[i];
    const vazio  = linha.every(c => c === '' || c === null || c === undefined);
    if (vazio) continue;

    const obj = { _dia: nomeAba };

    cabecalhos.forEach((cab, idx) => {
      if (!cab) return;
      const campoMapeado = MAPA_COLUNAS[cab] || camelCase(cab);
      let valor = linha[idx];

      // Converter datas do Sheets para string ISO
      if (valor instanceof Date) {
        valor = Utilities.formatDate(valor, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }

      // Normalizar status
      if (campoMapeado === 'status' && valor) {
        const statusNorm = String(valor).trim().toLowerCase();
        valor = MAPA_STATUS[statusNorm] || String(valor).trim().toUpperCase().replace(/ /g, '_');
      }

      obj[campoMapeado] = valor !== '' ? valor : null;
    });

    registros.push(obj);
  }

  return registros;
}

// ─── UTILITÁRIOS ──────────────────────────────────────────────────────────────
function isDataValida(nome) {
  // Aceita formatos: 01-06-26, 01/06/26, 01-06-2026, 2026-06-01
  return /\d{2}[-\/]\d{2}[-\/]\d{2,4}/.test(nome);
}

function camelCase(str) {
  return str
    .replace(/[^a-zA-ZÀ-ú0-9 ]/g, '')
    .split(' ')
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

function jsonResponse(data, code) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
