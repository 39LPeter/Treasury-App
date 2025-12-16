import React, { useState, useEffect, useMemo, Component } from 'react';
import { 
  ShieldCheck, Wallet, Users, LogOut, Menu, Plus, History,
  FileText, Package, X, Search, ChevronRight, ArrowLeft,
  CheckCircle2, Home, User, CreditCard, Calendar, Eye, 
  Download, CloudLightning, Settings, Accessibility,
  AlertTriangle, WifiOff, RefreshCcw
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';

// --- 1. CONFIGURATION & INIT ---

// Your specific configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOlHLgbNP-l5pouDKrJoEM-6D8IlGgfYY",
  authDomain: "digital-treasurer.firebaseapp.com",
  projectId: "digital-treasurer",
  storageBucket: "digital-treasurer.firebasestorage.app",
  messagingSenderId: "373137625124",
  appId: "1:373137625124:web:208a214488f19fa83748b1",
  measurementId: "G-KBF15P2F06"
};

// Initialize Firebase Services
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Analytics initialized
const auth = getAuth(app);           // Auth initialized
const db = getFirestore(app);        // Database initialized

// --- 2. ERROR BOUNDARY (Fallback for Crashes) ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-[#0b1121] text-white">
          <AlertTriangle size={64} className="text-red-500 mb-6" />
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-blue-200/50 mb-6 max-w-md">
            The application encountered an unexpected error. Your data is safe in the database.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition-colors"
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 3. UTILITIES ---

const parseCSV = (str) => {
  const arr = [];
  let quote = false;
  for (let row = 0, col = 0, c = 0; c < str.length; c++) {
    let cc = str[c], nc = str[c+1];
    arr[row] = arr[row] || [];
    arr[row][col] = arr[row][col] || '';
    if (cc == '"' && quote && nc == '"') { arr[row][col] += cc; ++c; continue; }
    if (cc == '"') { quote = !quote; continue; }
    if (cc == ',' && !quote) { ++col; continue; }
    if (cc == '\r' && nc == '\n' && !quote) { ++row; col = 0; ++c; continue; }
    if (cc == '\n' && !quote) { ++row; col = 0; continue; }
    if (cc == '\r' && !quote) { ++row; col = 0; continue; }
    arr[row][col] += cc;
  }
  return arr;
};

// --- 4. DATA HOOKS (Production Data Layer) ---

const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check if user is already signed in
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setLoading(false);
      } else {
        // 2. If not, sign them in anonymously
        signInAnonymously(auth).catch((error) => {
          console.error("Auth failed. Did you enable Anonymous Auth in Firebase Console?", error);
          setLoading(false);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
};

const useGroups = (user) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    
    // Using a root collection 'groups' for simplicity in this setup
    const q = query(collection(db, 'groups'), orderBy('name'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setGroups(snapshot.docs.map(doc => doc.data().name));
      setLoading(false);
    }, (err) => {
      console.error("Firestore Error:", err);
      if (err.code === 'permission-denied') {
        setError("Permission Denied. Check Firestore Rules.");
      } else {
        setError("Failed to sync. Check internet.");
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [user]);

  const addGroup = async (name) => {
    if(!name) return;
    try {
      await addDoc(collection(db, 'groups'), {
        name,
        created_at: serverTimestamp(),
        created_by: user.uid
      });
    } catch (e) {
      console.error("Error adding group:", e);
      alert("Error adding group: " + e.message);
    }
  };

  return { groups, loading, error, addGroup };
};

const useContributions = (user, group) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !group) {
        setData([]);
        return;
    }
    
    setLoading(true);
    // Query contributions
    const q = query(
        collection(db, 'contributions'), 
        orderBy('date_added', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        // Client-side filter for simplicity
        const filtered = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(d => d.group_name === group);
            
        setData(filtered);
        setLoading(false);
    }, (err) => {
        console.error(err);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user, group]);

  const addContribution = async (entry) => {
    try {
      await addDoc(collection(db, 'contributions'), {
          ...entry,
          date_added: new Date().toISOString()
      });
    } catch (e) {
      alert("Failed to save: " + e.message);
    }
  };

  return { data, loading, addContribution };
};

// --- 5. UI COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', size = 'normal', className = '', icon: Icon, highContrast, disabled, loading }) => {
  const base = "rounded-2xl font-bold transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-3 shadow-lg relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed";
  
  const sizes = highContrast ? {
    normal: "py-5 px-8 text-xl",
    large: "py-6 px-10 text-2xl",
    small: "py-3 px-6 text-lg"
  } : {
    normal: "py-3.5 px-6 text-sm md:text-base",
    large: "py-5 px-8 text-lg",
    small: "py-2 px-4 text-xs"
  };

  const standardStyles = {
    primary: "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white border-t border-white/20 shadow-blue-900/40",
    secondary: "bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-md",
    accent: "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:brightness-110 shadow-emerald-900/20",
    danger: "bg-red-500/10 hover:bg-red-500 text-red-200 hover:text-white border border-red-500/20"
  };

  const accessStyles = {
    primary: "bg-yellow-400 text-black border-2 border-yellow-400 hover:bg-yellow-300 font-black",
    secondary: "bg-black text-white border-2 border-white hover:bg-white hover:text-black font-bold",
    accent: "bg-white text-black border-4 border-black font-black",
    danger: "bg-red-600 text-white border-2 border-white font-bold"
  };

  return (
    <button onClick={onClick} disabled={disabled || loading} className={`${base} ${sizes[size]} ${highContrast ? accessStyles[variant] : standardStyles[variant]} ${className}`}>
      {loading ? <RefreshCcw className="animate-spin" size={20} /> : (Icon && <Icon size={highContrast ? (size === 'large' ? 32 : 24) : (size === 'large' ? 24 : 18)} />)}
      {children}
    </button>
  );
};

