import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { motion } from 'framer-motion';
import { LogIn, ShieldCheck } from 'lucide-react';
import { db } from '../db';
import * as bcrypt from 'bcryptjs';

export default function Login() {
  const [email, setEmail] = useState('admin@techos.com');
  const [password, setPassword] = useState('admin');
  const [error, setError] = useState('');
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = await db.users.where('email').equals(email).first();
      
      if (user && user.password && bcrypt.compareSync(password, user.password)) {
        // In a real local app, we don't need a token, but we'll use a dummy one to keep the store working
        setAuth('local-session-token', { 
          id: user.id!, 
          name: user.name, 
          role: user.role 
        });
      } else {
        setError('E-mail ou senha inválidos');
      }
    } catch (err) {
      setError('Erro ao acessar banco de dados local');
    }
  };

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-[#1E1E1E] rounded-3xl p-8 border border-white/5 shadow-2xl"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#0A84FF] rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(10,132,255,0.3)]">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">TechOS</h1>
          <p className="text-white/40 text-sm mt-2">Acesse sua conta técnica</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center bg-red-400/10 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            className="w-full bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0A84FF]/20"
          >
            <LogIn size={20} />
            Entrar no Sistema
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <p className="text-white/20 text-xs">TechOS v1.0.0 &copy; 2024</p>
        </div>
      </motion.div>
    </div>
  );
}
