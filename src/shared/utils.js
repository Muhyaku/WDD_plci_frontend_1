// =============================================================================
// SHARED UTILITIES — Pure functions, no side effects
// =============================================================================

import { MENU_PLCI, MENU_MM, STOCK_BYPASS_IDS, API_URL, MENU_MASTER_URL, ACTIVITY_URL } from './constants.js';

// --- FORMAT RUPIAH ---
export const formatRupiah = (number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })
    .format(number || 0)
    .replace(/\u00A0/g, ' ')
    .replace(/Rp\s?/g, 'Rp. ');

// --- FORMAT NOMOR ANTRIAN ---
export const formatQueue = (num) => `A-${String(num).padStart(3, '0')}`;

// --- GET TODAY STRING (format Indonesia) ---
export const getTodayStr = () =>
  new Date().toLocaleDateString('id-ID', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });

// --- GET BASE MENU LIST BY BRAND ---
export const getBaseMenuList = (brand) => {
  if (brand === 'minang') return MENU_MM;
  return MENU_PLCI; // default: pecel
};

// --- CART KEY GENERATOR ---
// Membuat key unik agar item dengan catatan berbeda punya baris terpisah di cart
export const getCartKey = (id, options) => {
  if (!options) return `${id}_default`;
  return `${id}_${options.type}_${options.cabbage}_${options.sambal}_${options.note}`.replace(/[^a-zA-Z0-9_]/g, '');
};

// --- (REMOVED: buildCartItemsForDeduction) ---
// Stok sekarang dihitung 100% secara derived dari transaksi oleh calculateLiveStock().
// Tidak ada lagi panggilan ke /api/menu/deduct. Lihat implementation_plan.md.

// --- PARSE ITEMS STRING ---
// Mem-parse string transaksi (jenisPengeluaran) menjadi komponen terstruktur
// Input: "[UNPAID] [A-001] ** MAKAN SINI **, ** PAKE KOL BIASA **, 2x Lele Goreng, ++ PAY:Cash|18000|0"
// Output: { orderType, cabbageOpt, sambalOpt, note, payMethod, payGiven, payChange, realItems }
export const parseItemsString = (itemsStr) => {
  const cleanInput = (itemsStr || '').replace(/^(?:\[[^\]]+\]\s*)*/, '');
  const itemArray = cleanInput.split(',').map(i => i.trim()).filter(i => i);
  let orderType = '';
  let cabbageOpt = '';
  let sambalOpt = '';
  let note = '';
  let payMethod = '';
  let payGiven = 0;
  let payChange = 0;
  let realItems = [];

  itemArray.forEach(item => {
    if (item.startsWith('**')) {
      const cleanStr = item.replace(/\*/g, '').trim();
      if (cleanStr === 'MAKAN SINI' || cleanStr === 'BUNGKUS' || cleanStr === 'BAWA PULANG') orderType = cleanStr;
      else if (cleanStr.includes('KOL')) cabbageOpt = cleanStr;
      else sambalOpt = cleanStr;
    } else if (item.startsWith('++ CATATAN:')) {
      note = item.replace('++ CATATAN:', '').trim();
    } else if (item.startsWith('++ PAY:')) {
      const splitPay = item.replace('++ PAY:', '').trim().split('|');
      payMethod = splitPay[0];
      payGiven = parseInt(splitPay[1]) || 0;
      payChange = parseInt(splitPay[2]) || 0;
    } else {
      const parts = item.split('::');
      const mainItem = parts[0].trim();
      const subOptions = parts.length > 1
        ? parts[1].split('|').map(s => s.trim()).filter(s => s)
        : [];
      realItems.push({ main: mainItem, sub: subOptions });
    }
  });

  return { orderType, cabbageOpt, sambalOpt, note, payMethod, payGiven, payChange, realItems };
};

// --- FORMAT ITEM OPTIONS (for items in cart) ---
export const formatItemOptions = (opts) => {
  if (!opts) return '';
  let p = [];
  if (opts.type && opts.type !== 'Bawaan Global') p.push(opts.type);
  if (opts.cabbage && opts.cabbage !== 'Bawaan Global') p.push(opts.cabbage);
  if (opts.sambal && opts.sambal !== 'Bawaan Global') p.push(opts.sambal);
  if (opts.note) p.push(`Note: ${opts.note}`);
  return p.length > 0 ? ` :: ${p.join(' | ')}` : '';
};