const Input = ({ label, icon: Icon, type = "text", value, onChange, placeholder, helpText, highContrast }) => (
  <div className="mb-6 group">
    <label className={`block font-bold uppercase tracking-widest mb-2 ml-1 transition-all ${highContrast ? 'text-yellow-300 text-lg' : 'text-xs text-blue-200 opacity-80'}`}>
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${highContrast ? 'text-yellow-400' : 'text-blue-300/50'}`}>
          <Icon size={highContrast ? 28 : 20} />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={highContrast ? { fontSize: '1.25rem', padding: '1.5rem' } : {}}
        className={`w-full rounded-2xl ${Icon ? (highContrast ? 'pl-14' : 'pl-12') : 'pl-5'} ${highContrast ? 'pr-6 py-6 border-4 border-white bg-black text-white placeholder-gray-500 focus:border-yellow-400' : 'pr-5 py-4 bg-black/20 border-2 border-white/5 text-white placeholder-blue-200/20 focus:border-blue-500/50'} focus:outline-none transition-all font-medium`}
      />
    </div>
    {helpText && <p className={`${highContrast ? 'text-white text-base font-bold' : 'text-[11px] text-blue-200/40'} mt-2 ml-1`}>{helpText}</p>}
  </div>
);

const GlassCard = ({ children, className = "", title, subtitle, highContrast, action }) => (
  <div className={`overflow-hidden ${highContrast ? 'bg-black border-4 border-white rounded-xl shadow-none' : 'bg-[#1e293b]/60 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl'} ${className}`}>
    {(title || subtitle) && (
      <div className={`p-6 md:p-8 border-b ${highContrast ? 'bg-white border-black' : 'border-white/5 bg-white/5'} flex justify-between items-center`}>
        <div>
          {title && <h3 className={`${highContrast ? 'text-2xl font-black text-black' : 'text-xl font-bold text-white'}`}>{title}</h3>}
          {subtitle && <p className={`${highContrast ? 'text-black font-bold text-lg' : 'text-blue-200/60 text-sm'} mt-1`}>{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className="p-6 md:p-8">
      {children}
    </div>
  </div>
);

// --- 6. MAIN APP CONTROLLER ---

export default function DigitalTreasurer() {
  const { user, loading: authLoading } = useAuth();
  const [highContrast, setHighContrast] = useState(false);
  const [activeGroup, setActiveGroup] = useState(null);

  // Global loading state for initial connection
  if (authLoading) {
    return (
      <div className="w-full h-screen bg-[#0b1121] flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-blue-200 animate-pulse">Connecting to Database...</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={`relative w-full h-screen overflow-hidden font-sans selection:bg-blue-500/30 ${highContrast ? 'bg-black text-white' : 'bg-[#0b1121] text-white'}`}>
        
        {!highContrast && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[100vw] h-[100vw] bg-blue-900/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[100vw] bg-indigo-900/10 rounded-full blur-[120px]"></div>
          </div>
        )}

        {/* Accessibility Toggle */}
        <div className="absolute top-4 right-4 z-[100]">
          <button 
            onClick={() => setHighContrast(!highContrast)}
            className={`p-3 rounded-full flex items-center gap-2 transition-all shadow-xl ${highContrast ? 'bg-yellow-400 text-black font-bold border-4 border-white scale-110' : 'bg-white/10 text-white hover:bg-white/20 backdrop-blur-md'}`}
          >
            {highContrast ? <Eye size={24} /> : <Accessibility size={20} />}
            {highContrast ? "Exit Large Mode" : "Eye Friendly Mode"}
          </button>
        </div>

        {/* Application State: If no group selected -> GroupPicker, else -> Workspace */}
        <div className="relative w-full h-full">
            {activeGroup ? (
                <Workspace 
                    user={user} 
                    group={activeGroup} 
                    onExit={() => setActiveGroup(null)} 
                    highContrast={highContrast} 
                />
            ) : (
                <GroupPicker 
                    user={user} 
                    onSelect={setActiveGroup} 
                    highContrast={highContrast} 
                />
            )}
        </div>
      </div>
    </ErrorBoundary>
  );
}

// --- 7. GROUP PICKER (The Landing) ---

function GroupPicker({ user, onSelect, highContrast }) {
    const { groups, loading, error, addGroup } = useGroups(user);
    const [isAdding, setIsAdding] = useState(false);
    const [newVal, setNewVal] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const filtered = groups.filter(g => g.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <div className="w-full max-w-md animate-fadeIn">
                <div className="text-center mb-8">
                    <div className={`inline-flex items-center justify-center w-24 h-24 rounded-3xl mb-6 ${highContrast ? 'bg-yellow-400 border-4 border-white' : 'bg-blue-600 shadow-xl shadow-blue-600/20'}`}>
                        <Wallet size={48} className={highContrast ? 'text-black' : 'text-white'} />
                    </div>
                    <h1 className={`font-bold mb-2 ${highContrast ? 'text-4xl text-yellow-400' : 'text-3xl text-white'}`}>Digital Treasurer</h1>
                    <p className={`${highContrast ? 'text-white text-xl' : 'text-blue-200/70 text-lg'}`}>Select a group to manage</p>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-xl flex items-center gap-3 text-red-200 mb-6">
                        <WifiOff size={20} /> {error}
                    </div>
                )}

                <GlassCard highContrast={highContrast} className="min-h-[400px] flex flex-col">
                    <div className="relative mb-4">
                        <Search className={`absolute left-3 top-3.5 ${highContrast ? 'text-black' : 'text-blue-200/30'}`} size={20} />
                        <input 
                            placeholder="Find organization..."
                            className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${highContrast ? 'bg-white text-black font-bold border-2 border-gray-400' : 'bg-black/20 border border-white/10 text-white focus:border-blue-500/50'}`}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {!isAdding ? (
                        <button 
                        onClick={() => setIsAdding(true)}
                        className={`w-full py-4 border-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 mb-4 ${highContrast ? 'border-yellow-400 text-yellow-400 bg-black hover:bg-yellow-400 hover:text-black' : 'border-dashed border-white/10 text-blue-200/50 hover:text-white hover:border-white/30 hover:bg-white/5'}`}
                        >
                        <Plus size={20} /> Create New Group
                        </button>
                    ) : (
                        <div className={`p-3 rounded-xl mb-4 animate-slideDown ${highContrast ? 'bg-yellow-400 border-4 border-white' : 'bg-white/5 border border-white/10'}`}>
                            <input 
                                autoFocus
                                className={`w-full rounded-lg p-2 text-sm mb-2 outline-none ${highContrast ? 'bg-black text-white font-bold' : 'bg-black/40 border border-white/10 text-white focus:border-blue-500'}`}
                                value={newVal}
                                placeholder="Group Name..."
                                onChange={e => setNewVal(e.target.value)}
                            />
                            <div className="flex gap-2">
                                <button onClick={() => { if(newVal) { addGroup(newVal); setIsAdding(false); setNewVal(''); }}} className="flex-1 bg-black text-white py-2 rounded-lg text-xs font-bold">Save</button>
                                <button onClick={() => setIsAdding(false)} className="flex-1 bg-white/20 text-black py-2 rounded-lg text-xs font-bold">Cancel</button>
                            </div>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px]">
                        {loading && <div className="text-center py-4 text-blue-200/50">Loading groups...</div>}
                        
                        {!loading && filtered.length === 0 && <div className="text-center py-4 text-gray-500">No groups found</div>}

                        {filtered.map(g => (
                            <button
                                key={g}
                                onClick={() => onSelect(g)}
                                className={`w-full text-left p-4 rounded-2xl transition-all flex items-center justify-between group relative overflow-hidden ${highContrast ? 'bg-white border-2 border-gray-600 hover:bg-yellow-400' : 'bg-white/5 hover:bg-white/10'}`}
                            >
                                <div className="flex items-center gap-3 relative z-10">
                                    <Users size={highContrast ? 24 : 18} className={`${highContrast ? 'text-black' : 'text-blue-200/50'}`} />
                                    <span className={`font-bold ${highContrast ? 'text-lg text-black' : 'text-blue-100'}`}>{g}</span>
                                </div>
                                <ChevronRight size={highContrast ? 24 : 16} className={`${highContrast ? 'text-black' : 'text-blue-200/50'} relative z-10`} />
                            </button>
                        ))}
                    </div>
                </GlassCard>
            </div>
        </div>
    )
}

