// =============================================================================
// OFFLINE SYNC ENGINE
// Pecel Lele Cabe Ijo - Kantin SMB
//
// Karakteristik:
// 1. One-Way Transfer: Mentransfer seluruh data harian dari internal tablet ke MongoDB.
// 2. Daily Local Purge: Setelah data sukses diterima MongoDB, seluruh data transaksi,
//    activity logs, dan stok lokal DI-RESET KE 0 (nama & harga produk tetap aman).
// 3. Chunking Safety: Membagi pengiriman transaksi menjadi batch aman (25 item/request).
// 4. Zero Lag & Peak Performance: Tablet selalu bersih dari akumulasi beban data lama.
// =============================================================================

import { API_URL, ACTIVITY_URL, BACKEND_BASE_URL } from '../shared/constants';
import {
  getPendingTransactions,
  getLocalActivityLogs,
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
 * Menjalankan proses sinkronisasi tutup toko:
 * 1. Kirim seluruh transaksi lokal ke MongoDB
 * 2. Kirim seluruh log aktivitas harian ke MongoDB
 * 3. Kosongkan data lokal tablet (reset ke 0) agar siap untuk esok hari
 */
export async function syncDailyTransactions(sheetName, onProgress = () => {}) {
  // 1. Validasi Sinyal & Healthcheck Server
  onProgress(0, 0, 'Memeriksa kestabilan koneksi internet & server...');
  const health = await checkServerConnection();
  if (!health.online) {
    throw new Error(health.message);
  }

  // 2. Ambil seluruh transaksi lokal berstatus PENDING
  onProgress(0, 0, 'Mengambil transaksi lokal yang siap ditransfer...');
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
        Math.round((totalUploaded / total) * 70),
        total,
        `Mentransfer transaksi ${chunkStart} - ${chunkEnd} dari ${total} ke MongoDB...`
      );

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
        overrideDbId: tx.overrideDbId || undefined
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

  // Jika ada error upload transaksi, jangan reset lokal agar data kasir tidak hilang sebelum masuk server
  if (errors.length > 0) {
    throw new Error(`Sebagian data gagal terkirim: ${errors.join(', ')}. Data lokal tetap dipertahankan.`);
  }

  // 4. Transfer Log Aktivitas Lokal (Ubah Stok, dll) jika ada
  try {
    const localLogs = await getLocalActivityLogs(sheetName, 200);
    if (localLogs && localLogs.length > 0) {
      onProgress(85, pendingTx.length || 1, 'Mentransfer log audit harian ke MongoDB...');
      await fetch(ACTIVITY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localLogs)
      }).catch(logErr => console.warn('[SyncEngine] Backup log aktivitas non-fatal warning:', logErr));
    }
  } catch (logErr) {
    console.warn('[SyncEngine] Skip log sync:', logErr);
  }

  // 5. PURGE & RESET LOCAL DATA TO ZERO (Karakteristik Offline Sejati)
  // Data sudah aman tersimpan di MongoDB luar sana, sekarang bersihkan device tablet
  onProgress(95, pendingTx.length || 1, 'Membersihkan memori tablet & mereset stok ke 0...');
  await resetLocalDailyState(sheetName);

  onProgress(100, pendingTx.length || 1, 'Sinkronisasi selesai. Tablet telah di-reset ke 0.');

  return {
    success: true,
    syncedCount: totalUploaded,
    message: totalUploaded > 0
      ? `Alhamdulillah! Berhasil mentransfer ${totalUploaded} transaksi ke MongoDB. Memori tablet telah dibersihkan dan stok di-reset ke 0 untuk operasional besok.`
      : 'Penyimpanan lokal tablet telah bersih dan di-reset ke 0.'
  };
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

