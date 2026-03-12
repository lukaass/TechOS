import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Plus, ChevronLeft, ChevronRight, User, X } from 'lucide-react';

export default function Schedule() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    client_id: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    description: '',
    status: 'pending'
  });

  const clients = useLiveQuery(() => db.clients.toArray(), []);

  const appointments = useLiveQuery(async () => {
    const dateStr = currentDate.toISOString().split('T')[0];
    const data = await db.schedule.where('date').equals(dateStr).toArray();
    
    return Promise.all(data.map(async (app) => {
      const client = await db.clients.get(app.client_id);
      return {
        ...app,
        client_name: client?.name || 'Cliente não encontrado'
      };
    }));
  }, [currentDate]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.schedule.add({
        client_id: Number(newAppointment.client_id),
        date: newAppointment.date,
        time: newAppointment.time,
        description: newAppointment.description,
        status: newAppointment.status,
        created_at: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewAppointment({
        client_id: '',
        date: new Date().toISOString().split('T')[0],
        time: '',
        description: '',
        status: 'pending'
      });
    } catch (err) {
      console.error('Erro ao criar agendamento:', err);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (day: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Agenda</h2>
          <p className="text-white/40">Compromissos e visitas técnicas</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20"
        >
          <Plus size={20} />
          Novo Agendamento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-[#1E1E1E] p-8 rounded-3xl border border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold capitalize">{monthName}</h3>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevMonth}
                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={handleNextMonth}
                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={`${d}-${i}`} className="text-center text-[10px] font-bold text-white/20 uppercase">{d}</div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isSelected = currentDate.getDate() === day;
              const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
              
              return (
                <div 
                  key={day} 
                  onClick={() => handleDateSelect(day)}
                  className={`aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all cursor-pointer
                    ${isSelected ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/20' : 
                      isToday ? 'bg-white/10 text-white' : 'hover:bg-white/5 text-white/60'}`}
                >
                  {day}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold mb-4">
            Compromissos de {currentDate.toLocaleDateString('pt-BR')}
          </h3>
          {appointments?.map((app) => (
            <div key={app.id} className="bg-[#1E1E1E] p-6 rounded-3xl border border-white/5 flex items-center gap-6 hover:border-[#0A84FF]/30 transition-all group">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex flex-col items-center justify-center shrink-0 group-hover:bg-[#0A84FF]/10 transition-colors">
                <span className="text-lg font-bold text-white group-hover:text-[#0A84FF]">{app.time}</span>
                <span className="text-[10px] font-bold text-white/20 uppercase">Horário</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <User size={14} className="text-white/20" />
                  <h4 className="font-bold truncate">{app.client_name}</h4>
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
          {appointments?.length === 0 && (
            <div className="text-center py-12 bg-[#1E1E1E] rounded-3xl border border-white/5">
              <p className="text-white/40">Nenhum compromisso para este dia.</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Agendamento */}
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
                <h3 className="text-xl sm:text-2xl font-bold">Novo Agendamento</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateAppointment} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Cliente</label>
                    <select
                      required
                      value={newAppointment.client_id}
                      onChange={(e) => setNewAppointment({ ...newAppointment, client_id: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    >
                      <option value="">Selecione um cliente</option>
                      {clients?.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Data</label>
                    <input
                      type="date"
                      required
                      value={newAppointment.date}
                      onChange={(e) => setNewAppointment({ ...newAppointment, date: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Horário</label>
                    <input
                      type="time"
                      required
                      value={newAppointment.time}
                      onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Status Inicial</label>
                    <select
                      value={newAppointment.status}
                      onChange={(e) => setNewAppointment({ ...newAppointment, status: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    >
                      <option value="pending">Pendente</option>
                      <option value="confirmed">Confirmado</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Descrição / Motivo</label>
                    <textarea
                      required
                      rows={3}
                      value={newAppointment.description}
                      onChange={(e) => setNewAppointment({ ...newAppointment, description: e.target.value })}
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
                    Agendar
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