// --- 8. WORKSPACE (Active Management) ---

function Workspace({ user, group, onExit, highContrast }) {
  const { data, loading, addContribution } = useContributions(user, group);
  const [currentView, setCurrentView] = useState('home');
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  const renderView = () => {
    switch(currentView) {
      case 'add': return <AddMoneyForm group={group} onSave={addContribution} onBack={() => setCurrentView('home')} highContrast={highContrast} />;
      case 'import': return <ImportSheetForm group={group} onSave={addContribution} onBack={() => setCurrentView('home')} highContrast={highContrast} />;
      case 'report': return <ReportView group={group} data={data} onBack={() => setCurrentView('home')} highContrast={highContrast} />;
      case 'history': return <HistoryView data={data} onBack={() => setCurrentView('home')} highContrast={highContrast} />;
      default: return (
        <HomeDashboard 
          group={group} 
          total={totalAmount} 
          count={data.length} 
          recent={data.slice(0, 3)}
          loading={loading}
          onNavigate={setCurrentView} 
          highContrast={highContrast} 
          onExit={onExit}
        />
      );
    }
  };

  return <div className="w-full h-full overflow-y-auto p-4 md:p-8 animate-fadeIn">{renderView()}</div>;
}

function HomeDashboard({ group, total, count, recent, loading, onNavigate, highContrast, onExit }) {
  return (
    <div className="max-w-4xl mx-auto pb-20">
      
      {/* Navigation Header */}
      <div className="flex items-center justify-between mb-6">
          <button onClick={onExit} className={`flex items-center gap-2 font-bold ${highContrast ? 'text-yellow-400' : 'text-blue-300 hover:text-white'}`}>
              <ArrowLeft /> Switch Group
          </button>
      </div>

      <GlassCard className={`mb-8 ${highContrast ? '' : 'bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-blue-500/30'}`} highContrast={highContrast}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
           <div>
             <h2 className={`font-bold ${highContrast ? 'text-4xl text-black' : 'text-3xl text-white'} mb-1`}>{group}</h2>
             <p className={highContrast ? 'text-black font-bold text-xl' : 'text-blue-200/60'}>Overview Dashboard</p>
           </div>
           <div className={`p-4 rounded-2xl border min-w-[200px] ${highContrast ? 'bg-black border-black' : 'bg-black/30 border-white/10'}`}>
              <p className={`text-xs uppercase tracking-widest mb-1 ${highContrast ? 'text-yellow-400 font-bold' : 'text-blue-200/50'}`}>Total Collected</p>
              {loading ? (
                  <div className="h-8 w-24 bg-white/10 rounded animate-pulse"></div>
              ) : (
                  <p className={`font-bold ${highContrast ? 'text-4xl text-white' : 'text-3xl text-emerald-400'}`}>KES {total.toLocaleString()}</p>
              )}
           </div>
        </div>
      </GlassCard>

      <h3 className={`font-bold mb-4 px-2 ${highContrast ? 'text-2xl text-yellow-400' : 'text-lg text-white'}`}>Quick Actions</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
         <ActionCard title="Add Money" desc="Record new payment" icon={Plus} color="bg-blue-600" onClick={() => onNavigate('add')} highContrast={highContrast} />
         <ActionCard title="WhatsApp Report" desc="Generate colorful text" icon={FileText} color="bg-emerald-600" onClick={() => onNavigate('report')} highContrast={highContrast} />
         <ActionCard title="Import Google Sheet" desc="Fetch from web link" icon={CloudLightning} color="bg-sky-600" onClick={() => onNavigate('import')} highContrast={highContrast} />
         <ActionCard title="View History" desc="See full ledger" icon={History} color="bg-orange-600" onClick={() => onNavigate('history')} highContrast={highContrast} />
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
         <h3 className={`font-bold ${highContrast ? 'text-2xl text-yellow-400' : 'text-lg text-white'}`}>Recent Activity</h3>
      </div>

      <div className="space-y-3">
        {loading && <div className="p-8 text-center text-blue-200/30">Syncing data...</div>}
        {!loading && recent.length === 0 && <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl">No records yet.</div>}
        
        {recent.map(r => (
            <div key={r.id} className={`p-4 rounded-2xl flex items-center justify-between ${highContrast ? 'bg-white border-4 border-white' : 'bg-white/5 border border-white/5'}`}>
               <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${highContrast ? 'bg-black text-yellow-400' : 'bg-white/5 text-blue-200'}`}>
                     <User size={highContrast ? 28 : 18} />
                  </div>
                  <div>
                    <p className={`font-bold ${highContrast ? 'text-black text-xl' : 'text-white'}`}>{r.member_name}</p>
                    <p className={`${highContrast ? 'text-gray-800 font-semibold' : 'text-xs text-blue-200/50'}`}>{new Date(r.date_added).toLocaleDateString()} • {r.event_type}</p>
                  </div>
               </div>
               <div className="text-right">
                  <p className={`font-bold ${highContrast ? 'text-black text-2xl' : 'text-emerald-400'}`}>+ {r.amount.toLocaleString()}</p>
                  <p className={`text-xs ${highContrast ? 'text-gray-800' : 'text-blue-200/30'}`}>{r.payment_mode}</p>
               </div>
            </div>
        ))}
      </div>
    </div>
  );
}

function ActionCard({ title, desc, icon: Icon, color, onClick, highContrast }) {
  return (
    <button onClick={onClick} className={`text-left group relative overflow-hidden p-6 rounded-3xl transition-all duration-300 ${highContrast ? 'bg-white border-4 border-white hover:bg-yellow-400 hover:border-yellow-400' : 'bg-[#1e293b] border border-white/10 hover:-translate-y-1 hover:shadow-xl'}`}>
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${highContrast ? 'bg-black' : color}`}>
          <Icon className={highContrast ? "text-yellow-400" : "text-white"} size={32} />
       </div>
       <h4 className={`font-bold mb-1 ${highContrast ? 'text-3xl text-black' : 'text-lg text-white'}`}>{title}</h4>
       <p className={`${highContrast ? 'text-black font-semibold text-lg' : 'text-sm text-blue-200/50'}`}>{desc}</p>
    </button>
  );
}

// --- 9. FORMS & ACTIONS ---

function AddMoneyForm({ group, onBack, onSave, highContrast }) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState('M-Pesa');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if(!name || !amount) return;
    setLoading(true);
    await onSave({
        group_name: group,
        member_name: name,
        amount: parseFloat(amount),
        payment_mode: mode,
        transaction_code: 'N/A',
        event_type: 'Welfare'
    });
    setLoading(false);
    onBack();
  };

  return (
    <div className="max-w-2xl mx-auto">
       <button onClick={onBack} className={`flex items-center gap-2 mb-6 ${highContrast ? 'text-yellow-400 text-xl font-bold' : 'text-blue-300'}`}>
          <ArrowLeft /> Back
       </button>
       <GlassCard title="Add Money" subtitle="Record payment." highContrast={highContrast}>
          <Input label="Name" placeholder="e.g. Jane" value={name} onChange={setName} icon={User} highContrast={highContrast} />
          <Input label="Amount" type="number" placeholder="500" value={amount} onChange={setAmount} icon={CreditCard} highContrast={highContrast} />
          
          <div className="mb-8">
             <label className={`block font-bold uppercase tracking-widest mb-3 ml-1 ${highContrast ? 'text-yellow-300 text-lg' : 'text-xs text-blue-200'}`}>Method</label>
             <div className="grid grid-cols-3 gap-3">
                {['M-Pesa', 'Cash', 'Bank'].map(m => (
                   <button key={m} onClick={() => setMode(m)} className={`py-4 rounded-xl font-bold border transition-all ${mode === m ? (highContrast ? 'bg-yellow-400 text-black border-white' : 'bg-blue-600 border-blue-500 text-white') : (highContrast ? 'bg-black text-white border-white' : 'bg-black/20 text-blue-200/50')}`}>
                     {m}
                   </button>
                ))}
             </div>
          </div>
          <Button size="large" onClick={handleSubmit} className="w-full" highContrast={highContrast} loading={loading}>Save</Button>
       </GlassCard>
    </div>
  );
}

function ImportSheetForm({ group, onBack, onSave, highContrast }) {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.includes('docs.google.com') || !url.includes('output=csv')) {
        setStatus('❌ Invalid Link. Make sure it ends with output=csv');
        return;
    }
    
    setLoading(true);
    setStatus('⏳ Fetching data...');
    
    try {
        const response = await fetch(url);
        const text = await response.text();
        const rows = parseCSV(text);
        
        let count = 0;
        const promises = [];

        rows.forEach((row, index) => {
            if(index === 0) return; // Skip Header
            if(row.length < 2) return;
            const [name, amt, mode, evt] = row;
            if(name && amt) {
                // Batching would be better, but parallel promises work for small sets
                promises.push(onSave({
                    group_name: group,
                    member_name: name,
                    amount: parseFloat(amt),
                    payment_mode: mode || 'Import',
                    transaction_code: 'CSV',
                    event_type: evt || 'General'
                }));
                count++;
            }
        });
        
        await Promise.all(promises);

        setStatus(`✅ Success! Imported ${count} records.`);
        setTimeout(() => { setLoading(false); onBack(); }, 1500);

    } catch (e) {
        console.error(e);
        setStatus('❌ Error fetching data. Check internet.');
        setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className={`flex items-center gap-2 mb-6 ${highContrast ? 'text-yellow-400 text-xl font-bold' : 'text-blue-300'}`}>
          <ArrowLeft /> Back
      </button>
      <GlassCard title="Import Google Sheet" subtitle="Paste your 'Published to Web' CSV link below." highContrast={highContrast}>
         <Input 
           label="CSV Link" 
           icon={CloudLightning}
           placeholder="https://docs.google.com/...output=csv" 
           value={url} 
           onChange={setUrl} 
           highContrast={highContrast}
         />
         {status && <p className={`mb-4 font-bold text-center ${status.includes('❌') ? 'text-red-500' : 'text-emerald-500'}`}>{status}</p>}
         <Button size="large" onClick={handleImport} className="w-full" highContrast={highContrast} icon={Download} loading={loading}>
            Start Import
         </Button>
      </GlassCard>
    </div>
  )
}

