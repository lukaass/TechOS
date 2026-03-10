import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function Financial() {
  const transactions = useLiveQuery(() => db.financial.orderBy('date').reverse().toArray(), []);
  const isLoading = transactions === undefined;

  const stats = useLiveQuery(async () => {
    const monthStr = new Date().toISOString().slice(0, 7);
    const monthRecords = await db.financial.filter(f => f.date.startsWith(monthStr)).toArray();
    
    const income = monthRecords.filter(r => r.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
    const expense = monthRecords.filter(r => r.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
    const balance = income - expense;

    return { income, expense, balance };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Financeiro</h2>
          <p className="text-white/40">Controle de entradas e saídas</p>
        </div>
        <div className="flex gap-3">
          <button className="bg-white/5 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all">
            <Filter size={20} />
            Filtros
          </button>
          <button className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20">
            <Plus size={20} />
            Nova Transação
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-white/5">
          <div className="w-12 h-12 bg-green-400/10 text-green-400 rounded-2xl flex items-center justify-center mb-4">
            <TrendingUp size={24} />
          </div>
          <p className="text-white/40 text-sm font-medium">Receitas (Mês)</p>
          <p className="text-3xl font-bold mt-1 text-green-400">R$ {stats?.income?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 mt-2 text-green-400/60 text-xs">
            <ArrowUpRight size={14} />
            <span>+12% em relação ao mês anterior</span>
          </div>
        </div>

        <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-white/5">
          <div className="w-12 h-12 bg-red-400/10 text-red-400 rounded-2xl flex items-center justify-center mb-4">
            <TrendingDown size={24} />
          </div>
          <p className="text-white/40 text-sm font-medium">Despesas (Mês)</p>
          <p className="text-3xl font-bold mt-1 text-red-400">R$ {stats?.expense?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 mt-2 text-red-400/60 text-xs">
            <ArrowDownRight size={14} />
            <span>-5% em relação ao mês anterior</span>
          </div>
        </div>

        <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-white/5">
          <div className="w-12 h-12 bg-[#0A84FF]/10 text-[#0A84FF] rounded-2xl flex items-center justify-center mb-4">
            <DollarSign size={24} />
          </div>
          <p className="text-white/40 text-sm font-medium">Saldo Líquido</p>
          <p className="text-3xl font-bold mt-1">R$ {stats?.balance?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="flex items-center gap-1 mt-2 text-white/20 text-xs">
            <span>Atualizado agora</span>
          </div>
        </div>
      </div>

      <div className="bg-[#1E1E1E] rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xl font-bold">Transações Recentes</h3>
          <button className="text-[#0A84FF] text-sm font-bold hover:underline">Ver tudo</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/2">
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Data</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {transactions?.map((t) => (
                <tr key={t.id} className="hover:bg-white/2 transition-colors">
                  <td className="px-6 py-4 text-sm text-white/60">{new Date(t.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 font-medium">{t.description}</td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60">
                      {t.category}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
