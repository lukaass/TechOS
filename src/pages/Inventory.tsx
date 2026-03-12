import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Package, AlertTriangle, X } from 'lucide-react';

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: '',
    quantity: 0,
    cost_price: 0,
    sale_price: 0,
    min_quantity: 5
  });

  const items = useLiveQuery(() => db.inventory.toArray(), []);
  const isLoading = items === undefined;

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.inventory.add({
        ...newItem,
        created_at: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewItem({ name: '', category: '', quantity: 0, cost_price: 0, sale_price: 0, min_quantity: 5 });
    } catch (err) {
      console.error('Erro ao adicionar item:', err);
    }
  };

  const filteredItems = items?.filter((item: any) => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Estoque</h2>
          <p className="text-white/40">Controle de peças e componentes</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20"
        >
          <Plus size={20} />
          Adicionar Item
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
        <input
          type="text"
          placeholder="Buscar no estoque..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1E1E1E] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {filteredItems?.map((item: any) => (
          <div key={item.id} className="bg-[#1E1E1E] p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-[#0A84FF]/30 transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center text-white/40">
                <Package size={20} className="sm:w-6 sm:h-6" />
              </div>
              {item.quantity <= item.min_quantity && (
                <div className="text-red-400 bg-red-400/10 p-1.5 sm:p-2 rounded-lg" title="Estoque Baixo">
                  <AlertTriangle size={14} className="sm:w-4 sm:h-4" />
                </div>
              )}
            </div>
            
            <h3 className="text-base sm:text-lg font-bold mb-1">{item.name}</h3>
            <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-4">{item.category}</p>
            
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[10px] text-white/40">Quantidade</p>
                <p className={`text-xl sm:text-2xl font-bold ${item.quantity <= item.min_quantity ? 'text-red-400' : 'text-white'}`}>
                  {item.quantity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-white/40">Preço Venda</p>
                <p className="text-base sm:text-lg font-bold text-green-400">R$ {item.sale_price?.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Novo Item */}
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
                <h3 className="text-xl sm:text-2xl font-bold">Novo Item no Estoque</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Nome do Item</label>
                    <input
                      type="text"
                      required
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Categoria</label>
                    <input
                      type="text"
                      required
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Quantidade Inicial</label>
                    <input
                      type="number"
                      required
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: Number(e.target.value) })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Preço de Custo (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newItem.cost_price}
                      onChange={(e) => setNewItem({ ...newItem, cost_price: Number(e.target.value) })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Preço de Venda (R$)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newItem.sale_price}
                      onChange={(e) => setNewItem({ ...newItem, sale_price: Number(e.target.value) })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Estoque Mínimo</label>
                    <input
                      type="number"
                      required
                      value={newItem.min_quantity}
                      onChange={(e) => setNewItem({ ...newItem, min_quantity: Number(e.target.value) })}
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
                    Adicionar Item
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
