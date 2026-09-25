// =============================================================================
// OFFLINE SYNC ENGINE
// Pecel Lele Cabe Ijo - Kantin SMB
//
// Karakteristik:
// 1. Idempotent Batch Upload: Mengirim transaksi lokal berstatus PENDING ke server.
// 2. Chunking Safety: Membagi pengiriman menjadi batch aman (25 item/request).
// 3. Strict Server Acknowledgement: Hanya menandai SYNCED jika server memberi HTTP 200/201.
// 4. Zero Data Deletion: Data lokal tetap tersimpan sebagai arsip kasir.
// 5. Fresh Data Rehydration: Mengunduh menu & activity logs terbaru setelah sync berhasil.
// =============================================================================

import { API_URL, MENU_MASTER_URL, ACTIVITY_URL, BACKEND_BASE_URL } from '../shared/constants';
import {
  getPendingTransactions,
  markTransactionsAsSynced,
  saveLocalMenuMaster,
  saveLocalActivityLogs,
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
 * Menjalankan proses sinkronisasi transaksi harian secara menyeluruh
 * @param {string} sheetName - Nama sheet cabang (contoh: 'PLCI Kantin SMB')
 * @param {function} onProgress - Callback progres opsional (current, total, message)
 */
export async function syncDailyTransactions(sheetName, onProgress = () => {}) {
  // 1. Validasi Sinyal & Healthcheck Server
  onProgress(0, 0, 'Memeriksa kestabilan koneksi internet & server...');
  const health = await checkServerConnection();
  if (!health.online) {
    throw new Error(health.message);
  }

  // 2. Ambil seluruh transaksi lokal berstatus PENDING
  onProgress(0, 0, 'Mengambil transaksi lokal yang belum terkirim...');
  const pendingTx = await getPendingTransactions(sheetName);

  if (pendingTx.length === 0) {
    onProgress(100, 100, 'Semua data transaksi sudah tersinkronisasi.');
    return {
      success: true,
      syncedCount: 0,
      totalPending: 0,
      message: 'Seluruh data transaksi hari ini sudah tersimpan di database MongoDB.'
    };
  }

  const total = pendingTx.length;
  let totalUploaded = 0;
  const errors = [];

  // 3. Bagi transaksi ke dalam beberapa batch (chunking)
  const chunks = [];
  for (let i = 0; i < total; i += CHUNK_SIZE) {
    chunks.push(pendingTx.slice(i, i + CHUNK_SIZE));
  }

  // 4. Proses pengiriman per batch
  for (let cIdx = 0; cIdx < chunks.length; cIdx++) {
    const chunk = chunks[cIdx];
    const chunkStart = cIdx * CHUNK_SIZE + 1;
    const chunkEnd = Math.min(total, (cIdx + 1) * CHUNK_SIZE);

    onProgress(
      Math.round((totalUploaded / total) * 90),
      total,
      `Mengirim data ${chunkStart} - ${chunkEnd} dari ${total} transaksi...`
    );

    // Format payload untuk API backend existing
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

      // Ambil respon data dari server untuk acknowledgement
      const serverData = Array.isArray(resJson.data) ? resJson.data : [resJson.data];

      // Petakan kembali localId ke _id dari server
      const ackList = chunk.map((tx, idx) => {
        const srv = serverData[idx] || {};
        return {
          localId: tx.localId,
          _id: srv._id || null
        };
      });

      // Tandai batch ini sebagai SYNCED di IndexedDB lokal secara atomic
      await markTransactionsAsSynced(ackList);
      totalUploaded += chunk.length;

    } catch (chunkErr) {
      console.error(`[SyncEngine] Gagal sinkronisasi batch ${cIdx + 1}:`, chunkErr);
      errors.push(`Batch ${cIdx + 1}: ${chunkErr.message}`);
      // Jika terjadi kegagalan di tengah jalan, STOP agar transaksi berikutnya tidak loncat urutan
      break;
    }
  }

  // 5. Unduh data master menu & activity logs terbaru dari MongoDB (Rehydration)
  if (totalUploaded > 0) {
    onProgress(95, total, 'Memperbarui master menu & log sistem dari server...');
    try {
      const [resMenu, resLog] = await Promise.all([
        fetch(`${MENU_MASTER_URL}?sheet=${encodeURIComponent(sheetName)}`),
        fetch(`${ACTIVITY_URL}?sheet=${encodeURIComponent(sheetName)}&limit=200`)
      ]);

      if (resMenu.ok) {
        const menuData = await resMenu.json();
        if (Array.isArray(menuData)) await saveLocalMenuMaster(menuData);
      }
      if (resLog.ok) {
        const logData = await resLog.json();
        if (Array.isArray(logData)) await saveLocalActivityLogs(logData);
      }
    } catch (rehydrateErr) {
      console.warn('[SyncEngine] Gagal rehydrate master menu setelah sync:', rehydrateErr);
      // Non-fatal, data transaksi lokal sudah aman terkirim
    }
  }

  // 6. Hitung statistik akhir
  const finalStats = await getSyncStats(sheetName);
  onProgress(100, total, 'Sinkronisasi selesai.');

  if (errors.length > 0) {
    return {
      success: false,
      syncedCount: totalUploaded,
      remainingPending: finalStats.pending,
      message: `Berhasil sinkronisasi ${totalUploaded} dari ${total} transaksi. Terdapat kendala pada ${errors.length} batch: ${errors.join(', ')}. Silakan coba lagi.`
    };
  }

  return {
    success: true,
    syncedCount: totalUploaded,
    remainingPending: finalStats.pending,
    message: `Alhamdulillah! Berhasil menyinkronkan seluruh ${totalUploaded} transaksi ke database MongoDB.`
  };
}
