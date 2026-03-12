import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PauseCircle,
  ChevronRight,
  X
} from 'lucide-react';

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_diagnosis: { label: 'Aguardando Diagnóstico', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Search },
  in_progress: { label: 'Em Andamento', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
  waiting_approval: { label: 'Aguardando Orçamento', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: AlertCircle },
  paused: { label: 'Pausado', color: 'text-white/40', bg: 'bg-white/5', icon: PauseCircle },
  finished: { label: 'Finalizado', color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle2 },
};

export default function ServiceOrders() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newOS, setNewOS] = useState({
    client_id: '',
    equipment_id: '',
    problem_description: '',
    status: 'pending_diagnosis'
  });

  const clients = useLiveQuery(() => db.clients.toArray(), []);
  const equipment = useLiveQuery(() => db.equipment.toArray(), []);

  const osList = useLiveQuery(async () => {
    const osData = await db.service_orders.orderBy('created_at').reverse().toArray();
    
    // Manual Joins
    const enrichedOS = await Promise.all(osData.map(async (os) => {
      const client = await db.clients.get(os.client_id);
      const equipment = await db.equipment.get(os.equipment_id);
      const technician = os.technician_id ? await db.users.get(os.technician_id) : null;
      
      return {
        ...os,
        client_name: client?.name || 'Cliente não encontrado',
        equipment_model: equipment?.model || 'Equipamento não encontrado',
        technician_name: technician?.name || 'Não atribuído'
      };
    }));

    return enrichedOS;
  }, []);

  const isLoading = osList === undefined;

  const handleCreateOS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.service_orders.add({
        client_id: Number(newOS.client_id),
        equipment_id: Number(newOS.equipment_id),
        problem_description: newOS.problem_description,
        status: newOS.status,
        total_worked_time: 0,
        created_at: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewOS({ client_id: '', equipment_id: '', problem_description: '', status: 'pending_diagnosis' });
    } catch (err) {
      console.error('Erro ao criar OS:', err);
    }
  };

  const filteredOS = osList?.filter((os: any) => {
    const matchesSearch = 
      os.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.equipment_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      os.id.toString().includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || os.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Ordens de Serviço</h2>
          <p className="text-white/40">Gerencie todos os serviços técnicos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20"
        >
          <Plus size={20} />
          Nova OS
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
          <input
            type="text"
            placeholder="Buscar por cliente, equipamento ou número da OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1E1E1E] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1E1E1E] border border-white/5 px-6 py-4 rounded-2xl text-white/60 hover:text-white transition-all focus:outline-none focus:border-[#0A84FF]"
        >
          <option value="all">Todos os Status</option>
          {Object.entries(statusMap).map(([key, value]) => (
            <option key={key} value={key}>{value.label}</option>
          ))}
        </select>
      </div>

      <div className="bg-[#1E1E1E] rounded-2xl sm:rounded-3xl border border-white/5 overflow-hidden">
        {/* Mobile View: Cards */}
        <div className="lg:hidden divide-y divide-white/5">
          {filteredOS?.map((os: any) => {
            const status = statusMap[os.status] || statusMap.pending_diagnosis;
            return (
              <Link 
                key={os.id} 
                to={`/os/${os.id}`}
                className="block p-4 hover:bg-white/2 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-[#0A84FF]">#{os.id}</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status.bg} ${status.color}`}>
                    <status.icon size={12} />
                    {status.label}
                  </span>
                </div>
                <h3 className="font-bold text-lg mb-1">{os.client_name}</h3>
                <p className="text-sm text-white/60 mb-3">{os.equipment_model}</p>
                <div className="flex items-center justify-between text-xs text-white/40">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[8px] font-bold">
                      {os.technician_name?.[0] || '?'}
                    </div>
                    <span>{os.technician_name || 'Não atribuído'}</span>
                  </div>
                  <span>{new Date(os.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Desktop View: Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">OS #</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Equipamento</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider">Técnico</th>
                <th className="px-6 py-4 text-xs font-bold text-white/40 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredOS?.map((os: any) => {
                const status = statusMap[os.status] || statusMap.pending_diagnosis;
                return (
                  <tr key={os.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-6 py-4 font-bold text-[#0A84FF]">#{os.id}</td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{os.client_name}</p>
                      <p className="text-xs text-white/40">Entrada: {new Date(os.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium">{os.equipment_model}</p>
                      <p className="text-xs text-white/40">Problema: {os.problem_description.slice(0, 30)}...</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                        <status.icon size={14} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
                          {os.technician_name?.[0] || '?'}
                        </div>
                        <span className="text-sm text-white/60">{os.technician_name || 'Não atribuído'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        to={`/os/${os.id}`}
                        className="p-2 hover:bg-white/5 rounded-lg inline-flex text-white/40 hover:text-white transition-all"
                      >
                        <ChevronRight size={20} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova OS */}
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
                <h3 className="text-xl sm:text-2xl font-bold">Nova Ordem de Serviço</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateOS} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Cliente</label>
                    <select
                      required
                      value={newOS.client_id}
                      onChange={(e) => setNewOS({ ...newOS, client_id: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    >
                      <option value="">Selecione um cliente</option>
                      {clients?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Equipamento</label>
                    <select
                      required
                      value={newOS.equipment_id}
                      onChange={(e) => setNewOS({ ...newOS, equipment_id: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    >
                      <option value="">Selecione um equipamento</option>
                      {equipment?.filter(e => e.client_id === Number(newOS.client_id)).map((e) => (
                        <option key={e.id} value={e.id}>{e.model}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Descrição do Problema</label>
                    <textarea
                      required
                      rows={4}
                      value={newOS.problem_description}
                      onChange={(e) => setNewOS({ ...newOS, problem_description: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF] resize-none"
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
                    Abrir OS
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
