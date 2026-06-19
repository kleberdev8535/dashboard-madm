'use client';
import { motion } from 'framer-motion';
import { useDashboardRibeiraoPreto } from '@/hooks/useDashboard';
import StatCard from '@/components/ui/StatCard';
import FunnelChart from '@/components/charts/FunnelChart';
import EvolucaoChart from '@/components/charts/EvolucaoChart';
import RankingChart from '@/components/charts/RankingChart';
import { MapPin, UserCheck, PhoneCall, UserX, FolderOpen, FileCheck, PenLine } from 'lucide-react';
import DesempenhoIndividual from '@/components/dashboard/DesempenhoIndividual';

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <h3 className="font-semibold mb-4 text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {children}
    </div>
  );
}

export default function DashboardRibeiraoPage() {
  const { data } = useDashboardRibeiraoPreto();
  const cards = data?.cards || {};
  const funil = data?.funil || [];
  const evolucao = data?.evolucaoMensal || [];
  const ranking = data?.rankingConsultores || [];

  const cardsCfg = [
    { key: 'LEAD', title: 'Leads', icon: UserCheck, color: 'cyan' as const },
    { key: 'PRIMEIRO_CONTATO', title: 'Primeiro Contato', icon: PhoneCall, color: 'blue' as const },
    { key: 'EM_CONTATO', title: 'Em Contato', icon: PhoneCall, color: 'green' as const },
    { key: 'SEM_RETORNO', title: 'Sem Retorno', icon: UserX, color: 'red' as const },
    { key: 'COLETA_DOCUMENTACAO', title: 'Documentação', icon: FolderOpen, color: 'yellow' as const },
    { key: 'EMITIDO', title: 'Emitidos', icon: FileCheck, color: 'purple' as const },
    { key: 'ASSINADO', title: 'Assinados', icon: PenLine, color: 'green' as const },
  ];

  return (
    <div className="space-y-6 pb-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <MapPin size={24} className="text-emerald-400" />
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Dashboard Ribeirão Preto</h1>
        </div>
        <p className="text-sm ml-9" style={{ color: 'var(--text-secondary)' }}>Indicadores exclusivos da unidade Ribeirão Preto</p>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {cardsCfg.map((cfg, i) => (
          <StatCard key={cfg.key} title={cfg.title} value={cards[cfg.key] ?? 0} icon={cfg.icon} color={cfg.color} index={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Funil Ribeirão Preto">
          <FunnelChart data={funil} />
        </ChartCard>
        <ChartCard title="Evolução Mensal">
          <EvolucaoChart data={evolucao} />
        </ChartCard>
      </div>

      <ChartCard title="ðŸ† Ranking Consultores â€” Ribeirão Preto">
        <RankingChart data={ranking} />
      </ChartCard>

      <DesempenhoIndividual />
    </div>
  );
}


