// =============================================================================
// SYNC VIEW — DEDICATED CLOSING & CLOUD SYNC PAGE
// Pecel Lele Cabe Ijo - Kantin SMB
//
// Karakteristik:
// 1. Dedicated Hub: Halaman tunggal & khusus untuk proses sinkronisasi tutup toko.
// 2. Clear Overview: Memperlihatkan status sinyal internet, jumlah transaksi yang siap ditransfer,
//    dan opsi transfer ke MongoDB.
// 3. Automated Local Reset: Setelah transfer berhasil, seluruh memori transaksi,
//    activity log, dan stok tablet di-reset ke 0 untuk operasional esok hari.
// =============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  CloudUpload, CheckCircle2, AlertCircle, Loader2,
  RefreshCw, Wifi, WifiOff, Database, ShieldCheck,
  RotateCcw, Store, ArrowRight, Clock, HardDrive
} from 'lucide-react';
import { getSyncStats } from '../services/localDb';
import { syncDailyTransactions, checkServerConnection, resetLocalDataOnly } from '../services/syncEngine';

export default function SyncView({ branchInfo, onLogout, onSwitchMode }) {
  const sheetName = branchInfo?.sheetName || 'PLCI Kantin SMB';

  const [stats, setStats] = useState({ total: 0, pending: 0, synced: 0, failed: 0 });
  const [isOnline, setIsOnline] = useState(true);
  const [isCheckingConn, setIsCheckingConn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
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

  const handleStartSync = async () => {
    if (isSyncing || isResetting) return;
    setIsSyncing(true);
    setSyncResult(null);
    setProgress({ percent: 5, message: 'Memulai proses sinkronisasi...' });

    try {
      const result = await syncDailyTransactions(sheetName, (percent, total, message) => {
        setProgress({ percent, message });
      });

      setSyncResult(result);
      await loadStats();
    } catch (err) {
      setSyncResult({
        success: false,
        message: err.message || 'Terjadi kesalahan saat memindahkan data ke server.'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualReset = async () => {
    if (isSyncing || isResetting) return;
    const confirmed = window.confirm(
      'Yakin ingin me-reset data tablet ke 0 sekarang?\n\n• Transaksi dan riwayat lokal akan dikosongkan.\n• Seluruh stok produk akan kembali ke 0.\n• Nama produk dan harga TETAP AMAN.\n\nLakukan ini untuk memulai hari baru dengan data bersih.'
    );
    if (!confirmed) return;

    setIsResetting(true);
    setSyncResult(null);
    try {
      const res = await resetLocalDataOnly(sheetName);
      setSyncResult(res);
      await loadStats();
    } catch (err) {
      setSyncResult({
        success: false,
        message: 'Gagal mereset data: ' + err.message
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex-1 h-full w-full bg-[#f8fafc] flex flex-col font-sans overflow-y-auto">
      {/* TOP HEADER */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-700/20">
            <CloudUpload size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 leading-tight">
              Sinkronisasi Cloud & Tutup Toko
            </h1>
            <p className="text-xs text-gray-500 font-semibold">
              {branchInfo?.name || 'Pecel Lele Cabe Ijo - Kantin SMB'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onSwitchMode('kasir_normal')}
            className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <Store size={14} />
            <span>Kembali ke Kasir</span>
          </button>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-4xl w-full mx-auto p-6 space-y-6 flex-1">
        {/* CONNECTION STATUS BANNER */}
        <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-xs ${
          isOnline
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isOnline ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}>
              {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
            </div>
            <div>
              <p className="font-extrabold text-sm">
                {isOnline ? 'Internet Terhubung (Siap Transfer)' : 'Internet Belum Terdeteksi'}
              </p>
              <p className="text-[11px] opacity-80 font-normal">
                {isOnline
                  ? 'Koneksi ke server cloud MongoDB siap digunakan untuk transfer data tutup toko.'
                  : 'Pastikan paket data atau WiFi tablet aktif saat ingin mengirim data tutup toko.'}
              </p>
            </div>
          </div>

          <button
            onClick={verifyConnection}
            disabled={isCheckingConn || isSyncing}
            className="px-3 py-2 bg-white rounded-xl shadow-xs hover:bg-gray-50 flex items-center gap-1.5 active:scale-95 disabled:opacity-50 text-xs font-bold border border-gray-200"
          >
            <RefreshCw size={13} className={isCheckingConn ? 'animate-spin' : ''} />
            <span>Cek Sinyal</span>
          </button>
        </div>

        {/* METRICS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CARD 1: DATA SIAP DITRANSFER */}
          <div className={`p-6 rounded-3xl border transition-all ${
            stats.pending > 0
              ? 'bg-amber-50/70 border-amber-200 text-amber-950 shadow-sm'
              : 'bg-white border-gray-200 text-gray-800 shadow-xs'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Clock size={14} className={stats.pending > 0 ? 'text-amber-600' : 'text-gray-400'} />
                Data Siap Ditransfer
              </span>
              {stats.pending > 0 && (
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-black uppercase">
                  Pending Transfer
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <p className={`text-4xl font-black ${stats.pending > 0 ? 'text-amber-600' : 'text-gray-400'}`}>
                {stats.pending}
              </p>
              <span className="text-sm font-bold text-gray-500">Transaksi Hari Ini</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">
              Transaksi yang disimpan di tablet selama operasional offline berlangsung.
            </p>
          </div>

          {/* CARD 2: STORAGE TABLET */}
          <div className="p-6 rounded-3xl bg-white border border-gray-200 text-gray-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <HardDrive size={14} className="text-emerald-600" />
                Penyimpanan Internal Tablet
              </span>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase">
                Active Offline
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-4xl font-black text-slate-800">
                {stats.total}
              </p>
              <span className="text-sm font-bold text-gray-500">Total Record</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 font-medium leading-relaxed">
              Setelah ditransfer ke MongoDB, data ini akan dikosongkan agar performa tablet tetap kilat.
            </p>
          </div>
        </div>

        {/* PROGRESS DISPLAY SAAT PROSES BERJALAN */}
        {isSyncing && (
          <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-sm space-y-3 animate-in fade-in">
            <div className="flex justify-between items-center text-sm font-extrabold text-gray-800">
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="text-emerald-600 animate-spin" />
                {progress.message || 'Mentransfer data ke MongoDB...'}
              </span>
              <span className="text-emerald-700 text-base">{progress.percent}%</span>
            </div>
            <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* BANNER HASIL SYNC */}
        {syncResult && (
          <div className={`p-5 rounded-3xl border flex items-start gap-3.5 animate-in zoom-in-95 ${
            syncResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 shadow-xs'
              : 'bg-red-50 border-red-200 text-red-900 shadow-xs'
          }`}>
            {syncResult.success ? (
              <ShieldCheck size={28} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle size={28} className="text-red-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <h3 className="font-black text-base">
                {syncResult.success ? 'Sinkronisasi Berhasil!' : 'Sinkronisasi Terkendala'}
              </h3>
              <p className="text-xs leading-relaxed font-medium opacity-90">
                {syncResult.message}
              </p>
            </div>
          </div>
        )}

        {/* UTAMA: ACTION TRANSFER KE CLOUD */}
        <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-black text-gray-900">
              Proses Tutup Toko (Kirim Data & Bersihkan Tablet)
            </h2>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Tombol ini akan mentransfer seluruh transaksi hari ini ke database pusat MongoDB. Begitu transfer selesai, memori tablet otomatis di-reset ke 0 untuk operasional besok.
            </p>
          </div>

          <button
            onClick={handleStartSync}
            disabled={isSyncing || isResetting || !isOnline}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-black rounded-2xl text-base shadow-lg shadow-emerald-700/25 flex items-center justify-center gap-2.5 transition-all active:scale-95 disabled:shadow-none"
          >
            {isSyncing ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Mentransfer Data ke Cloud MongoDB...</span>
              </>
            ) : (
              <>
                <CloudUpload size={20} />
                <span>Kirim {stats.pending > 0 ? `${stats.pending} Transaksi` : 'Data'} ke Cloud & Tutup Toko</span>
              </>
            )}
          </button>
        </div>

        {/* PANDUAN KERJA OPERASIONAL */}
        <div className="bg-slate-100/70 p-5 rounded-3xl border border-slate-200 text-xs text-gray-700 space-y-2">
          <p className="font-extrabold text-gray-900 flex items-center gap-1.5 text-sm">
            <Database size={15} className="text-emerald-600" />
            Petunjuk Standar Operasional (SOP) Lapangan:
          </p>
          <ul className="space-y-1.5 text-gray-600 pl-1">
            <li>• <strong>Pagi Hari:</strong> Buka kasir. Semua stok mulai dari 0. Masuk menu Edit Product untuk input stok masuk hari ini.</li>
            <li>• <strong>Sepanjang Hari:</strong> Melayani transaksi pelanggan full offline tanpa kuota/internet. Struk printer tetap lancar.</li>
            <li>• <strong>Malam Hari (Tutup Toko):</strong> Aktifkan sinyal internet / WiFi, buka menu ini, dan klik tombol hijau di atas. Data akan berpindah ke MongoDB dan tablet siap untuk besok.</li>
          </ul>
        </div>

        {/* RESET DATA MANUAL */}
        <div className="pt-2">
          <button
            onClick={handleManualReset}
            disabled={isSyncing || isResetting}
            className="w-full py-3 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs border border-red-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
          >
            <RotateCcw size={14} className={isResetting ? 'animate-spin' : ''} />
            <span>Reset Data Tablet ke 0 Secara Manual (Buka Lembaran Baru Sekarang)</span>
          </button>
        </div>
      </main>
    </div>
  );
}
