import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const chartData = [
  { name: 'Seg', services: 4, revenue: 1200 },
  { name: 'Ter', services: 7, revenue: 2100 },
  { name: 'Qua', services: 5, revenue: 1500 },
  { name: 'Qui', services: 8, revenue: 2400 },
  { name: 'Sex', services: 12, revenue: 3600 },
  { name: 'Sab', services: 6, revenue: 1800 },
  { name: 'Dom', services: 2, revenue: 600 },
];

export default function Dashboard() {
  const stats = useLiveQuery(async () => {
    const open = await db.service_orders.where('status').equals('pending_diagnosis').count();
    const in_progress = await db.service_orders.where('status').equals('in_progress').count();
    const waiting_approval = await db.service_orders.where('status').equals('waiting_approval').count();
    const finished = await db.service_orders.where('status').equals('finished').count();
    
    const monthStr = new Date().toISOString().slice(0, 7);
    const financialRecords = await db.financial
      .where('type').equals('income')
      .filter(f => f.date.startsWith(monthStr))
      .toArray();
    
    const monthly_revenue = financialRecords.reduce((acc, curr) => acc + curr.amount, 0);

    return { open, in_progress, waiting_approval, finished, monthly_revenue };
  }, []);

  const isLoading = stats === undefined;

  const cards = [
    { label: 'OS Abertas', value: stats?.open || 0, icon: ClipboardList, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Em Andamento', value: stats?.in_progress || 0, icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Aguardando Aprovação', value: stats?.waiting_approval || 0, icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    { label: 'Finalizadas', value: stats?.finished || 0, icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Dashboard</h2>
          <p className="text-white/40">Visão geral da sua assistência técnica</p>
        </div>
        <div className="bg-[#1E1E1E] p-4 rounded-2xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-400/10 rounded-xl flex items-center justify-center text-green-400">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase font-bold tracking-wider">Faturamento Mensal</p>
            <p className="text-xl font-bold">R$ {stats?.monthly_revenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-[#0A84FF]/30 transition-all group">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 ${card.bg} ${card.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon size={20} className="sm:w-6 sm:h-6" />
            </div>
            <p className="text-white/40 text-xs sm:text-sm font-medium">{card.label}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
        <div className="bg-[#1E1E1E] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold">Serviços por Dia</h3>
            <span className="text-[10px] sm:text-xs bg-white/5 px-3 py-1 rounded-full text-white/40">Últimos 7 dias</span>
          </div>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="services" fill="#0A84FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#1E1E1E] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <h3 className="text-lg sm:text-xl font-bold">Receita Estimada</h3>
            <span className="text-[10px] sm:text-xs bg-white/5 px-3 py-1 rounded-full text-white/40">Projeção Semanal</span>
          </div>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2ECC71" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2ECC71" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="name" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1E1E1E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2ECC71" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
