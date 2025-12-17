import React, { useState, useEffect, useMemo, Component } from 'react';
import { 
  ShieldCheck, Wallet, Users, LogOut, Menu, Plus, History,
  FileText, Package, X, Search, ChevronRight, ArrowLeft,
  CheckCircle2, Home, User, CreditCard, Calendar, Eye, 
  Download, CloudLightning, Settings, Accessibility,
  AlertTriangle, WifiOff, RefreshCcw, Share2, Flame, ExternalLink
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { 
  getFirestore, collection, addDoc, onSnapshot, 
  query, orderBy, serverTimestamp, where 
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';

// --- 1. CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyBOlHLgbNP-l5pouDKrJoEM-6D8IlGgfYY",
  authDomain: "digital-treasurer.firebaseapp.com",
  projectId: "digital-treasurer",
  storageBucket: "digital-treasurer.firebasestorage.app",
  messagingSenderId: "373137625124",
  appId: "1:373137625124:web:208a214488f19fa83748b1",
  measurementId: "G-KBF15P2F06"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);           
const db = getFirestore(app);        

// --- 2. ERROR BOUNDARY ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError(error) { return { hasError: true }; }
  render() {
    if (this.state.hasError) return <div className="h-screen bg-black text-white flex items-center justify-center p-4 text-center"><h1>Something went wrong. Please reload the page.</h1></div>;
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

// --- 4. DATA HOOKS ---
const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setLoading(false); }
      else { signInAnonymously(auth).catch(console.error); }
    });
    return () => unsub();
  }, []);
  return { user, loading };
};

const useGroups = (user) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'groups'), orderBy('name'));
    const unsub = onSnapshot(q, (snap) => {
      setGroups(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (e) => { console.error(e); setLoading(false); });
    return () => unsub();
  }, [user]);

  const addGroup = async (name, eventType) => {
    if(!name) return;
    await addDoc(collection(db, 'groups'), { 
      name, 
      eventType, 
      created_at: serverTimestamp(), 
      created_by: user.uid 
    });
  };
  return { groups, loading, addGroup };
};

const useContributions = (groupName) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!groupName) return;
    setLoading(true);
    const q = query(collection(db, 'contributions'), orderBy('date_added', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
        const filtered = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(d => d.group_name === groupName);
        setData(filtered);
        setLoading(false);
    });
    return () => unsub();
  }, [groupName]);

  const addContribution = async (entry) => {
    await addDoc(collection(db, 'contributions'), { ...entry, date_added: new Date().toISOString() });
  };
  return { data, loading, addContribution };
};

// --- 5. UI COMPONENTS ---
const Button = ({ children, onClick, variant='primary', className='', icon: Icon, highContrast }) => {
  const base = "rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 py-3 px-6 shadow-lg";
  const styles = highContrast 
    ? { primary: "bg-yellow-400 text-black border-2 border-white", accent: "bg-white text-black border-2 border-white" }
    : { primary: "bg-blue-600 text-white hover:bg-blue-500", accent: "bg-emerald-600 text-white hover:bg-emerald-500", danger: "bg-red-500/20 text-red-200 border border-red-500/50" };
  
  return (
    <button onClick={onClick} className={`${base} ${styles[variant] || styles.primary} ${className}`}>
      {Icon && <Icon size={20} />} {children}
    </button>
  );
};

const Input = ({ label, value, onChange, placeholder, highContrast }) => (
  <div className="mb-4">
    <label className={`block font-bold text-xs uppercase mb-1 ${highContrast ? 'text-yellow-400' : 'text-blue-200'}`}>{label}</label>
    <input 
      className={`w-full rounded-lg p-3 outline-none ${highContrast ? 'bg-white text-black font-bold border-2 border-white' : 'bg-white/10 text-white border border-white/20 focus:border-blue-500'}`}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    />
  </div>
);

const GlassCard = ({ children, className='', highContrast }) => (
  <div className={`overflow-hidden rounded-2xl ${highContrast ? 'bg-black border-4 border-white' : 'bg-[#1e293b]/80 backdrop-blur-xl border border-white/10 shadow-2xl'} ${className}`}>
    {children}
  </div>
);