// --- UNIFIED QUEUE NUMBER CALCULATOR ---
// Menghitung nomor antrian berikutnya (A-001, A-002, dst) secara konsisten di semua Mode Kasir
export const calculateNextQueueNumber = (rawData, localOrders = [], todayStr = '') => {
  const safeRaw = Array.isArray(rawData) ? rawData : [];
  const safeLocal = Array.isArray(localOrders) ? localOrders : [];
  const targetDate = todayStr || getTodayStr();

  let maxQueue = 0;

  // 1. Scan transactions from database for today
  safeRaw.forEach(t => {
    if (t.isDeleted || (t.jenisPengeluaran && t.jenisPengeluaran.includes('[LAPORAN SISTEM]'))) return;
    if (t.tanggal && t.tanggal !== targetDate) return;

    const match = (t.jenisPengeluaran || '').match(/A-(\d+)/);
    if (match && match[1]) {
      const qNum = parseInt(match[1], 10);
      if (qNum > maxQueue) maxQueue = qNum;
    }
  });

  // 2. Scan unpaid local orders / parked orders for today
  safeLocal.forEach(ord => {
    const queueStr = ord.queue || ord.id || '';
    const match = String(queueStr).match(/A-(\d+)/);
    if (match && match[1]) {
      const qNum = parseInt(match[1], 10);
      if (qNum > maxQueue) maxQueue = qNum;
    }
  });

  return maxQueue + 1;
};

// --- LIVE STOCK CALCULATOR ---
// Menghitung stok live dari kombinasi: activityLogs + transaksi hari ini (UNPAID/PARKIR + LUNAS)
// Ini adalah satu-satunya mekanisme kalkulasi stok — tidak ada versi lain!
export const calculateLiveStock = (rawData, activityLogs, masterMenus, baseMenuList, todayStr, sheetName) => {
  const safeMaster = Array.isArray(masterMenus) ? masterMenus : [];
  const safeLogs = Array.isArray(activityLogs) ? activityLogs : [];
  const safeRaw = Array.isArray(rawData) ? rawData : [];

  const stockResult = {};

  // 1. Ambil transaksi valid hari ini (termasuk yang belum bayar/UNPAID/parkir & LUNAS)
  const targetTransactions = safeRaw.filter(t =>
    (!t.tanggal || t.tanggal === todayStr) &&
    !t.isDeleted &&
    t.totalPengeluaran === 0 &&
    !(t.jenisPengeluaran || '').includes('[LAPORAN SISTEM]')
  );

  // 2. Ambil log ubah stok hari ini di cabang ini
  const targetLogs = safeLogs.filter(l =>
    (!l.dateString || l.dateString === todayStr || l.dateString === 'Rekap Stok Otomatis') &&
    !l.isDeleted &&
    l.actionCategory === 'UBAH_STOK' &&
    (!sheetName || l.sheet === sheetName)
  );

  // 3. Parsing data penjualan hari ini
  const soldItemsMap = {};
  targetTransactions.forEach(tx => {
    // Robust regex untuk menghapus SEMUA prefiks dalam kurung siku seperti [UNPAID], [A-001], [A-002 (Ambil: Bebas)]
    const cleanItemsStr = (tx.jenisPengeluaran || '').replace(/^(?:\[[^\]]+\]\s*)*/, '');
    const itemArray = (cleanItemsStr || '').split(',').map(i => i.trim()).filter(i => i && !i.startsWith('**') && !i.startsWith('++'));

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

  // 4. Bikin pemetaan menu aktif
  const activeMenus = baseMenuList.map(baseItem => {
    let stockRefId = baseItem.id;
    if (stockRefId.startsWith('pkt-')) stockRefId = stockRefId.replace('pkt-', '');
    else if (stockRefId.startsWith('paket-')) stockRefId = stockRefId.replace('paket-', '');

    const dbItemExact = safeMaster.find(m => m.menuId === baseItem.id);
    const dbItemStockRef = safeMaster.find(m => m.menuId === baseItem.id || m.menuId === stockRefId);
    return {
      id: baseItem.id,
      name: dbItemExact ? dbItemExact.name : baseItem.name,
      dbStock: dbItemStockRef ? (dbItemStockRef.stock ?? 0) : 0,
      stockRefId: stockRefId,
    };
  });

  const sortedMenus = [...activeMenus].sort((a, b) => b.name.length - a.name.length);

  // 5. Hitung total terjual per stockRefId (dengan normalisasi varian Paha/Dada agar potong stok tunggal)
  const terjualMap = {};
  Object.entries(soldItemsMap).forEach(([soldName, qty]) => {
    if (qty <= 0) return;

    // Normalisasi varian: hapus dalam kurung dan kata paha/dada/porsi agar selalu ke 1 stok tunggal
    const cleanSold = soldName
      .replace(/\(.*\)/g, '')
      .replace(/\b(paha|dada|1\/2 porsi|full porsi)\b/gi, '')
      .trim()
      .toLowerCase();

    const menuMatch = sortedMenus.find(m => {
      const mNameClean = m.name.toLowerCase()
        .replace(/\(.*\)/g, '')
        .replace(/\b(paha|dada|1\/2 porsi|full porsi)\b/gi, '')
        .trim();

      return (
        soldName.toLowerCase().includes(mNameClean) ||
        cleanSold === mNameClean ||
        cleanSold.includes(mNameClean)
      );
    });

    if (menuMatch) {
      const refId = menuMatch.stockRefId;
      if (!terjualMap[refId]) terjualMap[refId] = 0;
      terjualMap[refId] += qty;
    }
  });

  // 6. Hitung total input log per stockRefId (hanya dari base menu)
  const inputMap = {};
  const uniqueBaseMenus = [];
  activeMenus.forEach(m => {
    if (m.id === m.stockRefId && !uniqueBaseMenus.find(u => u.id === m.id)) {
      uniqueBaseMenus.push(m);
    }
  });

  uniqueBaseMenus.forEach(baseMenu => {
    const refId = baseMenu.stockRefId;
    const baseItemObj = baseMenuList.find(b => b.id === baseMenu.id);
    const defaultName = baseItemObj ? baseItemObj.name.toLowerCase() : '';
    const currentName = baseMenu.name ? baseMenu.name.toLowerCase() : '';

    const itemLogs = targetLogs.filter(log => {
      const logName = (log.menuName || '').toLowerCase();
      return (logName === currentName) ||
        (defaultName && logName === defaultName) ||
        (currentName && logName.includes(currentName)) ||
        (defaultName && logName.includes(defaultName));
    });

    if (itemLogs.length > 0) {
      let totalInput = 0;
      itemLogs.forEach(log => {
        const match = log.detailAction.match(/dari \[([^\]]+)\] menjadi \[(\d+)\]/);
        if (match) {
          const oldVal = match[1].includes('HABIS') ? 0 : parseInt(match[1], 10);
          const newVal = parseInt(match[2], 10);
          const diff = newVal - oldVal;
          if (diff !== 0) totalInput += diff;
        }
      });
      inputMap[refId] = totalInput;
    } else {
      // Tidak ada log restock hari ini → dbStock adalah stok awal yang di-set via Edit Product.
      inputMap[refId] = baseMenu.dbStock;
    }
  });

  // 7. Hitung sisa akhir live: Input Modal - Terjual Laku
  uniqueBaseMenus.forEach(baseMenu => {
    const refId = baseMenu.stockRefId;
    const input = inputMap[refId] || 0;
    const terjual = terjualMap[refId] || 0;
    stockResult[refId] = Math.max(0, input - terjual);
  });

  return stockResult;
};

