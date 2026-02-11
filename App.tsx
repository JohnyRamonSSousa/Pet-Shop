
import React, { useState, useEffect } from 'react';
import {
  Menu, X, Search, ShoppingCart, User as UserIcon,
  Heart, Calendar, MapPin, Phone, MessageCircle,
  Facebook, Instagram, ArrowRight, Star, Filter,
  ChevronDown, LogOut, Package, Settings, Trash2,
  Clock, PawPrint, ShieldCheck, Mail, Lock
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth } from './services/firebase';
import { PRODUCTS, PET_SERVICES } from './constants';
import { Product, User } from './types';


// --- State and Context ---
type View = 'home' | 'store' | 'services' | 'about' | 'contact' | 'appointment' | 'profile';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [cart, setCart] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Auth synchronization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || 'Usuário',
          email: firebaseUser.email || '',
          phone: '',
          pets: []
        });
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;

    try {
      if (authView === 'signup') {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        setUser({
          id: userCredential.user.uid,
          name: name,
          email: email,
          phone: '',
          pets: []
        });
      } else if (authView === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error("Auth error:", error);
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentView('home');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMenuOpen(false);
  }, [currentView]);

  const addToCart = (product: Product) => {
    setCart([...cart, product]);
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price, 0);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
        <div className="container mx-auto px-4 flex justify-between items-center h-20">
          <button
            onClick={() => setCurrentView('home')}
            className="flex items-center gap-2 group"
          >
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform">
              <PawPrint size={24} />
            </div>
            <span className="text-2xl font-black text-slate-800 tracking-tight">
              JE <span className="text-teal-600">Pet</span>
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-8">
            <button onClick={() => setCurrentView('home')} className={`font-semibold hover:text-teal-600 ${currentView === 'home' ? 'text-teal-600' : 'text-slate-600'}`}>Início</button>
            <button onClick={() => setCurrentView('store')} className={`font-semibold hover:text-teal-600 ${currentView === 'store' ? 'text-teal-600' : 'text-slate-600'}`}>Loja</button>
            <button onClick={() => setCurrentView('services')} className={`font-semibold hover:text-teal-600 ${currentView === 'services' ? 'text-teal-600' : 'text-slate-600'}`}>Serviços</button>
            <button onClick={() => setCurrentView('about')} className={`font-semibold hover:text-teal-600 ${currentView === 'about' ? 'text-teal-600' : 'text-slate-600'}`}>Sobre</button>
            <button onClick={() => setCurrentView('contact')} className={`font-semibold hover:text-teal-600 ${currentView === 'contact' ? 'text-teal-600' : 'text-slate-600'}`}>Contato</button>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-600 hover:text-teal-600"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute top-0 right-0 bg-orange-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              )}
            </button>

            {user ? (
              <button
                onClick={() => setCurrentView('profile')}
                className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full hover:bg-slate-100"
              >
                <div className="w-6 h-6 bg-teal-100 text-teal-700 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0)}
                </div>
                <span className="hidden sm:inline text-sm font-bold text-slate-700">{user.name.split(' ')[0]}</span>
              </button>
            ) : (
              <button
                onClick={() => { setAuthView('login'); setIsAuthModalOpen(true); }}
                className="bg-teal-600 text-white px-6 py-2.5 rounded-full font-bold shadow-lg hover:bg-teal-700 transition-all flex items-center gap-2"
              >
                <UserIcon size={18} /> <span className="hidden sm:inline">Entrar</span>
              </button>
            )}

            <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-white p-8 flex flex-col items-center gap-6 animate-fadeIn">
          <button className="absolute top-6 right-6 p-2" onClick={() => setIsMenuOpen(false)}>
            <X size={32} />
          </button>
          <div className="w-12 h-12 bg-teal-600 rounded-xl flex items-center justify-center text-white mb-4">
            <PawPrint size={32} />
          </div>
          <button onClick={() => setCurrentView('home')} className="text-2xl font-bold py-2">Início</button>
          <button onClick={() => setCurrentView('store')} className="text-2xl font-bold py-2">Loja</button>
          <button onClick={() => setCurrentView('services')} className="text-2xl font-bold py-2">Serviços</button>
          <button onClick={() => setCurrentView('about')} className="text-2xl font-bold py-2">Sobre</button>
          <button onClick={() => setCurrentView('contact')} className="text-2xl font-bold py-2">Contato</button>
          <button
            onClick={() => { setIsMenuOpen(false); setCurrentView('appointment'); }}
            className="mt-4 bg-teal-600 text-white w-full py-4 rounded-2xl font-bold shadow-xl"
          >
            Agendar Consulta
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-20">
        {currentView === 'home' && <HomeView onNavigateStore={() => setCurrentView('store')} onNavigateAppoint={() => setCurrentView('appointment')} onAddCart={addToCart} />}
        {currentView === 'store' && <StoreView onAddCart={addToCart} />}
        {currentView === 'services' && <ServicesView onNavigateAppoint={() => setCurrentView('appointment')} />}
        {currentView === 'about' && <AboutView />}
        {currentView === 'contact' && <ContactView />}
        {currentView === 'appointment' && <AppointmentView />}
        {currentView === 'profile' && <ProfileView user={user} onLogout={logout} />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 pt-20 pb-10">
        <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-slate-800 pb-16 mb-10">
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">
                <PawPrint size={20} />
              </div>
              <span className="text-xl font-black text-white tracking-tight">JE Pet</span>
            </div>
            <p className="leading-relaxed text-sm">
              Dedicados ao bem-estar animal com tecnologia, carinho e responsabilidade desde 2015.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors"><Facebook size={20} /></a>
              <a href="#" className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center hover:bg-teal-600 transition-colors"><Instagram size={20} /></a>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Explore</h4>
            <ul className="space-y-3 text-sm">
              <li><button onClick={() => setCurrentView('store')} className="hover:text-teal-400">Loja Virtual</button></li>
              <li><button onClick={() => setCurrentView('services')} className="hover:text-teal-400">Serviços</button></li>
              <li><button onClick={() => setCurrentView('appointment')} className="hover:text-teal-400">Veterinário</button></li>
              <li><button onClick={() => setCurrentView('about')} className="hover:text-teal-400">Trabalhe Conosco</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Ajuda</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="#" className="hover:text-teal-400">Rastrear Pedido</a></li>
              <li><a href="#" className="hover:text-teal-400">Política de Troca</a></li>
              <li><a href="#" className="hover:text-teal-400">Privacidade</a></li>
              <li><a href="#" className="hover:text-teal-400">FAQs</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Contatos</h4>
            <ul className="space-y-4 text-sm">
              <li className="flex gap-3"><MapPin size={18} className="text-teal-500" /> Av. das Nações, 1500 - SP</li>
              <li className="flex gap-3"><Phone size={18} className="text-teal-500" /> (11) 4002-8922</li>
              <li className="flex gap-3 text-emerald-400 font-bold"><MessageCircle size={18} /> WhatsApp 24h</li>
            </ul>
          </div>
        </div>
        <div className="text-center text-xs text-slate-500">
          © 2026 JE Pet Petshop & Clinic. Todos os direitos reservados.
        </div>
      </footer>

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[110] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slideInRight">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="text-teal-600" /> Meu Carrinho
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2"><X size={24} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-20">
                  <Package size={64} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-slate-500">Seu carrinho está vazio.</p>
                  <button onClick={() => { setIsCartOpen(false); setCurrentView('store'); }} className="mt-4 text-teal-600 font-bold underline">Começar a comprar</button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div key={`${item.id}-${idx}`} className="flex gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <img src={item.imageUrl} className="w-20 h-20 object-cover rounded-xl" />
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                      <p className="text-teal-600 font-bold">R$ {item.price.toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50">
              <div className="flex justify-between items-center mb-6">
                <span className="text-slate-500 font-medium">Total</span>
                <span className="text-2xl font-black text-slate-900">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button
                disabled={cart.length === 0}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-teal-700 shadow-xl disabled:opacity-50"
                onClick={() => { alert('Redirecionando para pagamento...'); setIsCartOpen(false); }}
              >
                Finalizar Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsAuthModalOpen(false)}></div>
          <div className="bg-white w-full max-w-md p-8 rounded-3xl relative z-10 shadow-2xl animate-scaleUp">
            <button onClick={() => setIsAuthModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24} /></button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-teal-600">
                <UserIcon size={32} />
              </div>
              <h2 className="text-2xl font-bold">
                {authView === 'login' ? 'Acesse sua conta' : authView === 'signup' ? 'Crie sua conta' : 'Recuperar senha'}
              </h2>
            </div>

            <form className="space-y-4" onSubmit={handleAuth}>
              {authView === 'signup' && (
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input name="name" type="text" placeholder="Nome Completo" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" required />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input name="email" type="email" placeholder="Seu melhor e-mail" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" required />
              </div>
              {authView !== 'forgot' && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input name="password" type="password" placeholder="Senha secreta" className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500 outline-none" required />
                </div>
              )}

              {authError && (
                <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 italic">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {authLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  authView === 'login' ? 'Entrar' : authView === 'signup' ? 'Cadastrar' : 'Enviar Link'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              {authView === 'login' && (
                <>
                  <button onClick={() => setAuthView('forgot')} className="text-teal-600 hover:underline mb-2 block w-full">Esqueci minha senha</button>
                  <p className="text-slate-500">Novo por aqui? <button onClick={() => setAuthView('signup')} className="text-teal-600 font-bold">Crie uma conta</button></p>
                </>
              )}
              {authView !== 'login' && (
                <button onClick={() => setAuthView('login')} className="text-teal-600 font-bold hover:underline">Voltar para o login</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-Views Components ---

const HomeView: React.FC<{
  onNavigateStore: () => void,
  onNavigateAppoint: () => void,
  onAddCart: (p: Product) => void
}> = ({ onNavigateStore, onNavigateAppoint, onAddCart }) => (
  <div className="animate-fadeIn">
    {/* Hero Section */}
    <section className="bg-soft-gradient py-20 lg:py-32 relative overflow-hidden">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 relative z-10">
          <span className="bg-teal-100 text-teal-700 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest">Seu pet em boas mãos</span>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight">
            Cuidado que seu <span className="text-teal-600">melhor amigo</span> merece.
          </h1>
          <p className="text-lg text-slate-600 max-w-lg leading-relaxed">
            Unimos o amor pelos animais com tecnologia e infraestrutura de ponta. De banho e tosa a clínicas 24h, estamos aqui para tudo.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={onNavigateAppoint} className="bg-teal-600 text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl hover:bg-teal-700 flex items-center justify-center gap-2">
              <Calendar size={20} /> Agendar Consulta
            </button>
            <button onClick={onNavigateStore} className="bg-white text-slate-800 border-2 border-slate-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 flex items-center justify-center gap-2">
              Ver Loja <ArrowRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-6 pt-4">
            <div className="flex -space-x-3">
              <img src="https://i.pravatar.cc/150?u=a" className="w-12 h-12 rounded-full border-4 border-white shadow-sm" />
              <img src="https://i.pravatar.cc/150?u=b" className="w-12 h-12 rounded-full border-4 border-white shadow-sm" />
              <img src="https://i.pravatar.cc/150?u=c" className="w-12 h-12 rounded-full border-4 border-white shadow-sm" />
            </div>
            <div>
              <p className="font-bold text-slate-800">+10k Clientes</p>
              <div className="flex text-orange-400"><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /><Star size={14} fill="currentColor" /></div>
            </div>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 bg-teal-200 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <img
            src="https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&q=80&w=800"
            alt="Pet"
            className="relative rounded-[60px] shadow-2xl border-[16px] border-white z-10"
          />
          <div className="absolute -bottom-8 -left-8 bg-white p-6 rounded-3xl shadow-2xl z-20 animate-bounce">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600"><ShieldCheck size={24} /></div>
              <div><p className="text-xs text-slate-500">Certificado</p><p className="font-bold text-slate-800">Cuidado Premium</p></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Quick Store Highlights */}
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-black mb-4">Os favoritos da semana</h2>
            <p className="text-slate-500">Produtos premium selecionados por nossos veterinários.</p>
          </div>
          <button onClick={onNavigateStore} className="hidden md:flex items-center gap-2 text-teal-600 font-bold hover:underline">
            Ver loja completa <ChevronDown className="-rotate-90" size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {PRODUCTS.slice(0, 4).map(p => (
            <div key={p.id} className="group bg-slate-50 p-4 rounded-3xl border border-transparent hover:border-teal-100 hover:bg-white hover:shadow-2xl transition-all duration-300">
              <div className="relative aspect-square overflow-hidden rounded-2xl mb-4">
                <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <button
                  onClick={() => onAddCart(p)}
                  className="absolute bottom-3 right-3 bg-white p-3 rounded-xl text-teal-600 shadow-xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all"
                >
                  <ShoppingCart size={20} />
                </button>
              </div>
              <h3 className="font-bold text-slate-800 mb-1">{p.name}</h3>
              <p className="text-teal-600 font-black text-lg">R$ {p.price.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>



    {/* Services Overview */}
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 text-center mb-16">
        <h2 className="text-4xl font-black mb-4">Tudo em um só lugar</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">Oferecemos a maior infraestrutura da região para garantir o máximo de conforto para você e seu pet.</p>
      </div>
      <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {PET_SERVICES.map(s => (
          <div key={s.id} className="group p-8 rounded-3xl border border-slate-100 hover:border-teal-100 hover:shadow-xl transition-all">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-teal-600 group-hover:text-white transition-all">
              {s.icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{s.title}</h3>
            <p className="text-slate-500 text-sm mb-6">{s.description}</p>
            {s.price && <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">{s.price}</p>}
          </div>
        ))}
      </div>
    </section>


  </div>
);

const StoreView: React.FC<{ onAddCart: (p: Product) => void }> = ({ onAddCart }) => {
  const [filter, setFilter] = useState<'all' | 'racao' | 'brinquedo' | 'acessorio' | 'higiene'>('all');

  const filteredProducts = filter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === filter);

  return (
    <div className="py-12 animate-fadeIn">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Filter size={20} className="text-teal-600" /> Filtros
              </h3>
              <div className="space-y-2">
                {['all', 'racao', 'brinquedo', 'acessorio', 'higiene'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat as any)}
                    className={`w-full text-left px-4 py-3 rounded-xl capitalize font-medium transition-all ${filter === cat ? 'bg-teal-600 text-white' : 'hover:bg-slate-50 text-slate-600'}`}
                  >
                    {cat === 'all' ? 'Todos os Produtos' : cat}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
              <h2 className="text-3xl font-black">Resultados ({filteredProducts.length})</h2>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  placeholder="Buscar produto..."
                  className="w-full sm:w-80 pl-12 pr-4 py-3 rounded-2xl bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredProducts.map(p => (
                <div key={p.id} className="group bg-white rounded-[32px] overflow-hidden border border-slate-100 hover:shadow-2xl transition-all duration-500">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-teal-600 shadow-sm">
                      {p.category}
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">{p.name}</h3>
                    <p className="text-slate-500 text-sm mb-6 line-clamp-2">{p.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-black text-slate-900">R$ {p.price.toFixed(2)}</span>
                      <button
                        onClick={() => onAddCart(p)}
                        className="bg-teal-600 text-white px-5 py-3 rounded-2xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-500/20 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <ShoppingCart size={18} /> Comprar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AppointmentView: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    petName: '',
    petType: 'cao',
    date: '',
    time: '',
    type: 'consulta-geral'
  });

  return (
    <div className="py-20 animate-fadeIn">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          <div className="bg-teal-600 p-8 text-white text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold">Agende sua Consulta</h2>
            <p className="text-teal-100 opacity-80 mt-2">Atendimento especializado para quem você ama.</p>
          </div>

          <div className="p-8 lg:p-12">
            {step === 1 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Qual o nome do seu pet?</label>
                  <input
                    type="text"
                    value={formData.petName}
                    onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                    placeholder="Ex: Totó, Mel, Bilu..."
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">É um cão ou gato?</label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setFormData({ ...formData, petType: 'cao' })}
                      className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all ${formData.petType === 'cao' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-100 text-slate-500'}`}
                    >
                      🐶 Cão
                    </button>
                    <button
                      onClick={() => setFormData({ ...formData, petType: 'gato' })}
                      className={`flex-1 p-4 rounded-2xl border-2 font-bold transition-all ${formData.petType === 'gato' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-100 text-slate-500'}`}
                    >
                      🐱 Gato
                    </button>
                  </div>
                </div>
                <button
                  disabled={!formData.petName}
                  onClick={() => setStep(2)}
                  className="w-full bg-teal-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-teal-700 shadow-xl disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            ) : step === 2 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Escolha o serviço</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white"
                  >
                    <option value="consulta-geral">Consulta Geral</option>
                    <option value="vacinacao">Vacinação</option>
                    <option value="exames">Exames de Sangue</option>
                    <option value="emergencia">Emergência</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Data</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Horário</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 border-2 border-slate-200 py-4 rounded-2xl font-bold hover:bg-slate-50">Voltar</button>
                  <button
                    disabled={!formData.date || !formData.time}
                    onClick={() => setStep(3)}
                    className="flex-[2] bg-teal-600 text-white py-4 rounded-2xl font-bold shadow-xl"
                  >
                    Confirmar Agendamento
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldCheck size={40} />
                </div>
                <h3 className="text-2xl font-bold">Agendamento Realizado!</h3>
                <p className="text-slate-600 leading-relaxed">
                  Tudo pronto para recebermos o(a) <span className="font-bold text-teal-600">{formData.petName}</span> no dia <span className="font-bold">{formData.date}</span> às <span className="font-bold">{formData.time}</span>.
                </p>
                <div className="p-6 bg-slate-50 rounded-2xl text-left text-sm space-y-2">
                  <p>• Traga a carteirinha de vacinação se for a primeira vez.</p>
                  <p>• Chegue com 10 minutos de antecedência.</p>
                </div>
                <button onClick={() => setStep(1)} className="text-teal-600 font-bold hover:underline">Realizar outro agendamento</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ServicesView: React.FC<{ onNavigateAppoint: () => void }> = ({ onNavigateAppoint }) => (
  <div className="py-20 animate-fadeIn">
    <div className="container mx-auto px-4">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-black mb-4">Serviços Especializados</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">Cuidamos de cada detalhe com amor e profissionalismo.</p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
        {PET_SERVICES.map(s => (
          <div key={s.id} className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
            <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-[28px] flex items-center justify-center mb-8 group-hover:bg-teal-600 group-hover:text-white transition-all">
              {s.icon}
            </div>
            <h3 className="text-2xl font-black mb-4">{s.title}</h3>
            <p className="text-slate-500 mb-8 leading-relaxed">{s.description}</p>
            <div className="flex justify-between items-center pt-8 border-t border-slate-50">
              <span className="font-bold text-teal-600">{s.price || 'Sob Consulta'}</span>
              <button onClick={onNavigateAppoint} className="flex items-center gap-2 font-bold text-slate-800 hover:text-teal-600 group-hover:gap-4 transition-all">
                Agendar <ArrowRight size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AboutView: React.FC = () => (
  <div className="animate-fadeIn">
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <img src="https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&q=80&w=800" className="rounded-[40px] shadow-2xl" />
        </div>
        <div className="space-y-8">
          <h2 className="text-4xl font-black leading-tight text-slate-900">Apaixonados por pets, movidos pela excelência.</h2>
          <p className="text-lg text-slate-600">
            Fundada em 2015, a JE Pet nasceu da necessidade de um atendimento mais humanizado e tecnológico no setor pet. Nossa missão é facilitar a vida dos tutores enquanto proporcionamos a melhor experiênica possível para os animais.
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-4xl font-black text-teal-600 mb-1">10+</h4>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Veterinários</p>
            </div>
            <div>
              <h4 className="text-4xl font-black text-teal-600 mb-1">50k+</h4>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Banhos realizados</p>
            </div>
          </div>
          <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100 flex gap-6">
            <div className="w-12 h-12 bg-teal-600 text-white rounded-full flex items-center justify-center shrink-0">
              <Star size={24} fill="currentColor" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 mb-1">Nota 4.9 no Google</h4>
              <p className="text-sm text-slate-500">Mais de 2.000 avaliações de tutores satisfeitos.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
);

const ContactView: React.FC = () => (
  <div className="py-24 animate-fadeIn">
    <div className="container mx-auto px-4">
      <div className="bg-slate-900 rounded-[60px] p-8 lg:p-20 grid lg:grid-cols-2 gap-20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-600/20 blur-[100px] rounded-full"></div>
        <div className="space-y-12 relative z-10">
          <div>
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight mb-4">Estamos prontos para te ouvir.</h2>
            <p className="text-slate-400">Entre em contato para tirar dúvidas, dar sugestões ou feedbacks.</p>
          </div>
          <div className="space-y-8">
            <div className="flex gap-6 items-center">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-teal-400"><Phone size={24} /></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Telefone</p><p className="text-xl font-bold text-white">(11) 4002-8922</p></div>
            </div>
            <div className="flex gap-6 items-center">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-teal-400"><MapPin size={24} /></div>
              <div><p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Endereço</p><p className="text-xl font-bold text-white">Av. das Nações, 1500 - São Paulo, SP</p></div>
            </div>
          </div>
          <div className="p-8 bg-teal-600/10 border border-teal-500/20 rounded-3xl">
            <h4 className="text-white font-bold mb-4 flex items-center gap-2"><Clock size={18} /> Horário de Funcionamento</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-slate-400">Seg - Sex</p><p className="text-white font-bold">08:00 - 20:00</p></div>
              <div><p className="text-slate-400">Sáb e Feriados</p><p className="text-white font-bold">09:00 - 18:00</p></div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-[40px] p-8 lg:p-12 shadow-2xl relative z-10">
          <form className="space-y-6" onSubmit={e => e.preventDefault()}>
            <div className="grid md:grid-cols-2 gap-6">
              <input type="text" placeholder="Nome" className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500" />
              <input type="email" placeholder="E-mail" className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
            <input type="text" placeholder="Assunto" className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500" />
            <textarea placeholder="Sua mensagem..." className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 h-32 resize-none"></textarea>
            <button className="w-full bg-teal-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-teal-700 shadow-xl transition-all">Enviar Agora</button>
          </form>
        </div>
      </div>
    </div>
  </div>
);

const ProfileView: React.FC<{ user: User | null, onLogout: () => void }> = ({ user, onLogout }) => (
  <div className="py-20 animate-fadeIn">
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="grid lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-center">
            <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-4">
              {user?.name.charAt(0)}
            </div>
            <h3 className="text-xl font-bold">{user?.name}</h3>
            <p className="text-slate-500 text-sm mb-6">{user?.email}</p>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-700 rounded-xl font-bold"><UserIcon size={18} /> Perfil</button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium"><Package size={18} /> Pedidos</button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium"><Calendar size={18} /> Agendamentos</button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium"><Settings size={18} /> Configurações</button>
              <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold mt-4 border-t border-slate-50"><LogOut size={18} /> Sair</button>
            </div>
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Dados Pessoais</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Nome Completo</p><p className="font-bold text-slate-800">{user?.name}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">E-mail</p><p className="font-bold text-slate-800">{user?.email}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Telefone</p><p className="font-bold text-slate-800">{user?.phone}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Endereço Principal</p><p className="font-bold text-slate-800">Não cadastrado</p></div>
            </div>
            <button className="mt-10 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">Editar Perfil</button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Meus Pets</h2>
              <button className="text-teal-600 font-bold flex items-center gap-1">+ Adicionar</button>
            </div>
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[32px]">
              <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4"><PawPrint size={32} /></div>
              <p className="text-slate-500">Nenhum pet cadastrado ainda.</p>
              <p className="text-xs text-slate-400">Cadastre seu pet para agendamentos mais rápidos!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default App;
