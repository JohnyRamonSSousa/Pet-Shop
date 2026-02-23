
import React, { useState, useEffect } from 'react';
import {
  Menu, X, Search, ShoppingCart, User as UserIcon,
  Heart, Calendar, MapPin, Phone, MessageCircle,
  Facebook, Instagram, ArrowRight, Star, Filter,
  ChevronDown, LogOut, Package, Settings, Trash2,
  Clock, PawPrint, ShieldCheck, Mail, Lock, Plus,
  CreditCard, QrCode, FileText, Scissors, Syringe
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  arrayUnion,
  collection
} from 'firebase/firestore';
import { auth, db } from './services/firebase';
import { PRODUCTS, PET_SERVICES } from './constants';
import { Product, User, Order, OrderItem, Appointment } from './types';


// --- State and Context ---
type View = 'home' | 'store' | 'services' | 'about' | 'contact' | 'appointment' | 'profile' | 'checkout_payment';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(() => {
    return (localStorage.getItem('je-pet-view') as View) || 'home';
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'signup' | 'forgot'>('login');
  const [cart, setCart] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('je-pet-user');
    return cached ? JSON.parse(cached) : null;
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  // Auth synchronization
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Start real-time Firestore listener
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        unsubscribeFirestore = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const userData: User = {
              id: firebaseUser.uid,
              name: data.name || firebaseUser.displayName || 'Usuário',
              email: data.email || firebaseUser.email || '',
              phone: data.phone || '',
              pets: data.pets || []
            };
            setUser(userData);
            localStorage.setItem('je-pet-user', JSON.stringify(userData));
          } else {
            const newUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuário',
              email: firebaseUser.email || '',
              phone: '',
              pets: []
            };
            setDoc(userDocRef, newUser);
            setUser(newUser);
            localStorage.setItem('je-pet-user', JSON.stringify(newUser));
          }
        }, (error) => {
          console.error("Firestore sync error:", error);
          setAuthError("Erro ao sincronizar dados: " + error.message);
        });
      } else {
        if (unsubscribeFirestore) unsubscribeFirestore();
        setUser(null);
        localStorage.removeItem('je-pet-user');
        localStorage.removeItem('je-pet-view');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Sync view to localStorage
  useEffect(() => {
    localStorage.setItem('je-pet-view', currentView);
  }, [currentView]);

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
        setCurrentView('profile');
      } else if (authView === 'forgot') {
        await sendPasswordResetEmail(auth, email);
        alert('E-mail de recuperação enviado! Verifique sua caixa de entrada.');
        setAuthView('login');
        setIsAuthModalOpen(false);
        return;
      }
      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error("Auth error:", error);
      let errorMessage = error.message;
      if (error.code === 'auth/user-not-found') errorMessage = 'Usuário não encontrado.';
      if (error.code === 'auth/wrong-password') errorMessage = 'Senha incorreta.';
      if (error.code === 'auth/invalid-email') errorMessage = 'E-mail inválido.';
      if (error.code === 'auth/too-many-requests') errorMessage = 'Muitas tentativas. Tente novamente mais tarde.';
      setAuthError(errorMessage);
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

  const deleteAccount = async () => {
    if (!auth.currentUser) return;
    try {
      await deleteUser(auth.currentUser);
      setUser(null);
      setCurrentView('home');
      setShowDeleteSuccess(true);
    } catch (error: any) {
      console.error("Delete account error:", error);
      alert('Erro ao excluir conta: ' + error.message + '. Você pode precisar sair e entrar novamente para realizar esta ação.');
    }
  };

  const addPet = async (pet: { name: string, breed: string, type: string }) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.id);
      await updateDoc(userDocRef, {
        pets: arrayUnion(pet)
      });
    } catch (error: any) {
      console.error("Add pet error:", error);
      alert("Erro ao adicionar pet: " + error.message);
    }
  };

  // Scroll to top on view change
  useEffect(() => {
    window.scrollTo(0, 0);
    setIsMenuOpen(false);
  }, [currentView]);

  // Redirection guard: go home if not logged in and on profile view
  useEffect(() => {
    // Only redirect if we are sure there is no user and we are not in the middle of auth loading
    if (!user && !auth.currentUser && currentView === 'profile' && !authLoading) {
      setCurrentView('home');
    }
  }, [user, currentView, authLoading]);

  const addToCart = (product: Product, petName?: string) => {
    const productWithPet = { ...product, assignedPet: petName };
    setCart([...cart, productWithPet]);
    setIsCartOpen(true);
  };

  const finalizePurchase = async () => {
    if (!user) {
      setIsCartOpen(false);
      setAuthView('login');
      setIsAuthModalOpen(true);
      return;
    }

    if (cart.length === 0) return;
    setIsCartOpen(false);
    setCurrentView('checkout_payment');
  };

  const createOrder = async (paymentMethod: string) => {
    if (!user || cart.length === 0) return;

    try {
      console.log("Preparing OrderItems...");
      const orderItems: OrderItem[] = cart.map((item, idx) => ({
        id: `${item.id}-${idx}`,
        name: item.name,
        price: item.price,
        imageUrl: item.imageUrl,
        assignedPet: item.assignedPet || ""
      }));

      const newOrder: Order = {
        id: `ord-${Date.now()}`,
        userId: user.id,
        items: orderItems,
        total: cartTotal,
        date: new Date().toISOString(),
        status: 'pending'
      };

      setLastOrder(newOrder);
      setCart([]);
      setIsOrderModalOpen(true);
      console.log("Optimistic UI: Modal opened and cart cleared.");

      // Attempt the write in the background
      const userOrdersRef = doc(db, 'users', user.id, 'orders', newOrder.id);
      console.log("Starting background Firestore write...");
      setDoc(userOrdersRef, newOrder)
        .then(() => console.log("Background Firestore write SUCCEEDED"))
        .catch(error => console.error("Background Firestore write FAILED:", error));
    } catch (error: any) {
      console.error("=== CREATE ORDER ERROR ===");
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      alert(`Erro ao finalizar compra. Detalhes: ${error.message}`);
      throw error;
    }
  };

  const handleCreateAppointment = async (appointmentData: Omit<Appointment, 'id' | 'status' | 'userId'>) => {
    if (!user) {
      setAuthError(null);
      setAuthView('login');
      setIsAuthModalOpen(true);
      return;
    }

    try {
      const newAppointment: Appointment = {
        ...appointmentData,
        userId: user.id,
        id: `app-${Date.now()}`,
        status: 'pending'
      };

      console.log("Optimistic Appointment: Saving in background...", newAppointment);
      const appRef = doc(db, 'users', user.id, 'appointments', newAppointment.id);

      // Background write
      setDoc(appRef, newAppointment)
        .then(() => console.log("Background Appointment Save: SUCCESS"))
        .catch(err => {
          console.error("Background Appointment Save: FAILED", err);
          alert("Erro ao sincronizar agendamento. Tente novamente mais tarde.");
        });

      return newAppointment;
    } catch (error: any) {
      console.error("Create appointment logic error:", error);
      alert("Erro ao preparar agendamento: " + error.message);
      throw error;
    }
  };
  const handleUpdateAppointment = async (id: string, data: Partial<Appointment>) => {
    if (!user) return;
    try {
      console.log("Optimistic Update: Saving in background...", id, data);
      const appRef = doc(db, 'users', user.id, 'appointments', id);

      // Background write
      updateDoc(appRef, data)
        .then(() => console.log("Background Update: SUCCESS"))
        .catch(err => {
          console.error("Background Update: FAILED", err);
          alert("Houve um erro ao atualizar o agendamento no servidor.");
        });

      return true;
    } catch (error: any) {
      console.error("Critical update error:", error);
      alert("Erro ao preparar atualização: " + error.message);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!user) return;
    if (!confirm("Tem certeza que deseja cancelar este agendamento?")) return;

    try {
      console.log("Optimistic Delete: Saving in background...", id);
      const appRef = doc(db, 'users', user.id, 'appointments', id);

      // Background write - using status 'cancelled' as requested to keep record, or deleteDoc
      // User said "excluir", but cancelling is usually safer for business logs. 
      // I'll stick to 'cancelled' status for better UI feedback of history.
      updateDoc(appRef, { status: 'cancelled' })
        .then(() => console.log("Background Delete/Cancel: SUCCESS"))
        .catch(err => {
          console.error("Background Delete/Cancel: FAILED", err);
          alert("Erro ao processar o cancelamento no servidor.");
        });

      return true;
    } catch (error: any) {
      console.error("Critical delete error:", error);
      alert("Erro ao processar cancelamento: " + error.message);
    }
  };

  // Global Data Fetching (Parallel)
  useEffect(() => {
    if (!user) {
      setOrders([]);
      setAppointments([]);
      return;
    }

    setLoadingOrders(true);
    setLoadingAppointments(true);

    const ordersRef = collection(db, 'users', user.id, 'orders');
    const appRef = collection(db, 'users', user.id, 'appointments');

    const unsubscribeOrders = onSnapshot(ordersRef, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => doc.data() as Order);
      setOrders(fetchedOrders.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoadingOrders(false);
    }, (error) => {
      console.error("Fetch orders error:", error);
      setLoadingOrders(false);
    });

    const unsubscribeApps = onSnapshot(appRef, (snapshot) => {
      const fetchedApps = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Appointment));
      setAppointments(fetchedApps.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoadingAppointments(false);
    }, (error) => {
      console.error("Fetch appointments error:", error);
      setLoadingAppointments(false);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeApps();
    };
  }, [user?.id]);

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
                onClick={() => { setAuthError(null); setAuthView('login'); setIsAuthModalOpen(true); }}
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

          {user && (
            <button
              onClick={() => { setCurrentView('profile'); setIsMenuOpen(false); }}
              className="text-2xl font-bold py-2 text-teal-600 flex items-center gap-2"
            >
              <UserIcon size={24} /> Meu Perfil
            </button>
          )}

          <button
            onClick={() => {
              setIsMenuOpen(false);
              if (user) {
                setCurrentView('appointment');
              } else {
                setAuthError(null);
                setAuthView('login');
                setIsAuthModalOpen(true);
              }
            }}
            className="mt-4 bg-teal-600 text-white w-full py-4 rounded-2xl font-bold shadow-xl"
          >
            Agendar Consulta
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 pt-20">
        {currentView === 'home' && (
          <HomeView
            onNavigateStore={() => setCurrentView('store')}
            onNavigateAppoint={() => {
              if (user) setCurrentView('appointment');
              else { setAuthError(null); setAuthView('login'); setIsAuthModalOpen(true); }
            }}
            onAddCart={addToCart}
          />
        )}
        {currentView === 'store' && <StoreView user={user} onAddCart={addToCart} />}
        {currentView === 'services' && (
          <ServicesView
            onNavigateAppoint={() => {
              if (user) setCurrentView('appointment');
              else { setAuthError(null); setAuthView('login'); setIsAuthModalOpen(true); }
            }}
          />
        )}
        {currentView === 'about' && <AboutView />}
        {currentView === 'contact' && <ContactView />}
        {currentView === 'appointment' && (
          <AppointmentView
            user={user}
            onSaveAppointment={handleCreateAppointment}
            onNavigate={setCurrentView}
            onFinish={() => {
              alert("Agendamento realizado com sucesso!");
              setCurrentView('profile');
            }}
          />
        )}
        {currentView === 'profile' && (
          <ProfileView
            user={user}
            orders={orders}
            loadingOrders={loadingOrders}
            appointments={appointments}
            loadingAppointments={loadingAppointments}
            onLogout={logout}
            onDeleteAccount={deleteAccount}
            onAddPet={addPet}
            onUpdateApp={handleUpdateAppointment}
            onDeleteApp={handleDeleteAppointment}
            onNavigate={setCurrentView}
          />
        )}
        {currentView === 'checkout_payment' && (
          <CheckoutPaymentView
            cart={cart}
            total={cartTotal}
            onConfirm={createOrder}
            onBack={() => setCurrentView('home')}
          />
        )}
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
                      <div className="flex flex-col">
                        <p className="text-teal-600 font-bold">R$ {item.price.toFixed(2)}</p>
                        {item.assignedPet && (
                          <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full w-fit mt-1">
                            Para: {item.assignedPet}
                          </span>
                        )}
                      </div>
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
                onClick={finalizePurchase}
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

      {/* Order Confirmation Modal - Redesigned for WOW Effect */}
      {isOrderModalOpen && lastOrder && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fadeIn" onClick={() => setIsOrderModalOpen(false)}></div>
          <div className="bg-white w-full max-w-2xl rounded-[48px] relative z-10 shadow-2xl animate-scaleUp overflow-hidden">
            {/* Success Header with Animated Element */}
            <div className="bg-gradient-to-br from-teal-500 via-teal-600 to-emerald-600 p-12 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
                <div className="absolute bottom-0 right-0 w-32 h-32 bg-emerald-400 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>
              </div>

              <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-xl border border-white/30 shadow-lg animate-bounce">
                <ShieldCheck size={56} className="text-white drop-shadow-lg" />
              </div>

              <h2 className="text-4xl font-black mb-2 tracking-tight">¡Parabéns pela Compra!</h2>
              <p className="text-teal-50 text-lg font-medium opacity-90">Seu pedido foi processado com sucesso.</p>
            </div>

            <div className="p-10 space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Código do Pedido</p>
                  <p className="text-lg font-black text-slate-900">#{lastOrder.id.split('-')[1]}</p>
                </div>
                <div className="space-y-1 sm:text-right">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Data do Pedido</p>
                  <p className="text-lg font-bold text-slate-900">{new Date(lastOrder.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest pl-1">Itens Adquiridos</h3>
                <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 divide-y divide-slate-50">
                  {lastOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm">
                          <img src={item.imageUrl} className="w-full h-full object-cover" alt={item.name} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-400">Entrega prevista em breve</p>
                        </div>
                      </div>
                      <p className="font-black text-slate-900">R$ {item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center px-2">
                <div className="space-y-1">
                  <p className="text-slate-500 font-bold">Total Pago</p>
                  <p className="text-xs text-slate-400">incluindo taxas e impostos</p>
                </div>
                <p className="text-4xl font-black text-teal-600">R$ {lastOrder.total.toFixed(2)}</p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-4">
                <button
                  onClick={() => { setIsOrderModalOpen(false); setCurrentView('profile'); }}
                  className="group w-full bg-slate-900 text-white py-5 rounded-2xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02]"
                >
                  <Package size={22} className="group-hover:rotate-12 transition-transform" />
                  Ver meus Pedidos
                </button>
                <button
                  onClick={() => setIsOrderModalOpen(false)}
                  className="w-full bg-white text-teal-600 border-2 border-teal-600 py-5 rounded-2xl font-bold hover:bg-teal-50 transition-all shadow-lg hover:scale-[1.02]"
                >
                  Continuar Comprando
                </button>
              </div>
            </div>

            <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
              <p className="text-xs text-slate-400 flex items-center justify-center gap-2">
                <ShieldCheck size={14} className="text-teal-500" /> Compra Segura e Protegida por JE Pet Ltda.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Sub-Views Components ---

const CheckoutPaymentView: React.FC<{
  cart: Product[],
  total: number,
  onConfirm: (method: string) => Promise<void>,
  onBack: () => void
}> = ({ cart, total, onConfirm, onBack }) => {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'boleto'>('card');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Starting payment simulation...");
      // Faster simulation for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      console.log("Calling onConfirm (Optimistic Mode)");
      await onConfirm(paymentMethod);

      console.log("Redirecting to home...");
      onBack();
    } catch (error: any) {
      console.error("Payment handleSubmit error details:", error);
      alert(error.message || "Erro no processamento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 animate-fadeIn bg-slate-50 min-h-screen">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={onBack} className="p-3 bg-white rounded-2xl shadow-sm hover:bg-slate-50 transition-all font-bold text-slate-600 flex items-center gap-2">
            <ArrowRight size={20} className="rotate-180" /> Voltar
          </button>
          <h2 className="text-3xl font-black text-slate-900">Finalizar Pagamento</h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {/* Payment Method Selection */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <ShieldCheck className="text-teal-600" /> Escolha o método
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'card' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-100 hover:border-teal-100 text-slate-500'}`}
                >
                  <CreditCard size={32} />
                  <span className="font-bold text-xs uppercase tracking-wider">Cartão</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'pix' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-100 hover:border-teal-100 text-slate-500'}`}
                >
                  <QrCode size={32} />
                  <span className="font-bold text-xs uppercase tracking-wider">PIX</span>
                </button>
                <button
                  onClick={() => setPaymentMethod('boleto')}
                  className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'boleto' ? 'border-teal-600 bg-teal-50 text-teal-700' : 'border-slate-100 hover:border-teal-100 text-slate-500'}`}
                >
                  <FileText size={32} />
                  <span className="font-bold text-xs uppercase tracking-wider">Boleto</span>
                </button>
              </div>
            </div>

            {/* Form Area */}
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
              <form onSubmit={handleSubmit} className="space-y-6">
                {paymentMethod === 'card' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Número do Cartão</label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input type="text" placeholder="0000 0000 0000 0000" className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-medium" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Validade</label>
                        <input type="text" placeholder="MM/AA" className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-medium" required />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">CVV</label>
                        <input type="text" placeholder="123" className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-medium" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">Nome no Cartão</label>
                      <input type="text" placeholder="Como impresso no cartão" className="w-full px-6 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 font-medium uppercase" required />
                    </div>
                  </div>
                )}

                {paymentMethod === 'pix' && (
                  <div className="text-center py-10 space-y-6 animate-fadeIn">
                    <div className="w-48 h-48 bg-slate-100 rounded-3xl mx-auto flex items-center justify-center border-2 border-dashed border-slate-200">
                      <QrCode size={80} className="text-slate-300" />
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                      Um código QR será gerado após o clique no botão de confirmação para você pagar via app do seu banco.
                    </p>
                  </div>
                )}

                {paymentMethod === 'boleto' && (
                  <div className="text-center py-10 space-y-6 animate-fadeIn">
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <FileText size={40} />
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs mx-auto">
                      O boleto bancário será gerado para download após a confirmação. O prazo de compensação é de até 3 dias úteis.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-teal-600 text-white py-5 rounded-[24px] font-black text-xl hover:bg-teal-700 shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>Confirmar e Pagar R$ {total.toFixed(2)}</>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold mb-6">Resumo</h3>
              <div className="space-y-4 mb-6">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">{item.name}</span>
                    <span className="font-bold text-slate-800">R$ {item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-slate-100 flex justify-between items-center">
                <span className="font-bold text-slate-900">Total</span>
                <span className="text-2xl font-black text-teal-600">R$ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="bg-teal-900 p-8 rounded-[40px] text-white space-y-4 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
              <ShieldCheck className="text-teal-400" size={32} />
              <p className="font-bold leading-tight">Pagamento 100% Seguro</p>
              <p className="text-xs text-teal-200/60 leading-relaxed">
                Seus dados são criptografados de ponta a ponta e nunca são armazenados em nossos servidores.
              </p>
            </div>
          </div>
        </div>
      </div>
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

const StoreView: React.FC<{ user: User | null, onAddCart: (p: Product, petName?: string) => void }> = ({ user, onAddCart }) => {
  const [filter, setFilter] = useState<'all' | 'racao' | 'brinquedo' | 'acessorio' | 'higiene'>('all');
  const [buyingProduct, setBuyingProduct] = useState<Product | null>(null);

  const filteredProducts = filter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === filter);

  return (
    <div className="py-12 animate-fadeIn relative">
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
                        onClick={() => {
                          if (user?.pets && user.pets.length > 0) {
                            setBuyingProduct(p);
                          } else {
                            onAddCart(p);
                          }
                        }}
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

      {/* Pet Selection Modal for Buying */}
      {buyingProduct && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setBuyingProduct(null)}></div>
          <div className="bg-white w-full max-w-lg p-8 rounded-[40px] relative z-10 shadow-2xl animate-scaleUp">
            <button onClick={() => setBuyingProduct(null)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={24} />
            </button>
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-teal-100 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PawPrint size={32} />
              </div>
              <h2 className="text-2xl font-bold">Comprar para qual pet?</h2>
              <p className="text-slate-500 mt-2">Personalize sua compra para um de seus pets.</p>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 mb-8">
              {user?.pets.map((pet, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onAddCart(buyingProduct, pet.name);
                    setBuyingProduct(null);
                  }}
                  className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50 hover:shadow-lg transition-all text-left"
                >
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-teal-600">
                    <PawPrint size={20} />
                  </div>
                  <span className="font-bold text-slate-700">{pet.name}</span>
                </button>
              ))}
              <button
                onClick={() => {
                  onAddCart(buyingProduct);
                  setBuyingProduct(null);
                }}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-dashed border-slate-300 hover:border-slate-500 hover:bg-slate-50 transition-all text-left"
              >
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                  <UserIcon size={20} />
                </div>
                <span className="font-bold text-slate-400">Nenhum em especial</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AppointmentView: React.FC<{
  user: User | null,
  onSaveAppointment: (data: Omit<Appointment, 'id' | 'status' | 'userId'>) => Promise<any>,
  onFinish: () => void,
  onNavigate: (view: View) => void
}> = ({ user, onSaveAppointment, onFinish, onNavigate }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
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
              <div className="space-y-8">
                {user?.pets && user.pets.length > 0 ? (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Qual pet deseja agendar?</label>
                    <div className="grid grid-cols-2 gap-4">
                      {user.pets.map((pet, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setFormData({ ...formData, petName: pet.name, petType: pet.type });
                            setStep(2);
                          }}
                          className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-teal-500 hover:bg-teal-50 hover:shadow-lg transition-all text-left group"
                        >
                          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-all">
                            <PawPrint size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{pet.name}</p>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">{pet.type} • {pet.breed}</p>
                          </div>
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setFormData({ ...formData, petName: '', petType: 'cao' });
                        }}
                        className="flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-dashed border-slate-200 hover:border-slate-400 transition-all text-left"
                      >
                        <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400">
                          <Plus size={24} />
                        </div>
                        <p className="font-bold text-slate-400">Outro Pet</p>
                      </button>
                    </div>
                  </div>
                ) : null}

                {(!user?.pets || user.pets.length === 0 || !formData.petName) && (
                  <div className="space-y-6 animate-fadeIn">
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
                )}
              </div>
            ) : step === 2 ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wider">Serviço para {formData.petName}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-4 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 appearance-none bg-white font-bold text-slate-700"
                  >
                    <option value="consulta-geral">🏥 Consulta Geral</option>
                    <option value="banho-tosa">✂️ Banho & Tosa</option>
                    <option value="vacinacao">💉 Vacinação</option>
                    <option value="hospedagem">🏠 Hospedagem Pet</option>
                    <option value="exames">🧪 Exames de Sangue</option>
                    <option value="emergencia">🚨 Emergência</option>
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
                    disabled={!formData.date || !formData.time || loading}
                    onClick={async () => {
                      setLoading(true);
                      try {
                        await onSaveAppointment(formData);
                        onFinish();
                      } catch (err) {
                        console.error("Click confirm appointment error:", err);
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="flex-[2] bg-teal-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : 'Confirmar Agendamento'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-6">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-emerald-50">
                  <ShieldCheck size={48} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 leading-tight">Agendamento Realizado!</h3>
                <p className="text-slate-600 leading-relaxed text-lg">
                  Tudo pronto para recebermos o(a) <span className="font-black text-teal-600">{formData.petName}</span> no dia <span className="font-black text-slate-900">{new Date(formData.date).toLocaleDateString('pt-BR')}</span> às <span className="font-black text-slate-900">{formData.time}</span>.
                </p>
                <div className="p-6 bg-slate-50 rounded-[32px] text-left text-sm space-y-3 border border-slate-100">
                  <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span> Traga a carteirinha de vacinação.</p>
                  <p className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span> Chegue com 10 minutos de antecedência.</p>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => onNavigate('profile')}
                    className="w-full bg-teal-600 text-white py-4 rounded-2xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-all"
                  >
                    Ver Meus Agendamentos
                  </button>
                  <button onClick={() => setStep(1)} className="text-teal-600 font-bold hover:underline">Realizar outro agendamento</button>
                </div>
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

const ProfileView: React.FC<{
  user: User | null,
  orders: Order[],
  loadingOrders: boolean,
  appointments: Appointment[],
  loadingAppointments: boolean,
  onLogout: () => void,
  onDeleteAccount: () => Promise<void>,
  onAddPet: (pet: { name: string, breed: string, type: string }) => Promise<void>,
  onUpdateApp: (id: string, data: Partial<Appointment>) => Promise<void>,
  onDeleteApp: (id: string) => Promise<void>,
  onNavigate: (view: View) => void
}> = ({ user, orders, loadingOrders, appointments, loadingAppointments, onLogout, onDeleteAccount, onAddPet, onUpdateApp, onDeleteApp, onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'pets' | 'orders' | 'appointments' | 'payments' | 'settings'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Dados Pessoais</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Nome Completo</p><p className="font-bold text-slate-800">{user?.name}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">E-mail</p><p className="font-bold text-slate-800">{user?.email}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Telefone</p><p className="font-bold text-slate-800">{user?.phone || 'Não informado'}</p></div>
              <div><p className="text-xs text-slate-400 font-bold uppercase mb-1">Endereço Principal</p><p className="font-bold text-slate-800">Não cadastrado</p></div>
            </div>
            <button onClick={() => setIsEditing(true)} className="mt-10 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">Editar Perfil</button>
          </div>
        );
      case 'pets':
        return (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold">Meus Pets</h2>
              <button
                onClick={() => setIsAddingPet(true)}
                className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 hover:bg-teal-700 transition-all"
              >
                + Adicionar Pet
              </button>
            </div>

            {isAddingPet && (
              <form
                className="bg-slate-50 p-6 rounded-[32px] border border-slate-200 mb-8 animate-fadeIn"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('petName') as string;
                  const breed = formData.get('petBreed') as string;
                  const type = formData.get('petType') as string;

                  await onAddPet({ name, breed, type });
                  setIsAddingPet(false);
                }}
              >
                <div className="grid md:grid-cols-2 gap-4">
                  <input name="petName" type="text" placeholder="Nome do Pet" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500" required />
                  <input name="petBreed" type="text" placeholder="Raça" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500" required />
                  <select name="petType" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                    <option value="cao">Cão</option>
                    <option value="gato">Gato</option>
                    <option value="outros">Outros</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-all shadow-lg active:scale-95">Salvar Pet</button>
                    <button type="button" onClick={() => setIsAddingPet(false)} className="flex-1 bg-white text-slate-500 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-all">Cancelar</button>
                  </div>
                </div>
              </form>
            )}

            {user?.pets && user.pets.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {user.pets.map((pet, idx) => (
                  <div key={idx} className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 group hover:border-teal-100 transition-all">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-all">
                      <PawPrint size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">{pet.name}</h4>
                      <p className="text-xs text-slate-500 text-capitalize">{pet.type} • {pet.breed}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-[32px]">
                <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4"><PawPrint size={32} /></div>
                <p className="text-slate-500">Nenhum pet cadastrado ainda.</p>
                <p className="text-xs text-slate-400">Cadastre seu pet para usá-lo em compras e agendamentos!</p>
              </div>
            )}
          </div>
        );
      case 'orders':
        return (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Meus Pedidos</h2>
            {loadingOrders ? (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 animate-pulse">Carregando histórico...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500">Você ainda não realizou nenhum pedido.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {orders.map((order) => (
                  <div key={order.id} className="bg-slate-50 rounded-[32px] overflow-hidden border border-slate-100 hover:border-teal-100 transition-all group">
                    <div className="p-6 bg-white flex flex-wrap justify-between items-center gap-4 border-b border-slate-100">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-teal-600 mb-1">Status: {order.status}</p>
                        <h4 className="font-black text-slate-800">Pedido #{order.id.split('-')[1]}</h4>
                        <p className="text-xs text-slate-400">{new Date(order.date).toLocaleDateString('pt-BR')} às {new Date(order.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500 mb-1">Total</p>
                        <p className="text-xl font-black text-slate-900">R$ {order.total.toFixed(2)}</p>
                      </div>
                    </div>
                    <div className="p-6 space-y-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4">
                          <img src={item.imageUrl} className="w-12 h-12 object-cover rounded-xl" />
                          <div className="flex-1">
                            <h5 className="text-sm font-bold text-slate-700">{item.name}</h5>
                            {item.assignedPet && (
                              <span className="text-[10px] bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded-full">Para: {item.assignedPet}</span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-slate-900">R$ {item.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'appointments':
        return (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Meus Agendamentos</h2>
            {loadingAppointments ? (
              <div className="text-center py-20 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin"></div>
                <p className="text-slate-500 animate-pulse">Buscando agendamentos...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar size={48} className="mx-auto text-slate-200 mb-4" />
                <p className="text-slate-500">Nenhum agendamento encontrado.</p>
                <button onClick={() => onNavigate('appointment')} className="mt-4 text-teal-600 font-bold hover:underline">Agendar Agora</button>
              </div>
            ) : (
              <div className="grid gap-4">
                {appointments.map((app) => {
                  const appDate = new Date(`${app.date}T${app.time}`);
                  const now = new Date();
                  const canManage = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60) >= 24;

                  return (
                    <div key={app.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center justify-between group hover:border-teal-100 transition-all flex-wrap gap-4">
                      <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-teal-600 shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-all">
                          {app.type === 'banho-tosa' ? <Scissors size={28} /> :
                            app.type === 'vacinacao' ? <Syringe size={28} /> :
                              app.type === 'hospedagem' ? <Plus size={28} /> :
                                <Clock size={28} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-black bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full uppercase">{app.type.replace('-', ' ')}</span>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' : app.status === 'cancelled' ? 'bg-rose-100 text-rose-700' : 'bg-orange-100 text-orange-700'}`}>
                              {app.status === 'pending' ? 'Pendente' : app.status === 'confirmed' ? 'Confirmado' : app.status === 'cancelled' ? 'Cancelado' : app.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-slate-800 text-lg">
                            {app.type === 'banho-tosa' ? 'Banho & Tosa' :
                              app.type === 'vacinacao' ? 'Vacinação' :
                                app.type === 'hospedagem' ? 'Hospedagem' :
                                  app.type === 'exames' ? 'Exames' :
                                    app.type === 'emergencia' ? 'Emergência' :
                                      'Consulta'} para {app.petName}
                          </h4>
                          <p className="text-slate-400 text-xs mt-1 mb-2 leading-relaxed">
                            {app.type === 'consulta-geral' ? 'Avaliação completa de saúde e check-up de rotina para seu melhor amigo.' :
                              app.type === 'banho-tosa' ? 'Cuidados estéticos profissionais com produtos hipoalergênicos e carinho.' :
                                app.type === 'vacinacao' ? 'Protocolo completo de vacinas para garantir a saúde preventiva do seu pet.' :
                                  app.type === 'hospedagem' ? 'Ambiente seguro e divertido para seu pet enquanto você viaja tranquilo.' :
                                    app.type === 'exames' ? 'Coleta e análise laboratorial para diagnóstico preciso e acompanhamento.' :
                                      app.type === 'emergencia' ? 'Atendimento médico prioritário para casos críticos e urgentes.' :
                                        'Atendimento especializado JE Pet.'}
                          </p>
                          <p className="text-slate-500 text-sm flex items-center gap-2">
                            <Calendar size={14} className="text-teal-500" />
                            {new Date(app.date).toLocaleDateString('pt-BR')} às <Clock size={14} className="text-teal-500 ml-1" /> {app.time}
                          </p>
                        </div>
                      </div>

                      {app.status !== 'cancelled' && (
                        <div className="flex gap-2">
                          <button
                            disabled={!canManage}
                            onClick={() => setEditingAppointment(app)}
                            className={`p-3 rounded-xl border transition-all flex items-center gap-2 font-bold text-xs ${canManage ? 'bg-white border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                            title={!canManage ? "Só é possível editar com 24h de antecedência" : ""}
                          >
                            <Settings size={16} /> Editar
                          </button>
                          <button
                            disabled={!canManage}
                            onClick={() => setDeletingAppointment(app)}
                            className={`p-3 rounded-xl border transition-all flex items-center gap-2 font-bold text-xs ${canManage ? 'bg-white border-slate-200 text-rose-500 hover:border-rose-500 hover:bg-rose-50' : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'}`}
                            title={!canManage ? "Só é possível cancelar com 24h de antecedência" : ""}
                          >
                            <Trash2 size={16} /> Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      case 'payments':
        return (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Histórico de Pagamentos</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                    <ShoppingCart size={20} />
                  </div>
                  <div>
                    <p className="font-bold text-slate-800">Checkout Simulado</p>
                    <p className="text-xs text-slate-500">11/02/2026</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-slate-900">R$ 0,00</p>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Sincronizado</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <h2 className="text-2xl font-bold mb-8">Configurações</h2>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <p className="font-bold text-slate-800">Notificações por E-mail</p>
                  <p className="text-sm text-slate-500">Receba atualizações sobre seus pedidos e agendamentos.</p>
                </div>
                <div className="w-12 h-6 bg-teal-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="pt-8 border-t border-red-50">
                <h3 className="text-lg font-bold text-red-600 mb-2 font-black uppercase tracking-tighter">Zona de Perigo</h3>
                <p className="text-sm text-slate-500 mb-4">A exclusão da conta é permanente e não pode ser desfeita.</p>
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="bg-red-50 text-red-600 border border-red-100 px-6 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                >
                  <Trash2 size={18} /> Excluir Minha Conta
                </button>
              </div>
            </div>

            {/* Premium Delete Account Modal */}
            {isDeleteModalOpen && (
              <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <div
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
                  onClick={() => setIsDeleteModalOpen(false)}
                ></div>
                <div className="bg-white w-full max-w-md p-8 rounded-[40px] relative z-10 shadow-2xl animate-scaleUp overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-2 border border-red-100">
                      <Trash2 size={40} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 mb-2">Excluir Conta?</h2>
                      <p className="text-slate-500 leading-relaxed">
                        Esta ação é <span className="text-red-600 font-bold">permanente</span>. Você perderá acesso a todos os seus pets, agendamentos e histórico de pedidos.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => {
                          onDeleteAccount();
                          setIsDeleteModalOpen(false);
                        }}
                        className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-red-700 shadow-xl shadow-red-200 transition-all active:scale-95"
                      >
                        Sim, Excluir Conta
                      </button>
                      <button
                        onClick={() => setIsDeleteModalOpen(false)}
                        className="w-full bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                      >
                        Não, mudei de ideia
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="py-20 animate-fadeIn">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Cancel Appointment Confirmation Modal */}
        {deletingAppointment && (
          <div className="fixed inset-0 z-[201] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fadeIn"
              onClick={() => setDeletingAppointment(null)}
            ></div>
            <div className="bg-white w-full max-w-md p-8 rounded-[48px] relative z-20 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] animate-scaleUp overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-rose-500"></div>
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-rose-50 text-rose-600 rounded-[30px] flex items-center justify-center mx-auto border-2 border-rose-100 shadow-inner">
                  <Trash2 size={40} />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 mb-2 mt-2">Cancelar Agendamento?</h2>
                  <p className="text-slate-500 leading-relaxed text-sm px-4">
                    Você está prestes a cancelar o agendamento de <span className="text-rose-600 font-bold">{deletingAppointment.type.replace('-', ' ')}</span> para o pet <span className="font-bold text-slate-800">{deletingAppointment.petName}</span>.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={async () => {
                      await onDeleteApp(deletingAppointment.id);
                      setDeletingAppointment(null);
                    }}
                    className="w-full bg-rose-600 text-white py-4 rounded-[22px] font-black text-lg hover:bg-rose-700 shadow-xl shadow-rose-200 transition-all active:scale-95"
                  >
                    Confirmar Cancelamento
                  </button>
                  <button
                    onClick={() => setDeletingAppointment(null)}
                    className="w-full bg-slate-100 text-slate-600 py-4 rounded-[22px] font-bold hover:bg-slate-200 transition-all"
                  >
                    Mudar de ideia
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Edit Appointment Modal */}
        {editingAppointment && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fadeIn"
              onClick={() => setEditingAppointment(null)}
            ></div>
            <div className="bg-white w-full max-w-lg rounded-[48px] relative z-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] animate-scaleUp overflow-hidden border border-white/20">
              <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-10 text-white relative">
                <button
                  onClick={() => setEditingAppointment(null)}
                  className="absolute top-8 right-8 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all group"
                >
                  <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-[24px] flex items-center justify-center shadow-inner">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">Editar Agendamento</h3>
                    <p className="text-teal-50/80 text-sm font-medium mt-1">Sua nova experiência JE Pet</p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-8 bg-gradient-to-b from-white to-slate-50">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Data da Visita</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none group-focus-within:scale-110 transition-transform">
                        <Calendar size={18} />
                      </div>
                      <input
                        type="date"
                        defaultValue={editingAppointment.date}
                        id="edit-app-date"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-teal-500 focus:bg-white bg-slate-50 transition-all font-bold text-slate-700 shadow-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Horário</label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none group-focus-within:scale-110 transition-transform">
                        <Clock size={18} />
                      </div>
                      <input
                        type="time"
                        defaultValue={editingAppointment.time}
                        id="edit-app-time"
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-teal-500 focus:bg-white bg-slate-50 transition-all font-bold text-slate-700 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Serviço Desejado</label>
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none transition-transform z-10">
                      <Settings size={18} />
                    </div>
                    <select
                      defaultValue={editingAppointment.type}
                      id="edit-app-type"
                      className="w-full pl-12 pr-10 py-4 rounded-2xl border-2 border-slate-100 outline-none focus:border-teal-500 focus:bg-white bg-slate-50 transition-all font-bold text-slate-700 appearance-none cursor-pointer shadow-sm relative z-0"
                    >
                      <option value="consulta-geral">🏥 Consulta Geral</option>
                      <option value="banho-tosa">✂️ Banho & Tosa</option>
                      <option value="vacinacao">💉 Vacinação</option>
                      <option value="hospedagem">🏠 Hospedagem Pet</option>
                      <option value="exames">🧪 Exames de Sangue</option>
                      <option value="emergencia">🚨 Emergência</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                      <ChevronDown size={20} />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4 pt-4">
                  <button
                    onClick={async () => {
                      const date = (document.getElementById('edit-app-date') as HTMLInputElement).value;
                      const time = (document.getElementById('edit-app-time') as HTMLInputElement).value;
                      const type = (document.getElementById('edit-app-type') as HTMLSelectElement).value;

                      const appDate = new Date(`${date}T${time}`);
                      const now = new Date();
                      if ((appDate.getTime() - now.getTime()) / (1000 * 60 * 60) < 24) {
                        alert("Ops! Para garantir o melhor atendimento, reagendamentos precisam de no mínimo 24h de antecedência.");
                        return;
                      }

                      await onUpdateApp(editingAppointment.id, { date, time, type });
                      setEditingAppointment(null);
                    }}
                    className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg hover:bg-teal-600 shadow-2xl shadow-slate-200 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    Salvar Alterações <ArrowRight size={20} />
                  </button>
                  <button
                    onClick={() => setEditingAppointment(null)}
                    className="w-full py-2 text-slate-400 font-bold hover:text-slate-600 transition-colors text-sm"
                  >
                    Mudar de ideia
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-center">
              <div className="w-24 h-24 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center text-4xl font-black mx-auto mb-4">
                {user?.name.charAt(0)}
              </div>
              <h3 className="text-xl font-bold">{user?.name}</h3>
              <p className="text-slate-500 text-sm mb-6">{user?.email}</p>
              <div className="space-y-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <UserIcon size={18} /> Perfil
                </button>
                <button
                  onClick={() => setActiveTab('pets')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'pets' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <PawPrint size={18} /> Meus Pets
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'orders' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Package size={18} /> Pedidos
                </button>
                <button
                  onClick={() => setActiveTab('appointments')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'appointments' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Calendar size={18} /> Agendamentos
                </button>
                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'payments' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <ShoppingCart size={18} /> Pagamentos
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <Settings size={18} /> Configurações
                </button>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold mt-4 border-t border-slate-50"
                >
                  <LogOut size={18} /> Sair do Dashboard
                </button>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
