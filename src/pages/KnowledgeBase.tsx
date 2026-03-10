import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { Search, Plus, BookOpen, ChevronRight, Hash, Tag } from 'lucide-react';

export default function KnowledgeBase() {
  const token = useAuthStore((state) => state.token);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: articles, isLoading } = useQuery({
    queryKey: ['knowledge'],
    queryFn: async () => {
      const res = await fetch('/api/knowledge', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const filteredArticles = articles?.filter((a: any) => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold">Base de Conhecimento</h2>
          <p className="text-white/40">Soluções técnicas e procedimentos</p>
        </div>
        <button className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20">
          <Plus size={20} />
          Novo Artigo
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={20} />
        <input
          type="text"
          placeholder="Pesquisar soluções, problemas ou categorias..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-[#1E1E1E] border border-white/5 rounded-2xl pl-12 pr-6 py-4 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
        />
      </div>

      <div className="space-y-3 sm:space-y-4">
        {filteredArticles?.map((article: any) => (
          <div key={article.id} className="bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-[#0A84FF]/30 transition-all group cursor-pointer">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-[#0A84FF]/10 text-[#0A84FF] rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                <BookOpen size={20} className="sm:w-7 sm:h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-1">
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-white/20 bg-white/5 px-1.5 sm:px-2 py-0.5 rounded">
                    {article.category}
                  </span>
                  <span className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-[#0A84FF]">
                    ID #{article.id}
                  </span>
                </div>
                <h3 className="text-base sm:text-xl font-bold mb-1 sm:mb-2 group-hover:text-[#0A84FF] transition-colors truncate">{article.title}</h3>
                <p className="text-white/40 text-xs sm:text-sm line-clamp-2">{article.problem}</p>
              </div>
              <div className="self-center text-white/20 group-hover:text-white transition-colors">
                <ChevronRight size={20} className="sm:w-6 sm:h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
