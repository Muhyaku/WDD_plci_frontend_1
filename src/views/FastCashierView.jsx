// =============================================================================
// FAST CASHIER VIEW — PIN 2020
// Fungsi: Penjualan Kasir Cepat (Fast Mode 1-Click, parking order, zero popup)
// Yang TIDAK ada: 3-column resizer, Edit Master, Beli Bahan, Bluetooth printer
// =============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock, ArrowLeft, Loader2, Wallet, CreditCard, ShoppingBag,
  Trash2, RefreshCw, X, AlertCircle, LogOut, CloudUpload
} from 'lucide-react';

import {
  API_URL, MENU_MASTER_URL, STOCK_BYPASS_IDS, NASI_OPTIONS
} from '../shared/constants';

import {
  formatRupiah, formatQueue, getTodayStr, getBaseMenuList,
  getCartKey, buildActiveMenuList, calculateLiveStock,
  calculateNextQueueNumber, fetchMenuData, fetchTodayTransactions
} from '../shared/utils';

import SyncModal from '../components/SyncModal';
import {
  saveLocalTransaction,
  updateLocalTransaction,
  saveLocalParkedOrder,
  deleteLocalParkedOrder,
  getSyncStats
} from '../services/localDb';

export default function FastCashierView({ branchInfo, onLogout }) {
  // --- DATA STATE ---
  const [masterMenus, setMasterMenus] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // --- CART STATE ---
  const [cart, setCart] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fastCheckoutModal, setFastCheckoutModal] = useState(null);
  const [stockAlert, setStockAlert] = useState(null);

  // --- VARIANT MODAL STATE (Nasi & Ayam / items with options) ---
  const [variantModal, setVariantModal] = useState({ isOpen: false, item: null, options: [] });
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mobileTab, setMobileTab] = useState('menu');

  // --- LOCAL ORDERS (Tahan / Parkir) ---
  const [localOrders, setLocalOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(`unpaid_orders_${branchInfo.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    if (branchInfo?.id) {
      localStorage.setItem(`unpaid_orders_${branchInfo.id}`, JSON.stringify(localOrders));
    }
  }, [localOrders, branchInfo]);

  const todayStr = useMemo(() => getTodayStr(), []);
  const baseMenuList = useMemo(() => getBaseMenuList(branchInfo.brand), [branchInfo.brand]);

  // --- FETCH DATA ---
  const loadData = useCallback(async () => {
    setIsFetching(true);
    try {
      const [menuResult, txData] = await Promise.all([
        fetchMenuData(branchInfo.sheetName),
        fetchTodayTransactions(branchInfo.sheetName),
      ]);
      setMasterMenus(menuResult.masterMenus || []);
      setActivityLogs(menuResult.activityLogs || []);
      setRawData(txData || []);

      // Ambil jumlah pending sync lokal
      getSyncStats(branchInfo.sheetName)
        .then(s => setPendingSyncCount(s.pending))
        .catch(() => {});
    } catch (e) {
      console.error('Gagal load data fast cashier:', e);
    } finally {
      setIsFetching(false);
    }
  }, [branchInfo.sheetName]);

  useEffect(() => {
    loadData();
    // Realtime auto-refresh polling every 15 seconds
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // --- LIVE STOCK CALCULATIONS ---
  const liveStockCalculations = useMemo(() =>
    calculateLiveStock(rawData, activityLogs, masterMenus, baseMenuList, todayStr, branchInfo.sheetName),
    [rawData, activityLogs, masterMenus, baseMenuList, todayStr, branchInfo.sheetName]
  );

  const activeMenuList = useMemo(() =>
    buildActiveMenuList(baseMenuList, masterMenus, liveStockCalculations),
    [baseMenuList, masterMenus, liveStockCalculations]
  );

  // Filter local orders for today
  const employeeLocalOrders = useMemo(() => {
    return localOrders.filter(order => {
      const isUnpaid = order.status === 'BELUM_BAYAR';
      if (order.tanggal) return isUnpaid && order.tanggal === todayStr;
      return isUnpaid;
    });
  }, [localOrders, todayStr]);

  // Antrian number calculation based on actual sales transactions
  const currentQueueNumber = useMemo(() => {
    return calculateNextQueueNumber(rawData, localOrders, todayStr);
  }, [rawData, localOrders, todayStr]);

  // Cart totals
  const totalCartPrice = useMemo(() => {
    return Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);
  }, [cart]);

  // --- CART FUNCTIONS ---
  const addToCart = (item, customPrice = null) => {
    const finalPrice = customPrice !== null ? customPrice : item.price;
    const stockRefId = item.stockRefId || item.id;
    const isBypass = STOCK_BYPASS_IDS.includes(stockRefId) || STOCK_BYPASS_IDS.includes(item.id);
    const availableStock = liveStockCalculations[stockRefId] ?? (item.stock || 0);

    // Calculate current total qty in cart for this stockRefId
    const currentCartQty = Object.values(cart)
      .filter(i => (i.stockRefId || i.id) === stockRefId)
      .reduce((sum, i) => sum + i.qty, 0);

    if (!isBypass && currentCartQty + 1 > availableStock) {
      setStockAlert(`⚠️ Stok ${item.name} tidak mencukupi! (Sisa stok: ${availableStock})`);
      setTimeout(() => setStockAlert(null), 3000);
      return;
    }

    // Unique cartKey per variant / name combination
    const cartKey = `${item.id}_${(item.name || '').toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    setCart(prev => {
      const existing = prev[cartKey];
      if (existing) {
        return { ...prev, [cartKey]: { ...existing, qty: existing.qty + 1 } };
      } else {
        return {
          ...prev,
          [cartKey]: {
            cartKey,
            id: item.id,
            name: item.name,
            price: finalPrice,
            qty: 1,
            stockRefId: stockRefId,
            category: item.category,
          }
        };
      }
    });
  };

  const decreaseQty = (cartKey) => {
    setCart(prev => {
      const existing = prev[cartKey];
      if (!existing) return prev;
      if (existing.qty <= 1) {
        const copy = { ...prev };
        delete copy[cartKey];
        return copy;
      }
      return { ...prev, [cartKey]: { ...existing, qty: existing.qty - 1 } };
    });
  };

  // --- FAST MODE ITEM CLICK ---
  const handleFastModeClick = (item) => {
    const stockRefId = item.stockRefId || item.id;
    const isBypass = STOCK_BYPASS_IDS.includes(stockRefId) || STOCK_BYPASS_IDS.includes(item.id);
    const availableStock = liveStockCalculations[stockRefId] ?? (item.stock || 0);

    if (!isBypass && availableStock <= 0) {
      setStockAlert(`⚠️ Stok ${item.name} Habis! Silakan re-stok.`);
      setTimeout(() => setStockAlert(null), 3000);
      return;
    }

    if (item.id === 'nasi') {
      setSelectedVariant(null);
      setVariantModal({
        isOpen: true,
        item,
        title: 'Pilih Porsi Nasi',
        subtitle: 'Pilih ukuran porsi untuk Nasi Putih',
        options: NASI_OPTIONS,
      });
      return;
    }

    if (item.hasVariants && item.hasVariants.length > 0) {
      setSelectedVariant(null);
      setVariantModal({
        isOpen: true,
        item,
        title: `Pilih Bagian ${item.name}`,
        subtitle: `Pilih bagian potongan untuk ${item.name}`,
        options: item.hasVariants.map(varOpt => ({
          label: varOpt,
          price: item.price
        }))
      });
      return;
    }

    addToCart(item);
  };

  const confirmVariant = () => {
    if (!selectedVariant || !variantModal.item) return;
    const baseItem = variantModal.item;
    let finalName = baseItem.name;
    let finalPrice = selectedVariant.price !== undefined ? selectedVariant.price : baseItem.price;

    if (baseItem.id === 'nasi') {
      if (selectedVariant.label === '1/2 Porsi') {
        finalName = 'Nasi (1/2 Porsi)';
      } else {
        finalName = 'Nasi Putih';
      }
    } else {
      finalName = `${baseItem.name} (${selectedVariant.label})`;
    }

    addToCart({ ...baseItem, name: finalName, price: finalPrice });
    setVariantModal({ isOpen: false, item: null, options: [] });
    setSelectedVariant(null);
  };

  // --- EXECUTE FAST SALE ---
  const executeFastSale = async (fastPayMethod, isPark = false) => {
    if (isSubmitting || Object.keys(cart).length === 0) return;
    setIsSubmitting(true);

    const parts = [
      `** MAKAN SINI **`,
      `** PAKE KOL BIASA **`,
      `** PAKE SEMUA **`,
      ...Object.values(cart).map(i => `${i.qty}x ${i.name}`)
    ];

    parts.push(`++ PAY:${fastPayMethod}|${totalCartPrice}|0`);
    const itemsStr = parts.join(', ');
    const qStr = formatQueue(currentQueueNumber);
    const finalQueueStr = isPark ? `${qStr} (Ambil: Bebas/Nanti)` : qStr;

    const transactionDataForPrint = {
      queue: finalQueueStr,
      items: itemsStr,
      total: totalCartPrice,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      printCount: 0,
      status: isPark ? 'BELUM_BAYAR' : 'LUNAS'
    };

    const cartItems = Object.values(cart).map(i => ({
      menuId: i.id,
      name: i.name,
      qty: Number(i.qty) || 1,
      price: Number(i.price) || 0
    }));

    const payloads = [{
      sheet: branchInfo.sheetName,
      tanggal: todayStr,
      cash: isPark ? 0 : (fastPayMethod === 'Cash' ? totalCartPrice : 0),
      bca: isPark ? 0 : (fastPayMethod === 'BCA' ? totalCartPrice : 0),
      gofood: isPark ? 0 : (fastPayMethod === 'QRIS' ? totalCartPrice : 0),
      jenisPengeluaran: isPark ? `[UNPAID] [${finalQueueStr}] ${itemsStr}` : `[${finalQueueStr}] ${itemsStr}`,
      totalPengeluaran: 0,
      createdAt: new Date().toISOString(),
      items: cartItems
    }];

    // --- ATOMIC PERSISTENCE: Simpan transaksi ke IndexedDB lokal (<50ms) ---
    const localRecord = await saveLocalTransaction(payloads[0]);

    setRawData(prev => [...prev, localRecord]);

    if (isPark) {
      const newOrder = {
        ...transactionDataForPrint,
        id: localRecord.localId || Date.now(),
        localId: localRecord.localId,
        dbId: null,
        status: 'BELUM_BAYAR',
        tanggal: todayStr,
        createdAt: payloads[0].createdAt,
        rawCart: cart,
        itemsList: cartItems,
      };
      setLocalOrders(prev => [...prev, newOrder]);
      saveLocalParkedOrder(newOrder).catch(console.warn);
    }

    // --- OPTIMISTIC: Clear cart & release UI immediately ---
    setCart({});
    setIsSubmitting(false);

    getSyncStats(branchInfo.sheetName)
      .then(s => setPendingSyncCount(s.pending))
      .catch(() => {});
  };

  // --- MARK TAPPING ORDER AS PAID ---
  const markAsPaid = async (orderId, payMethod) => {
    if (isSubmitting) return;
    const targetOrder = localOrders.find(o => o.id === orderId || o.localId === orderId);
    if (!targetOrder) return;

    setIsSubmitting(true);
    
    const cleanItemsStr = (targetOrder.items || '')
      .replace(/,\s*\+\+\s*PAY:.*$/, '')
      .replace(/^\[UNPAID\]\s*\[.*?\]\s*/, '');

    const queueLabel = targetOrder.queue.split(' (')[0];
    const finalJenisPengeluaran = `[${queueLabel}] ${cleanItemsStr}, ++ PAY:${payMethod}|${targetOrder.total}|0`;

    const payload = {
      sheet: branchInfo.sheetName,
      tanggal: todayStr,
      cash: payMethod === 'Cash' ? targetOrder.total : 0,
      bca: payMethod === 'BCA' ? targetOrder.total : 0,
      gofood: payMethod === 'QRIS' ? targetOrder.total : 0,
      jenisPengeluaran: finalJenisPengeluaran,
      totalPengeluaran: 0,
      overrideDbId: targetOrder.dbId || undefined,
    };

    if (targetOrder.localId) {
      await updateLocalTransaction(targetOrder.localId, payload);
    } else {
      await saveLocalTransaction(payload);
    }

    // --- OPTIMISTIC: Update rawData and localOrders immediately ---
    setRawData(prev => prev.map(t => 
      (t.localId === targetOrder.localId || (targetOrder.dbId && t._id === targetOrder.dbId)) ? { ...t, ...payload } : t
    ));
    setLocalOrders(prev => prev.map(o => 
      (o.id === orderId || o.localId === orderId) ? { ...o, status: 'LUNAS', items: finalJenisPengeluaran } : o
    ));
    deleteLocalParkedOrder(orderId).catch(console.warn);
    setIsSubmitting(false);
    loadData();
    getSyncStats(branchInfo.sheetName).then(s => setPendingSyncCount(s.pending)).catch(() => {});
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[100dvh] w-full overflow-hidden bg-gray-100 relative font-sans">
      {/* STOCK ALERT TOAST */}
      {stockAlert && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] bg-red-600 text-white font-bold px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2">
          <AlertCircle size={20} />
          {stockAlert}
        </div>
      )}

      {/* MOBILE & TABLET TAB BAR (< lg) */}
      <div className="lg:hidden flex bg-white border-b border-gray-200 p-1.5 shrink-0 gap-1.5 z-20">
        <button
          onClick={() => setMobileTab('menu')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            mobileTab === 'menu'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-600 bg-gray-100'
          }`}
        >
          ⚡ Fast Menu
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
            mobileTab === 'cart'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-600 bg-gray-100'
          }`}
        >
          🛒 Cart ({Object.keys(cart).length})
        </button>
      </div>

      {/* POP-UP CHECKOUT INSTAN BUAT PESANAN PARKIR */}
      {fastCheckoutModal && (
        <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-6 shadow-2xl max-w-lg w-full border border-gray-100 animate-in zoom-in-95 flex flex-col">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900">{fastCheckoutModal.queue.split(' (')[0]}</h3>
                <p className="text-xs font-bold text-gray-500 mt-1">Total Tagihan: <span className="text-orange-600 font-black">{formatRupiah(fastCheckoutModal.total)}</span></p>
              </div>
              <button onClick={() => setFastCheckoutModal(null)} className="p-2.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 transition-colors active:scale-95"><X size={24} /></button>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 max-h-48 overflow-y-auto">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Detail Menu Pesanan:</p>
              <div className="flex flex-col gap-2">
                {fastCheckoutModal.items.split(',').map((i, idx) => {
                  const str = i.trim();
                  if (str.startsWith('**') || str.startsWith('++')) return null;
                  const cleanName = str.split('::')[0].trim();
                  return <span key={idx} className="text-sm font-bold text-gray-800 leading-snug border-b border-gray-200/50 pb-2 last:border-0 last:pb-0">{cleanName}</span>;
                }).filter(Boolean)}
              </div>
            </div>

            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center">Selesaikan Pembayaran</p>
            <div className="grid grid-cols-3 gap-3">
              <button disabled={isSubmitting} onClick={async () => { await markAsPaid(fastCheckoutModal.id, 'Cash'); setFastCheckoutModal(null); }} className="py-4 bg-gray-900 text-white hover:bg-black rounded-xl font-black text-lg transition-all active:scale-95 shadow-lg border-b-4 border-gray-950 flex flex-col items-center disabled:opacity-50"><Wallet size={24} className="mb-1 opacity-80" />CASH</button>
              <button disabled={isSubmitting} onClick={async () => { await markAsPaid(fastCheckoutModal.id, 'BCA'); setFastCheckoutModal(null); }} className="py-4 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-black text-lg transition-all active:scale-95 shadow-sm flex flex-col items-center disabled:opacity-50"><CreditCard size={24} className="mb-1 opacity-80" />BCA</button>
              <button disabled={isSubmitting} onClick={async () => { await markAsPaid(fastCheckoutModal.id, 'QRIS'); setFastCheckoutModal(null); }} className="py-4 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl font-black text-lg transition-all active:scale-95 shadow-sm flex flex-col items-center disabled:opacity-50">QRIS</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VARIANT UNIFIED (NASI & AYAM) */}
      {variantModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 animate-in zoom-in-95">
            <h3 className="text-xl font-black text-gray-900 mb-1">{variantModal.title || 'Pilih Varian'}</h3>
            <p className="text-xs font-semibold text-gray-500 mb-4">{variantModal.subtitle || 'Pilih opsi produk yang sesuai'}</p>

            <div className={`grid gap-2 mb-6 ${variantModal.options.length > 2 ? 'grid-cols-3' : 'grid-cols-2'}`}>
              {variantModal.options.map(opt => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedVariant(opt)}
                  className={`p-3 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${selectedVariant?.label === opt.label ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-md scale-105' : 'border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100'}`}
                >
                  <span className="font-extrabold text-sm">{opt.label}</span>
                  {opt.price !== undefined && (
                    <span className="text-[10px] opacity-80">{formatRupiah(opt.price)}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setVariantModal({ isOpen: false, item: null, options: [] })} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold text-sm">Batal</button>
              <button onClick={confirmVariant} disabled={!selectedVariant} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md">Pilih</button>
            </div>
          </div>
        </div>
      )}

      {/* KIRI: AREA PARKIRAN & GRID MENU */}
      <div className={`w-full lg:w-[65%] xl:w-[70%] flex-col h-full overflow-hidden relative ${mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
        {/* BARIS ATAS: DAFTAR PARKIRAN */}
        <div className="bg-white p-3 border-b border-gray-200 flex gap-3 overflow-x-auto shrink-0 shadow-sm items-center h-[130px] scrollbar-hide">
          {/* REFRESH BUTTON */}
          <button onClick={loadData} disabled={isFetching} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-black text-xs px-2 py-2 rounded-2xl flex flex-col items-center justify-center shrink-0 h-full shadow-sm active:scale-95 transition-all w-[80px]">
            <RefreshCw size={24} className={`mb-1 ${isFetching ? 'animate-spin' : ''}`} /> REFRESH
          </button>

          {/* TAHAN PESANAN LABEL */}
          <div className="bg-orange-50 text-orange-600 font-black text-xs px-4 py-2 rounded-2xl border border-orange-200 flex flex-col items-center justify-center shrink-0 h-full shadow-inner text-center w-[100px]">
            <Clock size={28} className="mb-1" /> TAHAN<br />PESANAN
          </div>

          {employeeLocalOrders.map(order => {
            const cleanItems = order.items.split(',').map(i => {
              const str = i.trim();
              if (str.startsWith('**') || str.startsWith('++')) return null;
              return str.split('::')[0].trim();
            }).filter(Boolean).join(', ');

            return (
              <button key={order.id} onClick={() => setFastCheckoutModal(order)} className="bg-white border-2 border-gray-200 hover:border-orange-500 hover:shadow-md p-3 rounded-2xl shrink-0 text-left w-[260px] transition-all h-full flex flex-col group relative overflow-hidden active:scale-[0.98]">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-400 group-hover:bg-orange-600 transition-colors"></div>
                <div className="flex justify-between items-start mb-2 ml-2">
                  <span className="font-black text-gray-900 text-lg leading-none">{order.queue.split(' (')[0]}</span>
                  <span className="font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-100 text-xs shadow-sm">{formatRupiah(order.total)}</span>
                </div>
                <p className="text-xs font-bold text-gray-500 ml-2 line-clamp-2 leading-relaxed">{cleanItems}</p>
                <div className="mt-auto ml-2">
                  <span className="text-[10px] font-black text-white bg-gray-900 px-2.5 py-1 rounded-md shadow-sm group-hover:bg-orange-500 transition-colors">KLIK BAYAR</span>
                </div>
              </button>
            );
          })}
          {employeeLocalOrders.length === 0 && <div className="text-xs font-bold text-gray-400 italic px-6 flex items-center h-full">Belum ada pesanan yang ditahan...</div>}
        </div>

        {/* AREA BAWAH KIRI: GRID MENU RAKSASA */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto bg-gray-100 pb-24">
          {/* HERO SECTION: BEST SELLER */}
          <div className="mb-5">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span> BEST SELLER (1 KLIK)
            </p>
            <div className="grid grid-cols-2 gap-3 lg:gap-4">
              {activeMenuList.filter(m => ['paket-ayam', 'paket-lele', 'pkt-ayamgoreng', 'pkt-lele-goreng'].includes(m.id)).map(item => {
                const stockRefId = item.stockRefId || item.id;
                const isBypass = STOCK_BYPASS_IDS.includes(stockRefId) || STOCK_BYPASS_IDS.includes(item.id);
                const isHabis = !isBypass && item.stock <= 0;

                return (
                  <button key={item.id} onClick={() => handleFastModeClick(item)} disabled={isHabis} className={`relative p-4 lg:p-5 rounded-3xl border-2 font-black flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md active:scale-[0.96] transition-all h-32 lg:h-36 ${isHabis ? 'bg-gray-200 border-gray-300 text-gray-400 grayscale cursor-not-allowed' : 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-900'}`}>
                    <span className="leading-tight px-2 z-10 text-xl lg:text-2xl tracking-tight">{item.name}</span>
                    {isHabis ? (
                      <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] bg-red-500 text-white px-3 py-1 rounded-md shadow-sm tracking-widest">HABIS</span>
                    ) : (
                      <span className="mt-2 text-sm opacity-80 font-bold bg-white/60 px-3 py-0.5 rounded-full">{formatRupiah(item.price)}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SUB SECTION: MENU LAINNYA */}
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">MENU SATUAN & MINUMAN</p>
            <div className="grid grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
              {activeMenuList.filter(m => !['paket-ayam', 'paket-lele', 'pkt-ayamgoreng', 'pkt-lele-goreng'].includes(m.id)).map(item => {
                const stockRefId = item.stockRefId || item.id;
                const isBypass = STOCK_BYPASS_IDS.includes(stockRefId) || STOCK_BYPASS_IDS.includes(item.id);
                const isHabis = !isBypass && item.stock <= 0;

                let btnColor = "bg-white hover:bg-gray-50 border-gray-200 text-gray-800";
                if (item.category === 'Paketan') btnColor = "bg-red-50 hover:bg-red-100 border-red-200 text-red-900";
                else if (item.category === 'Lainnya') btnColor = "bg-green-50 hover:bg-green-100 border-green-200 text-green-900";

                return (
                  <button key={item.id} onClick={() => handleFastModeClick(item)} disabled={isHabis} className={`relative p-3 rounded-2xl border-2 font-black flex flex-col items-center justify-center text-center shadow-sm active:scale-[0.96] transition-transform h-24 ${isHabis ? 'bg-gray-200 border-gray-300 text-gray-400 grayscale cursor-not-allowed' : btnColor}`}>
                    <span className="leading-tight px-1 z-10 text-sm">{item.name}</span>
                    {isHabis && <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[9px] bg-red-500 text-white px-2 py-0.5 rounded shadow-sm tracking-widest">HABIS</span>}
                    {item.id === 'nasi' && !isHabis && <span className="absolute top-2 right-2 text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold border border-yellow-200 shadow-sm">Porsi</span>}
                    {['usus', 'sambal'].includes(item.id) && !isHabis && <span className="absolute top-2 right-2 text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold border border-blue-200 shadow-sm">Ada</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* KANAN: KERANJANG & CHECKOUT */}
      <div className={`w-full lg:w-[35%] xl:w-[30%] lg:min-w-[300px] lg:max-w-[350px] bg-white flex-col shadow-[-15px_0_30px_rgba(0,0,0,0.08)] z-40 border-l border-gray-200 h-full relative lg:absolute lg:top-0 lg:right-0 ${mobileTab === 'menu' ? 'hidden lg:flex' : 'flex'}`}>
        <div className="p-4 bg-gray-900 text-white flex justify-between items-center shrink-0 border-b border-gray-950">
          <span className="font-black text-base tracking-wider">ANTRIAN: {formatQueue(currentQueueNumber)}</span>
          {totalCartPrice > 0 && <button onClick={() => setCart({})} className="bg-red-500/20 text-red-400 hover:text-red-300 hover:bg-red-500/40 p-2 rounded-lg transition-colors"><Trash2 size={18} /></button>}
        </div>

        {/* LIST CART */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-50/50">
          {Object.keys(cart).length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 opacity-70">
              <ShoppingBag size={48} className="mb-3" />
              <p className="text-sm font-bold text-center">Keranjang Cepat<br />Masih Kosong</p>
            </div>
          ) : (
            Object.values(cart).map(item => (
              <div key={item.cartKey} className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-3 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden group gap-2">
                <div className="flex-1 leading-tight pr-2 z-10">
                  <p className="font-black text-gray-900 text-sm mb-1">{item.name}</p>
                  <p className="text-xs font-bold text-gray-400">{formatRupiah(item.price * item.qty)}</p>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl p-1 shadow-inner z-10 shrink-0 w-full xl:w-auto justify-between xl:justify-start">
                  <button onClick={() => decreaseQty(item.cartKey)} className="w-8 h-8 rounded-lg bg-white text-red-500 hover:bg-red-50 hover:text-red-600 font-black text-xl shadow-sm flex items-center justify-center transition-colors active:scale-90">-</button>
                  <span className="font-black text-gray-900 w-5 text-center text-lg">{item.qty}</span>
                  <button onClick={() => addToCart(item)} className="w-8 h-8 rounded-lg bg-gray-900 hover:bg-black text-white font-black text-xl shadow-sm flex items-center justify-center transition-colors active:scale-90">+</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* CHECKOUT AREA BAWAH */}
        <div className="p-4 sm:p-5 bg-white border-t border-gray-200 shrink-0 shadow-[0_-15px_30px_rgba(0,0,0,0.06)] relative z-20">
          <div className="flex justify-between items-end mb-4">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Harga</span>
            <span className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tighter leading-none">{formatRupiah(totalCartPrice)}</span>
          </div>

          <button onClick={() => executeFastSale('Cash', true)} disabled={totalCartPrice === 0 || isSubmitting} className="w-full py-4 mb-3 bg-orange-50 hover:bg-orange-100 text-orange-600 border-2 border-orange-200 rounded-xl font-black text-lg transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm">
            {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Clock size={20} />} TAHAN / PARKIR
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button onClick={() => executeFastSale('Cash')} disabled={totalCartPrice === 0 || isSubmitting} className="py-4 sm:py-5 bg-gray-900 text-white hover:bg-black rounded-xl font-black text-base sm:text-lg transition-all active:scale-95 disabled:opacity-50 border-b-4 border-gray-950 flex flex-col items-center justify-center leading-none shadow-lg">
              <Wallet size={22} className="mb-1 opacity-80" /> CASH
            </button>
            <button onClick={() => executeFastSale('BCA')} disabled={totalCartPrice === 0 || isSubmitting} className="py-4 sm:py-5 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-xl font-black text-base sm:text-lg transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center leading-none shadow-sm">
              <CreditCard size={22} className="mb-1 opacity-80" /> BCA
            </button>
            <button onClick={() => executeFastSale('QRIS')} disabled={totalCartPrice === 0 || isSubmitting} className="py-4 sm:py-5 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-xl font-black text-base sm:text-lg transition-all active:scale-95 disabled:opacity-50 flex flex-col items-center justify-center leading-none shadow-sm">
              QRIS
            </button>
          </div>
        </div>
      </div>

      {/* SYNC CLOUD MODAL */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        sheetName={branchInfo?.sheetName}
        onSyncComplete={loadData}
      />
    </div>
  );
}
