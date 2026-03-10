import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  PauseCircle,
  Play,
  FileText,
  MessageSquare,
  Package,
  Wrench,
  Camera,
  QrCode,
  Share2,
  Printer,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
import SignaturePad from 'signature_pad';

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_diagnosis: { label: 'Aguardando Diagnóstico', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: AlertCircle },
  in_progress: { label: 'Em Andamento', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
  waiting_approval: { label: 'Aguardando Orçamento', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: AlertCircle },
  paused: { label: 'Pausado', color: 'text-white/40', bg: 'bg-white/5', icon: PauseCircle },
  finished: { label: 'Finalizado', color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle2 },
};

export default function OSDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const queryClient = useQueryClient();
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  const { data: os, isLoading } = useQuery({
    queryKey: ['os', id],
    queryFn: async () => {
      const res = await fetch(`/api/os/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, description }: { status: string; description?: string }) => {
      const res = await fetch(`/api/os/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status, description }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['os', id] }),
  });

  const handlePrint = () => {
    window.open(`/api/os/${id}/pdf?token=${token}`, '_blank');
  };

  const handleSignatureSave = () => {
    if (signaturePadRef.current?.isEmpty()) return;
    const dataUrl = signaturePadRef.current?.toDataURL();
    // In a real app, we would send this to the server
    console.log('Signature saved:', dataUrl);
    setIsSignatureModalOpen(false);
  };

  React.useEffect(() => {
    if (isSignatureModalOpen && signatureRef.current) {
      signaturePadRef.current = new SignaturePad(signatureRef.current);
    }
  }, [isSignatureModalOpen]);

  const handleWhatsApp = () => {
    const message = `Olá ${os.client_name}, sua ordem de serviço #${os.id} está com o status: ${status.label}.`;
    window.open(`https://wa.me/${os.client_whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) return <div className="flex items-center justify-center h-64">Carregando...</div>;

  const status = statusMap[os.status] || statusMap.pending_diagnosis;

  return (
    <div className="space-y-6 sm:space-y-8 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button onClick={() => navigate('/os')} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors w-fit">
          <ArrowLeft size={20} />
          Voltar
        </button>
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          <button onClick={handlePrint} className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white shrink-0">
            <Printer size={20} />
          </button>
          <button onClick={handleWhatsApp} className="p-2.5 sm:p-3 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-all text-green-500 shrink-0">
            <MessageSquare size={20} />
          </button>
          <button className="p-2.5 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/60 hover:text-white shrink-0">
            <Share2 size={20} />
          </button>
          <button className="p-2.5 sm:p-3 bg-[#0A84FF] hover:bg-[#0070E0] rounded-xl transition-all text-white font-bold px-4 sm:px-6 flex items-center gap-2 shrink-0">
            <Save size={20} />
            <span className="hidden xs:inline">Salvar</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
        <div className="lg:col-span-2 space-y-4 sm:space-y-8">
          {/* Header Card */}
          <div className="bg-[#1E1E1E] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-[#0A84FF] uppercase tracking-widest">Ordem de Serviço</span>
                <h1 className="text-2xl sm:text-4xl font-bold mt-1">#{os.id}</h1>
              </div>
              <div className={`flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base w-fit ${status.bg} ${status.color}`}>
                <status.icon size={18} />
                {status.label}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
              <div>
                <p className="text-[10px] sm:text-xs text-white/40 uppercase font-bold mb-1 sm:mb-2">Cliente</p>
                <p className="text-lg sm:text-xl font-bold">{os.client_name}</p>
                <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1">{os.client_phone}</p>
              </div>
              <div>
                <p className="text-[10px] sm:text-xs text-white/40 uppercase font-bold mb-1 sm:mb-2">Equipamento</p>
                <p className="text-lg sm:text-xl font-bold">{os.eq_brand} {os.eq_model}</p>
                <p className="text-xs sm:text-sm text-white/60 mt-0.5 sm:mt-1">S/N: {os.eq_serial}</p>
              </div>
            </div>
          </div>

          {/* Problem & Diagnostic */}
          <div className="bg-[#1E1E1E] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 space-y-6 sm:space-y-8">
            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-red-400" />
                Problema Relatado
              </h3>
              <div className="bg-white/2 p-4 sm:p-6 rounded-xl sm:rounded-2xl text-sm sm:text-base text-white/80 leading-relaxed">
                {os.problem_description}
              </div>
            </div>

            <div>
              <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center gap-2">
                <Wrench size={20} className="text-[#0A84FF]" />
                Diagnóstico Técnico
              </h3>
              <textarea
                className="w-full bg-white/2 border border-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-sm sm:text-base text-white/80 focus:outline-none focus:border-[#0A84FF] transition-colors min-h-[120px] sm:min-h-[150px]"
                placeholder="Descreva o diagnóstico técnico aqui..."
                defaultValue={os.diagnostic}
              />
            </div>
          </div>

          {/* Timeline / Logs */}
          <div className="bg-[#1E1E1E] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5">
            <h3 className="text-lg sm:text-xl font-bold mb-6 sm:mb-8">Evolução do Serviço</h3>
            <div className="space-y-6 sm:space-y-8 relative before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-white/5">
              {os.logs?.map((log: any) => (
                <div key={log.id} className="relative pl-10 sm:pl-12">
                  <div className="absolute left-0 top-1 w-6 h-6 sm:w-8 sm:h-8 bg-[#141414] border border-white/10 rounded-full flex items-center justify-center z-10">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#0A84FF] rounded-full" />
                  </div>
                  <div className="bg-white/2 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <p className="text-[10px] sm:text-xs font-bold text-white/40">{new Date(log.created_at).toLocaleString()}</p>
                      <p className="text-[10px] sm:text-xs text-[#0A84FF] font-bold">Técnico #{log.technician_id}</p>
                    </div>
                    <p className="text-xs sm:text-sm text-white/80">{log.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 sm:space-y-8">
          {/* Actions Card */}
          <div className="bg-[#1E1E1E] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 space-y-4">
            <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-4">Controle de Tempo</h3>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button 
                onClick={() => updateStatus.mutate({ status: 'in_progress', description: 'Serviço iniciado' })}
                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-green-400/10 text-green-400 rounded-xl sm:rounded-2xl hover:bg-green-400/20 transition-all gap-2"
              >
                <Play size={20} className="sm:w-6 sm:h-6" />
                <span className="text-[10px] font-bold uppercase">Iniciar</span>
              </button>
              <button 
                onClick={() => updateStatus.mutate({ status: 'paused', description: 'Serviço pausado' })}
                className="flex flex-col items-center justify-center p-3 sm:p-4 bg-white/5 text-white/40 rounded-xl sm:rounded-2xl hover:bg-white/10 transition-all gap-2"
              >
                <PauseCircle size={20} className="sm:w-6 sm:h-6" />
                <span className="text-[10px] font-bold uppercase">Pausar</span>
              </button>
            </div>
            <button 
              onClick={() => updateStatus.mutate({ status: 'finished', description: 'Serviço finalizado' })}
              className="w-full py-3 sm:py-4 bg-[#0A84FF] text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#0070E0] transition-all text-sm sm:text-base"
            >
              <CheckCircle2 size={20} />
              Finalizar OS
            </button>
          </div>

          {/* QR Code & Signature */}
          <div className="bg-[#1E1E1E] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 space-y-6">
            <div>
              <p className="text-[10px] sm:text-xs text-white/40 uppercase font-bold mb-3 sm:mb-4">Rastreamento</p>
              <div className="bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl inline-block">
                <img src={os.qr_code} alt="QR Code" className="w-24 h-24 sm:w-32 sm:h-32" />
              </div>
              <p className="text-[10px] text-white/20 mt-2">O cliente pode escanear para ver o status</p>
            </div>

            <div className="pt-6 border-t border-white/5">
              <p className="text-[10px] sm:text-xs text-white/40 uppercase font-bold mb-3 sm:mb-4">Assinatura Digital</p>
              {os.signature ? (
                <img src={os.signature} alt="Assinatura" className="w-full bg-white/5 rounded-xl" />
              ) : (
                <button 
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="w-full py-2.5 sm:py-3 border border-dashed border-white/10 rounded-xl text-white/40 hover:text-white hover:border-[#0A84FF] transition-all text-xs sm:text-sm flex items-center justify-center gap-2"
                >
                  <FileText size={16} />
                  Coletar Assinatura
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Signature Modal */}
      {isSignatureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsSignatureModalOpen(false)} />
          <div className="relative bg-[#1E1E1E] rounded-3xl p-8 border border-white/10 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-6">Assinatura do Cliente</h3>
            <div className="bg-white rounded-2xl overflow-hidden mb-6">
              <canvas ref={signatureRef} className="w-full h-64 touch-none" />
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => signaturePadRef.current?.clear()}
                className="flex-1 py-4 bg-white/5 rounded-xl font-bold"
              >
                Limpar
              </button>
              <button 
                onClick={handleSignatureSave}
                className="flex-1 py-4 bg-[#0A84FF] rounded-xl font-bold"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