// --- 6. MAIN APP ---
export default function DigitalTreasurer() {
  const { user, loading } = useAuth();
  const [highContrast, setHighContrast] = useState(false);
  
  // URL State for Public Links
  const [urlGroup, setUrlGroup] = useState(null);
  const [isPublicMode, setIsPublicMode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const g = params.get('group');
    const p = params.get('public');
    if (g) {
      setUrlGroup(decodeURIComponent(g));
      if (p === 'true') setIsPublicMode(true);
    }
  }, []);

  if (loading) return <div className="h-screen bg-slate-900 flex items-center justify-center text-white">Loading system...</div>;

  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${highContrast ? 'bg-black text-white' : 'bg-[#0b1121] text-white'} font-sans`}>
        {/* Access Toggle */}
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button onClick={() => setHighContrast(!highContrast)} className={`p-2 rounded-full ${highContrast ? 'bg-yellow-400 text-black' : 'bg-white/10'}`}>
            {highContrast ? <Eye size={24}/> : <Accessibility size={24}/>}
          </button>
        </div>

        {isPublicMode ? (
          <PublicDashboard groupName={urlGroup} highContrast={highContrast} />
        ) : (
          <AdminApp user={user} urlGroup={urlGroup} highContrast={highContrast} />
        )}
      </div>
    </ErrorBoundary>
  );
}

// --- 7. ADMIN APP ---
function AdminApp({ user, urlGroup, highContrast }) {
  const [activeGroup, setActiveGroup] = useState(urlGroup || null);
  
  return activeGroup ? (
    <Workspace 
      user={user} 
      group={activeGroup} 
      onExit={() => { setActiveGroup(null); window.history.pushState({}, '', '/'); }} 
      highContrast={highContrast} 
    />
  ) : (
    <GroupPicker user={user} onSelect={setActiveGroup} highContrast={highContrast} />
  );
}

// --- 8. GROUP PICKER (ADMIN) ---
function GroupPicker({ user, onSelect, highContrast }) {
  const { groups, addGroup } = useGroups(user);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [eventType, setEventType] = useState('Burial');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8">Digital Treasurer</h1>
        <GlassCard highContrast={highContrast} className="p-6 min-h-[400px]">
          {!isAdding ? (
            <>
              <Button onClick={() => setIsAdding(true)} className="w-full mb-6" highContrast={highContrast} icon={Plus}>Create New Group</Button>
              <div className="space-y-2">
                {groups.map(g => (
                  <button key={g.id} onClick={() => onSelect(g.name)} className={`w-full text-left p-4 rounded-xl flex justify-between items-center ${highContrast ? 'bg-white text-black border-2' : 'bg-white/5 hover:bg-white/10'}`}>
                    <div>
                      <div className="font-bold">{g.name}</div>
                      <div className="text-xs opacity-70">{g.eventType}</div>
                    </div>
                    <ChevronRight />
                  </button>
                ))}
                {groups.length === 0 && <div className="text-center opacity-50 py-8">No groups found.</div>}
              </div>
            </>
          ) : (
            <div className="animate-fadeIn">
              <h3 className="text-xl font-bold mb-4">New Group Details</h3>
              <Input label="Group Name" value={newName} onChange={setNewName} placeholder="e.g. Grandma's Visit" highContrast={highContrast} />
              
              <div className="mb-6">
                <label className="block font-bold text-xs uppercase mb-1 text-blue-200">Event Type</label>
                <select 
                  value={eventType} 
                  onChange={e => setEventType(e.target.value)}
                  className="w-full bg-slate-800 p-3 rounded-lg text-white border border-white/20"
                >
                  <option value="Burial">Burial</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Visiting Parents">Visiting Parents</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex gap-2">
                <Button onClick={() => { if(newName){ addGroup(newName, eventType); setIsAdding(false); } }} className="flex-1">Create</Button>
                <Button onClick={() => setIsAdding(false)} variant="accent" className="flex-1">Cancel</Button>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}

// --- 9. WORKSPACE (ADMIN) ---
function Workspace({ user, group, onExit, highContrast }) {
  const { data, addContribution } = useContributions(group);
  const [view, setView] = useState('home');

  const copyPublicLink = () => {
    const url = `${window.location.origin}/?group=${encodeURIComponent(group)}&public=true`;
    navigator.clipboard.writeText(url);
    alert("Public Link Copied! Share this on WhatsApp for transparency.");
  };

  const renderView = () => {
    switch(view) {
      case 'add': return <AddForm group={group} onSave={addContribution} onBack={() => setView('home')} highContrast={highContrast} />;
      case 'import': return <ImportForm group={group} onSave={addContribution} onBack={() => setView('home')} highContrast={highContrast} />;
      case 'report': return <ReportView group={group} data={data} onBack={() => setView('home')} highContrast={highContrast} />;
      case 'history': return <HistoryView group={group} data={data} onBack={() => setView('home')} highContrast={highContrast} />;
      default: return (
        <div className="max-w-3xl mx-auto pb-20">
          <div className="flex justify-between items-center mb-6">
            <button onClick={onExit} className="flex items-center gap-2 text-blue-300"><ArrowLeft size={20}/> Exit</button>
            <button onClick={copyPublicLink} className="flex items-center gap-2 text-emerald-400 border border-emerald-400 px-3 py-1 rounded-full text-sm hover:bg-emerald-400/10">
              <Share2 size={14} /> Share Public Link
            </button>
          </div>

          <GlassCard className="p-6 mb-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50" highContrast={highContrast}>
            <h2 className="text-3xl font-bold mb-1">{group}</h2>
            <div className="text-sm opacity-70 mb-4">Admin Dashboard</div>
            <div className="text-4xl font-bold text-emerald-400">
              KES {data.reduce((a,b) => a + (Number(b.amount)||0), 0).toLocaleString()}
            </div>
            <div className="text-xs uppercase tracking-widest mt-1 opacity-60">Total Collected</div>
          </GlassCard>

          <div className="grid grid-cols-2 gap-3 mb-8">
            <Button onClick={() => setView('add')} icon={Plus}>Add Cash</Button>
            <Button onClick={() => setView('import')} icon={CloudLightning} variant="accent">Import CSV</Button>
            <Button onClick={() => setView('report')} icon={FileText}>Report</Button>
            <Button onClick={() => setView('history')} icon={History} className="bg-orange-600 hover:bg-orange-500">History/Excel</Button>
          </div>

          <h3 className="font-bold text-lg mb-4">Recent Transactions</h3>
          <div className="space-y-2">
            {data.slice(0, 5).map(d => (
              <div key={d.id} className="p-4 rounded-xl bg-white/5 flex justify-between items-center">
                <div>
                  <div className="font-bold">{d.first_name} {d.second_name}</div>
                  <div className="text-xs opacity-60">{d.mpesa_code} • {d.firewood ? '🔥 Firewood' : ''}</div>
                </div>
                <div className="font-bold text-emerald-400">+{Number(d.amount).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  };

  return <div className="p-4 min-h-screen animate-fadeIn">{renderView()}</div>;
}

// --- 10. PUBLIC DASHBOARD (READ ONLY) ---
function PublicDashboard({ groupName, highContrast }) {
  const { data, loading } = useContributions(groupName);
  const total = data.reduce((a,b) => a + (Number(b.amount)||0), 0);

  return (
    <div className="p-4 max-w-3xl mx-auto min-h-screen">
      <div className="text-center mb-8 mt-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg shadow-blue-600/30">
          <ShieldCheck size={32} />
        </div>
        <h1 className="text-2xl font-bold">{groupName}</h1>
        <p className="text-emerald-400 text-sm font-bold uppercase tracking-widest">Transparency Portal</p>
      </div>

      <GlassCard className="p-8 text-center mb-8" highContrast={highContrast}>
        <div className="text-sm opacity-60 mb-2">TOTAL CONTRIBUTIONS</div>
        <div className="text-5xl font-bold text-white">KES {total.toLocaleString()}</div>
      </GlassCard>

      <div className="flex justify-between items-end mb-4 px-2">
        <h3 className="font-bold text-lg">Full List</h3>
        <div className="text-xs opacity-50">{data.length} Records</div>
      </div>

      <div className="space-y-2 pb-20">
        {loading && <div className="text-center opacity-50">Loading live data...</div>}
        {data.map(d => (
          <div key={d.id} className={`p-4 rounded-xl flex justify-between items-center ${highContrast ? 'bg-white text-black border-2' : 'bg-white/5 border border-white/5'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                {d.first_name?.[0]}
              </div>
              <div>
                <div className="font-bold">{d.first_name} {d.second_name}</div>
                <div className="text-xs opacity-60 flex gap-2">
                  <span>{d.mpesa_code}</span>
                  {d.firewood && <span className="text-orange-400 flex items-center gap-1"><Flame size={10}/> Firewood</span>}
                </div>
              </div>
            </div>
            <div className="font-mono font-bold">KES {Number(d.amount).toLocaleString()}</div>
          </div>
        ))}
        <div className="text-center text-xs opacity-30 mt-8 pt-8 border-t border-white/10">
          System Developed By: LilianMawia2025
        </div>
      </div>
    </div>
  );
}

