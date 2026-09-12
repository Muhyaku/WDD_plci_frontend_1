import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Search, Plus, ListFilter, CalendarDays, ChevronLeft, ChevronRight, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Loader2, Wallet, CreditCard, Utensils, FileText, Save, CheckCircle2, AlertCircle, Lock, Unlock, User, LogOut, Store, ShoppingBag, Eye, EyeOff, ChevronDown, ChevronUp, ArrowRight, PieChart, Receipt, Trash2, Download, RefreshCw, Printer, Info, History, CalendarClock, Menu, X, Settings, ShieldCheck, Pin, CheckSquare, Square, Pencil, Maximize, Minimize, Play, CheckCircle, Target, TargetIcon, BarChart3, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// const API_URL = "https://backend-mm-b8n7.vercel.app/api/transactions";
// const RECURRING_URL = "https://backend-mm-b8n7.vercel.app/api/recurring";
// const SETTINGS_URL = "https://backend-mm-b8n7.vercel.app/api/settings";
// const ACTIVITY_URL = "https://backend-mm-b8n7.vercel.app/api/activities"; 
// const MENU_MASTER_URL = "https://backend-mm-b8n7.vercel.app/api/menu"; // <-- TAMBAHIN INI


const API_URL = "https://backend-mm-v2.vercel.app/api/transactions";
const RECURRING_URL = "https://backend-mm-v2.vercel.app/api/recurring";
const SETTINGS_URL = "https://backend-mm-v2.vercel.app/api/settings";
const ACTIVITY_URL = "https://backend-mm-v2.vercel.app/api/activities"; 
const MENU_MASTER_URL = "https://backend-mm-v2.vercel.app/api/menu"; // <-- TAMBAHIN INI
const PROGRESS_URL = "https://backend-mm-v2.vercel.app/api/progress";
const MODAL_SENEN_URL = "https://backend-mm-v2.vercel.app/api/modal-senen"; // Ganti ke URL backend lu


const BRANCH_CONFIG = {
  '9090': { id: 'mm1', name: 'Mutiara Minang - Kantin SMB', brand: 'minang', sheetName: 'MM Kantin SMB', bg: 'bg-red-50', color: 'text-red-600' },
  '6060': { id: 'mm2', name: 'Mutiara Minang - Villa MG', brand: 'minang', sheetName: 'MM Villa MG', bg: 'bg-red-50', color: 'text-red-600' },
  '3030': { id: 'mm3', name: 'Mutiara Minang - Sinpasa', brand: 'minang', sheetName: 'MM Sinpasa', bg: 'bg-red-50', color: 'text-red-600' },
  '1010': { id: 'plci1', name: 'Pecel Lele Cabe Ijo - Kantin SMB', brand: 'pecel', sheetName: 'PLCI Kantin SMB', bg: 'bg-green-50', color: 'text-green-600' },
  '1234': { id: 'pusat', name: 'Testing Pusat', brand: 'pecel', sheetName: 'Testing Pusat', bg: 'bg-green-50', color: 'text-green-600' },
  '8080': { id: 'senen', name: 'Mutiara Minang - Aeon & Villa MG', brand: 'minang', sheetName: 'MM Aeon & Villa MG', bg: 'bg-blue-50', color: 'text-blue-600', isInputMode: true } // <-- INI BARU
};

// Konfigurasi PIN khusus akses Dapur masing-masing cabang
const KITCHEN_PINS = {
  '3838': 'mm1',   // Dapur MM Kantin SMB
  '6868': 'mm2',   // Dapur MM Villa MG
  '3333': 'mm3',   // Dapur MM Sinpasa
  '1818': 'plci1', // Dapur PLCI Kantin SMB
  '1212': 'pusat'  // Dapur Pusat
};

const SHARED_BRANCHES = ['MM Kantin SMB', 'MM Sinpasa', 'PLCI Kantin SMB']; // Yg digabung. Villa MG (6060) terpisah.

export default function App() {
  const [userRole, setUserRole] = useState(null);
  const [activeBranch, setActiveBranch] = useState(null);
  const [rawData, setRawData] = useState([]);
  const [appSettings, setAppSettings] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

const fetchData = async (role = userRole, branch = activeBranch) => {
    setIsFetching(true);
    try {
      if (role === 'admin') {
         try { await fetch(`${RECURRING_URL}/trigger`, { method: 'POST' }); } catch (e) { console.log(e); }
      }
      
      // Ambil tanggal hari ini format Indo
      const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      
      // BIKIN SMART FETCH URL: Admin tarik semua, Kasir cuma narik hari ini!
      const fetchUrl = role === 'admin' 
         ? API_URL 
         : `${API_URL}?sheet=${encodeURIComponent(branch.sheetName)}&tanggal=${encodeURIComponent(todayStr)}`;

      const [resData, resSettings] = await Promise.all([
         fetch(fetchUrl),
         fetch(SETTINGS_URL)
      ]);
      
      const data = await resData.json();
      const settings = await resSettings.json();
      setRawData(data);
      setAppSettings(settings);
    } catch (error) { console.error("Gagal narik data:", error); } 
    finally { setIsFetching(false); }
  };
  
  useEffect(() => { 
    if (userRole) fetchData(userRole, activeBranch); 
  }, [userRole, activeBranch]);

const formatRupiah = (number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
    .format(number || 0)
    .replace(/\u00A0/g, ' ') // <-- Bersiin spasi alien (NBSP)
    .replace(/Rp\s?/g, 'Rp. '); // <-- Biar formatnya sekalian rapi pake titik (Rp. 10.000)

// --- FUNGSI DELETE DENGAN OPTIMISTIC UPDATE (UI INSTAN) ---
  const handleDelete = async (id, isHardDelete = false) => {
    // 1. UPDATE UI LANGSUNG (Tanpa nunggu server)
    setRawData(prevData => {
      if (isHardDelete) {
        return prevData.filter(item => item._id !== id);
      } else {
        return prevData.map(item => 
          item._id === id ? { ...item, isDeleted: true, deletedAt: new Date().toISOString() } : item
        );
      }
    });

    // 2. KIRIM KE SERVER DI BACKGROUND
    try {
      if (isHardDelete) {
         await fetch(`${API_URL}/hard/${id}`, { method: 'DELETE' });
      } else {
         await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      }
      // Tarik data pelan-pelan di background buat mastiin sinkron 100%
      fetchData(); 
    } catch (error) { 
      alert("Gagal menghapus data! Koneksi bermasalah.");
      fetchData(); // Rollback (kembalikan data) kalau ternyata servernya error
    }
  };

  // --- FITUR BARU: HAPUS MASSAL (DENGAN OPTIMISTIC UPDATE) ---
  const handleBulkDelete = async (ids, isHardDelete = false) => {
    // 1. UPDATE UI LANGSUNG MASSAL
    setRawData(prevData => {
      if (isHardDelete) {
        return prevData.filter(item => !ids.includes(item._id));
      } else {
        return prevData.map(item => 
          ids.includes(item._id) ? { ...item, isDeleted: true, deletedAt: new Date().toISOString() } : item
        );
      }
    });

    // 2. KIRIM KE SERVER DI BACKGROUND
    try {
       await fetch(`${API_URL}/bulk`, {
           method: 'DELETE',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ ids, isHardDelete })
       });
       fetchData(); // Sinkronisasi background
    } catch (error) { 
       alert("Gagal menghapus data massal!");
       fetchData(); // Rollback
    }
  };

  const handlePrintCount = async (id) => {
    try {
      await fetch(`${API_URL}/${id}/print`, { method: 'PATCH' });
      await fetchData(); 
    } catch (error) { console.error("Gagal update print count", error); }
  };

  const handleLogin = (role, branchInfo = null) => {
    setUserRole(role);
    setActiveBranch(branchInfo);
  };

  if (!userRole) return <SmartLoginView onLogin={handleLogin} appSettings={appSettings} onPreFetchSettings={async () => { try { const res = await fetch(SETTINGS_URL); setAppSettings(await res.json()); } catch(e){} }} branches={Object.values(BRANCH_CONFIG)} />;
  
  if (userRole === 'master_menu') return <MasterMenuView onNavigate={(view) => setUserRole(view)} onLogout={() => setUserRole(null)} />;
    if (userRole === 'central_expense') return <CentralExpenseView onLogout={() => setUserRole(null)} formatRupiah={formatRupiah} />;
    if (userRole === 'shared_expense') return <SharedExpenseView onLogout={() => setUserRole(null)} formatRupiah={formatRupiah} />;
    if (userRole === 'kitchen') return <KitchenView branchInfo={activeBranch} onLogout={() => setUserRole(null)} />;
    
    // LOGIKA EMPLOYEE YANG BENAR (GABUNGAN KASIR BIASA & Aeon & Villa MG)
    if (userRole === 'employee') {
      if (activeBranch?.isInputMode) {
        return <PasarSenenInputView branchInfo={activeBranch} onLogout={() => setUserRole(null)} formatRupiah={formatRupiah} />;
      }
      return <EmployeePOSView branchInfo={activeBranch} rawData={rawData} onLogout={() => setUserRole(null)} refreshData={fetchData} isFetching={isFetching} formatRupiah={formatRupiah} onDelete={handleDelete} onPrintCount={handlePrintCount} />;
    }

    return <AdminDashboardView rawData={rawData} isFetching={isFetching} formatRupiah={formatRupiah} onLogout={() => setUserRole(null)} refreshData={fetchData} onDelete={handleDelete} onBulkDelete={handleBulkDelete} branches={Object.values(BRANCH_CONFIG)} appSettings={appSettings} />;
  }

