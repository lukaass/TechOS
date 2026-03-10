import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PauseCircle,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import { motion } from 'motion/react';

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_diagnosis: { label: 'Aguardando Diagnóstico', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Search },
  in_progress: { label: 'Em Andamento', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
  waiting_approval: { label: 'Aguardando Orçamento', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: AlertCircle },
  paused: { label: 'Pausado', color: 'text-white/40', bg: 'bg-white/5', icon: PauseCircle },
  finished: { label: 'Finalizado', color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle2 },
};

export default function ServiceOrders() {
  const token = useAuthStore((state) => state.token);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: osList, isLoading } = useQuery({
    queryKey: ['os-list'],
    queryFn: async () => {
      const res = await fetch('/api/os', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const filteredOS = osList?.filter((os: any) => 
    os.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.equipment_model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    os.id.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Ordens de Serviço</h2>
          <p className="text-white/40">Gerencie todos os serviços técnicos</p>
        </div>
        <button className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20">
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
        <button className="bg-[#1E1E1E] border border-white/5 px-6 py-4 rounded-2xl flex items-center gap-2 text-white/60 hover:text-white transition-all">
          <Filter size={20} />
          Filtros
        </button>
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
    </div>
  );
}
