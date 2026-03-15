import React from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  Package, 
  Calendar, 
  BookOpen, 
  DollarSign, 
  LogOut, 
  Menu, 
  X,
  Plus,
  Search,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  User as UserIcon,
  Cpu
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Pages ---
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ServiceOrders from './pages/ServiceOrders';
import Inventory from './pages/Inventory';
import KnowledgeBase from './pages/KnowledgeBase';
import OSDetail from './pages/OSDetail';
import Financial from './pages/Financial';
import Schedule from './pages/Schedule';
import Settings from './pages/Settings';
import PCAssembly from './pages/PCAssembly';

function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: ClipboardList, label: 'Ordens de Serviço', path: '/os' },
    { icon: Cpu, label: 'Montagem de PC', path: '/pc-assembly' },
    { icon: Users, label: 'Clientes', path: '/clients' },
    { icon: Package, label: 'Estoque', path: '/inventory' },
    { icon: BookOpen, label: 'Base de Conhecimento', path: '/knowledge' },
    { icon: Calendar, label: 'Agenda', path: '/schedule' },
    { icon: DollarSign, label: 'Financeiro', path: '/financial' },
    { icon: UserIcon, label: 'Configurações', path: '/settings' },
  ];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#1E1E1E] border-r border-white/5 z-50 lg:translate-x-0 transition-transform duration-300"
      >
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#0A84FF]">TechOS</h1>
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-white/60">
            <X size={24} />
          </button>
        </div>

        <nav className="mt-4 px-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-8 left-0 right-0 px-8">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-3 text-red-400 hover:text-red-300 transition-colors w-full"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen bg-[#141414] text-white flex">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <main className="flex-1 lg:ml-[280px] min-w-0">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 sm:px-6 sticky top-0 bg-[#141414]/80 backdrop-blur-md z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white/60 p-2 -ml-2">
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <Link to="/settings" className="flex items-center gap-4 hover:bg-white/5 p-2 rounded-2xl transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-white/40 capitalize">{user?.role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#0A84FF] flex items-center justify-center font-bold">
                {user?.name?.[0]}
              </div>
            </Link>
          </div>
        </header>

        <div className="p-4 sm:p-6 max-w-7xl mx-auto overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const token = useAuthStore((state) => state.token);

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" /> : <Login />} />
      <Route
        path="/*"
        element={
          token ? (
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/os" element={<ServiceOrders />} />
                <Route path="/os/:id" element={<OSDetail />} />
                <Route path="/pc-assembly" element={<PCAssembly />} />
                <Route path="/inventory" element={<Inventory />} />
                <Route path="/knowledge" element={<KnowledgeBase />} />
                <Route path="/financial" element={<Financial />} />
                <Route path="/schedule" element={<Schedule />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}
