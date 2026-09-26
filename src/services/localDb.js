// =============================================================================
// LOCAL DATABASE SERVICE (IndexedDB Persistence for Offline-First POS)
// Pecel Lele Cabe Ijo - Kantin SMB
//
// Karakteristik:
// 1. Zero Native Dependency: 100% vanilla IndexedDB API berlandaskan Promise.
// 2. Transaction Atomicity: Setiap penulisan dilindungi `readwrite` transaction.
// 3. Crash Safety: Data tersimpan di disk NAND lokal tablet secara permanen.
// 4. Fallback Resilient: Jika IndexedDB diblokir, fallback ke localStorage memory.
// =============================================================================

const DB_NAME = 'PLCI_POS_LOCAL_DB';
const DB_VERSION = 2;

// Nama Object Stores (Tabel Lokal)
export const STORES = {
  TRANSACTIONS: 'transactions',
  MENU_MASTER: 'menu_master',
  ACTIVITY_LOGS: 'activity_logs',
  PARKED_ORDERS: 'parked_orders',
  SETTINGS: 'settings',
  SYNC_META: 'sync_meta',
  DAILY_STOCKS: 'daily_stocks'
};

let dbInstance = null;

// --- UNIQUE ID & DEVICE ID GENERATORS ---
export const generateLocalId = () => {
  const ts = Date.now();
  const rand = Math.random().toString(36).substring(2, 9);
  return `TX_LOC_${ts}_${rand}`;
};

