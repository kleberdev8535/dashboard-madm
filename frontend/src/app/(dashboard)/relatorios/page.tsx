'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { FileText, Download, Printer, Filter, Search, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos os status' },
  { value: 'LEAD', label: 'Lead' },
  { value: 'PRIMEIRO_CONTATO', label: 'Primeiro Contato' },
  { value: 'EM_CONTATO', label: 'Em Contato' },
  { value: 'SEM_RETORNO', label: 'Sem Retorno' },
  { value: 'COLETA_DOCUMENTACAO', label: 'Coleta Documentação' },
  { value: 'PENDENCIAS', label: 'Pendências' },
  { value: 'AGUARDANDO_EMISSAO', label: 'Ag. Emissão' },
  { value: 'EMITIDO', label: 'Emitido' },
  { value: 'ASSINADO', label: 'Assinado' },
  { value: 'AUDITORIA', label: 'Auditoria' },
  { value: 'FINALIZADO', label: 'Finalizado' },
];

function FilterInput({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
      <input
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-blue-500/50 transition-all"
      />
    </div>
  );
}

function FilterSelect({ label, children, ...props }: { label: string } & React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5 font-medium">{label}</label>
      <select
        {...props}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50 transition-all"
        style={{ background: '#0d1526' }}
      >
        {children}
      </select>
    </div>
  );
}

export default function RelatoriosPage() {
  const [filters, setFilters] = useState({
    dataInicio: '', dataFim: '', status: '', search: '',
    page: 1, limit: 50,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['relatorios', filters],
    queryFn: async () => {
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      const { data } = await api.get('/relatorios', { params });
      return data;
    },
    enabled: false,
  });

  const negocios = data?.negocios || [];

  const exportExcel = () => {
    if (!negocios.length) { toast.error('Sem dados para exportar'); return; }
    const rows = negocios.map((n: any) => ({
      'Cliente': n.cliente?.nome,
      'Status': n.status?.replace(/_/g, ' '),
      'Consultor': n.consultor?.name || '—',
      'Unidade': n.unidade?.nome || '—',
      'Equipe': n.equipe?.nome || '—',
      'Data Entrada': n.dataEntrada ? new Date(n.dataEntrada).toLocaleDateString('pt-BR') : '—',
      'Pipeline': n.pipeline || '—',
      'Origem': n.origem || '—',
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success('Excel exportado!');
  };

  const exportPDF = () => {
    if (!negocios.length) { toast.error('Sem dados para exportar'); return; }
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Corporate Insights Platform — Relatório', 14, 20);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 28);

    autoTable(doc, {
      startY: 35,
      head: [['Cliente', 'Status', 'Consultor', 'Unidade', 'Data Entrada']],
      body: negocios.map((n: any) => [
        n.cliente?.nome || '—',
        n.status?.replace(/_/g, ' ') || '—',
        n.consultor?.name || '—',
        n.unidade?.nome || '—',
        n.dataEntrada ? new Date(n.dataEntrada).toLocaleDateString('pt-BR') : '—',
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [37, 99, 235] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
    });

    doc.save(`relatorio_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF exportado!');
  };

  return (
    <div className="space-y-6 pb-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Relatórios</h1>
            <p className="text-slate-400 text-sm mt-1">Filtre, analise e exporte os dados</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-green-400 hover:text-green-300 transition-colors"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <Download size={15} /> Excel
            </button>
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
              style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}
            >
              <FileText size={15} /> PDF
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Printer size={15} /> Imprimir
            </button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-blue-400" />
          <span className="text-white font-semibold text-sm">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <FilterInput
            label="Data Inicial" type="date"
            value={filters.dataInicio}
            onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
          />
          <FilterInput
            label="Data Final" type="date"
            value={filters.dataFim}
            onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
          />
          <FilterSelect
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </FilterSelect>
          <div className="col-span-2">
            <FilterInput
              label="Buscar cliente" placeholder="Nome do cliente..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 4px 15px rgba(37,99,235,0.3)' }}
          >
            <Search size={15} /> Buscar
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">
            Resultados {data?.total ? `(${data.total.toLocaleString('pt-BR')})` : ''}
          </span>
          {isLoading && <RefreshCw size={14} className="text-blue-400 animate-spin" />}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {['Cliente', 'Status', 'Consultor', 'Unidade', 'Equipe', 'Data Entrada', 'Pipeline'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-slate-500 font-semibold uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {negocios.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p>Use os filtros acima e clique em Buscar</p>
                  </td>
                </tr>
              ) : (
                negocios.map((n: any, i: number) => (
                  <motion.tr
                    key={n.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-5 py-3 text-white font-medium">{n.cliente?.nome || '—'}</td>
                    <td className="px-5 py-3">
                      <span className="text-xs px-2 py-1 rounded-full"
                        style={{ background: 'rgba(59,130,246,0.15)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.2)' }}
                      >
                        {n.status?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-300">{n.consultor?.name || '—'}</td>
                    <td className="px-5 py-3 text-slate-300">{n.unidade?.nome || '—'}</td>
                    <td className="px-5 py-3 text-slate-300">{n.equipe?.nome || '—'}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs">
                      {n.dataEntrada ? new Date(n.dataEntrada).toLocaleDateString('pt-BR') : '—'}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{n.pipeline || '—'}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
