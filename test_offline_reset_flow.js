import {
  calculateLiveStock,
  getBaseMenuList,
  buildActiveMenuList
} from './src/shared/utils.js';

console.log("=== TESTING OFFLINE INITIALIZATION & RESET FLOW ===");

// 1. Initial State: Fresh Install
const sheetName = 'PLCI Kantin SMB';
const baseList = getBaseMenuList(sheetName);

// Simulated localDb masterMenus on fresh install:
const freshMasterMenus = baseList.map(item => ({
  menuId: item.id,
  name: item.name,
  price: item.price,
  category: item.category,
  image: item.image,
  sheet: sheetName,
  stock: 0, // Zero initial stock!
  hasVariants: item.hasVariants || undefined,
}));

const freshTransactions = [];
const freshActivityLogs = [];

// Calculate live stock on fresh install:
const initialStock = calculateLiveStock(
  freshTransactions,
  freshActivityLogs,
  freshMasterMenus,
  baseList,
  '2026-09-25',
  sheetName
);

console.log("1. Initial stock on fresh install:", initialStock);
const nonZeroInitial = Object.entries(initialStock).filter(([k, v]) => v > 0);
if (nonZeroInitial.length === 0) {
  console.log("   [PASS] Semua stok awal adalah 0 pada saat fresh install!");
} else {
  console.error("   [FAIL] Ada stok awal tidak nol:", nonZeroInitial);
  process.exit(1);
}

// 2. Kasir input stok pagi hari via Product Edit: Lele = 50, Ayam = 40
const restockedLogs = [
  {
    actionCategory: 'UBAH_STOK',
    menuName: 'Lele Goreng',
    detailAction: 'MANUAL UPDATE: Mengubah Stok dari [0] menjadi [50] porsi.',
    dateString: '2026-09-25',
    sheet: sheetName
  },
  {
    actionCategory: 'UBAH_STOK',
    menuName: 'Ayam Goreng',
    detailAction: 'MANUAL UPDATE: Mengubah Stok dari [0] menjadi [40] porsi.',
    dateString: '2026-09-25',
    sheet: sheetName
  }
];

const stockAfterInput = calculateLiveStock(
  freshTransactions,
  restockedLogs,
  freshMasterMenus,
  baseList,
  '2026-09-25',
  sheetName
);

console.log("2. Stock after morning input:", { lele: stockAfterInput.lele, ayam: stockAfterInput.ayam });
if (stockAfterInput.lele === 50 && stockAfterInput.ayam === 40) {
  console.log("   [PASS] Stok lele 50 dan ayam 40 berhasil tersimpan di offline storage!");
} else {
  console.error("   [FAIL] Stok tidak sesuai setelah input:", stockAfterInput);
  process.exit(1);
}

// 3. Kasir melakukan transaksi penjualan offline seharian: 5x Lele, 3x Ayam
const dayTransactions = [
  {
    localId: 'TX_LOC_1',
    tanggal: '2026-09-25',
    totalPengeluaran: 0,
    jenisPengeluaran: '[A-001] 2x Lele Goreng, ++ PAY:Cash|30000|0',
    isDeleted: false
  },
  {
    localId: 'TX_LOC_2',
    tanggal: '2026-09-25',
    totalPengeluaran: 0,
    jenisPengeluaran: '[A-002] 3x Lele Goreng, 3x Ayam Goreng (Paha), ++ PAY:Cash|96000|0',
    isDeleted: false
  }
];

const stockAfterSales = calculateLiveStock(
  dayTransactions,
  restockedLogs,
  freshMasterMenus,
  baseList,
  '2026-09-25',
  sheetName
);

console.log("3. Stock after sales:", { lele: stockAfterSales.lele, ayam: stockAfterSales.ayam });
// Expected: Lele: 50 - 5 = 45; Ayam: 40 - 3 = 37
if (stockAfterSales.lele === 45 && stockAfterSales.ayam === 37) {
  console.log("   [PASS] Stok berkurang otomatis: Lele sisa 45, Ayam sisa 37!");
} else {
  console.error("   [FAIL] Stok tidak sesuai setelah penjualan:", stockAfterSales);
  process.exit(1);
}

// 4. Tutup Toko -> Klik SYNC: Data terkirim ke MongoDB -> Tablet di-reset ke 0!
// Simulated post-sync reset state:
const resetTransactions = [];
const resetActivityLogs = [];
const resetMasterMenus = freshMasterMenus.map(m => ({ ...m, stock: 0 }));

const stockAfterReset = calculateLiveStock(
  resetTransactions,
  resetActivityLogs,
  resetMasterMenus,
  baseList,
  '2026-09-26', // Besok pagi
  sheetName
);

console.log("4. Stock after closing sync & reset (Keesokan harinya):", stockAfterReset);
const nonZeroReset = Object.entries(stockAfterReset).filter(([k, v]) => v > 0);
if (nonZeroReset.length === 0) {
  console.log("   [PASS] Seluruh stok kembali ke 0, transaksi kosong, tablet bersih dan fresh untuk esok hari!");
} else {
  console.error("   [FAIL] Ada stok yang tidak nol setelah reset:", nonZeroReset);
  process.exit(1);
}

console.log("\n=== ALL OFFLINE ZERO-INIT & RESET FLOW TESTS PASSED! ===");
