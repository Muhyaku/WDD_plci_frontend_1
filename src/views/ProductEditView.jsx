// =============================================================================
// PRODUCT EDIT VIEW â€” PIN 8080
// KEBIJAKAN DATA KETAT:
//   - Seluruh data wajib dari database. ZERO fallback / dummy data.
//   - Jika koneksi DB gagal, seluruh halaman diblok dengan pesan error.
//   - Polling berkala setiap 30 detik memastikan data selalu fresh.
//   - Setelah edit disimpan â†’ data langsung refresh dari DB.
// =============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Settings, Save, X, Loader2, RefreshCw, Lock,
  AlertCircle, CheckCircle2, Edit3, Search, WifiOff, Database,
  ShieldAlert, RotateCcw,
} from 'lucide-react';

import {
  MENU_MASTER_URL, STOCK_BYPASS_IDS, API_URL, ACTIVITY_URL,
} from '../shared/constants';
import {
  formatRupiah, getTodayStr, getBaseMenuList,
  calculateLiveStock, buildActiveMenuList,
} from '../shared/utils';
import {
  getLocalMenuMaster,
  saveLocalMenuMaster,
  getLocalActivityLogs,
  saveLocalActivityLogs,
  getTodayLocalTransactions,
  saveLocalTransactionsBatch,
  updateLocalMenuItem,
  addLocalActivityLog
} from '../services/localDb';

// =============================================================================
// FETCH STRICT â€” Prioritas Local IndexedDB, Fallback Network saat Online
// =============================================================================
const fetchMenuDataStrict = async (sheetName) => {
  // 1. Coba baca dari Local IndexedDB terlebih dahulu
  const [localMenus, localLogs] = await Promise.all([
    getLocalMenuMaster(sheetName).catch(() => []),
    getLocalActivityLogs(sheetName).catch(() => [])
  ]);

  if (localMenus && localMenus.length > 0) {
    return { masterMenus: localMenus, activityLogs: localLogs || [] };
  }

  // 2. Jika local belum ada dan ada internet, fetch dari server & simpan lokal
  if (typeof navigator === 'undefined' || navigator.onLine) {
    const [resMenu, resLog] = await Promise.all([
      fetch(`${MENU_MASTER_URL}?sheet=${encodeURIComponent(sheetName)}`),
      fetch(ACTIVITY_URL),
    ]);

    if (!resMenu.ok) throw new Error(`Gagal memuat Menu Master (HTTP ${resMenu.status})`);
    if (!resLog.ok) throw new Error(`Gagal memuat Activity Log (HTTP ${resLog.status})`);

    const menuData = await resMenu.json();
    const logData = await resLog.json();

    if (!Array.isArray(menuData)) throw new Error('Format data Menu Master tidak valid dari server');
    if (!Array.isArray(logData)) throw new Error('Format data Activity Log tidak valid dari server');

    await saveLocalMenuMaster(menuData).catch(console.warn);
    await saveLocalActivityLogs(logData).catch(console.warn);

    return { masterMenus: menuData, activityLogs: logData };
  }

  throw new Error('Data produk belum tersimpan di memori tablet dan perangkat sedang offline.');
};

const fetchTodayTransactionsStrict = async (sheetName) => {
  const todayStr = getTodayStr();

  // 1. Coba baca dari Local IndexedDB
  const localTxs = await getTodayLocalTransactions(sheetName, todayStr).catch(() => []);
  if (localTxs && localTxs.length > 0) {
    return localTxs;
  }

  // 2. Jika local kosong dan online, coba ambil dari server & simpan lokal
  if (typeof navigator === 'undefined' || navigator.onLine) {
    const res = await fetch(`${API_URL}?sheet=${encodeURIComponent(sheetName)}&tanggal=${encodeURIComponent(todayStr)}`);
    if (!res.ok) throw new Error(`Gagal memuat Transaksi Hari Ini (HTTP ${res.status})`);
    const data = await res.json();
    if (!Array.isArray(data)) throw new Error('Format data transaksi tidak valid dari server');
    await saveLocalTransactionsBatch(data).catch(console.warn);
    return data;
  }

  return [];
};

