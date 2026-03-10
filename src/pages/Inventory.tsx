import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Search, Plus, Package, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Inventory() {
  const token = useAuthStore((state) => state.token);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: items, isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: async () => {
      const res = await fetch('/api/inventory', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

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
        <button className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20">
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
    </div>
  );
}
