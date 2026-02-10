
import React, { useState, useRef } from 'react';
import { Sparkles, Upload, Loader2, Image as ImageIcon, CheckCircle2 } from 'lucide-react';
// Fix: Import PetAIService instead of the non-existent GeminiService member.
import { PetAIService } from '../services/geminiService';

const AIImageEditor: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [editedImage, setEditedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setEditedImage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!image || !prompt) return;
    setLoading(true);
    try {
      // Fix: Use the correctly exported PetAIService.
      const result = await PetAIService.editImage(image, prompt);
      if (result) {
        setEditedImage(result);
      }
    } catch (error) {
      alert("Erro ao editar imagem. Verifique sua conexão ou API Key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="ai-lab" className="py-20 bg-slate-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="bg-emerald-100 text-emerald-700 px-4 py-1 rounded-full text-sm font-semibold uppercase tracking-wider">InnoviQ AI Lab</span>
          <h2 className="text-4xl font-bold mt-4 mb-4">Edição de Imagens Inteligente</h2>
          <p className="text-slate-600 max-w-2xl mx-auto">
            Experimente nossa tecnologia proprietária. Faça upload de uma imagem e peça para a IA editá-la conforme suas necessidades.
          </p>
        </div>

        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Control Panel */}
            <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-slate-100">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">1. Selecione sua imagem</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer group"
                  >
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleFileChange}
                      accept="image/*"
                    />
                    <Upload className="w-10 h-10 text-slate-300 group-hover:text-blue-500 mx-auto mb-3 transition-colors" />
                    <p className="text-slate-500 text-sm">Arraste ou clique para fazer upload</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">2. Descreva a alteração</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: 'Adicione um filtro vintage', 'Remova o fundo', 'Aumente o brilho'..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all h-32 resize-none"
                  />
                </div>

                <button 
                  onClick={handleEdit}
                  disabled={loading || !image || !prompt}
                  className="w-full bg-gradient-custom text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {loading ? 'Processando com IA...' : 'Gerar Edição'}
                </button>
              </div>
            </div>

            {/* Preview Panel */}
            <div className="p-8 lg:p-12 bg-slate-50 flex flex-col items-center justify-center min-h-[400px]">
              {!image && !editedImage ? (
                <div className="text-center text-slate-400">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Aguardando imagem para processamento</p>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col gap-4">
                  <div className="flex-1 relative rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center">
                    <img 
                      src={editedImage || image || ''} 
                      alt="Preview" 
                      className="max-h-full max-w-full object-contain"
                    />
                    {loading && (
                      <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
                          <span className="text-blue-600 font-semibold">Transformando...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center px-2">
                    <span className="text-xs font-medium text-slate-500 uppercase">
                      {editedImage ? 'Resultado da IA' : 'Original'}
                    </span>
                    {editedImage && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-bold">Edição Concluída</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIImageEditor;
