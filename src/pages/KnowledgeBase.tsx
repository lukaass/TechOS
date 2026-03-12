import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, BookOpen, ChevronRight, X } from 'lucide-react';

export default function KnowledgeBase() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [newArticle, setNewArticle] = useState({
    title: '',
    problem: '',
    solution: '',
    category: ''
  });

  const articles = useLiveQuery(() => db.knowledge_base.toArray(), []);
  const isLoading = articles === undefined;

  const handleCreateArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.knowledge_base.add({
        ...newArticle,
        created_at: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNewArticle({ title: '', problem: '', solution: '', category: '' });
    } catch (err) {
      console.error('Erro ao criar artigo:', err);
    }
  };

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
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#0A84FF]/20"
        >
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
          <div 
            key={article.id} 
            onClick={() => {
              setSelectedArticle(article);
              setIsDetailsOpen(true);
            }}
            className="bg-[#1E1E1E] p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-white/5 hover:border-[#0A84FF]/30 transition-all group cursor-pointer"
          >
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

      {/* Modal Detalhes do Artigo */}
      <AnimatePresence>
        {isDetailsOpen && selectedArticle && (
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
              className="relative w-full max-w-3xl bg-[#1E1E1E] rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-white/10 shadow-2xl overflow-y-auto max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#0A84FF] bg-[#0A84FF]/10 px-2 py-1 rounded mb-2 inline-block">
                    {selectedArticle.category}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold">{selectedArticle.title}</h3>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-white/2 p-4 rounded-2xl border border-white/5">
                  <h4 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-2">Problema / Sintoma</h4>
                  <p className="text-white/80">{selectedArticle.problem}</p>
                </div>
                
                <div className="bg-[#0A84FF]/5 p-6 rounded-2xl border border-[#0A84FF]/10">
                  <h4 className="text-sm font-bold text-[#0A84FF] uppercase tracking-wider mb-3">Solução / Procedimento</h4>
                  <div className="text-white/90 whitespace-pre-wrap leading-relaxed">
                    {selectedArticle.solution}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex justify-end">
                <button
                  onClick={() => setIsDetailsOpen(false)}
                  className="px-8 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Novo Artigo */}
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
                <h3 className="text-xl sm:text-2xl font-bold">Novo Artigo</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-white/40 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateArticle} className="space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Título</label>
                    <input
                      type="text"
                      required
                      value={newArticle.title}
                      onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Categoria</label>
                    <input
                      type="text"
                      required
                      value={newArticle.category}
                      onChange={(e) => setNewArticle({ ...newArticle, category: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF]"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Problema / Sintoma</label>
                    <textarea
                      required
                      rows={3}
                      value={newArticle.problem}
                      onChange={(e) => setNewArticle({ ...newArticle, problem: e.target.value })}
                      className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-[#0A84FF] resize-none"
                    />
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <label className="text-xs sm:text-sm font-medium text-white/40">Solução / Procedimento</label>
                    <textarea
                      required
                      rows={5}
                      value={newArticle.solution}
                      onChange={(e) => setNewArticle({ ...newArticle, solution: e.target.value })}
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
                    Salvar Artigo
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
