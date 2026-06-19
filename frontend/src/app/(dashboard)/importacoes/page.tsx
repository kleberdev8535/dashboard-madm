'use client';
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle,
  Loader2, Clock, Eye, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  PENDENTE:     { bg: 'rgba(234,179,8,0.15)',   text: '#fde047',  icon: <Clock size={14} /> },
  PROCESSANDO:  { bg: 'rgba(59,130,246,0.15)',  text: '#93c5fd',  icon: <Loader2 size={14} className="animate-spin" /> },
  CONCLUIDO:    { bg: 'rgba(34,197,94,0.15)',   text: '#86efac',  icon: <CheckCircle2 size={14} /> },
  ERRO:         { bg: 'rgba(239,68,68,0.15)',   text: '#fca5a5',  icon: <XCircle size={14} /> },
};

function ImportCard({ imp }: { imp: any }) {
  const s = STATUS_COLORS[imp.status] || STATUS_COLORS.PENDENTE;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 flex items-center gap-4"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.2)' }}
      >
        <FileSpreadsheet size={20} className="text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">{imp.originalName}</p>
        <div className="flex items-center gap-4 mt-1">
          <span className="text-xs text-slate-500">{imp.user?.name}</span>
          <span className="text-xs text-slate-500">
            {format(new Date(imp.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}
          </span>
          {imp.totalLinhas > 0 && (
            <span className="text-xs text-slate-500">
              {imp.processadas}/{imp.totalLinhas} linhas
            </span>
          )}
          {imp.erros > 0 && (
            <span className="text-xs text-orange-400 flex items-center gap-1">
              <AlertTriangle size={11} /> {imp.erros} erros
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ background: s.bg, color: s.text }}
      >
        {s.icon}
        {imp.status}
      </div>
    </motion.div>
  );
}

export default function ImportacoesPage() {
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['imports'],
    queryFn: async () => {
      const { data } = await api.get('/imports?limit=50');
      return data;
    },
    refetchInterval: 5000,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/imports/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return data;
    },
    onSuccess: () => {
      toast.success('Arquivo enviado! Processamento iniciado.');
      queryClient.invalidateQueries({ queryKey: ['imports'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Erro ao enviar arquivo');
    },
  });

  const onDrop = useCallback(async (accepted: File[]) => {
    if (!accepted[0]) return;
    setUploading(true);
    try {
      await uploadMutation.mutateAsync(accepted[0]);
    } finally {
      setUploading(false);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/vnd.ms-excel': ['.xls', '.xlsx'], 'text/csv': ['.csv'] },
    maxFiles: 1,
    disabled: uploading,
  });

  const imports = data?.imports || [];

  return (
    <div className="space-y-6 pb-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Importações</h1>
            <p className="text-slate-400 text-sm mt-1">Importe dados exportados do Kommo (CSV ou XLSX)</p>
          </div>
          <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-white transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <RefreshCw size={15} /> Atualizar
          </button>
        </div>
      </motion.div>

      {/* Dropzone */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div
          {...getRootProps()}
          className="relative rounded-2xl p-10 text-center cursor-pointer transition-all duration-300"
          style={{
            background: isDragActive ? 'rgba(37,99,235,0.1)' : 'rgba(255,255,255,0.02)',
            border: `2px dashed ${isDragActive ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.1)'}`,
          }}
        >
          <input {...getInputProps()} />
          <AnimatePresence mode="wait">
            {uploading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Loader2 size={40} className="mx-auto mb-3 text-blue-400 animate-spin" />
                <p className="text-white font-semibold">Enviando arquivo...</p>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Upload size={40} className={`mx-auto mb-3 transition-colors ${isDragActive ? 'text-blue-400' : 'text-slate-500'}`} />
                <p className="text-white font-semibold mb-1">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste ou clique para selecionar'}
                </p>
                <p className="text-slate-500 text-sm">Aceita: CSV, XLS, XLSX • Máximo 50MB</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Guia de colunas */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <h3 className="text-white font-semibold text-sm mb-3">Colunas suportadas no arquivo</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {['Nome', 'Email', 'Telefone', 'CPF', 'Status', 'Etapa', 'Pipeline', 'Origem', 'Data Entrada', 'Título', 'Negócio'].map((col) => (
            <div key={col} className="text-xs px-3 py-1.5 rounded-lg font-mono"
              style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', color: '#93c5fd' }}
            >
              {col}
            </div>
          ))}
        </div>
      </div>

      {/* List */}
      <div>
        <h2 className="text-white font-semibold mb-3 text-sm">Histórico de Importações</h2>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        ) : imports.length > 0 ? (
          <div className="space-y-3">
            {imports.map((imp: any) => <ImportCard key={imp.id} imp={imp} />)}
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500">
            <Upload size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhuma importação realizada ainda</p>
          </div>
        )}
      </div>
    </div>
  );
}
