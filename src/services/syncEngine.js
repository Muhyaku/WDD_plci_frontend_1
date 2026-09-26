// =============================================================================
// OFFLINE SYNC ENGINE
// Pecel Lele Cabe Ijo - Kantin SMB
//
// Karakteristik:
// 1. One-Way Transfer: Mentransfer seluruh data harian dari internal tablet ke MongoDB.
// 2. Preserved Creation Timestamp: Membawa timestamp asli kasir saat transaksi diinput.
// 3. Structured Items Preservation: Membawa daftar item & quantity per transaksi.
// 4. Daily Stock & Audit Trail Upload: Mentransfer stok awal & histori penyesuaian (+/-).
// 5. Dual Action: "Kirim Data" (transfer saja) & "Tutup Toko" (transfer + reset ke 0).
// =============================================================================

import { API_URL, ACTIVITY_URL, BACKEND_BASE_URL } from '../shared/constants';
import {
  getPendingTransactions,
  getLocalActivityLogs,
  getAllDailyStocks,
  resetLocalDailyState,
  getSyncStats
} from './localDb';

const CHUNK_SIZE = 25; // Ukuran batch transaksi per pengiriman HTTP

/**
 * Memeriksa ketersediaan koneksi internet dan responsivitas server backend
 */
export async function checkServerConnection() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { online: false, message: 'Device sedang tidak terhubung ke jaringan (Offline).' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${BACKEND_BASE_URL}/api/health`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return { online: true, message: 'Server online dan siap menerima data.' };
    }
    return { online: false, message: `Server merespon dengan status ${res.status}.` };
  } catch (err) {
    return {
      online: false,
      message: 'Koneksi ke server backend gagal/timeout. Pastikan sinyal internet stabil.'
    };
  }
}

/**
 * Helper internal: Upload pending transactions, activity logs, & daily stocks to server
 */
async function uploadAllPendingData(sheetName, onProgress = () => {}) {
  // 1. Validasi Sinyal & Healthcheck Server
  onProgress(5, 0, 'Memeriksa kestabilan koneksi internet & server...');
  const health = await checkServerConnection();
  if (!health.online) {
    throw new Error(health.message);
  }

  // 2. Ambil seluruh transaksi lokal berstatus PENDING
  onProgress(10, 0, 'Mengambil transaksi lokal yang siap ditransfer...');
  const pendingTx = await getPendingTransactions(sheetName);

  let totalUploaded = 0;
  const errors = [];

  // 3. Proses pengiriman transaksi (jika ada)
  if (pendingTx.length > 0) {
    const total = pendingTx.length;
    const chunks = [];
    for (let i = 0; i < total; i += CHUNK_SIZE) {
      chunks.push(pendingTx.slice(i, i + CHUNK_SIZE));
    }

    for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
      const chunk = chunks[cIdx];
      const chunkStart = cIdx * CHUNK_SIZE + 1;
      const chunkEnd = Math.min(total, (cIdx + 1) * CHUNK_SIZE);

      onProgress(
        Math.round(15 + (totalUploaded / total) * 60),
        total,
        `Mentransfer transaksi ${chunkStart} - ${chunkEnd} dari ${total} ke MongoDB...`
      );

      // PENTING: Waktu transaksi dibuat (createdAt) dan structured items WAJIB DIBAWA!
      const payload = chunk.map(tx => ({
        localId: tx.localId,
        deviceId: tx.deviceId,
        sheet: tx.sheet || sheetName,
        tanggal: tx.tanggal,
        cash: tx.cash || 0,
        bca: tx.bca || 0,
        gofood: tx.gofood || 0,
        qris: tx.qris || 0,
        jenisPengeluaran: tx.jenisPengeluaran || '',
        totalPengeluaran: tx.totalPengeluaran || 0,
        totalPendapatan: tx.totalPendapatan || 0,
        isDeleted: tx.isDeleted || false,
        deletedAt: tx.deletedAt || null,
        printCount: tx.printCount || 0,
        overrideDbId: tx.overrideDbId || undefined,
        createdAt: tx.createdAt, // Waktu riil kasir input transaksi
        items: tx.items || []    // Structured items untuk perhitungan quantity terjual
      }));

      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          throw new Error(`Server menolak batch (HTTP ${res.status})`);
        }

        const resJson = await res.json();
        if (resJson.status === 'error') {
          throw new Error(resJson.message || 'Gagal menyimpan batch di server');
        }

        totalUploaded += chunk.length;
      } catch (chunkErr) {
        console.error(`[SyncEngine] Gagal sinkronisasi batch ${cIdx + 1}:`, chunkErr);
        errors.push(`Batch ${cIdx + 1}: ${chunkErr.message}`);
        break; // Stop jika ada kegagalan agar tidak loncat urutan
      }
    }
  }

  // Jika ada error upload transaksi, jangan lanjutkan
  if (errors.length > 0) {
    throw new Error(`Sebagian data gagal terkirim: ${errors.join(', ')}. Data lokal tetap dipertahankan.`);
  }

  // 4. Transfer Log Aktivitas Lokal (Ubah Stok, dll) jika ada
  try {
    const localLogs = await getLocalActivityLogs(sheetName, 200);
    if (localLogs && localLogs.length > 0) {
      onProgress(80, pendingTx.length || 1, 'Mentransfer log audit harian ke MongoDB...');
      await fetch(ACTIVITY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localLogs)
      }).catch(logErr => console.warn('[SyncEngine] Backup log aktivitas non-fatal warning:', logErr));
    }
  } catch (logErr) {
    console.warn('[SyncEngine] Skip log sync:', logErr);
  }

  // 5. Transfer Data Stok Harian & Riwayat Penyesuaian (+/-) ke MongoDB
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyStocks = await getAllDailyStocks(sheetName, todayStr);
    if (dailyStocks && dailyStocks.length > 0) {
      onProgress(90, pendingTx.length || 1, 'Mentransfer data stok & histori perubahan ke MongoDB...');
      await fetch(`${BACKEND_BASE_URL}/api/daily-stocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dailyStocks)
      }).catch(stockErr => console.warn('[SyncEngine] Backup daily stocks warning:', stockErr));
    }
  } catch (stockErr) {
    console.warn('[SyncEngine] Skip daily stocks sync:', stockErr);
  }

  return { totalUploaded, pendingCount: pendingTx.length };
}

