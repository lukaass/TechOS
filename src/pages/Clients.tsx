import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Search, UserPlus, Phone, Mail, MapPin, History, ChevronRight, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEquipmentModalOpen, setIsEquipmentModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [newClient, setNewClient] = useState({
    name: '',
    cpf_cnpj: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: ''
  });

  const [newEquipment, setNewEquipment] = useState({
    type: '',
    brand: '',
    model: '',
    serial_number: '',
    notes: ''
  });

  const clients = useLiveQuery(() => db.clients.orderBy('name').toArray(), []);
  const clientEquipment = useLiveQuery(
    () => selectedClient ? db.equipment.where('client_id').equals(selectedClient.id).toArray() : Promise.resolve([]),
    [selectedClient]
  );

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditMode && selectedClient) {
        await db.clients.update(selectedClient.id, newClient);
      } else {
        await db.clients.add({
          ...newClient,
          created_at: new Date().toISOString()
        });
      }
      setIsModalOpen(false);
      setIsEditMode(false);
      setNewClient({
        name: '', cpf_cnpj: '', phone: '', whatsapp: '', email: '',
        address: '', city: '', state: '', zip: '', notes: ''
      });
    } catch (err) {
      console.error('Erro ao salvar cliente:', err);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      await db.equipment.add({
        ...newEquipment,
        client_id: selectedClient.id,
        created_at: new Date().toISOString()
      });
      setIsEquipmentModalOpen(false);
      setNewEquipment({ type: '', brand: '', model: '', serial_number: '', notes: '' });
    } catch (err) {
      console.error('Erro ao criar equipamento:', err);
    }
  };

  const filteredClients = clients?.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Clientes</h2>
          <p className="text-white/40">Gerencie sua base de contatos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20"
        >
          <UserPlus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
        <input
          type="text"
          placeholder="Buscar por nome, e-mail ou telefone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1E1E1E] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredClients?.map((client: any) => (
          <motion.div
            layout
            key={client.id}
            className="bg-[#1E1E1E] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-[#0A84FF]/30 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0A84FF]/10 text-[#0A84FF] rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-lg sm:text-xl">
                {client.name[0]}
              </div>
              <button className="text-white/20 hover:text-white transition-colors">
                <History size={18} />
              </button>
            </div>
            
            <h3 className="text-lg sm:text-xl font-bold mb-4">{client.name}</h3>
            
            <div className="space-y-3 text-xs sm:text-sm text-white/60">
              <div className="flex items-center gap-3">
                <Phone size={14} className="sm:w-4 sm:h-4" />
                <span>{client.phone || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={14} className="sm:w-4 sm:h-4" />
                <span className="truncate">{client.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin size={14} className="sm:w-4 sm:h-4" />
                <span className="truncate">{client.city ? `${client.city}, ${client.state}` : 'Endereço não informado'}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                setSelectedClient(client);
                setIsDetailsOpen(true);
              }}
              className="w-full mt-6 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all"
            >
              Ver Detalhes
              <ChevronRight size={14} />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Modal Detalhes do Cliente */}
      <AnimatePresence>
        {isDetailsOpen && selectedClient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDetailsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-[#1E1E1E] rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold">Detalhes do Cliente</h3>
                <button onClick={() => setIsDetailsOpen(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-1">Nome</p>
                    <p className="text-lg font-bold">{selectedClient.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-1">CPF / CNPJ</p>
                    <p className="text-white/80">{selectedClient.cpf_cnpj || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-1">Telefone</p>
                    <p className="text-white/80">{selectedClient.phone || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-1">WhatsApp</p>
                    <p className="text-white/80">{selectedClient.whatsapp || 'Não informado'}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-1">E-mail</p>
                    <p className="text-white/80">{selectedClient.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-1">Endereço</p>
                    <p className="text-white/80">{selectedClient.address || 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-1">Cidade / UF</p>
                    <p className="text-white/80">{selectedClient.city ? `${selectedClient.city} - ${selectedClient.state}` : 'Não informado'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white/20 uppercase tracking-wider mb-1">Observações</p>
                    <p className="text-white/60 text-sm">{selectedClient.notes || 'Sem observações'}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold">Equipamentos</h4>
                  <button 
                    onClick={() => setIsEquipmentModalOpen(true)}
                    className="text-xs bg-[#0A84FF]/10 text-[#0A84FF] px-3 py-1.5 rounded-lg font-bold hover:bg-[#0A84FF]/20 transition-all flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Novo Equipamento
                  </button>
                </div>
                <div className="space-y-2">
                  {clientEquipment?.map((eq) => (
                    <div key={eq.id} className="bg-white/2 p-3 rounded-xl border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{eq.brand} {eq.model}</p>
                        <p className="text-[10px] text-white/40 uppercase tracking-wider">{eq.type} • SN: {eq.serial_number || 'N/A'}</p>
                      </div>
                    </div>
                  ))}
                  {clientEquipment?.length === 0 && (
                    <p className="text-xs text-white/20 text-center py-4 italic">Nenhum equipamento cadastrado.</p>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-white/5 flex gap-4">
                <button 
                  onClick={() => {
                    setNewClient({
                      name: selectedClient.name,
                      cpf_cnpj: selectedClient.cpf_cnpj || '',
                      phone: selectedClient.phone || '',
                      whatsapp: selectedClient.whatsapp || '',
                      email: selectedClient.email || '',
                      address: selectedClient.address || '',
                      city: selectedClient.city || '',
                      state: selectedClient.state || '',
                      zip: selectedClient.zip || '',
                      notes: selectedClient.notes || ''
                    });
                    setIsEditMode(true);
                    setIsModalOpen(true);
                    setIsDetailsOpen(false);
                  }}
                  className="flex-1 py-3 bg-[#0A84FF] hover:bg-[#0070E0] rounded-xl font-bold transition-all"
                >
                  Editar Cliente
                </button>
                <button 
                  onClick={() => setIsDetailsOpen(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Novo Cliente */}
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
                <h3 className="text-xl sm:text-2xl font-bold">{isEditMode ? 'Editar Cliente' : 'Novo Cliente'}</h3>
                <button onClick={() => {
                  setIsModalOpen(false);
                  setIsEditMode(false);
                }} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateClient} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Nome Completo</label>
                    <input
                      type="text"
                      required
                      value={newClient.name}
                      onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">CPF / CNPJ</label>
                    <input
                      type="text"
                      value={newClient.cpf_cnpj}
                      onChange={(e) => setNewClient({ ...newClient, cpf_cnpj: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Telefone</label>
                    <input
                      type="text"
                      value={newClient.phone}
                      onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">WhatsApp</label>
                    <input
                      type="text"
                      value={newClient.whatsapp}
                      onChange={(e) => setNewClient({ ...newClient, whatsapp: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">E-mail</label>
                    <input
                      type="email"
                      value={newClient.email}
                      onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Endereço</label>
                    <input
                      type="text"
                      value={newClient.address}
                      onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
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
                    {isEditMode ? 'Salvar Alterações' : 'Salvar Cliente'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Novo Equipamento */}
      <AnimatePresence>
        {isEquipmentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEquipmentModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#1E1E1E] rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <h3 className="text-xl sm:text-2xl font-bold">Novo Equipamento</h3>
                <button onClick={() => setIsEquipmentModalOpen(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateEquipment} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:gap-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Tipo (ex: Notebook, Celular)</label>
                    <input
                      type="text"
                      required
                      value={newEquipment.type}
                      onChange={(e) => setNewEquipment({ ...newEquipment, type: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-white/40">Marca</label>
                      <input
                        type="text"
                        required
                        value={newEquipment.brand}
                        onChange={(e) => setNewEquipment({ ...newEquipment, brand: e.target.value })}
                        className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                      />
                    </div>
                    <div className="space-y-1.5 sm:space-y-2">
                      <label className="text-xs sm:text-sm font-medium text-white/40">Modelo</label>
                      <input
                        type="text"
                        required
                        value={newEquipment.model}
                        onChange={(e) => setNewEquipment({ ...newEquipment, model: e.target.value })}
                        className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Número de Série</label>
                    <input
                      type="text"
                      value={newEquipment.serial_number}
                      onChange={(e) => setNewEquipment({ ...newEquipment, serial_number: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                </div>

                <div className="flex gap-3 sm:gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEquipmentModalOpen(false)}
                    className="flex-1 py-3 sm:py-4 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all text-sm sm:text-base"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 sm:py-4 bg-[#0A84FF] hover:bg-[#0070E0] rounded-xl font-bold transition-all text-sm sm:text-base"
                  >
                    Salvar Equipamento
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
