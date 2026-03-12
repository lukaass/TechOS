import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { db } from '../db';
import bcrypt from 'bcryptjs';
import { motion } from 'motion/react';
import { Save, Lock, User as UserIcon, Mail, X, Database, Download, Upload } from 'lucide-react';

export default function Settings() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleExport = async () => {
    try {
      const exportData: any = {};
      const tables = db.tables;
      
      for (const table of tables) {
        exportData[table.name] = await table.toArray();
      }

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `techos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Backup exportado com sucesso!' });
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Erro ao exportar backup.' });
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importData = JSON.parse(event.target?.result as string);
        
        // Confirm with user
        if (!window.confirm('Isso irá substituir todos os dados atuais. Deseja continuar?')) {
          return;
        }

        // Clear and restore tables
        for (const tableName in importData) {
          const table = db.table(tableName);
          if (table) {
            await table.clear();
            await table.bulkAdd(importData[tableName]);
          }
        }

        setMessage({ type: 'success', text: 'Dados restaurados com sucesso! Recarregando...' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        console.error(err);
        setMessage({ type: 'error', text: 'Erro ao importar backup. Verifique o arquivo.' });
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!user) return;

    try {
      await db.users.update(user.id, { name, email });
      updateUser({ ...user, name, email });
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil.' });
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!user) return;
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem.' });
      return;
    }

    try {
      const dbUser = await db.users.get(user.id);
      if (dbUser && dbUser.password && bcrypt.compareSync(currentPassword, dbUser.password)) {
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await db.users.update(user.id, { password: hashedPassword });
        setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: 'Senha atual incorreta.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erro ao alterar senha.' });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold">Configurações</h2>
        <p className="text-white/40">Gerencie sua conta e preferências</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1E1E1E] p-8 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#0A84FF]/10 text-[#0A84FF] rounded-xl flex items-center justify-center">
              <UserIcon size={20} />
            </div>
            <h3 className="text-xl font-bold">Perfil</h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Nome</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">E-mail (Login)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
          </form>
        </motion.div>

        {/* Password Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1E1E1E] p-8 rounded-3xl border border-white/5"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-400/10 text-orange-400 rounded-xl flex items-center justify-center">
              <Lock size={20} />
            </div>
            <h3 className="text-xl font-bold">Segurança</h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Senha Atual</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Nova Senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Confirmar Nova Senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#2A2A2A] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#0A84FF] transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Lock size={18} />
              Alterar Senha
            </button>
          </form>
        </motion.div>
      </div>

      {/* Backup & Restore Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1E1E1E] p-8 rounded-3xl border border-white/5"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-400/10 text-purple-400 rounded-xl flex items-center justify-center">
            <Database size={20} />
          </div>
          <h3 className="text-xl font-bold">Backup e Restauração</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-white/40 text-sm">
              Exporte todos os seus dados (clientes, OS, estoque, financeiro) para um arquivo JSON. 
              Você pode guardar este arquivo no seu computador ou pen drive como uma cópia de segurança.
            </p>
            <button
              onClick={handleExport}
              className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Download size={18} />
              Exportar Backup (.json)
            </button>
          </div>

          <div className="space-y-4 border-t md:border-t-0 md:border-l border-white/5 pt-6 md:pt-0 md:pl-6">
            <p className="text-white/40 text-sm">
              Restaure seus dados a partir de um arquivo de backup previamente exportado. 
              <span className="text-red-400 font-bold block mt-1">Atenção: Isso substituirá todos os dados atuais do sistema!</span>
            </p>
            <label className="w-full sm:w-auto bg-[#0A84FF] hover:bg-[#0070E0] text-white font-bold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-center">
              <Upload size={18} />
              Importar Backup
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </motion.div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`fixed bottom-8 right-8 px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}
        >
          {message.text}
          <button onClick={() => setMessage({ type: '', text: '' })} className="hover:opacity-70">
            <X size={18} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
