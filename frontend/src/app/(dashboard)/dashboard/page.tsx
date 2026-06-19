'use client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import DashCard from '@/components/ui/DashCard';
import {
  Users, Phone, CheckCircle2, AlertCircle, Clock, Search,
  XCircle, UserX, RotateCcw, Zap, TrendingUp, Percent,
  RefreshCw, Send, Award, FileCheck, MapPin,
  AlertTriangle, Lightbulb, ChevronDown, ChevronUp,
} from 'lucide-react';

interface BackofficeRow {
  Assessor: string; CPF: string; Data: string; Status: string;
  Observação: string; Supervisor: string; Backoffice: string;
  Demanda: string; Advogado: string; 'Estado do cliente': string;
}

function norm(s: string) {
  return String(s || '').normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase().trim();
}
function cnt(rows: BackofficeRow[], ...terms: string[]) {
  return rows.filter(r => terms.some(t => norm(r.Status) === norm(t))).length;
}

// ── Donut SVG ─────────────────────────────────────────────────────────────
function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  if (!total) return <div className="h-40 flex items-center justify-center text-slate-400 text-sm">Sem dados</div>;
  const r = 60, cx = 80, cy = 80, stroke = 28;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={160} height={160} viewBox="0 0 160 160">
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dash = pct * circ;
          const gap  = circ - dash;
          const el = (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-(offset * circ)}
              style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }} />
          );
          offset += pct;
          return el;
        })}
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize={20} fontWeight="800" fill="var(--text-primary)">{total.toLocaleString('pt-BR')}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10} fill="var(--text-muted)">registros</text>
      </svg>
      <div className="flex flex-col gap-1.5 flex-1 min-w-0">
        {segments.map(seg => (
          <div key={seg.label} className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: seg.color }} />
              <span className="truncate" style={{ color: 'var(--text-secondary)' }}>{seg.label}</span>
            </div>
            <span className="font-semibold flex-shrink-0" style={{ color: 'var(--text-primary)' }}>
              {seg.value} <span style={{ color: 'var(--text-muted)' }}>({total > 0 ? Math.round(seg.value/total*100) : 0}%)</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Área / linha por data ──────────────────────────────────────────────────
function AreaChart({ points }: { points: { date: string; total: number; finalizados: number }[] }) {
  if (!points.length) return <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Sem dados</div>;
  const W = 600, H = 180, pad = { t: 10, b: 32, l: 36, r: 10 };
  const iW = W - pad.l - pad.r, iH = H - pad.t - pad.b;
  const maxV = Math.max(...points.map(p => p.total), 1);
  const xStep = iW / Math.max(points.length - 1, 1);
  const yScale = (v: number) => iH - (v / maxV) * iH;
  const px = (i: number) => pad.l + i * xStep;
  const py = (v: number) => pad.t + yScale(v);
  const totalPath   = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(p.total)}`).join(' ');
  const finalPath   = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(p.finalizados)}`).join(' ');
  const totalArea   = `${totalPath} L ${px(points.length-1)} ${pad.t+iH} L ${pad.l} ${pad.t+iH} Z`;
  const finalArea   = `${finalPath} L ${px(points.length-1)} ${pad.t+iH} L ${pad.l} ${pad.t+iH} Z`;
  // y labels
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * maxV));
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#f97316" stopOpacity="0.05"/>
        </linearGradient>
        <linearGradient id="gFinal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {/* grid */}
      {ticks.map(t => (
        <g key={t}>
          <line x1={pad.l} x2={W-pad.r} y1={py(t)} y2={py(t)} stroke="var(--card-border)" strokeWidth="1" />
          <text x={pad.l - 4} y={py(t) + 4} textAnchor="end" fontSize={9} fill="var(--text-muted)">{t}</text>
        </g>
      ))}
      {/* áreas */}
      <path d={totalArea} fill="url(#gTotal)" />
      <path d={finalArea} fill="url(#gFinal)" />
      {/* linhas */}
      <path d={totalPath} fill="none" stroke="#f97316" strokeWidth="2" strokeLinejoin="round" />
      <path d={finalPath} fill="none" stroke="#22c55e" strokeWidth="2" strokeLinejoin="round" />
      {/* eixo x — mostrar só alguns labels */}
      {points.map((p, i) => {
        if (points.length > 15 && i % 3 !== 0) return null;
        return <text key={i} x={px(i)} y={H - 4} textAnchor="middle" fontSize={8} fill="var(--text-muted)">{p.date}</text>;
      })}
    </svg>
  );
}

