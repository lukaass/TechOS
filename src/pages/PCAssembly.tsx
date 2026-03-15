import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, InventoryItem } from '../db';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, 
  HardDrive, 
  Monitor, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Search,
  ArrowRight,
  Package,
  ShoppingCart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BuildPart {
  category: string;
  item?: InventoryItem;
  customName?: string;
}

const PC_CATEGORIES = [
  { id: 'cpu', label: 'Processador', icon: Cpu },
  { id: 'mobo', label: 'Placa-mãe', icon: Package },
  { id: 'ram', label: 'Memória RAM', icon: Monitor },
  { id: 'gpu', label: 'Placa de Vídeo', icon: Monitor },
  { id: 'storage', label: 'Armazenamento', icon: HardDrive },
  { id: 'psu', label: 'Fonte', icon: Package },
  { id: 'case', label: 'Gabinete', icon: Package },
  { id: 'cooler', label: 'Cooler', icon: Cpu },
];

export default function PCAssembly() {
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [buildParts, setBuildParts] = useState<Record<string, BuildPart>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const clients = useLiveQuery(() => db.clients.toArray(), []);
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);

  const handleAddPart = (category: string, item: InventoryItem) => {
    setBuildParts(prev => ({
      ...prev,
      [category]: { category, item }
    }));
    setActiveCategory(null);
  };

  const handleRemovePart = (category: string) => {
    const newParts = { ...buildParts };
    delete newParts[category];
    setBuildParts(newParts);
  };

  const calculateTotal = () => {
    return Object.values(buildParts).reduce((acc, part) => {
      return acc + (part.item?.sale_price || 0);
    }, 0);
  };

  const handleCreateAssemblyOS = async () => {
    if (!selectedClientId) {
      alert('Por favor, selecione um cliente.');
      return;
    }

    try {
      const osId = await db.service_orders.add({
        client_id: Number(selectedClientId),
        problem_description: `Montagem de PC Personalizado. Configuração: ${Object.values(buildParts).map(p => p.item?.name).join(', ')}`,
        status: 'pending_diagnosis',
        type: 'assembly',
        total_worked_time: 0,
        created_at: new Date().toISOString()
      });

      // Add parts to OS
      for (const part of Object.values(buildParts)) {
        if (part.item?.id) {
          await db.os_parts.add({
            os_id: osId as number,
            part_id: part.item.id,
            quantity: 1,
            unit_price: part.item.sale_price
          });
        }
      }

      navigate(`/os/${osId}`);
    } catch (err) {
      console.error('Erro ao criar OS de montagem:', err);
    }
  };

  const filteredInventory = inventory?.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Montagem de PC</h2>
          <p className="text-white/40">Configure e orce a montagem de um novo computador</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-white/40 uppercase font-bold">Total Estimado</p>
            <p className="text-2xl font-bold text-green-400">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <button 
            onClick={handleCreateAssemblyOS}
            className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20"
          >
            Gerar Orçamento
            <ArrowRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Build Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1E1E1E] p-6 rounded-3xl border border-white/5 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-white/40">Cliente do Projeto</label>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0A84FF]"
              >
                <option value="">Selecione um cliente...</option>
                {clients?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PC_CATEGORIES.map((cat) => {
                const selected = buildParts[cat.id];
                return (
                  <div 
                    key={cat.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      selected 
                        ? 'bg-[#0A84FF]/5 border-[#0A84FF]/20' 
                        : 'bg-white/2 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          selected ? 'bg-[#0A84FF] text-white' : 'bg-white/5 text-white/40'
                        }`}>
                          <cat.icon size={20} />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-white/40">{cat.label}</p>
                          {selected && (
                            <p className="font-bold text-sm truncate max-w-[150px]">{selected.item?.name}</p>
                          )}
                        </div>
                      </div>
                      {selected ? (
                        <button 
                          onClick={() => handleRemovePart(cat.id)}
                          className="text-red-400 hover:text-red-300 p-2"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => setActiveCategory(cat.id)}
                          className="bg-[#0A84FF] text-white p-2 rounded-lg hover:bg-[#0070E0]"
                        >
                          <Plus size={18} />
                        </button>
                      )}
                    </div>
                    
                    {selected && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          {selected.item && selected.item.quantity > 0 ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
                              <CheckCircle2 size={10} /> EM ESTOQUE
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full">
                              <AlertTriangle size={10} /> ENCOMENDAR
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-bold">R$ {selected.item?.sale_price.toLocaleString('pt-BR')}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inventory Selector */}
        <div className="space-y-6">
          {/* Project Status Summary */}
          <div className="bg-[#1E1E1E] p-6 rounded-3xl border border-white/5">
            <h3 className="text-lg font-bold mb-4">Status do Projeto</h3>
            <div className="space-y-3">
              {PC_CATEGORIES.map(cat => {
                const selected = buildParts[cat.id];
                const inStock = selected?.item && selected.item.quantity > 0;
                
                return (
                  <div key={cat.id} className="flex items-center justify-between text-xs">
                    <span className="text-white/40">{cat.label}</span>
                    {selected ? (
                      inStock ? (
                        <span className="text-green-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> OK
                        </span>
                      ) : (
                        <span className="text-orange-400 font-bold flex items-center gap-1">
                          <ShoppingCart size={12} /> COMPRAR
                        </span>
                      )
                    ) : (
                      <span className="text-red-400 font-bold flex items-center gap-1">
                        <AlertTriangle size={12} /> FALTANDO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#1E1E1E] p-6 rounded-3xl border border-white/5 h-fit sticky top-24">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <ShoppingCart size={24} className="text-[#0A84FF]" />
              {activeCategory ? `Selecionar ${PC_CATEGORIES.find(c => c.id === activeCategory)?.label}` : 'Estoque de Peças'}
            </h3>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text"
                placeholder="Buscar peças..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredInventory?.map((item) => (
                <button
                  key={item.id}
                  disabled={!activeCategory}
                  onClick={() => activeCategory && handleAddPart(activeCategory, item)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all ${
                    activeCategory 
                      ? 'bg-white/2 border-white/5 hover:border-[#0A84FF]/50 hover:bg-white/5' 
                      : 'bg-white/1 border-white/5 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm">{item.name}</p>
                    <p className="text-xs font-bold text-[#0A84FF]">R$ {item.sale_price.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">{item.category}</p>
                    <p className={`text-[10px] font-bold ${item.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      Qtd: {item.quantity}
                    </p>
                  </div>
                </button>
              ))}
              {filteredInventory?.length === 0 && (
                <div className="text-center py-8">
                  <Package size={48} className="mx-auto text-white/10 mb-2" />
                  <p className="text-white/40 text-sm">Nenhuma peça encontrada</p>
                </div>
              )}
            </div>

            {!activeCategory && (
              <div className="mt-6 p-4 bg-[#0A84FF]/10 rounded-2xl border border-[#0A84FF]/20">
                <p className="text-xs text-[#0A84FF] font-medium text-center">
                  Clique no botão "+" de uma categoria para selecionar uma peça do estoque.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