/**
 * AKSI 1: "Kirim Data"
 * Mentransfer seluruh transaksi, log, dan data stok ke MongoDB tanpa membersihkan tablet.
 */
export async function sendDataOnly(sheetName, onProgress = () => {}) {
  const { totalUploaded } = await uploadAllPendingData(sheetName, onProgress);
  onProgress(100, totalUploaded, 'Pengiriman data selesai.');

  return {
    success: true,
    uploadedCount: totalUploaded,
    message: totalUploaded > 0
      ? `Berhasil mengirim ${totalUploaded} transaksi ke Cloud MongoDB.`
      : 'Tidak ada transaksi baru yang perlu dikirim.'
  };
}

/**
 * AKSI 2: "Tutup Toko"
 * Mentransfer seluruh transaksi, log, dan data stok ke MongoDB, lalu me-reset tablet ke 0 untuk esok hari.
 */
export async function closeStoreAndReset(sheetName, onProgress = () => {}) {
  const { totalUploaded } = await uploadAllPendingData(sheetName, onProgress);

  onProgress(95, totalUploaded, 'Mengosongkan memori tablet & mereset stok ke 0...');
  await resetLocalDailyState(sheetName);

  onProgress(100, totalUploaded, 'Tutup toko selesai. Tablet telah di-reset ke 0.');

  return {
    success: true,
    uploadedCount: totalUploaded,
    message: totalUploaded > 0
      ? `Tutup toko berhasil! ${totalUploaded} transaksi telah tersimpan di Cloud MongoDB dan tablet siap untuk besok.`
      : 'Tutup toko selesai. Data tablet telah bersih dan siap untuk besok.'
  };
}

/**
 * Backward compatibility alias for syncDailyTransactions
 */
export async function syncDailyTransactions(sheetName, onProgress = () => {}) {
  return await closeStoreAndReset(sheetName, onProgress);
}

/**
 * Reset manual data lokal langsung ke 0 (Buka lembaran baru tanpa sync)
 */
export async function resetLocalDataOnly(sheetName) {
  await resetLocalDailyState(sheetName);
  return {
    success: true,
    message: 'Data lokal tablet berhasil di-reset ke 0 (seluruh stok 0 dan transaksi kosong).'
  };
}
