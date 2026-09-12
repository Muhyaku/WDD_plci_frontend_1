// =============================================================================
// MODE KASIR NORMAL #2 — Visual Modern Tablet POS (Pixel-Perfect UI/UX)
// =============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, QrCode, User, Edit3, ShoppingCart, Trash2, Plus, Minus,
  CheckCircle2, Printer, AlertCircle, Loader2, Sparkles, RefreshCw,
  Tag, CreditCard, Wallet, Layers, FileText, ChevronDown, Check, X,
  Clock, Flame, DollarSign, Users, Award
} from 'lucide-react';

import {
  API_URL, MENU_MASTER_URL, STOCK_BYPASS_IDS
} from '../shared/constants';

import {
  formatRupiah, formatQueue, getTodayStr, getBaseMenuList,
  getCartKey, formatItemOptions,
  calculateLiveStock, buildActiveMenuList, calculateNextQueueNumber,
  fetchMenuData, fetchTodayTransactions
} from '../shared/utils';

export default function NormalCashierView2({
  branchInfo,
  onLogout,
  onSwitchMode
}) {
  // --- DATA & SYNC STATE ---
  const [masterMenus, setMasterMenus] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [rawData, setRawData] = useState([]);
  const [isFetching, setIsFetching] = useState(false);

  // --- SEARCH & CATEGORY ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua Produk');

  // --- CART STATE ---
  const [cart, setCart] = useState({});
  const [orderType, setOrderType] = useState('Makan Sini');
  const [discountAmount, setDiscountAmount] = useState(0); // Rp nominal
  const [taxPercent, setTaxPercent] = useState(0); // Tax percentage

  // --- CUSTOMER & NOTES ---
  const [customerName, setCustomerName] = useState('');
  const [orderNote, setOrderNote] = useState('');

  // --- LOCAL UNPAID ORDERS (Parkir Order / Tapping) ---
  const [localOrders, setLocalOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(`unpaid_orders_${branchInfo?.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    if (branchInfo?.id) {
      localStorage.setItem(`unpaid_orders_${branchInfo.id}`, JSON.stringify(localOrders));
    }
  }, [localOrders, branchInfo]);

  // --- MODALS STATE ---
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isCustomProductModalOpen, setIsCustomProductModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isListOrderModalOpen, setIsListOrderModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState('menu');

  // Modal payload targets
  const [selectedItemForVariant, setSelectedItemForVariant] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [customProduct, setCustomProduct] = useState({ name: '', price: '' });
  const [promoInput, setPromoInput] = useState({ type: 'nominal', value: '' });
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [amountPaidStr, setAmountPaidStr] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [printReceiptData, setPrintReceiptData] = useState(null);

  // Split bill state
  const [splitPersons, setSplitPersons] = useState(2);

  // --- DATA FETCHING ---
  const todayStr = useMemo(() => getTodayStr(), []);
  const baseMenuList = useMemo(() => getBaseMenuList(branchInfo?.brand), [branchInfo?.brand]);

  const loadData = useCallback(async () => {
    setIsFetching(true);
    try {
      const [txs, menusData] = await Promise.all([
        fetchTodayTransactions(branchInfo?.sheetName),
        fetchMenuData(branchInfo?.sheetName),
      ]);
      setRawData(txs || []);
      setMasterMenus(menusData.masterMenus || []);
      setActivityLogs(menusData.activityLogs || []);
    } catch (err) {
      console.error('Error fetching cashier data:', err);
    } finally {
      setIsFetching(false);
    }
  }, [branchInfo?.sheetName]);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  // --- LIVE STOCK & ACTIVE MENUS ---
  const liveStock = useMemo(() => {
    return calculateLiveStock(
      rawData,
      activityLogs,
      masterMenus,
      baseMenuList,
      todayStr,
      branchInfo?.sheetName
    );
  }, [rawData, activityLogs, masterMenus, baseMenuList, todayStr, branchInfo]);

  const activeMenuList = useMemo(() => {
    return buildActiveMenuList(baseMenuList, masterMenus, liveStock);
  }, [baseMenuList, masterMenus, liveStock]);

  // Antrian number calculation
  const currentQueueNumber = useMemo(() => {
    return calculateNextQueueNumber(rawData, localOrders, todayStr);
  }, [rawData, localOrders, todayStr]);

  // Categories list
  const categories = useMemo(() => {
    const setCat = new Set(['Semua Produk', 'Favorit']);
    activeMenuList.forEach((m) => {
      if (m.category) setCat.add(m.category);
    });
    return Array.from(setCat);
  }, [activeMenuList]);

  // Filtered product list
  const filteredProducts = useMemo(() => {
    return activeMenuList.filter((item) => {
      const matchSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;

      if (activeCategory === 'Semua Produk') return true;
      if (activeCategory === 'Favorit') return item.isFavorite || item.category === 'Paketan';
      return item.category === activeCategory;
    });
  }, [activeMenuList, searchQuery, activeCategory]);

  // --- CART CALCULATIONS ---
  const cartItemList = useMemo(() => Object.values(cart), [cart]);

  const cartTotalQty = useMemo(() => {
    return cartItemList.reduce((sum, item) => sum + item.qty, 0);
  }, [cartItemList]);

  const subtotal = useMemo(() => {
    return cartItemList.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cartItemList]);

  const taxAmount = useMemo(() => {
    return Math.round((subtotal * taxPercent) / 100);
  }, [subtotal, taxPercent]);

  const grandTotal = useMemo(() => {
    const total = subtotal + taxAmount - discountAmount;
    return Math.max(0, total);
  }, [subtotal, taxAmount, discountAmount]);

  // --- CART ACTIONS ---
  const handleAddToCart = (product, variant = null) => {
    // Check variant requirement
    if (product.hasVariants && !variant) {
      setSelectedItemForVariant(product);
      setSelectedVariant(product.hasVariants[0]);
      setIsVariantModalOpen(true);
      return;
    }

    const itemName = variant ? `${product.name} (${variant})` : product.name;
    const key = `${product.id}_${variant || 'def'}`;

    // Live stock check
    const currentQtyInCart = cart[key]?.qty || 0;
    const availableStock = liveStock[product.stockRefId || product.id] ?? 999;
    const isBypass = STOCK_BYPASS_IDS.includes(product.id);

    if (!isBypass && currentQtyInCart + 1 > availableStock) {
      alert(`Stok ${product.name} tidak mencukupi! (Stok sisa: ${availableStock})`);
      return;
    }

    setCart((prev) => {
      const existing = prev[key];
      if (existing) {
        return {
          ...prev,
          [key]: { ...existing, qty: existing.qty + 1 }
        };
      }
      return {
        ...prev,
        [key]: {
          key,
          id: product.id,
          stockRefId: product.stockRefId || product.id,
          name: itemName,
          rawName: product.name,
          price: product.price,
          qty: 1,
          variant: variant || '',
          image: product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
        }
      };
    });
  };

  const handleUpdateQty = (key, delta) => {
    setCart((prev) => {
      const item = prev[key];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }

      if (delta > 0) {
        const availableStock = liveStock[item.stockRefId || item.id] ?? 999;
        const isBypass = STOCK_BYPASS_IDS.includes(item.id);
        if (!isBypass && newQty > availableStock) {
          alert(`Stok ${item.name} tidak mencukupi! (Stok sisa: ${availableStock})`);
          return prev;
        }
      }

      return {
        ...prev,
        [key]: { ...item, qty: newQty }
      };
    });
  };

  const handleRemoveFromCart = (key) => {
    setCart((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const handleClearCart = () => {
    if (cartItemList.length === 0) return;
    if (window.confirm('Kosongkan semua pesanan di keranjang?')) {
      setCart({});
      setDiscountAmount(0);
    }
  };

  // --- ADD CUSTOM PRODUCT ---
  const handleAddCustomProduct = () => {
    if (!customProduct.name || !customProduct.price) {
      alert('Mohon isi nama dan harga produk!');
      return;
    }
    const priceNum = parseInt(customProduct.price, 10) || 0;
    const customObj = {
      id: `custom_${Date.now()}`,
      name: customProduct.name,
      price: priceNum,
      category: 'Custom',
      image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=400&q=80'
    };
    handleAddToCart(customObj);
    setCustomProduct({ name: '', price: '' });
    setIsCustomProductModalOpen(false);
  };

  // --- SAVE ORDER TO UNPAID LIST (Simpan / Parkir Order) ---
  const handleSaveUnpaidOrder = () => {
    if (cartItemList.length === 0) {
      alert('Keranjang belanja kosong!');
      return;
    }
    const newOrder = {
      id: `ORD-${Date.now()}`,
      customerName: customerName || 'Pelanggan Umum',
      orderType,
      items: cartItemList,
      subtotal,
      discountAmount,
      grandTotal,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      note: orderNote,
    };
    setLocalOrders((prev) => [newOrder, ...prev]);
    setCart({});
    setCustomerName('');
    setOrderNote('');
    setDiscountAmount(0);
    alert('Pesanan berhasil disimpan ke List Order!');
  };

  // --- PROCESS PAYMENT / CHECKOUT ---
  const handleFinalCheckout = async () => {
    if (cartItemList.length === 0 || isSubmitting) return;

    const paidNum = parseInt(amountPaidStr, 10) || 0;
    if (paymentMethod === 'Cash' && paidNum < grandTotal) {
      alert('Jumlah pembayaran kurang!');
      return;
    }

    setIsSubmitting(true);
    
    // Build transaction payload
    const itemsFormattedStr = cartItemList
      .map((i) => `${i.qty}x ${i.name}`)
      .join(', ');

    const qStr = formatQueue(currentQueueNumber);
    const jenisPengeluaranStr = `[${qStr}${customerName ? ' ' + customerName : ''}] ** ${orderType.toUpperCase()} **, ${itemsFormattedStr}${
      orderNote ? `, ++ CATATAN: ${orderNote}` : ''
    }, ++ PAY:${paymentMethod}|${paidNum || grandTotal}|${paidNum > grandTotal ? paidNum - grandTotal : 0}`;

    const payload = {
      tanggal: todayStr,
      sheet: branchInfo?.sheetName,
      sheetName: branchInfo?.sheetName,
      kategori: 'Pemasukan Kasir',
      subKategori: paymentMethod,
      totalPengeluaran: 0,
      masuk: grandTotal,
      jenisPengeluaran: jenisPengeluaranStr,
    };

    // --- OPTIMISTIC UPDATE ---
    const optimisticTx = {
      _id: `optimistic_${Date.now()}`,
      ...payload,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      cash: paymentMethod === 'Cash' ? grandTotal : 0,
      bca: paymentMethod === 'BCA' ? grandTotal : 0,
      gofood: paymentMethod === 'QRIS' ? grandTotal : 0,
    };
    setRawData(prev => [...prev, optimisticTx]);

    // Success setup
    const changeVal = paymentMethod === 'Cash' ? Math.max(0, paidNum - grandTotal) : 0;
    const receipt = {
      id: qStr,
      date: new Date().toLocaleString('id-ID'),
      customer: customerName || 'Pelanggan Umum',
      orderType,
      items: cartItemList,
      subtotal,
      discountAmount,
      grandTotal,
      payMethod: paymentMethod,
      amountPaid: paidNum || grandTotal,
      change: changeVal
    };

    setPaymentSuccess(receipt);
    setPrintReceiptData(receipt);
    const savedCart = { ...cart };
    setCart({});
    setCustomerName('');
    setOrderNote('');
    setDiscountAmount(0);
    setAmountPaidStr('');
    setIsPaymentModalOpen(false);
    setIsPrintModalOpen(true);
    setIsSubmitting(false);

    // --- BACKGROUND SYNC ---
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }
      const resJson = await res.json();
      if (resJson.status === 'error') {
        throw new Error(resJson.message || 'Gagal memproses transaksi');
      }
      loadData();
    } catch (err) {
      console.error('Checkout failed:', err);
      // Rollback
      setRawData(prev => prev.filter(t => t._id !== optimisticTx._id));
      setCart(savedCart);
      alert('Gagal memproses transaksi! Silakan periksa koneksi.');
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col h-[100dvh] overflow-hidden bg-[#f1f5f9] font-sans antialiased text-gray-800 select-none">
      {/* ========================================================================= */}
      {/* MAIN TOP BAR HEADER */}
      {/* ========================================================================= */}
      <header className="h-16 bg-white border-b border-gray-200/80 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-20">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-base sm:text-lg font-black text-gray-900 tracking-tight flex items-center gap-2">
              {branchInfo?.name || 'Kasir Penjualan'}
              <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-blue-50 text-[#2563eb] border border-blue-200 font-bold">
                Mode Normal #2
              </span>
            </h1>
            <p className="text-[11px] text-gray-500 font-medium">
              {todayStr} • Sync Realtime
            </p>
          </div>
        </div>

        {/* Sync / Refresh Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 sm:px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold transition-all active:scale-95"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin text-[#2563eb]' : ''} />
            <span>{isFetching ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* MOBILE & TABLET TAB BAR (< lg) */}
      <div className="lg:hidden flex bg-white border-b border-gray-200 p-1.5 shrink-0 gap-1.5 z-20">
        <button
          onClick={() => setMobileTab('menu')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all ${
            mobileTab === 'menu'
              ? 'bg-[#2563eb] text-white shadow-sm'
              : 'text-gray-600 bg-gray-100'
          }`}
        >
          📋 Produk ({filteredProducts.length})
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${
            mobileTab === 'cart'
              ? 'bg-[#2563eb] text-white shadow-sm'
              : 'text-gray-600 bg-gray-100'
          }`}
        >
          🛒 Keranjang ({cartItemList.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* MAIN LAYOUT BODY (PRODUCT GRID + CART PANEL) */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT & CENTER AREA: PRODUCTS & SEARCH */}
        <main className={`flex-1 flex-col overflow-hidden bg-[#f8fafc] border-r border-gray-200 ${mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
          {/* SEARCH BAR & SCANNER ROW */}
          <div className="p-4 bg-white border-b border-gray-200/60 flex items-center gap-3 shadow-xs">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* QR / Barcode Scan Button */}
            <button
              onClick={() => alert('Fitur Barcode Scanner aktif!')}
              className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-[#2563eb] hover:bg-blue-100 active:scale-95 transition-all flex items-center justify-center"
              title="Scan QR / Barcode"
            >
              <QrCode size={20} />
            </button>
          </div>

          {/* CATEGORIES PILLS (HORIZONTAL SCROLLABLE) */}
          <div className="px-4 py-3 bg-white border-b border-gray-200/60 flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-[#2563eb] text-white shadow-md shadow-blue-500/20 scale-[1.02]'
                      : 'bg-gray-100 hover:bg-gray-200/80 text-gray-700 font-semibold'
                  }`}
                >
                  {cat === 'Favorit' && <Sparkles size={13} className={isActive ? 'text-yellow-300' : 'text-amber-500'} />}
                  {cat}
                </button>
              );
            })}
          </div>

          {/* PRODUCTS GRID AREA */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 no-scrollbar">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 py-16">
                <AlertCircle size={48} className="text-gray-300" />
                <p className="text-sm font-bold text-gray-500">Tidak ada produk ditemukan</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredProducts.map((product) => {
                  const availableStock = liveStock[product.stockRefId || product.id] ?? 999;
                  const isBypass = STOCK_BYPASS_IDS.includes(product.id);
                  const isOutOfStock = !isBypass && availableStock <= 0;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && handleAddToCart(product)}
                      className={`group bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between overflow-hidden relative ${
                        isOutOfStock ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 active:scale-[0.98]'
                      }`}
                    >
                      {/* Product Image */}
                      <div className="h-32 sm:h-36 w-full bg-gray-100 overflow-hidden relative">
                        <img
                          src={product.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {!isBypass && (
                          <span
                            className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold backdrop-blur-md shadow-xs ${
                              isOutOfStock
                                ? 'bg-red-500/90 text-white'
                                : availableStock < 5
                                ? 'bg-amber-500/90 text-white animate-pulse'
                                : 'bg-black/50 text-white'
                            }`}
                          >
                            {isOutOfStock ? 'Habis' : `Stok: ${availableStock}`}
                          </span>
                        )}
                        {product.hasVariants && (
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-[#2563eb]/90 text-white text-[10px] font-extrabold backdrop-blur-md">
                            Varian
                          </span>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-3 flex flex-col justify-between flex-1 gap-2">
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-2 leading-snug group-hover:text-[#2563eb] transition-colors">
                            {product.name}
                          </h3>
                        </div>

                        <div className="flex items-center justify-between mt-auto pt-1 border-t border-gray-100">
                          <span className="text-xs sm:text-sm font-black text-gray-900">
                            {formatRupiah(product.price)}
                          </span>
                          <button className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563eb] group-hover:bg-[#2563eb] group-hover:text-white flex items-center justify-center transition-all">
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTTOM ACTION BAR BELOW PRODUCT GRID */}
          <div className="p-3 bg-white border-t border-gray-200/80 flex items-center justify-between gap-3 shadow-xs shrink-0">
            {/* List Order Button */}
            <button
              onClick={() => setIsListOrderModalOpen(true)}
              className="flex-1 py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <span className="w-5 h-5 rounded-full bg-white/30 text-white font-black text-xs flex items-center justify-center">
                {localOrders.length}
              </span>
              <span>List Order</span>
            </button>

            {/* Customer Info Button */}
            <button
              onClick={() => setIsCustomerModalOpen(true)}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-gray-200 active:scale-95 transition-all"
            >
              <User size={16} className="text-gray-600" />
              <span>{customerName || 'Pelanggan'}</span>
            </button>

            {/* Custom Product Button */}
            <button
              onClick={() => setIsCustomProductModalOpen(true)}
              className="flex-1 py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 border border-gray-200 active:scale-95 transition-all"
            >
              <Edit3 size={16} className="text-gray-600" />
              <span>Custom Produk</span>
            </button>
          </div>
        </main>

        {/* ========================================================================= */}
        {/* RIGHT SIDE PANEL: ORDER / CART PANEL */}
        {/* ========================================================================= */}
        <aside className={`w-full lg:w-80 xl:w-[410px] bg-white flex-col shrink-0 border-l border-gray-200 shadow-xl z-10 ${mobileTab === 'menu' ? 'hidden lg:flex' : 'flex'}`}>
          {/* CART HEADER & ORDER TYPE DROPDOWN */}
          <div className="p-4 border-b border-gray-200/80 flex items-center justify-between gap-3 bg-white">
            <div className="relative flex-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                Jenis Order
              </label>
              <select
                value={orderType}
                onChange={(e) => setOrderType(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2 text-xs font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] cursor-pointer transition-all"
              >
                <option value="Makan Sini">Makan Sini</option>
                <option value="Bawa Pulang">Bawa Pulang</option>
                <option value="GoFood">GoFood</option>
                <option value="GrabFood">GrabFood</option>
                <option value="ShopeeFood">ShopeeFood</option>
              </select>
            </div>

            {cartItemList.length > 0 && (
              <button
                onClick={handleClearCart}
                className="text-xs font-bold text-red-500 hover:text-red-700 transition-colors pt-4"
              >
                Hapus semua ({cartTotalQty})
              </button>
            )}
          </div>

          {/* CART ITEMS SCROLLABLE LIST */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
            {cartItemList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-3 py-20">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-300">
                  <ShoppingCart size={28} />
                </div>
                <p className="text-xs font-bold text-gray-400">Keranjang masih kosong</p>
              </div>
            ) : (
              cartItemList.map((item) => (
                <div
                  key={item.key}
                  className="p-3 rounded-2xl bg-gray-50/70 border border-gray-200/60 flex items-center justify-between gap-3 hover:border-gray-300 transition-all"
                >
                  {/* Thumbnail & Info */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                    />
                    <div className="flex flex-col min-w-0">
                      <h4 className="text-xs font-bold text-gray-900 truncate">
                        {item.name}
                      </h4>
                      <span className="text-xs font-semibold text-gray-500">
                        {formatRupiah(item.price)}
                      </span>
                    </div>
                  </div>

                  {/* Quantity Controller & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold text-gray-600 bg-white border border-gray-200 px-2 py-1 rounded-lg">
                      x{item.qty}
                    </span>
                    <div className="flex items-center border border-gray-200 bg-white rounded-xl p-0.5">
                      <button
                        onClick={() => handleUpdateQty(item.key, -1)}
                        className="w-6 h-6 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center active:scale-90"
                      >
                        <Minus size={12} />
                      </button>
                      <button
                        onClick={() => handleUpdateQty(item.key, 1)}
                        className="w-6 h-6 rounded-lg text-gray-600 hover:bg-gray-100 flex items-center justify-center active:scale-90"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCart(item.key)}
                      className="text-gray-400 hover:text-red-500 p-1.5 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* SUMMARY CALCULATIONS & QUICK ACTIONS */}
          <div className="p-4 border-t border-gray-200/80 bg-white flex flex-col gap-3">
            {/* Calculation Lines */}
            <div className="space-y-1.5 text-xs font-semibold text-gray-600">
              <div className="flex items-center justify-between">
                <span>Subtotal {cartTotalQty > 0 ? `${cartTotalQty} Produk` : ''}</span>
                <span className="font-bold text-gray-800">{formatRupiah(subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-green-600 font-bold">
                  <span>Diskon Promo</span>
                  <span>- {formatRupiah(discountAmount)}</span>
                </div>
              )}
              {taxAmount > 0 && (
                <div className="flex items-center justify-between">
                  <span>Tax ({taxPercent}%)</span>
                  <span>{formatRupiah(taxAmount)}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-sm font-black text-gray-900">
                <span>Total</span>
                <span className="text-base text-[#2563eb]">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Action Grid 2x2 (Simpan, Print, Promo, Split) */}
            <div className="grid grid-cols-4 gap-2 pt-1">
              <button
                onClick={handleSaveUnpaidOrder}
                className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <FileText size={14} className="text-gray-600" />
                <span>Simpan</span>
              </button>

              <button
                onClick={() => {
                  if (cartItemList.length === 0) return alert('Keranjang kosong!');
                  setPrintReceiptData({
                    id: `PREV-${Date.now().toString().slice(-6)}`,
                    date: new Date().toLocaleString('id-ID'),
                    customer: customerName || 'Pelanggan Umum',
                    orderType,
                    items: cartItemList,
                    subtotal,
                    discountAmount,
                    grandTotal,
                    payMethod: 'Belum Lunas'
                  });
                  setIsPrintModalOpen(true);
                }}
                className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Printer size={14} className="text-gray-600" />
                <span>Print</span>
              </button>

              <button
                onClick={() => setIsPromoModalOpen(true)}
                className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Tag size={14} className="text-gray-600" />
                <span>Promo</span>
              </button>

              <button
                onClick={() => setIsSplitModalOpen(true)}
                className="py-2 px-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold border border-gray-200 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <Users size={14} className="text-gray-600" />
                <span>Split</span>
              </button>
            </div>

            {/* BIG PRIMARY PAYMENT BUTTON */}
            <button
              onClick={() => {
                if (cartItemList.length === 0) return alert('Keranjang kosong!');
                setIsPaymentModalOpen(true);
              }}
              disabled={cartItemList.length === 0}
              className="w-full py-4 rounded-2xl bg-[#2563eb] hover:bg-blue-700 disabled:bg-gray-300 text-white font-extrabold text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-blue-600/30 active:scale-[0.99] transition-all cursor-pointer"
            >
              {cartTotalQty > 0 && (
                <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-black flex items-center justify-center">
                  {cartTotalQty}
                </span>
              )}
              <span>Bayar {formatRupiah(grandTotal)}</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* ALL MODALS IMPLEMENTATION */}
      {/* ========================================================================= */}

      {/* 1. PAYMENT MODAL */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col gap-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900">Pembayaran Kasir</h3>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            {/* Total Display */}
            <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-100 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Tagihan</span>
              <span className="text-3xl font-black text-[#2563eb] mt-1">{formatRupiah(grandTotal)}</span>
            </div>

            {/* Method Select */}
            <div className="grid grid-cols-3 gap-3">
              {['QRIS', 'Cash', 'Transfer'].map((m) => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-3 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1.5 ${
                    paymentMethod === m
                      ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-md shadow-blue-500/20'
                      : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                  }`}
                >
                  {m === 'QRIS' && <QrCode size={18} />}
                  {m === 'Cash' && <Wallet size={18} />}
                  {m === 'Transfer' && <CreditCard size={18} />}
                  <span>{m}</span>
                </button>
              ))}
            </div>

            {/* Cash Paid Amount */}
            {paymentMethod === 'Cash' && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-700">Uang Diterima (Rp)</label>
                <input
                  type="number"
                  placeholder="Masukkan nominal..."
                  value={amountPaidStr}
                  onChange={(e) => setAmountPaidStr(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base font-bold focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] outline-none"
                />
                {/* Quick Cash Suggestions */}
                <div className="flex gap-2 mt-1 overflow-x-auto no-scrollbar">
                  {[grandTotal, 20000, 50000, 100000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setAmountPaidStr(String(val))}
                      className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 whitespace-nowrap"
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Checkout */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="flex-1 py-3.5 rounded-xl border border-gray-200 font-bold text-sm text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleFinalCheckout}
                disabled={isSubmitting}
                className="flex-1 py-3.5 rounded-xl bg-[#2563eb] hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 active:scale-95 transition-all"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Selesaikan Transaksi'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CUSTOMER & ORDER OPTIONS MODAL */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Informasi Pelanggan</h3>
              <button onClick={() => setIsCustomerModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Nama Pelanggan / Nomor Meja</label>
                <input
                  type="text"
                  placeholder="Contoh: Bpk Budi (Meja 04)"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Catatan Pesanan / Request</label>
                <textarea
                  placeholder="Catatan tambahan (misal: Sambal terpisah, Es sedikit)..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            <button
              onClick={() => setIsCustomerModalOpen(false)}
              className="w-full py-3 bg-[#2563eb] text-white font-bold text-sm rounded-xl hover:bg-blue-700"
            >
              Simpan Informasi
            </button>
          </div>
        </div>
      )}

      {/* 3. CUSTOM PRODUCT MODAL */}
      {isCustomProductModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Tambah Produk Custom</h3>
              <button onClick={() => setIsCustomProductModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Nama Produk Custom</label>
                <input
                  type="text"
                  placeholder="Nama item..."
                  value={customProduct.name}
                  onChange={(e) => setCustomProduct({ ...customProduct, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2563eb]"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  placeholder="Harga per item..."
                  value={customProduct.price}
                  onChange={(e) => setCustomProduct({ ...customProduct, price: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-[#2563eb]"
                />
              </div>
            </div>

            <button
              onClick={handleAddCustomProduct}
              className="w-full py-3 bg-[#2563eb] text-white font-bold text-sm rounded-xl hover:bg-blue-700"
            >
              Tambahkan ke Keranjang
            </button>
          </div>
        </div>
      )}

      {/* 4. PROMO / DISCOUNT MODAL */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Diskon / Promo</h3>
              <button onClick={() => setIsPromoModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Nominal Diskon (Rp)</label>
                <input
                  type="number"
                  placeholder="Masukkan potong harga..."
                  value={promoInput.value}
                  onChange={(e) => setPromoInput({ ...promoInput, value: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDiscountAmount(0);
                  setIsPromoModalOpen(false);
                }}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-xs text-gray-600"
              >
                Reset Diskon
              </button>
              <button
                onClick={() => {
                  const val = parseInt(promoInput.value, 10) || 0;
                  setDiscountAmount(val);
                  setIsPromoModalOpen(false);
                }}
                className="flex-1 py-3 bg-[#2563eb] text-white font-bold text-xs rounded-xl hover:bg-blue-700"
              >
                Terapkan Diskon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. VARIANT SELECTOR MODAL */}
      {isVariantModalOpen && selectedItemForVariant && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Pilih Potongan Ayam</h3>
              <button onClick={() => setIsVariantModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {selectedItemForVariant.hasVariants.map((varOpt) => (
                <button
                  key={varOpt}
                  onClick={() => {
                    handleAddToCart(selectedItemForVariant, varOpt);
                    setIsVariantModalOpen(false);
                  }}
                  className="py-4 px-3 rounded-2xl border-2 border-blue-100 hover:border-[#2563eb] bg-blue-50/50 text-[#2563eb] font-extrabold text-sm hover:scale-105 transition-all"
                >
                  {varOpt}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. LIST ORDER / TAPPING MODAL */}
      {isListOrderModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                <span>Daftar Order Tersimpan</span>
                <span className="text-xs px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold">
                  {localOrders.length} Pesanan
                </span>
              </h3>
              <button onClick={() => setIsListOrderModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pr-1">
              {localOrders.length === 0 ? (
                <p className="text-center text-sm font-bold text-gray-400 py-10">Belum ada order tersimpan</p>
              ) : (
                localOrders.map((ord, idx) => (
                  <div key={ord.id} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-gray-900">{ord.customerName}</span>
                      <span className="text-xs font-bold text-blue-600">{formatRupiah(ord.grandTotal)}</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {ord.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </p>
                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          setLocalOrders((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-xs text-red-500 hover:text-red-700 font-bold px-2 py-1"
                      >
                        Hapus
                      </button>
                      <button
                        onClick={() => {
                          // Load to active cart
                          const cartObj = {};
                          ord.items.forEach((item) => {
                            cartObj[item.key] = item;
                          });
                          setCart(cartObj);
                          setCustomerName(ord.customerName);
                          setLocalOrders((prev) => prev.filter((_, i) => i !== idx));
                          setIsListOrderModalOpen(false);
                        }}
                        className="px-3 py-1.5 bg-[#2563eb] text-white text-xs font-bold rounded-lg hover:bg-blue-700"
                      >
                        Muat ke Keranjang
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. PRINT RECEIPT PREVIEW MODAL */}
      {isPrintModalOpen && printReceiptData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-sm font-black text-gray-900">Struk Pembayaran</h3>
              <button onClick={() => setIsPrintModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            {/* Printable Receipt Preview */}
            <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-200/60 font-mono text-xs text-gray-800 space-y-2">
              <div className="text-center font-bold text-sm">PECEL LELE CABE IJO</div>
              <div className="text-center text-[10px] text-gray-500">{printReceiptData.date}</div>
              <div className="border-b border-dashed border-gray-300 py-1" />
              <div>Pelanggan: {printReceiptData.customer}</div>
              <div>Jenis: {printReceiptData.orderType}</div>
              <div className="border-b border-dashed border-gray-300 py-1" />
              {printReceiptData.items.map((i, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{i.qty}x {i.name}</span>
                  <span>{formatRupiah(i.price * i.qty)}</span>
                </div>
              ))}
              <div className="border-b border-dashed border-gray-300 py-1" />
              <div className="flex justify-between font-bold text-sm">
                <span>TOTAL</span>
                <span>{formatRupiah(printReceiptData.grandTotal)}</span>
              </div>
              <div className="text-center text-[10px] text-gray-400 pt-2">Terima kasih atas kunjungan Anda!</div>
            </div>

            <button
              onClick={() => {
                window.print();
                setIsPrintModalOpen(false);
              }}
              className="w-full py-3 bg-[#2563eb] text-white font-bold text-sm rounded-xl hover:bg-blue-700 flex items-center justify-center gap-2"
            >
              <Printer size={16} /> Cetak Struk
            </button>
          </div>
        </div>
      )}

      {/* 8. SPLIT BILL MODAL */}
      {isSplitModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-base font-black text-gray-900">Split Bill (Bagi Tagihan)</h3>
              <button onClick={() => setIsSplitModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600">Jumlah Orang</span>
                <div className="flex items-center gap-3 bg-gray-100 p-1 rounded-xl">
                  <button
                    onClick={() => setSplitPersons(Math.max(2, splitPersons - 1))}
                    className="w-8 h-8 rounded-lg bg-white font-bold flex items-center justify-center text-gray-700 shadow-xs"
                  >
                    -
                  </button>
                  <span className="font-extrabold text-sm px-2">{splitPersons}</span>
                  <button
                    onClick={() => setSplitPersons(splitPersons + 1)}
                    className="w-8 h-8 rounded-lg bg-white font-bold flex items-center justify-center text-gray-700 shadow-xs"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex flex-col items-center">
                <span className="text-xs font-bold text-gray-500">Bayar Per Orang</span>
                <span className="text-2xl font-black text-[#2563eb] mt-1">
                  {formatRupiah(Math.ceil(grandTotal / splitPersons))}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsSplitModalOpen(false)}
              className="w-full py-3 bg-[#2563eb] text-white font-bold text-sm rounded-xl hover:bg-blue-700"
            >
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
