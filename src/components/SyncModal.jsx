// =============================================================================
// SYNC MODAL COMPONENT (Sinkronisasi Data Harian Tutup Toko)
// Pecel Lele Cabe Ijo - Kantin SMB
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cloud, CloudUpload, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, Wifi, WifiOff, X, Database, ShieldCheck
} from 'lucide-react';
import { getSyncStats } from '../services/localDb';
import { syncDailyTransactions, checkServerConnection } from '../services/syncEngine';

export default function SyncModal({ isOpen, onClose, sheetName, onSyncComplete }) {
  const [stats, setStats] = useState({ total: 0, pending: 0, synced: 0, failed: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingConn, setIsCheckingConn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [progress, setProgress] = useState({ percent: 0, message: '' });
  const [syncResult, setSyncResult] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const s = await getSyncStats(sheetName);
      setStats(s);
    } catch (e) {
      console.warn('Gagal load sync stats:', e);
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
    if (isOpen) {
      loadStats();
      verifyConnection();
      setSyncResult(null);
      setProgress({ percent: 0, message: '' });
    }
  }, [isOpen, loadStats, verifyConnection]);

  const handleStartSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setSyncResult(null);

    try {
      const result = await syncDailyTransactions(sheetName, (percent, total, message) => {
        setProgress({ percent, message });
      });

      setSyncResult(result);
      await loadStats();

      if (onSyncComplete) {
        onSyncComplete();
      }
    } catch (err) {
      setSyncResult({
        success: false,
        message: err.message || 'Terjadi kesalahan saat sinkronisasi data.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[400] flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col">
        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 text-white p-6 relative">
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors active:scale-95 disabled:opacity-40"
            title="Tutup"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
              <CloudUpload size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-snug">
                Sinkronisasi Data Harian
              </h2>
              <p className="text-xs text-emerald-100/80 font-medium">
                Kirim data kasir offline ke Database MongoDB (Tutup Toko)
              </p>
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* KONEKSI STATUS */}
          <div className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all ${
            isOnline ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <div className="flex items-center gap-2.5">
              {isOnline ? <Wifi size={18} className="text-emerald-600" /> : <WifiOff size={18} className="text-red-500" />}
              <span>{isOnline ? 'Koneksi Internet Terhubung (Siap Sync)' : 'Koneksi Internet Belum Terdeteksi'}</span>
            </div>
            <button
              onClick={verifyConnection}
              disabled={isCheckingConn || isSyncing}
              className="px-2.5 py-1 bg-white rounded-lg shadow-xs hover:bg-gray-50 flex items-center gap-1 active:scale-95 disabled:opacity-50 text-[11px]"
            >
              <RefreshCw size={12} className={isCheckingConn ? 'animate-spin' : ''} />
              <span>Cek Sinyal</span>
            </button>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-3">
            {/* PENDING */}
            <div className={`p-4 rounded-2xl border text-center transition-all ${
              stats.pending > 0 ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs' : 'bg-gray-50 border-gray-100 text-gray-700'
            }`}>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                Menunggu Kirim
              </p>
              <p className={`text-2xl font-black ${stats.pending > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                {stats.pending}
              </p>
              <p className="text-[10px] font-semibold text-gray-400 mt-1">Transaksi</p>
            </div>

            {/* SYNCED */}
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-center text-blue-900 shadow-xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                Sudah di Server
              </p>
              <p className="text-2xl font-black text-blue-600">
                {stats.synced}
              </p>
              <p className="text-[10px] font-semibold text-gray-400 mt-1">Transaksi</p>
            </div>

            {/* TOTAL */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-900 shadow-xs">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">
                Total di Tablet
              </p>
              <p className="text-2xl font-black text-slate-800">
                {stats.total}
              </p>
              <p className="text-[10px] font-semibold text-gray-400 mt-1">Transaksi</p>
            </div>
          </div>

          {/* PROGRESS BAR SAAT SYNC */}
          {isSyncing && (
            <div className="space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
              <div className="flex justify-between text-xs font-bold text-gray-700">
                <span>{progress.message || 'Memproses data...'}</span>
                <span>{progress.percent}%</span>
              </div>
              <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* HASIL SINKRONISASI BANNER */}
          {syncResult && (
            <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in zoom-in-95 ${
              syncResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {syncResult.success ? (
                <ShieldCheck size={24} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={24} className="text-red-500 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-black text-sm mb-1">
                  {syncResult.success ? 'Sinkronisasi Berhasil!' : 'Sinkronisasi Terkendala'}
                </p>
                <p className="leading-relaxed font-medium">
                  {syncResult.message}
                </p>
              </div>
            </div>
          )}

          {/* PETUNJUK OPERASIONAL */}
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 text-[11px] text-gray-600 space-y-1">
            <p className="font-bold text-gray-800 flex items-center gap-1.5">
              <Database size={13} className="text-emerald-600" />
              Petunjuk Karyawan Toko:
            </p>
            <p>1. Lakukan transaksi normal sepanjang hari (tanpa kuota/internet).</p>
            <p>2. Saat tutup toko, bawa tablet ke area bersinyal internet stabil.</p>
            <p>3. Klik tombol hijau di bawah untuk mentransfer seluruh transaksi hari ini ke database pusat.</p>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSyncing}
            className="flex-1 py-3.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-2xl text-sm transition-colors active:scale-95 disabled:opacity-50"
          >
            Tutup
          </button>

          <button
            onClick={handleStartSync}
            disabled={isSyncing || stats.pending === 0}
            className="flex-2 py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-black rounded-2xl text-sm shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:shadow-none"
          >
            {isSyncing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Sedang Mengirim ke Server...</span>
              </>
            ) : stats.pending === 0 ? (
              <>
                <CheckCircle2 size={18} />
                <span>Semua Data Sudah Terkirim</span>
              </>
            ) : (
              <>
                <CloudUpload size={18} />
                <span>Kirim {stats.pending} Transaksi ke Database</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