// ── Barra horizontal ──────────────────────────────────────────────────────
function HBar({ label, value, max, pct, color, rank }: { label: string; value: number; max: number; pct: number; color: string; rank?: number }) {
  const w = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      {rank !== undefined && <span className="text-xs w-4 text-right flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{rank}</span>}
      <span className="text-xs font-semibold w-24 flex-shrink-0" style={{ color: 'var(--text-primary)' }}>{label}</span>
      <div className="flex-1 h-5 rounded-full overflow-hidden relative" style={{ background: 'var(--input-bg)' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full flex items-center justify-end pr-2"
          style={{ background: color, minWidth: value > 0 ? 32 : 0 }}>
          <span className="text-white text-xs font-bold">{value}</span>
        </motion.div>
      </div>
      <span className="text-xs w-10 text-right flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
    </div>
  );
}

// ── Ranking supervisor ─────────────────────────────────────────────────────
function SupervisorRanking({ rows }: { rows: BackofficeRow[] }) {
  const map: Record<string, { total: number; fin: number; pend: number; desq: number }> = {};
  rows.forEach(r => {
    const sv = (r.Supervisor || '').trim() || 'Sem supervisor';
    if (!map[sv]) map[sv] = { total: 0, fin: 0, pend: 0, desq: 0 };
    map[sv].total++;
    if (norm(r.Status) === 'finalizado') map[sv].fin++;
    else if (norm(r.Status) === 'pendente') map[sv].pend++;
    else if (norm(r.Status) === 'desqualificado') map[sv].desq++;
  });
  const list = Object.entries(map)
    .map(([name, s]) => ({ name, ...s, taxa: s.total > 0 ? (s.fin / s.total) * 100 : 0 }))
    .sort((a, b) => b.taxa - a.taxa);
  const top = list[0];
  return (
    <div className="space-y-4">
      {top && (
        <div className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black text-white"
              style={{ background: 'var(--accent)' }}>
              {top.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{top.name}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{top.total} registros · {top.fin} finalizados</p>
            </div>
          </div>
          <span className="text-lg font-black" style={{ color: 'var(--accent-bright)' }}>{top.taxa.toFixed(1)}%</span>
        </div>
      )}
      <div className="space-y-4">
        {list.map((sv, i) => {
          const color = sv.taxa >= 40 ? '#22c55e' : sv.taxa >= 20 ? '#fbbf24' : '#f97316';
          return (
            <div key={sv.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: 'var(--input-bg)', color: 'var(--text-secondary)' }}>{i + 1}</span>
                  <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{sv.name}</span>
                </div>
                <span className="text-sm font-bold" style={{ color }}>{sv.taxa.toFixed(1)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-1" style={{ background: 'var(--input-bg)' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${sv.taxa}%` }} transition={{ duration: 0.8 }}
                  className="h-full rounded-full" style={{ background: color }} />
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {sv.total} total · ✓ {sv.fin} · ⏳ {sv.pend} · ✗ {sv.desq}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Ranking de Assessores ─────────────────────────────────────────────────
interface RankItem { name: string; processos: number; taxa: number; }

function RankingAssessores({ title, subtitle, items }: { title: string; subtitle: string; items: RankItem[] }) {
  const medalColors = ['#f59e0b', '#94a3b8', '#cd7c2f'];

  function Avatar({ nome }: { nome: string }) {
    const initials = nome.trim().split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
    const palette = ['#6366f1','#8b5cf6','#ec4899','#f97316','#22c55e','#06b6d4','#3b82f6','#eab308','#ef4444','#14b8a6'];
    return (
      <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
        style={{ background: palette[nome.charCodeAt(0) % palette.length] }}>
        {initials}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 flex flex-col gap-4" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: 'var(--accent-bright)' }} />
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>
          </div>
        </div>
        <span className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ background: 'var(--badge-bg)', border: '1px solid var(--card-border)', color: 'var(--text-muted)' }}>
          {items.length} no total
        </span>
      </div>

      {/* lista com scroll */}
      <div className="overflow-y-auto pr-1 space-y-2" style={{ maxHeight: 360 }}>
        {items.map((item, i) => {
          const isTop3 = i < 3;
          const taxaColor = item.taxa >= 30 ? '#16a34a' : item.taxa >= 10 ? '#f97316' : '#ef4444';
          const arrow = item.taxa >= 10 ? '↑' : '↓';
          return (
            <motion.div key={item.name}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors"
              style={{ background: i === 0 ? 'var(--accent-soft)' : 'transparent', border: i === 0 ? '1px solid var(--accent-border)' : '1px solid transparent' }}>

              {/* posição */}
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                style={{ background: isTop3 ? medalColors[i] : 'var(--input-bg)', color: isTop3 ? '#fff' : 'var(--text-secondary)' }}>
                {i + 1}
              </div>

              {/* avatar */}
              <Avatar nome={item.name} />

              {/* nome + processos */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.name}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.processos} processos</p>
              </div>

              {/* taxa */}
              <span className="text-sm font-black flex-shrink-0" style={{ color: taxaColor }}>
                {arrow} {item.taxa.toFixed(1)}%
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ── Gargalos e soluções ────────────────────────────────────────────────────
interface Gargalo {
  titulo: string;
  referencia: string;
  descricao: string;
  severidade: 'critico' | 'atencao' | 'ok';
  valor: string;
  solucoes: string[];
}

function analisarGargalos(params: {
  taxaBack: number; taxaCom: number; pendente: number; acionados: number;
  naoResponde: number; finalizados: number; auditoria: number;
  desqualif: number; vendaPerdida: number; desistiu: number;
  pendAudit: number; pendResp: number; recebidos: number; assinados: number;
  emitidos: number; vendaGanha: number;
}): Gargalo[] {
  const {
    taxaBack, taxaCom, pendente, acionados, naoResponde, finalizados,
    auditoria, desqualif, vendaPerdida, desistiu, pendAudit, pendResp,
    recebidos, assinados, emitidos, vendaGanha,
  } = params;
  const gargalos: Gargalo[] = [];

  // ── 1. Taxa de finalização backoffice ──
  if (taxaBack < 15) {
    gargalos.push({
      titulo: 'Taxa de finalização crítica no Backoffice',
      referencia: `📌 Referência: cards "Total Acionados" (${acionados}) e "Finalizados" (${finalizados})`,
      descricao: `Com base nos cards Total Acionados (${acionados}) e Finalizados (${finalizados}), a taxa geral está em ${taxaBack.toFixed(1)}% — muito abaixo do mínimo esperado. De cada 10 processos que entram, menos de 2 são concluídos. O funil está represado em alguma etapa entre a entrada e a conclusão.`,
      severidade: 'critico',
      valor: `${taxaBack.toFixed(1)}%`,
      solucoes: [
        `Faça triagem imediata dos ${acionados - finalizados} processos em aberto e classifique por tempo de entrada`,
        'Mapeie onde estão travados: auditoria, cliente, advogado — e ataque o maior volume primeiro',
        'Defina meta diária de finalização por analista e acompanhe no início da manhã',
        'Crie um mutirão semanal exclusivo para fechamento de processos parados há mais de 7 dias',
        'Revise o SLA interno — identifique qual etapa tem maior tempo médio e reduza pela metade',
      ],
    });
  } else if (taxaBack < 35) {
    gargalos.push({
      titulo: 'Taxa de finalização abaixo do potencial',
      referencia: `📌 Referência: cards "Total Acionados" (${acionados}) e "Finalizados" (${finalizados})`,
      descricao: `Os cards Total Acionados (${acionados}) e Finalizados (${finalizados}) mostram taxa de ${taxaBack.toFixed(1)}%. Há ${acionados - finalizados} processos ainda em andamento — um potencial de melhoria real que pode ser desbloqueado com foco operacional.`,
      severidade: 'atencao',
      valor: `${taxaBack.toFixed(1)}%`,
      solucoes: [
        'Identifique os 3 analistas com menor taxa de finalização e ofereça acompanhamento direto',
        'Verifique se há etapa específica concentrando volume: auditoria, pendência de cliente ou advogado',
        'Estabeleça meta semanal por equipe com revisão toda sexta-feira',
        `Priorize os ${pendente > 0 ? pendente : 'processos'} pendentes mais antigos para destravar o fluxo`,
      ],
    });
  }

  // ── 2. Funil comercial — emitidos vs recebidos ──
  const pctEmit = recebidos > 0 ? (emitidos / recebidos) * 100 : 0;
  if (pctEmit < 50 && recebidos > 20) {
    gargalos.push({
      titulo: 'Menos da metade dos leads recebem proposta',
      referencia: `📌 Referência: cards "Recebidos" (${recebidos}) e "Emitidos" (${emitidos})`,
      descricao: `Com ${recebidos} Recebidos e apenas ${emitidos} Emitidos, apenas ${pctEmit.toFixed(0)}% dos leads chegam à fase de proposta. Isso significa que ${recebidos - emitidos} clientes foram perdidos antes mesmo de ver uma oferta — o maior desperdício acontece no topo do funil.`,
      severidade: pctEmit < 30 ? 'critico' : 'atencao',
      valor: `${pctEmit.toFixed(1)}%`,
      solucoes: [
        `Analise o motivo dos ${recebidos - emitidos} leads que não avançaram para proposta — é qualificação ou processo?`,
        'Reduza o tempo entre recebimento do lead e emissão da proposta — meta: menos de 24h',
        'Verifique se há leads parados por falta de documentação ou contato sem retorno',
        'Crie checklist de pré-qualificação para agilizar a decisão de emitir ou não',
      ],
    });
  }

  // ── 3. Conversão final comercial (recebidos → assinados) ──
  if (taxaCom < 12 && recebidos > 0) {
    gargalos.push({
      titulo: 'Conversão comercial final muito baixa',
      referencia: `📌 Referência: cards "Recebidos" (${recebidos}), "Assinados Safra" (${assinados}) e "Conv. Comercial" (${taxaCom.toFixed(1)}%)`,
      descricao: `O card Conv. Comercial mostra ${taxaCom.toFixed(1)}% — ou seja, de ${recebidos} leads recebidos, apenas ${assinados} chegaram à assinatura. ${emitidos > 0 ? `Foram emitidas ${emitidos} propostas e apenas ${assinados} converteram (${emitidos > 0 ? ((assinados/emitidos)*100).toFixed(0) : 0}% de aproveitamento das propostas emitidas).` : ''} Há uma perda grande entre a proposta e o fechamento.`,
      severidade: taxaCom < 5 ? 'critico' : 'atencao',
      valor: `${taxaCom.toFixed(1)}%`,
      solucoes: [
        'Implemente follow-up estruturado: contato em 24h, 48h e 72h após envio da proposta',
        'Identifique assessores com maior taxa de conversão e mapeie a abordagem deles',
        'Teste variações na apresentação da proposta — formato, timing e argumentação',
        `Com ${vendaGanha} Venda Ganha e ${assinados} assinados, verifique se há gap entre assinatura e venda efetivada`,
        'Crie script de objeções para os principais motivos de recusa identificados pelo time',
      ],
    });
  }

  // ── 4. Fila de pendentes alta ──
  const pctPend = acionados > 0 ? (pendente / acionados) * 100 : 0;
  if (pctPend > 20) {
    gargalos.push({
      titulo: 'Fila de pendentes represada',
      referencia: `📌 Referência: cards "Total Acionados" (${acionados}) e "Pendentes" (${pendente})`,
      descricao: `O card Pendentes mostra ${pendente} processos — que representam ${pctPend.toFixed(0)}% de toda a base (${acionados} acionados). Uma fila nesse tamanho indica que há mais processos entrando do que sendo resolvidos. Risco real de prazo vencido e insatisfação de cliente.`,
      severidade: pctPend > 40 ? 'critico' : 'atencao',
      valor: `${pendente} processos`,
      solucoes: [
        `Divida os ${pendente} pendentes por supervisor e defina meta de redução de 30% até amanhã`,
        'Classifique os pendentes por tempo de espera: >7 dias têm prioridade máxima',
        'Automatize lembretes para clientes com ação pendente — WhatsApp ou e-mail a cada 48h',
        'Defina um limite máximo aceitável de pendentes por analista (ex: no máximo 15)',
        'Crie alerta automático quando um processo ficar pendente por mais de 3 dias',
      ],
    });
  }

  // ── 5. Alto "Não Responde" ──
  const pctNR = acionados > 0 ? (naoResponde / acionados) * 100 : 0;
  if (pctNR > 15) {
    gargalos.push({
      titulo: 'Alto volume de clientes sem retorno',
      referencia: `📌 Referência: cards "Total Acionados" (${acionados}) e "Não Responde" (${naoResponde})`,
      descricao: `O card Não Responde aponta ${naoResponde} clientes sem retorno — ${pctNR.toFixed(0)}% da base total. Comparando com Finalizados (${finalizados}), há quase ${naoResponde > finalizados ? 'mais clientes sem resposta do que finalizados' : `${((naoResponde/finalizados)*100).toFixed(0)}% do volume de finalizados parado nessa categoria`}. Cada cliente sem resposta é uma oportunidade que pode estar sendo desperdiçada por falha na cadência.`,
      severidade: pctNR > 30 ? 'critico' : 'atencao',
      valor: `${naoResponde} clientes`,
      solucoes: [
        'Crie cadência de recontato: tentativa 1 (ligação), tentativa 2 (WhatsApp), tentativa 3 (e-mail) com 48h de intervalo',
        'Tente horários alternativos: início da manhã (7h-9h) ou final da tarde (17h-19h)',
        `Após 3 tentativas sem resposta nos ${naoResponde} casos, acione o supervisor para decisão de desqualificar ou aguardar`,
        'Analise se há um perfil específico de lead que costuma não responder e revise a qualificação na entrada',
      ],
    });
  }

  // ── 6. Auditoria acumulada travando o fluxo ──
  const pctAudit = acionados > 0 ? (auditoria / acionados) * 100 : 0;
  if (pctAudit > 12) {
    gargalos.push({
      titulo: 'Backlog de auditoria bloqueando finalizações',
      referencia: `📌 Referência: cards "Auditoria" (${auditoria}) e "Finalizados" (${finalizados})`,
      descricao: `O card Auditoria mostra ${auditoria} processos aguardando revisão — ${pctAudit.toFixed(0)}% da base. Comparando com Finalizados (${finalizados}), o backlog de auditoria já representa ${finalizados > 0 ? ((auditoria/finalizados)*100).toFixed(0) : '—'}% do que foi concluído. Isso significa que a equipe de auditoria é hoje o principal gargalo antes da finalização.`,
      severidade: pctAudit > 25 ? 'critico' : 'atencao',
      valor: `${auditoria} processos`,
      solucoes: [
        `Com ${auditoria} processos em auditoria, defina meta diária: quantos cada auditor precisa aprovar por dia`,
        'Priorize os processos mais antigos na fila — use data de entrada como critério',
        'Revise o checklist de auditoria: elimine etapas redundantes que não agregam segurança real',
        'Avalie se é possível dividir a auditoria em etapas — aprovar o que está completo sem esperar itens secundários',
        'Considere treinar um analista adicional para suporte temporário à auditoria',
      ],
    });
  }

  // ── 7. Desistências concentradas ──
  const pctDesistiu = acionados > 0 ? (desistiu / acionados) * 100 : 0;
  if (pctDesistiu > 8) {
    gargalos.push({
      titulo: 'Taxa de desistência preocupante',
      referencia: `📌 Referência: cards "Total Acionados" (${acionados}) e "Desistiu" (${desistiu})`,
      descricao: `O card Desistiu registra ${desistiu} clientes — ${pctDesistiu.toFixed(1)}% da base. Quando cruzado com o card Venda Perdida (${vendaPerdida}), o total de oportunidades perdidas chega a ${desistiu + vendaPerdida} processos. Isso sugere que há um problema no meio do funil: clientes que avançaram mas não chegaram ao fim.`,
      severidade: pctDesistiu > 15 ? 'critico' : 'atencao',
      valor: `${pctDesistiu.toFixed(1)}%`,
      solucoes: [
        `Faça contato de recuperação com os ${desistiu} desistentes: entenda o motivo real da saída`,
        'Identifique em qual etapa do processo a maioria desistiu — início, meio ou próximo ao fim',
        'Se a causa for demora, reduza o SLA da etapa crítica e comunique o prazo ao cliente na entrada',
        'Crie protocolo de "cliente em risco" acionado quando um processo fica sem movimentação por 5 dias',
        `Cruze os desistentes com o Ranking de Assessores — verificar se há concentração em algum profissional`,
      ],
    });
  }

  // ── 8. Processos travados em espera (pendAudit + pendResp) ──
  if ((pendAudit + pendResp) > finalizados * 0.6 && acionados > 30) {
    gargalos.push({
      titulo: 'Processos travados aguardando terceiros',
      referencia: `📌 Referência: cards "Pend. Auditoria" (${pendAudit}), "Aguard. Cliente" (${pendResp}) e "Finalizados" (${finalizados})`,
      descricao: `Os cards Pend. Auditoria (${pendAudit}) e Aguard. Cliente (${pendResp}) somam ${pendAudit + pendResp} processos parados esperando ação externa. Esse total equivale a ${finalizados > 0 ? ((( pendAudit + pendResp)/finalizados)*100).toFixed(0) : '—'}% dos finalizados — ou seja, há quase o mesmo volume de processos parados do que de finalizados.`,
      severidade: 'atencao',
      valor: `${pendAudit + pendResp} processos`,
      solucoes: [
        `Para os ${pendResp} "Aguardando Cliente": crie régua de cobrança com até 3 tentativas antes de encerrar`,
        `Para os ${pendAudit} "Pend. Auditoria": priorize os mais antigos e defina prazo máximo de resposta da auditoria`,
        'Implemente alerta diário para processos em espera há mais de 48h sem movimentação',
        'Revise quais documentos realmente travam a auditoria e se podem ser coletados de outra forma',
      ],
    });
  }

  // ── Tudo OK ──
  if (gargalos.length === 0) {
    gargalos.push({
      titulo: 'Operação dentro dos parâmetros ideais',
      referencia: `📌 Análise: todos os indicadores revisados com base nos ${acionados} registros ativos`,
      descricao: `Com base nos principais cards — Total Acionados (${acionados}), Finalizados (${finalizados}), Taxa Geral (${taxaBack.toFixed(1)}%), Recebidos (${recebidos}) e Conv. Comercial (${taxaCom.toFixed(1)}%) — não foram identificados gargalos críticos hoje. Ótimo momento para consolidar processos e elevar as metas.`,
      severidade: 'ok',
      valor: '✓',
      solucoes: [
        'Documente as práticas do dia e compartilhe com o time — o que está funcionando bem?',
        'Estabeleça metas mais ambiciosas para a próxima semana com base nos números de hoje',
        'Use este momento para revisar e treinar as etapas que historicamente concentram problemas',
        'Verifique se há processos antigos pendentes que podem ser finalizados enquanto o fluxo está saudável',
      ],
    });
  }

  return gargalos.sort((a, b) => {
    const ord = { critico: 0, atencao: 1, ok: 2 };
    return ord[a.severidade] - ord[b.severidade];
  });
}

const severidadeConfig = {
  critico: { label: 'Crítico', bg: 'rgba(220,38,38,0.06)', border: 'rgba(220,38,38,0.25)', badge: '#ef4444', badgeBg: 'rgba(239,68,68,0.15)', text: '#fca5a5', icon: '#ef4444' },
  atencao: { label: 'Atenção', bg: 'rgba(234,179,8,0.06)',  border: 'rgba(234,179,8,0.22)',  badge: '#eab308', badgeBg: 'rgba(234,179,8,0.15)',  text: '#fde047', icon: '#eab308' },
  ok:      { label: 'OK',      bg: 'rgba(34,197,94,0.06)',  border: 'rgba(34,197,94,0.22)',  badge: '#22c55e', badgeBg: 'rgba(34,197,94,0.15)',  text: '#86efac', icon: '#22c55e' },
};

function GargalosPanel({ gargalos }: { gargalos: Gargalo[] }) {
  const [expandido, setExpandido] = useState<number | null>(0);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl p-5"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}
    >
      {/* Header do painel */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent-border)' }}>
            <AlertTriangle size={18} style={{ color: 'var(--accent-bright)' }} />
          </div>
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Gargalos & Estratégias</h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Análise automática dos indicadores de hoje · {gargalos.length} ponto{gargalos.length !== 1 ? 's' : ''} identificado{gargalos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {['critico', 'atencao', 'ok'].map(sev => {
            const count = gargalos.filter(g => g.severidade === sev).length;
            if (!count) return null;
            const cfg = severidadeConfig[sev as keyof typeof severidadeConfig];
            return (
              <span key={sev} className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ background: cfg.badgeBg, color: cfg.badge }}>
                {count} {cfg.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Lista de gargalos */}
      <div className="space-y-2">
        {gargalos.map((g, i) => {
          const cfg = severidadeConfig[g.severidade];
          const aberto = expandido === i;
          return (
            <motion.div key={i} layout className="rounded-xl overflow-hidden"
              style={{ border: `1px solid ${cfg.border}`, background: cfg.bg }}>
              {/* Cabeçalho clicável */}
              <button
                onClick={() => setExpandido(aberto ? null : i)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: cfg.badgeBg, color: cfg.badge }}>
                    {cfg.label}
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm" style={{ color: cfg.text }}>{g.titulo}</p>
                    <p className="text-xs mt-0.5 font-mono" style={{ color: cfg.icon, opacity: 0.8 }}>{g.referencia}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-sm font-black" style={{ color: cfg.badge }}>{g.valor}</span>
                  {aberto ? <ChevronUp size={14} style={{ color: cfg.icon }} /> : <ChevronDown size={14} style={{ color: cfg.icon }} />}
                </div>
              </button>

              {/* Análise + Soluções expandidas */}
              <AnimatePresence>
                {aberto && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Análise contextual */}
                      <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: `${cfg.badge}14`, color: cfg.text }}>
                        {g.descricao}
                      </div>
                      {/* Estratégias */}
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Lightbulb size={13} style={{ color: cfg.badge }} />
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.badge }}>
                            Estratégias para resolver
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {g.solucoes.map((sol, j) => (
                            <motion.li key={j}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: j * 0.04 }}
                              className="flex items-start gap-2.5 text-xs leading-relaxed"
                              style={{ color: cfg.text }}>
                              <span className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                                style={{ background: cfg.badge, fontSize: '9px' }}>{j + 1}</span>
                              {sol}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ── Seção card container ───────────────────────────────────────────────────
function Section({ title, subtitle, icon: Icon, children, badge }: { title: string; subtitle?: string; icon: any; children: React.ReactNode; badge?: string }) {
  return (
    <div className="rounded-2xl p-5" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: 'var(--accent-bright)' }} />
          <div>
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{subtitle}</p>}
          </div>
        </div>
        {badge && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'var(--accent-soft)', color: 'var(--accent-bright)', border: '1px solid var(--accent-border)' }}>{badge}</span>}
      </div>
      {children}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
export default function DashboardGeralPage() {
  const queryClient = useQueryClient();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: backData, isLoading: loadBack } = useQuery({
    queryKey: ['backoffice-sheets'],
    queryFn: async () => { const { data } = await api.get('/backoffice/list'); return data; },
    staleTime: 1000 * 60 * 1, gcTime: 1000 * 60 * 10,
  });
  const { data: comData, isLoading: loadCom } = useQuery({
    queryKey: ['comercial-sheets'],
    queryFn: async () => { const { data } = await api.get('/sheets/performance'); return data; },
    staleTime: 1000 * 60 * 1, gcTime: 1000 * 60 * 10,
  });
  const { data: umblerData, isLoading: loadUmbler } = useQuery({
    queryKey: ['umbler-sheets'],
    queryFn: async () => { const { data } = await api.get('/umbler/list'); return data; },
    staleTime: 1000 * 60 * 1, gcTime: 1000 * 60 * 10,
  });

  const isLoading = loadBack || loadCom || loadUmbler;

  const backRows: BackofficeRow[] = useMemo(
    () => (backData?.rows || []).filter((r: BackofficeRow) => r.Backoffice?.trim()),
    [backData]
  );
  const totais = comData?.totais || {};

  // ── Contagens backoffice ──
  const acionados    = backRows.length;
  const finalizados  = cnt(backRows, 'Finalizado');
  const auditoria    = cnt(backRows, 'Auditoria');
  const pendente     = cnt(backRows, 'Pendente');
  const pendAudit    = cnt(backRows, 'Pendente auditoria');
  const pendResp     = cnt(backRows, 'Pendente resposta do cliente');
  const naoResponde  = cnt(backRows, 'Não responde mais');
  const desistiu     = cnt(backRows, 'Desistiu');
  const desqualif    = cnt(backRows, 'Desqualificado');
  const pro          = cnt(backRows, 'PRO');
  const vendaPerdida = cnt(backRows, 'Venda perdida');
  const sanada       = cnt(backRows, 'Sanada');
  const reset        = cnt(backRows, 'Reset');

  // ── Comercial ──
  const recebidos  = totais.recebidos      || 0;
  const emitidos   = totais.emitidos       || 0;
  const assinados  = totais.assinadosSafra || 0;
  const vendaGanha = totais.vendaGanha     || 0;
  const protoc     = totais.protocolados   || 0;
  const taxaCom    = recebidos > 0 ? (assinados / recebidos) * 100 : 0;
  const taxaBack   = acionados > 0 ? (finalizados / acionados) * 100 : 0;
  const pct = (v: number, b: number) => b > 0 ? (v / b) * 100 : 0;

  // ── Evolução por data ──
  const evolucao = useMemo(() => {
    const map: Record<string, { total: number; finalizados: number }> = {};
    backRows.forEach(r => {
      const d = (r.Data || '').trim().slice(0, 10);
      if (!d) return;
      if (!map[d]) map[d] = { total: 0, finalizados: 0 };
      map[d].total++;
      if (norm(r.Status) === 'finalizado') map[d].finalizados++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(0, 5).split('/').reverse().join('/').slice(0,5), ...v }));
  }, [backRows]);

  // ── Distribuição de status ──
  const statusColors: Record<string, string> = {
    'Finalizado': '#f97316', 'Pendente': '#fb923c', 'Aguardando': '#fdba74',
    'Desqualificado': '#ef4444', 'PRO': '#f97316', 'Venda perdida': '#9ca3af',
    'Auditoria': '#fb923c', 'Não responde mais': '#f97316', 'Desistiu': '#fdba74',
    'Sanada': '#ef4444', 'Reset': '#9ca3af', 'Pend. Resposta Cliente': '#fb923c',
  };
  const statusDist = useMemo(() => {
    const m: Record<string, number> = {};
    backRows.forEach(r => {
      const s = (r.Status || '').trim();
      if (s) m[s] = (m[s] || 0) + 1;
    });
    return Object.entries(m)
      .sort(([, a], [, b]) => b - a)
      .map(([label, value], i) => ({
        label,
        value,
        color: statusColors[label] || ['#f97316','#fb923c','#fbbf24','#22c55e','#3b82f6','#8b5cf6','#ec4899'][i % 7],
      }));
  }, [backRows]);

  // ── Top Estados ──
  const estados = useMemo(() => {
    const m: Record<string, number> = {};
    backRows.forEach(r => { const e = (r['Estado do cliente'] || '').trim(); if (e) m[e] = (m[e] || 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a).slice(0, 10)
      .map(([label, value]) => ({ label, value }));
  }, [backRows]);
  const maxEstado = estados[0]?.value || 1;

  // ── Demanda ──
  const demandas = useMemo(() => {
    const m: Record<string, number> = {};
    backRows.forEach(r => { const d = (r.Demanda || '').trim(); if (d) m[d] = (m[d] || 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a).map(([label, value]) => ({ label, value }));
  }, [backRows]);
  const maxDemanda = demandas[0]?.value || 1;

  // ── Pastas por advogado ──
  const advogados = useMemo(() => {
    const m: Record<string, number> = {};
    backRows.forEach(r => { const a = (r.Advogado || '').trim(); if (a) m[a] = (m[a] || 0) + 1; });
    return Object.entries(m).sort(([, a], [, b]) => b - a)
      .map(([label, value]) => ({ label, value }));
  }, [backRows]);
  const maxAdv = advogados[0]?.value || 1;
  const advColors = ['#f97316','#fb923c','#fbbf24','#ef4444','#f97316','#fdba74','#9ca3af'];

  // ── Ranking analistas — Backoffice (por finalizações) ──
  const rankingBackoffice = useMemo((): RankItem[] => {
    const m: Record<string, { total: number; fin: number }> = {};
    backRows.forEach(r => {
      const a = (r.Backoffice || '').trim();
      if (!a) return;
      if (!m[a]) m[a] = { total: 0, fin: 0 };
      m[a].total++;
      if (norm(r.Status) === 'finalizado') m[a].fin++;
    });
    return Object.entries(m)
      .map(([name, s]) => ({ name, processos: s.total, taxa: s.total > 0 ? (s.fin / s.total) * 100 : 0 }))
      .sort((a, b) => b.taxa - a.taxa);
  }, [backRows]);

  // ── Ranking assessores — Comercial (por recebidos) ──
  const rankingComercial = useMemo((): RankItem[] => {
    const linhas: any[] = comData?.linhas || [];
    return linhas
      .filter(l => l.colaborador)
      .map(l => ({
        name: l.colaborador,
        processos: l.recebidos || 0,
        taxa: l.recebidos > 0 ? ((l.assinadosSafra || 0) / l.recebidos) * 100 : 0,
      }))
      .sort((a, b) => b.processos - a.processos);
  }, [comData]);

  // ── Ranking assessores — Umbler (por registros / taxa de conclusão) ──
  const rankingUmbler = useMemo((): RankItem[] => {
    const umblerRows: any[] = (umblerData?.rows || []).filter((r: any) => r.assessor?.trim());
    const m: Record<string, { total: number; concluidos: number }> = {};
    umblerRows.forEach((r: any) => {
      const a = (r.assessor || '').trim();
      if (!a) return;
      if (!m[a]) m[a] = { total: 0, concluidos: 0 };
      m[a].total++;
      if (norm(r.status).includes('conclu')) m[a].concluidos++;
    });
    return Object.entries(m)
      .map(([name, s]) => ({ name, processos: s.total, taxa: s.total > 0 ? (s.concluidos / s.total) * 100 : 0 }))
      .sort((a, b) => b.processos - a.processos);
  }, [umblerData]);

  const row1 = [
    { title: 'Total Acionados', value: acionados,  subtitle: 'Base backoffice',      icon: Users,        color: 'blue'   as const },
    { title: 'Recebidos',       value: recebidos,  subtitle: 'Leads comercial',       icon: Phone,        color: 'orange' as const },
    { title: 'Emitidos',        value: emitidos,   subtitle: 'Propostas enviadas',    icon: Send,         color: 'green'  as const, percentage: pct(emitidos, recebidos) },
    { title: 'Assinados Safra', value: assinados,  subtitle: 'Contratos assinados',   icon: CheckCircle2, color: 'purple' as const, percentage: pct(assinados, recebidos) },
    { title: 'Venda Ganha',     value: vendaGanha, subtitle: 'Negócios fechados',     icon: Award,        color: 'yellow' as const, percentage: pct(vendaGanha, recebidos) },
    { title: 'Protocolados',    value: protoc,     subtitle: 'Em análise',            icon: FileCheck,    color: 'pink'   as const },
    { title: 'Conv. Comercial', value: `${taxaCom.toFixed(1)}%`, subtitle: 'Ass./Recebidos', icon: TrendingUp, color: 'cyan' as const },
  ];
  const row2 = [
    { title: 'Finalizados',     value: finalizados,  subtitle: 'Backoffice finalizado', icon: CheckCircle2, color: 'green'  as const, percentage: taxaBack },
    { title: 'Auditoria',       value: auditoria,    subtitle: 'Falta auditar',          icon: Search,       color: 'blue'   as const },
    { title: 'Pendentes',       value: pendente,     subtitle: 'Aguardando ação',        icon: AlertCircle,  color: 'yellow' as const },
    { title: 'Não Responde',    value: naoResponde,  subtitle: 'Sem retorno',            icon: Phone,        color: 'orange' as const, percentage: pct(naoResponde, acionados) },
    { title: 'Desqualificados', value: desqualif,    subtitle: 'Fora do perfil',         icon: UserX,        color: 'gray'   as const },
    { title: 'Venda Perdida',   value: vendaPerdida, subtitle: 'Desqualif. c/ perda',   icon: XCircle,      color: 'red'    as const, percentage: pct(vendaPerdida, acionados) },
    { title: 'Taxa Geral',      value: `${taxaBack.toFixed(1)}%`, subtitle: 'Finaliz./Acionados', icon: Percent, color: 'purple' as const },
  ];
  const row3 = [
    { title: 'PRO (Prontuário)',value: pro,          subtitle: 'Encaminhados',           icon: Zap,          color: 'purple' as const },
    { title: 'Pend. Auditoria', value: pendAudit,    subtitle: 'Aguardando auditoria',   icon: Search,       color: 'orange' as const },
    { title: 'Aguard. Cliente', value: pendResp,     subtitle: 'Pendente resposta',      icon: Clock,        color: 'yellow' as const },
    { title: 'Desistiu',        value: desistiu,     subtitle: 'Cliente desistiu',       icon: UserX,        color: 'gray'   as const },
    { title: 'Sanada',          value: sanada,       subtitle: 'Demanda sanada',         icon: CheckCircle2, color: 'green'  as const },
    { title: 'Reset',           value: reset,        subtitle: 'Reiniciado',             icon: RotateCcw,    color: 'blue'   as const },
  ];

  const gargalos = useMemo(() => analisarGargalos({
    taxaBack, taxaCom, pendente, acionados, naoResponde, finalizados,
    auditoria, desqualif, vendaPerdida, desistiu, pendAudit, pendResp,
    recebidos, assinados, emitidos, vendaGanha,
  }), [taxaBack, taxaCom, pendente, acionados, naoResponde, finalizados, auditoria, desqualif, vendaPerdida, desistiu, pendAudit, pendResp, recebidos, assinados, emitidos, vendaGanha]);

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Dashboard Geral</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Indicadores ao vivo da sua planilha · {acionados} registros
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[{ label: 'Backoffice', count: acionados, loading: loadBack }, { label: 'Comercial', count: recebidos, loading: loadCom }].map(s => (
            <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', color: 'var(--text-secondary)' }}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.loading ? '#f59e0b' : '#22c55e' }} />
              {s.label}: {s.loading ? '...' : s.count}
            </div>
          ))}
          <button onClick={async () => {
            setIsRefreshing(true);
            try {
              await Promise.all([api.get('/backoffice/list?force=true'), api.get('/sheets/performance?force=true'), api.get('/umbler/list?force=true')]);
              await Promise.all([
                queryClient.refetchQueries({ queryKey: ['backoffice-sheets'] }),
                queryClient.refetchQueries({ queryKey: ['comercial-sheets'] }),
                queryClient.refetchQueries({ queryKey: ['umbler-sheets'] }),
              ]);
            } finally { setIsRefreshing(false); }
          }}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-70"
            style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 4px 14px rgba(34,197,94,0.30)' }}>
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Atualizando...' : 'Atualizar Tudo'}
          </button>
        </div>
      </motion.div>

      {/* Cards linha 1 — Comercial */}
      <div>
        <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--section-label)' }}>Comercial</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {isLoading ? [1,2,3,4,5,6,7].map(i => <div key={i} className="rounded-2xl h-44 animate-pulse" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />)
            : row1.map((c, i) => <DashCard key={c.title} {...c} index={i} refreshing={isRefreshing} />)}
        </div>
      </div>

      {/* Cards linha 2 — Backoffice principal */}
      <div>
        <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--section-label)' }}>Backoffice — Principal</p>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {isLoading ? [1,2,3,4,5,6,7].map(i => <div key={i} className="rounded-2xl h-44 animate-pulse" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />)
            : row2.map((c, i) => <DashCard key={c.title} {...c} index={i} refreshing={isRefreshing} />)}
        </div>
      </div>

      {/* Cards linha 3 — Backoffice detalhes */}
      <div>
        <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: 'var(--section-label)' }}>Backoffice — Detalhes</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading ? [1,2,3,4,5,6].map(i => <div key={i} className="rounded-2xl h-44 animate-pulse" style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)' }} />)
            : row3.map((c, i) => <DashCard key={c.title} {...c} index={i} refreshing={isRefreshing} />)}
        </div>
      </div>

      {/* Gráficos linha 1 — Evolução + Distribuição */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Section title="Evolução por Data" subtitle="Total vs. Finalizados (últimas datas)" icon={TrendingUp} badge="Ao vivo">
              <AreaChart points={evolucao} />
              <div className="flex gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-3 h-0.5 rounded" style={{ background: '#f97316', display: 'inline-block' }} /> Total
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                  <span className="w-3 h-0.5 rounded" style={{ background: '#22c55e', display: 'inline-block' }} /> Finalizados
                </div>
              </div>
            </Section>
          </div>
          <Section title="Distribuição de Status" subtitle="Proporção atual" icon={Percent}>
            <DonutChart segments={statusDist} />
          </Section>
        </div>
      )}

      {/* Gráficos linha 2 — Ranking supervisores + Top estados + Demanda */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Section title="Ranking de Supervisores" subtitle="Classificado por finalizações" icon={Users} badge={`${new Set(backRows.map(r => r.Supervisor).filter(Boolean)).size} supervisores`}>
            <SupervisorRanking rows={backRows} />
          </Section>

          <Section title="Top Estados" subtitle="Origem geográfica dos clientes" icon={MapPin}>
            <div className="space-y-2">
              {estados.map((e, i) => (
                <HBar key={e.label} label={e.label} value={e.value} max={maxEstado}
                  pct={Math.round(e.value / acionados * 100)} rank={i + 1}
                  color={i < 3 ? '#f97316' : i < 6 ? '#fb923c' : '#9ca3af'} />
              ))}
            </div>
          </Section>

          <Section title="Por Tipo de Demanda" subtitle="Distribuição por tipo de solicitação" icon={TrendingUp}>
            <div className="space-y-3">
              {demandas.map((d, i) => (
                <HBar key={d.label} label={d.label} value={d.value} max={maxDemanda}
                  pct={Math.round(d.value / acionados * 100)} rank={i + 1}
                  color={i === 0 ? '#f97316' : '#9ca3af'} />
              ))}
            </div>
          </Section>
        </div>
      )}

      {/* Rankings de Assessores */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <RankingAssessores
            title="Ranking de Assessores — Comercial"
            subtitle="Por volume de recebidos · aba Comercial"
            items={rankingComercial}
          />
          <RankingAssessores
            title="Ranking de Analistas — Backoffice"
            subtitle="Por taxa de finalização · aba Backoffice"
            items={rankingBackoffice}
          />
          <RankingAssessores
            title="Ranking de Assessores — Umbler"
            subtitle="Por volume de registros · aba Umbler"
            items={rankingUmbler}
          />
        </div>
      )}

      {/* Pastas por advogado */}
      {!isLoading && advogados.length > 0 && (
        <Section title="Pastas por Advogado" subtitle="Total de registros por advogado responsável" icon={Users}>
          <div className="space-y-3">
            {advogados.map((a, i) => (
              <div key={a.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.label}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {a.value} pastas ({Math.round(a.value / acionados * 100)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--input-bg)' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(a.value / maxAdv) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.05 }}
                    className="h-full rounded-full" style={{ background: advColors[i] || '#f97316' }} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Painel de Gargalos & Estratégias — ao final do dashboard */}
      {!isLoading && <GargalosPanel gargalos={gargalos} />}
    </div>
  );
}