// --- MERGE MENU WITH LIVE STOCK + DB PRICE ---
// Menggabungkan base menu list dengan harga dari DB dan stok live dari kalkulasi
export const buildActiveMenuList = (baseMenuList, masterMenus, liveStockCalculations) => {
  const safeMaster = Array.isArray(masterMenus) ? masterMenus : [];
  const safeCalc = liveStockCalculations || {};

  return baseMenuList.map(baseItem => {
    let stockRefId = baseItem.id;
    if (stockRefId.startsWith('pkt-')) stockRefId = stockRefId.replace('pkt-', '');
    else if (stockRefId.startsWith('paket-')) stockRefId = stockRefId.replace('paket-', '');

    const dbItemSelf = safeMaster.find(m => m.menuId === baseItem.id);
    const calculatedStock = safeCalc[stockRefId] !== undefined
      ? safeCalc[stockRefId]
      : 0;

    return {
      ...baseItem,
      name: dbItemSelf ? dbItemSelf.name : baseItem.name,
      price: dbItemSelf ? dbItemSelf.price : baseItem.price,
      stock: calculatedStock,
      stockRefId,
    };
  });
};

// --- (REMOVED: restoreStockFromStr) ---
// Stok sekarang derived dari transaksi oleh calculateLiveStock().
// Menghapus transaksi otomatis mengembalikan stok (karena transaksi yang terhapus
// tidak lagi masuk ke perhitungan "terjual").

// --- FETCH MENU DATA (menu master + activity logs) ---
export const fetchMenuData = async (sheetName) => {
  try {
    const [resMenu, resLog] = await Promise.all([
      fetch(`${MENU_MASTER_URL}?sheet=${encodeURIComponent(sheetName)}`),
      fetch(ACTIVITY_URL),
    ]);
    const menuData = resMenu.ok ? await resMenu.json() : [];
    const logData = resLog.ok ? await resLog.json() : [];
    return {
      masterMenus: Array.isArray(menuData) ? menuData : [],
      activityLogs: Array.isArray(logData) ? logData : [],
    };
  } catch (e) {
    console.error('Error fetching menu data:', e);
    return { masterMenus: [], activityLogs: [] };
  }
};

// --- FETCH TRANSACTIONS FOR TODAY ---
export const fetchTodayTransactions = async (sheetName) => {
  try {
    const todayStr = getTodayStr();
    const fetchUrl = `${API_URL}?sheet=${encodeURIComponent(sheetName)}&tanggal=${encodeURIComponent(todayStr)}`;
    const res = await fetch(fetchUrl);
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('Error fetching today transactions:', e);
    return [];
  }
};
