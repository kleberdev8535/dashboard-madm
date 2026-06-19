'use client';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

interface EvolucaoItem { mes: string; total: number }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-4 py-3 text-sm">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {p.value?.toLocaleString('pt-BR')}
        </p>
      ))}
    </div>
  );
};

export default function EvolucaoChart({ data }: { data: EvolucaoItem[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="mes" tick={{ fill: '#4a5650', fontSize: 12 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: '#4a5650', fontSize: 12 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          name="Total"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#gradGreen)"
          dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#4ade80' }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
