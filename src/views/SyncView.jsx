// =============================================================================
// SYNC VIEW — DEDICATED CLOUD SYNC & CLOSING PAGE
// Pecel Lele Cabe Ijo - Kantin SMB
//
// Karakteristik:
// 1. Minimalist & Clean: Bebas dari teks penjelasan panjang dan SOP.
// 2. Info Penyimpanan Minimal: Hanya menampilkan ".. Transaksi Hari Ini" & ".. Total Record".
// 3. Tombol Jelas: "Kirim Data" dan "Tutup Toko".
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudUpload, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, Wifi, WifiOff, RotateCcw, Store, Check
} from 'lucide-react';
import { getSyncStats } from '../services/localDb';
import {
  sendDataOnly,
  closeStoreAndReset,
  checkServerConnection,
  resetLocalDataOnly
} from '../services/syncEngine';

export default function SyncView({ branchInfo, onLogout, onSwitchMode }) {
  const sheetName = branchInfo?.sheetName || 'PLCI Kantin SMB';

  const [stats, setStats] = useState({ total: 0, pending: 0, synced: 0, failed: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingConn, setIsCheckingConn] = useState(false);
  const [activeAction, setActiveAction] = useState(null); // 'send' | 'close' | 'reset'
  const [progress, setProgress] = useState({ percent: 0, message: '' });
  const [syncResult, setSyncResult] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const s = await getSyncStats(sheetName);
      setStats(s);
    } catch (e) {
      console.warn('Gagal memuat sync stats:', e);
    }
  }, [sheetName]);

  const verifyConnection = useCallback(async () => {
    setIsCheckingConn(true);
    try {
      const conn = await checkServerConnection();
      setIsOnline(conn.online);
    } catch (e) {
      setIsOnline(false);
    } finally {
      setIsCheckingConn(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    verifyConnection();
    const interval = setInterval(() => {
      loadStats();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadStats, verifyConnection]);

  // Aksi 1: "Kirim Data" (Hanya transfer ke Cloud tanpa reset tablet)
  const handleSendData = async () => {
    if (activeAction) return;
    setActiveAction('send');
    setSyncResult(null);
    setProgress({ percent: 10, message: 'Mengirim data ke server...' });

    try {
      const res = await sendDataOnly(sheetName, (percent, total, message) => {
        setProgress({ percent, message });
      });
      setSyncResult(res);
      await loadStats();
    } catch (err) {
      setSyncResult({
        success: false,
        message: err.message || 'Gagal mengirim data ke server.'
      });
    } finally {
      setActiveAction(null);
    }
  };

  // Aksi 2: "Tutup Toko" (Transfer ke Cloud lalu reset tablet ke 0)
  const handleCloseStore = async () => {
    if (activeAction) return;
    const confirmed = window.confirm(
      'Yakin ingin Tutup Toko sekarang?\n\nSemua transaksi hari ini akan dikirim ke Cloud MongoDB dan tablet akan di-reset ke 0 untuk besok.'
    );
    if (!confirmed) return;

    setActiveAction('close');
    setSyncResult(null);
    setProgress({ percent: 10, message: 'Mentransfer data & memproses tutup toko...' });

    try {
      const res = await closeStoreAndReset(sheetName, (percent, total, message) => {
        setProgress({ percent, message });
      });
      setSyncResult(res);
      await loadStats();
    } catch (err) {
      setSyncResult({
        success: false,
        message: err.message || 'Gagal memproses tutup toko.'
      });
    } finally {
      setActiveAction(null);
    }
  };

  const handleManualReset = async () => {
    if (activeAction) return;
    const confirmed = window.confirm('Reset data tablet ke 0 tanpa sinkronisasi?');
    if (!confirmed) return;

    setActiveAction('reset');
    setSyncResult(null);
    try {
      const res = await resetLocalDataOnly(sheetName);
      setSyncResult(res);
      await loadStats();
    } catch (err) {
      setSyncResult({ success: false, message: err.message });
    } finally {
      setActiveAction(null);
    }
  };

  return (
    <div className="flex-1 h-full w-full bg-[#f8fafc] flex flex-col font-sans overflow-y-auto">
      {/* TOP HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-sm">
            <CloudUpload size={20} />
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900 leading-tight">
              Sinkronisasi Cloud
            </h1>
            <p className="text-[11px] text-gray-500 font-bold">
              {branchInfo?.name || 'Pecel Lele Cabe Ijo - Kantin SMB'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onSwitchMode('kasir_normal')}
          className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
        >
          <Store size={14} />
          <span>Kembali ke Kasir</span>
        </button>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-xl w-full mx-auto p-6 space-y-4 flex-1 flex flex-col justify-center">

        {/* CONNECTION STATUS BADGE */}
        <div className={`px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold ${
          isOnline
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {isOnline ? <Wifi size={16} className="text-emerald-600" /> : <WifiOff size={16} className="text-red-500" />}
            <span>{isOnline ? 'Online (Sinyal Terhubung)' : 'Offline (Tidak Ada Sinyal)'}</span>
          </div>
          <button
            onClick={verifyConnection}
            disabled={isCheckingConn || Boolean(activeAction)}
            className="px-2.5 py-1 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 text-[11px] flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw size={11} className={isCheckingConn ? 'animate-spin' : ''} />
            <span>Cek Sinyal</span>
          </button>
        </div>

        {/* INFORMASI PENYIMPANAN INTERNAL TABLET (DIBUAT SANGAT MINIMAL SESUAI REQUIREMENT 6) */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 text-center shadow-xs">
            <span className="text-2xl font-black text-gray-900 block">
              {stats.pending}
            </span>
            <span className="text-xs font-bold text-gray-500">
              Transaksi Hari Ini
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-2xl border border-gray-200 text-center shadow-xs">
            <span className="text-2xl font-black text-slate-800 block">
              {stats.total}
            </span>
            <span className="text-xs font-bold text-gray-500">
              Total Record
            </span>
          </div>
        </div>

        {/* PROGRESS DISPLAY */}
        {activeAction && (
          <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-sm space-y-2 animate-in fade-in">
            <div className="flex justify-between items-center text-xs font-bold text-gray-800">
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="text-emerald-600 animate-spin" />
                {progress.message || 'Memproses data...'}
              </span>
              <span className="text-emerald-700 font-black">{progress.percent}%</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* SYNC RESULT ALERT */}
        {syncResult && (
          <div className={`p-4 rounded-2xl border flex items-start gap-3 text-xs animate-in zoom-in-95 ${
            syncResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            {syncResult.success ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            )}
            <p className="font-bold leading-relaxed">{syncResult.message}</p>
          </div>
        )}

        {/* DUA BUTTON UTAMA YANG JELAS: "Kirim Data" DAN "Tutup Toko" (REQUIREMENT 6) */}
        <div className="space-y-3 pt-2">
          {/* BUTTON 1: KIRIM DATA */}
          <button
            onClick={handleSendData}
            disabled={Boolean(activeAction) || !isOnline}
            className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 text-white font-black rounded-2xl text-base shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {activeAction === 'send' ? (
              <><Loader2 size={18} className="animate-spin" /> Mengirim...</>
            ) : (
              <><CloudUpload size={18} /> Kirim Data</>
            )}
          </button>

          {/* BUTTON 2: TUTUP TOKO */}
          <button
            onClick={handleCloseStore}
            disabled={Boolean(activeAction) || !isOnline}
            className="w-full py-4 bg-slate-900 hover:bg-black disabled:bg-gray-300 text-white font-black rounded-2xl text-base shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed border-b-4 border-slate-950"
          >
            {activeAction === 'close' ? (
              <><Loader2 size={18} className="animate-spin" /> Memproses Tutup Toko...</>
            ) : (
              <><Check size={18} /> Tutup Toko</>
            )}
          </button>
        </div>

        {/* MANUAL RESET KE 0 */}
        <div className="text-center pt-2">
          <button
            onClick={handleManualReset}
            disabled={Boolean(activeAction)}
            className="text-[11px] font-bold text-slate-400 hover:text-red-600 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <RotateCcw size={11} /> Reset Data Tablet ke 0
          </button>
        </div>
      </main>
    </div>
  );
}