function ReportView({ group, data, onBack, highContrast }) {
    const generateText = () => {
        const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        const mpesa = data.filter(d => d.payment_mode === 'M-Pesa').reduce((a,b) => a + b.amount, 0);
        const cash = data.filter(d => d.payment_mode === 'Cash').reduce((a,b) => a + b.amount, 0);
        const total = data.reduce((a,b) => a + b.amount, 0);

        let txt = `📊 *FINANCIAL UPDATE: ${group.toUpperCase()}*\n`;
        txt += `📅 *Date:* ${today}\n`;
        txt += `━━━━━━━━━━━━━━━━━━\n\n`;
        
        txt += `*CONTRIBUTIONS LIST:*\n`;
        data.forEach((d, i) => {
            const icon = d.amount >= 1000 ? '🌟' : '✅';
            txt += `${icon} ${i+1}. *${d.member_name}* : KES ${d.amount.toLocaleString()}\n`;
        });

        txt += `\n━━━━━━━━━━━━━━━━━━\n`;
        txt += `*SUMMARY BROKEN DOWN:*\n`;
        txt += `📱 M-Pesa: ${mpesa.toLocaleString()}\n`;
        txt += `💵 Cash: ${cash.toLocaleString()}\n`;
        txt += `🏦 Bank: ${(total - mpesa - cash).toLocaleString()}\n`;
        txt += `\n💰 *GRAND TOTAL: KES ${total.toLocaleString()}*\n`;
        txt += `━━━━━━━━━━━━━━━━━━\n`;
        
        return txt;
    };

    const copy = () => {
        navigator.clipboard.writeText(generateText());
        alert("Report copied to clipboard!");
    };

    return (
        <div className="max-w-2xl mx-auto h-full flex flex-col">
            <button onClick={onBack} className={`flex items-center gap-2 mb-6 ${highContrast ? 'text-yellow-400 text-xl font-bold' : 'text-blue-300'}`}>
                <ArrowLeft /> Back
            </button>
            <GlassCard className="flex-1 flex flex-col" title="WhatsApp Report" subtitle="Colorful and formatted." highContrast={highContrast}>
                <div className={`flex-1 rounded-xl p-4 border overflow-y-auto mb-6 whitespace-pre-wrap ${highContrast ? 'bg-white text-black font-mono font-bold text-lg border-black' : 'bg-black/40 border-white/10 font-mono text-sm text-blue-100'}`}>
                    {generateText()}
                </div>
                <Button onClick={copy} variant="primary" icon={FileText} className="w-full" highContrast={highContrast} size="large">
                    Copy Text
                </Button>
            </GlassCard>
        </div>
    );
}