// --- 11. FORMS ---
function AddForm({ group, onSave, onBack, highContrast }) {
  const [fName, setFName] = useState('');
  const [sName, setSName] = useState('');
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [firewood, setFirewood] = useState(false);

  const handleSubmit = () => {
    if(!fName || !amount) return;
    onSave({ 
      group_name: group, 
      first_name: fName, 
      second_name: sName, 
      amount: parseFloat(amount), 
      mpesa_code: code || 'CASH', 
      firewood 
    });
    onBack();
  };

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={onBack} className="mb-4 text-blue-300 flex gap-2"><ArrowLeft/> Back</button>
      <GlassCard className="p-6" highContrast={highContrast}>
        <h2 className="text-2xl font-bold mb-6">Add Contribution</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name" value={fName} onChange={setFName} highContrast={highContrast} />
          <Input label="Second Name" value={sName} onChange={setSName} highContrast={highContrast} />
        </div>
        <Input label="Amount (KES)" value={amount} onChange={setAmount} highContrast={highContrast} />
        <Input label="M-Pesa Code" value={code} onChange={setCode} placeholder="e.g. QWE123TY" highContrast={highContrast} />
        
        <div className="flex items-center gap-3 mb-8 p-4 bg-white/5 rounded-lg border border-white/10 cursor-pointer" onClick={() => setFirewood(!firewood)}>
          <div className={`w-6 h-6 rounded border flex items-center justify-center ${firewood ? 'bg-orange-500 border-orange-500' : 'border-white/30'}`}>
            {firewood && <CheckCircle2 size={16} />}
          </div>
          <span className="font-bold text-sm">Firewood Received?</span>
        </div>

        <Button onClick={handleSubmit} className="w-full">Save Record</Button>
      </GlassCard>
    </div>
  );
}