export const getDeviceId = () => {
  try {
    let id = localStorage.getItem('pos_device_id');
    if (!id) {
      id = `DEV_SMB_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      localStorage.setItem('pos_device_id', id);
    }
    return id;
  } catch (e) {
    return 'DEV_SMB_DEFAULT';
  }
};

// --- INITIALIZE DATABASE ---
export function openDatabase() {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      console.warn('[LocalDb] IndexedDB tidak didukung pada browser ini.');
      return reject(new Error('IndexedDB is not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // 1. Store: TRANSACTIONS
      // Key: localId (string)
      if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
        const txStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'localId' });
        txStore.createIndex('sheet', 'sheet', { unique: false });
        txStore.createIndex('tanggal', 'tanggal', { unique: false });
        txStore.createIndex('syncStatus', 'syncStatus', { unique: false });
        txStore.createIndex('isDeleted', 'isDeleted', { unique: false });
        txStore.createIndex('createdAt', 'createdAt', { unique: false });
        txStore.createIndex('overrideDbId', 'overrideDbId', { unique: false });
        txStore.createIndex('serverDbId', '_id', { unique: false });
      }

      // 2. Store: MENU_MASTER
      // Key: menuId (string)
      if (!db.objectStoreNames.contains(STORES.MENU_MASTER)) {
        const menuStore = db.createObjectStore(STORES.MENU_MASTER, { keyPath: 'menuId' });
        menuStore.createIndex('sheet', 'sheet', { unique: false });
      }

      // 3. Store: ACTIVITY_LOGS
      // Key: autoIncrement id
      if (!db.objectStoreNames.contains(STORES.ACTIVITY_LOGS)) {
        const logStore = db.createObjectStore(STORES.ACTIVITY_LOGS, { keyPath: 'id', autoIncrement: true });
        logStore.createIndex('sheet', 'sheet', { unique: false });
        logStore.createIndex('dateString', 'dateString', { unique: false });
        logStore.createIndex('actionCategory', 'actionCategory', { unique: false });
        logStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // 4. Store: PARKED_ORDERS (Pesanan Parkir / Belum Bayar)
      // Key: id (string / number)
      if (!db.objectStoreNames.contains(STORES.PARKED_ORDERS)) {
        const parkStore = db.createObjectStore(STORES.PARKED_ORDERS, { keyPath: 'id' });
        parkStore.createIndex('sheet', 'sheet', { unique: false });
        parkStore.createIndex('status', 'status', { unique: false });
        parkStore.createIndex('tanggal', 'tanggal', { unique: false });
      }

      // 5. Store: SYNC_META
      // Key: key (string)
      if (!db.objectStoreNames.contains(STORES.SYNC_META)) {
        db.createObjectStore(STORES.SYNC_META, { keyPath: 'key' });
      }

      // 6. Store: DAILY_STOCKS (Data Stok Harian & Histori Penyesuaian +/-)
      // Key: id (string: `${sheet}_${tanggal}_${menuId}`)
      if (!db.objectStoreNames.contains(STORES.DAILY_STOCKS)) {
        const stockStore = db.createObjectStore(STORES.DAILY_STOCKS, { keyPath: 'id' });
        stockStore.createIndex('sheet', 'sheet', { unique: false });
        stockStore.createIndex('tanggal', 'tanggal', { unique: false });
        stockStore.createIndex('menuId', 'menuId', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      dbInstance.onversionchange = () => {
        dbInstance.close();
        dbInstance = null;
      };
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error('[LocalDb] Gagal membuka database IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

// Helper: Eksekusi transaksi IndexedDB
async function withStore(storeName, mode, callback) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);

    let result;
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(new Error('Transaction aborted'));

    try {
      result = callback(store, tx);
    } catch (err) {
      reject(err);
    }
  });
}

// Helper: Promisify IDBRequest
const promisify = (req) => new Promise((resolve, reject) => {
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});

// =============================================================================
// TRANSACTIONS REPOSITORY
// =============================================================================

/**
 * Menyimpan transaksi kasir baru ke IndexedDB secara atomic.
 * Status awal selalu: 'PENDING'
 */
export async function saveLocalTransaction(transactionData) {
  const now = new Date();
  const deviceId = getDeviceId();
  const localId = transactionData.localId || generateLocalId();

  const record = {
    ...transactionData,
    localId,
    deviceId,
    syncStatus: transactionData.syncStatus || 'PENDING',
    syncAttempts: transactionData.syncAttempts || 0,
    createdLocallyAt: transactionData.createdLocallyAt || now.toISOString(),
    createdAt: transactionData.createdAt || now.toISOString(),
    updatedAt: now.toISOString(),
    isDeleted: transactionData.isDeleted || false,
    deletedAt: transactionData.deletedAt || null,
    printCount: transactionData.printCount || 0
  };

  await withStore(STORES.TRANSACTIONS, 'readwrite', (store) => {
    store.put(record);
  });

  return record;
}

/**
 * Menyimpan banyak transaksi sekaligus (bulk import saat initial seed / migration)
 */
export async function saveLocalTransactionsBatch(txList) {
  if (!Array.isArray(txList) || txList.length === 0) return [];
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORES.TRANSACTIONS);

    const savedRecords = [];
    tx.oncomplete = () => resolve(savedRecords);
    tx.onerror = () => reject(tx.error);

    txList.forEach(item => {
      const localId = item.localId || (item._id ? `TX_SERVER_${item._id}` : generateLocalId());
      const record = {
        ...item,
        localId,
        syncStatus: item.syncStatus || (item._id ? 'SYNCED' : 'PENDING'),
        createdAt: item.createdAt || new Date().toISOString()
      };
      store.put(record);
      savedRecords.push(record);
    });
  });
}

/**
 * Mengambil seluruh transaksi hari ini di cabang tertentu.
 * Format output kompatibel 100% dengan respon API existing (GET /api/transactions)
 */
export async function getTodayLocalTransactions(sheetName, todayStr) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    const index = store.index('tanggal');
    const request = index.getAll(todayStr);

    request.onsuccess = () => {
      const records = request.result || [];
      // Filter per sheet jika dispesifikasikan
      const filtered = sheetName
        ? records.filter(r => (!r.sheet || r.sheet === sheetName))
        : records;

      // Urutkan berdasarkan createdAt ascending (identik dengan MongoDB backend: .sort({ createdAt: 1 }))
      filtered.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      resolve(filtered);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Mengambil semua transaksi berstatus 'PENDING' yang siap disinkronisasikan ke server.
 */
export async function getPendingTransactions(sheetName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    const index = store.index('syncStatus');
    const request = index.getAll('PENDING');

    request.onsuccess = () => {
      let records = request.result || [];
      if (sheetName) {
        records = records.filter(r => !r.sheet || r.sheet === sheetName);
      }
      resolve(records);
    };

    request.onerror = () => reject(request.error);
  });
}

/**
 * Memperbarui transaksi lokal berdasarkan localId (misal: saat update pelunasan tapping)
 */
export async function updateLocalTransaction(localId, updateData) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    const getReq = store.get(localId);

    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) {
        return reject(new Error(`Transaksi lokal ${localId} tidak ditemukan`));
      }
      const updated = {
        ...existing,
        ...updateData,
        localId,
        updatedAt: new Date().toISOString()
      };
      store.put(updated);
      tx.oncomplete = () => resolve(updated);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

/**
 * Menghapus transaksi lokal (soft delete atau hard delete sesuai parameter)
 */
export async function deleteLocalTransaction(idOrLocalId, isHardDelete = false) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORES.TRANSACTIONS);

    // Coba cari langsung dengan localId
    const getReq = store.get(idOrLocalId);

    getReq.onsuccess = () => {
      let record = getReq.result;

      if (!record) {
        // Coba cari via serverDbId jika id berupa Mongo ObjectId
        const serverIndex = store.index('serverDbId');
        const srvReq = serverIndex.get(idOrLocalId);

        srvReq.onsuccess = () => {
          record = srvReq.result;
          proceedDelete(record);
        };
        srvReq.onerror = () => proceedDelete(null);
      } else {
        proceedDelete(record);
      }
    };

    function proceedDelete(rec) {
      if (!rec) {
        return resolve(false);
      }
      if (isHardDelete) {
        store.delete(rec.localId);
      } else {
        rec.isDeleted = true;
        rec.deletedAt = new Date().toISOString();
        rec.syncStatus = 'PENDING'; // Tandai agar status hapus dikirim ke server saat sync
        store.put(rec);
      }
      tx.oncomplete = () => resolve(true);
    }

    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Menandai transaksi lokal sebagai SYNCED setelah server memberikan acknowledgement.
 */
export async function markTransactionsAsSynced(syncedResults) {
  if (!Array.isArray(syncedResults) || syncedResults.length === 0) return 0;
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    const nowIso = new Date().toISOString();
    let updatedCount = 0;

    tx.oncomplete = () => resolve(updatedCount);
    tx.onerror = () => reject(tx.error);

    syncedResults.forEach(item => {
      if (!item.localId) return;
      const getReq = store.get(item.localId);
      getReq.onsuccess = () => {
        const record = getReq.result;
        if (record) {
          record.syncStatus = 'SYNCED';
          record.syncedAt = nowIso;
          if (item._id) record._id = item._id;
          store.put(record);
          updatedCount++;
        }
      };
    });
  });
}

// =============================================================================
// MENU MASTER REPOSITORY
// =============================================================================

export async function saveLocalMenuMaster(menuList) {
  if (!Array.isArray(menuList)) return [];
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MENU_MASTER, 'readwrite');
    const store = tx.objectStore(STORES.MENU_MASTER);
    tx.oncomplete = () => resolve(menuList);
    tx.onerror = () => reject(tx.error);

    menuList.forEach(item => {
      if (item.menuId) {
        store.put({ ...item });
      }
    });
  });
}

export async function getLocalMenuMaster(sheetName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MENU_MASTER, 'readonly');
    const store = tx.objectStore(STORES.MENU_MASTER);
    const req = store.getAll();

    req.onsuccess = () => {
      let records = req.result || [];
      if (sheetName) {
        records = records.filter(r => !r.sheet || r.sheet === sheetName);
      }
      resolve(records);
    };

    req.onerror = () => reject(req.error);
  });
}

export async function updateLocalMenuItem(menuId, updates) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MENU_MASTER, 'readwrite');
    const store = tx.objectStore(STORES.MENU_MASTER);
    const getReq = store.get(menuId);

    getReq.onsuccess = () => {
      const existing = getReq.result || { menuId };
      const updated = { ...existing, ...updates, menuId };
      store.put(updated);
      tx.oncomplete = () => resolve(updated);
    };

    getReq.onerror = () => reject(getReq.error);
  });
}

// =============================================================================
// ACTIVITY LOGS REPOSITORY
// =============================================================================

export async function saveLocalActivityLogs(logsList) {
  if (!Array.isArray(logsList)) return [];
  const db = await openDatabase();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIVITY_LOGS, 'readwrite');
    const store = tx.objectStore(STORES.ACTIVITY_LOGS);
    tx.oncomplete = () => resolve(logsList);
    tx.onerror = () => reject(tx.error);

    logsList.forEach(log => {
      store.put({ ...log });
    });
  });
}

export async function addLocalActivityLog(logData) {
  const record = {
    ...logData,
    createdAt: logData.createdAt || new Date().toISOString(),
    isDeleted: false
  };

  await withStore(STORES.ACTIVITY_LOGS, 'readwrite', (store) => {
    store.add(record);
  });

  return record;
}

export async function getLocalActivityLogs(sheetName, limit = 200) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIVITY_LOGS, 'readonly');
    const store = tx.objectStore(STORES.ACTIVITY_LOGS);
    const req = store.getAll();

    req.onsuccess = () => {
      let records = req.result || [];
      if (sheetName) {
        records = records.filter(r => !r.sheet || r.sheet === sheetName);
      }
      records = records.filter(r => !r.isDeleted);
      records.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      resolve(records.slice(0, limit));
    };

    req.onerror = () => reject(req.error);
  });
}

// =============================================================================
// PARKED ORDERS (TAPPING / BELUM BAYAR) REPOSITORY
// =============================================================================

export async function saveLocalParkedOrder(orderData) {
  const id = orderData.id || Date.now();
  const record = {
    ...orderData,
    id,
    status: orderData.status || 'BELUM_BAYAR',
    updatedAt: new Date().toISOString()
  };

  await withStore(STORES.PARKED_ORDERS, 'readwrite', (store) => {
    store.put(record);
  });

  return record;
}

export async function getLocalParkedOrders(sheetName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PARKED_ORDERS, 'readonly');
    const store = tx.objectStore(STORES.PARKED_ORDERS);
    const req = store.getAll();

    req.onsuccess = () => {
      let records = req.result || [];
      if (sheetName) {
        records = records.filter(r => !r.sheet || r.sheet === sheetName);
      }
      resolve(records.filter(r => r.status === 'BELUM_BAYAR'));
    };

    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalParkedOrder(orderId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PARKED_ORDERS, 'readwrite');
    const store = tx.objectStore(STORES.PARKED_ORDERS);
    store.delete(orderId);
    tx.oncomplete = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

// =============================================================================
// SYNC STATS HELPER
// =============================================================================

export async function getSyncStats(sheetName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readonly');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    const req = store.getAll();

    req.onsuccess = () => {
      let records = req.result || [];
      if (sheetName) {
        records = records.filter(r => !r.sheet || r.sheet === sheetName);
      }
      const total = records.length;
      const pending = records.filter(r => r.syncStatus === 'PENDING').length;
      const synced = records.filter(r => r.syncStatus === 'SYNCED').length;
      const failed = records.filter(r => r.syncStatus === 'FAILED').length;

      resolve({ total, pending, synced, failed });
    };

    req.onerror = () => reject(req.error);
  });
}

// =============================================================================
// OFFLINE CLOSING & DAILY RESET FUNCTIONS (Reset ke 0 setelah Sync)
// =============================================================================

/**
 * Menghapus seluruh data transaksi lokal dari IndexedDB tablet
 */
export async function clearLocalTransactions(sheetName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.TRANSACTIONS, 'readwrite');
    const store = tx.objectStore(STORES.TRANSACTIONS);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Menghapus seluruh log aktivitas lokal dari IndexedDB tablet
 */
export async function clearLocalActivityLogs(sheetName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.ACTIVITY_LOGS, 'readwrite');
    const store = tx.objectStore(STORES.ACTIVITY_LOGS);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Menghapus seluruh pesanan parkir / belum bayar lokal dari tablet
 */
export async function clearLocalParkedOrders(sheetName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.PARKED_ORDERS, 'readwrite');
    const store = tx.objectStore(STORES.PARKED_ORDERS);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Mereset stok seluruh menu master menjadi 0!
 * PENTING: Nama produk, harga jual, kategori, gambar TETAP DIPERTAHANKAN.
 */
export async function resetLocalMenuStock(sheetName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.MENU_MASTER, 'readwrite');
    const store = tx.objectStore(STORES.MENU_MASTER);
    const req = store.getAll();

    req.onsuccess = () => {
      const records = req.result || [];
      records.forEach(item => {
        if (!sheetName || !item.sheet || item.sheet === sheetName) {
          item.stock = 0;
          store.put(item);
        }
      });
      tx.oncomplete = () => resolve(records.length);
    };

    req.onerror = () => reject(req.error);
    tx.onerror = () => reject(tx.error);
  });
}

/**
 * Menghapus seluruh data stok harian lokal dari IndexedDB tablet
 */
export async function clearLocalDailyStocks(sheetName) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DAILY_STOCKS, 'readwrite');
    const store = tx.objectStore(STORES.DAILY_STOCKS);
    const req = store.clear();
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Reset menyeluruh harian kasir lokal (Closing Store Reset)
 * 1. Mengosongkan transaksi lokal (karena sudah ditransfer seutuhnya ke cloud MongoDB)
 * 2. Mengosongkan activity logs lokal
 * 3. Mengosongkan parked orders lokal
 * 4. Mereset stok menu lokal ke 0 (nama & harga tetap aman)
 * 5. Mengosongkan daily stocks lokal
 */
export async function resetLocalDailyState(sheetName) {
  await Promise.all([
    clearLocalTransactions(sheetName),
    clearLocalActivityLogs(sheetName),
    clearLocalParkedOrders(sheetName),
    resetLocalMenuStock(sheetName),
    clearLocalDailyStocks(sheetName)
  ]);
  return { success: true };
}

// =============================================================================
// DAILY STOCK & AUDIT HISTORI STOK (+ / -) REPOSITORY
// =============================================================================

/**
 * Mengambil data stok harian untuk item tertentu
 */
export async function getDailyStock(sheet, tanggal, menuId) {
  const id = `${sheet}_${tanggal}_${menuId}`;
  return withStore(STORES.DAILY_STOCKS, 'readonly', async (store) => {
    return promisify(store.get(id));
  });
}

/**
 * Mengambil semua data stok harian untuk tanggal dan cabang tertentu
 */
export async function getAllDailyStocks(sheet, tanggal) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES.DAILY_STOCKS, 'readonly');
    const store = tx.objectStore(STORES.DAILY_STOCKS);
    const index = store.index('tanggal');
    const req = index.getAll(tanggal);
    req.onsuccess = () => {
      const records = req.result || [];
      const filtered = sheet ? records.filter(r => !r.sheet || r.sheet === sheet) : records;
      resolve(filtered);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Menyimpan data stok harian (misal saat konfirmasi stok awal)
 */
export async function saveDailyStock(data) {
  const id = `${data.sheet}_${data.tanggal}_${data.menuId}`;
  const record = {
    ...data,
    id,
    updatedAt: new Date().toISOString()
  };
  await withStore(STORES.DAILY_STOCKS, 'readwrite', (store) => {
    store.put(record);
  });
  return record;
}

/**
 * Mencatat penyesuaian stok (+ atau -) ke histori stok harian
 * sekaligus mengupdate stok live di MENU_MASTER!
 */
export async function recordStockAdjustment({ sheet, tanggal, menuId, menuName, category, delta, type, currentStock }) {
  const id = `${sheet}_${tanggal}_${menuId}`;
  const now = new Date();
  const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  let existing = await getDailyStock(sheet, tanggal, menuId);
  if (!existing) {
    existing = {
      id,
      sheet,
      tanggal,
      menuId,
      menuName: menuName || menuId,
      category: category || 'Satuan',
      stokAwal: currentStock || 0,
      stokAwalTime: timeStr,
      isConfirmed: true,
      history: [],
      totalStokInput: currentStock || 0
    };
  }

  const baseInput = existing.totalStokInput !== undefined ? existing.totalStokInput : (existing.stokAwal || 0);
  const newStockAfter = Math.max(0, baseInput + delta);
  const adjustmentEntry = {
    delta,
    type, // 'penambahan' | 'pengurangan'
    time: timeStr,
    timestamp: now.toISOString(),
    currentStockAfter: newStockAfter,
    note: `${type === 'penambahan' ? 'Tambah' : 'Kurang'} via Kasir`
  };

  existing.history = Array.isArray(existing.history) ? [...existing.history, adjustmentEntry] : [adjustmentEntry];
  existing.totalStokInput = newStockAfter;
  existing.updatedAt = now.toISOString();

  await withStore(STORES.DAILY_STOCKS, 'readwrite', (store) => {
    store.put(existing);
  });

  // Sinkronkan juga stok ke MENU_MASTER lokal
  await updateLocalMenuItem(menuId, {
    stock: newStockAfter,
    lastUpdatedDate: tanggal
  });

  return existing;
}
