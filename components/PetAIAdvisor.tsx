
import React, { useState } from 'react';
import { Sparkles, MessageCircle, Send, Loader2, Dog, Cat } from 'lucide-react';
import { PetAIService } from '../services/geminiService';

const PetAIAdvisor: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [petType, setPetType] = useState('cão');
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    setLoading(true);
    const advice = await PetAIService.getPetAdvice(question, petType);
    setResponse(advice);
    setLoading(false);
  };

  return (
    <section className="py-20 bg-teal-50 border-y border-teal-100">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-teal-600 p-6 text-white flex items-center gap-3">
            <Sparkles className="w-8 h-8" />
            <div>
              <h3 className="text-xl font-bold">Assistente PetVibe AI</h3>
              <p className="text-teal-100 text-sm">Dúvidas sobre comportamento ou cuidados?</p>
            </div>
          </div>
          
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setPetType('cão')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${petType === 'cão' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-100 text-slate-500'}`}
                >
                  <Dog size={20} /> Cão
                </button>
                <button 
                  type="button"
                  onClick={() => setPetType('gato')}
                  className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${petType === 'gato' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-100 text-slate-500'}`}
                >
                  <Cat size={20} /> Gato
                </button>
              </div>

              <div className="relative">
                <textarea 
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ex: Por que meu gato está miando muito à noite?"
                  className="w-full p-4 pr-12 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none h-32 resize-none"
                />
                <button 
                  disabled={loading}
                  className="absolute bottom-4 right-4 bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
                </button>
              </div>
            </form>

            {response && (
              <div className="mt-8 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-fadeIn">
                <div className="flex gap-2 mb-2 text-teal-600">
                  <MessageCircle size={20} />
                  <span className="font-bold text-sm uppercase">Conselho da IA</span>
                </div>
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{response}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PetAIAdvisor;