function ImportForm({ group, onSave, onBack, highContrast }) {
  const [csvText, setCsvText] = useState('');
  const [status, setStatus] = useState('');

  const processCSV = () => {
    const rows = parseCSV(csvText);
    let count = 0;
    
    // Naive Mapping for Demo: 
    // Assume format: [ReceiptNo, Date, Details, Status, PaidIn, ...]
    // Or standard Import: Code, Name, Amount
    rows.forEach((row, i) => {
        if (i < 1 || row.length < 3) return; // Skip potential header
        
        let code = row[0];
        let details = row[2] || row[0]; // Usually holds the name
        let amount = row[4] || row[1]; // Usually "Paid In" column in Mpesa statements

        // Clean amount
        let cleanAmt = typeof amount === 'string' ? parseFloat(amount.replace(/,/g, '')) : amount;

        if (cleanAmt && !isNaN(cleanAmt)) {
            // Split name from Details (e.g., "John Doe - 0712...")
            const nameParts = details.split(" ");
            const fName = nameParts[0] || "Unknown";
            const sName = nameParts[1] || "";

            onSave({
                group_name: group,
                first_name: fName,
                second_name: sName,
                amount: cleanAmt,
                mpesa_code: code,
                firewood: false
            });
            count++;
        }
    });
    setStatus(`Imported ${count} records successfully!`);
    setTimeout(onBack, 1500);
  };

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={onBack} className="mb-4 text-blue-300 flex gap-2"><ArrowLeft/> Back</button>
      <GlassCard className="p-6" highContrast={highContrast}>
        <h2 className="text-xl font-bold mb-2">Import M-Pesa CSV</h2>
        <p className="text-xs opacity-60 mb-4">Paste the content of your CSV file below. The system will auto-detect Names, Codes, and Amounts.</p>
        <textarea 
          className="w-full h-40 bg-black/30 p-4 rounded-xl text-xs font-mono border border-white/20 mb-4 text-white"
          placeholder="Paste CSV data here..."
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
        />
        {status && <div className="text-emerald-400 font-bold mb-4 text-center">{status}</div>}
        <Button onClick={processCSV} className="w-full">Process Data</Button>
      </GlassCard>
    </div>
  );
}