function HistoryView({ data, onBack, highContrast }) {
    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
             <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className={`flex items-center gap-2 ${highContrast ? 'text-yellow-400 text-xl font-bold' : 'text-blue-300'}`}><ArrowLeft /> Back</button>
             </div>
             <GlassCard className="flex-1 overflow-hidden flex flex-col p-0 md:p-0" highContrast={highContrast}>
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left">
                        <thead className={`sticky top-0 z-10 ${highContrast ? 'bg-yellow-400 text-black text-xl font-black' : 'bg-white/5 text-blue-200 text-xs uppercase'}`}>
                            <tr><th className="p-4 md:p-6">Date</th><th className="p-4 md:p-6">Name</th><th className="p-4 md:p-6 text-right">Amount</th></tr>
                        </thead>
                        <tbody className={`divide-y ${highContrast ? 'divide-black bg-white text-black font-bold text-xl' : 'divide-white/5 text-sm md:text-base text-white'}`}>
                            {data.map(d => (
                                <tr key={d.id} className={highContrast ? 'hover:bg-gray-100' : 'hover:bg-white/5'}>
                                    <td className="p-4 md:p-6">{new Date(d.date_added).toLocaleDateString()}</td>
                                    <td className="p-4 md:p-6">{d.member_name}</td>
                                    <td className="p-4 md:p-6 text-right">{d.amount.toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </GlassCard>
        </div>
    )
}