// ==========================================
// 1. GERBANG LOGIN PINTAR (SUPER STEALTH + HACKED MODE)
// ==========================================
function SmartLoginView({ onLogin, appSettings, onPreFetchSettings, branches }) {
  const [secretStep, setSecretStep] = useState(0); 
  const [pin, setPin] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);
  
  // STATE BARU BUAT ANIMASI HACKED
  const [systemClickCount, setSystemClickCount] = useState(0);
  const [isHackedMode, setIsHackedMode] = useState(false);

  useEffect(() => { onPreFetchSettings(); }, []);

  const isScrambleActive = appSettings.find(s => s.settingKey === 'scramble_keypad')?.isActive || false;
  const [keypad, setKeypad] = useState([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

  useEffect(() => {
    if (isScrambleActive && secretStep < 2 && pin === '') {
       const shuffled = [...keypad].sort(() => Math.random() - 0.5);
       setKeypad(shuffled);
    } else if (!isScrambleActive) {
       setKeypad([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);
    }
  }, [pin, isScrambleActive, secretStep]);

  const handlePinInput = (num) => {
    if (successAnim || isHackedMode) return; // Kunci input pas lagi animasi smooth/hacked

    if (secretStep === 0) {
      if (pin.length < 4) {
        const newPin = pin + num;
        setPin(newPin);
      
if (newPin === '0192') {
          setSuccessAnim(true);
          setTimeout(() => {
            setSecretStep(1);
            setSuccessAnim(false);
          }, 500);

        } else if (newPin.length === 4) {
           if (newPin === '8888') {
               setSuccessAnim(true);
               // UBAH: Arahkan ke master_menu, bukan langsung ke shared_expense
               setTimeout(() => onLogin('master_menu', null), 500);
           } else if (KITCHEN_PINS[newPin]) {            
               // JIKA PIN ADALAH PIN DAPUR, LANGSUNG DIRECT KE CABANGNYA
               const branchId = KITCHEN_PINS[newPin];
               const branch = Object.values(BRANCH_CONFIG).find(b => b.id === branchId);
               if (branch) {
                   setSuccessAnim(true);
                   setTimeout(() => onLogin('kitchen', branch), 500);
               }
           } else {
               // PIN KASIR NORMAL
               const branch = BRANCH_CONFIG[newPin];
               if (branch) {
                 setSuccessAnim(true);
                 setTimeout(() => onLogin('employee', branch), 500);
               } else { 
                 setError(true); 
                 setTimeout(() => { setPin(''); setError(false); }, 500); 
               }
           }
        }
      }
    } else if (secretStep === 1) {
      if (pin.length < 14) {
        const newPin = pin + num;
        setPin(newPin);
        
        if (newPin.length === 14) {
           // GAK ADA KODE YANG BENER! PASTI ERROR!
           setError(true);
           setTimeout(() => { setPin('0192'); setError(false); }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    if (isHackedMode) return;
    if (pin.length > 0) {
      const newPin = pin.slice(0, -1);
      setPin(newPin);
      if (secretStep === 1 && newPin.length < 4) {
        setSecretStep(0);
        setSystemClickCount(0); // Reset click count kalau mundur
      }
    }
  };

  const handleSystemClick = () => {
    if (secretStep !== 1 || isHackedMode) return;
    
    const newCount = systemClickCount + 1;
    setSystemClickCount(newCount);
    
    if (newCount === 4) {
      setIsHackedMode(true);
      setError(false);
      
      // LOGIKA ANIMASI AUTO FILL 14 ANGKA
      let fakePin = '0192';
      const targetPin = '01921234098567'; // Angka 14 digitnya
      let step = 4;
      
      // Bikin suara/feel cepet ngetik sendiri
      const interval = setInterval(() => {
        fakePin = targetPin.substring(0, step + 1);
        setPin(fakePin);
        step++;
        
        if (step >= 14) {
          clearInterval(interval);
          setSuccessAnim(true); // Trigger ijo sebentar/merah mantap
          setTimeout(() => {
            setSecretStep(2);
            setSuccessAnim(false);
            setIsHackedMode(false); // Balikin normal pas masuk form Admin
            setPin('');
            setSystemClickCount(0);
          }, 1800); // Waktu buat nikmatin layar merah & gembok kebuka
        }
      }, 70); // Sangat cepat dan smooth
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (username === 'admin' && password === 'dedebos') {
      setSuccessAnim(true);
      setTimeout(() => onLogin('admin'), 600);
    } else {
      setError(true);
    }
  };

  const maxPinLength = secretStep === 0 ? 4 : 14;

  return (
    // Transisi background dari putih normal ke merah gelap pas di-hack
    <div className={`min-h-screen flex items-center justify-center p-4 font-sans relative overflow-hidden transition-colors duration-1000 ease-in-out ${isHackedMode ? 'bg-red-950' : 'bg-[#f8fafc]'}`}>
      
      {/* Background Pulse Ambience yg jadi beringas pas mode hacked */}
      <div className={`absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transition-all duration-1000 ease-out ${isHackedMode ? 'bg-red-600 scale-[2] animate-pulse' : 'bg-red-100 animate-pulse'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transition-all duration-1000 ease-out ${isHackedMode ? 'bg-orange-600 scale-[2] animate-pulse delay-75' : 'bg-green-100 animate-pulse'}`}></div>
      
      {/* Layar getar/merah ringan saat hacked */}
      {isHackedMode && <div className="absolute inset-0 bg-red-600/10 pointer-events-none animate-[pulse_0.5s_ease-in-out_infinite] z-0"></div>}

      {/* Main Container - Auto sizing & styling transition */}
      <div className={`max-w-md w-full backdrop-blur-xl rounded-[2.5rem] p-8 md:p-10 relative z-10 transition-all duration-700 ease-in-out transform 
        ${isHackedMode ? 'bg-black/80 border border-red-500/50 shadow-[0_0_80px_rgba(220,38,38,0.5)] scale-[1.02]' : 'bg-white/80 border border-white/20 shadow-2xl'} 
        ${successAnim && !isHackedMode ? 'scale-[1.02] shadow-green-500/20' : ''} 
        ${secretStep === 2 ? 'animate-in zoom-in-95 bg-white/80' : ''}
      `}>
        
        {error && <div className="mb-6 p-3 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in shake justify-center"><AlertCircle size={18} /> {secretStep === 1 ? 'AKSES DITOLAK!' : 'Kredensial / PIN Salah!'}</div>}

        {secretStep < 2 ? (
          // ==============================
          // TAMPILAN KARYAWAN & SECRET PIN
          // ==============================
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <h2 className={`text-xl font-extrabold mb-2 transition-colors duration-500 flex items-center justify-center gap-1 ${isHackedMode ? 'text-red-500' : 'text-gray-900'}`}>
              {secretStep === 0 ? (
                'PIN Kasir'
              ) : (
                <>
                  Otorisasi Master 
                  <span onClick={handleSystemClick} className={`relative cursor-pointer select-none transition-colors ${isHackedMode ? 'text-red-400' : 'text-gray-900'}`}>
                    System
                    {/* ANIMASI GEMBOK KEVUKA PAS DI KLIK 4X */}
                    {isHackedMode && (
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-red-500 animate-in zoom-in spin-in-12 duration-700 pointer-events-none">
                        <Unlock size={48} className="drop-shadow-[0_0_15px_rgba(220,38,38,1)] filter drop-shadow-xl" />
                      </span>
                    )}
                  </span>
                </>
              )}
            </h2>
            
            <p className={`text-sm mb-6 text-center transition-colors duration-500 h-10 ${isHackedMode ? 'text-red-400 font-black animate-pulse tracking-widest' : 'text-gray-500'}`}>
              {secretStep === 0 ? 'Masukkan 4 digit PIN akses Anda' : (isHackedMode ? 'SYSTEM BREACHED... OVERRIDING...' : 'Lanjutkan Passcode Keamanan Master')}
              <br/>
              {secretStep === 0 && <span className="text-[10px] opacity-100 transition-opacity">(*PIN 8888 untuk Transaksi Master)</span>}
            </p>
            
            {isScrambleActive && secretStep === 0 && <div className="mb-4 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 animate-in fade-in"><ShieldCheck size={12}/> Mode Keamanan Keypad Aktif</div>}
            
            {/* PIN DOTS ANIMATION */}
            <div className={`flex gap-3 mb-8 justify-center flex-wrap transition-all duration-500 ease-out ${secretStep === 1 ? 'max-w-[280px]' : ''}`}>
               {[...Array(maxPinLength)].map((_, i) => (
                 <div key={i} className={`rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
                   ${secretStep === 0 ? 'w-4 h-4' : 'w-2.5 h-2.5 mx-0.5'} 
                   ${pin.length > i 
                      ? (isHackedMode 
                          ? 'bg-red-500 scale-[1.5] shadow-[0_0_15px_rgba(239,68,68,0.8)]' // Merah menyala pas hacked
                          : (successAnim ? 'bg-green-500 scale-[1.3] shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-900 scale-110')
                        ) 
                      : (isHackedMode ? 'bg-red-950/50' : 'bg-gray-200')
                   }
                 `}></div>
               ))}
            </div>
            
            {/* KEYPAD GRID */}
            <div className={`grid grid-cols-3 gap-4 w-full px-4 transition-opacity duration-500 ${isHackedMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
              {keypad.slice(0,9).map((num, idx) => (
                <button key={idx} onClick={() => handlePinInput(num)} className="h-16 bg-gray-50 hover:bg-gray-100 rounded-2xl text-2xl font-bold text-gray-900 active:scale-90 transition-transform">{num}</button>
              ))}
              <div></div>
              <button onClick={() => handlePinInput(keypad[9])} className="h-16 bg-gray-50 hover:bg-gray-100 rounded-2xl text-2xl font-bold text-gray-900 active:scale-90 transition-transform">{keypad[9]}</button>
              <button onClick={handleDelete} className="h-16 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"><ArrowLeft size={24} /></button>
            </div>
          </div>
        ) : (
          // ==============================
          // TAMPILAN ADMIN FORM (STEALTH)
          // ==============================
          <form onSubmit={handleAdminLogin} className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-2 text-white shadow-xl transition-all duration-500 ${successAnim ? 'bg-green-500 scale-110' : 'bg-gray-900 shadow-gray-900/30'}`}>
               {successAnim ? <CheckCircle2 size={32} className="animate-in zoom-in" /> : <ShieldCheck size={32} className="animate-in zoom-in" />}
            </div>
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center tracking-tight">Portal Konfidensial</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Username Otoritas</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={20} />
                  <input type="text" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-gray-100 focus:border-gray-900 outline-none transition-all font-bold" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Kredensial Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={20} />
                  <input type="password" required className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-4 focus:ring-gray-100 focus:border-gray-900 outline-none transition-all font-bold tracking-widest" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
            </div>
            
            <button type="submit" className={`w-full py-4 mt-4 text-white rounded-2xl font-black text-lg transition-all shadow-xl active:scale-[0.98] ${successAnim ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-900 hover:bg-black'}`}>
              VERIFIKASI AKSES
            </button>
            <div className="text-center mt-4">
               <button type="button" onClick={() => {setSecretStep(0); setPin('');}} className="text-xs font-bold text-gray-400 hover:text-gray-900 transition-colors">Batal & Kembali ke Kasir</button>
            </div>
          </form>
          
        )}
{/* ============================== */}
        {/* STEP 3: PILIH CABANG DAPUR     */}
        {/* ============================== */}
        {secretStep === 3 && (
          <div className="animate-in fade-in zoom-in-95 duration-500">
             <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-6 mx-auto"><Utensils size={32} className="text-orange-600"/></div>
             <h2 className="text-2xl font-black text-gray-900 mb-2 text-center tracking-tight">Portal Dapur</h2>
             <p className="text-xs font-bold text-gray-500 mb-6 text-center uppercase tracking-widest">Pilih Lokasi Dapur Anda</p>
             
             <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6">
                {branches.map(b => (
                   <button key={b.id} onClick={() => onLogin('kitchen', b)} className="w-full p-4 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-2xl font-bold text-gray-900 text-left transition-colors flex items-center justify-between group">
                      <span>{b.name}</span>
                      <ArrowRight size={18} className="text-gray-400 group-hover:text-gray-900 transition-colors"/>
                   </button>
                ))}
             </div>
             
             <button onClick={() => {setSecretStep(0); setPin('');}} className="w-full py-4 bg-gray-100 text-gray-500 hover:text-gray-900 font-bold rounded-xl transition-colors">Batal & Kembali</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 1.2. MASTER MENU VIEW (PIN 8888 ROUTER)
// ==========================================
function MasterMenuView({ onNavigate, onLogout }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans p-6">
      <div className="max-w-md w-full bg-white rounded-[2rem] shadow-xl border border-gray-100 p-8 animate-in zoom-in-95 duration-500 relative">
        <button onClick={onLogout} className="absolute top-5 right-5 p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
          <X size={20} />
        </button>
        
        <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-lg">
          <Settings size={32} className="text-white" />
        </div>
        <h2 className="text-2xl font-black text-center text-gray-900 mb-2">Portal Master</h2>
        <p className="text-xs font-bold text-gray-400 text-center uppercase tracking-widest mb-8">Pilih Jalur Pengeluaran</p>

        <div className="space-y-4">
          <button onClick={() => onNavigate('central_expense')} className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-900 hover:shadow-lg transition-all group text-left flex items-center gap-4 active:scale-95">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-500 transition-colors">
              <Store size={24} className="text-blue-500 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg">Pengeluaran Pusat</h3>
              <p className="text-xs font-bold text-gray-500 mt-1">Biaya yang tidak membebani cabang (Cth: Cicilan)</p>
            </div>
          </button>

          <button onClick={() => onNavigate('shared_expense')} className="w-full p-6 bg-white border-2 border-gray-200 rounded-2xl hover:border-gray-900 hover:shadow-lg transition-all group text-left flex items-center gap-4 active:scale-95">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-500 transition-colors">
              <ShoppingBag size={24} className="text-green-500 group-hover:text-white transition-colors" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-lg">Belanja Gabungan</h3>
              <p className="text-xs font-bold text-gray-500 mt-1">Belanja yang dibagi rata ke beberapa cabang</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 1.3. PENGELUARAN PUSAT VIEW
// ==========================================
function CentralExpenseView({ onLogout, formatRupiah }) {
  const [formData, setFormData] = useState({
    tanggal: new Date().toISOString().split('T')[0], // Set default ke hari ini
    nama: '',
    nominal: '',
    metode: 'Cash',
    infoTambahan: '',
    catatan: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Format Tanggal jadi format Indo
    const d = new Date(formData.tanggal);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const tglFormat = `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;

    const infoStr = formData.infoTambahan.trim() ? ` | INFO: ${formData.infoTambahan.trim()}` : '';
    const noteStr = formData.catatan.trim() ? ` | NOTE: ${formData.catatan.trim()}` : '';
    const nominalAngka = Number(formData.nominal.replace(/\D/g, '')) || 0;

    const payload = {
      sheet: 'Pusat', // Identifikasi kalau ini pengeluaran pusat
      tanggal: tglFormat,
      cash: formData.metode === 'Cash' ? nominalAngka : 0,
      bca: formData.metode === 'BCA' ? nominalAngka : 0,
      gofood: formData.metode === 'QRIS' ? nominalAngka : 0, 
      jenisPengeluaran: `[PENGELUARAN PUSAT] [${formData.metode.toUpperCase()}] ${formData.nama}${infoStr}${noteStr}`,
      totalPengeluaran: nominalAngka
    };

    try {
      await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      alert('✅ Berhasil! Pengeluaran Pusat telah dicatat.');
      onLogout(); // Keluar setelah sukses biar aman
    } catch (error) {
      alert("Gagal menyimpan data!");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans p-6 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8 animate-in fade-in zoom-in-95 duration-500">
        <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-6">
          <div className="flex items-center gap-4">
            <button onClick={onLogout} className="p-2 bg-gray-50 text-gray-500 hover:text-gray-900 rounded-xl transition-colors"><ArrowLeft size={20}/></button>
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-tight">Input Pengeluaran Pusat</h2>
              <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">Tidak membebani cabang manapun</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6">
            <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">Tanggal Pengeluaran</label>
            <input type="date" required className="w-full bg-transparent font-black text-blue-900 text-lg outline-none cursor-pointer" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})} />
            <p className="text-[10px] font-bold text-blue-400 mt-2">*Pastikan tanggal ini sudah tepat.</p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nama Pengeluaran</label>
            <input type="text" required placeholder="Cth: Cicilan Mobil Operasional" className="w-full px-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none font-bold text-gray-900 focus:bg-white focus:border-gray-900 transition-all" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Nominal Harga</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">Rp</span>
              <input type="text" required placeholder="0" className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-2xl border border-gray-200 outline-none font-black text-2xl text-gray-900 focus:bg-white focus:border-gray-900 transition-all" value={formData.nominal} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setFormData({...formData, nominal: raw ? new Intl.NumberFormat('id-ID').format(raw) : ''}); }} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-3">
              {['Cash', 'BCA', 'QRIS'].map(m => (
                <button type="button" key={m} onClick={() => setFormData({...formData, metode: m})} className={`py-3 rounded-xl font-black text-sm transition-all border-2 ${formData.metode === m ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}>{m}</button>
              ))}
            </div>
          </div>

          <div className="pt-4">
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Info Tambahan (Opsional)</label>
            <input type="text" placeholder="Cth: Pakai Rekening BCA 04" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-sm text-gray-900 focus:bg-white focus:border-gray-900 transition-all" value={formData.infoTambahan} onChange={e => setFormData({...formData, infoTambahan: e.target.value})} />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Catatan Lain (Opsional)</label>
            <textarea placeholder="Tambahkan catatan khusus jika ada..." className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-sm text-gray-900 focus:bg-white focus:border-gray-900 transition-all resize-none h-20" value={formData.catatan} onChange={e => setFormData({...formData, catatan: e.target.value})}></textarea>
          </div>

          <button type="submit" disabled={isSubmitting || !formData.nominal} className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-lg mt-6 shadow-xl active:scale-95 transition-all disabled:opacity-50">
            {isSubmitting ? 'MENYIMPAN DATA...' : 'SIMPAN PENGELUARAN PUSAT'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 1.5. BELANJA GABUNGAN VIEW (PIN 8888)
// ==========================================
function SharedExpenseView({ onLogout, formatRupiah }) {
  const INIT_SHARED_ITEMS = [
    { id: 'b1', name: 'Beras', qty: '', price: '', isCustom: false },
    { id: 'b2', name: 'Minyak Goreng', qty: '', price: '', isCustom: false },
    { id: 'b3', name: 'Telur', qty: '', price: '', isCustom: false },
    { id: 'b4', name: 'Gas Elpiji', qty: '', price: '', isCustom: false },
    { id: Date.now(), name: '', qty: '', price: '', isCustom: true }
  ];

  const [items, setItems] = useState(INIT_SHARED_ITEMS);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- KODE BARU UNTUK CABANG DINAMIS ---
  // List semua cabang yang bisa ikut patungan
  const AVAILABLE_BRANCHES = ['MM Kantin SMB', 'MM Villa MG', 'MM Sinpasa', 'PLCI Kantin SMB'];
  
  // State untuk simpan cabang mana aja yang lagi diklik/dipilih (Default nyala 3)
  const [selectedBranches, setSelectedBranches] = useState(['MM Kantin SMB', 'MM Sinpasa', 'PLCI Kantin SMB']);

  // Fungsi untuk nyalain/matiin cabang
  const toggleBranch = (branch) => {
      if (selectedBranches.includes(branch)) {
          setSelectedBranches(selectedBranches.filter(b => b !== branch));
      } else {
          setSelectedBranches([...selectedBranches, branch]);
      }
  };
  // ----------------------------------------

  const totalBelanja = items.reduce((sum, item) => sum + ((parseInt(item.qty)||0) * (parseInt(item.price.replace(/\D/g, ''))||0)), 0);

  const handleSubmit = async () => {
    // Cegah submit kalau gak ada cabang yang dipilih
    if (totalBelanja === 0 || selectedBranches.length === 0) return; 
    setIsSubmitting(true);
    
    const validItems = items.filter(i => i.name.trim() !== '' && (parseInt(i.qty)||0) > 0 && (parseInt(i.price.replace(/\D/g, ''))||0) > 0);
    const detailBelanja = validItems.map(i => `${i.qty}x ${i.name} (@ Rp${formatRupiah(parseInt(i.price.replace(/\D/g, '')))})`).join(', ');
    
    // GANTI SHARED_BRANCHES JADI selectedBranches
    const perCabang = Math.floor(totalBelanja / selectedBranches.length); 
    const d = new Date();
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const tglFormat = `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;

    // GANTI SHARED_BRANCHES JADI selectedBranches
    const payloadBulk = selectedBranches.map(sheetName => ({
      sheet: sheetName,
      tanggal: tglFormat,
      cash: 0, bca: 0, gofood: 0,
      jenisPengeluaran: `[CASH] [BELANJA GABUNGAN] ${detailBelanja}`,
      totalPengeluaran: perCabang
    }));

    try {
      await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloadBulk) });
      alert(`✅ Berhasil! Data dibagi rata ke ${selectedBranches.length} cabang Gabungan.`);
      setItems(INIT_SHARED_ITEMS);
    } catch (error) { alert("Gagal menyimpan data!"); }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full bg-white rounded-3xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-black text-gray-900">Input Belanja Gabungan</h2>
          <button onClick={onLogout} className="p-2 text-red-500 bg-red-50 rounded-xl hover:bg-red-100"><LogOut size={20}/></button>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="flex gap-3 px-3 hidden md:flex text-xs font-bold text-gray-400 uppercase tracking-widest">
            <div className="flex-1">Beli Apa?</div><div className="w-24">Berapa Banyak?</div><div className="w-40">Harga Satuan</div><div className="w-10"></div>
          </div>
          {items.map((item, index) => (
            <div key={item.id} className="flex flex-col md:flex-row gap-3 items-center bg-gray-50 p-3 rounded-xl border border-gray-200">
              <div className="w-full md:flex-1">
                 {item.isCustom ? (
                    <input type="text" placeholder="Item Custom Lainnya..." className="w-full p-3 bg-white border border-gray-200 rounded-lg font-bold outline-none" value={item.name} onChange={(e) => { const newItems = [...items]; newItems[index].name = e.target.value; setItems(newItems); }} />
                 ) : (
                    <p className="p-3 font-bold text-gray-900">{item.name}</p>
                 )}
              </div>
              <div className="w-full md:w-24">
                 <input type="number" min="0" placeholder="Qty" className="w-full p-3 bg-white border border-gray-200 rounded-lg font-bold outline-none text-center" value={item.qty} onChange={(e) => { const newItems = [...items]; newItems[index].qty = e.target.value; setItems(newItems); }} />
              </div>
              <div className="w-full md:w-40 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                <input type="text" placeholder="Hrg Satuan" className="w-full pl-9 p-3 bg-white border border-gray-200 rounded-lg font-bold outline-none" value={item.price} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); const newItems = [...items]; newItems[index].price = raw ? new Intl.NumberFormat('id-ID').format(raw) : ''; setItems(newItems); }} />
              </div>
              <div className="w-full md:w-10 text-center">
                 {item.isCustom && <button onClick={() => setItems(items.filter(i => i.id !== item.id))} className="p-3 text-red-500 bg-red-50 rounded-lg w-full md:w-auto"><Trash2 size={18} className="mx-auto"/></button>}
              </div>
            </div>
          ))}
          <button onClick={() => setItems([...items, { id: Date.now(), name: '', qty: '', price: '', isCustom: true }])} className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 font-bold rounded-xl hover:bg-gray-100 flex items-center justify-center gap-2 transition-colors"><Plus size={18}/> Tambah Item Custom Tambahan</button>
        </div>

{/* --- UI PILIH CABANG PATUNGAN --- */}
        <div className="mb-6">
           <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-3">Pilih Cabang Yang Ikut Patungan:</p>
           <div className="flex flex-wrap gap-2">
               {AVAILABLE_BRANCHES.map(branch => {
                   const isActive = selectedBranches.includes(branch);
                   return (
                       <button
                           key={branch}
                           onClick={() => toggleBranch(branch)}
                           className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border-2 ${isActive ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}
                       >
                           {branch}
                       </button>
                   )
               })}
           </div>
        </div>

        <div className="bg-gray-900 text-white p-6 rounded-2xl mb-6">
           <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Total Keluar Uang Keseluruhan</p>
           <h3 className="text-4xl font-black mb-4">{formatRupiah(totalBelanja)}</h3>
           
           {/* LOGIKA TEKS PENJELASAN YANG DINAMIS */}
           {selectedBranches.length > 0 ? (
               <p className="text-sm font-medium text-gray-300">
                  Akan dibagi ke <span className="font-bold text-white">{selectedBranches.length} cabang</span>. 
                  Masing-masing tercatat pengeluaran sebesar <span className="text-green-400 font-bold bg-green-900/50 px-2 py-0.5 rounded">{formatRupiah(Math.floor(totalBelanja / selectedBranches.length))}</span>.
               </p>
           ) : (
               <p className="text-sm font-bold text-red-400">⚠️ Pilih minimal 1 cabang di atas agar bisa disimpan!</p>
           )}
        </div>
        
        {/* Tambah proteksi disabled kalau selectedBranches.length === 0 */}
        <button onClick={handleSubmit} disabled={isSubmitting || totalBelanja === 0 || selectedBranches.length === 0} className="w-full py-5 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50">SIMPAN & BAGI RATA SEKARANG</button>      
      </div>
    </div>
  );
}

// ==========================================
// 2. DASHBOARD KARYAWAN 
// ==========================================
function EmployeePOSView({ branchInfo, rawData, onLogout, refreshData, isFetching, formatRupiah, onDelete, onPrintCount }) {
  const [activeTab, setActiveTab] = useState('penjualan'); 
  const [isNavOpen, setIsNavOpen] = useState(true); // <-- STATE BARU BUAT TUTUP/BUKA NAVBAR
  const [liveView, setLiveView] = useState('pemasukan');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTotals, setShowTotals] = useState(false); 
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [tempPin, setTempPin] = useState('');
  
  // STATE BARU BUAT INPUT CASH
  const [amountPaidStr, setAmountPaidStr] = useState('');
// STATE BARU BUAT POP-UP BAYAR MODE CEPAT
  const [fastCheckoutModal, setFastCheckoutModal] = useState(null);

// --- STATE BLUETOOTH PRINTER ---
  const [btDevice, setBtDevice] = useState(null);
  const [btCharacteristic, setBtCharacteristic] = useState(null);

// --- FUNGSI MENCARI & KONEK KE PRINTER BLUETOOTH ---
  const connectBluetoothPrinter = async () => {
    try {
      // 1. Munculin pop-up browser buat milih device bluetooth
      const device = await navigator.bluetooth.requestDevice({
        // acceptAllDevices DIMATIKAN! Ganti pakai filters biar spesifik.
        filters: [
          // MASUKKIN NAMA PRINTER LU DI SINI (Harus persis besar/kecilnya):
          { name: 'RPP02N' }, 
          
          // Opsi tambahan: Kalau lu punya tipe printer lain buat cadangan, 
          // tinggal buka komen di bawah ini dan masukin namanya:
          // { name: 'PT-210' },
          // { namePrefix: 'RP58' } // namePrefix buat filter awalan nama doang
        ],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // UUID standar printer thermal Cina 1
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // UUID standar printer thermal Cina 2
          '49535343-fe7d-4ae5-8fa9-9fafd205e455'  // UUID ESC/POS umum lainnya
        ]
      });

      // 2. Konek ke GATT Server device tersebut
      const server = await device.gatt.connect();
      
      // 3. Looping untuk nyari 'jalur' buat nulis data (Write Characteristic)
      const services = await server.getPrimaryServices();
      let writeCharacteristic = null;

      for (let service of services) {
        const characteristics = await service.getCharacteristics();
        for (let char of characteristics) {
          // Cari characteristic yang punya hak akses 'write' atau 'writeWithoutResponse'
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeCharacteristic = char;
            break;
          }
        }
        if (writeCharacteristic) break;
      }

      if (writeCharacteristic) {
        setBtDevice(device);
        setBtCharacteristic(writeCharacteristic);
        alert(`✅ Printer [${device.name || 'Bluetooth'}] Berhasil Terkoneksi! Kasir siap nge-print.`);
        
        // Kalo bluetooth putus tiba-tiba, reset statenya
        device.addEventListener('gattserverdisconnected', () => {
           setBtDevice(null);
           setBtCharacteristic(null);
           alert("⚠️ Koneksi Printer Terputus!");
        });
      } else {
        alert("❌ Device berhasil dikonek, tapi tidak nemu jalur print (Write Characteristic). Pastikan ini printer thermal!");
      }
    } catch (err) {
      console.error(err);
      if (err.name !== 'NotFoundError') {
        alert("Gagal konek printer: " + err.message);
      }
    }
  };

// --- FUNGSI BANTUAN BUAT NGIRIM DATA (ANTI KESELEK & PALING STABIL) ---
  const sendTextToPrinter = async (text, characteristic) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    // SETTING SUPER AMAN: 48 bytes dengan jeda 20ms. 
    // Ini racikan paling bulletproof buat printer thermal Cina. Gak bakal putus lagi!
    const CHUNK_SIZE = 48; 

    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  const [widths, setWidths] = useState([33.3, 33.3, 33.4]);
  const [isDragging, setIsDragging] = useState(null);

  const [currentTime, setCurrentTime] = useState(Date.now());
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 60000); 
    return () => clearInterval(interval);
  }, []);

  const handlePinSubmit = () => {
    if (tempPin === '1807' || tempPin === 'dedebos') {
      setShowTotals(true); setIsPinModalOpen(false); setTempPin('');
      setTimeout(() => setShowTotals(false), 7000); 
    } else { alert("PIN Salah Bos!"); setTempPin(''); }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging === null) return;
      const percent = (e.clientX / window.innerWidth) * 100;
      setWidths(prev => {
        const newWidths = [...prev];
        if (isDragging === 0 && percent > 20 && percent < 60) {
          const diff = percent - newWidths[0]; newWidths[0] = percent; newWidths[1] = newWidths[1] - diff;
        } else if (isDragging === 1 && percent > 40 && percent < 80) {
          const combinedLeft = newWidths[0] + newWidths[1]; const diff = percent - combinedLeft; newWidths[1] = newWidths[1] + diff; newWidths[2] = newWidths[2] - diff;
        }
        return newWidths;
      });
    };
    const handleMouseUp = () => setIsDragging(null);
    if (isDragging !== null) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); }
    return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); };
  }, [isDragging]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => console.log(err)); setIsFullscreen(true); } 
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

const handleEmergencySystem = async () => {
      if (!window.confirm("🚨 Kirim Laporan Darurat sekarang?")) return;

      const payload = {
          sheet: branchInfo.name,
          message: "KASIR MENGALAMI KENDALA / ERROR!",
          timestamp: new Date().toLocaleTimeString('id-ID')
      };

      try {
          // Ganti URL ini dengan URL backend Vercel lu nanti
          const res = await fetch(`https://backend-mm-v2.vercel.app/api/emergency`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          
          if (res.ok) {
              alert("✅ Laporan Darurat Terkirim! Bos Dede akan segera mengecek.");
          }
      } catch (e) {
          alert("❌ Gagal mengirim laporan. Cek koneksi internet!");
      }
  };

  const [cart, setCart] = useState({});
  
  // STATE BARU BUAT MODAL CATATAN PER ITEM
  const [itemOptionModal, setItemOptionModal] = useState({ 
      isOpen: false, 
      cartKey: null, 
      item: null, 
      options: { type: 'Bawaan Global', cabbage: 'Bawaan Global', sambal: 'Bawaan Global', note: '' } 
  });

// Fungsi bikin ID Unik biar kalau catatannya beda, barisnya pisah!
  const getCartKey = (id, options) => {
      if (!options) return `${id}_default`;
      return `${id}_${options.type}_${options.cabbage}_${options.sambal}_${options.note}`.replace(/[^a-zA-Z0-9_]/g, '');
  };

  const [paymentMethod, setPaymentMethod] = useState('QRIS'); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  // const [localOrders, setLocalOrders] = useState([]);

// SIMPAN PESANAN BELUM BAYAR KE LOCAL STORAGE BIAR ANTI HILANG SAAT REFRESH
  const [localOrders, setLocalOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(`unpaid_orders_${branchInfo.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  // UPDATE LOCAL STORAGE SETIAP ADA PERUBAHAN PESANAN BELUM BAYAR
  useEffect(() => {
    if (branchInfo?.id) {
      localStorage.setItem(`unpaid_orders_${branchInfo.id}`, JSON.stringify(localOrders));
    }
  }, [localOrders, branchInfo]);

  const [activeCategory, setActiveCategory] = useState('Semua');
  const [customerModal, setCustomerModal] = useState({ isOpen: false, type: null }); 
  const [customerName, setCustomerName] = useState('');
  // --- STATE BARU BUAT JADWAL AMBIL (TAPPING) ---
  const [pickupType, setPickupType] = useState('Tidak Ada Keterangan'); 
  const [pickupCondition, setPickupCondition] = useState('Pagi'); 
  const [pickupTime, setPickupTime] = useState('');
  // ----------------------------------------------
  
  const [printModal, setPrintModal] = useState({ isOpen: false, data: null, printCount: 0 });  
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });

  const [expenseMethod, setExpenseMethod] = useState('Cash');

const [expenseNote, setExpenseNote] = useState('');

  // STATE BUAT FITUR VARIAN AYAM & EDIT HARGA KERANJANG SEMENTARA
  const [variantModal, setVariantModal] = useState({ isOpen: false, item: null });
const [editPriceModal, setEditPriceModal] = useState({ isOpen: false, cartItemId: null, itemName: '', tempPrice: '' });

// --- STATE OPSI TAMBAHAN (POP UP) ---
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [orderType, setOrderType] = useState('Makan Sini');
  const [cabbageOption, setCabbageOption] = useState('Pake Kol Biasa');
  const [sambalOption, setSambalOption] = useState('Pake Semua');
  const [orderNote, setOrderNote] = useState('');
  const [variantSelections, setVariantSelections] = useState({ ayam: null, nasi: null });
  // --------------------------------------------------

// --- FUNGSI RESTORE STOK OTOMATIS SAAT DELETE (DIPERTAJAM!) ---
  const restoreStockFromStr = async (sheetName, itemsStr) => {
      const parts = itemsStr.split(', ');
      const cartItems = [];
      parts.forEach(p => {
          if(!p.startsWith('**') && !p.startsWith('++')) {
              // REGEX BARU: Abaikan karakter setelah ' :: ' (karena itu catatan item)
              const match = p.match(/^(\d+)x\s(.*?)(?:\s*::\s*|$)/);
              if(match) {
                  let name = match[2].trim();
                  
                  // BERSIHKAN NAMA DARI VARIAN AGAR MATCH 100% DENGAN NAMA DI DATABASE
                  name = name.replace(/\s*paha\s*/i, '').trim();
                  name = name.replace(/\s*dada\s*/i, '').trim();
                  name = name.replace(/\s*\(\s*nasi\s+setengah\s*\)\s*/i, '').trim();
                  name = name.replace(/\s*\(\s*nasi\s+full\s*\)\s*/i, '').trim();

                  cartItems.push({ name, qty: parseInt(match[1]) });
              }
          }
      });
      
      if(cartItems.length > 0) {
          // 1. Kirim perintah balikin stok ke Database
          await fetch(`${MENU_MASTER_URL}/restore`, { 
              method: 'POST', 
              headers: {'Content-Type':'application/json'}, 
              body: JSON.stringify({ sheet: sheetName, cartItems }) 
          }).catch(e=>console.log(e));
          
          // 2. INI KUNCINYA! Langsung tarik ulang data menu & stok ke layar detik itu juga!
          await fetchMenuData(); 
      }
  };

// STATE MASTER MENU & LOGS AKTIVITAS
  const [masterMenus, setMasterMenus] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]); // <-- STATE BARU BUAT LOG
  const [editMasterModal, setEditMasterModal] = useState({ 
    isOpen: false, item: null, tempName: '', tempPrice: '', tempStock: '' 
  });

  // STATE BARU BUAT FITUR TAPPING / BELUM BAYAR
  const [isTappingModalOpen, setIsTappingModalOpen] = useState(false);
  const [tappingSortOrder, setTappingSortOrder] = useState('Terlama'); 

  // FETCH MENU MASTER & ACTIVITY LOGS BARENGAN
  const fetchMenuData = async () => {
      try {
          const [resMenu, resLog] = await Promise.all([
              fetch(`${MENU_MASTER_URL}?sheet=${encodeURIComponent(branchInfo.sheetName)}`),
              fetch(ACTIVITY_URL) // Tarik log untuk hitungan stok akurat
          ]);
          
          const menuData = await resMenu.json();
          const logData = await resLog.json();
          
          setMasterMenus(menuData);
          setActivityLogs(logData);
      } catch (e) { console.error("Gagal load data menu & log", e); }
  };

  useEffect(() => { fetchMenuData(); }, [branchInfo]);

  const MENU_MM = [
    // --- Satuan ---
    { id: 'rendang', name: 'Rendang', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'dendeng', name: 'Dendeng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'kikil', name: 'Kikil', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'ayambakar', name: 'Ayam Bakar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'] },
    { id: 'ayamgoreng', name: 'Ayam Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'] },
    { id: 'ayamgulai', name: 'Ayam Gulai', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'] },
    { id: 'ikanbawal-bakar', name: 'Ikan Bawal Bakar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'ikansalam-bakar', name: 'Ikan Salam Bakar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'ikansalam-goreng', name: 'Ikan Salam Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'ikantongkol-goreng', name: 'Ikan Tongkol Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'ikantongkol-gulaikuning', name: 'Ikan Tongkol Gulai Kuning', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'ikantongkol-asampedas', name: 'Ikan Tongkol Asam Pedas', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'lele-goreng', name: 'Lele Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'telur-dadar', name: 'Telur Dadar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'telur-balado', name: 'Telur Balado', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'ati-ampela', name: 'Ati Ampela', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'perkedel', name: 'Perkedel', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },

    // --- Paketan ---
    { id: 'pkt-rendang', name: 'Nasi Rames + Rendang', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-dendeng', name: 'Nasi Rames + Dendeng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-kikil', name: 'Nasi Rames + Kikil', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-ayambakar', name: 'Nasi Rames + Ayam Bakar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', hasVariants: ['Paha', 'Dada'] },
    { id: 'pkt-ayamgoreng', name: 'Nasi Rames + Ayam Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', hasVariants: ['Paha', 'Dada'] },
    { id: 'pkt-ayamgulai', name: 'Nasi Rames + Ayam Gulai', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', hasVariants: ['Paha', 'Dada'] },
    { id: 'pkt-ikanbawal-bakar', name: 'Nasi Rames + Ikan Bawal Bakar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-ikansalam-bakar', name: 'Nasi Rames + Ikan Salam Bakar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-ikansalam-goreng', name: 'Nasi Rames + Ikan Salam Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-ikantongkol-goreng', name: 'Nasi Rames + Ikan Tongkol Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-ikantongkol-gulaikuning', name: 'Nasi Rames + Ikan Tongkol Gulai Kuning', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-ikantongkol-asampedas', name: 'Nasi Rames + Ikan Tongkol Asam Pedas', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-lele-goreng', name: 'Nasi Rames + Lele Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-telur-dadar', name: 'Nasi Rames + Telur Dadar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-telur-balado', name: 'Nasi Rames + Telur Balado', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-ati-ampela', name: 'Nasi Rames + Ati Ampela', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
    { id: 'pkt-perkedel', name: 'Nasi Rames + Perkedel', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },

    // --- Minuman ---
    { id: 'esteh', name: 'Es Teh', price: 4000, category: 'Minuman', bg: 'bg-green-50 hover:bg-green-100 border-green-200' },
    { id: 'esjeruk', name: 'Es Jeruk', price: 6000, category: 'Minuman', bg: 'bg-green-50 hover:bg-green-100 border-green-200' }
  ];

const MENU_PLCI = [
    { id: 'lele', name: 'Lele Goreng', price: 15000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'ayam', name: 'Ayam Goreng', price: 17000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'] },
    { id: 'tahu', name: 'Tahu', price: 3000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'tempe', name: 'Tempe', price: 3000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'ati', name: 'Ati Ampela', price: 6000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'usus', name: 'Sate Usus', price: 3000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'nasi', name: 'Nasi Putih', price: 5000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'sambal', name: 'Extra Sambal', price: 2000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
    { id: 'paket-lele', name: 'Paket Nasi Lele', price: 18000, category: 'Paketan', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { id: 'paket-ayam', name: 'Paket Nasi Ayam', price: 23000, category: 'Paketan', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200', hasVariants: ['Paha', 'Dada'] },
  ];

  // 1. PINDAHKAN KE ATAS BIAR BISA DIBACA SAMA MESIN HITUNG
  const BASE_MENU_LIST = branchInfo.brand === 'minang' ? MENU_MM : MENU_PLCI;
  
  const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

  // =======================================================================
  // MESIN HITUNG STOK LIVE (100% COPY PASTE DARI LOGIKA ADMIN PROGRESS)
  // =======================================================================
  const liveStockCalculations = useMemo(() => {
      if (!masterMenus.length || !activityLogs.length) return {};

      // 1. Ambil Transaksi Valid Hari Ini (TERMASUK YANG BELUM BAYAR / UNPAID)
      const targetTransactions = rawData.filter(t => 
          t.tanggal === todayStr && 
          !t.isDeleted && 
          t.totalPengeluaran === 0 && 
          !(t.jenisPengeluaran || '').includes('[LAPORAN SISTEM]')
      );

      // 2. Ambil Log Ubah Stok Hari Ini di Cabang Ini
      const targetLogs = activityLogs.filter(l => 
          l.dateString === todayStr && 
          !l.isDeleted && 
          l.actionCategory === 'UBAH_STOK' &&
          l.sheet === branchInfo.sheetName
      );

      // 3. Parsing Data Penjualan (Sama Persis Kayak Admin)
      const soldItemsMap = {};
      targetTransactions.forEach(tx => {
          const rawItemsStr = tx.jenisPengeluaran ? tx.jenisPengeluaran.split('] ')[1] : '';
          const itemArray = (rawItemsStr || '').split(',').map(i => i.trim()).filter(i => i && !i.startsWith('**') && !i.startsWith('++'));

          itemArray.forEach(str => {
              const mainItem = str.split('::')[0].trim();
              const match = mainItem.match(/^(\d+)x\s(.*)/);
              if (match) {
                  const qty = parseInt(match[1], 10);
                  const name = match[2].trim().toLowerCase(); 
                  if (!soldItemsMap[name]) soldItemsMap[name] = 0;
                  soldItemsMap[name] += qty;
              }
          });
      });

      // 4. Bikin Pemetaan Menu Aktif biar sinkron antara Satuan dan Paketan
      const activeMenus = BASE_MENU_LIST.map(baseItem => {              
          let stockRefId = baseItem.id;
          if (stockRefId.startsWith('pkt-')) stockRefId = stockRefId.replace('pkt-', '');
          else if (stockRefId.startsWith('paket-')) stockRefId = stockRefId.replace('paket-', '');

          const dbItemSelf = masterMenus.find(m => m.menuId === baseItem.id);
          return {
              id: baseItem.id,
              name: dbItemSelf ? dbItemSelf.name : baseItem.name,
              stockRefId: stockRefId
          };
      });

      // Urutkan dari nama terpanjang biar "Paket Nasi Ayam" match duluan sebelum "Ayam"
      const sortedMenus = [...activeMenus].sort((a, b) => b.name.length - a.name.length);

      const stockResult = {};
      const terjualMap = {};
      const inputMap = {};

      // 5. Hitung Total Terjual Per StockRefId (Ini yg benerin bug angka melambung)
      Object.entries(soldItemsMap).forEach(([soldName, qty]) => {
          if (qty <= 0) return;
          const menuMatch = sortedMenus.find(m => soldName.includes(m.name.toLowerCase()));
          if (menuMatch) {
              const refId = menuMatch.stockRefId;
              if (!terjualMap[refId]) terjualMap[refId] = 0;
              terjualMap[refId] += qty;
          }
      });

      // 6. Hitung Total Input Log Per StockRefId (Hanya dari Base Menu)
      const uniqueBaseMenus = [];
      activeMenus.forEach(m => {
          if (m.id === m.stockRefId && !uniqueBaseMenus.find(u => u.id === m.id)) {
              uniqueBaseMenus.push(m);
          }
      });

      uniqueBaseMenus.forEach(baseMenu => {
          const refId = baseMenu.stockRefId;
          if (!inputMap[refId]) inputMap[refId] = 0;

          targetLogs.forEach(log => {
              if (log.menuName.toLowerCase() === baseMenu.name.toLowerCase()) {
                  const match = log.detailAction.match(/dari \[([^\]]+)\] menjadi \[(\d+)\]/);
                  if (match) {
                      const oldVal = match[1].includes('HABIS') ? 0 : parseInt(match[1], 10);
                      const newVal = parseInt(match[2], 10);
                      const diff = newVal - oldVal;
                      if (diff !== 0) inputMap[refId] += diff;
                  }
              }
          });
      });

      // 7. Hitung Sisa Akhir Live (Input Modal - Terjual Laku)
      uniqueBaseMenus.forEach(baseMenu => {
          const refId = baseMenu.stockRefId;
          const input = inputMap[refId] || 0;
          const terjual = terjualMap[refId] || 0;
          stockResult[refId] = input - terjual;
      });

      return stockResult;
  }, [rawData, activityLogs, masterMenus, todayStr, branchInfo.sheetName, branchInfo.brand]);
  // =======================================================================
    
  // MERGE HARGA DATABASE & STOK LIVE HASIL PERHITUNGAN LOG
  const ACTIVE_MENU_LIST = BASE_MENU_LIST.map(baseItem => {
      let stockRefId = baseItem.id;
      if (stockRefId.startsWith('pkt-')) stockRefId = stockRefId.replace('pkt-', '');
      else if (stockRefId.startsWith('paket-')) stockRefId = stockRefId.replace('paket-', '');

      const dbItemSelf = masterMenus.find(m => m.menuId === baseItem.id);
      
      // Ambil stok dari hasil hitungan Live (Input Log - Penjualan)
      const calculatedStock = liveStockCalculations[stockRefId] !== undefined ? liveStockCalculations[stockRefId] : 0;

      return {
          ...baseItem,
          name: dbItemSelf ? dbItemSelf.name : baseItem.name,
          price: dbItemSelf ? dbItemSelf.price : baseItem.price,
          stock: calculatedStock, // <-- MENGGUNAKAN STOK LIVE SUPER AKURAT
          stockRefId: stockRefId 
      };
  });
  
  const filteredMenu = activeCategory === 'Semua' ? ACTIVE_MENU_LIST : ACTIVE_MENU_LIST.filter(m => m.category === activeCategory);
  
  // HAPUS ATAU COMMENT BARIS DI BAWAH INI KARENA UDAH DIDEKLARASIIN DI ATAS
  // const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
  
  const todayData = rawData.filter(item => item.tanggal === todayStr);  
  
  const employeeVisibleData = todayData.filter(item => {
    if (item.isDeleted) return false;
    // SEMBUNYIKAN DATA DAPUR DARI HISTORY KASIR BIAR GAK DOBEL
    if (item.jenisPengeluaran && item.jenisPengeluaran.includes('[UNPAID]')) return false; 
    if (!item.createdAt) return true; 
    return (currentTime - new Date(item.createdAt).getTime()) <= THREE_HOURS_MS;
  });

  const employeeLocalOrders = localOrders.filter(order => (currentTime - order.id) <= THREE_HOURS_MS);

  const totalExpenseToday = employeeVisibleData.reduce((acc, curr) => acc + (curr.totalPengeluaran || 0), 0);
  
// --- LOGIKA FIX NOMOR ANTRIAN (ANTI-MELESET) ---
  let maxQueue = 0;
  
  // 1. Cek dari Transaksi Real di Database (Abaikan Laporan Sistem)
  todayData.forEach(item => {
      // Abaikan kalau ini log sistem
      if (item.jenisPengeluaran && item.jenisPengeluaran.includes('[LAPORAN SISTEM]')) return; 
      
      // Ambil angka di dalam antrian, Contoh: [A-005] atau [A-005 - Dede]
      const match = (item.jenisPengeluaran || '').match(/A-(\d+)/);
      if (match && match[1]) {
          const qNum = parseInt(match[1], 10);
          if (qNum > maxQueue) maxQueue = qNum;
      }
  });

  // 2. Cek dari Transaksi Belum Bayar (Local Orders) KHUSUS HARI INI SAJA
  localOrders.forEach(order => {
      const orderDateStr = new Date(order.id).toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      
      if (orderDateStr === todayStr && order.queue) {
          const match = order.queue.match(/A-(\d+)/);
          if (match && match[1]) {
              const qNum = parseInt(match[1], 10);
              if (qNum > maxQueue) maxQueue = qNum;
          }
      }
  });

  // KUNCI UTAMA: Jika tidak ada data (maxQueue = 0), maka otomatis mulai dari 1 (A-001)
  // Jika ada data terakhir (misal A-005), maxQueue akan berisi 5, lalu ditambah 1 = 6 (A-006)
  const currentQueueNumber = maxQueue + 1;
  // ------------------------------------------------------------------------
  
  // HITUNG INCOME HANYA DARI TRANSAKSI (Bukan Laporan Sistem)
  const validIncomeData = employeeVisibleData.filter(x => !(x.jenisPengeluaran && x.jenisPengeluaran.includes('[LAPORAN SISTEM]')));
  const serverIncome = validIncomeData.reduce((acc, curr) => acc + (curr.cash || 0) + (curr.bca || 0) + (curr.gofood || 0), 0);
  const localIncome = employeeLocalOrders.reduce((acc, curr) => acc + curr.total, 0);
  const totalIncomeToday = serverIncome + localIncome;
  
  const addToCart = (item, customOptions = null) => setCart(prev => {
      const cartKey = getCartKey(item.id, customOptions);
      return { 
          ...prev, 
          [cartKey]: { 
              ...item, 
              cartKey, 
              qty: (prev[cartKey]?.qty || 0) + 1,
              itemOptions: customOptions || prev[cartKey]?.itemOptions || null
          } 
      };
  });

  const decreaseQty = (cartKey) => setCart(prev => { 
      const newCart = { ...prev }; 
      if (newCart[cartKey].qty > 1) newCart[cartKey].qty -= 1; 
      else delete newCart[cartKey]; 
      return newCart; 
  });  
// BUKA MODAL CATATAN PER ITEM
  const openItemOptionModal = (cartItem) => {
      setItemOptionModal({
          isOpen: true,
          cartKey: cartItem.cartKey,
          item: cartItem,
          options: cartItem.itemOptions || { type: 'Bawaan Global', cabbage: 'Bawaan Global', sambal: 'Bawaan Global', note: '' }
      });
  };

// SIMPAN CATATAN PER ITEM
  const saveItemOptions = () => {
      const { cartKey, item, options } = itemOptionModal;
      // Cek kalau semuanya default, balikin ke null
      const isDefault = options.type === 'Bawaan Global' && options.cabbage === 'Bawaan Global' && options.sambal === 'Bawaan Global' && options.note.trim() === '';
      const finalOptions = isDefault ? null : { ...options, note: options.note.replace(/,/g, ' / ') }; // Koma diganti biar backend aman

      setCart(prev => {
          const newCart = { ...prev };
          const qty = newCart[cartKey].qty;
          delete newCart[cartKey]; // Hapus baris lama

          const newCartKey = getCartKey(item.id, finalOptions);

          // Kalau diganti catatan ke yg udah ada, gabungin qty-nya!
          if (newCart[newCartKey]) {
              newCart[newCartKey].qty += qty;
          } else {
              newCart[newCartKey] = { ...item, cartKey: newCartKey, qty, itemOptions: finalOptions };
          }
          return newCart;
      });

      setItemOptionModal({ isOpen: false, cartKey: null, item: null, options: { type: 'Bawaan Global', cabbage: 'Bawaan Global', sambal: 'Bawaan Global', note: '' } });
  };
  const totalCartPrice = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);
  const formatQueue = (num) => `A-${String(num).padStart(3, '0')}`;

  // RESET INPUT UANG KALAU PINDAH METODE ATAU KERANJANG KOSONG
  useEffect(() => {
     if (paymentMethod !== 'Cash' || totalCartPrice === 0) setAmountPaidStr('');
  }, [paymentMethod, totalCartPrice]);

  // LOGIKA HITUNGAN KEMBALIAN
  const amountPaidNum = parseInt(amountPaidStr.replace(/\D/g, '')) || 0;
  const isCashInsufficient = paymentMethod === 'Cash' && amountPaidNum > 0 && amountPaidNum < totalCartPrice;

// STATE BARU UNTUK POP UP STOK HABIS
  const [stockAlert, setStockAlert] = useState(null);

// 1. FUNGSI KLIK MENU KASIR BIASA
  const handleItemClick = (item) => {
      // CEK STOK DULU BOS! (BYPASS NASI, USUS, SAMBAL KARENA GAK PAKE STOK)
      if (!['nasi', 'usus', 'sambal'].includes(item.id) && item.stock <= 0) {
          setStockAlert(`⚠️ Stok ${item.name} Habis! Silakan re-stok / isi stok lagi.`);
          setTimeout(() => setStockAlert(null), 3000);
          return;
      }

      // KALAU STOK AMAN ATAU INI NASI, LANJUT CEK VARIAN
      const needsAyam = !!item.hasVariants;
      const needsNasi = item.name.toLowerCase().includes('nasi');

      if (needsAyam || needsNasi) {
          setVariantSelections({
              ayam: needsAyam ? null : 'N/A',
              nasi: needsNasi ? null : 'N/A'
          });
          setVariantModal({ isOpen: true, item });
      } else {
          addToCart(item);
      }
  };

// FUNGSI KHUSUS MODE CEPAT (BYPASS VARIAN KECUALI NASI)
  const handleFastModeClick = (item) => {
      // 1. CEK STOK (BYPASS NASI, USUS, SAMBAL)
      if (!['nasi', 'usus', 'sambal'].includes(item.id) && item.stock <= 0) {
          setStockAlert(`⚠️ Stok ${item.name} Habis! Silakan re-stok.`);
          setTimeout(() => setStockAlert(null), 3000);
          return;
      }
      
      // 2. KHUSUS NASI: Tetap buka modal varian karena harga 5rb / 3rb
      if (item.id === 'nasi') {
          setVariantSelections({ ayam: 'N/A', nasi: null });
          setVariantModal({ isOpen: true, item });
          return;
      }

      // 3. PAKETAN & LAINNYA: LANGSUNG MASUK KERANJANG! (Tanpa pilih paha/dada)
      // Karena Paketan harganya sama aja.
      addToCart(item);
  };

// 2. FUNGSI KONFIRMASI VARIAN (KHUSUS KASIR BIASA)
  const confirmVariantSelection = () => {
      const baseItem = variantModal.item;
      let finalName = baseItem.name;
      let finalId = baseItem.id;
      let finalPrice = baseItem.price;

      if (variantSelections.ayam && variantSelections.ayam !== 'N/A') {
          finalName += ` ${variantSelections.ayam}`;
          finalId += `-${variantSelections.ayam.toLowerCase()}`;
      }
      
      if (variantSelections.nasi && variantSelections.nasi !== 'N/A') {
          finalName += ` (${variantSelections.nasi})`;
          finalId += `-${variantSelections.nasi.replace(/\s+/g, '').toLowerCase()}`;
          
          // Logika Khusus Harga Nasi di Kasir Biasa
          if (baseItem.category === 'Satuan' && baseItem.name.toLowerCase().includes('nasi')) {
              if (variantSelections.nasi === 'Nasi Setengah') {
                  finalPrice = 3000;
              } else if (variantSelections.nasi === 'Nasi Full') {
                  finalPrice = 5000;
              }
          }
      }

      const newItem = { ...baseItem, id: finalId, name: finalName, price: finalPrice };
      addToCart(newItem);
      setVariantModal({ isOpen: false, item: null });
  };

// 3. FUNGSI VARIAN INSTAN (KHUSUS MODE CEPAT)
  const handleInstantVariant = (type, value) => {
      const baseItem = variantModal.item;
      let finalName = baseItem.name;
      let finalId = baseItem.id;
      let finalPrice = baseItem.price;

      if (type === 'ayam') {
          finalName += ` ${value}`;
          finalId += `-${value.toLowerCase()}`;
      } else if (type === 'nasi') {
          finalName += ` (${value})`;
          finalId += `-${value.replace(/\s+/g, '').toLowerCase()}`;
          
          // Logika Harga Nasi Otomatis Mode Cepat
          if (baseItem.category === 'Satuan' && baseItem.name.toLowerCase().includes('nasi')) {
              if (value === 'Nasi Setengah') finalPrice = 3000;
              else if (value === 'Nasi Full') finalPrice = 5000;
          }
      }

      const newItem = { ...baseItem, id: finalId, name: finalName, price: finalPrice };
      addToCart(newItem);
      
      setVariantModal({ isOpen: false, item: null });
      setVariantSelections({ ayam: null, nasi: null });
  };

  // FUNGSI EDIT HARGA
const openEditPriceModal = (item) => {
      // Pake item.cartKey biar ga nyasar kalau ada menu yg sama tapi catatannya beda
      setEditPriceModal({ isOpen: true, cartItemId: item.cartKey, itemName: item.name, tempPrice: new Intl.NumberFormat('id-ID').format(item.price) });
  };

  const saveEditedPrice = () => {
      const newPrice = parseInt(editPriceModal.tempPrice.replace(/\D/g, '')) || 0;
      setCart(prev => {
          const newCart = { ...prev };
          if(newCart[editPriceModal.cartItemId]) {
              newCart[editPriceModal.cartItemId].price = newPrice;
          }
          return newCart;
      });
      setEditPriceModal({ isOpen: false, cartItemId: null, itemName: '', tempPrice: '' });
  };

  // // FUNGSI EDIT HARGA TETAP (BASE PRICE)
  // const openEditBasePriceModal = (e, item) => {
  //     e.stopPropagation(); // Biar pas klik pensil, menu nggak masuk keranjang
  //     setEditBasePriceModal({ isOpen: true, itemId: item.id, itemName: item.name, tempPrice: new Intl.NumberFormat('id-ID').format(item.price) });
  // };

  // const saveBasePrice = () => {
  //     const newPrice = parseInt(editBasePriceModal.tempPrice.replace(/\D/g, '')) || 0;
      
  //     // Cari harga lama buat perbandingan
  //     const oldPrice = customPrices[editBasePriceModal.itemId] !== undefined 
  //         ? customPrices[editBasePriceModal.itemId] 
  //         : (BASE_MENU_LIST.find(i => i.id === editBasePriceModal.itemId)?.price || 0);

  //     // Simpan ke HP kasir
  //     setCustomPrices(prev => ({ ...prev, [editBasePriceModal.itemId]: newPrice }));
  //     setEditBasePriceModal({ isOpen: false, itemId: null, itemName: '', tempPrice: '' });

  //     // DIAM-DIAM KIRIM LOG KE ADMIN (Asinkron & Super Ringan)
  //     if (oldPrice !== newPrice) {
  //         fetch(ACTIVITY_URL, {
  //             method: 'POST',
  //             headers: { 'Content-Type': 'application/json' },
  //             body: JSON.stringify({
  //                 sheet: branchInfo.sheetName,
  //                 actionType: 'UBAH_HARGA',
  //                 menuName: editBasePriceModal.itemName,
  //                 oldPrice: oldPrice,
  //                 newPrice: newPrice
  //             })
  //         }).catch(e => console.log('Gagal log ubah harga', e)); // Kalau gagal / offline biarin aja, kasir ga usah tau
  //     }
  // };

// BUKA MODAL EDIT MASTER
  const openEditMasterModal = (e, item) => {
      e.stopPropagation();
      setEditMasterModal({ 
          isOpen: true, 
          item: item, 
          tempName: item.name, 
          tempPrice: new Intl.NumberFormat('id-ID').format(item.price),
          tempStock: item.stock || ''
      });
  };

// SIMPAN EDIT MASTER (VERSI RINGAN & INSTAN)
  const saveMasterMenu = async () => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const newPrice = parseInt(editMasterModal.tempPrice.replace(/\D/g, '')) || 0;
      const newStock = parseInt(editMasterModal.tempStock) || 0;
      
      const payload = {
          sheet: branchInfo.sheetName,
          menuId: editMasterModal.item.id,
          name: editMasterModal.tempName,
          price: newPrice,
          stock: newStock
      };

      try {
          // Tembak API
          const response = await fetch(MENU_MASTER_URL, { 
              method: 'PUT', 
              headers: { 'Content-Type': 'application/json' }, 
              body: JSON.stringify(payload) 
          });

          if (response.ok) {
              // TUTUP MODAL DULUAN BIAR USER SENENG (INSTAN)
              setEditMasterModal({ isOpen: false, item: null, tempName: '', tempPrice: '', tempStock: '' });
              
              // Refresh data di background
              fetchMenuData(); 
              // Jika sedang di dashboard admin, refresh logs juga
              if (refreshData) refreshData(); 
          }
      } catch (error) {
          alert("Gagal update! Cek koneksi internet Bos.");
      } finally {
          setIsSubmitting(false);
      }
  };

  const triggerSubmitSale = (statusPembayaran) => {
      if (totalCartPrice === 0) return;
      setCustomerModal({ isOpen: true, type: statusPembayaran });
  };

  const markAsPaid = async (orderId, selectedMethod) => {
    const orderIndex = localOrders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) return;
    const order = localOrders[orderIndex];
    setLocalOrders(localOrders.filter(o => o.id !== orderId));
    
    // Hapus data [UNPAID] di Dapur pake dbId rahasia
    if (order.dbId) {
        await fetch(`${API_URL}/hard/${order.dbId}`, { method: 'DELETE' }).catch(e=>console.log(e));
    }

    const payload = { 
      sheet: branchInfo.sheetName, tanggal: todayStr, 
      cash: selectedMethod === 'Cash' ? order.total : 0, bca: selectedMethod === 'BCA' ? order.total : 0, gofood: selectedMethod === 'QRIS' ? order.total : 0, 
      jenisPengeluaran: `[${order.queue}] ${order.items}`, totalPengeluaran: 0 
    };
    await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    refreshData();
  };


// =================================================================
// FITUR BARU: LOGIKA KASIR MODE CEPAT (BYPASS SEMUA POPUP)
// =================================================================
  const executeFastSale = async (fastPayMethod, isPark = false) => {
      if (Object.keys(cart).length === 0) return;
      setIsSubmitting(true);

      let parts = [
          `** MAKAN SINI **`, 
          `** PAKE KOL BIASA **`, 
          `** PAKE SEMUA **`, 
          ...Object.values(cart).map(i => {
              const formatItemOptions = (opts) => {
                  if (!opts) return '';
                  let p = [];
                  if (opts.type && opts.type !== 'Bawaan Global') p.push(opts.type);
                  if (opts.cabbage && opts.cabbage !== 'Bawaan Global') p.push(opts.cabbage);
                  if (opts.sambal && opts.sambal !== 'Bawaan Global') p.push(opts.sambal);
                  if (opts.note) p.push(`Note: ${opts.note}`);
                  return p.length > 0 ? ` :: ${p.join(' | ')}` : '';
              };
              return `${i.qty}x ${i.name}${formatItemOptions(i.itemOptions)}`;
          })
      ];

      parts.push(`++ PAY:${fastPayMethod}|${totalCartPrice}|0`);
      const itemsStr = parts.join(', ');
      // Ambil nomor antrean paling fresh
      const qStr = formatQueue(currentQueueNumber);
      const finalQueueStr = isPark ? `${qStr} (Ambil: Bebas/Nanti)` : qStr;

      const cartItemsForDeduction = Object.values(cart)
          .filter(i => !['nasi', 'usus', 'sambal'].includes(i.id)) // <-- JANGAN POTONG STOK NASI, USUS, SAMBAL
          .map(i => ({            
          id: i.stockRefId || i.id, name: i.name, qty: i.qty, 
          variant: i.name.toLowerCase().includes('paha') ? 'Paha' : (i.name.toLowerCase().includes('dada') ? 'Dada' : '')
      }));

      const transactionDataForPrint = {
          queue: finalQueueStr, items: itemsStr, total: totalCartPrice,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), printCount: 0,
          status: isPark ? 'BELUM_BAYAR' : 'LUNAS'
      };

      let payloads = [];
      if (isPark) {
          payloads.push({ sheet: branchInfo.sheetName, tanggal: todayStr, cash: 0, bca: 0, gofood: 0, jenisPengeluaran: `[UNPAID] [${finalQueueStr}] ${itemsStr}`, totalPengeluaran: 0 });
      } else {
          payloads.push({ sheet: branchInfo.sheetName, tanggal: todayStr, cash: fastPayMethod === 'Cash' ? totalCartPrice : 0, bca: fastPayMethod === 'BCA' ? totalCartPrice : 0, gofood: fastPayMethod === 'QRIS' ? totalCartPrice : 0, jenisPengeluaran: `[${finalQueueStr}] ${itemsStr}`, totalPengeluaran: 0 });
      }

      // Potong Stok Background
      fetch(`${MENU_MASTER_URL}/deduct`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheet: branchInfo.sheetName, cartItems: cartItemsForDeduction }) })
      .then(res => res.json()).then(stockData => {
          if (stockData.systemMessages && stockData.systemMessages.length > 0) {
              const systemPayloads = stockData.systemMessages.map(msg => ({ sheet: branchInfo.sheetName, tanggal: todayStr, cash: 0, bca: 0, gofood: 0, jenisPengeluaran: msg, totalPengeluaran: 0 }));
              fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(systemPayloads) });
          }
      }).catch(e => console.error('Gagal potong stok di background', e));

      fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloads) })
      .then(res => res.json()).then(resJson => {
          if (isPark) {
              const newOrder = { 
                  ...transactionDataForPrint, id: Date.now(), dbId: resJson.data[0]?._id, status: 'BELUM_BAYAR',
                  rawCart: cart, rawCustomerName: '', rawPickupType: 'Tidak Ada Keterangan', rawPickupCondition: 'Pagi', rawPickupTime: '',
                  rawOrderType: 'Makan Sini', rawCabbage: 'Pake Kol Biasa', rawSambal: 'Pake Semua', rawNote: ''
              };
              setLocalOrders(prev => [...prev, newOrder]);
          }
          // SINKRONISASI OTOMATIS: Tarik data terbaru biar Antrean langsung nambah!
          refreshData(); 
          fetchMenuData();
      });

      // ZERO POPUP: Langsung bersihin keranjang, siap terima order selanjutnya!
      setCart({}); 
      setIsSubmitting(false);
  };

// BIKIN PAYLOAD MAKIN RAPIH DENGAN TANDA ++
  const executeSubmitSale = async (isSkipped) => {
      setIsSubmitting(true);
      const finalName = (isSkipped || customerName.trim() === '') ? '' : ` - ${customerName}`;
      
      // LOGIKA WAKTU AMBIL: Sekarang tetep di-save walau di-skip namanya
      let pickupInfo = '';
      if (customerModal.type === 'BELUM_BAYAR') {
          if (pickupType === 'Tidak Ada Keterangan') pickupInfo = ` (Ambil: Bebas/Nanti)`;
          else if (pickupType === 'Kondisi') pickupInfo = ` (Ambil: ${pickupCondition})`;
          else if (pickupType === 'Waktu Tertentu' && pickupTime) pickupInfo = ` (Ambil Jam: ${pickupTime})`;
      }

      // Format Items Super Clean
      // Format Items Super Clean + Catatan Per Item
      const formatItemOptions = (opts) => {
          if (!opts) return '';
          let p = [];
          if (opts.type && opts.type !== 'Bawaan Global') p.push(opts.type);
          if (opts.cabbage && opts.cabbage !== 'Bawaan Global') p.push(opts.cabbage);
          if (opts.sambal && opts.sambal !== 'Bawaan Global') p.push(opts.sambal);
          if (opts.note) p.push(`Note: ${opts.note}`);
          // Gunakan ' :: ' sebagai pemisah cantik yang aman dari koma
          return p.length > 0 ? ` :: ${p.join(' | ')}` : '';
      };

      let parts = [
          `** ${orderType.toUpperCase()} **`,
          `** ${cabbageOption.toUpperCase()} **`,
          `** ${sambalOption.toUpperCase()} **`,
          ...Object.values(cart).map(i => `${i.qty}x ${i.name}${formatItemOptions(i.itemOptions)}`)
      ];

      if (orderNote.trim()) parts.push(`++ CATATAN: ${orderNote.trim()}`);
      parts.push(`++ PAY:${paymentMethod}|${paymentMethod === 'Cash' ? amountPaidNum : totalCartPrice}|${paymentMethod === 'Cash' ? Math.max(0, amountPaidNum - totalCartPrice) : 0}`);
      
      const itemsStr = parts.join(', ');
      const qStr = formatQueue(currentQueueNumber);
      const finalQueueStr = `${qStr}${finalName}${pickupInfo}`;

// REPLACE BAGIAN INI JUGA:
      const cartItemsForDeduction = Object.values(cart)
          .filter(i => !['nasi', 'usus', 'sambal'].includes(i.id)) // <-- JANGAN POTONG STOK NASI, USUS, SAMBAL
          .map(i => ({            
          id: i.stockRefId || i.id, name: i.name, qty: i.qty, 
          variant: i.name.toLowerCase().includes('paha') ? 'Paha' : (i.name.toLowerCase().includes('dada') ? 'Dada' : '')
      }));

      const transactionDataForPrint = {
          queue: finalQueueStr, items: itemsStr, total: totalCartPrice,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), printCount: 0
      };

      let payloads = [];
      if (customerModal.type === 'BELUM_BAYAR') {
          payloads.push({ sheet: branchInfo.sheetName, tanggal: todayStr, cash: 0, bca: 0, gofood: 0, jenisPengeluaran: `[UNPAID] [${finalQueueStr}] ${itemsStr}`, totalPengeluaran: 0 });
      } else {
          payloads.push({ sheet: branchInfo.sheetName, tanggal: todayStr, cash: paymentMethod === 'Cash' ? totalCartPrice : 0, bca: paymentMethod === 'BCA' ? totalCartPrice : 0, gofood: paymentMethod === 'QRIS' ? totalCartPrice : 0, jenisPengeluaran: `[${qStr}${finalName}] ${itemsStr}`, totalPengeluaran: 0 });
      }

      // Proses Background Simpan ke MongoDB & Potong Stok
      fetch(`${MENU_MASTER_URL}/deduct`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sheet: branchInfo.sheetName, cartItems: cartItemsForDeduction }) })
      .then(res => res.json()).then(stockData => {
          if (stockData.systemMessages && stockData.systemMessages.length > 0) {
              const systemPayloads = stockData.systemMessages.map(msg => ({ sheet: branchInfo.sheetName, tanggal: todayStr, cash: 0, bca: 0, gofood: 0, jenisPengeluaran: msg, totalPengeluaran: 0 }));
              fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(systemPayloads) });
          }
      }).catch(e => console.error('Gagal potong stok di background', e));

      fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payloads) })
      .then(res => res.json()).then(resJson => {
          if (customerModal.type === 'BELUM_BAYAR') {
              // SIMPAN RAW DATA BUAT FITUR EDIT NANTINYA
              const newOrder = { 
                  ...transactionDataForPrint, 
                  id: Date.now(), 
                  dbId: resJson.data[0]?._id, 
                  status: 'BELUM_BAYAR',
                  rawCart: cart,
                  rawCustomerName: customerName,
                  rawPickupType: pickupType,
                  rawPickupCondition: pickupCondition,
                  rawPickupTime: pickupTime,
                  rawOrderType: orderType,
                  rawCabbage: cabbageOption,
                  rawSambal: sambalOption,
                  rawNote: orderNote
              };
              setLocalOrders(prev => [...prev, newOrder]);
          }
          refreshData(); fetchMenuData();
      });

      // Kosongin state UI SETELAH data disimpan ke variabel
      setCart({}); setCustomerName(''); setAmountPaidStr(''); setCustomerModal({ isOpen: false, type: null }); setIsSubmitting(false);
      setOrderType('Makan Sini'); setCabbageOption('Pake Kol Biasa'); setSambalOption('Pake Semua'); setOrderNote(''); setPickupType('Tidak Ada Keterangan'); setPickupCondition('Pagi'); setPickupTime('');
      setPrintModal({ isOpen: true, data: transactionDataForPrint, printCount: 0 });
  };

  const deleteLocalOrder = async (orderId) => {
      const order = localOrders.find(o => o.id === orderId);
      if (order && order.dbId) {
          await fetch(`${API_URL}/${order.dbId}`, { method: 'DELETE' }).catch(e=>console.log(e));
          await restoreStockFromStr(branchInfo.sheetName, order.items); // Balikin stok pas dihapus
      }
      setLocalOrders(localOrders.filter(o => o.id !== orderId));
  };

// FITUR BARU: EDIT TAPPING ORDER
  const handleEditTappingOrder = async (order) => {
      // Tolak kalau ini order versi lama yang belum nyimpen rawCart
      if (!order.rawCart) {
          alert("⚠️ Pesanan tapping versi lama tidak mendukung edit langsung. Silakan batalkan dan input ulang.");
          return;
      }
      
      // 1. Load semua data ke form kasir
      setCart(order.rawCart);
      setCustomerName(order.rawCustomerName || '');
      setPickupType(order.rawPickupType || 'Tidak Ada Keterangan');
      setPickupCondition(order.rawPickupCondition || 'Pagi');
      setPickupTime(order.rawPickupTime || '');
      setOrderType(order.rawOrderType || 'Makan Sini');
      setCabbageOption(order.rawCabbage || 'Pake Kol Biasa');
      setSambalOption(order.rawSambal || 'Pake Semua');
      setOrderNote(order.rawNote || '');

      // 2. Hapus order tapping ini dari list (karena lagi di-edit)
      setIsDeletingId(order.id);
      await deleteLocalOrder(order.id);
      setIsDeletingId(null);
      
      // 3. Tutup Modal
      setIsTappingModalOpen(false);
  };

const handlePrintTransaction = async (txData, isFromPrintModal = false) => {
    if (!btCharacteristic) { alert("⚠️ Printer Bluetooth belum dikoneksikan!"); return; }

    let itemsStr = "", queueStr = "", total = 0, dateStr = "";
    let isLunas = true;

    if (txData._id) { 
      queueStr = txData.jenisPengeluaran ? txData.jenisPengeluaran.split(']')[0].replace('[', '') : 'Lunas';
      itemsStr = txData.jenisPengeluaran ? txData.jenisPengeluaran.split('] ')[1] : '';
      total = (txData.cash||0) + (txData.bca||0) + (txData.gofood||0);
      dateStr = new Date(txData.createdAt).toLocaleString('id-ID');
    } else { 
      queueStr = txData.queue; itemsStr = txData.items; total = txData.total; dateStr = `${todayStr} ${txData.time}`;
      if (txData.status === 'BELUM_BAYAR') isLunas = false;
    }

    const itemArray = (itemsStr || '').split(',').map(i => i.trim()).filter(i => i);

    let orderType = "", cabbageOpt = "", sambalOpt = "", note = "", payMethod = "", payGiven = 0, payChange = 0;
    let realItems = [];

    itemArray.forEach(item => {
        if (item.startsWith('**')) {
            const cleanStr = item.replace(/\*/g, '').trim();
            if (cleanStr === 'MAKAN SINI' || cleanStr === 'BUNGKUS') orderType = cleanStr;
            else if (cleanStr.includes('KOL')) cabbageOpt = cleanStr;
            else sambalOpt = cleanStr;
        } else if (item.startsWith('++ CATATAN:')) {
            note = item.replace('++ CATATAN:', '').trim();
        } else if (item.startsWith('++ PAY:')) {
            const splitPay = item.replace('++ PAY:', '').trim().split('|');
            payMethod = splitPay[0]; payGiven = parseInt(splitPay[1]) || 0; payChange = parseInt(splitPay[2]) || 0;
        } else {
            // PISAHKAN ITEM UTAMA DAN CATATAN PER ITEM
            let parts = item.split('::');
            let mainItem = parts[0].trim();
            let subOptions = parts.length > 1 ? parts[1].split('|').map(s => s.trim()).filter(s => s) : [];
            realItems.push({ main: mainItem, sub: subOptions });
        }
    });

    let receiptText = `\x1B\x40`; // Init Printer
    receiptText += `\x1B\x61\x01`; // Align Center
    receiptText += `\x1B\x45\x01`; // Bold ON
    receiptText += `${branchInfo.name.split('-')[0].trim()}\n`;
    receiptText += `\x1B\x45\x00`; // Bold OFF
    receiptText += `${branchInfo.name.split('-')[1]?.trim() || ''}\n`;
    receiptText += `--------------------------------\n`;
    
    if (orderType) { receiptText += `\x1B\x45\x01[ ${orderType} ]\n\x1B\x45\x00`; }
    receiptText += `--------------------------------\n`;

    // FORMAT KOL DAN SAMBAL BARU UNTUK BLUETOOTH PRINTER
    receiptText += `\x1B\x61\x00`; // Align Left
    if (cabbageOpt && cabbageOpt !== 'TIDAK PAKE KOL') receiptText += `Kol    : ${cabbageOpt}\n`;
    if (sambalOpt && sambalOpt !== 'TIDAK PAKE SAMBAL') receiptText += `Sambal : ${sambalOpt}\n`;
    
    receiptText += `Waktu  : ${dateStr}\nAntri  : ${queueStr}\n`;
    if (note) receiptText += `Catatan: ${note}\n`;
    receiptText += `--------------------------------\n`;
    
    // FORMAT PRINT LIST MENU + SUB-CATATAN (MENJOROK)
    realItems.forEach(itemObj => { 
        receiptText += `${itemObj.main}\n`; 
        if (itemObj.sub && itemObj.sub.length > 0) {
            itemObj.sub.forEach(sub => {
                receiptText += `  - ${sub}\n`;
            });
        }
    });
    receiptText += `--------------------------------\n`;

    receiptText += `\x1B\x45\x01TOTAL : ${formatRupiah(total)}\n\x1B\x45\x00`;
    
    // INFO METODE PEMBAYARAN DI NOTA
    if (payMethod && isLunas) {
        receiptText += `BAYAR (${payMethod.toUpperCase()}) : ${formatRupiah(payGiven)}\n`;
        if (payMethod === 'Cash') receiptText += `KEMBALI : ${formatRupiah(payChange)}\n`;
    }

    receiptText += `\x1B\x61\x01`; // Align Center
    if (isLunas) receiptText += `\n>> LUNAS <<\n`; else receiptText += `\n>> BELUM BAYAR <<\n`;
    receiptText += `\x1B\x61\x00--------------------------------\n\x1B\x61\x01Terima Kasih!\n\n\n\n`;

    try {
      await sendTextToPrinter(receiptText, btCharacteristic);
      if (txData._id) { await onPrintCount(txData._id); } else { setLocalOrders(localOrders.map(o => o.id === txData.id ? {...o, printCount: (o.printCount || 0) + 1} : o)); }
      
      if (isFromPrintModal) {
          setPrintModal(prev => { if (prev.printCount >= 1) { return { isOpen: false, data: null, printCount: 0 }; } else { return { ...prev, printCount: prev.printCount + 1 }; } });
      } else {
          setPrintModal({ isOpen: false, data: null, printCount: 0 }); setDetailModal({ isOpen: false, data: null });
      }
    } catch (err) { alert("Yah, gagal nge-print nih. Coba pastikan printernya nyala atau konek ulang."); }
  };

  // 1. BUAT TEMPLATE UNTUK MUTIARA MINANG
  const TEMPLATE_BAHAN_MM = [
    { id: 'b_daging', name: 'Daging (Rendang)', qty: '', price: '', isCustom: false },
    { id: 'b_ayam', name: 'Ayam', qty: '', price: '', isCustom: false },
    { id: 'b_perkedel', name: 'Perkedel', qty: '', price: '', isCustom: false },
    { id: 'b_ikan_bawal', name: 'Ikan Bawal', qty: '', price: '', isCustom: false },
    { id: 'b_cabe', name: 'Cabe', qty: '', price: '', isCustom: false },
    { id: 'b_bawang', name: 'Bawang', qty: '', price: '', isCustom: false }
  ];

  // 2. BUAT TEMPLATE UNTUK PECEL LELE CABE IJO
  const TEMPLATE_BAHAN_PLCI = [
    { id: 'b_ayam_plci', name: 'Ayam', qty: '', price: '', isCustom: false },
    { id: 'b_lele', name: 'Lele', qty: '', price: '', isCustom: false },
    { id: 'b_usus', name: 'Usus', qty: '', price: '', isCustom: false },
    { id: 'b_ati', name: 'Ati Ampela', qty: '', price: '', isCustom: false },
    { id: 'b_tahu', name: 'Tahu', qty: '', price: '', isCustom: false },
    { id: 'b_tempe', name: 'Tempe', qty: '', price: '', isCustom: false }
  ];

  // 3. LOGIKA PEMILIHAN TEMPLATE BERDASARKAN BRAND
  let INIT_BAHAN = [];
  if (branchInfo.brand === 'minang') {
     // Jika cabangnya MM, pakai template MM
     INIT_BAHAN = [...TEMPLATE_BAHAN_MM];
  } else if (branchInfo.brand === 'pecel') {
     // Jika cabangnya PLCI, pakai template PLCI
     INIT_BAHAN = [...TEMPLATE_BAHAN_PLCI];
  } else {
     // Default jika cabang tidak punya brand / cabang baru
     INIT_BAHAN = [{ id: Date.now(), name: '', qty: '', price: '', isCustom: true }];
  }

  const [bahanList, setBahanList] = useState(INIT_BAHAN);
  const updateBahan = (id, field, val) => setBahanList(prev => prev.map(b => b.id === id ? { ...b, [field]: val } : b));
  const addCustomBahan = () => setBahanList([...bahanList, { id: Date.now(), name: '', qty: '', price: '', isCustom: true }]);
  const removeCustomBahan = (id) => setBahanList(bahanList.filter(b => b.id !== id));
  const grandTotalBahan = bahanList.reduce((sum, b) => sum + ((parseInt(b.qty)||0) * (parseInt(b.price)||0)), 0);

  const handleSubmitExpense = async () => {
    if (grandTotalBahan === 0) return;
    setIsSubmitting(true);
    const activeBahan = bahanList.filter(b => (parseInt(b.qty)||0) > 0 && b.name.trim() !== '');
    
    const groupId = Date.now(); 
    const noteStr = expenseNote.trim() ? ` | NOTE: ${expenseNote.trim()}` : '';

    const promises = activeBahan.map(b => {
      const qty = parseInt(b.qty); const price = parseInt(b.price); const total = qty * price;
      const jenisStr = `[${expenseMethod.toUpperCase()}] ${qty}x ${b.name} (@ ${formatRupiah(price)}) #GRP${groupId}#${noteStr}`;
      const payload = { sheet: branchInfo.sheetName, tanggal: todayStr, cash: 0, bca: 0, gofood: 0, jenisPengeluaran: jenisStr, totalPengeluaran: total };
      return fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    });

    await Promise.all(promises); 
    setBahanList(INIT_BAHAN); setExpenseNote(''); setExpenseMethod('Cash');
    refreshData(); setIsSubmitting(false);
  };

  const groupedExpenseHistory = useMemo(() => {
    const expenseItems = employeeVisibleData.filter(x => x.totalPengeluaran > 0).slice().reverse();
    const groups = [];
    expenseItems.forEach(item => {
      const match = item.jenisPengeluaran.match(/#GRP(\d+)#/);
      const grpId = match ? match[1] : item._id;
      if (groups.length > 0 && groups[groups.length - 1].grpId === grpId) { groups[groups.length - 1].items.push(item); } 
      else { groups.push({ grpId, items: [item] }); }
    });
    return groups;
  }, [employeeVisibleData]);

const ReceiptPrintArea = ({ data }) => {
    if (!data) return null;
    let itemsStr = "", queueStr = "", total = 0, dateStr = "";
    let isLunas = true;

    if (data._id) { 
      queueStr = data.jenisPengeluaran ? data.jenisPengeluaran.split(']')[0].replace('[', '') : 'Lunas';
      itemsStr = data.jenisPengeluaran ? data.jenisPengeluaran.split('] ')[1] : '';
      total = (data.cash||0) + (data.bca||0) + (data.gofood||0);
      dateStr = new Date(data.createdAt).toLocaleString('id-ID');
    } else { 
      queueStr = data.queue; itemsStr = data.items; total = data.total; dateStr = `${todayStr} ${data.time}`;
      if (data.status === 'BELUM_BAYAR') isLunas = false;
    }

    const itemArray = (itemsStr || '').split(',').map(i => i.trim()).filter(i => i);
    let orderType = "", cabbageOpt = "", sambalOpt = "", note = "", realItems = [];

    itemArray.forEach(str => {
        if (str.startsWith('**')) {
            const cleanStr = str.replace(/\*/g, '').trim();
            if (cleanStr === 'MAKAN SINI' || cleanStr === 'BUNGKUS') orderType = cleanStr;
            else if (cleanStr.includes('KOL')) cabbageOpt = cleanStr;
            else sambalOpt = cleanStr;
        } else if (str.startsWith('++ CATATAN:')) {
            note = str.replace('++ CATATAN:', '').trim();
        } else if (!str.startsWith('++ PAY:')) {
            // PISAHKAN ITEM UTAMA DAN CATATAN PER ITEM
            let parts = str.split('::');
            let mainItem = parts[0].trim();
            let subOptions = parts.length > 1 ? parts[1].split('|').map(s => s.trim()).filter(s => s) : [];
            realItems.push({ main: mainItem, sub: subOptions });
        }
    });

    return (
      <div id="print-area" className="hidden print:block absolute top-0 left-0 w-[58mm] bg-white text-black p-2 font-mono text-[11px] leading-tight z-[9999]">
        <div className="text-center mb-2">
          <h2 className="font-bold text-sm uppercase">{branchInfo.name.split('-')[0]}</h2>
          <p className="text-[9px]">{branchInfo.name.split('-')[1]}</p>
          <p className="text-[9px]">------------------------</p>
          <div className="my-1 py-1 border-y border-dashed border-black">
              <h3 className="font-black text-sm">{isLunas ? '>>> LUNAS <<<' : '>>> BELUM BAYAR <<<'}</h3>
          </div>
        </div>
        
        {orderType && <div className="text-center font-bold text-xs mb-1">[ {orderType} ]</div>}
        
        {/* FORMAT KOL DAN SAMBAL */}
        <div className="text-left text-[9px] mb-2 border-b border-dashed border-black pb-1">
           {cabbageOpt && cabbageOpt !== 'TIDAK PAKE KOL' && <div>Kol    : {cabbageOpt}</div>}
           {sambalOpt && sambalOpt !== 'TIDAK PAKE SAMBAL' && <div>Sambal : {sambalOpt}</div>}
        </div>

        <p className="mb-1 text-[9px]">Waktu: {dateStr}</p>
        <p className="mb-2 font-bold text-sm">Antrian: {queueStr}</p>
        {note && <p className="mb-2 text-[9px] font-bold">Catatan: {note}</p>}
        
        {/* FORMAT RENDER ITEM + SUB-CATATAN */}
        <div className="mb-2">
            {realItems.map((itemObj, idx) => (
                <div key={idx} className="mb-1.5">
                    <div className="font-bold">{itemObj.main}</div>
                    {itemObj.sub.length > 0 && (
                        <div className="pl-2.5 text-[9px] mt-0.5 ml-1 border-l border-dashed border-gray-400">
                            {itemObj.sub.map((s, i) => <div key={i}>- {s}</div>)}
                        </div>
                    )}
                </div>
            ))}
        </div>

        <p className="text-[9px]">------------------------</p>
        <div className="flex justify-between font-bold text-sm mt-1"><span>TOTAL</span><span>{formatRupiah(total)}</span></div>
        <div className="text-center mt-4 text-[9px]"><p>Terima Kasih!</p><p>Selamat Menikmati</p></div>
      </div>
    );
};

return (
    <div className="h-screen bg-gray-100 flex flex-col font-sans overflow-hidden text-gray-800 relative">
      <style dangerouslySetInnerHTML={{__html: ` @media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } } `}} />
      <ReceiptPrintArea data={printModal.data || detailModal.data} />

      {/* --- POP UP RINGAN STOK HABIS (TOAST) --- */}
      {stockAlert && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-sm flex items-center gap-2 border-2 border-red-700">
                  <AlertCircle size={18} /> {stockAlert}
              </div>
          </div>
      )}
        
{/* MODAL KHUSUS TAPPING / BELUM BAYAR */}
      {isTappingModalOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[115] flex items-center justify-center animate-in fade-in p-4 sm:p-6">
            <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-100 animate-in zoom-in-95 overflow-hidden">
                
                {/* Header Modal Tapping */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center border border-orange-200 shadow-sm">
                            <Clock size={28} className="text-orange-600"/>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 leading-tight">Antrian Tapping</h3>
                            <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Selesaikan Pembayaran & Serahkan Pesanan</p>
                        </div>
                    </div>
                    <button onClick={() => setIsTappingModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 shadow-sm active:scale-95">
                        <X size={24} />
                    </button>
                </div>

                {/* Filter & Sorting Tapping */}
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-sm font-bold text-gray-500">Menampilkan <span className="font-black text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">{employeeLocalOrders.length}</span> antrian</p>
                    <div className="flex bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm w-full sm:w-auto">
                        <button onClick={() => setTappingSortOrder('Terlama')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-black transition-all ${tappingSortOrder === 'Terlama' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Urutan Terlama</button>
                        <button onClick={() => setTappingSortOrder('Terbaru')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-black transition-all ${tappingSortOrder === 'Terbaru' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Paling Baru</button>
                    </div>
                </div>

                {/* List Body Tapping */}
                <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/50">
                    {employeeLocalOrders.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-80">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={40} className="text-gray-300" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900">Semua Lunas!</h3>
                            <p className="text-sm font-bold mt-1">Tidak ada antrian tapping saat ini.</p>
                        </div>
                    ) : (
                        [...employeeLocalOrders].sort((a, b) => tappingSortOrder === 'Terlama' ? a.id - b.id : b.id - a.id).map(order => {
                            // --- LOGIKA PARSING NAMA ANTRIAN & WAKTU AMBIL ---
                            const qName = order.queue.split(' (')[0];
                            const qTimeMatch = order.queue.match(/\((Ambil.*?)\)/);
                            const qTime = qTimeMatch ? qTimeMatch[1] : 'Ambil: Bebas/Nanti';

                            // --- LOGIKA PARSING DAFTAR PESANAN UI CLEANSING ---
                            const rawItemsStr = order.items || '';
                            const itemArray = rawItemsStr.split(',').map(i => i.trim()).filter(i => i);
                            let options = []; 
                            let ordersList = []; 
                            let noteStr = '';

                            itemArray.forEach(str => {
                                if (str.startsWith('**')) options.push(str.replace(/\*/g, '').trim());
                                else if (str.startsWith('++ CATATAN:')) noteStr = str.replace('++ CATATAN:', '').trim();
                                else if (str.startsWith('++ PAY:')) { /* Ignore, tidak di print di UI Tapping */ }
                                else ordersList.push(str);
                            });

                            return (
                                // CARD ITEM TAPPING
                                <div key={order.id} className="bg-white p-5 rounded-[1.5rem] border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all flex flex-col gap-4 relative group">
                                    
                                    {/* 1. HEADER CARD: Antrian, Waktu Ambil & Aksi Kanan */}
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-100 pb-4">
                                        <div className="flex flex-col gap-2">
                                            <span className="font-black text-gray-900 text-2xl leading-none">{qName}</span>
                                            
                                            {/* TAMPILAN WAKTU AMBIL (SANGAT JELAS) */}
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl border uppercase tracking-wide w-fit ${qTime.includes('Bebas/Nanti') ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                                <Clock size={16} /> Rencana {qTime}
                                            </span>
                                        </div>

                                        {/* Action Buttons (Edit, Print, Delete) */}
                                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 self-end sm:self-start">
                                            {order.printCount > 0 && <span className="text-[10px] font-black text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1"><Printer size={12}/> {order.printCount}x</span>}
                                            
                                            {/* TOMBOL EDIT */}
                                            <button onClick={() => handleEditTappingOrder(order)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors tooltip" title="Edit Pesanan Ini">
                                                <Pencil size={18}/>
                                            </button>

                                            <div className="w-px h-5 bg-gray-200 mx-1"></div>
                                            
                                            {/* TOMBOL DELETE */}
                                            {isDeletingId === order.id ? ( 
                                                <button disabled className="bg-red-500 text-white text-[10px] px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-wait"><Loader2 size={12} className="animate-spin" /> Proses...</button> 
                                            ) : deleteConfirm === order.id ? ( 
                                                <button onClick={() => { setIsDeletingId(order.id); deleteLocalOrder(order.id); setIsDeletingId(null); setDeleteConfirm(null); }} className="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-1.5 rounded-lg font-black animate-in zoom-in shadow-sm transition-colors">Yakin Batal?</button> 
                                            ) : ( 
                                                <button onClick={() => setDeleteConfirm(order.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors tooltip" title="Hapus Permanen">
                                                    <Trash2 size={18}/>
                                                </button> 
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. BODY CARD: Detail Menu & Total Tagihan */}
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <div className="flex-1 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Detail Pesanan:</p>
                                            
                                            {/* BADGES OPSI MAKAN */}
                                            {options.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {options.map((opt, idx) => (
                                                        <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100 shadow-sm">{opt}</span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* LIST MENU RAPIH */}
                                            <ul className="space-y-2.5 mb-3">
                                                {ordersList.map((item, idx) => {
                                                    const qtyMatch = item.match(/^(\d+)x\s(.*)/);
                                                    const qty = qtyMatch ? qtyMatch[1] : '';
                                                    const name = qtyMatch ? qtyMatch[2] : item;
                                                    return (
                                                        <li key={idx} className="flex items-start gap-3">
                                                            {qty && <span className="text-sm font-black text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-sm">{qty}x</span>}
                                                            <span className="text-sm font-bold text-gray-700 pt-1">{name}</span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>

                                            {/* CATATAN PELANGGAN */}
                                            {noteStr && (
                                                <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100 mt-3">
                                                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={12}/> Catatan Pelanggan</p>
                                                    <p className="text-xs font-bold text-orange-900">{noteStr}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* KOTAK TOTAL TAGIHAN KANAN */}
                                        <div className="sm:w-48 bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col justify-center shrink-0 text-right sm:text-left">
                                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Total Tagihan</p>
                                            <span className="text-3xl font-black text-orange-600 tracking-tight">{formatRupiah(order.total)}</span>
                                        </div>
                                    </div>

                                    {/* 3. FOOTER CARD: Tombol Bayar */}
                                    <div className="pt-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center sm:text-left">Pilih Pembayaran & Lunasi:</p>
                                        <div className="grid grid-cols-3 gap-3">
                                            <button onClick={() => markAsPaid(order.id, 'Cash')} className="py-3.5 bg-gray-900 text-white hover:bg-black rounded-xl text-sm font-black transition-all active:scale-95 shadow-md border-b-4 border-gray-950 flex justify-center items-center gap-2"><Wallet size={16} className="hidden sm:block"/> CASH</button>
                                            <button onClick={() => markAsPaid(order.id, 'BCA')} className="py-3.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-black transition-all active:scale-95 shadow-sm border border-blue-200 flex justify-center items-center gap-2"><CreditCard size={16} className="hidden sm:block"/> BCA</button>
                                            <button onClick={() => markAsPaid(order.id, 'QRIS')} className="py-3.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-sm font-black transition-all active:scale-95 shadow-sm border border-purple-200 flex justify-center items-center gap-2">QRIS</button>
                                        </div>
                                    </div>

                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
      )}

{detailModal.isOpen && detailModal.data && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[110] flex items-center justify-center animate-in fade-in p-4">
            <div className="bg-white p-6 rounded-[2rem] shadow-2xl max-w-sm w-full border border-gray-100 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                
                {/* Header Modal */}
                <div className="flex justify-between items-start mb-4 shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 leading-tight">Detail Transaksi</h3>
                        <p className="text-xs font-bold text-gray-400 mt-1">{detailModal.data._id ? new Date(detailModal.data.createdAt).toLocaleTimeString('id-ID') : detailModal.data.time}</p>
                    </div>
                    <button onClick={() => setDetailModal({ isOpen: false, data: null })} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors">
                        <X size={18}/>
                    </button>
                </div>

                {/* Content Modal - Scrollable biar gak nabrak bawah kalau pesanan panjang */}
                <div className="overflow-y-auto flex-1 pr-1 space-y-4">
                    {/* Antrian */}
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Antrian / Nama</span>
                        <span className="font-black text-gray-900 text-lg">
                            {detailModal.data._id ? (detailModal.data.jenisPengeluaran.split(']')[0].replace('[', '')) : detailModal.data.queue.split(' (Ambil:')[0]}
                        </span>
                    </div>

                    {/* Parsing Logika Pesanan Terstruktur */}
                    {(() => {
                        const rawItemsStr = detailModal.data._id ? detailModal.data.jenisPengeluaran.split('] ')[1] : detailModal.data.items;
                        const itemArray = (rawItemsStr || '').split(',').map(i => i.trim()).filter(i => i);
                        let options = []; 
                        let ordersList = []; 
                        let noteStr = '';

                        itemArray.forEach(str => {
                            if (str.startsWith('**')) options.push(str.replace(/\*/g, '').trim());
                            else if (str.startsWith('++ CATATAN:')) noteStr = str.replace('++ CATATAN:', '').trim();
                            else if (!str.startsWith('++ PAY:')) ordersList.push(str);
                        });

                        return (
                            <>
                                {/* Badge Opsi Tambahan */}
                                {options.length > 0 && (
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Keterangan Opsi</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {options.map((opt, idx) => (
                                                <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100 shadow-sm">{opt}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* List Menu Rapih */}
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Menu Yang Dipesan</p>
                                    <div className="space-y-2">
                                        {ordersList.map((item, idx) => {
                                            const match = item.match(/^(\d+)x\s(.*)/);
                                            const qty = match ? match[1] : '';
                                            const name = match ? match[2] : item;
                                            return (
                                                <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                                                    {qty && <span className="text-sm font-black text-gray-900 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-md">{qty}x</span>}
                                                    <span className="text-sm font-bold text-gray-700 leading-tight pt-0.5">{name}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {/* Catatan Pelanggan */}
                                {noteStr && (
                                    <div className="bg-orange-50 p-3 rounded-xl border border-orange-100">
                                        <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={12}/> Catatan Request</p>
                                        <p className="text-sm font-bold text-orange-900">{noteStr}</p>
                                    </div>
                                )}
                            </>
                        )
                    })()}
                </div>

                {/* Footer / Total Tagihan */}
                <div className="mt-4 pt-4 border-t border-gray-100 shrink-0">
                    <div className="flex justify-between items-end mb-4 bg-gray-50 p-3 rounded-xl">
                        <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Tagihan</span>
                        <span className="text-2xl font-black text-green-600">{formatRupiah(detailModal.data._id ? ((detailModal.data.cash||0)+(detailModal.data.bca||0)+(detailModal.data.gofood||0)) : detailModal.data.total)}</span>
                    </div>
                    <button onClick={() => handlePrintTransaction(detailModal.data)} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl">
                        <Printer size={20}/> Cetak Nota Sekarang
                    </button>
                </div>

            </div>
        </div>
      )}

      {printModal.isOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 border border-gray-100 animate-in zoom-in-95 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 mx-auto">
                    <CheckCircle2 size={40} className="text-green-500"/>
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 mb-2">Tersimpan!</h3>
                
                {/* Teks Instruksi Dinamis Berdasarkan Jumlah Cetakan */}
                <p className={`text-sm font-bold mb-8 transition-colors ${printModal.printCount === 0 ? 'text-gray-500' : 'text-blue-600 bg-blue-50 p-2 rounded-xl border border-blue-100'}`}>
                    {printModal.printCount === 0 
                      ? 'Apakah pelanggan meminta struk/nota?' 
                      : '✅ Struk pertama tercetak. Cabut kertas, lalu klik untuk cetak struk kedua (arsip toko).'}
                </p>

                <div className="flex gap-3 flex-col sm:flex-row">
                    <button onClick={() => setPrintModal({isOpen: false, data: null, printCount: 0})} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                        Tutup Saja
                    </button>
                    {/* Lempar argumen "true" ke function biar trigger logika counter */}
                    <button onClick={() => handlePrintTransaction(printModal.data, true)} className={`flex-[2] py-4 text-white font-black rounded-xl active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 ${printModal.printCount === 0 ? 'bg-gray-900 hover:bg-black' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        <Printer size={20}/> 
                        {printModal.printCount === 0 ? 'YA, CETAK STRUK' : 'CETAK KE-2 & TUTUP'}
                    </button>
                </div>
            </div>
        </div>
      )}

{customerModal.isOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[90] flex items-center justify-center animate-in fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 border border-gray-100 animate-in zoom-in-95 relative">
                
                <button 
                  onClick={() => {
                    setCustomerModal({ isOpen: false, type: null });
                    setCustomerName('');
                  }} 
                  className="absolute top-5 right-5 p-2 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto"><User size={32} className="text-gray-900"/></div>
                <h3 className="text-xl font-black text-center text-gray-900 mb-2">Atas Nama Siapa?</h3>
                <p className="text-center text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">{customerModal.type === 'BELUM_BAYAR' ? 'PENTING: JANGAN DISKIP BIAR GAMPANG DITAGIH' : 'Opsional: Boleh di-skip kalau antrian rame'}</p>
                <input type="text" placeholder="Masukkan nama..." className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-center text-lg font-bold outline-none focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all mb-4" value={customerName} onChange={e => setCustomerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && executeSubmitSale(false)} />
                
                {/* FORM KHUSUS JADWAL AMBIL (BELUM BAYAR) */}
                {customerModal.type === 'BELUM_BAYAR' && (
                    <div className="mb-6 space-y-3 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest text-center">Kapan Akan Diambil?</p>
                        <div className="grid grid-cols-3 gap-2">
                            {['Tidak Ada Keterangan', 'Kondisi', 'Waktu Tertentu'].map(pt => (
                                <button key={pt} onClick={() => setPickupType(pt)} className={`py-2 rounded-xl font-black text-[10px] transition-all border-2 ${pickupType === pt ? 'border-orange-500 bg-orange-500 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-orange-300'}`}>
                                    {pt === 'Tidak Ada Keterangan' ? 'Bebas / Nanti' : pt}
                                </button>
                            ))}
                        </div>
                        
                        {pickupType === 'Kondisi' && (
                            <div className="grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95">
                                {['Pagi', 'Siang', 'Sore', 'Malam'].map(cond => (
                                    <button key={cond} onClick={() => setPickupCondition(cond)} className={`py-2 rounded-xl font-black text-[10px] sm:text-xs transition-all border-2 ${pickupCondition === cond ? 'border-gray-900 bg-gray-900 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}`}>
                                        {cond}
                                    </button>
                                ))}
                            </div>
                        )}

                        {pickupType === 'Waktu Tertentu' && (
                            <div className="animate-in fade-in zoom-in-95">
                                <input type="time" className="w-full bg-white border-2 border-gray-200 p-3 rounded-xl text-center text-lg font-black outline-none focus:border-gray-900 transition-all text-gray-900" value={pickupTime} onChange={e => setPickupTime(e.target.value)} />
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    <button onClick={() => executeSubmitSale(true)} disabled={isSubmitting || (pickupType === 'Waktu Tertentu' && !pickupTime)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">Skip Nama</button>
                    <button onClick={() => executeSubmitSale(false)} disabled={isSubmitting || !customerName.trim() || (pickupType === 'Waktu Tertentu' && !pickupTime)} className="flex-[2] py-4 bg-gray-900 text-white font-black rounded-xl active:scale-95 transition-transform shadow-lg disabled:opacity-50">LANJUT</button>
                </div>
            </div>
        </div>
      )}

{/* SMART MODAL VARIAN (AYAM & NASI) DINAMIS */}
      {variantModal.isOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[120] flex items-center justify-center animate-in fade-in p-4">
            <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-gray-100 animate-in zoom-in-95 relative">
                
                <button onClick={() => setVariantModal({isOpen: false, item: null})} className="absolute top-5 right-5 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors active:scale-90">
                    <X size={20}/>
                </button>

                <h3 className="text-2xl font-black text-gray-900 mb-1 text-center">Pilih Opsi</h3>
                <p className="text-center text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">{variantModal.item?.name}</p>

                {/* LOGIKA PERCABANGAN UI BERDASARKAN MODE KASIR */}
                {activeTab === 'mode_cepat' ? (
                    /* --- UI MODE CEPAT (INSTAN 1 KLIK) --- */
                    <div className="space-y-4 mb-2">
                        {variantSelections.ayam !== 'N/A' && (
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1 text-center">Bagian Ayam</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleInstantVariant('ayam', 'Paha')} className="py-8 rounded-3xl font-black text-2xl transition-all border-2 active:scale-95 bg-orange-50 hover:bg-orange-500 hover:text-white text-orange-700 border-orange-200 shadow-sm">PAHA</button>
                                    <button onClick={() => handleInstantVariant('ayam', 'Dada')} className="py-8 rounded-3xl font-black text-2xl transition-all border-2 active:scale-95 bg-red-50 hover:bg-red-500 hover:text-white text-red-700 border-red-200 shadow-sm">DADA</button>
                                </div>
                            </div>
                        )}
                        {variantSelections.nasi !== 'N/A' && (
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1 text-center">Porsi Nasi</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => handleInstantVariant('nasi', 'Nasi Full')} className="py-6 rounded-3xl font-black text-lg transition-all border-2 active:scale-95 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border-blue-200 shadow-sm flex flex-col items-center justify-center gap-1">
                                        <span>NASI FULL</span>
                                        <span className="text-xs font-bold opacity-80">(5.000)</span>
                                    </button>
                                    <button onClick={() => handleInstantVariant('nasi', 'Nasi Setengah')} className="py-6 rounded-3xl font-black text-lg transition-all border-2 active:scale-95 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border-blue-200 shadow-sm flex flex-col items-center justify-center gap-1">
                                        <span>1/2 PORSI</span>
                                        <span className="text-xs font-bold opacity-80">(3.000)</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* --- UI MODE KASIR BIASA (PILIH LALU KONFIRMASI) --- */
                    <div className="space-y-4">
                        {variantSelections.ayam !== 'N/A' && (
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Bagian Ayam</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setVariantSelections(prev => ({...prev, ayam: 'Paha'}))} className={`py-4 rounded-2xl font-black text-lg transition-all border-2 active:scale-95 ${variantSelections.ayam === 'Paha' ? 'bg-orange-500 border-orange-600 text-white shadow-md' : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'}`}>PAHA</button>
                                    <button onClick={() => setVariantSelections(prev => ({...prev, ayam: 'Dada'}))} className={`py-4 rounded-2xl font-black text-lg transition-all border-2 active:scale-95 ${variantSelections.ayam === 'Dada' ? 'bg-red-500 border-red-600 text-white shadow-md' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'}`}>DADA</button>
                                </div>
                            </div>
                        )}
                        {variantSelections.nasi !== 'N/A' && (
                            <div>
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Porsi Nasi</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setVariantSelections(prev => ({...prev, nasi: 'Nasi Full'}))} className={`py-4 rounded-2xl font-black text-sm transition-all border-2 active:scale-95 ${variantSelections.nasi === 'Nasi Full' ? 'bg-blue-500 border-blue-600 text-white shadow-md' : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-200'}`}>NASI FULL (5rb)</button>
                                    <button onClick={() => setVariantSelections(prev => ({...prev, nasi: 'Nasi Setengah'}))} className={`py-4 rounded-2xl font-black text-sm transition-all border-2 active:scale-95 ${variantSelections.nasi === 'Nasi Setengah' ? 'bg-blue-500 border-blue-600 text-white shadow-md' : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-200'}`}>1/2 PORSI (3rb)</button>
                                </div>
                            </div>
                        )}
                        
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setVariantModal({isOpen: false, item: null})} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
                            <button 
                                onClick={confirmVariantSelection} 
                                disabled={(variantSelections.ayam !== 'N/A' && !variantSelections.ayam) || (variantSelections.nasi !== 'N/A' && !variantSelections.nasi)}
                                className="flex-[2] py-4 bg-gray-900 text-white font-black rounded-xl active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                MASUKAN KERANJANG
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
      )}
      
{/* MODAL OPSI PER ITEM (NEW) - COMPACT SIZE UNTUK TABLET 11 INCH */}
      {itemOptionModal.isOpen && (
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[999] flex items-center justify-center animate-in fade-in p-4">
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl h-[90vh] max-h-[800px] flex flex-col border border-gray-100 animate-in zoom-in-95">
                  
                  {/* HEADER POP UP */}
                  <div className="p-5 sm:p-6 border-b border-gray-100 bg-blue-50/80 rounded-t-[2rem] flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Detail Modifikasi Item</h3>
                          <p className="text-xs sm:text-sm font-bold text-blue-600 mt-1">{itemOptionModal.item?.name}</p>
                      </div>
                      <button onClick={() => setItemOptionModal({ isOpen: false, cartKey: null, item: null, options: { type: 'Bawaan Global', cabbage: 'Bawaan Global', sambal: 'Bawaan Global', note: '' } })} className="p-3 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full border border-gray-200 shadow-sm transition-colors active:scale-90">
                          <X size={24} />
                      </button>
                  </div>
                  
                  {/* BODY POP UP (SCROLLABLE DUA KOLOM) */}
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
                          
                          {/* KOLOM KIRI */}
                          <div className="space-y-6">
                              <div>
                                  <label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">1</div> Tipe Bawaan</label>
                                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                                      {['Bawaan Global', 'Makan Sini', 'Bungkus'].map(opt => (
                                          <button key={opt} onClick={() => setItemOptionModal(p => ({...p, options: {...p.options, type: opt}}))} className={`py-3 sm:py-4 rounded-xl font-black text-[10px] sm:text-xs transition-all border-2 active:scale-95 ${itemOptionModal.options.type === opt ? 'border-blue-600 bg-blue-600 text-white shadow-lg transform scale-[1.02]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>
                                              {opt === 'Bawaan Global' ? 'Ikut Global' : opt}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              <div>
                                  <label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px]">2</div> Opsi Kol</label>
                                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                      {['Bawaan Global', 'Tidak Pake Kol', 'Pake Kol Biasa', 'Pake Kol Goreng'].map(opt => (
                                          <button key={opt} onClick={() => setItemOptionModal(p => ({...p, options: {...p.options, cabbage: opt}}))} className={`py-3 sm:py-4 rounded-xl font-black text-xs sm:text-sm transition-all border-2 active:scale-95 flex items-center justify-center text-center gap-1 ${itemOptionModal.options.cabbage === opt ? 'border-gray-900 bg-gray-900 text-white shadow-md transform scale-[1.01]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>
                                              <span>{opt === 'Bawaan Global' ? 'Ikut Global' : opt}</span>
                                              {itemOptionModal.options.cabbage === opt && <CheckCircle2 size={16} className="text-white hidden sm:block" />}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>
                          
                          {/* KOLOM KANAN */}
                          <div className="space-y-6 flex flex-col">
                              <div>
                                  <label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px]">3</div> Opsi Sambal</label>
                                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                      {['Bawaan Global', 'Tidak Pake Sambal', 'Pake Semua', 'Sambal Merah Saja', 'Sambal Ijo Saja'].map(opt => (
                                          <button key={opt} onClick={() => setItemOptionModal(p => ({...p, options: {...p.options, sambal: opt}}))} className={`py-3 sm:py-4 rounded-xl font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${itemOptionModal.options.sambal === opt ? 'border-red-500 bg-red-500 text-white shadow-md transform scale-[1.02]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>
                                              {opt === 'Bawaan Global' ? 'Ikut Global' : opt}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              <div className="flex-1 flex flex-col min-h-[100px]">
                                  <label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-[10px]">4</div> Catatan Titipan / Bebas</label>
                                    <textarea 
                                      placeholder="Misal: tambah kecap, dipisah (Pesanan A)..."
                                      className="w-full flex-1 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-500 focus:shadow-inner resize-none transition-all placeholder:text-gray-400 placeholder:font-normal"
                                      value={itemOptionModal.options.note}
                                      onChange={e => setItemOptionModal(p => ({...p, options: {...p.options, note: e.target.value}}))}
                                      onKeyDown={e => { 
                                          if (e.key === 'Enter' && !e.shiftKey) { 
                                              e.preventDefault(); 
                                              saveItemOptions(); 
                                          } 
                                      }}
                                  ></textarea>
                              </div>
                          </div>

                      </div>
                  </div>

                  {/* FOOTER POP UP (TOMBOL BESAR BAWAH) */}
                  <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/80 rounded-b-[2rem] shrink-0">
                      <button onClick={saveItemOptions} className="w-full py-4 sm:py-5 bg-gray-900 text-white font-black text-lg sm:text-xl rounded-2xl hover:bg-black shadow-lg active:scale-[0.98] transition-all tracking-wider flex items-center justify-center gap-3 border-b-4 border-gray-950">
                          <CheckCircle2 size={28} className="text-green-400" /> SIMPAN CATATAN ITEM
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL EDIT HARGA */}
      {editPriceModal.isOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[120] flex items-center justify-center animate-in fade-in">
             <div className="bg-white p-6 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 border border-gray-100 animate-in zoom-in-95">
                  <h3 className="text-xl font-black text-gray-900 mb-2 text-center">Ubah Harga Jual</h3>
                  <p className="text-center text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">{editPriceModal.itemName}</p>

                  <div className="relative mb-6">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-xl">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-2xl font-black outline-none focus:border-gray-900 focus:bg-white transition-all text-gray-900"
                          value={editPriceModal.tempPrice}
                          onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, '');
                              setEditPriceModal(prev => ({...prev, tempPrice: raw ? new Intl.NumberFormat('id-ID').format(raw) : ''}));
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && saveEditedPrice()}
                      />
                  </div>

                  <div className="flex gap-3">
                       <button onClick={() => setEditPriceModal({isOpen: false, cartItemId: null, itemName: '', tempPrice: ''})} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
                       <button onClick={saveEditedPrice} className="flex-[2] py-4 bg-gray-900 text-white font-black rounded-xl active:scale-95 transition-transform shadow-lg">SIMPAN HARGA</button>
                  </div>
             </div>
        </div>
      )}

{/* MODAL EDIT MASTER MENU (NAMA, HARGA, STOK) */}
      {editMasterModal.isOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[120] flex items-center justify-center animate-in fade-in">
             <div className="bg-white p-6 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 border border-gray-100 animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 mx-auto"><Settings size={28} className="text-blue-500"/></div>
                  <h3 className="text-xl font-black text-gray-900 mb-6 text-center leading-tight">Pengaturan<br/>Master Menu</h3>

                  <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2 mb-6">
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Ubah Nama Menu</label>
                          <input type="text" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-gray-900 focus:bg-white transition-all text-gray-900" value={editMasterModal.tempName} onChange={(e) => setEditMasterModal({...editMasterModal, tempName: e.target.value})} />
                      </div>
                      
                      <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Ubah Harga</label>
                          <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black">Rp</span>
                              <input type="text" inputMode="numeric" className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-black text-lg outline-none focus:border-gray-900 focus:bg-white transition-all text-gray-900" value={editMasterModal.tempPrice} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setEditMasterModal({...editMasterModal, tempPrice: raw ? new Intl.NumberFormat('id-ID').format(raw) : ''}); }} />
                          </div>
                      </div>

                      {/* INPUT STOK GLOBAL DINAMIS (KUNCI JIKA PAKETAN) */}
                      <div 
                          className={`p-3 rounded-xl border relative transition-all ${editMasterModal.item?.category === 'Paketan' ? 'bg-gray-100 border-gray-300' : 'bg-green-50 border-green-100'}`}
                          onClick={() => {
                              // LOGIKA ALERT JIKA KLIK STOK PAKETAN
                              if (editMasterModal.item?.category === 'Paketan') {
                                  setStockAlert("⚠️ Update stok ditolak! Harap update stok melalui menu Satuan.");
                                  setTimeout(() => setStockAlert(null), 3500);
                              }
                          }}
                      >
                          <label className={`block text-[10px] font-black uppercase tracking-widest mb-1 ml-1 flex items-center gap-1 ${editMasterModal.item?.category === 'Paketan' ? 'text-gray-500' : 'text-green-600'}`}>
                              {editMasterModal.item?.category === 'Paketan' ? <><Lock size={12}/> Stok Terkunci (Ikut Satuan)</> : 'Stok Global Tersedia'}
                          </label>
                          <input 
                              type="number" 
                              min="0" 
                              className={`w-full px-4 py-3 border rounded-xl font-black text-2xl outline-none text-center transition-all ${editMasterModal.item?.category === 'Paketan' ? 'bg-gray-200 border-gray-300 text-gray-400 pointer-events-none' : 'bg-white border-green-200 focus:border-green-500 text-gray-900'}`} 
                              value={editMasterModal.tempStock} 
                              onChange={(e) => {
                                  // Proteksi ganda agar tidak bisa diubah lewat keyboard
                                  if (editMasterModal.item?.category !== 'Paketan') {
                                      setEditMasterModal({...editMasterModal, tempStock: e.target.value});
                                  }
                              }}
                              readOnly={editMasterModal.item?.category === 'Paketan'}
                          />
                          
                          {/* Invisible overlay untuk menangkap klik & ubah kursor jika terkunci */}
                          {editMasterModal.item?.category === 'Paketan' && (
                              <div className="absolute inset-0 z-10 cursor-not-allowed"></div>
                          )}
                      </div>
                  </div>

                  <div className="flex gap-3">
                       <button onClick={() => setEditMasterModal({isOpen: false, item: null, tempName: '', tempPrice: '', tempStock: ''})} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
                       <button onClick={saveMasterMenu} disabled={isSubmitting} className="flex-[2] py-4 bg-gray-900 text-white font-black rounded-xl active:scale-95 transition-transform shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                           {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} SIMPAN UPDATE
                       </button>
                  </div>
             </div>
        </div>
      )}
      
{/* ---> MODAL POP UP OPSI GLOBAL - COMPACT SIZE UNTUK TABLET 11 INCH <--- */}
      {isOptionModalOpen && (
          <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[999] flex items-center justify-center animate-in fade-in p-4">                      
              <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl h-[90vh] max-h-[800px] flex flex-col border border-gray-100 animate-in zoom-in-95">
                  
                  {/* HEADER POP UP */}
                  <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 rounded-t-[2rem] shrink-0">
                      <div>
                          <h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Opsi Detail Pesanan</h3>
                          <p className="text-xs sm:text-sm font-bold text-gray-500 mt-1">Pilih sesuai request pelanggan</p>
                      </div>
                      <button onClick={() => setIsOptionModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full border border-gray-200 shadow-sm transition-colors active:scale-90">
                          <X size={24} />
                      </button>
                  </div>
                  
                  {/* BODY POP UP (SCROLLABLE) */}
                  <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
                          
                          {/* KOLOM KIRI */}
                          <div className="space-y-6">
                              {/* Makan Sini / Bungkus */}
                              <div>
                                  <p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">1</div> Tipe Pesanan</p>
                                  <div className="grid grid-cols-2 gap-3">
                                      {['Makan Sini', 'Bungkus'].map(opt => (
                                          <button key={opt} onClick={() => setOrderType(opt)} className={`py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg transition-all border-2 active:scale-95 ${orderType === opt ? 'border-blue-600 bg-blue-600 text-white shadow-md transform scale-[1.02]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>
                                              {opt}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              
                              {/* Opsi Kol - Vertikal Layout */}
                              <div>
                                  <p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px]">2</div> Opsi Kol</p>
                                  <div className="flex flex-col gap-2 sm:gap-3">
                                      {['Tidak Pake Kol', 'Pake Kol Biasa', 'Pake Kol Goreng'].map(opt => (
                                          <button key={opt} onClick={() => setCabbageOption(opt)} className={`py-3 px-4 rounded-xl font-black text-sm transition-all border-2 active:scale-95 flex items-center justify-center text-center gap-1 ${cabbageOption === opt ? 'border-gray-900 bg-gray-900 text-white shadow-md transform scale-[1.01]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>
                                              <span>{opt}</span>
                                              {cabbageOption === opt && <CheckCircle2 size={16} className="text-white" />}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                          </div>
                          
                          {/* KOLOM KANAN */}
                          <div className="space-y-6 flex flex-col">
                              {/* Opsi Sambal */}
                              <div>
                                  <p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px]">3</div> Opsi Sambal</p>
                                  <div className="grid grid-cols-2 gap-3">
                                      {['Tidak Pake Sambal', 'Pake Semua', 'Sambal Merah Saja', 'Sambal Ijo Saja'].map(opt => (
                                          <button key={opt} onClick={() => setSambalOption(opt)} className={`py-3 sm:py-4 rounded-xl font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${sambalOption === opt ? 'border-red-500 bg-red-500 text-white shadow-md transform scale-[1.02]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>
                                              {opt}
                                          </button>
                                      ))}
                                  </div>
                              </div>
                              
                              {/* Catatan Khusus */}
                              <div className="flex-1 flex flex-col min-h-[100px]">
                                  <p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px]">4</div> Catatan Khusus <span className="text-[10px] font-bold capitalize text-gray-400">(Opsional)</span></p>
                                  <textarea 
                                      placeholder="Ketik request tambahan di sini (misal: minta dibungkus pisah, ayam paha besar, dll)..." 
                                      className="w-full flex-1 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-gray-900 focus:shadow-inner resize-none transition-all placeholder:text-gray-400" 
                                      value={orderNote} 
                                      onChange={e => setOrderNote(e.target.value)}
                                      onKeyDown={e => { 
                                          if (e.key === 'Enter' && !e.shiftKey) { 
                                              e.preventDefault(); 
                                              setIsOptionModalOpen(false); 
                                          } 
                                      }}>
                                  </textarea>                                  
                              </div>
                          </div>

                      </div>
                  </div>

                  {/* FOOTER POP UP (TOMBOL BESAR BAWAH) */}
                  <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/80 rounded-b-[2rem] shrink-0">
                      <button onClick={() => setIsOptionModalOpen(false)} className="w-full py-4 sm:py-5 bg-gray-900 text-white font-black text-lg sm:text-xl rounded-2xl hover:bg-black shadow-lg active:scale-[0.98] transition-all tracking-wider flex items-center justify-center gap-3 border-b-4 border-gray-950">
                          <CheckCircle size={28} className="text-green-400" />
                          SIMPAN OPSI & LANJUTKAN
                      </button>
                  </div>
              </div>
          </div>
      )}

{/* ================================================================= */}
      {/* HEADER BAR (BISA BUKA TUTUP UNTUK HEMAT LAYAR, KECUALI MODE CEPAT) */}
      {/* ================================================================= */}
      {activeTab !== 'mode_cepat' && (
        <>
{/* TOMBOL MUNCULIN NAVBAR (Dipindah ke Pojok Kiri Bawah biar aman dari Antrian) */}
          {!isNavOpen && (
            <button 
              onClick={() => setIsNavOpen(true)} 
              className="fixed bottom-6 right-6 bg-gray-900 text-white px-5 py-3 rounded-full font-black text-sm shadow-[0_10px_25px_rgba(0,0,0,0.4)] z-[100] flex items-center gap-2 hover:bg-black active:scale-95 transition-all border border-gray-700"
            >
              <Menu size={18} /> BUKA MENU
            </button>
          )}
          
          {/* NAVBAR UTAMA YANG BISA HIDE/SHOW */}
          {isNavOpen && (
            <div className="bg-white px-6 py-4 flex flex-col xl:flex-row justify-between items-center border-b border-gray-200 shrink-0 transition-all duration-300">
              <div className="flex justify-between w-full xl:w-auto items-center mb-4 xl:mb-0">
                <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full animate-pulse ${branchInfo.brand === 'minang' ? 'bg-red-500' : 'bg-green-500'}`}></div><h1 className="text-xl font-black text-gray-900 tracking-tight">{branchInfo.name}</h1></div>
                {/* Tombol Tutup Navbar versi Mobile */}
                <button onClick={() => setIsNavOpen(false)} className="xl:hidden p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 active:scale-95 flex items-center gap-1 font-bold text-xs"><ChevronUp size={16} /> Tutup</button>
              </div>
              <div className="flex items-center flex-wrap gap-2 justify-center">
                
                {/* TOMBOL SOS DARURAT WA */}
                <button onClick={handleEmergencySystem} className="px-3 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 font-black text-xs shadow-md active:scale-95">
                  <AlertCircle size={14} /> Lapor Masalah!
                </button>
                
                <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>

                <button onClick={connectBluetoothPrinter} className={`px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors ${btDevice ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700 hover:bg-orange-200'}`}>
                  <Printer size={14} /> {btDevice ? 'Printer Konek' : 'Konek Printer'}
                </button>
                <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
                <button onClick={refreshData} disabled={isFetching} className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 font-bold text-xs disabled:opacity-50"><RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /> Refresh</button>
                <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"></div>
                <button onClick={toggleFullscreen} className="px-3 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors font-bold text-xs hidden sm:block">{isFullscreen ? 'Kecilkan' : 'Perbesar'}</button>
                <button onClick={() => setActiveTab('penjualan')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'penjualan' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>Penjualan</button>
                <button onClick={() => { setActiveTab('mode_cepat'); setIsNavOpen(true); }} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${activeTab === 'mode_cepat' ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'}`}>⚡ Mode Cepat</button>
                <button onClick={() => setActiveTab('pengeluaran')} className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'pengeluaran' ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-200'}`}>Beli Bahan</button>          
                <button onClick={onLogout} className="ml-0 sm:ml-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"><LogOut size={16}/></button>

                {/* Tombol Tutup Navbar versi Desktop */}
                <div className="w-px h-6 bg-gray-300 mx-1 hidden xl:block"></div>
                <button onClick={() => setIsNavOpen(false)} className="hidden xl:flex px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-bold text-xs items-center gap-1 active:scale-95">
                  <ChevronUp size={14} /> Sembunyikan Menu
                </button>

              </div>
            </div>
          )}
        </>
      )}

{activeTab === 'mode_cepat' ? (
          // =================================================================
          // FULL UI: MODE CEPAT PENJUALAN (OPTIMIZED FOR 11 INCH TABLET)
          // =================================================================
          <div className="flex-1 flex h-full w-full overflow-hidden bg-gray-100 relative">
             
             {/* POP-UP CHECKOUT INSTAN BUAT PESANAN PARKIR */}
             {fastCheckoutModal && (
                <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-white rounded-[2rem] p-6 shadow-2xl max-w-lg w-full border border-gray-100 animate-in zoom-in-95 flex flex-col">
                         <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
                              <div>
                                  <h3 className="text-2xl font-black text-gray-900">{fastCheckoutModal.queue.split(' (')[0]}</h3>
                                  <p className="text-xs font-bold text-gray-500 mt-1">Total Tagihan: <span className="text-orange-600 font-black">{formatRupiah(fastCheckoutModal.total)}</span></p>
                              </div>
                              <button onClick={() => setFastCheckoutModal(null)} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors active:scale-95"><X size={24}/></button>
                         </div>
                         
                         <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 max-h-48 overflow-y-auto">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detail Menu Pesanan:</p>
                              <div className="flex flex-col gap-2">
                                   {fastCheckoutModal.items.split(',').map((i, idx) => {
                                        const str = i.trim();
                                        if(str.startsWith('**') || str.startsWith('++')) return null;
                                        const cleanName = str.split('::')[0].trim();
                                        return <span key={idx} className="text-sm font-bold text-gray-800 leading-snug border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">{cleanName}</span>;
                                   }).filter(i => i)}
                              </div>
                         </div>

                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Selesaikan Pembayaran</p>
                         <div className="grid grid-cols-3 gap-3">
                              <button onClick={async () => { await markAsPaid(fastCheckoutModal.id, 'Cash'); setFastCheckoutModal(null); }} className="py-4 bg-gray-900 text-white hover:bg-black rounded-xl font-black text-lg transition-all active:scale-95 shadow-lg border-b-4 border-gray-950 flex flex-col items-center"><Wallet size={24} className="mb-1 opacity-80"/>CASH</button>
                              <button onClick={async () => { await markAsPaid(fastCheckoutModal.id, 'BCA'); setFastCheckoutModal(null); }} className="py-4 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-black text-lg transition-all active:scale-95 shadow-sm flex flex-col items-center"><CreditCard size={24} className="mb-1 opacity-80"/>BCA</button>
                              <button onClick={async () => { await markAsPaid(fastCheckoutModal.id, 'QRIS'); setFastCheckoutModal(null); }} className="py-4 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl font-black text-lg transition-all active:scale-95 shadow-sm flex flex-col items-center">QRIS</button>
                         </div>
                    </div>
                </div>
             )}

             {/* KIRI 70%: AREA PARKIRAN & GRID MENU */}
             <div className="w-[70%] flex flex-col h-full overflow-hidden relative">
                 
{/* BARIS ATAS: DAFTAR PARKIRAN (SCROLL HORIZONTAL AMAN) */}
                 <div className="bg-white p-3 border-b border-gray-200 flex gap-3 overflow-x-auto shrink-0 shadow-sm items-center h-[130px] scrollbar-hide">
                     
                     {/* TOMBOL KEMBALI KE KASIR BIASA (NEW) */}
                     <button onClick={() => setActiveTab('penjualan')} className="bg-gray-900 text-white font-black text-xs px-2 py-2 rounded-2xl border-b-4 border-gray-950 flex flex-col items-center justify-center shrink-0 h-full shadow-lg active:scale-95 transition-all w-[100px] hover:bg-black group">
                         <ArrowLeft size={28} className="mb-1 text-gray-300 group-hover:-translate-x-1 transition-transform"/> KASIR<br/>BIASA
                     </button>

                     {/* TAHAN PESANAN */}
                     <div className="bg-orange-50 text-orange-600 font-black text-xs px-4 py-2 rounded-2xl border border-orange-200 flex flex-col items-center justify-center shrink-0 h-full shadow-inner text-center w-[100px]">
                         <Clock size={28} className="mb-1"/> TAHAN<br/>PESANAN
                     </div>
                     
                     {employeeLocalOrders.map(order => {
                          const cleanItems = order.items.split(',').map(i => {
                              const str = i.trim();
                              if(str.startsWith('**') || str.startsWith('++')) return null;
                              return str.split('::')[0].trim(); 
                          }).filter(i => i).join(', ');

                          return (
                             <button key={order.id} onClick={() => setFastCheckoutModal(order)} className="bg-white border-2 border-gray-200 hover:border-orange-500 hover:shadow-md p-3 rounded-2xl shrink-0 text-left w-[260px] transition-all h-full flex flex-col group relative overflow-hidden active:scale-[0.98]">
                                 <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400 group-hover:bg-orange-600 transition-colors"></div>
                                 <div className="flex justify-between items-start mb-2 ml-2">
                                     <span className="font-black text-gray-900 text-lg leading-none">{order.queue.split(' (')[0]}</span>
                                     <span className="font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 text-xs shadow-sm">{formatRupiah(order.total)}</span>
                                 </div>
                                 <p className="text-xs font-bold text-gray-500 ml-2 line-clamp-2 leading-relaxed">{cleanItems}</p>
                                 
                                 <div className="mt-auto ml-2">
                                     <span className="text-[10px] font-black text-white bg-gray-900 px-2.5 py-1 rounded-md shadow-sm group-hover:bg-orange-500 transition-colors">KLIK BAYAR</span>
                                 </div>
                             </button>
                          )
                     })}
                     {employeeLocalOrders.length === 0 && <div className="text-xs font-bold text-gray-400 italic px-6 flex items-center h-full">Belum ada pesanan yang ditahan...</div>}
                 </div>
                 
                 {/* AREA BAWAH KIRI: GRID MENU RAKSASA YANG DIPERHALUS */}
                 <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-gray-100 pb-24">
                     
                      {/* HERO SECTION: BEST SELLER */}
                      <div className="mb-5">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div> BEST SELLER (1 KLIK)</p>
                          <div className="grid grid-cols-2 gap-3 lg:gap-4">
                              {ACTIVE_MENU_LIST.filter(m => m.id === 'paket-ayam' || m.id === 'paket-lele' || m.id === 'pkt-ayamgoreng' || m.id === 'pkt-lele-goreng').map(item => {
                                  const isHabis = item.stock <= 0 && !['nasi', 'usus', 'sambal'].includes(item.id);                                 
                                  return (
                                      <button key={item.id} onClick={() => handleFastModeClick(item)} disabled={isHabis} className={`relative p-4 lg:p-5 rounded-3xl border-2 font-black flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-[0.96] transition-all h-32 lg:h-36 ${isHabis ? 'bg-gray-200 border-gray-300 text-gray-400 grayscale cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900'}`}>
                                          <span className="leading-tight px-2 z-10 text-xl lg:text-2xl tracking-tight">{item.name}</span>
                                          {isHabis ? (
                                              <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] bg-red-500 text-white px-3 py-1 rounded-md shadow-sm tracking-widest">HABIS</span>
                                          ) : (
                                              <span className="mt-2 text-sm opacity-80 font-bold bg-white/60 px-3 py-0.5 rounded-full">{formatRupiah(item.price)}</span>
                                          )}
                                      </button>
                                  );
                              })}
                          </div>
                      </div>

                      {/* SUB SECTION: MENU LAINNYA */}
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">MENU SATUAN & MINUMAN</p>
                          <div className="grid grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                              {ACTIVE_MENU_LIST.filter(m => m.id !== 'paket-ayam' && m.id !== 'paket-lele' && m.id !== 'pkt-ayamgoreng' && m.id !== 'pkt-lele-goreng').map(item => {
                                  const isHabis = item.stock <= 0 && !['nasi', 'usus', 'sambal'].includes(item.id);                                 
                                  let btnColor = "bg-white hover:bg-gray-50 border-gray-200 text-gray-800";
                                  if (item.category === 'Paketan') btnColor = "bg-red-50 hover:bg-red-100 border-red-200 text-red-900";
                                  else if (item.category === 'Lainnya') btnColor = "bg-green-50 hover:bg-green-100 border-green-200 text-green-900";

                                  return (
                                      <button key={item.id} onClick={() => handleFastModeClick(item)} disabled={isHabis} className={`relative p-3 rounded-2xl border-2 font-black flex flex-col items-center justify-center text-center shadow-sm active:scale-[0.96] transition-transform h-24 ${isHabis ? 'bg-gray-200 border-gray-300 text-gray-400 grayscale cursor-not-allowed' : btnColor}`}>
                                          <span className="leading-tight px-1 z-10 text-sm">{item.name}</span>
                                          {isHabis && <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] bg-red-500 text-white px-2 py-0.5 rounded shadow-sm tracking-widest">HABIS</span>}
                                          
                                          {item.id === 'nasi' && !isHabis && <span className="absolute top-2 right-2 text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold border border-yellow-200 shadow-sm">Porsi</span>}
                                          {['usus', 'sambal'].includes(item.id) && !isHabis && <span className="absolute top-2 right-2 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200 shadow-sm">Ada</span>}
                                      </button>
                                  );
                              })}                              
                          </div>
                      </div>

                 </div>
             </div>

             {/* KANAN 30%: KERANJANG & CHECKOUT (ABSOLUTE / TEMBUS KE ATAS) */}
             <div className="absolute top-0 right-0 h-full w-[30%] min-w-[300px] max-w-[350px] bg-white flex flex-col shadow-[-15px_0_30px_rgba(0,0,0,0.08)] z-40 border-l border-gray-200">
                  <div className="p-4 bg-gray-900 text-white flex justify-between items-center shrink-0 border-b border-gray-950">
                      <span className="font-black text-base tracking-wider">ANTRIAN: {formatQueue(currentQueueNumber)}</span>
                      {totalCartPrice > 0 && <button onClick={() => setCart({})} className="bg-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/40 p-2 rounded-lg transition-colors"><Trash2 size={18}/></button>}
                  </div>

                  {/* LIST CART */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
                      {Object.keys(cart).length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-70">
                              <ShoppingBag size={48} className="mb-3"/>
                              <p className="text-sm font-bold text-center">Keranjang Cepat<br/>Masih Kosong</p>
                          </div>
                      ) : (
                          Object.values(cart).map(item => (
                              <div key={item.cartKey} className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-3 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group gap-2">
                                  <div className="flex-1 leading-tight pr-2 z-10">
                                      <p className="font-black text-gray-900 text-sm mb-1">{item.name}</p>
                                      <p className="text-xs font-bold text-gray-400">{formatRupiah(item.price * item.qty)}</p>
                                  </div>
                                  <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-1 shadow-inner z-10 shrink-0 w-full xl:w-auto justify-between xl:justify-start">
                                      <button onClick={() => decreaseQty(item.cartKey)} className="w-8 h-8 rounded-lg bg-white text-red-500 hover:bg-red-50 hover:text-red-600 font-black text-xl shadow-sm flex items-center justify-center transition-colors active:scale-90">-</button>
                                      <span className="font-black text-gray-900 w-5 text-center text-lg">{item.qty}</span>
                                      <button onClick={() => addToCart(item, item.itemOptions)} className="w-8 h-8 rounded-lg bg-gray-900 hover:bg-black text-white font-black text-xl shadow-sm flex items-center justify-center transition-colors active:scale-90">+</button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>

                  {/* CHECKOUT AREA BAWAH */}
                  <div className="p-4 sm:p-5 bg-white border-t border-gray-200 shrink-0 shadow-[0_-15px_30px_rgba(0,0,0,0.06)] relative z-20">
                      <div className="flex justify-between items-end mb-4">
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Harga</span>
                          <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter leading-none">{formatRupiah(totalCartPrice)}</span>
                      </div>

                      <button onClick={() => executeFastSale('Cash', true)} disabled={totalCartPrice === 0 || isSubmitting} className="w-full py-4 mb-3 bg-orange-50 hover:bg-orange-100 text-orange-600 border-2 border-orange-200 rounded-xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
                          <Clock size={20} /> TAHAN / PARKIR
                      </button>

                      <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => executeFastSale('Cash')} disabled={totalCartPrice === 0 || isSubmitting} className="py-4 sm:py-5 bg-gray-900 text-white hover:bg-black rounded-xl font-black text-base sm:text-lg transition-all active:scale-95 disabled:opacity-50 border-b-4 border-gray-950 flex flex-col items-center justify-center leading-none shadow-lg">
                              <Wallet size={22} className="mb-1 opacity-80"/> CASH
                          </button>
                          <button onClick={() => executeFastSale('BCA')} disabled={totalCartPrice === 0 || isSubmitting} className="py-4 sm:py-5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-black text-base sm:text-lg transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center leading-none shadow-sm">
                              <CreditCard size={22} className="mb-1 opacity-80"/> BCA
                          </button>
                          <button onClick={() => executeFastSale('QRIS')} disabled={totalCartPrice === 0 || isSubmitting} className="py-4 sm:py-5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl font-black text-base sm:text-lg transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center leading-none shadow-sm">
                              QRIS
                          </button>
                      </div>
                  </div>
             </div>
          </div>
        ) : ( 
          <div className="flex-1 flex overflow-hidden">
             {/* KODE BAWAAN LU YANG ADA 3 KOLOM RESIZER (BIARKAN APA ADANYA) */}
             <div className="bg-gray-50 h-full overflow-y-auto flex flex-col" style={{ width: `${widths[0]}%` }}>          
          {activeTab === 'penjualan' ? (
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex gap-2 overflow-x-auto mb-4 pb-2 shrink-0 scrollbar-hide">                
                 {['Semua', 'Satuan', 'Paketan', 'Lainnya'].map(cat => (
                     <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${activeCategory === cat ? 'bg-gray-900 text-white scale-105' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}>{cat}</button>
                 ))}
              </div>


{/* --- AREA MENU (KASIR BIASA) --- */}
              <div className="grid grid-cols-2 gap-3 pb-20">
                {filteredMenu.map(item => {
                   const totalStok = item.stock;
                   // BYPASS NASI, USUS, SAMBAL DARI STATUS HABIS (Biar gak abu-abu/grayscale)
                   const isHabis = totalStok <= 0 && !['nasi', 'usus', 'sambal'].includes(item.id);
                   return (
                  <div key={item.id} className="relative group">
                    <button onClick={() => handleItemClick(item)} className={`w-full h-32 p-4 rounded-2xl border-2 transition-all active:scale-95 flex flex-col items-center justify-center shadow-sm ${isHabis ? 'bg-gray-100 border-red-200 grayscale-[40%]' : item.bg}`}>
                      
{/* Badge Stok Global / Penanda Khusus (Nasi, Usus, Sambal) */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {item.id === 'nasi' ? (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm bg-yellow-100 text-yellow-700 border border-yellow-200">
                                  Pilih Porsi
                              </span>
                          ) : ['usus', 'sambal'].includes(item.id) ? (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm bg-blue-100 text-blue-700 border border-blue-200">
                                  Tersedia
                              </span>
                          ) : (
                              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${isHabis ? 'bg-red-500 text-white animate-pulse' : totalStok < 10 ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                  {isHabis ? 'HABIS' : `Stok: ${totalStok}`}
                              </span>
                          )}
                      </div>

                      <span className="font-bold text-sm text-gray-900 mb-1 text-center mt-3">{item.name}</span>
                      
                      {/* Harga Nasi sengaja diumpetin karena dinamis (5rb/3rb), menu lain ditampilin */}
                      {item.id !== 'nasi' && (
                          <span className="text-xs font-black text-gray-500">{formatRupiah(item.price)}</span>
                      )}
                    </button>
                    
                    {/* TOMBOL PENSIL BUAT EDIT MASTER */}
                    <button
                        onClick={(e) => openEditMasterModal(e, item)}
                        className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white text-blue-500 hover:text-blue-700 rounded-xl shadow-md border border-blue-100 transition-colors tooltip z-10"
                        title="Ubah Nama, Harga & Stok"
                    >
                        <Settings size={16}/>
                    </button>
                  </div>
                )})}
              </div>
              </div>
                                        
          ) : (
            /* --- AREA BELANJA BAHAN --- */
            <div className="p-6">
              <h2 className="font-black text-lg text-gray-900 mb-4">Daftar Belanja Bahan</h2>
              <div className="space-y-3 mb-4">
                {bahanList.map(bahan => (
                  <div key={bahan.id} className="bg-white p-3 rounded-xl border border-gray-200 flex gap-2 items-center">
                    <div className="flex-1">{bahan.isCustom ? (<input type="text" placeholder="Nama Item..." className="w-full bg-gray-50 p-2 rounded-lg text-sm font-bold border border-gray-200 outline-none" value={bahan.name} onChange={e => updateBahan(bahan.id, 'name', e.target.value)} />) : ( <p className="text-sm font-bold text-gray-900 px-2">{bahan.name}</p> )}</div>
                    <div className="w-16"><input type="number" placeholder="Qty" min="0" className="w-full bg-gray-50 p-2 rounded-lg text-sm font-bold border border-gray-200 outline-none text-center" value={bahan.qty} onChange={e => updateBahan(bahan.id, 'qty', e.target.value)} /></div>
                    <div className="w-24 relative"><span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-bold">Rp</span><input type="number" placeholder="Harga" className="w-full bg-gray-50 p-2 pl-6 rounded-lg text-sm font-bold border border-gray-200 outline-none" value={bahan.price} onChange={e => updateBahan(bahan.id, 'price', e.target.value)} /></div>
                    {bahan.isCustom && <button onClick={() => removeCustomBahan(bahan.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>}
                  </div>
                ))}
              </div>
              <button onClick={addCustomBahan} className="w-full py-3 border-2 border-dashed border-gray-300 text-gray-500 font-bold rounded-xl hover:bg-gray-100 hover:text-gray-800 transition-colors flex items-center justify-center gap-2"><Plus size={16}/> Tambah Item Custom</button>
            </div>
          )}
        </div>

        {/* --- RESIZER --- */}
        <div className="w-1 bg-gray-200 hover:bg-gray-400 cursor-col-resize z-10" onMouseDown={() => setIsDragging(0)}></div>

        {/* --- AREA KERANJANG (CART) --- */}
        <div className="bg-white h-full flex flex-col border-x border-gray-100 relative" style={{ width: `${widths[1]}%` }}>
          {activeTab === 'penjualan' ? (
            <>
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                <span className="font-bold text-sm text-gray-700">Antrian Masuk: <span className="text-gray-900 px-2 py-1 bg-gray-200 rounded-md ml-1">{formatQueue(currentQueueNumber)}</span></span>
                {totalCartPrice > 0 && <button onClick={() => setCart({})} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">Reset</button>}
              </div>
              
<div className="flex-1 overflow-y-auto p-4 space-y-2">
                {Object.keys(cart).length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-300">
                    <ShoppingBag size={32} className="mb-2 opacity-50"/> 
                    <p className="text-xs font-bold">Belum ada pesanan</p>
                  </div>
                ) : (
                  Object.values(cart).map(item => (
                    <div key={item.cartKey} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <div className="leading-tight flex-1 pr-2">
                        <p className="font-bold text-gray-900 text-sm">{item.name}</p>
                        
                        {/* TAMPILAN JIKA ADA CATATAN KHUSUS */}
                        {item.itemOptions && (
                            <p className="text-[10px] font-black text-blue-600 mt-1 leading-tight flex flex-wrap gap-1">
                                {item.itemOptions.type !== 'Bawaan Global' && <span className="bg-blue-100 px-1 rounded">{item.itemOptions.type}</span>}
                                {item.itemOptions.cabbage !== 'Bawaan Global' && <span className="bg-blue-100 px-1 rounded">{item.itemOptions.cabbage}</span>}
                                {item.itemOptions.sambal !== 'Bawaan Global' && <span className="bg-blue-100 px-1 rounded">{item.itemOptions.sambal}</span>}
                                {item.itemOptions.note && <span className="bg-yellow-100 text-yellow-700 px-1 rounded">📝 {item.itemOptions.note}</span>}
                            </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-1.5">
                           <p className="text-xs text-gray-500 font-semibold">{formatRupiah(item.price * item.qty)}</p>
                           <button onClick={() => openEditPriceModal(item)} className="text-gray-400 hover:text-gray-900 bg-gray-200/50 hover:bg-gray-200 p-1.5 rounded transition-colors" title="Edit Harga">
                               <Pencil size={12}/>
                           </button>
                           {/* TOMBOL EDIT CATATAN ITEM */}
                           <button onClick={() => openItemOptionModal(item)} className="text-blue-400 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 p-1.5 rounded transition-colors" title="Catatan Per Item (Pisah Pesanan)">
                               <FileText size={12}/>
                           </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1 shadow-sm shrink-0 h-fit">
                        <button onClick={() => decreaseQty(item.cartKey)} className="w-6 h-6 rounded bg-gray-100 text-gray-600 font-bold">-</button>
                        <span className="font-black text-gray-900 w-5 text-center text-sm">{item.qty}</span>
                        <button onClick={() => addToCart(item, item.itemOptions)} className="w-6 h-6 rounded bg-gray-900 text-white font-bold">+</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-5 bg-white border-t border-gray-200 shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] z-10">
                              
              {/* TOMBOL POP UP OPSI PESANAN */}
              <button onClick={() => setIsOptionModalOpen(true)} className="w-full py-3 mb-4 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-black text-xs sm:text-sm transition-all border border-blue-200 flex items-center justify-center gap-2 shadow-sm">
                  <ListFilter size={16}/> OPSI PESANAN (Makan Sini, Kol, Catatan)
              </button>

              {/* Opsi Pembayaran (Tetap seperti aslinya) */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                  {['Cash', 'BCA', 'QRIS'].map(m => (<button key={m} onClick={() => setPaymentMethod(m)} className={`py-2 rounded-xl font-black text-sm transition-all border-2 ${paymentMethod === m ? 'border-gray-900 bg-gray-900 text-white shadow-md' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-300'}`}>{m}</button>))}
                </div>

                <div className="flex justify-between items-end mb-3">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Tagihan</span>
                  <span className="text-3xl font-black text-gray-900">{formatRupiah(totalCartPrice)}</span>
                </div>

                {/* SLIDE DOWN UI KHUSUS CASH */}
                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${paymentMethod === 'Cash' && totalCartPrice > 0 ? 'max-h-48 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
                   <div className="bg-gray-50 border border-gray-200 p-4 rounded-2xl space-y-3">
                      
                      <div className="flex justify-between items-center gap-4">
                         <span className="text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Bayar Uang</span>
                         <div className="relative w-full max-w-[180px]">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">Rp</span>
                            <input 
                               type="text" 
                               inputMode="numeric"
                               placeholder="0" 
                               className={`w-full pl-9 pr-3 py-2 bg-white border-2 rounded-xl font-black text-lg outline-none transition-colors text-right ${isCashInsufficient ? 'border-red-400 focus:border-red-500 text-red-600' : 'border-gray-200 focus:border-gray-900 text-gray-900'}`}
                               value={amountPaidStr} 
                               onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '');
                                  setAmountPaidStr(raw ? new Intl.NumberFormat('id-ID').format(raw) : '');
                               }} 
                            />
                         </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                         <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Kembalian</span>
                         {isCashInsufficient ? (
                            <span className="text-sm font-black text-red-500 bg-red-100 px-2 py-0.5 rounded animate-pulse">Uang Kurang!</span>
                         ) : (
                            <span className="text-xl font-black text-green-600">
                               {amountPaidNum > 0 ? formatRupiah(amountPaidNum - totalCartPrice) : 'Rp 0'}
                            </span>
                         )}
                      </div>

                   </div>
                </div>

                <div className="flex gap-2">
                  <button onClick={() => triggerSubmitSale('BELUM_BAYAR')} disabled={totalCartPrice === 0 || isSubmitting} className="flex-1 py-4 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl font-black text-sm transition-all active:scale-95 disabled:opacity-50 border border-orange-200 flex flex-col items-center justify-center leading-none">
                     <span>Belum Bayar</span>
                     <span className="text-[9px] mt-1 font-bold opacity-70 uppercase">Belum Bayar</span>
                  </button>
                  
                  {/* TOMBOL LUNAS PINTAR (Otomatis ngunci kalau uang cash kurang) */}
                  <button 
                     onClick={() => triggerSubmitSale('LUNAS')} 
                     disabled={totalCartPrice === 0 || isSubmitting || isCashInsufficient} 
                     className={`flex-[2] py-4 rounded-xl font-black text-sm transition-all shadow-lg flex flex-col items-center justify-center leading-none border-b-4 ${isCashInsufficient ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed' : 'bg-gray-900 hover:bg-black text-white border-gray-700 active:scale-95'}`}
                  >
                     <span className="text-lg">SIMPAN LUNAS</span>
                     {isCashInsufficient && <span className="text-[9px] mt-1 text-red-600 font-bold uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded-full shadow-sm">Uang Masih Kurang</span>}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col h-full bg-white">
              <div className="p-5 border-b border-gray-100 bg-gray-50 shrink-0"><h2 className="font-black text-lg text-gray-900">Total Belanja</h2></div>
              <div className="flex-1 p-5 flex flex-col justify-end overflow-y-auto">
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Catatan (Opsional)</label>
                  <textarea placeholder="Tambahkan catatan belanja..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-gray-900 resize-none h-16" value={expenseNote} onChange={e => setExpenseNote(e.target.value)}></textarea>
                </div>
                <div className="mb-6">
                   <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Pilih Pembayaran</label>
                   <div className="grid grid-cols-3 gap-2">
                      {['Cash', 'BCA', 'QRIS'].map(m => (<button key={m} onClick={() => setExpenseMethod(m)} className={`py-2 rounded-lg font-bold text-sm transition-all border-2 ${expenseMethod === m ? 'border-gray-900 bg-white text-gray-900 shadow-sm' : 'border-transparent bg-gray-200 text-gray-500'}`}>{m}</button>))}
                   </div>
                </div>
                <div className="bg-red-50 p-5 rounded-2xl border border-red-100 mb-6 shrink-0"><p className="text-sm font-bold text-red-500 uppercase tracking-widest mb-1">Estimasi Keluar</p><h3 className="text-4xl font-black text-red-600">{formatRupiah(grandTotalBahan)}</h3></div>
                <button onClick={handleSubmitExpense} disabled={grandTotalBahan === 0 || isSubmitting} className="w-full py-5 bg-gray-900 hover:bg-black text-white rounded-xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 shadow-xl shrink-0">SIMPAN PENGELUARAN</button>
              </div>
            </div>
          )}
        </div>

        <div className="w-1 bg-gray-200 hover:bg-gray-400 cursor-col-resize z-10" onMouseDown={() => setIsDragging(1)}></div>

        <div className="bg-gray-50 h-full flex flex-col relative" style={{ width: `${widths[2]}%` }}>
          {isPinModalOpen && (
            <div className="absolute top-16 right-4 bg-white p-5 rounded-3xl shadow-2xl border border-gray-200 z-50 animate-in fade-in zoom-in w-72">
              <p className="text-xs font-bold text-gray-500 mb-3 text-center uppercase tracking-widest">PIN Otorisasi Totals</p>
              <input autoFocus type="password" inputMode="numeric" maxLength="4" placeholder="••••" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-center text-3xl font-black tracking-[1em] outline-none focus:border-gray-900 mb-3" value={tempPin} onChange={e => setTempPin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePinSubmit()} />
              <div className="flex gap-2">
                <button onClick={() => setIsPinModalOpen(false)} className="px-4 py-3 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 flex-1">Batal</button>
                <button onClick={handlePinSubmit} className="px-4 py-3 bg-gray-900 text-white font-bold rounded-xl active:scale-95 flex-[2]">Buka Akses</button>
              </div>
            </div>
          )}


<div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button onClick={() => setLiveView('pemasukan')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${liveView === 'pemasukan' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Masuk</button>
              <button onClick={() => setLiveView('pengeluaran')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${liveView === 'pengeluaran' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Keluar</button>
              {/* TAB LAINNYA UNTUK LOG SISTEM */}
              <button onClick={() => setLiveView('lainnya')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${liveView === 'lainnya' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Lainnya</button>
            </div>
            
            <div className="flex items-center gap-2">
              {/* TOMBOL ICON TAPPING BARU */}
              <button onClick={() => setIsTappingModalOpen(true)} className="relative p-2 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors tooltip flex items-center gap-2 border border-orange-100" title="Pesanan Tapping / Belum Bayar">
                <Clock size={16} /> 
                <span className="text-xs font-black hidden sm:block pr-1">Tapping</span>
                {employeeLocalOrders.length > 0 && <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 border-2 border-white text-[10px] font-black text-white shadow-sm animate-bounce">{employeeLocalOrders.length}</span>}
              </button>

              <div className="w-px h-6 bg-gray-200 mx-1"></div>

              {/* <button onClick={() => { if(showTotals) setShowTotals(false); else setIsPinModalOpen(true); }} className={`p-2 rounded-lg transition-colors ${showTotals ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {showTotals ? <Eye size={16}/> : <EyeOff size={16}/>}
              </button> */}
            </div>
          </div>

          {/* <div className="p-5 shrink-0 bg-white border-b border-gray-100 relative overflow-hidden">
            {showTotals && <div className="absolute bottom-0 left-0 h-1 bg-green-500 animate-[shrink_7s_linear_forwards]"></div>}
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total {liveView === 'pemasukan' ? 'Pendapatan' : liveView === 'pengeluaran' ? 'Pengeluaran' : 'Laporan'} Hari Ini</p>
            <h2 className={`text-2xl font-black transition-colors duration-300 ${showTotals ? 'text-gray-900' : 'text-gray-300 blur-[2px]'}`}>
              {liveView === 'lainnya' ? 'Log Sistem' : (showTotals ? formatRupiah(liveView === 'pemasukan' ? totalIncomeToday : totalExpenseToday) : 'Rp 99.999.999')}
            </h2>
          </div> */}

<div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
            {liveView === 'lainnya' ? (
              <>
                {/* RENDER KHUSUS LAPORAN SISTEM (STOK HABIS, DLL) */}
                {employeeVisibleData.filter(x => x.jenisPengeluaran && x.jenisPengeluaran.includes('[LAPORAN SISTEM]')).slice().reverse().map(item => (
                    <div key={item._id} className="p-4 rounded-2xl border bg-orange-50 border-orange-200 shadow-sm relative transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest bg-orange-100 text-orange-600 border-orange-200">
                                <AlertCircle size={12}/> INFO SISTEM
                            </span>
                            <span className="text-[10px] font-bold text-gray-500 flex items-center gap-1"><Clock size={12}/> {new Date(item.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 leading-relaxed pl-1">{item.jenisPengeluaran.replace('[LAPORAN SISTEM]', '').trim()}</p>
                    </div>
                ))}
              </>
            ) : liveView === 'pemasukan' ? (
              <>
                {/* PERHATIAN: FILTER LAPORAN SISTEM DARI DAFTAR TRANSAKSI */}
                {employeeVisibleData.filter(x => x.totalPengeluaran === 0 && !(x.jenisPengeluaran && x.jenisPengeluaran.includes('[LAPORAN SISTEM]'))).slice().reverse().map((item) => {
                    const income = (item.cash||0) + (item.bca||0) + (item.gofood||0);
                    const queueLabel = item.jenisPengeluaran ? item.jenisPengeluaran.split(']')[0].replace('[', '') : 'Lunas';
                    
                    // --- LOGIKA PARSING UI BARU ---
                    const rawItemsStr = item.jenisPengeluaran ? item.jenisPengeluaran.split('] ')[1] : '';
                    const itemArray = (rawItemsStr || '').split(',').map(i => i.trim()).filter(i => i);
                    let options = []; 
                    let ordersList = []; 
                    let noteStr = '';
                    let payMethodStr = '';

                    itemArray.forEach(str => {
                        if (str.startsWith('**')) options.push(str.replace(/\*/g, '').trim());
                        else if (str.startsWith('++ CATATAN:')) noteStr = str.replace('++ CATATAN:', '').trim();
                        else if (str.startsWith('++ PAY:')) {
                            const payData = str.replace('++ PAY:', '').split('|');
                            payMethodStr = payData[0];
                        }
                        else ordersList.push(str);
                    });
                    
                    // Fallback Metode Pembayaran jika data lama tidak ada tag PAY:
                    if (!payMethodStr) {
                        if (item.cash > 0) payMethodStr = 'CASH';
                        else if (item.bca > 0) payMethodStr = 'BCA';
                        else if (item.gofood > 0) payMethodStr = 'QRIS';
                    }
                    
                    // Styling Badge Metode Pembayaran
                    let badgeColor = 'bg-gray-100 text-gray-600 border-gray-200';
                    if (payMethodStr === 'CASH') badgeColor = 'bg-gray-100 text-gray-800 border-gray-300';
                    else if (payMethodStr === 'BCA') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                    else if (payMethodStr === 'QRIS') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';
                    // ------------------------------

                    return (
                        <div key={item._id} onClick={() => setDetailModal({isOpen: true, data: item})} className="p-4 rounded-2xl border bg-white border-gray-200 shadow-sm relative cursor-pointer hover:border-gray-900 transition-all hover:shadow-md group">
                            
                            {/* Action Bar Absolute (Print & Delete) */}
                            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                                {item.printCount > 0 && <span className="text-[10px] font-bold text-gray-500 bg-gray-50 px-2 py-1 rounded-md border flex items-center gap-1"><Printer size={12}/> {item.printCount}x</span>}
                                
                                {isDeletingId === item._id ? ( 
                                    <button disabled className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-md font-bold flex items-center gap-1.5 opacity-75 cursor-wait">
                                        <Loader2 size={12} className="animate-spin" />
                                    </button> 
                                ) : deleteConfirm === item._id ? ( 
                                    <button 
                                        onClick={async (e) => { 
                                            e.stopPropagation(); 
                                            setIsDeletingId(item._id); 
                                            await onDelete(item._id); 
                                            
                                            // --- BAGIAN RESTORE STOK ---
                                            const itemsStr = item.jenisPengeluaran ? item.jenisPengeluaran.split('] ')[1] : '';
                                            if (itemsStr) {
                                                await restoreStockFromStr(branchInfo.sheetName, itemsStr);
                                            }
                                            // ---------------------------

                                            setIsDeletingId(null); 
                                            setDeleteConfirm(null); 
                                        }} 
                                        className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-3 py-1 rounded-md font-black animate-in zoom-in shadow-sm transition-colors"
                                    >
                                        Yakin Batal?
                                    </button> 
                                ) : ( 
                                    <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item._id); }} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                                        <Trash2 size={16}/>
                                    </button> 
                                )}
                            </div>

                            {/* Header: Antrian & Waktu */}
                            <div className="pr-24 mb-3 flex items-center gap-2">
                                <span className="font-black text-gray-900 text-sm bg-gray-100 px-2.5 py-1 rounded-lg border border-gray-200">[{queueLabel}]</span>
                                <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Clock size={12}/> {new Date(item.createdAt).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                            </div>
                            
                            {/* Body: Badge Opsi Tambahan & List Pesanan */}
                            <div className="mb-4 pr-4">
                                {options.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mb-2">
                                        {options.map((opt, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-wider rounded border border-blue-100">{opt}</span>
                                        ))}
                                    </div>
                                )}
                                
                                <p className="text-sm text-gray-700 font-bold leading-relaxed line-clamp-2">
                                    {ordersList.join(', ') || 'Penjualan Kasir'}
                                </p>
                                
                                {noteStr && (
                                    <p className="text-xs font-bold text-orange-600 mt-1.5 flex items-center gap-1"><FileText size={12}/> {noteStr}</p>
                                )}
                            </div>

                            {/* Footer: Pembayaran & Total Nominal */}
                            <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border ${badgeColor}`}>
                                    {payMethodStr}
                                </span>
                                <span className="font-black text-lg text-green-600">{formatRupiah(income)}</span>
                            </div>
                        </div>
                    )
                })}
              </>
            ) : (              
              groupedExpenseHistory.map((group) => {                
                 const firstItemJenis = group.items[0].jenisPengeluaran || '';
                 const noteMatch = firstItemJenis.split('| NOTE: ')[1];
                 const note = noteMatch ? noteMatch.trim() : '';

                 return (
                   <div key={group.grpId} className={group.items.length > 1 ? "p-2 bg-gray-200/50 rounded-2xl border-l-4 border-gray-300 space-y-2 relative" : "space-y-3"}>
                      {note && group.items.length > 1 && (
                         <div className="flex items-start gap-1.5 px-2 pb-1">
                            <FileText size={14} className="text-gray-500 mt-0.5"/>
                            <p className="text-xs font-bold text-gray-600 italic">Catatan: {note}</p>
                         </div>
                      )}
                      {group.items.map(item => {
                         let cleanJenis = (item.jenisPengeluaran || '').split('| NOTE: ')[0].replace(/#GRP\d+#/g, '').trim();
                         let metode = '-'; let badgeColor = 'bg-gray-100 text-gray-600 border-gray-200';
                         if (cleanJenis.includes('[CASH]')) { metode = 'CASH'; cleanJenis = cleanJenis.replace('[CASH]', '').trim(); badgeColor = 'bg-gray-100 text-gray-800 border-gray-300'; }
                         else if (cleanJenis.includes('[BCA]')) { metode = 'BCA'; cleanJenis = cleanJenis.replace('[BCA]', '').trim(); badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'; }
                         else if (cleanJenis.includes('[QRIS]')) { metode = 'QRIS'; cleanJenis = cleanJenis.replace('[QRIS]', '').trim(); badgeColor = 'bg-purple-50 text-purple-700 border-purple-200'; }

                         return (
                            <div key={item._id} className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm relative">
                              <div className="absolute top-3 right-3">
                                 {isDeletingId === item._id ? ( <button disabled className="bg-red-500 text-white text-[10px] px-2 py-1 rounded font-bold flex items-center gap-1.5 opacity-75 cursor-wait"><Loader2 size={12} className="animate-spin" /> Menghapus...</button> ) : deleteConfirm === item._id ? ( <button onClick={async (e) => { e.stopPropagation(); setIsDeletingId(item._id); await onDelete(item._id); setIsDeletingId(null); setDeleteConfirm(null); }} className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-2 py-1 rounded font-bold animate-in zoom-in shadow-sm transition-colors">Yakin Hapus?</button> ) : ( <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item._id); }} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button> )}
                              </div>
                              <div className="pr-10 mb-1 flex items-center gap-2">
                                <span className={`text-[10px] font-black border uppercase tracking-widest px-1.5 py-0.5 rounded ${badgeColor}`}>{metode}</span>
                                <span className="font-bold text-gray-900 text-sm">{cleanJenis}</span>
                              </div>
                              <p className="text-[10px] font-bold text-red-500 uppercase mb-2">Pengeluaran</p>
                              <span className="font-black text-gray-900 text-sm">{formatRupiah(item.totalPengeluaran)}</span>
                              
                              {note && group.items.length === 1 && (
                                 <div className="mt-3 pt-2 border-t border-gray-100 flex items-start gap-1.5">
                                    <FileText size={12} className="text-gray-400 mt-0.5"/><p className="text-xs text-gray-500 italic font-medium">{note}</p>
                                 </div>
                              )}
                            </div>
                         )
                      })}
                   </div>
                 )
              })
            )}
          </div>
        </div>
      </div>
      )}
      <style dangerouslySetInnerHTML={{__html: ` @keyframes shrink { from { width: 100%; } to { width: 0%; } } `}} />
    </div>
  );
}

// ==========================================
// 3. DASHBOARD ADMIN FULL (SMOOTH SIDEBAR DRAWER + EMERGENCY ALERT)
// ==========================================
function AdminDashboardView({ rawData, isFetching, formatRupiah, onLogout, refreshData, onDelete, onBulkDelete, branches, appSettings }) {
  const [activeTab, setActiveTab] = useState('penjualan');
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);
  const [showOpExpenseForm, setShowOpExpenseForm] = useState(false);
  const [filterCabang, setFilterCabang] = useState('Semua');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // STATE PROGRESS MODAL DIUBAH JADI MENYIMPAN TANGGAL (FULL SCREEN MODE)
  const [progressDate, setProgressDate] = useState(null); 

  // Listener buat nangkep klik tombol Progress Live (Bisa dari Global atau Harian)
  useEffect(() => {
      const handleOpenProgress = (e) => {
          const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
          // Jika e.detail ada isinya (klik dari harian), pakai tanggal itu. Jika kosong, pakai hari ini.
          setProgressDate(e.detail || todayStr);
      };
      window.addEventListener('openProgressModal', handleOpenProgress);
      return () => window.removeEventListener('openProgressModal', handleOpenProgress);
  }, []);

// STATE KHUSUS EMERGENCY & AUDIO ALARM
  const [emergencyAlerts, setEmergencyAlerts] = useState([]);
  const audioAlarmRef = useRef(null);

  // Inisialisasi Audio (Aman untuk performa, tidak bikin lemot)
  useEffect(() => {
      // Pake suara alarm sirine standar
      audioAlarmRef.current = new Audio('https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg');
      audioAlarmRef.current.loop = true; // Bunyi terus sampai admin sadar
  }, []);

  // 1. FUNGSI PERIZINAN NOTIFIKASI CHROME
  const requestNotificationPermission = () => {
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          console.log("Izin notifikasi diberikan!");
        }
      });
    }
  };

  // 2. FUNGSI TRIGGER NOTIFIKASI HP & LAPTOP
  const triggerPushNotification = (branchName) => {
    if (Notification.permission === "granted") {
      new Notification("🚨 DARURAT KASIR!", {
        body: `Cabang ${branchName} butuh bantuan segera!`,
        icon: "https://cdn-icons-png.flaticon.com/512/564/564619.png", // Icon Warning
        tag: "emergency-alert"
      });
    }
  };

  // 3. FUNGSI CEK EMERGENCY DARI DATABASE (SMART SYNC)
  const fetchEmergency = async () => {
    try {
      const res = await fetch(`https://backend-mm-v2.vercel.app/api/emergency/active`);
      const data = await res.json();
      
      // Jika ada laporan baru yang belum ada di state sebelumnya
      if (data.length > emergencyAlerts.length) {
        triggerPushNotification(data[0].sheet);
        
        // PAKSA BUNYI ALARM DI HP / LAPTOP
        if (audioAlarmRef.current) {
            audioAlarmRef.current.play().catch(e => console.log("Autoplay ditahan sistem HP. Butuh admin tap layar sekali."));
        }
      }
      setEmergencyAlerts(data);
    } catch (e) {}
  };

  // 4. FUNGSI SELESAIKAN MASALAH (HAPUS ALERT & MATIKAN SUARA)
  const solveEmergency = async (id) => {
    try {
      await fetch(`https://backend-mm-v2.vercel.app/api/emergency/solve/${id}`, { method: 'PUT' });
      
      // MATIKAN ALARM KALAU MASALAH SELESAI
      if (audioAlarmRef.current) {
          audioAlarmRef.current.pause();
          audioAlarmRef.current.currentTime = 0;
      }
      fetchEmergency(); // Refresh list alert
    } catch (e) {}
  };

  // 5. AUTO-WAKE & POLLING SYSTEM (ANTI FREEZE DI HP)
  useEffect(() => {
    requestNotificationPermission();
    fetchEmergency(); // Tarik data pas pertama render

    // Polling normal tiap 15 detik kalau layar nyala
    const interval = setInterval(fetchEmergency, 15000); 

    // FITUR BYPASS HP TIDUR: Kalau HP abis didiemin/layar mati, 
    // pas layar nyala, detik itu juga langsung tembak API!
    const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
            fetchEmergency();
        }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [emergencyAlerts.length]);
  
const filteredRawData = useMemo(() => {
     // Sembunyikan data dapur dari Admin Besar
     let data = rawData.filter(item => !(item.jenisPengeluaran && item.jenisPengeluaran.includes('[UNPAID]')));
     
     if (filterCabang === 'Semua') {
         // KUNCI: Sembunyikan Aeon & Villa MG dari view Global
         return data.filter(item => item.sheet !== 'MM Aeon & Villa MG');
     }
     return data.filter(item => item.sheet === filterCabang);
  }, [rawData, filterCabang]);

  const activeMonthData = useMemo(() => {
    if (!selectedMonthKey) return null;
    const [targetMonth, targetYear] = selectedMonthKey.split('-');
    
    const items = filteredRawData.filter(item => {
      if (!item.tanggal || item.tanggal.includes('*')) return false;
      const parts = item.tanggal.replace(/,/g, '').trim().split(/\s+/);
      const mStr = parts.length === 4 ? parts[2] : parts[1];
      const yStr = parts.length === 4 ? parts[3] : parts[2];
      return mStr.toLowerCase() === targetMonth.toLowerCase() && yStr === targetYear;
    });

    const validItems = items.filter(i => !i.isDeleted);
    const income = validItems.reduce((sum, i) => sum + (i.cash||0)+(i.bca||0)+(i.gofood||0), 0);
    const expense = validItems.reduce((sum, i) => sum + (i.totalPengeluaran||0), 0);
    
    return { month: targetMonth, year: targetYear, items, income, expense };
  }, [filteredRawData, selectedMonthKey]);
  
  if (isFetching && !rawData.length) return ( 
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-gray-400 mb-4" size={48} />
      <p className="text-gray-600 font-bold animate-pulse">Memuat Data...</p>
    </div> 
  );

  const handleTabChange = (tab) => {
     setActiveTab(tab); setSelectedMonthKey(null); setShowOpExpenseForm(false); setIsSidebarOpen(false); setProgressDate(null); // Auto Hide Sidebar
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex overflow-hidden">
      
      {/* OVERLAY EMERGENCY (MODAL YANG GAK BISA DI-SKIP) */}
      {emergencyAlerts.length > 0 && (
        <div className="fixed inset-0 bg-red-600/20 backdrop-blur-md z-[9999] flex flex-col items-center justify-center p-4 animate-in fade-in">
           <div className="bg-white rounded-[2.5rem] shadow-[0_0_100px_rgba(220,38,38,0.5)] border-4 border-red-600 max-w-md w-full p-8 text-center animate-bounce-short">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                 <AlertCircle size={64} className="text-red-600 animate-pulse" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-2">PANGGILAN DARURAT!</h2>
              <p className="text-gray-500 font-bold mb-6">Kasir butuh bantuan segera di:</p>
              
              <div className="space-y-3 mb-8">
                {emergencyAlerts.map(alert => (
                  <div key={alert._id} className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl">
                     <p className="text-xl font-black text-red-700">{alert.sheet}</p>
                     <p className="text-xs font-bold text-red-400 mt-1">Laporan Masuk: {alert.timestamp}</p>
                     <button 
                        onClick={() => solveEmergency(alert._id)}
                        className="mt-4 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2"
                     >
                        <CheckCircle size={18}/> MASALAH SELESAI
                     </button>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 font-bold italic uppercase tracking-widest">Alert tidak akan hilang sampai tombol SELESAI diklik.</p>
           </div>
        </div>
      )}

      {/* SIDEBAR DENGAN AUTO HIDE SMOOTH */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform duration-500 ease-in-out flex flex-col shadow-2xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white"><Store size={20}/></div>
            <div><h2 className="font-black text-gray-900 leading-tight">Admin<br/>Portal</h2></div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"><X size={20}/></button>
        </div>
        
        <div className="p-4 border-b border-gray-100 bg-gray-50 shrink-0">
           <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Filter Cabang Global</label>
           <select className="w-full bg-white border border-gray-200 text-sm font-bold text-gray-700 p-3 rounded-xl outline-none focus:border-gray-900 transition-colors" value={filterCabang} onChange={(e) => {setFilterCabang(e.target.value); setIsSidebarOpen(false);}}>
              <option value="Semua">Semua Cabang (Global)</option>
              {branches?.map(b => (
                 <option key={b.id || b.sheetName} value={b.sheetName}>{b.name}</option>
              ))}
           </select>
        </div>

        <div className="p-4 shrink-0">
          <button onClick={() => {refreshData(); setIsSidebarOpen(false);}} disabled={isFetching} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl font-bold text-sm transition-colors disabled:opacity-50">
            <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> Sinkronisasi Data
          </button>
        </div>
        
        <div className="flex-1 px-4 py-2 space-y-2 overflow-y-auto flex flex-col">
          <button onClick={() => handleTabChange('penjualan')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'penjualan' ? 'bg-gray-900 text-white shadow-md scale-100' : 'text-gray-500 hover:bg-gray-100 scale-95 hover:scale-100'}`}><TrendingUp size={18}/> Lap. Penjualan</button>
          <button onClick={() => handleTabChange('pengeluaran')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'pengeluaran' ? 'bg-gray-900 text-white shadow-md scale-100' : 'text-gray-500 hover:bg-gray-100 scale-95 hover:scale-100'}`}><TrendingDown size={18}/> Lap. Pengeluaran</button>
          <button onClick={() => handleTabChange('rutin')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'rutin' ? 'bg-gray-900 text-white shadow-md scale-100' : 'text-gray-500 hover:bg-gray-100 scale-95 hover:scale-100'}`}><CalendarClock size={18}/> Pengeluaran Rutin</button>
          <button onClick={() => handleTabChange('keuangan')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'keuangan' ? 'bg-gray-900 text-white shadow-md scale-100' : 'text-gray-500 hover:bg-gray-100 scale-95 hover:scale-100'}`}><PieChart size={18}/> Lap. Keuangan</button>
          <button onClick={() => handleTabChange('settings')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'settings' ? 'bg-gray-900 text-white shadow-md scale-100' : 'text-gray-500 hover:bg-gray-100 scale-95 hover:scale-100'}`}><Settings size={18}/> Pengaturan Sistem</button>
          <button onClick={() => handleTabChange('lainnya')} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${activeTab === 'lainnya' ? 'bg-gray-900 text-white shadow-md scale-100' : 'text-gray-500 hover:bg-gray-100 scale-95 hover:scale-100'}`}><History size={18}/> Lap. Lainnya</button>
        </div>
        
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors"><LogOut size={16}/> Keluar Portal</button>
        </div>
      </div>

      {/* OVERLAY JIKA SIDEBAR BUKA */}
      {isSidebarOpen && <div className="fixed inset-0 bg-gray-900/40 z-40 backdrop-blur-sm transition-opacity duration-500" onClick={() => setIsSidebarOpen(false)}></div>}
      
      {/* MAIN CONTENT */}
      <div className="flex-1 h-screen overflow-y-auto flex flex-col w-full relative">
        {/* HEADER ATAS */}
        <div className="bg-white p-4 flex items-center gap-4 border-b border-gray-200 sticky top-0 z-30 shadow-sm transition-all">
           <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-gray-900 hover:bg-black text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2">
             <Menu size={20}/><span className="text-sm font-bold hidden sm:block">Menu Utama</span>
           </button>
           <h2 className="text-xl font-black text-gray-900">{filterCabang === 'Semua' ? 'Analisis Global Seluruh Cabang' : `Analisis: ${filterCabang}`}</h2>
        </div>

        <div className="p-6 md:p-8 mx-auto w-full transition-all">
          {progressDate ? (
            <AdminItemProgressView 
                rawData={rawData} 
                branchInfo={{ 
                   sheetName: filterCabang === 'Semua' ? (branches[0]?.sheetName || '') : filterCabang, 
                   name: filterCabang === 'Semua' ? 'Keseluruhan Cabang' : filterCabang,
                   brand: filterCabang === 'Semua' ? branches[0]?.brand : branches.find(b => b.sheetName === filterCabang)?.brand
                }} 
                onBack={() => setProgressDate(null)} 
                formatRupiah={formatRupiah} 
                targetDate={progressDate}
            />
          ) : showOpExpenseForm ? (
            <AdminOperationalExpenseView onBack={() => setShowOpExpenseForm(false)} refreshData={refreshData} branchInfo={{ sheetName: filterCabang === 'Semua' ? (branches[0]?.sheetName || '') : filterCabang }} />
          ) : activeTab === 'settings' ? (
            <AdminSettingsView appSettings={appSettings} refreshParent={refreshData} branches={branches} />          
          ) : activeTab === 'rutin' ? (
            <AdminRecurringExpenseView formatRupiah={formatRupiah} branches={branches} refreshParent={refreshData} filterCabang={filterCabang} />
          ) : activeMonthData ? (
            <AdminMonthDetailView 
                monthData={activeMonthData} 
                tabType={activeTab} 
                onBack={() => setSelectedMonthKey(null)} 
                formatRupiah={formatRupiah} 
                onDelete={onDelete} 
                onBulkDelete={onBulkDelete} 
                filterCabang={filterCabang === 'Semua' ? 'Semua Cabang' : filterCabang} 
                isPinColumnActive={appSettings.find(s=>s.settingKey==='pin_table_column')?.isActive} 
                isMultiDeleteActive={appSettings.find(s=>s.settingKey==='multi_delete')?.isActive} 
            />
          ) : activeTab === 'keuangan' ? (
            <AdminKeuanganDashboard rawData={filteredRawData} formatRupiah={formatRupiah} branches={branches} />
          ) : activeTab === 'lainnya' ? (
            <AdminOtherReportsView 
              formatRupiah={formatRupiah} 
              filterCabang={filterCabang} 
              appSettings={appSettings} 
              refreshParent={refreshData}
            />
          ) : (
            <AdminYearlyGridView tabType={activeTab} rawData={filteredRawData} onSelectMonth={(m) => setSelectedMonthKey(`${m.month}-${m.year}`)} formatRupiah={formatRupiah} onOpenExpenseForm={() => setShowOpExpenseForm(true)} filterCabang={filterCabang === 'Semua' ? 'Semua Cabang' : filterCabang} />
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-short { animation: bounce-short 2s infinite ease-in-out; }
      `}} />
    </div>
  );
}

// ==========================================
// ADMIN SETTINGS VIEW (INOVASI EDIT CABANG)
// ==========================================
function AdminSettingsView({ appSettings, refreshParent, branches }) {
  const [loadingId, setLoadingId] = useState(null);
  const [editingSetting, setEditingSetting] = useState(null);
  const [tempBranches, setTempBranches] = useState([]);

  const toggleSetting = async (setting) => {
     setLoadingId(setting._id);
     try {
        await fetch(`${SETTINGS_URL}/${setting._id}`, {
           method: 'PUT', headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ isActive: !setting.isActive })
        });
        refreshParent();
     } catch(e) {}
     setLoadingId(null);
  };

  const openEditModal = (setting) => {
     setEditingSetting(setting);
     setTempBranches(setting.branches || []);
  };

  const toggleBranchSelection = (branchSheetName) => {
     if (tempBranches.includes(branchSheetName)) {
        setTempBranches(tempBranches.filter(b => b !== branchSheetName));
     } else {
        setTempBranches([...tempBranches, branchSheetName]);
     }
  };

  const saveConfiguration = async () => {
     setLoadingId(editingSetting._id);
     try {
        await fetch(`${SETTINGS_URL}/${editingSetting._id}`, {
           method: 'PUT', headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ branches: tempBranches })
        });
        setEditingSetting(null);
        refreshParent();
     } catch(e) {}
     setLoadingId(null);
  };

  return (
     <div className="animate-in fade-in duration-500 max-w-4xl mx-auto">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Pengaturan Sistem Inovatif</h1>
        <p className="text-sm font-bold text-gray-500 mb-8">Atur fungsionalitas aplikasi dan filter di cabang mana saja fitur tersebut aktif.</p>
        
        {editingSetting && (
           <div className="fixed inset-0 bg-gray-900/60 z-[100] flex items-center justify-center backdrop-blur-sm px-4">
              <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
                 <h3 className="text-xl font-black text-gray-900 mb-2">Konfigurasi Fitur</h3>
                 <p className="text-sm font-bold text-gray-500 mb-6">{editingSetting.name}</p>
                 
                 <div className="space-y-3 mb-8 max-h-60 overflow-y-auto pr-2">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Terapkan Pada Cabang:</p>
                    {branches.map(b => {
                       const isSelected = tempBranches.includes(b.sheetName);
                       return (
                          <button key={b.id} onClick={() => toggleBranchSelection(b.sheetName)} className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isSelected ? 'border-gray-900 bg-gray-50' : 'border-gray-100 hover:border-gray-300'}`}>
                             <span className="font-bold text-gray-700">{b.name}</span>
                             {isSelected ? <CheckSquare className="text-gray-900" size={20}/> : <Square className="text-gray-300" size={20}/>}
                          </button>
                       )
                    })}
                    <p className="text-[10px] text-gray-400 font-bold mt-2">*Jika tidak ada cabang yang dipilih, fitur akan berlaku secara global (Semua Cabang).</p>
                 </div>
                 
                 <div className="flex gap-3">
                    <button onClick={() => setEditingSetting(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200">Batal</button>
                    <button onClick={saveConfiguration} disabled={loadingId === editingSetting._id} className="flex-[2] py-3 bg-gray-900 text-white font-black rounded-xl hover:bg-black flex items-center justify-center gap-2">
                       {loadingId === editingSetting._id ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>} Simpan Konfigurasi
                    </button>
                 </div>
              </div>
           </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {appSettings.map(setting => (
              <div key={setting._id} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-between">
                 <div>
                    <div className="flex items-center justify-between mb-3">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl text-white ${setting.isActive ? 'bg-green-500 shadow-md shadow-green-200' : 'bg-gray-300'}`}>
                             {setting.settingKey === 'scramble_keypad' ? <ShieldCheck size={20}/> : <Pin size={20}/>}
                          </div>
                          <h3 className="font-black text-lg text-gray-900">{setting.name}</h3>
                       </div>
                       <button onClick={() => openEditModal(setting)} className="p-2 text-gray-400 hover:text-blue-600 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors tooltip" title="Konfigurasi Cabang">
                          <Settings size={18}/>
                       </button>
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed mb-4">{setting.description}</p>
                    
                    {setting.branches && setting.branches.length > 0 ? (
                       <div className="mb-6 flex flex-wrap gap-1">
                          <span className="text-[10px] font-bold text-gray-400 mr-1 mt-0.5">Berlaku di:</span>
                          {setting.branches.map((b, i) => <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">{b.split('-')[1]?.trim() || b}</span>)}
                       </div>
                    ) : (
                       <div className="mb-6">
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-bold">Berlaku Global (Semua)</span>
                       </div>
                    )}
                 </div>
                 
                 <div className="flex items-center justify-between border-t border-gray-100 pt-4">
                    <span className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${setting.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{setting.isActive ? 'Sedang Aktif' : 'Non-Aktif'}</span>
                    <button onClick={() => toggleSetting(setting)} disabled={loadingId === setting._id} className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 ${setting.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-gray-900 text-white hover:bg-black shadow-md'} disabled:opacity-50 flex items-center gap-2`}>
                       {loadingId === setting._id && <Loader2 size={14} className="animate-spin"/>}
                       {setting.isActive ? 'Matikan Fitur' : 'Aktifkan Fitur'}
                    </button>
                 </div>
              </div>
           ))}
        </div>
     </div>
  )
}

// ==========================================
// 3.5 ADMIN RECURRING (BIAYA RUTIN) VIEW
// ==========================================
function AdminRecurringExpenseView({ formatRupiah, branches, refreshParent, filterCabang }) {
  const [routines, setRoutines] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const INIT_FORM = { sheet: filterCabang !== 'Semua' ? filterCabang : (branches[0]?.sheetName || ''), nama: '', nominal: '', frekuensi: 'bulanan', intervalHari: '', startDate: '', endDate: '' };
  const [formData, setFormData] = useState(INIT_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [sortType, setSortBy] = useState('Semua'); 

  const fetchRoutines = async () => {
    setIsFetching(true);
    try {
       const res = await fetch(RECURRING_URL);
       const data = await res.json();
       setRoutines(data);
    } catch (e) {}
    setIsFetching(false);
  };

  useEffect(() => { fetchRoutines(); }, []);

  const handleSubmit = async (e) => {
     e.preventDefault();
     setIsSubmitting(true);
     const payload = { ...formData, nominal: Number(formData.nominal.replace(/\D/g, '')), intervalHari: Number(formData.intervalHari) || 0 };
     if (!payload.endDate) delete payload.endDate;

     try {
        await fetch(RECURRING_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        alert('Berhasil simpan data biaya rutin!');
        setShowForm(false); setFormData(INIT_FORM); fetchRoutines(); refreshParent();
     } catch (err) { alert('Gagal menyimpan'); }
     setIsSubmitting(false);
  };

  const handleDelete = async (id) => {
     if(!window.confirm("Yakin hapus pengeluaran rutin ini?")) return;
     try { await fetch(`${RECURRING_URL}/${id}`, { method: 'DELETE' }); fetchRoutines(); } catch(e) { alert("Gagal menghapus"); }
  };

  const filteredRoutines = useMemo(() => {
     let list = [...routines];
     if (filterCabang !== 'Semua') list = list.filter(r => r.sheet === filterCabang);
     if (sortType !== 'Semua') list = list.filter(r => r.frekuensi === sortType);
     return list.sort((a,b) => new Date(a.startDate) - new Date(b.startDate));
  }, [routines, filterCabang, sortType]);

// 👇 TAMBAHIN FUNGSI INI DI SINI 👇
    const getNextPaymentDate = (r) => {
      // Ambil patokan dari kapan terakhir dibayar (kalau ada dari backend), atau dari tanggal mulai
      let nextDate = r.lastApplied ? new Date(r.lastApplied) : new Date(r.startDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset jam biar fokus bandingin tanggalnya aja

      // Jika sudah pernah dibayar (lastApplied ada), majuin 1 frekuensi ke depan
      if (r.lastApplied) {
          if (r.frekuensi === 'bulanan') nextDate.setMonth(nextDate.getMonth() + 1);
          else if (r.frekuensi === 'tahunan') nextDate.setFullYear(nextDate.getFullYear() + 1);
          else if (r.frekuensi === 'harian') nextDate.setDate(nextDate.getDate() + (r.intervalHari || 1));
      }

      // LOOPING: Kalau misal tanggalnya masih di masa lalu (mungkin admin telat buka web / trigger),
      // kita majuin terus sesuai frekuensi sampai nemu tanggal yang >= hari ini
      while (nextDate < today) {
           if (r.frekuensi === 'bulanan') nextDate.setMonth(nextDate.getMonth() + 1);
           else if (r.frekuensi === 'tahunan') nextDate.setFullYear(nextDate.getFullYear() + 1);
           else if (r.frekuensi === 'harian') nextDate.setDate(nextDate.getDate() + (r.intervalHari || 1));
      }

      // Kalau ada batas endDate dan perhitungan nextDate sudah melewati batas itu
      if (r.endDate && nextDate > new Date(r.endDate)) {
          return "Sudah Berakhir";
      }

      // Format ke format tanggal Indonesia (Contoh: 1 Mei 2026)
      return nextDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  // 👆 SAMPAI SINI 👆

  if (showForm) {
     return (
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-200 animate-in fade-in zoom-in-95">
           <div className="flex items-center gap-4 mb-8"><button onClick={() => setShowForm(false)} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100"><ArrowLeft size={20}/></button><h2 className="text-xl font-black text-gray-900">Tambah Biaya Rutin Baru</h2></div>
           <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                 <label className="block text-sm font-bold text-gray-600 mb-2">Pilih Cabang</label>
                 <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold cursor-pointer" required value={formData.sheet} onChange={e => setFormData({...formData, sheet: e.target.value})}>
                    {branches.map(b => <option key={b.id} value={b.sheetName}>{b.name}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div><label className="block text-sm font-bold text-gray-600 mb-2">Nama Pengeluaran</label><input type="text" required placeholder="Gaji Karyawan / Sewa" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold" value={formData.nama} onChange={e => setFormData({...formData, nama: e.target.value})}/></div>
                 <div><label className="block text-sm font-bold text-gray-600 mb-2">Nominal / Harga</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span><input type="text" required placeholder="0" className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold" value={formData.nominal} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setFormData({...formData, nominal: raw ? new Intl.NumberFormat('id-ID').format(raw) : ''}); }}/></div></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-bold text-gray-600 mb-2">Frekuensi Potongan</label>
                    <select className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold cursor-pointer" value={formData.frekuensi} onChange={e => setFormData({...formData, frekuensi: e.target.value})}>
                       <option value="bulanan">Bulanan (Setiap Bulan)</option><option value="tahunan">Tahunan (Setiap Tahun)</option><option value="harian">Custom Hari (Per X Hari)</option>
                    </select>
                 </div>
                 {formData.frekuensi === 'harian' && (
                    <div><label className="block text-sm font-bold text-gray-600 mb-2">Potong Setiap Berapa Hari?</label><input type="number" required placeholder="Contoh: 10" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold" value={formData.intervalHari} onChange={e => setFormData({...formData, intervalHari: e.target.value})}/></div>
                 )}
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
                 <div><label className="block text-sm font-bold text-gray-600 mb-2">Mulai Dari Tanggal</label><input type="date" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}/></div>
                 <div><label className="block text-sm font-bold text-gray-600 mb-2">Sampai Tanggal (Opsional)</label><input type="date" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-gray-500" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}/></div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gray-900 text-white rounded-xl font-black mt-4 active:scale-95">{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN PENGELUARAN RUTIN'}</button>
           </form>
        </div>
     );
  }

  return (
     <div className="animate-in fade-in duration-500 max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-200 pb-6 gap-4">
           <h1 className="text-3xl font-black text-gray-900 tracking-tight">Laporan Pengeluaran Tetap</h1>
           <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm"><ListFilter size={16} className="text-gray-400" />
                 <select className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer" value={sortType} onChange={(e) => setSortBy(e.target.value)}><option value="Semua">Semua Frekuensi</option><option value="harian">Harian</option><option value="bulanan">Bulanan</option><option value="tahunan">Tahunan</option></select>
              </div>
              <button onClick={() => setShowForm(true)} className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-black active:scale-95 transition-all"><Plus size={16}/> Tambah Biaya</button>
           </div>
        </div>
        
        {isFetching ? ( <p className="text-gray-500 font-bold animate-pulse">Memuat data...</p> ) : filteredRoutines.length === 0 ? (
           <div className="text-center py-20 bg-white rounded-3xl border border-gray-100"><CalendarClock size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500 font-bold">Belum ada pengeluaran rutin yang sesuai kriteria.</p></div>
        ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredRoutines.map(r => (
                 <div key={r._id} className={`p-6 rounded-3xl border ${r.isActive ? 'bg-white border-gray-200 shadow-sm hover:shadow-md transition-shadow' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                    <div className="flex justify-between items-start mb-3">
                       <div>
                          <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${r.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.isActive ? 'Sedang Berjalan' : 'Selesai / Berhenti'}</span>
                          <h3 className="font-bold text-gray-900 text-lg mt-2">{r.nama}</h3>
                          <p className="text-xs font-bold text-gray-500">{r.sheet}</p>
                       </div>
                       <button onClick={() => handleDelete(r._id)} className="p-2 text-gray-400 hover:text-red-500 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                    </div>
                    <div className="flex items-center justify-between mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                       <div><p className="text-[10px] uppercase font-bold text-gray-400">Potongan</p><p className="font-black text-red-600">{formatRupiah(r.nominal)}</p></div>
                       <div className="text-right"><p className="text-[10px] uppercase font-bold text-gray-400">Frekuensi</p><p className="font-bold text-gray-900 capitalize">{r.frekuensi === 'harian' ? `Per ${r.intervalHari} Hari` : r.frekuensi}</p></div>
                    </div>

                  <div className="flex flex-col gap-1 text-xs font-bold text-gray-500 mt-4 px-1">
                    <span className="flex items-center gap-2"><CalendarDays size={14}/> Mulai: <span className="text-gray-900">{new Date(r.startDate).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}</span></span>
                    
                    {/* 👇 SELIPIN KODE INI BOS! 👇 */}
                    <span className="flex items-center gap-2">
                        <CalendarClock size={14} className="text-blue-500"/> Berikutnya: 
                        <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{getNextPaymentDate(r)}</span>
                    </span>
                    {/* 👆 SAMPAI SINI 👆 */}

                    <span className="flex items-center gap-2"><CalendarDays size={14}/> Akhir: {r.endDate ? new Date(r.endDate).toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'}) : 'Selamanya / Tidak dibatasi'}</span>
                  </div>
                 </div>
              ))}
           </div>
        )}
     </div>
  )
}

// ==========================================
// ADMIN: INPUT OPERASIONAL MANUAL
// ==========================================
function AdminOperationalExpenseView({ onBack, refreshData, branchInfo }) {
  const [formData, setFormData] = useState({ tanggal: '', jenis: '', nominal: '', metode: 'Cash', note: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    const d = new Date(formData.tanggal);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const tglFormat = `${days[d.getDay()]}, ${String(d.getDate()).padStart(2, '0')} ${months[d.getMonth()]} ${d.getFullYear()}`;
    const noteStr = formData.note.trim() ? ` | NOTE: ${formData.note.trim()}` : '';
    const jenisStr = `[OPERASIONAL] [${formData.metode.toUpperCase()}] ${formData.jenis}${noteStr}`;
    
    const payload = { sheet: branchInfo.sheetName, tanggal: tglFormat, cash: 0, bca: 0, gofood: 0, jenisPengeluaran: jenisStr, totalPengeluaran: Number(formData.nominal.replace(/\./g, '')) || 0 };
    await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    refreshData(); onBack();
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-sm border border-gray-200 animate-in fade-in zoom-in-95">
      <div className="flex items-center gap-4 mb-8"><button onClick={onBack} className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100"><ArrowLeft size={20}/></button><h2 className="text-xl font-black text-gray-900">Input Biaya Operasional (Manual)</h2></div>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div><label className="block text-sm font-bold text-gray-600 mb-2">Tanggal</label><input type="date" required className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold focus:border-gray-900 transition-colors" value={formData.tanggal} onChange={e => setFormData({...formData, tanggal: e.target.value})}/></div>
        <div><label className="block text-sm font-bold text-gray-600 mb-2">Jenis Pengeluaran</label><input type="text" required placeholder="Cth: Tisu, Sabun Cuci" className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold focus:border-gray-900 transition-colors" value={formData.jenis} onChange={e => setFormData({...formData, jenis: e.target.value})}/></div>
        <div><label className="block text-sm font-bold text-gray-600 mb-2">Nominal Uang Keluar</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span><input type="text" required placeholder="0" className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold text-lg focus:border-gray-900 transition-colors" value={formData.nominal} onChange={(e) => { const raw = e.target.value.replace(/\D/g, ''); setFormData({...formData, nominal: raw ? new Intl.NumberFormat('id-ID').format(parseInt(raw, 10)) : ''}); }}/></div></div>
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="block text-sm font-bold text-gray-600 mb-2">Metode Pembayaran</label>
              <select className="w-full px-4 py-3.5 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold cursor-pointer focus:border-gray-900 transition-colors" value={formData.metode} onChange={e => setFormData({...formData, metode: e.target.value})}><option value="Cash">Cash</option><option value="BCA">BCA</option><option value="QRIS">QRIS</option></select>
           </div>
           <div><label className="block text-sm font-bold text-gray-600 mb-2">Catatan (Opsional)</label><input type="text" placeholder="Ket..." className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 outline-none font-bold focus:border-gray-900 transition-colors" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})}/></div>
        </div>
        <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-gray-900 text-white rounded-xl font-black mt-4 hover:bg-black active:scale-95 transition-all">{isSubmitting ? 'MENYIMPAN...' : 'SIMPAN DATA'}</button>
      </form>
    </div>
  );
}

// ==========================================
// ADMIN: GRID TAHUN & EXPORT PDF PER TAHUN
// ==========================================
function AdminYearlyGridView({ tabType, rawData, onSelectMonth, formatRupiah, onOpenExpenseForm, filterCabang }) {
  const [expandedYears, setExpandedYears] = useState({});
  const [sortBy, setSortBy] = useState('chronological');

  const groupedData = useMemo(() => {
    const years = {};
    const MONTH_ORDER = { 'januari':1, 'februari':2, 'maret':3, 'april':4, 'mei':5, 'juni':6, 'juli':7, 'agustus':8, 'september':9, 'oktober':10, 'november':11, 'desember':12 };

    rawData.forEach(item => {
      if (!item.tanggal || item.tanggal.includes('*') || item.isDeleted) return; 
      const parts = item.tanggal.replace(/,/g, '').trim().split(/\s+/);
      if (parts.length < 3) return;
      const monthStr = parts.length === 4 ? parts[2] : parts[1];
      const yearStr = parts.length === 4 ? parts[3] : parts[2];
      const income = (item.cash || 0) + (item.bca || 0) + (item.gofood || 0);
      const expense = (item.totalPengeluaran || 0);

      if (!years[yearStr]) years[yearStr] = { year: yearStr, totalIncome: 0, totalExpense: 0, cashIn: 0, bcaIn: 0, qrisIn: 0, cashOut: 0, bcaOut: 0, qrisOut: 0, months: {} };
      if (!years[yearStr].months[monthStr]) { years[yearStr].months[monthStr] = { month: monthStr, year: yearStr, income: 0, expense: 0, monthIndex: MONTH_ORDER[monthStr.toLowerCase()] || 0, items: [] }; }

      years[yearStr].totalIncome += income; years[yearStr].totalExpense += expense;
      years[yearStr].months[monthStr].income += income; years[yearStr].months[monthStr].expense += expense;
      years[yearStr].months[monthStr].items.push(item);

      if (tabType === 'penjualan') {
         years[yearStr].cashIn += item.cash||0; years[yearStr].bcaIn += item.bca||0; years[yearStr].qrisIn += item.gofood||0;
      } else {
         let cln = (item.jenisPengeluaran || '').split('|')[0];
         if (cln.includes('[CASH]')) years[yearStr].cashOut += expense;
         else if (cln.includes('[BCA]')) years[yearStr].bcaOut += expense;
         else if (cln.includes('[QRIS]')) years[yearStr].qrisOut += expense;
      }
    });

    const sortedYearsList = Object.values(years).sort((a, b) => parseInt(b.year) - parseInt(a.year));
    const initialExpanded = {}; sortedYearsList.forEach(y => initialExpanded[y.year] = true);
    setExpandedYears(prev => Object.keys(prev).length === 0 ? initialExpanded : prev);
    return sortedYearsList;
  }, [rawData, tabType]);

  const exportYearlyPDF = (yearData) => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(`Laporan Rekapitulasi Tahunan: ${yearData.year}`, 14, 20);
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Kategori: ${tabType.toUpperCase()}`, 14, 28);
    doc.text(`Cabang: ${filterCabang}`, 14, 34);
    doc.text(`Total Nominal: ${formatRupiah(tabType === 'penjualan' ? yearData.totalIncome : yearData.totalExpense)}`, 14, 40);

    doc.setFontSize(9);
    if (tabType === 'penjualan') doc.text(`Detail Masuk -> CASH: ${formatRupiah(yearData.cashIn)} | BCA: ${formatRupiah(yearData.bcaIn)} | QRIS: ${formatRupiah(yearData.qrisIn)}`, 14, 46);
    else doc.text(`Detail Keluar -> CASH: ${formatRupiah(yearData.cashOut)} | BCA: ${formatRupiah(yearData.bcaOut)} | QRIS: ${formatRupiah(yearData.qrisOut)}`, 14, 46);

    const tableColumn = ["Bulan", "Pemasukan", "Pengeluaran", "Laba Bersih"];
    const tableRows = [];
    const sorted = Object.values(yearData.months).sort((a,b)=>a.monthIndex - b.monthIndex);
    
    sorted.forEach(m => { tableRows.push([ m.month.toUpperCase(), formatRupiah(m.income), formatRupiah(m.expense), formatRupiah(m.income - m.expense) ]); });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 52, theme: 'grid', headStyles: { fillColor: [17, 24, 39] } });
    doc.save(`Laporan_Tahunan_${yearData.year}_${filterCabang}.pdf`);
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      {/* HEADER YG TADI ERROR ADA DI SINI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div><h1 className="text-3xl font-black text-gray-900 tracking-tight">Laporan {tabType === 'penjualan' ? 'Penjualan' : 'Pengeluaran'}</h1></div>
        
        <div className="flex gap-2 flex-wrap justify-end">
          {/* TOMBOL PROGRESS BARU KHUSUS PENJUALAN */}
          {tabType === 'penjualan' && (
              <button onClick={() => window.dispatchEvent(new CustomEvent('openProgressModal'))} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-black shadow-lg active:scale-95 transition-all border-b-4 border-blue-800">
                  <Activity size={18}/> Progress Item (Live)
              </button>
          )}
          {tabType === 'pengeluaran' && <button onClick={onOpenExpenseForm} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-all"><Plus size={16}/> Input Manual</button>}
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm"><ListFilter size={16} className="text-gray-400" /><select className="bg-transparent text-sm font-bold text-gray-700 outline-none cursor-pointer" value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="chronological">Urutan Waktu</option><option value="highest">Tertinggi</option></select></div>
        </div>
      </div>

      {groupedData.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100"><FileText size={48} className="mx-auto text-gray-300 mb-4" /><p className="text-gray-500 font-bold">Belum ada data.</p></div>
      ) : (
        <div className="space-y-12">
          {groupedData.map((yearData) => {
            let sortedMonths = Object.values(yearData.months);
            if (sortBy === 'chronological') sortedMonths.sort((a, b) => a.monthIndex - b.monthIndex);
            else sortedMonths.sort((a, b) => tabType === 'penjualan' ? b.income - a.income : b.expense - a.expense);
            const isExpanded = expandedYears[yearData.year];

            return (
              <div key={yearData.year} className="relative">
                <div className="flex items-center gap-4 mb-6 z-10 relative bg-gray-50 w-max pr-4">
                  <button onClick={() => setExpandedYears(prev => ({ ...prev, [yearData.year]: !prev[yearData.year] }))} className="flex items-center gap-3 group outline-none">
                    <div className="flex items-center gap-2"><span className="text-xl font-black text-gray-900">Tahun {yearData.year}</span><div className="p-1 rounded-md bg-gray-200 text-gray-600 group-hover:bg-gray-900 group-hover:text-white transition-colors">{isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</div></div>
                    <span className="text-xs font-bold text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-200">{tabType === 'penjualan' ? `Total: ${formatRupiah(yearData.totalIncome)}` : `Total: ${formatRupiah(yearData.totalExpense)}`}</span>
                  </button>
                  <button onClick={() => exportYearlyPDF(yearData)} className="p-1.5 bg-gray-200 text-gray-600 hover:bg-gray-900 hover:text-white rounded-lg transition-colors flex items-center gap-1 tooltip">
                    <Download size={16}/><span className="text-[10px] font-bold">PDF</span>
                  </button>
                </div>
                <div className="absolute top-4 left-0 w-full h-px bg-black opacity-10 z-0"></div>

                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 z-10 relative">
                    {sortedMonths.map(m => (
                      <button key={m.month} onClick={() => onSelectMonth(m)} className="text-left bg-white p-5 rounded-2xl border border-gray-200 hover:border-gray-900 shadow-sm hover:shadow-lg transition-all group flex flex-col justify-between h-36">
                        <div>
                          <div className="flex justify-between items-start mb-2"><h3 className="font-bold text-gray-900 capitalize text-lg group-hover:underline">{m.month} {m.year}</h3><ArrowRight size={16} className="text-gray-300 group-hover:text-gray-900 transform group-hover:translate-x-1 transition-all" /></div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">*total pendapatan:</span><span className="font-bold text-green-600">{formatRupiah(m.income)}</span></div>
                            <div className="flex justify-between text-xs"><span className="text-gray-500 font-medium">*total pengeluaran:</span><span className="font-bold text-red-600">{formatRupiah(m.expense)}</span></div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}

// ==========================================
// ADMIN: DETAIL VIEW & EXPORT PDF PER BULAN
// ==========================================
function AdminMonthDetailView({ monthData, tabType, onBack, formatRupiah, onDelete, onBulkDelete, filterCabang, isPinColumnActive, isMultiDeleteActive }) {
  const [selectedDate, setSelectedDate] = useState(null); 
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [saleDetailModal, setSaleDetailModal] = useState(null);
  
  // STATE BARU UNTUK MULTI-DELETE
  const [selectedIds, setSelectedIds] = useState([]);

  // Reset selection pas ganti tanggal atau tab
  useEffect(() => { setSelectedIds([]); }, [selectedDate, tabType]);

  // LOGIKA HARD DELETE & SOFT DELETE SINGLE
  const handleHardDelete = async (id, isHard = false) => {
     if(isHard) {
        if(window.confirm('🚨 YAKIN MENGHAPUS PERMANEN DATA INI? Data tidak akan bisa dikembalikan!')) {
           setIsDeletingId(id); await onDelete(id, true); setIsDeletingId(null);
        }
     } else {
        if(window.confirm('Hapus sementara (pindahkan ke sampah)?')) {
           setIsDeletingId(id); await onDelete(id, false); setIsDeletingId(null);
        }
     }
  };

  const filteredItems = useMemo(() => {
    let items = [...monthData.items];
    if (tabType === 'penjualan') items = items.filter(i => i.totalPengeluaran === 0);
    else items = items.filter(i => i.totalPengeluaran > 0);
    return items.reverse();
  }, [monthData, tabType]);

  const totalThisTab = tabType === 'penjualan' ? monthData.income : monthData.expense;

  const dailyGroups = useMemo(() => {
    const groupsMap = new Map();
    filteredItems.forEach(item => {
      const tgl = item.tanggal;
      if (!groupsMap.has(tgl)) { groupsMap.set(tgl, { tanggal: tgl, items: [], total: 0, cash: 0, bca: 0, qris: 0 }); }
      
      const group = groupsMap.get(tgl);
      group.items.push(item);
      
      if (!item.isDeleted) {
        const itemTotal = tabType === 'penjualan' ? (item.cash||0)+(item.bca||0)+(item.gofood||0) : (item.totalPengeluaran||0);
        group.total += itemTotal;

        if (tabType === 'penjualan') {
          group.cash += item.cash || 0; group.bca += item.bca || 0; group.qris += item.gofood || 0;
        } else {
          let cleanJenis = (item.jenisPengeluaran || '').split('| NOTE: ')[0].replace(/#GRP\d+#/g, '').trim();
          if (cleanJenis.includes('[CASH]')) group.cash += itemTotal;
          else if (cleanJenis.includes('[BCA]')) group.bca += itemTotal;
          else if (cleanJenis.includes('[QRIS]')) group.qris += itemTotal;
        }
      }
    });
    return Array.from(groupsMap.values());
  }, [filteredItems, tabType]);

  const monthCash = dailyGroups.reduce((s, d) => s + d.cash, 0);
  const monthBca = dailyGroups.reduce((s, d) => s + d.bca, 0);
  const monthQris = dailyGroups.reduce((s, d) => s + d.qris, 0);

  const activeDayData = selectedDate ? dailyGroups.find(d => d.tanggal === selectedDate) : null;

const exportDailyPDF = () => {
    if (!activeDayData) return;
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    
    // CUSTOM TITLE KHUSUS Aeon & Villa MG
    const titleStr = filterCabang === 'MM Aeon & Villa MG' ? 'Laporan Harian: REKAP SETORAN STOK' : `Laporan Harian: ${tabType.toUpperCase()}`;
    doc.text(titleStr, 14, 20);
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Tanggal: ${activeDayData.tanggal}`, 14, 28);
    doc.text(`Cabang: ${filterCabang}`, 14, 34);
    doc.text(`Total Keseluruhan: ${formatRupiah(activeDayData.total)}`, 14, 40);
    
    doc.setFontSize(9);
    // Sembunyikan detail metode pembayaran (Cash/BCA/QRIS) jika di Aeon & Villa MG karena cuma 1 metode (Setoran)
    if (filterCabang !== 'MM Aeon & Villa MG') {
        doc.text(`Detail -> CASH: ${formatRupiah(activeDayData.cash)}   |   BCA: ${formatRupiah(activeDayData.bca)}   |   QRIS: ${formatRupiah(activeDayData.qris)}`, 14, 46);
    }

    let tableColumn = [];
    const tableRows = [];

    // ===============================================
    // LOGIKA PDF KHUSUS CABANG Aeon & Villa MG
    // ===============================================
    if (filterCabang === 'MM Aeon & Villa MG') {
        tableColumn = ["Waktu", "Nama Item", "Stok Awal", "Sisa Stok", "Laku", "Hrg Modal", "Total (Rp)"];
        
        activeDayData.items.forEach(item => {
            const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
            const rowStyles = item.isDeleted ? { textColor: [220, 38, 38], fontStyle: 'italic' } : {};
            
            const rawItemsStr = (item.jenisPengeluaran || '').replace('[LAPORAN SENEN]', '').trim();
            const detailItems = rawItemsStr.split(' || ').filter(i => i);
            
            if (detailItems.length === 0) {
                tableRows.push([
                    {content: timeStr, styles: rowStyles}, 
                    {content: item.isDeleted ? 'LAPORAN DIHAPUS' : 'DATA KOSONG', styles: rowStyles}, 
                    '-', '-', '-', '-', '-'
                ]);
                return;
            }

            // Loop per item buat dijadiin baris tabel yang rapi
            detailItems.forEach((line, index) => {
               const splitColon = line.split(': ');
               if (splitColon.length < 2) return;
               const name = splitColon[0];
               const statsStr = splitColon[1];
               
               // Parsing data dari string laporan
               const awal = statsStr.match(/Awal (\d+)/)?.[1] || '0';
               const sisa = statsStr.match(/Sisa (\d+)/)?.[1] || '0';
               const laku = statsStr.match(/Laku (\d+)/)?.[1] || '0';
               const modalRaw = statsStr.match(/Modal (Rp.*?)$/)?.[1] || 'Rp 0';
               
               // Hitung total uangnya
               const modalNum = parseInt(modalRaw.replace(/\D/g, '')) || 0;
               const lakuNum = parseInt(laku) || 0;
               const totalItem = formatRupiah(modalNum * lakuNum);

               tableRows.push([
                  {content: index === 0 ? timeStr : '', styles: rowStyles}, // Waktu cuma muncul di baris pertama
                  {content: name, styles: rowStyles},
                  {content: awal, styles: rowStyles},
                  {content: sisa, styles: rowStyles},
                  {content: laku, styles: rowStyles},
                  {content: modalRaw, styles: rowStyles},
                  {content: totalItem, styles: rowStyles}
               ]);
            });
        });
    } 
    // ===============================================
    // LOGIKA PDF UNTUK CABANG LAIN (NORMAL)
    // ===============================================
    else {
        tableColumn = tabType === 'penjualan' 
          ? ["Waktu", "Status", "Keterangan", "Cetak", "Metode", "Total"] 
          : ["Waktu", "Status", "Jenis Pengeluaran", "Metode", "Total Keluar", "Catatan"];
          
        activeDayData.items.forEach(item => {
          const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
          const statusStr = item.isDeleted ? 'DIHAPUS' : 'OK';
          const rowStyles = item.isDeleted ? { textColor: [220, 38, 38], fontStyle: 'italic' } : {}; 
          
          if (tabType === 'penjualan') {
            const income = (item.cash||0) + (item.bca||0) + (item.gofood||0);
            let metode = '-';
            if (item.cash > 0) metode = 'CASH'; else if (item.bca > 0) metode = 'BCA'; else if (item.gofood > 0) metode = 'QRIS';
            
            const rawItemsStr = (item.jenisPengeluaran || '').split('] ')[1] || '';
            const cleanItemsPdf = rawItemsStr.split(', ').filter(p => !p.startsWith('**') && !p.startsWith('++')).join(', ');

            tableRows.push([ 
                {content: timeStr, styles: rowStyles}, {content: statusStr, styles: rowStyles}, {content: cleanItemsPdf || 'Penjualan Kasir', styles: rowStyles},
                {content: `${item.printCount||0}x`, styles: rowStyles}, {content: metode, styles: rowStyles}, {content: formatRupiah(income), styles: rowStyles}
            ]);
          } else {
            let cleanJenis = (item.jenisPengeluaran || '').split('| NOTE: ')[0].replace(/#GRP\d+#/g, '').trim();
            let note = item.jenisPengeluaran?.split('| NOTE: ')[1]?.trim() || '-';
            let metode = '-';
            if (cleanJenis.includes('[CASH]')) { metode = 'CASH'; cleanJenis = cleanJenis.replace('[CASH]', '').trim(); }
            else if (cleanJenis.includes('[BCA]')) { metode = 'BCA'; cleanJenis = cleanJenis.replace('[BCA]', '').trim(); }
            else if (cleanJenis.includes('[QRIS]')) { metode = 'QRIS'; cleanJenis = cleanJenis.replace('[QRIS]', '').trim(); }
            
            tableRows.push([ 
                {content: timeStr, styles: rowStyles}, {content: statusStr, styles: rowStyles}, {content: cleanJenis, styles: rowStyles}, 
                {content: metode, styles: rowStyles}, {content: formatRupiah(item.totalPengeluaran), styles: rowStyles}, {content: note, styles: rowStyles}
            ]);
          }
        });
    }

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 52, theme: 'grid', headStyles: { fillColor: [17, 24, 39] } });
    doc.save(`Laporan_${tabType}_Harian_${activeDayData.tanggal.replace(/,/g, '')}_${filterCabang}.pdf`);
  };

  const exportMonthlyPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.setFont("helvetica", "bold");
    doc.text(`Laporan Bulanan: ${tabType.toUpperCase()}`, 14, 20);
    
    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    doc.text(`Bulan: ${monthData.month.toUpperCase()} ${monthData.year}`, 14, 28);
    doc.text(`Cabang: ${filterCabang}`, 14, 34);
    doc.text(`Total Akumulasi: ${formatRupiah(totalThisTab)}`, 14, 40);

    doc.setFontSize(9);
    doc.text(`Detail -> CASH: ${formatRupiah(monthCash)}   |   BCA: ${formatRupiah(monthBca)}   |   QRIS: ${formatRupiah(monthQris)}`, 14, 46);

    const tableColumn = ["Tanggal", "Total Item/Trans", "CASH", "BCA", "QRIS", "Total Nominal"];
    const tableRows = [];

    dailyGroups.forEach(day => {
       tableRows.push([ day.tanggal, day.items.length + " data", formatRupiah(day.cash), formatRupiah(day.bca), formatRupiah(day.qris), formatRupiah(day.total) ]);
    });

    autoTable(doc, { head: [tableColumn], body: tableRows, startY: 52, theme: 'grid', headStyles: { fillColor: [17, 24, 39] } });
    doc.save(`Laporan_${tabType}_Bulanan_${monthData.month}_${filterCabang}.pdf`);
  };

  const pinClassesActionAndTotal = isPinColumnActive ? "sticky right-0 bg-white/95 backdrop-blur-md shadow-[-10px_0_15px_rgba(0,0,0,0.05)] border-l border-gray-100 z-10" : "";

  if (!selectedDate) {
      return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300 max-w-7xl mx-auto">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <button onClick={onBack} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"><ArrowLeft size={20}/></button>
                    <div>
                       <h2 className="text-xl font-black text-gray-900 capitalize">Rekap Bulanan {monthData.month} {monthData.year}</h2>
                       <p className="text-sm text-gray-500 font-medium">Total Akumulasi: <span className={`font-bold ${tabType === 'penjualan' ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(totalThisTab)}</span></p>
                    </div>
                  </div>
                  <button onClick={exportMonthlyPDF} className="px-4 py-3 bg-gray-900 text-white rounded-xl shadow-sm font-bold text-sm flex items-center gap-2 hover:bg-black active:scale-95 transition-all">
                    <Download size={16}/> Cetak PDF Bulanan
                  </button>
               </div>
            </div>
            
            <div className="p-6 grid grid-cols-1 gap-4">
                {dailyGroups.length === 0 ? (
                    <div className="text-center py-10 text-gray-400 font-bold">Tidak ada data di bulan ini.</div>
                ) : (
                    dailyGroups.map((dayData, idx) => (
                        <button key={idx} onClick={() => setSelectedDate(dayData.tanggal)} className="text-left bg-white p-5 rounded-2xl border border-gray-200 hover:border-gray-900 shadow-sm hover:shadow-lg transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-black text-lg text-gray-900">{dayData.tanggal}</h3>
                                    <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full">{dayData.items.length} Data</span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-xs font-bold text-gray-500">
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-gray-400"></div>CASH: {formatRupiah(dayData.cash)}</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div>BCA: {formatRupiah(dayData.bca)}</span>
                                    <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-purple-500"></div>QRIS: {formatRupiah(dayData.qris)}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">Total {tabType}</p>
                                    <p className={`text-xl font-black ${tabType === 'penjualan' ? 'text-green-600' : 'text-red-600'}`}>{formatRupiah(dayData.total)}</p>
                                </div>
                                <ArrowRight size={20} className="text-gray-300 group-hover:text-gray-900 transform group-hover:translate-x-1 transition-all" />
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
      );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300 max-w-7xl mx-auto flex flex-col h-[85vh] relative">
      
      {/* FLOATING ACTION BAR UNTUK MULTI-DELETE */}
      {selectedIds.length > 0 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4 sm:gap-6 z-[999] animate-in slide-in-from-bottom-10 border border-gray-700 w-[90%] sm:w-auto overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 shrink-0">
                <div className="bg-white text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">{selectedIds.length}</div>
                <span className="font-bold text-sm tracking-wide hidden sm:block">Terpilih</span>
            </div>
            <div className="w-px h-6 bg-gray-700 shrink-0"></div>
            <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => { onBulkDelete(selectedIds, false); setSelectedIds([]); }} className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 whitespace-nowrap">
                    <Trash2 size={14}/> Hapus Sementara
                </button>
                <button onClick={() => { if(window.confirm(`HAPUS PERMANEN ${selectedIds.length} DATA?\n\nData akan hilang selamanya dan tidak bisa dikembalikan!`)) { onBulkDelete(selectedIds, true); setSelectedIds([]); } }} className="px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 whitespace-nowrap">
                    <AlertCircle size={14}/> Permanen
                </button>
            </div>
            <button onClick={() => setSelectedIds([])} className="p-2 ml-auto bg-gray-800 hover:bg-gray-700 rounded-full transition-colors shrink-0 text-gray-400 hover:text-white" title="Batal Pilih">
                <X size={18}/>
            </button>
        </div>
      )}

      <div className="p-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedDate(null)} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"><ArrowLeft size={20}/></button>
              <div>
                 <h2 className="text-xl font-black text-gray-900">Detail Transaksi Harian</h2>
                 <p className="text-sm font-bold text-gray-500">{activeDayData.tanggal}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-white border border-gray-200 rounded-xl p-1 shadow-sm text-xs font-bold">
                  <div className="px-3 py-1.5 border-r border-gray-100"><span className="text-gray-400 block text-[10px] uppercase">CASH</span><span className="text-gray-900">{formatRupiah(activeDayData.cash)}</span></div>
                  <div className="px-3 py-1.5 border-r border-gray-100"><span className="text-blue-400 block text-[10px] uppercase">BCA</span><span className="text-blue-700">{formatRupiah(activeDayData.bca)}</span></div>
                  <div className="px-3 py-1.5"><span className="text-purple-400 block text-[10px] uppercase">QRIS</span><span className="text-purple-700">{formatRupiah(activeDayData.qris)}</span></div>
              </div>
              <div className="px-4 py-2 bg-gray-100 rounded-xl text-sm font-black text-gray-900 border border-gray-200">Total: <span className={tabType === 'penjualan' ? 'text-green-600' : 'text-red-600'}>{formatRupiah(activeDayData.total)}</span></div>
              
              {tabType === 'penjualan' && (
                  <button onClick={() => window.dispatchEvent(new CustomEvent('openProgressModal', { detail: activeDayData.tanggal }))} className="px-4 py-3 bg-blue-600 text-white rounded-xl shadow-sm font-bold text-sm flex items-center gap-2 hover:bg-blue-700 active:scale-95 transition-all">
                      <Activity size={16}/> Progress Item
                  </button>
              )}

              <button onClick={exportDailyPDF} className="px-4 py-3 bg-gray-900 text-white rounded-xl shadow-sm font-bold text-sm flex items-center gap-2 hover:bg-black active:scale-95 transition-all"><Download size={16}/> Cetak PDF</button>
            </div>
        </div>
      </div>

      <div className="overflow-x-auto flex-1 bg-white relative pb-24">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">

          <thead className="sticky top-0 z-20">
            <tr className="bg-gray-50 text-xs text-gray-400 uppercase tracking-widest border-b border-gray-200 shadow-sm">
              {/* CHECKBOX HEADER */}
              {isMultiDeleteActive && (
                  <th className="p-5 font-bold w-12 text-center bg-gray-50">
                      <input 
                         type="checkbox" 
                         className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                         checked={activeDayData.items.length > 0 && selectedIds.length === activeDayData.items.length}
                         onChange={(e) => {
                             if(e.target.checked) setSelectedIds(activeDayData.items.map(i=>i._id));
                             else setSelectedIds([]);
                         }}
                      />
                  </th>
              )}

              <th className="p-5 font-bold">Waktu</th>
              <th className="p-5 font-bold">Status</th>
              
              {/* KONDISI TABEL HEADER BERDASARKAN CABANG */}
              {filterCabang === 'MM Aeon & Villa MG' ? (
                <>
                  <th className="p-5 font-bold w-full">Detail Rekap Laporan Stok</th>
                  <th className={`p-5 font-bold text-center ${pinClassesActionAndTotal}`}>Total Setoran & Aksi</th>
                </>
              ) : tabType === 'penjualan' ? ( 
                <>
                  <th className="p-5 font-bold w-full">Keterangan Belanja</th>
                  <th className="p-5 font-bold text-center">Cetak</th>
                  <th className="p-5 font-bold text-center">Metode</th>
                  <th className={`p-5 font-bold text-center ${pinClassesActionAndTotal}`}>Total & Aksi</th>
                </> 
              ) : ( 
                <>
                  <th className="p-5 font-bold w-full">Jenis Pengeluaran</th>
                  <th className="p-5 font-bold text-center">Metode</th>
                  <th className={`p-5 font-bold text-center ${pinClassesActionAndTotal}`}>Keluar & Aksi</th>
                </> 
              )}
            </tr>
          </thead>

          <tbody className="text-sm">
            {activeDayData.items.map((item, idx) => {
              const timeStr = item.createdAt ? new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
              const isDeleted = item.isDeleted;
              const isSelected = selectedIds.includes(item._id);
              const rowClass = isSelected ? "bg-orange-50 hover:bg-orange-100 border-b border-orange-200" : (isDeleted ? "bg-red-50/50 hover:bg-red-50 border-b border-red-100" : "border-b border-gray-50 hover:bg-gray-50");
              const textClass = isDeleted ? "text-red-500 line-through opacity-70" : "text-gray-600";
              
              // KONDISI TABEL BODY KHUSUS Aeon & Villa MG
              if (filterCabang === 'MM Aeon & Villa MG') {
                 const rawItemsStr = (item.jenisPengeluaran || '').replace('[LAPORAN SENEN]', '').trim();
                 const detailItems = rawItemsStr.split(' || ').filter(i => i);
                 
                 return (
                    <tr key={item._id || idx} className={`${rowClass} transition-colors`}>
                        {isMultiDeleteActive && (
                            <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-orange-500 cursor-pointer" 
                                    checked={isSelected}
                                    onChange={() => setSelectedIds(prev => prev.includes(item._id) ? prev.filter(id => id !== item._id) : [...prev, item._id])}
                                />
                            </td>
                        )}
                        <td className="p-5 font-black text-gray-400">
                           {timeStr}
                           {isDeleted && item.deletedAt && <div className="text-[9px] text-red-400 font-normal mt-1">Dihapus: {new Date(item.deletedAt).toLocaleTimeString('id-ID')}</div>}
                        </td>
                        <td className="p-5">
                           {isDeleted ? <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded border border-red-200 uppercase">Terhapus</span> : <CheckCircle2 size={16} className="text-green-500"/>}
                        </td>
                        <td className={`p-5 font-bold ${textClass} whitespace-normal break-words min-w-[400px]`}>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                               {detailItems.map((line, i) => {
                                   const [name, stats] = line.split(': ');
                                   return (
                                       <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1 shadow-sm ${isDeleted ? 'bg-red-50/50 border-red-100' : 'bg-blue-50/50 border-blue-100'}`}>
                                           <span className={`font-black text-xs ${isDeleted ? 'text-red-500' : 'text-blue-900'}`}>{name}</span>
                                           <span className={`text-[10px] font-bold ${isDeleted ? 'text-red-400' : 'text-blue-600'}`}>{stats}</span>
                                       </div>
                                   );
                               })}
                           </div>
                        </td>
                        <td className={`p-5 text-center flex flex-col items-center justify-center gap-3 h-full min-h-[100px] ${pinClassesActionAndTotal} ${isSelected ? 'bg-orange-50' : 'bg-white'}`}>
                          <span className={`font-black text-xl ${isDeleted ? 'text-red-500 opacity-70' : 'text-green-700'}`}>{formatRupiah(item.cash)}</span>
                          
                          {isDeleted ? (
                             <div className="flex flex-col gap-1 items-center">
                                <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded">SAMPAH</span>
                                <button onClick={(e) => { e.stopPropagation(); handleHardDelete(item._id, true); }} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] rounded-md font-bold transition-colors shadow-sm">Permanen</button>
                             </div>
                          ) : isDeletingId === item._id ? ( <Loader2 size={16} className="animate-spin text-red-500 mx-auto" /> ) : ( <button onClick={(e) => { e.stopPropagation(); handleHardDelete(item._id, false); }} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all z-10"><Trash2 size={18} className="mx-auto"/></button> )}
                        </td>
                    </tr>
                 );
              } 
              
              // DI BAWAH SINI ADALAH LOGIKA TABEL ASLI UNTUK CABANG LAIN
              else if (tabType === 'penjualan') {
                const income = (item.cash||0) + (item.bca||0) + (item.gofood||0);
                let metode = '-'; let badgeColor = isDeleted ? 'bg-red-100 text-red-500 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200';
                if (!isDeleted) {
                   if (item.cash > 0) { metode = 'CASH'; badgeColor = 'bg-gray-100 text-gray-800 border-gray-200'; }
                   else if (item.bca > 0) { metode = 'BCA'; badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'; }
                   else if (item.gofood > 0) { metode = 'QRIS'; badgeColor = 'bg-purple-50 text-purple-700 border-purple-200'; }
                } else {
                   if (item.cash > 0) metode = 'CASH'; else if (item.bca > 0) metode = 'BCA'; else if (item.gofood > 0) metode = 'QRIS';
                }

                const rawItemsStr = (item.jenisPengeluaran || '').split('] ')[1] || '';
                const cleanItems = rawItemsStr.split(', ').filter(p => !p.startsWith('**') && !p.startsWith('++')).join(', ');
                const hasNote = rawItemsStr.includes('++ CATATAN:');

                return (
                  <tr key={item._id || idx} className={`${rowClass} cursor-pointer transition-colors`} onClick={() => setSaleDetailModal(item)}>
                    
                    {/* CHECKBOX ROW */}
                    {isMultiDeleteActive && (
                        <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                             <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-orange-500 cursor-pointer" 
                                 checked={isSelected}
                                 onChange={() => {
                                     setSelectedIds(prev => prev.includes(item._id) ? prev.filter(id => id !== item._id) : [...prev, item._id]);
                                 }}
                             />
                        </td>
                    )}

                    <td className="p-5 font-black text-gray-400">
                       {timeStr}
                       {isDeleted && item.deletedAt && <div className="text-[9px] text-red-400 font-normal mt-1">Dihapus: {new Date(item.deletedAt).toLocaleTimeString('id-ID')}</div>}
                    </td>
                    <td className="p-5">
                       {isDeleted ? <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded border border-red-200 uppercase">Terhapus</span> : <CheckCircle2 size={16} className="text-green-500"/>}
                    </td>
                    <td className={`p-5 font-bold ${textClass} whitespace-normal break-words min-w-[300px]`}>
                        <div className="flex flex-col gap-1">
                            <span>{cleanItems || 'Penjualan Kasir'}</span>
                            {hasNote && <span className="flex items-center gap-1 text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded w-fit border border-blue-100"><FileText size={12}/> Ada Catatan</span>}
                        </div>
                    </td>
                    <td className="p-5 text-center font-bold text-gray-500">{item.printCount || 0}x</td>
                    <td className={`p-5 text-center`}><span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${badgeColor}`}>{metode}</span></td>
                    
                    <td className={`p-5 text-center flex flex-col items-center justify-center gap-3 h-full min-h-[80px] ${pinClassesActionAndTotal} ${isSelected ? 'bg-orange-50' : 'bg-white'}`}>
                      <span className={`font-black ${isDeleted ? 'text-red-500 opacity-70' : 'text-green-700'}`}>{formatRupiah(income)}</span>
                      {isDeleted ? (
                         <div className="flex flex-col gap-1 items-center">
                            <span className="text-[10px] font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded">SAMPAH</span>
                            <button onClick={(e) => { e.stopPropagation(); handleHardDelete(item._id, true); }} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] rounded-md font-bold transition-colors shadow-sm">Permanen</button>
                         </div>
                      ) : isDeletingId === item._id ? ( <Loader2 size={16} className="animate-spin text-red-500 mx-auto" /> ) : ( <button onClick={(e) => { e.stopPropagation(); handleHardDelete(item._id, false); }} className="p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all z-10"><Trash2 size={18} className="mx-auto"/></button> )}
                    </td>
                  </tr>
                )
              } else {
                let cleanJenis = (item.jenisPengeluaran || '').split('| NOTE: ')[0].replace(/#GRP\d+#/g, '').trim();
                let note = item.jenisPengeluaran?.split('| NOTE: ')[1]?.trim() || '';
                let metode = '-'; let badgeColor = isDeleted ? 'bg-red-100 text-red-500 border-red-200' : 'bg-gray-100 text-gray-500 border-gray-200';
                if (!isDeleted) {
                   if (cleanJenis.includes('[CASH]')) { metode = 'CASH'; badgeColor = 'bg-gray-100 text-gray-800 border-gray-200'; }
                   else if (cleanJenis.includes('[BCA]')) { metode = 'BCA'; badgeColor = 'bg-blue-50 text-blue-700 border-blue-200'; }
                   else if (cleanJenis.includes('[QRIS]')) { metode = 'QRIS'; badgeColor = 'bg-purple-50 text-purple-700 border-purple-200'; }
                } else {
                   if (cleanJenis.includes('[CASH]')) metode = 'CASH'; else if (cleanJenis.includes('[BCA]')) metode = 'BCA'; else if (cleanJenis.includes('[QRIS]')) metode = 'QRIS';
                }

                if (cleanJenis.includes('[CASH]')) cleanJenis = cleanJenis.replace('[CASH]', '').trim();
                if (cleanJenis.includes('[BCA]')) cleanJenis = cleanJenis.replace('[BCA]', '').trim();
                if (cleanJenis.includes('[QRIS]')) cleanJenis = cleanJenis.replace('[QRIS]', '').trim();
                if (cleanJenis.includes('[OPERASIONAL]')) cleanJenis = cleanJenis.replace('[OPERASIONAL]', '').trim();

                return (
                  <tr key={item._id || idx} className={`${rowClass} transition-colors`}>
                    
                    {/* CHECKBOX ROW */}
                    {isMultiDeleteActive && (
                        <td className="p-5 text-center" onClick={(e) => e.stopPropagation()}>
                             <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-orange-500 cursor-pointer" 
                                 checked={isSelected}
                                 onChange={() => {
                                     setSelectedIds(prev => prev.includes(item._id) ? prev.filter(id => id !== item._id) : [...prev, item._id]);
                                 }}
                             />
                        </td>
                    )}

                    <td className="p-5 font-black text-gray-400">
                       {timeStr}
                       {isDeleted && item.deletedAt && <div className="text-[9px] text-red-400 font-normal mt-1">Dihapus: {new Date(item.deletedAt).toLocaleTimeString('id-ID')}</div>}
                    </td>
                    <td className="p-5">
                       {isDeleted ? <span className="px-2 py-1 bg-red-100 text-red-600 text-[10px] font-black rounded border border-red-200 uppercase">Terhapus</span> : <CheckCircle2 size={16} className="text-gray-400"/>}
                    </td>
                    <td className={`p-5 font-bold ${textClass} whitespace-normal break-words min-w-[300px]`}>{cleanJenis}</td>
                    <td className={`p-5 text-center`}><span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-widest ${badgeColor}`}>{metode}</span></td>
                    
                    <td className={`p-5 text-center flex flex-col items-center justify-center gap-3 h-full min-h-[80px] relative ${pinClassesActionAndTotal} ${isSelected ? 'bg-orange-50' : 'bg-white'}`}>
                      <span className={`font-black ${isDeleted ? 'text-red-500 opacity-70' : 'text-red-600'}`}>{formatRupiah(item.totalPengeluaran)}</span>
                      
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {note ? (
                           <div className="relative group">
                             <button onClick={() => setActiveNoteId(activeNoteId === item._id ? null : item._id)} className={`p-1.5 rounded-lg transition-colors ${activeNoteId === item._id ? 'bg-blue-100 text-blue-700' : 'text-blue-500 hover:bg-blue-50'}`}><FileText size={16}/></button>
                             {activeNoteId === item._id && (
                               <div className="absolute right-[120%] top-1/2 -translate-y-1/2 mr-3 w-64 bg-gray-900 text-white p-4 rounded-2xl shadow-xl z-50 text-left whitespace-normal animate-in zoom-in-95">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 border-b border-gray-700 pb-1">Catatan</p>
                                  <p className="text-sm font-medium leading-relaxed">{note}</p>
                                  <div className="absolute right-[-6px] top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-900 rotate-45"></div>
                               </div>
                             )}
                           </div>
                        ) : (
                           <div className="p-1.5 text-gray-300"><FileText size={16} className="opacity-30"/></div>
                        )}

                        <div className="w-px h-4 bg-gray-200 mx-1"></div>

                        {isDeleted ? (
                           <button onClick={() => handleHardDelete(item._id, true)} className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] rounded-md font-bold transition-colors shadow-sm">Permanen</button>
                        ) : isDeletingId === item._id ? ( <Loader2 size={16} className="animate-spin text-red-500 mx-auto" /> ) : ( <button onClick={() => handleHardDelete(item._id, false)} className="p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"><Trash2 size={16} className="mx-auto"/></button> )}
                      </div>
                    </td>
                  </tr>
                )
              }
            })}
          </tbody>
        </table>
      </div>

      {/* POP-UP DETAIL PENJUALAN ADMIN */}
      {saleDetailModal && (
          <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in p-4" onClick={() => setSaleDetailModal(null)}>
              <div className="bg-white rounded-[2rem] p-6 shadow-2xl max-w-sm w-full border border-gray-100 animate-in zoom-in-95 cursor-default" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-start mb-4 border-b border-gray-100 pb-4">
                      <div>
                          <h3 className="text-xl font-black text-gray-900">Detail Pesanan</h3>
                          <p className="text-xs font-bold text-gray-400">{new Date(saleDetailModal.createdAt).toLocaleString('id-ID')}</p>
                      </div>
                      <button onClick={() => setSaleDetailModal(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"><X size={18}/></button>
                  </div>
                  
                  <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                      {(saleDetailModal.jenisPengeluaran || '').split('] ')[1]?.split(', ').map((str, i) => {
                          if (str.startsWith('**')) {
                              return <span key={i} className="inline-block mr-2 mb-2 px-3 py-1 bg-gray-100 border border-gray-200 text-gray-600 text-xs font-black rounded-lg">{str.replace(/\*/g, '').trim()}</span>
                          } else if (str.startsWith('++ CATATAN:')) {
                              return <div key={i} className="bg-blue-50 p-3 rounded-xl border border-blue-100 mt-2"><p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={12}/> Catatan Pelanggan</p><p className="text-sm font-bold text-blue-900">{str.replace('++ CATATAN:', '').trim()}</p></div>
                          } else if (str.startsWith('++ PAY:')) {
                              return null; // Info Bayar di skip, tampil di bawah aja
                          } else {
                              return <div key={i} className="flex items-center gap-2 pb-2 border-b border-gray-50"><CheckCircle2 size={14} className="text-green-500"/><span className="text-sm font-bold text-gray-800">{str}</span></div>
                          }
                      })}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
}

// ==========================================
// ADMIN: DASHBOARD KEUANGAN DENGAN CUSTOM DATE FILTER
// ==========================================
function AdminKeuanganDashboard({ rawData, formatRupiah, branches }) {
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const filteredData = useMemo(() => {
     let data = rawData.filter(i => !i.isDeleted && i.tanggal && !i.tanggal.includes('*'));
     if (customStart || customEnd) {
         data = data.filter(item => {
             const parts = item.tanggal.replace(/,/g, '').trim().split(/\s+/);
             if (parts.length < 3) return false;
             const mStr = parts.length === 4 ? parts[2] : parts[1];
             const yStr = parts.length === 4 ? parts[3] : parts[2];
             const dStr = parts.length === 4 ? parts[1] : parts[0];
             
             const MONTH_MAP = { 'januari':'01', 'februari':'02', 'maret':'03', 'april':'04', 'mei':'05', 'juni':'06', 'juli':'07', 'agustus':'08', 'september':'09', 'oktober':'10', 'november':'11', 'desember':'12' };
             const itemDate = new Date(`${yStr}-${MONTH_MAP[mStr.toLowerCase()]}-${dStr.padStart(2,'0')}`);
             
             let isValid = true;
             // Validasi Tanggal (Start Date di set ke awal hari, End Date di set ke akhir hari)
             if (customStart) { const sd = new Date(customStart); sd.setHours(0,0,0,0); if (itemDate < sd) isValid = false; }
             if (customEnd) { const ed = new Date(customEnd); ed.setHours(23,59,59,999); if (itemDate > ed) isValid = false; }
             return isValid;
         });
     }
     return data;
  }, [rawData, customStart, customEnd]);

  const netTotal = useMemo(() => {
     let inc = 0, exp = 0;
     filteredData.forEach(i => { inc += (i.cash||0)+(i.bca||0)+(i.gofood||0); exp += (i.totalPengeluaran||0); });
     return { inc, exp, net: inc - exp };
  }, [filteredData]);

  const branchPerformance = useMemo(() => {
     const stats = {};
     branches.forEach(b => stats[b.sheetName] = { name: b.name, inc: 0, exp: 0 });
     filteredData.forEach(i => {
         if(stats[i.sheet]) {
             stats[i.sheet].inc += (i.cash||0)+(i.bca||0)+(i.gofood||0);
             stats[i.sheet].exp += (i.totalPengeluaran||0);
         }
     });
     return Object.values(stats).sort((a,b) => b.inc - a.inc);
  }, [filteredData, branches]);

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div><h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard Analisis Keuangan</h1></div>
        
        {/* FITUR FILTER TANGGAL CUSTOM (BARU) */}
        <div className="flex flex-wrap items-center gap-3 bg-white px-5 py-3 rounded-xl border border-gray-200 shadow-sm w-full xl:w-auto">
          <CalendarDays size={18} className="text-gray-400" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Dari:</span>
            <input type="date" className="bg-gray-50 text-sm font-bold text-gray-900 outline-none px-2 py-1 rounded focus:border-gray-900 transition-colors border border-transparent" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
          </div>
          <div className="w-px h-5 bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Sampai:</span>
            <input type="date" className="bg-gray-50 text-sm font-bold text-gray-900 outline-none px-2 py-1 rounded focus:border-gray-900 transition-colors border border-transparent" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
          </div>
          {(customStart || customEnd) && <button onClick={()=>{setCustomStart(''); setCustomEnd('');}} className="ml-2 px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors">Reset Filter</button>}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Pendapatan Kotor</p><h3 className="text-3xl font-black text-gray-900">{formatRupiah(netTotal.inc)}</h3></div>
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"><p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Total Pengeluaran (Inc. Tetap)</p><h3 className="text-3xl font-black text-red-600">{formatRupiah(netTotal.exp)}</h3></div>
        <div className={`p-6 rounded-3xl border shadow-xl relative overflow-hidden transition-all ${netTotal.net >= 0 ? 'bg-gray-900 border-gray-800' : 'bg-red-600 border-red-700'}`}>
            <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-2 relative z-10">{netTotal.net >= 0 ? 'Keuntungan Bersih (Net Profit)' : 'Minus / Defisit Berjalan'}</p>
            <h3 className="text-4xl font-black text-white relative z-10">{formatRupiah(netTotal.net)}</h3>
            {netTotal.net < 0 && <p className="text-xs text-white/80 mt-2 z-10 relative">Warning: Anda harus mengejar target omzet sebesar {formatRupiah(Math.abs(netTotal.net))} untuk Break-Even.</p>}
        </div>
      </div>

      <h3 className="text-lg font-black text-gray-900 mb-4">Perbandingan Performa Cabang</h3>
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-10">
         <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap min-w-[600px]">
               <thead className="bg-gray-50 border-b border-gray-100">
                  <tr className="text-xs text-gray-500 uppercase tracking-widest font-bold">
                     <th className="p-5">Nama Cabang</th>
                     <th className="p-5 text-right">Pendapatan Kotor</th>
                     <th className="p-5 text-right">Pengeluaran</th>
                     <th className="p-5 text-right">Laba Bersih</th>
                  </tr>
               </thead>
               <tbody>
                  {branchPerformance.map((b, i) => {
                     const profit = b.inc - b.exp;
                     return (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                           <td className="p-5 font-bold text-gray-900">{b.name}</td>
                           <td className="p-5 text-right font-black text-green-600">{formatRupiah(b.inc)}</td>
                           <td className="p-5 text-right font-black text-red-500">{formatRupiah(b.exp)}</td>
                           <td className="p-5 text-right font-black text-gray-900">
                              <span className={`px-3 py-1 rounded-xl text-xs ${profit >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{formatRupiah(profit)}</span>
                           </td>
                        </tr>
                     )
                  })}
               </tbody>
            </table>
         </div>
      </div>
      
      <h3 className="text-lg font-black text-gray-900 mb-4">Kalkulasi Bagi Hasil Keseluruhan</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Pihak 1: Bunda</p><p className="text-2xl font-black text-gray-900">60%</p></div><div className="text-right"><p className="text-xs font-medium text-gray-400 mb-1">Nominal Diterima</p><p className="text-2xl font-black text-green-600">{formatRupiah(netTotal.net * 0.6)}</p></div></div>
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-3xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow"><div><p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">Pihak 2: Meri</p><p className="text-2xl font-black text-gray-900">40%</p></div><div className="text-right"><p className="text-xs font-medium text-gray-400 mb-1">Nominal Diterima</p><p className="text-2xl font-black text-green-600">{formatRupiah(netTotal.net * 0.4)}</p></div></div>
      </div>
    </div>
  );
}

// ==========================================
// ADMIN: LAPORAN LAINNYA (ACTIVITY LOGS + DELETE MASSAL)
// ==========================================
function AdminOtherReportsView({ formatRupiah, filterCabang, appSettings, refreshParent }) {
  const [logs, setLogs] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeTabLog, setActiveTabLog] = useState('Semua');
  
  // STATE MULTI-DELETE
  const [selectedLogIds, setSelectedLogIds] = useState([]);
  const isMultiDeleteActive = appSettings.find(s => s.settingKey === 'multi_delete')?.isActive || false;

  const fetchLogs = async () => {
    setIsFetching(true);
    try {
      const res = await fetch(ACTIVITY_URL);
      const data = await res.json();
      setLogs(data);
    } catch (e) { console.error("Gagal ambil log aktivitas", e); }
    setIsFetching(false);
  };

  useEffect(() => { fetchLogs(); }, []);
  useEffect(() => { setSelectedLogIds([]); }, [activeTabLog, filterCabang]);

  const filteredLogs = useMemo(() => {
    let result = logs;
    if (filterCabang !== 'Semua') result = result.filter(log => log.sheet === filterCabang);
    if (activeTabLog !== 'Semua') result = result.filter(log => log.actionCategory === activeTabLog);
    return result;
  }, [logs, filterCabang, activeTabLog]);

  // FUNGSI HAPUS SATUAN (OPTIMISTIC)
  const handleDeleteLog = async (id, isHard = false) => {
    if (!window.confirm(isHard ? "🚨 HAPUS PERMANEN LOG INI?" : "Pindahkan log ke sampah?")) return;
    
    setLogs(prev => isHard ? prev.filter(l => l._id !== id) : prev.map(l => l._id === id ? { ...l, isDeleted: true } : l));
    
    try {
      const url = isHard ? `${ACTIVITY_URL}/hard/${id}` : `${ACTIVITY_URL}/${id}`;
      await fetch(url, { method: 'DELETE' });
      fetchLogs();
    } catch (e) { alert("Gagal hapus log!"); fetchLogs(); }
  };

  // FUNGSI HAPUS MASSAL
  const handleBulkDeleteLogs = async (isHard = false) => {
    if (!window.confirm(`Hapus ${isHard ? 'PERMANEN' : 'sementara'} ${selectedLogIds.length} log terpilih?`)) return;
    
    const idsToProcess = [...selectedLogIds];
    setSelectedLogIds([]); // Reset seleksi langsung biar UX cepet

    try {
      await fetch(`${ACTIVITY_URL}/bulk`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToProcess, isHardDelete: isHard })
      });
      fetchLogs();
    } catch (e) { alert("Gagal hapus massal!"); fetchLogs(); }
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto relative h-full">
      
      {/* FLOATING ACTION BAR MULTI-DELETE LOGS */}
      {selectedLogIds.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-md text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 z-[999] animate-in slide-in-from-bottom-10 border border-gray-700">
          <div className="flex items-center gap-3">
            <div className="bg-white text-gray-900 w-8 h-8 rounded-full flex items-center justify-center font-black text-sm">{selectedLogIds.length}</div>
            <span className="font-bold text-sm tracking-wide">Log Terpilih</span>
          </div>
          <div className="w-px h-6 bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <button onClick={() => handleBulkDeleteLogs(false)} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 whitespace-nowrap">
              <Trash2 size={14}/> Sampah
            </button>
            <button onClick={() => handleBulkDeleteLogs(true)} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-2 whitespace-nowrap">
              <AlertCircle size={14}/> Permanen
            </button>
          </div>
          <button onClick={() => setSelectedLogIds([])} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors text-gray-400 hover:text-white">
            <X size={18}/>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Laporan Sistem Realtime</h1>
          <p className="text-sm font-bold text-gray-500 mt-1">Manajemen Log Aktivitas, Stok, dan Perubahan Harga.</p>
        </div>
        <button onClick={fetchLogs} disabled={isFetching} className="flex items-center gap-2 bg-gray-900 hover:bg-black text-white px-5 py-3 rounded-xl shadow-lg font-black text-sm transition-all active:scale-95 disabled:opacity-50">
          <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} /> REFRESH LOG
        </button>
      </div>

      {/* TABS KELOMPOK LAPORAN */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-2 scrollbar-hide">
        {['Semua', 'UBAH_NAMA', 'UBAH_HARGA', 'UBAH_STOK', 'INFO_STOK'].map(tab => (
          <button key={tab} onClick={() => setActiveTabLog(tab)} className={`px-5 py-3 rounded-xl text-sm font-black whitespace-nowrap transition-all border-2 ${activeTabLog === tab ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-200 text-gray-500 hover:border-gray-400'}`}>
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden mb-20">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap min-w-[900px]">
            <thead className="bg-gray-50/80 border-b border-gray-100">
              <tr className="text-xs text-gray-400 uppercase tracking-widest font-bold">
                {isMultiDeleteActive && (
                  <th className="p-5 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                      checked={filteredLogs.length > 0 && selectedLogIds.length === filteredLogs.length}
                      onChange={(e) => {
                        if(e.target.checked) setSelectedLogIds(filteredLogs.map(l => l._id));
                        else setSelectedLogIds([]);
                      }}
                    />
                  </th>
                )}
                <th className="p-5 w-48">Waktu & Tanggal</th>
                <th className="p-5">Kategori / Cabang</th>
                <th className="p-5">Deskripsi Laporan</th>
                <th className="p-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr><td colSpan="5" className="p-10 text-center text-gray-400 font-bold">Belum ada riwayat aktivitas.</td></tr>
              ) : (
                filteredLogs.map((log) => {
                  const isDeleted = log.isDeleted;
                  const isSelected = selectedLogIds.includes(log._id);
                  let badgeClass = "bg-gray-100 text-gray-600";
                  if (log.actionCategory === 'UBAH_HARGA') badgeClass = "bg-blue-100 text-blue-700 border border-blue-200";
                  if (log.actionCategory === 'UBAH_NAMA') badgeClass = "bg-purple-100 text-purple-700 border border-purple-200";
                  if (log.actionCategory === 'UBAH_STOK') badgeClass = "bg-orange-100 text-orange-700 border border-orange-200";
                  if (log.actionCategory === 'INFO_STOK') badgeClass = "bg-red-100 text-red-700 border border-red-200 animate-pulse";
                  
                  return (
                    <tr key={log._id} className={`border-b border-gray-50 transition-colors ${isSelected ? 'bg-orange-50' : (isDeleted ? 'bg-red-50/30' : 'hover:bg-gray-50')}`}>
                      {isMultiDeleteActive && (
                        <td className="p-5 text-center">
                          <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedLogIds(prev => prev.includes(log._id) ? prev.filter(id => id !== log._id) : [...prev, log._id]);
                            }}
                          />
                        </td>
                      )}
                      <td className="p-5">
                        <p className={`font-black ${isDeleted ? 'text-red-400 line-through' : 'text-gray-900'}`}>{log.timestamp || 'N/A'}</p>
                        <p className="text-[10px] font-bold text-gray-400 mt-1">{log.dateString}</p>
                      </td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${badgeClass}`}>{log.actionCategory.replace('_', ' ')}</span>
                        <p className="text-[10px] font-bold text-gray-500 mt-2"><Store size={10} className="inline mr-1"/> {log.sheet}</p>
                      </td>
                      <td className="p-5">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Menu: <span className="text-gray-900">{log.menuName}</span></p>
                        <p className={`text-sm font-bold ${isDeleted ? 'text-red-400' : 'text-gray-700'} whitespace-normal break-words`}>{log.detailAction}</p>
                      </td>
                      <td className="p-5 text-center">
                        {isDeleted ? (
                          <button onClick={() => handleDeleteLog(log._id, true)} className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-lg shadow-sm hover:bg-red-700 transition-all">PERMANEN</button>
                        ) : (
                          <button onClick={() => handleDeleteLog(log._id, false)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 size={18}/>
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. KITCHEN VIEW (TAMPILAN DAPUR SUPER RESPONSIVE & FLOW MASAK)
// ==========================================
function KitchenView({ branchInfo, onLogout }) {
    const [orders, setOrders] = useState([]);
    const [isFetching, setIsFetching] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('Semua');

    // Kategori Filter Dapur (DITAMBAH 'Di Hapus')
    const FILTER_TABS = ['Semua', 'Belum Bayar', 'Belum Di Terima', 'Terima Pesanan', 'Pesanan Selesai', 'Di Hapus'];

    // Simpan Status Pesanan di LocalStorage Tablet Dapur (PENDING | COOKING | DONE)
    const [orderStatuses, setOrderStatuses] = useState(() => {
        try { const saved = localStorage.getItem(`kitchen_flow_${branchInfo.id}`); return saved ? JSON.parse(saved) : {}; } 
        catch(e) { return {}; }
    });

    useEffect(() => {
        localStorage.setItem(`kitchen_flow_${branchInfo.id}`, JSON.stringify(orderStatuses));
    }, [orderStatuses, branchInfo.id]);

    const fetchKitchenData = async () => {
        setIsFetching(true);
        try {
            const res = await fetch(`${API_URL}?sheet=${encodeURIComponent(branchInfo.sheetName)}`);
            const data = await res.json();
            
            const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
            
            const parsedOrders = data.filter(item => {
                // isDeleted TIDAK LAGI DI-RETURN FALSE SECARA MUTLAK, DIBIARKAN LOLOS UNTUK TAB DI HAPUS
                if (item.tanggal !== todayStr) return false; // Hanya hari ini
                if (item.totalPengeluaran > 0) return false; // Abaikan data operasional
                return true;
            }).map(item => {
                const isUnpaid = item.jenisPengeluaran.includes('[UNPAID]');
                let rawJenis = item.jenisPengeluaran.replace('[UNPAID] ', '').trim();
                let queueStr = rawJenis.split(']')[0].replace('[', '');
                let itemsStr = rawJenis.split(']')[1] || '';
                
                return {
                    _id: item._id,
                    queue: queueStr,
                    items: itemsStr.split(',').map(i => i.trim()).filter(i => i),
                    isUnpaid: isUnpaid,
                    isDeleted: item.isDeleted, // Bawa status deleted dari backend
                    time: new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
                    rawDate: new Date(item.createdAt)
                };
            });

            parsedOrders.sort((a, b) => a.rawDate - b.rawDate);
            setOrders(parsedOrders);
        } catch (error) { console.error(error); }
        setIsFetching(false);
    };

    // Auto Refresh Tiap 10 Detik
    useEffect(() => {
        fetchKitchenData();
        const interval = setInterval(() => {
            fetchKitchenData();
            setCurrentTime(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    // Aksi Flow Pesanan
    const handleAcceptOrder = (id) => setOrderStatuses(prev => ({...prev, [id]: 'COOKING'}));
    const handleFinishOrder = (id) => setOrderStatuses(prev => ({...prev, [id]: 'DONE'}));

    // Toggle Layar Penuh
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(err => console.log(err)); setIsFullscreen(true); } 
        else { document.exitFullscreen(); setIsFullscreen(false); }
    };

    // Logika Filter Data (DIPERBARUI)
    const displayOrders = orders.filter(o => {
        const status = orderStatuses[o._id] || 'PENDING';
        
        // Kalau difilter 'Di Hapus', khusus tampilin yang di delete kasir
        if (activeFilter === 'Di Hapus') return o.isDeleted === true;
        
        // Untuk filter lainnya, JANGAN tampilkan data yang sudah dihapus
        if (o.isDeleted) return false;

        if (activeFilter === 'Semua') return status !== 'DONE'; 
        if (activeFilter === 'Belum Bayar') return o.isUnpaid && status !== 'DONE';
        if (activeFilter === 'Belum Di Terima') return status === 'PENDING';
        if (activeFilter === 'Terima Pesanan') return status === 'COOKING';
        if (activeFilter === 'Pesanan Selesai') return status === 'DONE';
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
            {/* HEADER KITCHEN */}
            <div className="bg-white p-4 sm:p-5 flex flex-col md:flex-row justify-between items-center border-b border-gray-200 shadow-sm shrink-0 sticky top-0 z-30 gap-4">
                <div className="flex items-center justify-between w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center border border-orange-200">
                            <Utensils size={24} className="text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gray-900 leading-tight">Dapur KDS</h1>
                            <p className="text-xs font-bold text-orange-600 tracking-widest uppercase">{branchInfo.name}</p>
                        </div>
                    </div>
                    {/* Jam Untuk Mobile */}
                    <div className="md:hidden text-right">
                        <p className="text-2xl font-black text-gray-900">{currentTime}</p>
                    </div>
                </div>

                {/* FILTER TABS (SCROLLABLE DI MOBILE) */}
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-hide">
                    {FILTER_TABS.map(tab => {
                        // Bikin tab "Di Hapus" warna merah kalau aktif biar jelas
                        const isDeleteTab = tab === 'Di Hapus';
                        const activeClass = isDeleteTab ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-gray-900 border-gray-900 text-white shadow-md';
                        const inactiveClass = 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50';
                        return (
                            <button key={tab} onClick={() => setActiveFilter(tab)} className={`px-4 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all border-2 ${activeFilter === tab ? activeClass : inactiveClass}`}>
                                {tab}
                            </button>
                        );
                    })}
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <div className="text-right pr-4 border-r border-gray-200">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-black">Waktu Live</p>
                        <p className="text-2xl font-black text-gray-900 leading-none mt-1">{currentTime}</p>
                    </div>
                    <button onClick={toggleFullscreen} className="p-3 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-xl transition-colors border border-gray-200 tooltip" title="Layar Penuh">
                        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                    </button>
                    <button onClick={fetchKitchenData} className={`p-3 rounded-xl transition-all border ${isFetching ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-600'}`}>
                        <RefreshCw size={20} className={isFetching ? "animate-spin" : ""} />
                    </button>
                    <button onClick={onLogout} className="p-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-colors flex items-center gap-2">
                        <LogOut size={20} /> <span className="text-sm font-bold hidden lg:block">Keluar</span>
                    </button>
                </div>
            </div>

            {/* MAIN GRID */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
                {displayOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 animate-in fade-in">
                        <CheckCircle2 size={72} className="mb-4 opacity-20" />
                        <h2 className="text-3xl font-black text-gray-300">Tidak Ada Pesanan</h2>
                        <p className="font-bold mt-2">Filter '{activeFilter}' kosong. Koki bisa santai dulu!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 animate-in slide-in-from-bottom-8 duration-500">
                        {displayOrders.map((order) => {
                            const status = orderStatuses[order._id] || 'PENDING';
                            
                            // Psikologi Warna & Style Berdasarkan Status
                            let cardStyle = "bg-white border-gray-200";
                            let headerStyle = "bg-gray-50 border-gray-100";
                            
                            if (order.isDeleted) {
                                // Style khusus pesanan yang dihapus kasir
                                cardStyle = "bg-gray-100 border-red-300 opacity-80 grayscale-[50%]";
                                headerStyle = "bg-red-100/50 border-red-200";
                            } else {
                                if (status === 'COOKING') { cardStyle = "bg-yellow-50/50 border-yellow-300 shadow-[0_0_15px_rgba(253,224,71,0.4)]"; headerStyle = "bg-yellow-100/50 border-yellow-200"; }
                                if (status === 'DONE') { cardStyle = "bg-gray-50 border-gray-200 opacity-60 grayscale-[30%]"; headerStyle = "bg-gray-100 border-gray-200"; }
                                if (order.isUnpaid && status !== 'DONE') { cardStyle = "bg-red-50/30 border-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]"; headerStyle = "bg-red-100/50 border-red-200"; }
                            }

                            return (
                                <div key={order._id} className={`flex flex-col rounded-[2rem] overflow-hidden shadow-lg border-2 transition-all hover:scale-[1.01] ${cardStyle}`}>
                                    
                                    {/* Card Header */}
                                    <div className={`p-4 sm:p-5 flex justify-between items-start border-b ${headerStyle}`}>
                                        <div>
                                            <div className="flex gap-2 mb-2">
                                                {order.isDeleted ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-red-600 text-white border-red-800">
                                                        <Trash2 size={12}/> DIBATALKAN KASIR
                                                    </span>
                                                ) : order.isUnpaid ? (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-red-100 text-red-600 border-red-300 animate-pulse">
                                                        <AlertCircle size={12}/> BELUM BAYAR
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border bg-green-100 text-green-700 border-green-200">
                                                        <CheckCircle size={12}/> LUNAS
                                                    </span>
                                                )}
                                                
                                                {!order.isDeleted && (
                                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${status === 'COOKING' ? 'bg-yellow-200 text-yellow-800 border-yellow-400' : status === 'DONE' ? 'bg-gray-200 text-gray-600 border-gray-300' : 'bg-blue-100 text-blue-700 border-blue-200'}`}>
                                                        {status === 'COOKING' ? 'SEDANG DIMASAK' : status === 'DONE' ? 'SELESAI' : 'MENUNGGU'}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className={`text-2xl sm:text-3xl font-black leading-tight ${order.isDeleted ? 'text-red-700 line-through' : 'text-gray-900'}`}>
                                                {order.queue}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-black bg-white px-2 py-1 rounded-lg border border-gray-200 text-gray-600 shadow-sm">
                                                {order.time}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Card Body (Daftar Menu) */}
                                    <div className="p-4 sm:p-6 flex-1 bg-inherit">
                                        <ul className="space-y-4">
                                            {order.items.map((item, idx) => {
                                                const qtyMatch = item.match(/^(\d+)x\s(.*)/);
                                                const qty = qtyMatch ? qtyMatch[1] : '';
                                                const name = qtyMatch ? qtyMatch[2] : item;

                                                return (
                                                    <li key={idx} className={`flex items-start gap-4 ${order.isDeleted ? 'opacity-50 line-through' : ''}`}>
                                                        {qty && <span className="text-2xl font-black text-gray-900 min-w-[2.5rem] bg-white text-center rounded-xl border border-gray-200 py-1 shadow-sm">{qty}x</span>}
                                                        <span className="text-lg font-bold text-gray-700 leading-tight pt-1.5">{name}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>

                                    {/* Card Footer (Action Flow) */}
                                    <div className="p-4 sm:p-5 pt-0 mt-auto">
                                        {order.isDeleted ? (
                                            <button disabled className="w-full py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-2 bg-red-100 text-red-500 border-2 border-red-200">
                                                <X size={24} /> STOP MASAK (DIBATALKAN)
                                            </button>
                                        ) : status === 'PENDING' ? (
                                            <button onClick={() => handleAcceptOrder(order._id)} className="w-full py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg bg-blue-600 hover:bg-blue-700 text-white border-b-4 border-blue-800">
                                                <Play size={24} fill="currentColor" /> 1. TERIMA PESANAN
                                            </button>
                                        ) : status === 'COOKING' ? (
                                            order.isUnpaid ? (
                                                <button disabled className="w-full py-5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 bg-red-50 text-red-600 border-2 border-red-200 opacity-90 cursor-not-allowed">
                                                    <AlertCircle size={20} /> DILARANG SELESAIKAN (TANYA KASIR, BELUM BAYAR)
                                                </button>
                                            ) : (
                                                <button onClick={() => handleFinishOrder(order._id)} className="w-full py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg bg-green-500 hover:bg-green-600 text-white border-b-4 border-green-700">
                                                    <CheckCircle2 size={24} /> 2. SELESAIKAN PESANAN
                                                </button>
                                            )
                                        ) : (
                                            <button disabled className="w-full py-5 rounded-2xl text-lg font-black flex items-center justify-center gap-2 bg-gray-200 text-gray-400 border-2 border-gray-300">
                                                <CheckCircle2 size={24} /> PESANAN SELESAI
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// 5. ADMIN: PROGRESS PENJUALAN ITEM (SUPER AKURAT SYNC, SNAPSHOT & HISTORY SAVE)
// ==========================================
function AdminItemProgressView({ rawData, branchInfo, onBack, formatRupiah, targetDate }) {
    const [masterMenus, setMasterMenus] = useState([]);
    const [historicalData, setHistoricalData] = useState(null);
    const [activityLogs, setActivityLogs] = useState([]); 
    const [isFetching, setIsFetching] = useState(true);
    const [isManualSyncing, setIsManualSyncing] = useState(false);

    const MENU_MM = [
        { id: 'rendang', name: 'Rendang', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'dendeng', name: 'Dendeng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'kikil', name: 'Kikil', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'ayambakar', name: 'Ayam Bakar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'] },
        { id: 'ayamgoreng', name: 'Ayam Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'] },
        { id: 'ayamgulai', name: 'Ayam Gulai', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'] },
        { id: 'ikanbawal-bakar', name: 'Ikan Bawal Bakar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'ikansalam-bakar', name: 'Ikan Salam Bakar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'ikansalam-goreng', name: 'Ikan Salam Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'ikantongkol-goreng', name: 'Ikan Tongkol Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'ikantongkol-gulaikuning', name: 'Ikan Tongkol Gulai Kuning', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'ikantongkol-asampedas', name: 'Ikan Tongkol Asam Pedas', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'lele-goreng', name: 'Lele Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'telur-dadar', name: 'Telur Dadar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'telur-balado', name: 'Telur Balado', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'ati-ampela', name: 'Ati Ampela', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'perkedel', name: 'Perkedel', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'pkt-rendang', name: 'Nasi Rames + Rendang', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-dendeng', name: 'Nasi Rames + Dendeng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-kikil', name: 'Nasi Rames + Kikil', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-ayambakar', name: 'Nasi Rames + Ayam Bakar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', hasVariants: ['Paha', 'Dada'] },
        { id: 'pkt-ayamgoreng', name: 'Nasi Rames + Ayam Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', hasVariants: ['Paha', 'Dada'] },
        { id: 'pkt-ayamgulai', name: 'Nasi Rames + Ayam Gulai', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', hasVariants: ['Paha', 'Dada'] },
        { id: 'pkt-ikanbawal-bakar', name: 'Nasi Rames + Ikan Bawal Bakar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-ikansalam-bakar', name: 'Nasi Rames + Ikan Salam Bakar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-ikansalam-goreng', name: 'Nasi Rames + Ikan Salam Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-ikantongkol-goreng', name: 'Nasi Rames + Ikan Tongkol Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-ikantongkol-gulaikuning', name: 'Nasi Rames + Ikan Tongkol Gulai Kuning', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-ikantongkol-asampedas', name: 'Nasi Rames + Ikan Tongkol Asam Pedas', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-lele-goreng', name: 'Nasi Rames + Lele Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-telur-dadar', name: 'Nasi Rames + Telur Dadar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-telur-balado', name: 'Nasi Rames + Telur Balado', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-ati-ampela', name: 'Nasi Rames + Ati Ampela', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'pkt-perkedel', name: 'Nasi Rames + Perkedel', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200' },
        { id: 'esteh', name: 'Es Teh', price: 4000, category: 'Minuman', bg: 'bg-green-50 hover:bg-green-100 border-green-200' },
        { id: 'esjeruk', name: 'Es Jeruk', price: 6000, category: 'Minuman', bg: 'bg-green-50 hover:bg-green-100 border-green-200' }
    ];

    const MENU_PLCI = [
        { id: 'lele', name: 'Lele Goreng', price: 15000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'ayam', name: 'Ayam Goreng', price: 17000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'] },
        { id: 'tahu', name: 'Tahu', price: 3000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'tempe', name: 'Tempe', price: 3000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'ati', name: 'Ati Ampela', price: 6000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'usus', name: 'Sate Usus', price: 3000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'nasi', name: 'Nasi Putih', price: 5000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'sambal', name: 'Extra Sambal', price: 2000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200' },
        { id: 'paket-lele', name: 'Paket Nasi Lele', price: 18000, category: 'Paketan', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
        { id: 'paket-ayam', name: 'Paket Nasi Ayam', price: 23000, category: 'Paketan', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200', hasVariants: ['Paha', 'Dada'] }
    ];

    const isToday = targetDate === new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

    useEffect(() => {
        const fetchData = async () => {
            setIsFetching(true);
            try {
                const fetchSheet = branchInfo.sheetName === 'Semua' ? 'MM Kantin SMB' : branchInfo.sheetName;
                
                const resMenu = await fetch(`${MENU_MASTER_URL}?sheet=${encodeURIComponent(fetchSheet)}`);
                const menuData = await resMenu.json();
                setMasterMenus(menuData);

                const resProg = await fetch(`https://backend-mm-v2.vercel.app/api/progress?sheet=${encodeURIComponent(branchInfo.sheetName)}&tanggal=${encodeURIComponent(targetDate)}`);
                const progData = await resProg.json();
                setHistoricalData(progData);

                const resLogs = await fetch(ACTIVITY_URL);
                const logsData = await resLogs.json();
                setActivityLogs(logsData);

            } catch (e) { console.error("Gagal load data integrasi", e); }
            setIsFetching(false);
        };
        fetchData();
    }, [branchInfo, targetDate]);


    const liveProgressDataGroups = useMemo(() => {
        if (!masterMenus.length || !activityLogs.length) return [];
        
        const targetTransactions = rawData.filter(t => 
            t.tanggal === targetDate && 
            !t.isDeleted && 
            t.totalPengeluaran === 0 && 
            !(t.jenisPengeluaran || '').includes('[LAPORAN SISTEM]') && 
            !(t.jenisPengeluaran || '').includes('[UNPAID]')
        );

        const targetLogs = activityLogs.filter(l => 
            l.dateString === targetDate && 
            !l.isDeleted && 
            l.actionCategory === 'UBAH_STOK' &&
            (branchInfo.sheetName === 'Semua' ? true : l.sheet === branchInfo.sheetName)
        );

        const soldItemsMap = {};
        targetTransactions.forEach(tx => {
            const rawItemsStr = tx.jenisPengeluaran ? tx.jenisPengeluaran.split('] ')[1] : '';
            const itemArray = (rawItemsStr || '').split(',').map(i => i.trim()).filter(i => i && !i.startsWith('**') && !i.startsWith('++'));

            itemArray.forEach(str => {
                const parts = str.split('::');
                const mainItem = parts[0].trim();
                const match = mainItem.match(/^(\d+)x\s(.*)/);
                if (match) {
                    const qty = parseInt(match[1], 10);
                    const name = match[2].trim().toLowerCase(); 
                    if (!soldItemsMap[name]) soldItemsMap[name] = 0;
                    soldItemsMap[name] += qty;
                }
            });
        });

        const BASE_MENU_LIST = branchInfo.brand === 'minang' ? MENU_MM : MENU_PLCI;
        
        // KUNCI PERUBAHAN: HAPUS FILTER BYPASS NASI/USUS/SAMBAL AGAR MEREKA MUNCUL!
        const activeMenus = BASE_MENU_LIST.map(baseItem => {              
            let stockRefId = baseItem.id;
            if (stockRefId.startsWith('pkt-')) stockRefId = stockRefId.replace('pkt-', '');
            else if (stockRefId.startsWith('paket-')) stockRefId = stockRefId.replace('paket-', '');

            const dbItemSelf = masterMenus.find(m => m.menuId === baseItem.id);

            return {
                id: baseItem.id,
                name: dbItemSelf ? dbItemSelf.name : baseItem.name,
                price: dbItemSelf ? dbItemSelf.price : baseItem.price,
                stockRefId: stockRefId,
                category: baseItem.category
            };
        });

        const sortedMenus = [...activeMenus].sort((a, b) => b.name.length - a.name.length);
        const groups = {};

        activeMenus.forEach(menu => {
            if (!groups[menu.stockRefId]) {
                const baseMenu = activeMenus.find(m => m.id === menu.stockRefId) || menu;
                
                // FLAG KHUSUS UNTUK ITEM TANPA STOK
                const isUnlimited = ['nasi', 'usus', 'sambal'].includes(menu.stockRefId);
                
                let totalStokInput = 0;
                let historyStok = [];
                
                // Kalkulasi Log Stok (Hanya valid untuk yang isUnlimited === false)
                if (!isUnlimited) {
                    targetLogs.forEach(log => {
                        if (log.menuName.toLowerCase() === baseMenu.name.toLowerCase()) {
                            const match = log.detailAction.match(/dari \[([^\]]+)\] menjadi \[(\d+)\]/);
                            if (match) {
                                const oldStr = match[1];
                                const oldVal = oldStr.includes('HABIS') ? 0 : parseInt(oldStr, 10);
                                const newVal = parseInt(match[2], 10);
                                const diff = newVal - oldVal;
                                
                                if (diff !== 0) {
                                    totalStokInput += diff;
                                    historyStok.push({ qty: diff, time: log.timestamp });
                                }
                            }
                        }
                    });
                }

                groups[menu.stockRefId] = {
                    id: menu.stockRefId,
                    baseName: baseMenu.name,
                    basePrice: baseMenu.price,
                    isUnlimited: isUnlimited, // Bawa flag ini ke rendering card
                    stokAwal: totalStokInput,
                    stockHistory: historyStok,
                    terjualTotal: 0,
                    realitaTotal: 0,
                    targetNominal: 0,
                    sisaNominal: 0,
                    sisaStok: 0,
                    details: []
                };
            }
        });

        Object.entries(soldItemsMap).forEach(([soldName, qty]) => {
            if (qty <= 0) return;
            const menuMatch = sortedMenus.find(m => soldName.includes(m.name.toLowerCase()));
            if (menuMatch) {
                const realita = qty * menuMatch.price;
                const pool = groups[menuMatch.stockRefId];
                
                pool.details.push({
                    name: soldName,
                    qty: qty,
                    price: menuMatch.price,
                    realita: realita
                });

                pool.terjualTotal += qty;
                pool.realitaTotal += realita;
            }
        });

        const finalData = Object.values(groups).map(pool => {
            // LOGIKA PINTAR: JIKA UNLIMITED, TARGET = REALITA, SISA = 0
            if (pool.isUnlimited) {
                pool.sisaStok = 0;
                pool.sisaNominal = 0;
                pool.targetNominal = pool.realitaTotal;
            } else {
                pool.sisaStok = pool.stokAwal - pool.terjualTotal;
                pool.sisaNominal = pool.sisaStok * pool.basePrice;
                pool.targetNominal = pool.stokAwal * pool.basePrice;
            }
            return pool;
        });

        // Selalu tampilkan jika Unlimited, jika tidak pastikan ada input stok atau terjual
        return finalData.filter(pool => pool.isUnlimited || pool.stokAwal > 0 || pool.terjualTotal > 0).sort((a, b) => b.targetNominal - a.targetNominal);

    }, [rawData, masterMenus, activityLogs, targetDate, branchInfo.brand, branchInfo.sheetName]);

    const liveGrandTotals = useMemo(() => {
        return liveProgressDataGroups.reduce((acc, curr) => {
            acc.target += curr.targetNominal;
            acc.realita += curr.realitaTotal;
            if (curr.sisaNominal > 0) acc.kurang += curr.sisaNominal;
            return acc;
        }, { target: 0, realita: 0, kurang: 0 });
    }, [liveProgressDataGroups]);

    const progressDataGroups = isToday ? liveProgressDataGroups : (historicalData?.dataGroups || []);
    const grandTotals = isToday ? liveGrandTotals : (historicalData?.grandTotals || { target: 0, realita: 0, kurang: 0 });

    useEffect(() => {
        if (!isToday || progressDataGroups.length === 0) return;
        const timer = setTimeout(() => {
            fetch("https://backend-mm-v2.vercel.app/api/progress", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sheet: branchInfo.sheetName,
                    tanggal: targetDate,
                    dataGroups: progressDataGroups,
                    grandTotals: grandTotals,
                    lastSync: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                })
            }).catch(e => console.log("Gagal auto-sync progress", e));
        }, 2000); 

        return () => clearTimeout(timer);
    }, [progressDataGroups, grandTotals, isToday, branchInfo.sheetName, targetDate]);

    const handleManualLockData = async () => {
        if (!window.confirm("Yakin ingin TUTUP BUKU hari ini? \n\nSemua data Target, Realita, Sisa, dan Detail akan disimpan permanen sebagai Histori yang tidak akan berubah.")) return;
        
        setIsManualSyncing(true);
        try {
            await fetch("https://backend-mm-v2.vercel.app/api/progress", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sheet: branchInfo.sheetName,
                    tanggal: targetDate,
                    dataGroups: liveProgressDataGroups,
                    grandTotals: liveGrandTotals,
                    lastSync: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                })
            });
            alert("✅ DATA BERHASIL DIKUNCI! \n\nSeluruh rincian Target, Realita, Sisa Stok, dan Histori hari ini telah tersimpan permanen di Database untuk dilihat besok.");
        } catch (e) {
            alert("❌ Gagal menyimpan data permanen. Cek koneksi internet!");
        }
        setIsManualSyncing(false);
    };


    if (isFetching) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 animate-in fade-in py-20">
                <Loader2 size={48} className="animate-spin mb-4 text-blue-500" />
                <p className="font-bold tracking-widest uppercase">Mempersiapkan Database Akurat...</p>
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500 w-full pb-20">
            
            {/* Header Laporan Full Screen */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 border-b border-gray-200 pb-6 gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <button onClick={onBack} className="p-2 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors shadow-sm active:scale-95"><ArrowLeft size={20}/></button>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Progress Item & Integrasi Stok</h1>
                    </div>
                    <p className="text-sm font-bold text-gray-500 sm:ml-12 flex items-center flex-wrap gap-2">
                        Laporan Tanggal: <span className="text-gray-900 font-black">{targetDate}</span> 
                        {isToday ? (
                            <span className="text-green-500 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1 shadow-sm"><Activity size={12}/> LIVE HARI INI</span>
                        ) : (
                            <span className="text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200 flex items-center gap-1 shadow-sm"><History size={12}/> TERSIMPAN DI DATABASE (SNAPSHOT)</span>
                        )}
                    </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                    {isToday && (
                        <button onClick={handleManualLockData} disabled={isManualSyncing} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg font-black flex items-center gap-2 active:scale-95 transition-all border-b-4 border-blue-800 disabled:opacity-50">
                            {isManualSyncing ? <Loader2 size={18} className="animate-spin"/> : <Save size={18}/>}
                            {isManualSyncing ? 'MENYIMPAN...' : 'TUTUP BUKU & KUNCI DATA'}
                        </button>
                    )}

                    {!isToday && historicalData && (
                        <div className="bg-white px-4 py-2 border border-gray-200 rounded-xl shadow-sm">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Data Terakhir Disinkronkan</p>
                            <p className="text-sm font-bold text-gray-900 flex items-center gap-1"><CheckCircle2 size={14} className="text-green-500"/> Jam {historicalData.lastSync || '23:59'}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Grand Totals Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><Target size={16} className="text-blue-500"/> Target Total Keseluruhan</p>
                    <h3 className="text-3xl font-black text-gray-900 mt-2">{formatRupiah(grandTotals.target)}</h3>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-3xl border border-green-200 shadow-sm flex flex-col justify-center">
                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1 flex items-center gap-2"><BarChart3 size={16} className="text-green-600"/> Tercapai (Realita)</p>
                    <h3 className="text-3xl font-black text-green-700 mt-2">{formatRupiah(grandTotals.realita)}</h3>
                </div>
                <div className={`p-6 rounded-3xl border shadow-sm flex flex-col justify-center ${isToday ? 'bg-gradient-to-br from-red-50 to-white border-red-200' : 'bg-gray-100 border-gray-200 opacity-60'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-2 ${isToday ? 'text-red-500' : 'text-gray-500'}`}><Activity size={16}/> {isToday ? 'Kekurangan Uang' : 'Kekurangan (Histori Tidak Dihitung)'}</p>
                    <h3 className={`text-3xl font-black mt-2 ${isToday ? 'text-red-600' : 'text-gray-500'}`}>{isToday ? formatRupiah(grandTotals.kurang) : 'Rp 0'}</h3>
                </div>
            </div>

            {/* Grid List Per Base Item */}
            {progressDataGroups.length === 0 ? (
                <div className="w-full py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <TargetIcon size={64} className="mb-4 text-gray-300" />
                    <p className="text-xl font-black text-gray-500 tracking-widest uppercase">TIDAK ADA DATA PROGRESS DI TANGGAL INI</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {progressDataGroups.map(pool => (
                        <div key={pool.id} className="bg-white rounded-[2rem] border border-gray-200 shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group">
                            
                            {/* Card Header: Info Pool Stok */}
                            <div className="bg-gray-50 border-b border-gray-100 p-5 sm:p-6 flex flex-col justify-between items-start transition-colors group-hover:bg-blue-50/30">
                                <div className="flex justify-between items-start w-full">
                                    <div>
                                        <h3 className="font-black text-xl text-gray-900 capitalize leading-tight flex items-center gap-2">
                                            <Utensils size={18} className="text-blue-500"/> {pool.baseName}
                                        </h3>
                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
                                            Harga Jual Base: <span className="text-gray-900 ml-1">{formatRupiah(pool.basePrice)}</span>
                                        </p>
                                    </div>
                                    {isToday && (
                                        <div className="text-right">
                                            {pool.isUnlimited ? (
                                                <span className="font-black text-sm px-4 py-1.5 rounded-xl border shadow-sm bg-blue-100 text-blue-700 border-blue-200">
                                                    NON-STOK
                                                </span>
                                            ) : (
                                                <span className={`font-black text-sm px-4 py-1.5 rounded-xl border shadow-sm ${pool.sisaStok <= 0 ? 'bg-gray-900 text-white border-gray-900' : 'bg-orange-100 text-orange-700 border-orange-200'}`}>
                                                    {pool.sisaStok <= 0 ? 'SOLD OUT' : `${pool.sisaStok} SISA`}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* BUNGKUSAN KHUSUS ITEM DENGAN STOK */}
                                {!pool.isUnlimited && (
                                    <>
                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                                Stok Awal Terintegrasi: <span className="text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-sm text-xs ml-1">{pool.stokAwal} Pcs</span>
                                            </p>
                                            {pool.lastRestockTime && pool.lastRestockTime !== '-' && (
                                                <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Clock size={10}/> Jam Input: {pool.lastRestockTime}
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-5 w-full bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                            <div className="bg-gray-100 p-2 text-center border-b border-gray-200">
                                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center justify-center gap-1"><Clock size={12}/> Detail Input Stok Harian</span>
                                            </div>
                                            {!pool.stockHistory || pool.stockHistory.length === 0 ? (
                                                <p className="text-xs font-bold text-gray-400 italic text-center py-3">- Tidak ada log input di laporan -</p>
                                            ) : (
                                                <table className="w-full text-xs font-bold text-gray-700">
                                                    <thead className="bg-gray-50">
                                                        <tr className="text-[10px] text-gray-500 uppercase">
                                                            <th className="py-2 px-4 text-left border-b border-gray-200">Jumlah Stok</th>
                                                            <th className="py-2 px-4 text-right border-b border-gray-200">Jam Input</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pool.stockHistory.map((sh, idx) => (
                                                            <tr key={idx} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                                                                <td className="py-2 px-4 text-left font-black">
                                                                    <span className={`px-2.5 py-0.5 rounded border ${sh.qty > 0 ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-500 border-red-200'}`}>
                                                                        {sh.qty > 0 ? `+${sh.qty}` : sh.qty}
                                                                    </span>
                                                                </td>
                                                                <td className="py-2 px-4 text-right text-gray-500">{sh.time}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-100 border-t-2 border-gray-200">
                                                        <tr>
                                                            <td className="py-2 px-4 font-black text-gray-900 uppercase tracking-wider text-[10px]">TOTAL STOK KESELURUHAN:</td>
                                                            <td className="py-2 px-4 text-right font-black text-blue-600">{pool.stokAwal} Pcs</td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Card Body: Breakdown Varian yg Laku */}
                            <div className="p-5 sm:p-6 flex-1 bg-white">
                                <ul className="space-y-4">
                                    {pool.details.length === 0 ? (
                                        <li className="text-sm font-bold text-gray-400 italic text-center py-4">- Belum ada varian yang laku -</li>
                                    ) : (
                                        pool.details.sort((a,b) => b.qty - a.qty).map((detail, i) => (
                                            <li key={i} className="flex justify-between items-center border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                                                <div>
                                                    <p className="font-bold text-gray-800 text-sm md:text-base capitalize leading-tight">{detail.name}</p>
                                                    <p className="text-[10px] sm:text-xs font-bold text-gray-400 mt-1">Harga: {formatRupiah(detail.price)} <span className="mx-1">x</span> <span className="text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">{detail.qty} Laku</span></p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-black text-green-600 text-lg">{formatRupiah(detail.realita)}</p>
                                                </div>
                                            </li>
                                        ))
                                    )}
                                </ul>
                            </div>

                            {/* Card Footer: Summary Target & Kekurangan per Pool */}
                            <div className="bg-gray-900 p-5 sm:p-6 mt-auto flex justify-between items-center border-t-4 border-gray-950">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Realita Terjual</p>
                                    <p className="text-2xl font-black text-green-400">{formatRupiah(pool.realitaTotal)}</p>
                                </div>
                                {isToday && !pool.isUnlimited && pool.sisaNominal !== 0 && (
                                    <div className="text-right">
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center justify-end gap-1 ${pool.sisaNominal > 0 ? 'text-gray-400' : 'text-blue-400'}`}>
                                            <AlertCircle size={10}/> {pool.sisaNominal > 0 ? 'Potensi Hilang' : 'Over-Sale (Cek Stok)'}
                                        </p>
                                        <p className={`text-xl font-black ${pool.sisaNominal > 0 ? 'text-red-400' : 'text-blue-400'}`}>{formatRupiah(Math.abs(pool.sisaNominal))}</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PasarSenenInputView({ branchInfo, onLogout, formatRupiah }) {
  const [step, setStep] = useState(1);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // KEY UNTUK LOCAL STORAGE (Spesifik per cabang biar gak bentrok)
  const DRAFT_KEY = `draft_senen_${branchInfo.id}`;

  // 1. INITIALIZATION & AMBIL DATA (CEK LOCAL STORAGE DULU)
  useEffect(() => {
    const fetchModalPrices = async () => {
      try {
        const todayStr = new Date().toLocaleDateString('id-ID');
        
        // CEK DRAFT DI HP/TABLET KASIR
        const savedDraft = localStorage.getItem(DRAFT_KEY);
        if (savedDraft) {
            const draftParsed = JSON.parse(savedDraft);
            // Validasi: Pastikan draft ini adalah draft hari ini. Kalau hari beda, buang!
            if (draftParsed.tanggal === todayStr) {
                setItems(draftParsed.items);
                setStep(draftParsed.step);
                setIsLoading(false);
                return; // Langsung keluar dari fungsi, pakai data draft
            } else {
                localStorage.removeItem(DRAFT_KEY); // Hapus draft basi kemarin
            }
        }

        // JIKA TIDAK ADA DRAFT HARI INI, TETAP FETCH DARI DATABASE SEPERTI BIASA
        const res = await fetch(MODAL_SENEN_URL);
        const modalData = await res.json();
        
        const MENU_MM = [
           { id: 'rendang', name: 'Rendang' }, { id: 'dendeng', name: 'Dendeng' }, { id: 'kikil', name: 'Kikil' },
           { id: 'ayambakar', name: 'Ayam Bakar' }, { id: 'ayamgoreng', name: 'Ayam Goreng' }, { id: 'ayamgulai', name: 'Ayam Gulai' },
           { id: 'ikanbawal-bakar', name: 'Ikan Bawal Bakar' }, { id: 'ikansalam-bakar', name: 'Ikan Salam Bakar' },
           { id: 'ikansalam-goreng', name: 'Ikan Salam Goreng' }, { id: 'ikantongkol-goreng', name: 'Ikan Tongkol Goreng' },
           { id: 'ikantongkol-gulaikuning', name: 'Ikan Tongkol Gulai Kuning' }, { id: 'ikantongkol-asampedas', name: 'Ikan Tongkol Asam Pedas' },
           { id: 'lele-goreng', name: 'Lele Goreng' }, { id: 'telur-dadar', name: 'Telur Dadar' }, { id: 'telur-balado', name: 'Telur Balado' },
           { id: 'ati-ampela', name: 'Ati Ampela' }, { id: 'perkedel', name: 'Perkedel' }
        ];

        const initialItems = MENU_MM.map(menu => {
          const foundModal = modalData.find(m => m.itemId === menu.id);
          return {
            ...menu,
            stokAwal: '',
            hargaModal: foundModal ? new Intl.NumberFormat('id-ID').format(foundModal.hargaModal) : '',
            sisaStok: ''
          };
        });
        
        setItems(initialItems);
      } catch (error) {
        alert("Gagal menarik data harga modal");
      } finally {
        setIsLoading(false);
      }
    };
    fetchModalPrices();
  }, [DRAFT_KEY]);

  // 2. AUTO-SAVE SETIAP ADA PERUBAHAN DATA (DI BELAKANG LAYAR)
  useEffect(() => {
     if (!isLoading && items.length > 0) {
         const todayStr = new Date().toLocaleDateString('id-ID');
         localStorage.setItem(DRAFT_KEY, JSON.stringify({
             tanggal: todayStr,
             step: step,
             items: items
         }));
     }
  }, [items, step, isLoading, DRAFT_KEY]);

  const handleInputChange = (id, field, value) => {
    const rawValue = value.replace(/\D/g, '');
    
    if (field === 'hargaModal') {
       const formattedValue = rawValue ? new Intl.NumberFormat('id-ID').format(rawValue) : '';
       setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: formattedValue } : item));
    } else {
       setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: rawValue } : item));
    }
  };

  const handleNextToStep2 = () => {
    const hasData = items.some(item => item.stokAwal !== '' && parseInt(item.stokAwal) > 0);
    if (!hasData) {
      alert("Isi minimal 1 stok item terlebih dahulu untuk hari ini bos!");
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmitFinal = async () => {
    if(!window.confirm("Data sudah benar? Laporan akan disubmit ke pusat.")) return;
    setIsSubmitting(true);

    try {
      const validModalItems = items.map(item => ({
        id: item.id, name: item.name, 
        hargaModal: parseInt(item.hargaModal.replace(/\./g, '')) || 0
      }));
      
      await fetch(MODAL_SENEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: validModalItems })
      });

      const activeItems = items.filter(item => item.stokAwal !== '' && parseInt(item.stokAwal) > 0);
      let detailStringParts = [];
      let totalLabaKotor = 0;

      activeItems.forEach(item => {
        const awal = parseInt(item.stokAwal) || 0;
        const sisa = parseInt(item.sisaStok) || 0;
        const laku = awal - sisa;
        const modal = parseInt(item.hargaModal.replace(/\./g, '')) || 0;
        const pendapatanItem = laku * modal; 

        if (laku > 0) totalLabaKotor += pendapatanItem;

        detailStringParts.push(`${item.name}: Awal ${awal}, Sisa ${sisa}, Laku ${laku}, Modal ${formatRupiah(modal)}`);
      });

      const todayStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
      const detailPayload = detailStringParts.join(' || ');

      const payload = {
        sheet: branchInfo.sheetName,
        tanggal: todayStr,
        cash: totalLabaKotor, 
        bca: 0, gofood: 0,
        jenisPengeluaran: `[LAPORAN SENEN] ${detailPayload}`,
        totalPengeluaran: 0
      };

      await fetch(API_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // SETELAH BERHASIL SUBMIT, HAPUS DRAFT DARI LOCAL STORAGE
      localStorage.removeItem(DRAFT_KEY);

      alert("✅ Laporan Hari Ini Berhasil Terkirim!");
      onLogout(); 
    } catch (error) {
      alert("❌ Gagal mengirim data. Cek koneksi internet.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center font-black animate-pulse text-gray-500">Memuat Data Database...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-32">
      {/* HEADER */}
      <div className="bg-white p-6 sticky top-0 z-30 shadow-sm flex justify-between items-center border-b border-gray-200 transition-all">
        <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">{branchInfo.name}</h1>
            <p className="text-[10px] sm:text-xs font-black text-blue-600 uppercase tracking-widest mt-1 flex items-center gap-1">
               {step === 1 ? <><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> TAHAP 1: INPUT PAGI</> : <><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> TAHAP 2: CLOSING SORE</>}
            </p>
        </div>
        <button onClick={onLogout} className="p-3 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 transition-all active:scale-95"><LogOut size={20}/></button>
      </div>

      {/* BODY */}
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        
        {/* BANNER UX SAAT BERADA DI TAHAP 2 (Sangat Komunikatif) */}
        {step === 2 && (
          <div className="bg-green-50 border-2 border-green-400 p-5 rounded-[1.5rem] mb-8 shadow-md animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3 mb-2">
                 <div className="bg-green-500 text-white p-1.5 rounded-full"><CheckCircle2 size={20}/></div>
                 <h2 className="text-lg font-black text-green-800 tracking-tight">Data Pagi Tersimpan Otomatis!</h2>
              </div>
              <p className="text-sm font-bold text-green-700 ml-11">
                Anda aman untuk menutup Web/Browser ini sekarang. Buka lagi saat sudah waktunya tutup toko untuk menginput Sisa Stok Akhir.
              </p>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in slide-in-from-left-8 duration-500 fade-in">
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-6 shadow-sm">
                <p className="text-sm font-bold text-blue-800 flex items-center gap-2"><Info size={18} className="shrink-0"/> Input jumlah stok awal hari ini dan perbarui harga modal jika ada perubahan.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-200 hover:border-blue-300 transition-colors group">
                  <h3 className="font-black text-gray-900 text-lg mb-4">{item.name}</h3>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Stok Pagi</label>
                      <input 
                         type="text" inputMode="numeric"
                         className="w-full bg-gray-50 p-3.5 rounded-xl font-black text-center text-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 border border-gray-200 transition-all text-gray-900" 
                         placeholder="0"
                         value={item.stokAwal}
                         onChange={e => handleInputChange(item.id, 'stokAwal', e.target.value)}
                      />
                    </div>
                    <div className="flex-[2]">
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Harga Modal (Rp)</label>
                      <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                          <input 
                             type="text" inputMode="numeric"
                             className="w-full bg-gray-50 pl-10 pr-4 py-3.5 rounded-xl font-black text-lg outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 border border-gray-200 transition-all text-gray-900" 
                             placeholder="10.000"
                             value={item.hargaModal}
                             onChange={e => handleInputChange(item.id, 'hargaModal', e.target.value)}
                          />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right-8 duration-500 fade-in space-y-4">
            {items.filter(i => i.stokAwal !== '' && parseInt(i.stokAwal) > 0).map(item => {
              const awal = parseInt(item.stokAwal) || 0;
              const sisa = parseInt(item.sisaStok) || 0;
              const laku = awal - sisa;

              return (
                <div key={item.id} className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-5 hover:border-green-300 transition-colors">
                  <div className="w-full sm:w-1/3">
                    <h3 className="font-black text-gray-900 text-xl leading-tight">{item.name}</h3>
                    <p className="text-xs font-bold text-gray-500 mt-2">Stok Pagi: <span className="text-gray-900 font-black bg-gray-100 px-2.5 py-1 rounded-lg ml-1">{awal}</span></p>
                  </div>
                  
                  <div className="w-full sm:w-1/3 relative group">
                      <label className="absolute -top-2.5 left-4 bg-white px-2 text-[10px] font-black text-red-500 uppercase tracking-widest z-10">Sisa Sore</label>
                      <input 
                         type="text" inputMode="numeric"
                         className="w-full bg-red-50 p-4 rounded-xl font-black text-center text-2xl outline-none focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-50 border border-red-200 transition-all text-red-700" 
                         placeholder="0"
                         value={item.sisaStok}
                         onChange={e => {
                             const val = parseInt(e.target.value.replace(/\D/g, '')) || '';
                             if (val > awal) { alert("Sisa stok lebih besar dari stok awal!"); return; }
                             handleInputChange(item.id, 'sisaStok', e.target.value);
                         }}
                      />
                  </div>

                  <div className="w-full sm:w-1/3 sm:text-right bg-green-50 p-4 rounded-xl border border-green-200">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-widest mb-1">Laku Terjual</p>
                      <p className="text-3xl font-black text-green-700">{laku < 0 ? 0 : laku} <span className="text-sm font-bold opacity-70">Pcs</span></p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 sm:p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-40">
         <div className="max-w-4xl mx-auto flex gap-4">
             {step === 1 ? (
                 <button onClick={handleNextToStep2} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all flex justify-center items-center gap-3 border-b-4 border-blue-800">
                     <Save size={24}/> SIMPAN DATA PAGI
                 </button>
             ) : (
                 <>
                    <button onClick={() => setStep(1)} disabled={isSubmitting} className="flex-1 py-5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl font-black shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                        <ArrowLeft size={20} className="hidden sm:block"/> KEMBALI
                    </button>
                    <button onClick={handleSubmitFinal} disabled={isSubmitting} className="flex-[2] py-5 bg-gray-900 hover:bg-black text-white rounded-2xl font-black text-lg shadow-xl active:scale-[0.98] transition-all flex justify-center items-center gap-2 border-b-4 border-gray-950 disabled:opacity-50">
                        {isSubmitting ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle2 size={24}/>} 
                        {isSubmitting ? 'MENYIMPAN...' : 'SELESAIKAN & SUBMIT LAPORAN'}
                    </button>
                 </>
             )}
         </div>
      </div>
    </div>
  );
}