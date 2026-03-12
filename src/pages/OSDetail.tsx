import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
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
  Wrench,
  Share2,
  Printer,
  Save,
  X
} from 'lucide-react';
import SignaturePad from 'signature_pad';

const statusMap: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_diagnosis: { label: 'Aguardando Diagnóstico', color: 'text-blue-400', bg: 'bg-blue-400/10', icon: AlertCircle },
  in_progress: { label: 'Em Andamento', color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Clock },
  waiting_approval: { label: 'Aguardando Orçamento', color: 'text-orange-400', bg: 'bg-orange-400/10', icon: AlertCircle },
  paused: { label: 'Pausado', color: 'text-white/40', bg: 'bg-white/5', icon: PauseCircle },
  finished: { label: 'Finalizado', color: 'text-green-400', bg: 'bg-green-400/10', icon: CheckCircle2 },
  rejected: { label: 'Reprovado', color: 'text-red-400', bg: 'bg-red-400/10', icon: X },
};

export default function OSDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [diagnostic, setDiagnostic] = useState('');
  const [newLog, setNewLog] = useState('');
  const signatureRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  const os = useLiveQuery(async () => {
    const osId = parseInt(id!);
    const data = await db.service_orders.get(osId);
    if (!data) return null;

    if (diagnostic === '') setDiagnostic(data.diagnostic || '');

    const client = await db.clients.get(data.client_id);
    const equipment = await db.equipment.get(data.equipment_id);
    const logs = await db.os_logs.where('os_id').equals(osId).toArray();
    const parts = await db.os_parts.where('os_id').equals(osId).toArray();
    const services = await db.os_services.where('os_id').equals(osId).toArray();

    return {
      ...data,
      client_name: client?.name,
      client_phone: client?.phone,
      client_whatsapp: client?.whatsapp,
      eq_brand: equipment?.brand,
      eq_model: equipment?.model,
      eq_serial: equipment?.serial_number,
      logs,
      parts,
      services
    };
  }, [id]);

  const handleUpdateStatus = async (status: string, description: string) => {
    const osId = parseInt(id!);
    await db.service_orders.update(osId, { status });
    await db.os_logs.add({
      os_id: osId,
      technician_id: user?.id || 0,
      description,
      created_at: new Date().toISOString()
    });
  };

  const handleAddLog = async () => {
    if (!newLog.trim()) return;
    const osId = parseInt(id!);
    await db.os_logs.add({
      os_id: osId,
      technician_id: user?.id || 0,
      description: newLog,
      created_at: new Date().toISOString()
    });
    setNewLog('');
  };

  const handleSaveOS = async () => {
    const osId = parseInt(id!);
    await db.service_orders.update(osId, { diagnostic });
    alert('Alterações salvas com sucesso!');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSignatureSave = async () => {
    if (signaturePadRef.current?.isEmpty()) return;
    const dataUrl = signaturePadRef.current?.toDataURL();
    await db.service_orders.update(parseInt(id!), { signature: dataUrl });
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

  if (!os) return <div className="flex items-center justify-center h-64">Carregando...</div>;

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
          <button 
            onClick={handleSaveOS}
            className="p-2.5 sm:p-3 bg-[#0A84FF] hover:bg-[#0070E0] rounded-xl transition-all text-white font-bold px-4 sm:px-6 flex items-center gap-2 shrink-0"
          >
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
                value={diagnostic}
                onChange={(e) => setDiagnostic(e.target.value)}
              />
            </div>
          </div>

          {/* Timeline / Logs */}
          <div className="bg-[#1E1E1E] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5">
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <h3 className="text-lg sm:text-xl font-bold">Evolução do Serviço</h3>
            </div>

            {/* New Log Input */}
            <div className="mb-8 flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Adicionar atualização ao serviço..."
                value={newLog}
                onChange={(e) => setNewLog(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLog()}
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0A84FF]"
              />
              <button
                onClick={handleAddLog}
                className="bg-[#0A84FF] hover:bg-[#0070E0] text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shrink-0"
              >
                Adicionar
              </button>
            </div>

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
            <h3 className="text-base sm:text-lg font-bold mb-2 sm:mb-4">Gestão da OS</h3>
            
            {os.status === 'pending_diagnosis' && (
              <button 
                onClick={() => handleUpdateStatus('waiting_approval', 'Diagnóstico concluído, aguardando aprovação do orçamento')}
                className="w-full py-3 sm:py-4 bg-orange-500 text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-orange-600 transition-all text-sm sm:text-base"
              >
                <AlertCircle size={20} />
                Enviar para Orçamento
              </button>
            )}

            {os.status === 'waiting_approval' && (
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => handleUpdateStatus('in_progress', 'Orçamento aprovado pelo cliente')}
                  className="w-full py-3 sm:py-4 bg-green-500 text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-600 transition-all text-sm sm:text-base"
                >
                  <CheckCircle2 size={20} />
                  Aprovar Orçamento
                </button>
                <button 
                  onClick={() => handleUpdateStatus('rejected', 'Orçamento reprovado pelo cliente')}
                  className="w-full py-3 sm:py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all text-sm sm:text-base"
                >
                  <X size={20} />
                  Reprovar Orçamento
                </button>
              </div>
            )}

            {(os.status === 'in_progress' || os.status === 'paused') && (
              <>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <button 
                    onClick={() => handleUpdateStatus('in_progress', 'Serviço retomado')}
                    disabled={os.status === 'in_progress'}
                    className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all gap-2 ${
                      os.status === 'in_progress' 
                        ? 'bg-green-400/5 text-green-400/20 cursor-not-allowed' 
                        : 'bg-green-400/10 text-green-400 hover:bg-green-400/20'
                    }`}
                  >
                    <Play size={20} className="sm:w-6 sm:h-6" />
                    <span className="text-[10px] font-bold uppercase">Iniciar</span>
                  </button>
                  <button 
                    onClick={() => handleUpdateStatus('paused', 'Serviço pausado')}
                    disabled={os.status === 'paused'}
                    className={`flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl sm:rounded-2xl transition-all gap-2 ${
                      os.status === 'paused' 
                        ? 'bg-white/2 text-white/10 cursor-not-allowed' 
                        : 'bg-white/5 text-white/40 hover:bg-white/10'
                    }`}
                  >
                    <PauseCircle size={20} className="sm:w-6 sm:h-6" />
                    <span className="text-[10px] font-bold uppercase">Pausar</span>
                  </button>
                </div>
                <button 
                  onClick={() => handleUpdateStatus('finished', 'Serviço finalizado')}
                  className="w-full py-3 sm:py-4 bg-[#0A84FF] text-white rounded-xl sm:rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-[#0070E0] transition-all text-sm sm:text-base"
                >
                  <CheckCircle2 size={20} />
                  Finalizar OS
                </button>
              </>
            )}

            {(os.status === 'finished' || os.status === 'rejected') && (
              <div className={`p-4 rounded-2xl border text-center ${
                os.status === 'finished' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                <p className="font-bold uppercase text-xs tracking-widest mb-1">Status Final</p>
                <p className="text-lg font-bold">{status.label}</p>
              </div>
            )}
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
