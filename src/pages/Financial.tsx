import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Plus,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Search
} from 'lucide-react';

export default function Financial() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    type: 'income' as 'income' | 'expense',
    category: '',
    description: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0]
  });

  const transactions = useLiveQuery(() => db.financial.orderBy('date').reverse().toArray(), []);
  
  const filteredTransactions = transactions?.filter((t) => {
    const matchesSearch = 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const isLoading = transactions === undefined;

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.financial.add({
        ...newTransaction,
        created_at: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewTransaction({
        type: 'income',
        category: '',
        description: '',
        amount: 0,
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err) {
      console.error('Erro ao criar transação:', err);
    }
  };

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
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#1E1E1E] border border-white/5 px-6 py-3 rounded-xl text-white/60 hover:text-white transition-all focus:outline-none focus:border-[#0A84FF]"
          >
            <option value="all">Todos os Tipos</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20"
          >
            <Plus size={20} />
            Nova Transação
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
        <input
          type="text"
          placeholder="Buscar por descrição ou categoria..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1E1E1E] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
        />
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

        {/* Mobile View: Cards */}
        <div className="lg:hidden divide-y divide-white/5">
          {filteredTransactions?.map((t) => (
            <div key={t.id} className="p-4 hover:bg-white/2 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-white/40">{new Date(t.date).toLocaleDateString()}</span>
                <span className="px-3 py-1 bg-white/5 rounded-full text-[10px] text-white/60">
                  {t.category}
                </span>
              </div>
              <h4 className="font-bold mb-1">{t.description}</h4>
              <p className={`text-lg font-bold ${t.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
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
              {filteredTransactions?.map((t) => (
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

      {/* Modal Nova Transação */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#1E1E1E] rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold">Nova Transação</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTransaction} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Tipo</label>
                    <select
                      required
                      value={newTransaction.type}
                      onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value as 'income' | 'expense' })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    >
                      <option value="income">Receita (Entrada)</option>
                      <option value="expense">Despesa (Saída)</option>
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Data</label>
                    <input
                      type="date"
                      required
                      value={newTransaction.date}
                      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Descrição</label>
                    <input
                      type="text"
                      required
                      value={newTransaction.description}
                      onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Categoria</label>
                    <input
                      type="text"
                      required
                      value={newTransaction.category}
                      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Valor (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({ ...newTransaction, amount: Number(e.target.value) })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 sm:py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 sm:py-4 bg-[#0A84FF] hover:bg-[#0070E0] rounded-xl font-bold transition-all text-sm sm:text-base"
                  >
                    Salvar Transação
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
