// =============================================================================
// APP ROUTER — 3-MODE ARCHITECTURE
// PIN 1010: Kasir Penjualan Normal
// PIN 2020: Kasir Penjualan Fast (Cepat)
// PIN 8080: Edit Product (Nama, Harga, Stok)
// =============================================================================

import React, { useState, useEffect, Suspense } from 'react';
import { ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { BRANCH_CONFIG } from './shared/constants';

import NormalCashierView from './views/NormalCashierView';
import FastCashierView from './views/FastCashierView';
import ProductEditView from './views/ProductEditView';
import SyncView from './views/SyncView';

import Sidenavbar from './components/Sidenavbar';
import ErrorBoundary from './components/ErrorBoundary';

// =============================================================================
// SMART LOGIN VIEW (UI KEYPAD ORIGINAL)
// =============================================================================
function SmartLoginView({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  const keypad = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  const handlePinInput = (num) => {
    if (successAnim) return;
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);

      if (newPin.length === 4) {
        const branch = BRANCH_CONFIG[newPin];
        if (branch) {
          setSuccessAnim(true);
          setTimeout(() => {
            onLogin(branch);
            setSuccessAnim(false);
            setPin('');
          }, 500);
        } else {
          setError(true);
          setTimeout(() => {
            setPin('');
            setError(false);
          }, 500);
        }
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(prev => prev.slice(0, -1));
    }
  };

  return (
    <div className="min-h-[100dvh] h-[100dvh] w-full flex items-center justify-center p-4 font-sans relative overflow-hidden bg-[#f8fafc]">
      {/* Background Pulse Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-50 bg-red-100 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-50 bg-green-100 animate-pulse"></div>

      {/* Main Container */}
      <div className={`max-w-md w-full backdrop-blur-xl rounded-[2.5rem] p-6 sm:p-8 md:p-10 relative z-10 transition-all duration-700 ease-in-out transform bg-white/80 border border-white/20 shadow-2xl ${successAnim ? 'scale-[1.02] shadow-green-500/20' : ''}`}>
        
        {error && (
          <div className="mb-6 p-3 bg-red-50 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold animate-in shake justify-center">
            <AlertCircle size={18} /> PIN Salah / Tidak Terdaftar!
          </div>
        )}

        <div className="flex flex-col items-center animate-in fade-in duration-500">
          <h2 className="text-xl font-extrabold mb-2 text-gray-900 text-center">
            PIN Kasir
          </h2>
          <p className="text-sm mb-6 text-center text-gray-500">
            Masukkan 4 digit PIN akses Anda
          </p>

          {/* PIN DOTS */}
          <div className="flex gap-3 mb-8 justify-center">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] w-4 h-4 ${
                  pin.length > i
                    ? (successAnim ? 'bg-green-500 scale-[1.3] shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-gray-900 scale-110')
                    : 'bg-gray-200'
                }`}
              ></div>
            ))}
          </div>

          {/* KEYPAD GRID */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full px-2 sm:px-4">
            {keypad.slice(0, 9).map((num, idx) => (
              <button
                key={idx}
                onClick={() => handlePinInput(num)}
                className="h-14 sm:h-16 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xl sm:text-2xl font-bold text-gray-900 active:scale-90 transition-transform"
              >
                {num}
              </button>
            ))}
            <div></div>
            <button
              onClick={() => handlePinInput(keypad[9])}
              className="h-14 sm:h-16 bg-gray-50 hover:bg-gray-100 rounded-2xl text-xl sm:text-2xl font-bold text-gray-900 active:scale-90 transition-transform"
            >
              {keypad[9]}
            </button>
            <button
              onClick={handleDelete}
              className="h-14 sm:h-16 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl flex items-center justify-center active:scale-90 transition-transform"
            >
              <ArrowLeft size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================
export default function App() {
  const [branchInfo, setBranchInfo] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_active_session');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [currentMode, setCurrentMode] = useState(() => {
    try {
      const saved = localStorage.getItem('pos_active_session');
      const parsed = saved ? JSON.parse(saved) : null;
      return parsed?.mode || 'kasir_normal';
    } catch (e) {
      return 'kasir_normal';
    }
  });

  // AUTO FULLSCREEN EFFECT (Mode Layar Penuh Otomatis saat Buka App)
  useEffect(() => {
    const triggerFullscreen = () => {
      try {
        if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch (e) {
        // Abaikan jika tidak didukung browser
      }
    };

    triggerFullscreen();
    window.addEventListener('click', triggerFullscreen, { once: true });
    window.addEventListener('touchstart', triggerFullscreen, { once: true });

    return () => {
      window.removeEventListener('click', triggerFullscreen);
      window.removeEventListener('touchstart', triggerFullscreen);
    };
  }, []);

  const handleLogin = (branch) => {
    setBranchInfo(branch);
    setCurrentMode(branch.mode || 'kasir_normal');
    localStorage.setItem('pos_active_session', JSON.stringify(branch));
  };

  const handleLogout = () => {
    setBranchInfo(null);
    localStorage.removeItem('pos_active_session');
  };

  const handleSwitchMode = (modeId) => {
    setCurrentMode(modeId);
  };

  if (!branchInfo) {
    return <SmartLoginView onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-900 font-sans">
      {/* Sidenavbar (Strictly Nav Items with Hide/Show & Green Cabe Ijo Theme) */}
      <Sidenavbar
        currentMode={currentMode}
        onSwitchMode={handleSwitchMode}
        onLogout={handleLogout}
      />

      {/* Main View Container */}
      <div className="flex-1 w-full h-full flex overflow-hidden">
        <ErrorBoundary key={currentMode} onLogout={handleLogout}>
          <Suspense
            fallback={
              <div className="flex-1 min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3">
                <Loader2 size={40} className="text-emerald-600 animate-spin" />
                <p className="text-sm font-bold text-gray-600">Memuat Mode System...</p>
              </div>
            }
          >
            {currentMode === 'kasir_normal' && (
              <NormalCashierView
                branchInfo={branchInfo}
                onLogout={handleLogout}
                onSwitchMode={handleSwitchMode}
              />
            )}
            {/* Normal Cashier 2 Dinonaktifkan oleh User
            {currentMode === 'kasir_normal_2' && (
              <NormalCashierView2
                branchInfo={branchInfo}
                onLogout={handleLogout}
                onSwitchMode={handleSwitchMode}
              />
            )} */}
            {currentMode === 'kasir_fast' && (
              <FastCashierView
                branchInfo={branchInfo}
                onLogout={handleLogout}
                onSwitchMode={handleSwitchMode}
              />
            )}
            {currentMode === 'product_edit' && (
              <ProductEditView
                branchInfo={branchInfo}
                onLogout={handleLogout}
                onSwitchMode={handleSwitchMode}
              />
            )}
            {currentMode === 'sync_cloud' && (
              <SyncView
                branchInfo={branchInfo}
                onLogout={handleLogout}
                onSwitchMode={handleSwitchMode}
              />
            )}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
}