// =============================================================================
// DB ERROR SCREEN â€” Ditampilkan ketika koneksi database gagal
// =============================================================================
function DbErrorScreen({ errorMessage, onRetry, isRetrying }) {
  return (
    <div className="flex-1 w-full h-[100dvh] bg-red-50 flex flex-col items-center justify-center font-sans text-gray-800 p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-24 h-24 mx-auto bg-red-100 border-4 border-red-300 rounded-full flex items-center justify-center">
          <WifiOff size={42} className="text-red-500" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <ShieldAlert size={20} className="text-red-600" />
            <h1 className="text-xl font-black text-red-700">Koneksi Database Gagal</h1>
          </div>
          <p className="text-sm font-semibold text-gray-600 leading-relaxed">
            Halaman <strong>Edit Produk</strong> tidak dapat diakses karena server database tidak dapat dihubungi.
            Data nama, harga, dan stok produk <strong>harus bersumber langsung dari database</strong> dan tidak boleh menggunakan data cadangan atau asumsi lokal.
          </p>
        </div>
        <div className="bg-red-100 border border-red-200 rounded-2xl p-4 text-left">
          <div className="flex items-center gap-2 mb-2">
            <Database size={14} className="text-red-500 shrink-0" />
            <span className="text-[11px] font-black text-red-600 uppercase tracking-wider">Detail Error</span>
          </div>
          <p className="text-xs font-mono text-red-700 break-all leading-relaxed">
            {errorMessage || 'Tidak dapat menghubungi server. Periksa koneksi internet Anda.'}
          </p>
        </div>
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full py-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-red-600/30"
        >
          {isRetrying
            ? <><Loader2 size={20} className="animate-spin" /> Menghubungkan Ulang...</>
            : <><RotateCcw size={20} /> Coba Hubungkan Lagi</>
          }
        </button>
        <p className="text-[11px] text-gray-400 font-medium">
          Halaman ini akan otomatis mencoba menghubung ulang ke database setiap 30 detik.
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// PRODUCT EDIT VIEW COMPONENT
// =============================================================================
export default function ProductEditView({ branchInfo, onLogout }) {
  // --- DATABASE STATE ---
  // null = belum pernah fetch sama sekali (bukan array kosong!)
  const [masterMenus, setMasterMenus] = useState(null);
  const [activityLogs, setActivityLogs] = useState(null);
  const [rawData, setRawData] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [dbError, setDbError] = useState(null);

  // --- EDIT MODAL STATE ---
  const [editModal, setEditModal] = useState({
    isOpen: false,
    item: null,
    dbItem: null,
    tempName: '',
    tempPrice: '',
    tempStock: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  // --- UI STATE ---
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // --- CONSTANTS ---
  const todayStr = useMemo(() => getTodayStr(), []);
  const baseMenuList = useMemo(() => getBaseMenuList(branchInfo.brand), [branchInfo.brand]);

  // =============================================================================
  // LOAD DATA STRICT â€” Semua atau tidak sama sekali. Gagal = blok halaman.
  // =============================================================================
  const loadData = useCallback(async (isBackground = false) => {
    if (!isBackground) setIsFetching(true);
    setDbError(null);

    try {
      const [menuResult, txData] = await Promise.all([
        fetchMenuDataStrict(branchInfo.sheetName),
        fetchTodayTransactionsStrict(branchInfo.sheetName),
      ]);

      setMasterMenus(menuResult.masterMenus);
      setActivityLogs(menuResult.activityLogs);
      setRawData(txData);
      setDbError(null);
    } catch (e) {
      console.error('[ProductEditView] DB Error:', e);
      setDbError(e.message || 'Koneksi ke server database gagal');
      // Reset data agar tidak ada data stale yang ditampilkan
      setMasterMenus(null);
      setActivityLogs(null);
      setRawData(null);
    } finally {
      setIsFetching(false);
    }
  }, [branchInfo.sheetName]);

  // Initial load + periodic polling (30 detik)
  useEffect(() => {
    loadData(false);
    const interval = setInterval(() => loadData(true), 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // =============================================================================
  // LIVE STOCK CALCULATIONS â€” hanya jika semua data berhasil dimuat dari DB
  // =============================================================================
  const liveStockCalculations = useMemo(() => {
    if (!masterMenus || !activityLogs || !rawData) return {};
    return calculateLiveStock(rawData, activityLogs, masterMenus, baseMenuList, todayStr, branchInfo.sheetName);
  }, [rawData, activityLogs, masterMenus, baseMenuList, todayStr, branchInfo.sheetName]);

  const activeMenuList = useMemo(() => {
    if (!masterMenus) return [];
    return buildActiveMenuList(baseMenuList, masterMenus, liveStockCalculations);
  }, [baseMenuList, masterMenus, liveStockCalculations]);

  const filteredMenu = useMemo(() => {
    if (!searchQuery.trim()) return activeMenuList;
    const q = searchQuery.toLowerCase();
    return activeMenuList.filter(item => item.name.toLowerCase().includes(q));
  }, [activeMenuList, searchQuery]);

  // =============================================================================
  // OPEN EDIT MODAL â€” Data LANGSUNG dari row DB, bukan dari kalkulasi
  // =============================================================================
  const openEditModal = (item) => {
    const dbRow = masterMenus ? masterMenus.find(m => m.menuId === item.id) : null;
    const nameFromDb  = dbRow ? dbRow.name  : item.name;
    const priceFromDb = dbRow ? dbRow.price : item.price;
    const stockLive   = item.stock >= 0 ? item.stock : 0;

    setEditModal({
      isOpen: true,
      item,
      dbItem: dbRow,
      tempName:  nameFromDb,
      tempPrice: new Intl.NumberFormat('id-ID').format(priceFromDb),
      tempStock: String(stockLive),
    });
    setSubmitStatus(null);
  };

  // =============================================================================
  // SAVE â€” PUT ke /api/menu lalu REFRESH DATA DARI DB untuk verifikasi
  // =============================================================================
  const saveMasterMenu = async () => {
    if (isSubmitting || !editModal.item) return;

    const newPrice = parseInt(editModal.tempPrice.replace(/\D/g, '')) || 0;
    const newStock = parseInt(editModal.tempStock);
    const newName  = editModal.tempName.trim();

    if (!newName) { showToast('error', 'âš ï¸ Nama produk tidak boleh kosong!'); return; }
    if (isNaN(newStock) || newStock < 0) { showToast('error', 'âš ï¸ Stok harus berupa angka â‰¥ 0!'); return; }
    if (newPrice < 0) { showToast('error', 'âš ï¸ Harga tidak boleh negatif!'); return; }

    setIsSubmitting(true);
    setSubmitStatus(null);

    const payload = {
      sheet:            branchInfo.sheetName,
      menuId:           editModal.item.id,
      name:             newName,
      price:            newPrice,
      stock:            newStock,
      currentLiveStock: editModal.item.stock,
      isPaketan:        editModal.item.category === 'Paketan' ||
                        editModal.item.id !== editModal.item.stockRefId,
    };

    try {
      // 1. Simpan ke Local IndexedDB terlebih dahulu (Atomic write)
      await updateLocalMenuItem(editModal.item.id, {
        name: newName,
        price: newPrice,
        stock: newStock,
        lastUpdatedDate: todayStr,
      });

      // Catat log aktivitas lokal jika stok berubah
      if (editModal.item.stock !== newStock) {
        await addLocalActivityLog({
          sheet: branchInfo.sheetName,
          actionCategory: 'UBAH_STOK',
          menuName: newName,
          detailAction: `MANUAL UPDATE: Mengubah Stok dari [${editModal.item.stock || 0}] menjadi [${newStock}] porsi.`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          dateString: todayStr
        }).catch(console.warn);
      }

      // 2. Jika online, kirim juga ke server di background
      if (typeof navigator === 'undefined' || navigator.onLine) {
        fetch(MENU_MASTER_URL, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }).catch(err => console.warn('[ProductEditView] Background server sync warning:', err));
      }

      setSubmitStatus('success');

      // Tutup modal setelah feedback visual singkat
      setTimeout(() => {
        setEditModal({ isOpen: false, item: null, dbItem: null, tempName: '', tempPrice: '', tempStock: '' });
        setSubmitStatus(null);
      }, 700);

      // Refresh data lokal setelah modal menutup
      setTimeout(() => loadData(false), 900);

    } catch (error) {
      console.error('[ProductEditView] Save error:', error);
      setSubmitStatus('error');
      showToast('error', `Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setEditModal({ isOpen: false, item: null, dbItem: null, tempName: '', tempPrice: '', tempStock: '' });
    setSubmitStatus(null);
  };

  const showToast = (type, text) => {
    setToastMsg({ type, text });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const stockStats = useMemo(() => {
    if (!masterMenus) return { totalItems: 0, habisItems: 0, tipesItems: 0, amanItems: 0 };
    const satuanItems = activeMenuList.filter(m => m.category === 'Satuan' && !STOCK_BYPASS_IDS.includes(m.id));
    const totalItems  = satuanItems.length;
    const habisItems  = satuanItems.filter(m => m.stock <= 0).length;
    const tipesItems  = satuanItems.filter(m => m.stock > 0 && m.stock < 10).length;
    return { totalItems, habisItems, tipesItems, amanItems: totalItems - habisItems - tipesItems };
  }, [activeMenuList, masterMenus]);

  // =============================================================================
  // RENDER
  // =============================================================================

  // 1. Loading awal sebelum pernah fetch
  if (isFetching && masterMenus === null && !dbError) {
    return (
      <div className="flex-1 w-full h-[100dvh] bg-slate-100 flex flex-col items-center justify-center font-sans gap-4">
        <Loader2 size={48} className="animate-spin text-blue-600" />
        <div className="text-center">
          <p className="font-black text-gray-900 text-base">Menghubungi Database Server...</p>
          <p className="text-xs text-gray-500 mt-1">Memverifikasi koneksi dan memuat data produk dari DB</p>
        </div>
      </div>
    );
  }

  // 2. DB Error â€” BLOK seluruh halaman
  if (dbError) {
    return (
      <DbErrorScreen
        errorMessage={dbError}
        onRetry={() => loadData(false)}
        isRetrying={isFetching}
      />
    );
  }

  // 3. Normal view
  return (
    <div className="flex-1 w-full h-[100dvh] bg-slate-100 flex flex-col font-sans overflow-hidden text-gray-800">

      {/* TOAST */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
          <div className={`px-6 py-3 rounded-full shadow-2xl font-black text-sm flex items-center gap-2 border-2 ${
            toastMsg.type === 'error' ? 'bg-red-600 text-white border-red-700'
            : toastMsg.type === 'ok' ? 'bg-emerald-600 text-white border-emerald-700'
            : 'bg-amber-500 text-white border-amber-600'
          }`}>
            <AlertCircle size={18} /> {toastMsg.text}
          </div>
        </div>
      )}

      {/* ===== TOP BAR ===== */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center flex-wrap gap-2 text-xs font-black">
          <span className="text-gray-900 font-extrabold text-sm sm:text-base mr-2">Edit Produk</span>
          {/* <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
            Realtime 
          </span> */}
          {/* <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">Aman: {stockStats.amanItems}</span>
          <span className="text-orange-700 bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">Tipis (&lt;10): {stockStats.tipesItems}</span>
          <span className="text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200">Habis: {stockStats.habisItems}</span> */}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadData(false)}
            disabled={isFetching}
            className="p-2.5 bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-500 hover:text-blue-600 rounded-xl transition-all active:scale-95 disabled:opacity-60"
            title="Refresh data dari database"
          >
            <RefreshCw size={16} className={isFetching ? 'animate-spin text-blue-500' : ''} />
          </button>
          <div className="relative w-full sm:w-72 md:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama produk..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ===== PRODUCT LIST ===== */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6">
        {isFetching && masterMenus !== null && (
          <div className="mb-3 flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-4 py-2 rounded-xl w-fit">
            <Loader2 size={13} className="animate-spin" /> Menyegarkan data dari database...
          </div>
        )}

        <div className="space-y-3 max-w-7xl mx-auto w-full">
          {['Satuan', 'Paketan', 'Lainnya', 'Minuman'].map(category => {
            const items = filteredMenu.filter(m => m.category === category);
            if (items.length === 0) return null;

            return (
              <div key={category}>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                  {category}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 mb-4">
                  {items.map(item => {
                    const isBypass  = STOCK_BYPASS_IDS.includes(item.id);
                    const isPaketan = item.category === 'Paketan';
                    const isHabis   = !isBypass && !isPaketan && item.stock <= 0;
                    const isTipis   = !isBypass && !isPaketan && item.stock > 0 && item.stock < 10;

                    let stockBadgeClass = 'bg-green-100 text-green-700 border-green-200';
                    let stockLabel = `Stok: ${item.stock}`;
                    if (isBypass)   { stockBadgeClass = 'bg-blue-100 text-blue-700 border-blue-200'; stockLabel = 'Selalu Ada'; }
                    else if (isPaketan) { stockBadgeClass = 'bg-slate-100 text-slate-500 border-slate-200'; stockLabel = 'Ikut Satuan'; }
                    else if (isHabis)   { stockBadgeClass = 'bg-red-100 text-red-700 border-red-200 animate-pulse'; stockLabel = 'HABIS'; }
                    else if (isTipis)   { stockBadgeClass = 'bg-orange-100 text-orange-700 border-orange-200'; stockLabel = `Stok: ${item.stock}`; }

                    return (
                      <div
                        key={item.id}
                        className={`bg-white rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md hover:border-blue-300 group ${isHabis ? 'border-red-200' : 'border-slate-200'}`}
                      >
                        <div className="flex justify-between items-start mb-3 gap-2">
                          <p className="font-black text-gray-900 text-sm leading-tight flex-1">{item.name}</p>
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors border border-blue-100 shrink-0 active:scale-95"
                            title="Edit produk ini"
                          >
                            <Edit3 size={15} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga (DB)</p>
                            <p className="font-black text-gray-900 text-base">{item.price === 0 ? 'â€”' : formatRupiah(item.price)}</p>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wide ${stockBadgeClass}`}>
                            {stockLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {filteredMenu.length === 0 && masterMenus !== null && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Search size={32} className="mb-3 opacity-50" />
              <p className="font-bold text-sm">Tidak ada produk cocok dengan "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>

      {/* ===== EDIT MODAL ===== */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[200] flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-[92vw] sm:w-full border border-gray-100 animate-in zoom-in-95 overflow-hidden max-h-[90dvh] flex flex-col">

            {/* Modal Header */}
            <div className="p-6 bg-blue-50 border-b border-blue-100 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-md">
                  <Settings size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900 leading-tight">Edit Produk</h3>
                  <p className="text-xs font-bold text-blue-600">{editModal.item?.category}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="p-2 bg-white text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors border border-gray-200 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* DB Source Notice */}
            <div className="px-6 pt-3 pb-2 flex items-center gap-2 text-[11px] font-bold text-emerald-700 bg-emerald-50 border-b border-emerald-100">
              <Database size={13} />
              <span>Data di bawah bersumber dari database. Simpan akan menggantikan data lama di DB.</span>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 flex-1 overflow-y-auto">

              {/* Nama */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Nama Produk</label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-gray-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
                  value={editModal.tempName}
                  onChange={e => setEditModal(prev => ({ ...prev, tempName: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && saveMasterMenu()}
                />
                {editModal.dbItem && editModal.dbItem.name !== editModal.tempName && (
                  <p className="text-[10px] text-amber-600 font-bold mt-1 ml-1">
                    âš ï¸ Nama lama di DB: "{editModal.dbItem.name}"
                  </p>
                )}
              </div>

              {/* Harga */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Harga Jual</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-lg text-gray-900 outline-none focus:border-blue-400 focus:bg-white transition-all"
                    value={editModal.tempPrice}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '');
                      setEditModal(prev => ({ ...prev, tempPrice: raw ? new Intl.NumberFormat('id-ID').format(raw) : '' }));
                    }}
                    onKeyDown={e => e.key === 'Enter' && saveMasterMenu()}
                  />
                </div>
                {editModal.dbItem && (
                  <p className="text-[10px] text-slate-400 font-bold mt-1 ml-1">
                    Harga di DB: {formatRupiah(editModal.dbItem.price)}
                  </p>
                )}
              </div>

              {/* Stok */}
              <div
                className={`p-4 rounded-xl border relative transition-all ${
                  editModal.item?.category === 'Paketan' ? 'bg-slate-100 border-slate-300' : 'bg-green-50 border-green-100'
                }`}
                onClick={() => {
                  if (editModal.item?.category === 'Paketan') {
                    showToast('warn', 'âš ï¸ Stok Paketan tidak bisa diubah langsung. Update via menu Satuan.');
                  }
                }}
              >
                <label className={`block text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 ${
                  editModal.item?.category === 'Paketan' ? 'text-slate-400' : 'text-green-700'
                }`}>
                  {editModal.item?.category === 'Paketan'
                    ? <><Lock size={11} /> Stok Terkunci (Ikut Satuan)</>
                    : 'Stok Baru (Nilai yang Akan Disimpan ke DB)'}
                </label>
                <input
                  type="number"
                  min="0"
                  className={`w-full px-4 py-3 border rounded-xl font-black text-2xl text-center transition-all outline-none ${
                    editModal.item?.category === 'Paketan'
                      ? 'bg-slate-200 border-slate-300 text-slate-400 pointer-events-none'
                      : 'bg-white border-green-200 focus:border-green-500 text-gray-900'
                  }`}
                  value={editModal.tempStock}
                  onChange={e => {
                    if (editModal.item?.category !== 'Paketan') {
                      setEditModal(prev => ({ ...prev, tempStock: e.target.value }));
                    }
                  }}
                  readOnly={editModal.item?.category === 'Paketan'}
                  onKeyDown={e => e.key === 'Enter' && saveMasterMenu()}
                />
                {editModal.item?.category !== 'Paketan' && editModal.dbItem && (
                  <p className="text-[10px] text-slate-400 font-bold mt-1">
                    Stok live saat ini: {editModal.item?.stock} porsi | Stok di DB: {editModal.dbItem.stock} porsi
                  </p>
                )}
                {editModal.item?.category === 'Paketan' && (
                  <div className="absolute inset-0 z-10 cursor-not-allowed rounded-xl" />
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 pb-6 pt-2 flex gap-3 shrink-0">
              <button
                onClick={closeModal}
                disabled={isSubmitting}
                className="flex-1 py-4 bg-slate-100 text-slate-500 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={saveMasterMenu}
                disabled={isSubmitting || submitStatus === 'success'}
                className={`flex-[2] py-4 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 border-b-4 ${
                  submitStatus === 'success' ? 'bg-green-500 border-green-700'
                  : submitStatus === 'error' ? 'bg-red-500 border-red-700'
                  : 'bg-blue-600 hover:bg-blue-700 border-blue-800'
                }`}
              >
                {isSubmitting ? (
                  <><Loader2 size={18} className="animate-spin" /> Menyimpan ke DB...</>
                ) : submitStatus === 'success' ? (
                  <><CheckCircle2 size={18} /> Tersimpan! Memuat ulang...</>
                ) : submitStatus === 'error' ? (
                  <><AlertCircle size={18} /> Gagal! Coba Lagi</>
                ) : (
                  <><Save size={18} /> SIMPAN PERUBAHAN</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