function ReportView({ group, data, onBack, highContrast }) {
  const generate = () => {
    const total = data.reduce((a,b) => a + (Number(b.amount)||0), 0);
    const date = new Date().toLocaleDateString();
    let txt = `*${group.toUpperCase()}*\n📅 ${date}\n\n`;
    txt += `*CONTRIBUTIONS LIST:*\n`;
    data.forEach((d, i) => {
      const fw = d.firewood ? " (+🪵 Firewood)" : "";
      txt += `${i+1}. ${d.first_name} ${d.second_name} (${d.mpesa_code}): KES ${d.amount}${fw}\n`;
    });
    txt += `\n💰 *TOTAL: KES ${total.toLocaleString()}*\n`;
    txt += `\n💎 *System by LilianMawia2025*`;
    return txt;
  };

  const copy = () => {
    navigator.clipboard.writeText(generate());
    alert("Report copied to clipboard!");
  };

  return (
    <div className="max-w-xl mx-auto">
      <button onClick={onBack} className="mb-4 text-blue-300 flex gap-2"><ArrowLeft/> Back</button>
      <GlassCard className="p-6" highContrast={highContrast}>
        <div className="bg-black/30 p-4 rounded-xl font-mono text-xs whitespace-pre-wrap mb-4 h-64 overflow-y-auto text-white">
          {generate()}
        </div>
        <div className="grid grid-cols-2 gap-2">
            <Button onClick={copy}>Copy Text</Button>
            <Button onClick={onBack} variant="accent">Close</Button>
        </div>
      </GlassCard>
    </div>
  );
}

function HistoryView({ group, data, onBack, highContrast }) {
    const handleDownloadExcel = () => {
        const XLSX = window.XLSX;
        if (!XLSX) { alert("Excel library is still loading..."); return; }

        const formattedData = data.map(item => ({
            Date: new Date(item.date_added).toLocaleDateString(),
            "First Name": item.first_name,
            "Second Name": item.second_name,
            "M-Pesa Code": item.mpesa_code,
            Amount: item.amount,
            "Firewood": item.firewood ? "Yes" : "No"
        }));

        formattedData.push({}); 
        formattedData.push({
            Date: '',
            "First Name": 'System Developed By:',
            "Second Name": 'LilianMawia2025',
            "M-Pesa Code": '',
            Amount: '',
            "Firewood": ''
        });
        
        const worksheet = XLSX.utils.json_to_sheet(formattedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Contributions");
        XLSX.writeFile(workbook, `${group}_Data.xlsx`);
    };

    return (
        <div className="max-w-4xl mx-auto h-full flex flex-col">
             <div className="flex items-center justify-between mb-6">
                <button onClick={onBack} className="flex items-center gap-2 text-blue-300"><ArrowLeft size={20}/> Back</button>
                <Button onClick={handleDownloadExcel} variant="accent" icon={Download} highContrast={highContrast}>Download Excel</Button>
             </div>
             <GlassCard className="flex-1 overflow-hidden flex flex-col p-0 md:p-0" highContrast={highContrast}>
                <div className="overflow-y-auto flex-1">
                    <table className="w-full text-left">
                        <thead className={`sticky top-0 z-10 ${highContrast ? 'bg-white text-black font-black' : 'bg-white/5 text-blue-200 text-xs uppercase'}`}><tr><th className="p-4">Date</th><th className="p-4">Name</th><th className="p-4">Code</th><th className="p-4 text-right">Amount</th></tr></thead>
                        <tbody className={`divide-y ${highContrast ? 'divide-black bg-white text-black font-bold' : 'divide-white/5 text-sm'}`}>
                            {data.map(d => (
                                <tr key={d.id} className={highContrast ? 'hover:bg-gray-100' : 'hover:bg-white/5'}>
                                    <td className="p-4">{new Date(d.date_added).toLocaleDateString()}</td>
                                    <td className="p-4">{d.first_name} {d.second_name}</td>
                                    <td className="p-4">{d.mpesa_code}</td>
                                    <td className="p-4 text-right">{d.amount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             </GlassCard>
        </div>
    )
}
