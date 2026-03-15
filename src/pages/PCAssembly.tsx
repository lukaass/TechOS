import React, { useState } from 'react';
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
  ShoppingCart,
  Minus,
  Box
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BuildPart {
  id: string;
  category: string;
  item?: InventoryItem;
  customName?: string;
  customPrice?: number;
  quantity: number;
}

const CATEGORIES = [
  { id: 'cpu', label: 'Processador', icon: Cpu },
  { id: 'mobo', label: 'Placa-mãe', icon: Package },
  { id: 'ram', label: 'Memória RAM', icon: Monitor },
  { id: 'gpu', label: 'Placa de Vídeo', icon: Monitor },
  { id: 'storage', label: 'Armazenamento', icon: HardDrive },
  { id: 'psu', label: 'Fonte', icon: Package },
  { id: 'case', label: 'Gabinete', icon: Package },
  { id: 'cooler', label: 'Cooler', icon: Cpu },
  { id: 'other', label: 'Outros', icon: Box },
];

export default function PCAssembly() {
  const navigate = useNavigate();
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [buildParts, setBuildParts] = useState<BuildPart[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('cpu');

  const clients = useLiveQuery(() => db.clients.toArray(), []);
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);

  const handleAddPart = (item: InventoryItem | { name: string; sale_price: number }) => {
    const isInventoryItem = 'id' in item;
    
    setBuildParts(prev => {
      // Check if item already exists in build to increment quantity
      if (isInventoryItem) {
        const existing = prev.find(p => p.item?.id === item.id);
        if (existing) {
          return prev.map(p => p.item?.id === item.id ? { ...p, quantity: p.quantity + 1 } : p);
        }
      }

      const newPart: BuildPart = {
        id: Math.random().toString(36).substr(2, 9),
        category: activeCategory,
        item: isInventoryItem ? item : undefined,
        customName: !isInventoryItem ? item.name : undefined,
        customPrice: !isInventoryItem ? item.sale_price : undefined,
        quantity: 1
      };
      return [...prev, newPart];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setBuildParts(prev => prev.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.quantity + delta);
        return { ...p, quantity: newQty };
      }
      return p;
    }));
  };

  const handleRemovePart = (id: string) => {
    setBuildParts(prev => prev.filter(p => p.id !== id));
  };

  const calculateTotal = () => {
    return buildParts.reduce((acc, part) => {
      const price = part.item?.sale_price || part.customPrice || 0;
      return acc + (price * part.quantity);
    }, 0);
  };

  const handleCreateAssemblyOS = async () => {
    if (!selectedClientId) {
      alert('Por favor, selecione um cliente.');
      return;
    }

    if (buildParts.length === 0) {
      alert('Adicione pelo menos uma peça ao projeto.');
      return;
    }

    try {
      const osId = await db.service_orders.add({
        client_id: Number(selectedClientId),
        problem_description: `Montagem de PC Personalizado. Configuração: ${buildParts.map(p => `${p.quantity}x ${p.item?.name || p.customName}`).join(', ')}`,
        status: 'pending_diagnosis',
        type: 'assembly',
        total_worked_time: 0,
        created_at: new Date().toISOString()
      });

      for (const part of buildParts) {
        if (part.item?.id) {
          await db.os_parts.add({
            os_id: osId as number,
            part_id: part.item.id,
            quantity: part.quantity,
            unit_price: part.item.sale_price
          });
        } else if (part.customName) {
          await db.os_services.add({
            os_id: osId as number,
            description: `Peça: ${part.customName} (x${part.quantity})`,
            price: (part.customPrice || 0) * part.quantity
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Montagem Modular</h2>
          <p className="text-sm text-white/40">Adicione componentes ao seu "gabinete virtual"</p>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-4 bg-[#1E1E1E] sm:bg-transparent p-4 sm:p-0 rounded-2xl border border-white/5 sm:border-none">
          <div className="text-left sm:text-right">
            <p className="text-[10px] sm:text-xs text-white/40 uppercase font-bold">Total do Projeto</p>
            <p className="text-xl sm:text-2xl font-bold text-green-400">R$ {calculateTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <button 
            onClick={handleCreateAssemblyOS}
            className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20 text-sm sm:text-base"
          >
            Gerar Orçamento
            <ArrowRight size={18} className="sm:w-5 sm:h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Virtual Case / Build List */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-[#1E1E1E] p-4 sm:p-6 rounded-3xl border border-white/5 min-h-[400px] sm:min-h-[600px] flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#0A84FF]/10 rounded-xl sm:rounded-2xl flex items-center justify-center text-[#0A84FF]">
                  <Box size={20} className="sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">Gabinete Virtual</h3>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Configuração Atual</p>
                </div>
              </div>
              <div className="bg-white/5 rounded-xl px-4 py-2 sm:py-3">
                <label className="text-[10px] font-bold text-white/40 uppercase block mb-0.5 sm:mb-1">Cliente</label>
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none w-full"
                >
                  <option value="">Selecionar Cliente...</option>
                  {clients?.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 space-y-3">
              <AnimatePresence mode="popLayout">
                {buildParts.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center py-12 sm:py-20"
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/2 rounded-full flex items-center justify-center mb-4 border border-dashed border-white/10">
                      <Plus size={24} className="sm:w-8 sm:h-8 text-white/10" />
                    </div>
                    <p className="text-sm text-white/40 font-medium px-4">Seu gabinete está vazio.<br/>Comece adicionando peças do catálogo.</p>
                  </motion.div>
                ) : (
                  buildParts.map((part) => {
                    const category = CATEGORIES.find(c => c.id === part.category);
                    return (
                      <motion.div
                        key={part.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white/2 border border-white/5 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-[#0A84FF]/30 transition-all"
                      >
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 bg-[#0A84FF] rounded-xl flex-shrink-0 flex items-center justify-center text-white shadow-lg shadow-[#0A84FF]/20">
                            {category ? <category.icon size={20} /> : <Package size={20} />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{category?.label || 'Peça'}</p>
                            <p className="font-bold text-sm truncate pr-2">{part.item?.name || part.customName}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 w-full sm:w-auto border-t sm:border-none border-white/5 pt-3 sm:pt-0">
                          <div className="flex items-center gap-3 bg-black/20 rounded-xl p-1 border border-white/5">
                            <button 
                              onClick={() => handleUpdateQuantity(part.id, -1)}
                              className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="text-xs sm:text-sm font-bold w-4 text-center">{part.quantity}</span>
                            <button 
                              onClick={() => handleUpdateQuantity(part.id, 1)}
                              className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
                            >
                              <Plus size={14} />
                            </button>
                          </div>

                          <div className="text-right min-w-[80px] sm:min-w-[100px]">
                            <p className="text-[10px] text-white/40 uppercase font-bold sm:hidden">Subtotal</p>
                            <p className="font-bold text-[#0A84FF] text-sm sm:text-base">
                              R$ {((part.item?.sale_price || part.customPrice || 0) * part.quantity).toLocaleString('pt-BR')}
                            </p>
                          </div>

                          <button 
                            onClick={() => handleRemovePart(part.id)}
                            className="text-white/20 hover:text-red-400 p-2 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Catalog Selector */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#1E1E1E] p-4 sm:p-6 rounded-3xl border border-white/5 h-fit lg:sticky lg:top-24">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <ShoppingCart size={20} className="sm:w-6 sm:h-6 text-[#0A84FF]" />
                Catálogo de Peças
              </h3>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-3 sm:px-4 py-2 rounded-xl text-[10px] sm:text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    activeCategory === cat.id 
                      ? 'bg-[#0A84FF] text-white shadow-lg shadow-[#0A84FF]/20' 
                      : 'bg-white/5 text-white/40 hover:bg-white/10'
                  }`}
                >
                  <cat.icon size={14} />
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
              <input
                type="text"
                placeholder={`Buscar em ${CATEGORIES.find(c => c.id === activeCategory)?.label}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-2.5 sm:py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
              />
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Manual Entry for active category */}
              <div className="p-3 sm:p-4 bg-white/5 rounded-2xl border border-dashed border-white/10 mb-4">
                <p className="text-[10px] font-bold text-white/40 uppercase mb-3 tracking-widest">Item Personalizado</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Nome da peça..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#0A84FF]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        if (val) {
                          handleAddPart({ name: val, sale_price: 0 });
                          (e.target as HTMLInputElement).value = '';
                        }
                      }
                    }}
                  />
                  <button 
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                      if (input.value) {
                        handleAddPart({ name: input.value, sale_price: 0 });
                        input.value = '';
                      }
                    }}
                    className="bg-[#0A84FF] text-white p-2 rounded-lg hover:bg-[#0070E0] transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              {filteredInventory
                ?.filter(item => activeCategory === 'other' || item.category.toLowerCase().includes(activeCategory.toLowerCase()) || item.category.toLowerCase().includes(CATEGORIES.find(c => c.id === activeCategory)?.label.toLowerCase() || ''))
                .map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddPart(item)}
                  className="w-full p-3 sm:p-4 rounded-2xl border border-white/5 bg-white/2 text-left transition-all hover:border-[#0A84FF]/50 hover:bg-white/5 group"
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <p className="font-bold text-xs sm:text-sm group-hover:text-[#0A84FF] transition-colors truncate">{item.name}</p>
                    <p className="text-[10px] sm:text-xs font-bold text-[#0A84FF] whitespace-nowrap">R$ {item.sale_price.toLocaleString('pt-BR')}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[9px] sm:text-[10px] text-white/40 uppercase font-bold tracking-widest">{item.category}</p>
                    <div className="flex items-center gap-2">
                      <p className={`text-[9px] sm:text-[10px] font-bold ${item.quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        Qtd: {item.quantity}
                      </p>
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-[#0A84FF]/10 flex items-center justify-center text-[#0A84FF] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                        <Plus size={12} className="sm:w-3.5 sm:h-3.5" />
                      </div>
                    </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
