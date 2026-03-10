import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Calendar as CalendarIcon, Clock, Plus, ChevronLeft, ChevronRight, User } from 'lucide-react';

export default function Schedule() {
  const token = useAuthStore((state) => state.token);
  const [currentDate, setCurrentDate] = useState(new Date());

  const appointments = [
    { id: 1, client: 'João Silva', time: '09:00', description: 'Retirada de Notebook', status: 'confirmed' },
    { id: 2, client: 'Maria Oliveira', time: '11:30', description: 'Visita Técnica - Rede', status: 'pending' },
    { id: 3, client: 'Empresa ABC', time: '14:00', description: 'Manutenção Preventiva', status: 'confirmed' },
    { id: 4, client: 'Carlos Souza', time: '16:30', description: 'Entrega de PC Gamer', status: 'pending' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Agenda</h2>
          <p className="text-white/40">Compromissos e visitas técnicas</p>
        </div>
        <button className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20">
          <Plus size={20} />
          Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">Calendário</h3>
            <div className="flex gap-2">
              <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
                <ChevronLeft size={20} />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d) => (
              <div key={d} className="text-center text-[10px] font-bold text-white/20 uppercase">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 31 }).map((_, i) => (
              <div 
                key={i} 
                className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all cursor-pointer
                  ${i + 1 === 10 ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/20' : 'hover:bg-white/5 text-white/60'}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold mb-4">Compromissos de Hoje</h3>
          {appointments.map((app) => (
            <div key={app.id} className="bg-[#1E1E1E] p-6 rounded-3xl border border-white/5 flex items-center gap-6 hover:border-[#0A84FF]/30 transition-all group">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center shrink-0 group-hover:bg-[#0A84FF]/10 transition-colors">
                <span className="text-lg font-bold text-white group-hover:text-[#0A84FF]">{app.time}</span>
                <span className="text-[10px] font-bold text-white/20 uppercase">Horário</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-white/20" />
                  <h4 className="font-bold truncate">{app.client}</h4>
                </div>
                <p className="text-sm text-white/40 truncate">{app.description}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  app.status === 'confirmed' ? 'bg-green-400/10 text-green-400' : 'bg-yellow-400/10 text-yellow-400'
                }`}>
                  {app.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                </span>
                <button className="p-2 hover:bg-white/5 rounded-lg text-white/20 hover:text-white transition-all">
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
