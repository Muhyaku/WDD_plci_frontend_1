// =============================================================================
// NORMAL CASHIER VIEW — PIN 1010
// Fungsi: Penjualan kasir normal dengan cart, checkout, tapping, printer
// Yang TIDAK ada: Edit Master Menu, Beli Bahan, Fast Mode button
// =============================================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock, ListFilter, ArrowLeft, Loader2, Wallet, CreditCard, FileText,
  CheckCircle2, AlertCircle, User, LogOut, ShoppingBag, ChevronUp,
  Trash2, RefreshCw, Printer, Menu, X, Settings, CheckCircle, Pencil,
  Save, Lock,
} from 'lucide-react';

import {
  API_URL, MENU_MASTER_URL, STOCK_BYPASS_IDS, NASI_OPTIONS,
} from '../shared/constants';
import {
  formatRupiah, formatQueue, getTodayStr, getBaseMenuList,
  getCartKey, formatItemOptions,
  calculateLiveStock, buildActiveMenuList, calculateNextQueueNumber,
  fetchMenuData, fetchTodayTransactions,
} from '../shared/utils';

// =============================================================================
// NORMAL CASHIER VIEW COMPONENT
// =============================================================================
export default function NormalCashierView({ branchInfo, onLogout }) {
  // --- NAV & UI STATE ---
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [isUtilityMenuOpen, setIsUtilityMenuOpen] = useState(false);
  const [liveView, setLiveView] = useState('pemasukan');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [mobileTab, setMobileTab] = useState('menu');
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [isDragging, setIsDragging] = useState(null);
  const [widths, setWidths] = useState([30, 45, 25]);
  const [windowWidth, setWindowWidth] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // --- CART STATE ---
  const [cart, setCart] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('QRIS');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [amountPaidStr, setAmountPaidStr] = useState('');

  // --- LOCAL ORDERS (belum bayar / tapping) ---
  const [localOrders, setLocalOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(`unpaid_orders_${branchInfo?.id || 'default'}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  useEffect(() => {
    if (branchInfo?.id) {
      localStorage.setItem(`unpaid_orders_${branchInfo.id}`, JSON.stringify(localOrders));
    }
  }, [localOrders, branchInfo]);

  // --- MODAL STATE ---
  const [customerModal, setCustomerModal] = useState({ isOpen: false, type: null });
  const [customerName, setCustomerName] = useState('');
  const [pickupType, setPickupType] = useState('Tidak Ada Keterangan');
  const [pickupCondition, setPickupCondition] = useState('Pagi');
  const [pickupTime, setPickupTime] = useState('');
  const [orderType, setOrderType] = useState('Makan Sini');
  const [cabbageOption, setCabbageOption] = useState('Pake Kol Biasa');
  const [sambalOption, setSambalOption] = useState('Pake Semua');
  const [orderNote, setOrderNote] = useState('');

  const [printModal, setPrintModal] = useState({ isOpen: false, data: null, printCount: 0 });
  const [stockAlert, setStockAlert] = useState(null);
  const [itemOptionModal, setItemOptionModal] = useState({
    isOpen: false, cartKey: null, item: null,
    options: { type: 'Bawaan Global', cabbage: 'Bawaan Global', sambal: 'Bawaan Global', note: '' }
  });
  const [editPriceModal, setEditPriceModal] = useState({ isOpen: false, cartKey: null, item: null, priceStr: '' });
  const [variantModal, setVariantModal] = useState({ isOpen: false, item: null });
  const [variantSelections, setVariantSelections] = useState({ ayam: null, nasi: null });
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [btDevice, setBtDevice] = useState(null);
  const [btCharacteristic, setBtCharacteristic] = useState(null);
  const [detailModal, setDetailModal] = useState({ isOpen: false, data: null });
  const [isTappingModalOpen, setIsTappingModalOpen] = useState(false);
  const [tappingSortOrder, setTappingSortOrder] = useState('Terlama');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDeletingId, setIsDeletingId] = useState(null);

  // --- DATA & SYNC STATE ---
  const [masterMenus, setMasterMenus] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [internalRawData, setInternalRawData] = useState([]);
  const [internalIsFetching, setInternalIsFetching] = useState(false);

  const todayStr = useMemo(() => getTodayStr(), []);
  const baseMenuList = useMemo(() => getBaseMenuList(branchInfo?.brand), [branchInfo?.brand]);

  // --- FETCH DATA ---
  const loadData = useCallback(async () => {
    if (!branchInfo?.sheetName) return;
    setInternalIsFetching(true);
    try {
      const [menuResult, txData] = await Promise.all([
        fetchMenuData(branchInfo.sheetName),
        fetchTodayTransactions(branchInfo.sheetName),
      ]);
      setMasterMenus(menuResult?.masterMenus || []);
      setActivityLogs(menuResult?.activityLogs || []);
      setInternalRawData(txData || []);
    } catch (e) {
      console.error('Gagal load data normal cashier:', e);
    } finally {
      setInternalIsFetching(false);
    }
  }, [branchInfo?.sheetName]);

  const handleRefresh = loadData;
  const effectiveIsFetching = internalIsFetching;

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleDelete = async (id) => {
    try {
      // Optimistic delete
      setInternalRawData(prev => prev.filter(t => t._id !== id));
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error('Gagal hapus transaksi:', e);
    }
  };

  // --- LIVE STOCK CALCULATIONS ---
  const liveStockCalculations = useMemo(() =>
    calculateLiveStock(internalRawData, activityLogs, masterMenus, baseMenuList, todayStr, branchInfo?.sheetName),
    [internalRawData, activityLogs, masterMenus, baseMenuList, todayStr, branchInfo?.sheetName]
  );

  const activeMenuList = useMemo(() =>
    buildActiveMenuList(baseMenuList, masterMenus, liveStockCalculations),
    [baseMenuList, masterMenus, liveStockCalculations]
  );

  const filteredMenu = activeCategory === 'Semua'
    ? activeMenuList
    : activeMenuList.filter(m => m.category === activeCategory);

  // --- DERIVED DATA ---
  const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

  const employeeVisibleData = useMemo(() => {
    const todayData = internalRawData.filter(item => item.tanggal === todayStr);
    return todayData.filter(item => {
      if (item.isDeleted) return false;
      if (item.jenisPengeluaran && item.jenisPengeluaran.includes('[UNPAID]')) return false;
      if (!item.createdAt) return true;
      return (currentTime - new Date(item.createdAt).getTime()) <= THREE_HOURS_MS;
    });
  }, [internalRawData, todayStr, currentTime]);

  const employeeLocalOrders = useMemo(() => {
    return localOrders.filter(order => (currentTime - order.id) <= THREE_HOURS_MS);
  }, [localOrders, currentTime]);

  // --- QUEUE NUMBER ---
  const currentQueueNumber = useMemo(() => {
    return calculateNextQueueNumber(internalRawData, localOrders, todayStr);
  }, [internalRawData, localOrders, todayStr]);

  // --- INCOME ---
  const validIncomeData = useMemo(() => {
    return employeeVisibleData.filter(x => !(x.jenisPengeluaran && x.jenisPengeluaran.includes('[LAPORAN SISTEM]')));
  }, [employeeVisibleData]);

  const serverIncome = useMemo(() => {
    return validIncomeData.reduce((acc, curr) => acc + (curr.cash || 0) + (curr.bca || 0) + (curr.gofood || 0), 0);
  }, [validIncomeData]);

  const localIncome = useMemo(() => {
    return employeeLocalOrders.reduce((acc, curr) => acc + curr.total, 0);
  }, [employeeLocalOrders]);

  const totalIncomeToday = serverIncome + localIncome;
  const totalExpenseToday = useMemo(() => {
    return employeeVisibleData.reduce((acc, curr) => acc + (curr.totalPengeluaran || 0), 0);
  }, [employeeVisibleData]);

  // --- CART OPERATIONS ---
  const addToCart = (item, customOptions = null) => {
    const stockRefId = item.stockRefId || item.id;
    const isBypass = STOCK_BYPASS_IDS.includes(stockRefId) || STOCK_BYPASS_IDS.includes(item.id);
    const availableStock = liveStockCalculations[stockRefId] ?? (item.stock || 0);

    const currentQtyInCart = Object.values(cart)
      .filter(i => (i.stockRefId || i.id) === stockRefId)
      .reduce((sum, i) => sum + i.qty, 0);

    if (!isBypass && currentQtyInCart + 1 > availableStock) {
      setStockAlert(`⚠️ Stok ${item.name} tidak mencukupi! (Sisa stok: ${availableStock})`);
      setTimeout(() => setStockAlert(null), 3000);
      return;
    }

    setCart(prev => {
      const cartKey = getCartKey(item.id, customOptions);
      return {
        ...prev,
        [cartKey]: {
          ...item,
          cartKey,
          stockRefId,
          qty: (prev[cartKey]?.qty || 0) + 1,
          itemOptions: customOptions || prev[cartKey]?.itemOptions || null,
        },
      };
    });
  };

  const decreaseQty = (cartKey) => setCart(prev => {
    const newCart = { ...prev };
    if (newCart[cartKey].qty > 1) newCart[cartKey].qty -= 1;
    else delete newCart[cartKey];
    return newCart;
  });

  const deleteFromCart = (cartKey) => setCart(prev => {
    const newCart = { ...prev };
    delete newCart[cartKey];
    return newCart;
  });

  const totalCartPrice = Object.values(cart).reduce((sum, item) => sum + (item.price * item.qty), 0);

  // --- RESET CASH INPUT ---
  useEffect(() => {
    if (paymentMethod !== 'Cash' || totalCartPrice === 0) setAmountPaidStr('');
  }, [paymentMethod, totalCartPrice]);

  const amountPaidNum = parseInt(amountPaidStr.replace(/\D/g, '')) || 0;
  const isCashInsufficient = paymentMethod === 'Cash' && amountPaidNum > 0 && amountPaidNum < totalCartPrice;

  // --- HANDLE ITEM CLICK ---
  const handleItemClick = (item) => {
    const stockRefId = item.stockRefId || item.id;
    const isBypass = STOCK_BYPASS_IDS.includes(stockRefId) || STOCK_BYPASS_IDS.includes(item.id);
    const availableStock = liveStockCalculations[stockRefId] ?? (item.stock || 0);

    if (!isBypass && availableStock <= 0) {
      setStockAlert(`⚠️ Stok ${item.name} Habis! Silakan re-stok / isi stok lagi.`);
      setTimeout(() => setStockAlert(null), 3000);
      return;
    }
    const needsAyam = !!item.hasVariants;
    const needsNasi = item.name.toLowerCase().includes('nasi');
    if (needsAyam || needsNasi) {
      setVariantSelections({ ayam: needsAyam ? null : 'N/A', nasi: needsNasi ? null : 'N/A' });
      setVariantModal({ isOpen: true, item });
    } else {
      addToCart(item);
    }
  };

  // --- CONFIRM VARIANT SELECTION ---
  const confirmVariantSelection = () => {
    const baseItem = variantModal.item;
    let finalName = baseItem.name;
    let finalId = baseItem.id;
    let finalPrice = baseItem.price;

    if (variantSelections.ayam && variantSelections.ayam !== 'N/A') {
      finalName += ` ${variantSelections.ayam}`;
      finalId += `-${variantSelections.ayam.toLowerCase()}`;
    }
    if (variantSelections.nasi && variantSelections.nasi !== 'N/A') {
      finalName += ` (${variantSelections.nasi})`;
      finalId += `-${variantSelections.nasi.replace(/\s+/g, '').toLowerCase()}`;
      if (baseItem.category === 'Satuan' && baseItem.name.toLowerCase().includes('nasi')) {
        if (variantSelections.nasi === '1/2 Porsi' || variantSelections.nasi === 'Nasi Setengah') finalPrice = 3000;
        else if (variantSelections.nasi === 'Full Porsi' || variantSelections.nasi === 'Nasi Full') finalPrice = 5000;
      }
    }
    addToCart({ ...baseItem, id: finalId, name: finalName, price: finalPrice, stockRefId: baseItem.stockRefId || baseItem.id });
    setVariantModal({ isOpen: false, item: null });
  };

  // --- ITEM OPTION MODAL ---
  const openItemOptionModal = (cartItem) => {
    setItemOptionModal({
      isOpen: true, cartKey: cartItem.cartKey, item: cartItem,
      options: cartItem.itemOptions || { type: 'Bawaan Global', cabbage: 'Bawaan Global', sambal: 'Bawaan Global', note: '' },
    });
  };
  const saveItemOptions = () => {
    const { cartKey, item, options } = itemOptionModal;
    const isDefault = options.type === 'Bawaan Global' && options.cabbage === 'Bawaan Global' && options.sambal === 'Bawaan Global' && options.note.trim() === '';
    const finalOptions = isDefault ? null : { ...options, note: options.note.replace(/,/g, ' / ') };
    setCart(prev => {
      const newCart = { ...prev };
      const qty = newCart[cartKey].qty;
      delete newCart[cartKey];
      const newCartKey = getCartKey(item.id, finalOptions);
      if (newCart[newCartKey]) newCart[newCartKey].qty += qty;
      else newCart[newCartKey] = { ...item, cartKey: newCartKey, qty, itemOptions: finalOptions };
      return newCart;
    });
    setItemOptionModal({ isOpen: false, cartKey: null, item: null, options: { type: 'Bawaan Global', cabbage: 'Bawaan Global', sambal: 'Bawaan Global', note: '' } });
  };

  // --- TRIGGER SUBMIT SALE ---
  const triggerSubmitSale = (statusPembayaran) => {
    if (isSubmitting || totalCartPrice === 0) return;
    setCustomerModal({ isOpen: true, type: statusPembayaran });
  };

  // --- EXECUTE SUBMIT SALE ---
  const executeSubmitSale = async (isSkipped) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const finalName = (isSkipped || customerName.trim() === '') ? '' : ` - ${customerName}`;
    let pickupInfo = '';
    if (customerModal.type === 'BELUM_BAYAR') {
      if (pickupType === 'Tidak Ada Keterangan') pickupInfo = ` (Ambil: Bebas/Nanti)`;
      else if (pickupType === 'Kondisi') pickupInfo = ` (Ambil: ${pickupCondition})`;
      else if (pickupType === 'Waktu Tertentu' && pickupTime) pickupInfo = ` (Ambil Jam: ${pickupTime})`;
    }

    let parts = [
      `** ${orderType.toUpperCase()} **`,
      `** ${cabbageOption.toUpperCase()} **`,
      `** ${sambalOption.toUpperCase()} **`,
      ...Object.values(cart).map(i => `${i.qty}x ${i.name}${formatItemOptions(i.itemOptions)}`),
    ];
    if (orderNote.trim()) parts.push(`++ CATATAN: ${orderNote.trim()}`);
    parts.push(`++ PAY:${paymentMethod}|${paymentMethod === 'Cash' ? amountPaidNum : totalCartPrice}|${paymentMethod === 'Cash' ? Math.max(0, amountPaidNum - totalCartPrice) : 0}`);

    const itemsStr = parts.join(', ');
    const qStr = formatQueue(currentQueueNumber);
    const finalQueueStr = `${qStr}${finalName}${pickupInfo}`;

    const transactionDataForPrint = {
      queue: finalQueueStr, items: itemsStr, total: totalCartPrice,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }), printCount: 0,
    };

    let payloads = [];
    if (customerModal.type === 'BELUM_BAYAR') {
      payloads.push({ sheet: branchInfo.sheetName, tanggal: todayStr, cash: 0, bca: 0, gofood: 0, jenisPengeluaran: `[UNPAID] [${finalQueueStr}] ${itemsStr}`, totalPengeluaran: 0 });
    } else {
      payloads.push({ sheet: branchInfo.sheetName, tanggal: todayStr, cash: paymentMethod === 'Cash' ? totalCartPrice : 0, bca: paymentMethod === 'BCA' ? totalCartPrice : 0, gofood: paymentMethod === 'QRIS' ? totalCartPrice : 0, jenisPengeluaran: `[${qStr}${finalName}] ${itemsStr}`, totalPengeluaran: 0 });
    }

    // --- OPTIMISTIC: Inject transaksi ke state lokal untuk update stok instan ---
    const optimisticTx = {
      _id: `optimistic_${Date.now()}`,
      ...payloads[0],
      createdAt: new Date().toISOString(),
      isDeleted: false,
    };
    setInternalRawData(prev => [...prev, optimisticTx]);

    if (customerModal.type === 'BELUM_BAYAR') {
      const newOrder = {
        ...transactionDataForPrint, id: Date.now(), dbId: null, status: 'BELUM_BAYAR',
        rawCart: cart, rawCustomerName: customerName, rawPickupType: pickupType,
        rawPickupCondition: pickupCondition, rawPickupTime: pickupTime,
        rawOrderType: orderType, rawCabbage: cabbageOption, rawSambal: sambalOption, rawNote: orderNote,
      };
      setLocalOrders(prev => [...prev, newOrder]);
    }

    // --- OPTIMISTIC: Clear cart dan kembalikan UI instan ---
    const savedCart = { ...cart };
    setCart({}); setCustomerName(''); setAmountPaidStr('');
    setCustomerModal({ isOpen: false, type: null });
    setOrderType('Makan Sini'); setCabbageOption('Pake Kol Biasa'); setSambalOption('Pake Semua');
    setOrderNote(''); setPickupType('Tidak Ada Keterangan'); setPickupCondition('Pagi'); setPickupTime('');
    setPrintModal({ isOpen: true, data: transactionDataForPrint, printCount: 0 });
    setIsSubmitting(false);

    // --- BACKGROUND: Kirim ke server ---
    try {
      const resTx = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloads)
      });
      if (!resTx.ok) {
        throw new Error(`HTTP Error ${resTx.status}`);
      }
      const resJson = await resTx.json();
      if (resJson.status === 'error') {
        throw new Error(resJson.message || 'Gagal menyimpan data');
      }

      // Update dbId untuk order parkir
      if (customerModal.type === 'BELUM_BAYAR' && resJson.data?.[0]?._id) {
        setLocalOrders(prev => prev.map(o =>
          o.dbId === null && o.items === itemsStr
            ? { ...o, dbId: resJson.data[0]._id }
            : o
        ));
      }

      loadData();
    } catch (e) {
      console.error('Gagal memproses transaksi ke server:', e);
      // Hanya rollback jika data belum masuk
      setInternalRawData(prev => prev.filter(t => t._id !== optimisticTx._id));
      setCart(savedCart);
      setStockAlert('⚠️ Koneksi server lambat/gagal. Silakan coba lagi.');
      setTimeout(() => setStockAlert(null), 4000);
    }
  };

  // --- MARK AS PAID ---
  const markAsPaid = async (orderId, selectedMethod) => {
    if (isSubmitting) return;
    const order = localOrders.find(o => o.id === orderId);
    if (!order) return;

    setIsSubmitting(true);

    // --- OPTIMISTIC UPDATE ---
    const cleanItemsStr = (order.items || '').replace(/,\s*\+\+\s*PAY:.*$/, '');
    const queueLabel = order.queue.split(' (Ambil:')[0];
    const finalJenisPengeluaran = `[${queueLabel}] ${cleanItemsStr}, ++ PAY:${selectedMethod}|${order.total}|0`;

    const payload = [{
      sheet: branchInfo.sheetName,
      tanggal: todayStr,
      cash: selectedMethod === 'Cash' ? order.total : 0,
      bca: selectedMethod === 'BCA' ? order.total : 0,
      gofood: selectedMethod === 'QRIS' ? order.total : 0,
      jenisPengeluaran: finalJenisPengeluaran,
      totalPengeluaran: 0,
      overrideDbId: order.dbId,
    }];

    setInternalRawData(prev => prev.map(t =>
      t._id === order.dbId ? { ...t, ...payload[0] } : t
    ));
    setLocalOrders(prev => prev.filter(o => o.id !== orderId));
    setIsSubmitting(false);

    // --- BACKGROUND SYNC ---
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      loadData();
    } catch (e) {
      console.error('Gagal update pelunasan:', e);
    }
  };

  // --- DELETE LOCAL ORDER ---
  const deleteLocalOrder = async (orderId) => {
    const order = localOrders.find(o => o.id === orderId);

    // --- OPTIMISTIC DELETE ---
    setLocalOrders(prev => prev.filter(o => o.id !== orderId));
    if (order && order.dbId) {
      setInternalRawData(prev => prev.filter(t => t._id !== order.dbId));
    }

    // --- BACKGROUND SYNC ---
    if (order && order.dbId) {
      try {
        await fetch(`${API_URL}/${order.dbId}`, { method: 'DELETE' });
        loadData();
      } catch (e) {
        console.error('Gagal hapus transaksi lokal:', e);
      }
    }
  };

  // --- EDIT TAPPING ORDER ---
  const handleEditTappingOrder = async (order) => {
    if (!order.rawCart) {
      alert('⚠️ Pesanan tapping versi lama tidak mendukung edit langsung. Silakan batalkan dan input ulang.');
      return;
    }
    setCart(order.rawCart);
    setCustomerName(order.rawCustomerName || '');
    setPickupType(order.rawPickupType || 'Tidak Ada Keterangan');
    setPickupCondition(order.rawPickupCondition || 'Pagi');
    setPickupTime(order.rawPickupTime || '');
    setOrderType(order.rawOrderType || 'Makan Sini');
    setCabbageOption(order.rawCabbage || 'Pake Kol Biasa');
    setSambalOption(order.rawSambal || 'Pake Semua');
    setOrderNote(order.rawNote || '');
    setIsDeletingId(order.id);
    await deleteLocalOrder(order.id);
    setIsDeletingId(null);
    setIsTappingModalOpen(false);
  };

  // --- EXPENSE HISTORY ---
  const groupedExpenseHistory = useMemo(() => {
    const expenseItems = employeeVisibleData.filter(x => x.totalPengeluaran > 0).slice().reverse();
    const groups = [];
    expenseItems.forEach(item => {
      const match = item.jenisPengeluaran.match(/#GRP(\d+)#/);
      const grpId = match ? match[1] : item._id;
      if (groups.length > 0 && groups[groups.length - 1].grpId === grpId) {
        groups[groups.length - 1].items.push(item);
      } else {
        groups.push({ grpId, items: [item] });
      }
    });
    return groups;
  }, [employeeVisibleData]);

  // --- RESIZER ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isDragging === null) return;
      const percent = (e.clientX / window.innerWidth) * 100;
      setWidths(prev => {
        const newWidths = [...prev];
        if (isDragging === 0 && percent > 20 && percent < 60) {
          const diff = percent - newWidths[0]; newWidths[0] = percent; newWidths[1] = newWidths[1] - diff;
        } else if (isDragging === 1 && percent > 40 && percent < 80) {
          const combinedLeft = newWidths[0] + newWidths[1]; const diff = percent - combinedLeft; newWidths[1] = newWidths[1] + diff; newWidths[2] = newWidths[2] - diff;
        }
        return newWidths;
      });
    };
    const handleMouseUp = () => setIsDragging(null);
    if (isDragging !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleEmergencySystem = () => {
    alert('⚠️ Fitur Laporan Darurat / Telegram sedang dalam perbaikan (Under Maintenance). Silakan hubungi admin secara langsung.');
  };

  // --- BLUETOOTH PRINTER ---
  const connectBluetoothPrinter = async () => {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ name: 'RPP02N' }],
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb',
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
          '49535343-fe7d-4ae5-8fa9-9fafd205e455',
        ],
      });
      const server = await device.gatt.connect();
      const services = await server.getPrimaryServices();
      let writeCharacteristic = null;
      for (let service of services) {
        const characteristics = await service.getCharacteristics();
        for (let char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            writeCharacteristic = char; break;
          }
        }
        if (writeCharacteristic) break;
      }
      if (writeCharacteristic) {
        setBtDevice(device);
        setBtCharacteristic(writeCharacteristic);
        alert(`✅ Printer [${device.name || 'Bluetooth'}] Berhasil Terkoneksi!`);
        device.addEventListener('gattserverdisconnected', () => {
          setBtDevice(null); setBtCharacteristic(null);
          alert('⚠️ Koneksi Printer Terputus!');
        });
      } else {
        alert('❌ Device berhasil dikonek, tapi tidak nemu jalur print. Pastikan ini printer thermal!');
      }
    } catch (err) {
      if (err.name !== 'NotFoundError') alert('Gagal konek printer: ' + err.message);
    }
  };

  const sendTextToPrinter = async (text, characteristic) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const CHUNK_SIZE = 48;
    for (let i = 0; i < data.length; i += CHUNK_SIZE) {
      const chunk = data.slice(i, i + CHUNK_SIZE);
      await characteristic.writeValue(chunk);
      await new Promise(resolve => setTimeout(resolve, 20));
    }
  };

  const handlePrintTransaction = async (txData, isFromPrintModal = false) => {
    if (!btCharacteristic) { alert('⚠️ Printer Bluetooth belum dikoneksikan!'); return; }
    let itemsStr = '', queueStr = '', total = 0, dateStr = '';
    let isLunas = true;
    if (txData._id) {
      queueStr = txData.jenisPengeluaran ? txData.jenisPengeluaran.split(']')[0].replace('[', '') : 'Lunas';
      itemsStr = txData.jenisPengeluaran ? txData.jenisPengeluaran.split('] ')[1] : '';
      total = (txData.cash || 0) + (txData.bca || 0) + (txData.gofood || 0);
      dateStr = new Date(txData.createdAt).toLocaleString('id-ID');
    } else {
      queueStr = txData.queue; itemsStr = txData.items; total = txData.total;
      dateStr = `${todayStr} ${txData.time}`;
      if (txData.status === 'BELUM_BAYAR') isLunas = false;
    }
    const itemArray = (itemsStr || '').split(',').map(i => i.trim()).filter(i => i);
    let pOrderType = '', pCabbageOpt = '', pSambalOpt = '', pNote = '', pPayMethod = '', pPayGiven = 0, pPayChange = 0;
    let realItems = [];
    itemArray.forEach(item => {
      if (item.startsWith('**')) {
        const c = item.replace(/\*/g, '').trim();
        if (c === 'MAKAN SINI' || c === 'BUNGKUS') pOrderType = c;
        else if (c.includes('KOL')) pCabbageOpt = c;
        else pSambalOpt = c;
      } else if (item.startsWith('++ CATATAN:')) { pNote = item.replace('++ CATATAN:', '').trim(); }
      else if (item.startsWith('++ PAY:')) {
        const sp = item.replace('++ PAY:', '').trim().split('|');
        pPayMethod = sp[0]; pPayGiven = parseInt(sp[1]) || 0; pPayChange = parseInt(sp[2]) || 0;
      } else {
        let parts = item.split('::');
        realItems.push({ main: parts[0].trim(), sub: parts.length > 1 ? parts[1].split('|').map(s => s.trim()).filter(s => s) : [] });
      }
    });
    const bName = branchInfo?.name || 'Kasir Penjualan';
    let receiptText = `\x1B\x40\x1B\x61\x01\x1B\x45\x01${bName.split('-')[0].trim()}\n\x1B\x45\x00${bName.split('-')[1]?.trim() || ''}\n--------------------------------\n`;
    if (pOrderType) receiptText += `\x1B\x45\x01[ ${pOrderType} ]\n\x1B\x45\x00`;
    receiptText += `--------------------------------\n\x1B\x61\x00`;
    if (pCabbageOpt && pCabbageOpt !== 'TIDAK PAKE KOL') receiptText += `Kol    : ${pCabbageOpt}\n`;
    if (pSambalOpt && pSambalOpt !== 'TIDAK PAKE SAMBAL') receiptText += `Sambal : ${pSambalOpt}\n`;
    receiptText += `Waktu  : ${dateStr}\nAntri  : ${queueStr}\n`;
    if (pNote) receiptText += `Catatan: ${pNote}\n`;
    receiptText += `--------------------------------\n`;
    realItems.forEach(itemObj => {
      receiptText += `${itemObj.main}\n`;
      if (itemObj.sub && itemObj.sub.length > 0) itemObj.sub.forEach(sub => { receiptText += `  - ${sub}\n`; });
    });
    receiptText += `--------------------------------\n\x1B\x45\x01TOTAL : ${formatRupiah(total)}\n\x1B\x45\x00`;
    if (pPayMethod && isLunas) {
      receiptText += `BAYAR (${pPayMethod.toUpperCase()}) : ${formatRupiah(pPayGiven)}\n`;
      if (pPayMethod === 'Cash') receiptText += `KEMBALI : ${formatRupiah(pPayChange)}\n`;
    }
    receiptText += `\x1B\x61\x01\n${isLunas ? '>> LUNAS <<' : '>> BELUM BAYAR <<'}\n\x1B\x61\x00--------------------------------\n\x1B\x61\x01Terima Kasih!\n\n\n\n`;
    try {
      await sendTextToPrinter(receiptText, btCharacteristic);
      if (txData._id) { if (typeof onPrintCount === 'function') await onPrintCount(txData._id); }
      else { setLocalOrders(localOrders.map(o => o.id === txData.id ? { ...o, printCount: (o.printCount || 0) + 1 } : o)); }
      if (isFromPrintModal) {
        setPrintModal(prev => { if (prev.printCount >= 1) { return { isOpen: false, data: null, printCount: 0 }; } else { return { ...prev, printCount: prev.printCount + 1 }; } });
      } else {
        setPrintModal({ isOpen: false, data: null, printCount: 0 }); setDetailModal({ isOpen: false, data: null });
      }
    } catch (err) { alert('Yah, gagal nge-print nih. Coba pastikan printernya nyala atau konek ulang.'); }
  };

  // --- RECEIPT PRINT AREA (for browser print) ---
  const ReceiptPrintArea = ({ data }) => {
    if (!data) return null;
    let pItemsStr = '', pQueueStr = '', pTotal = 0, pDateStr = '', pIsLunas = true;
    if (data._id) {
      pQueueStr = data.jenisPengeluaran ? data.jenisPengeluaran.split(']')[0].replace('[', '') : 'Lunas';
      pItemsStr = data.jenisPengeluaran ? data.jenisPengeluaran.split('] ')[1] : '';
      pTotal = (data.cash || 0) + (data.bca || 0) + (data.gofood || 0);
      pDateStr = new Date(data.createdAt).toLocaleString('id-ID');
    } else {
      pQueueStr = data.queue; pItemsStr = data.items; pTotal = data.total;
      pDateStr = `${todayStr} ${data.time}`;
      if (data.status === 'BELUM_BAYAR') pIsLunas = false;
    }
    const iArr = (pItemsStr || '').split(',').map(i => i.trim()).filter(i => i);
    let pOT = '', pCO = '', pSO = '', pNote = '', pRealItems = [];
    iArr.forEach(str => {
      if (str.startsWith('**')) { const c = str.replace(/\*/g, '').trim(); if (c === 'MAKAN SINI' || c === 'BUNGKUS') pOT = c; else if (c.includes('KOL')) pCO = c; else pSO = c; }
      else if (str.startsWith('++ CATATAN:')) pNote = str.replace('++ CATATAN:', '').trim();
      else if (!str.startsWith('++ PAY:')) { let pts = str.split('::'); pRealItems.push({ main: pts[0].trim(), sub: pts.length > 1 ? pts[1].split('|').map(s => s.trim()).filter(s => s) : [] }); }
    });
    const headerName = branchInfo?.name || 'Kasir Penjualan';
    return (
      <div id="print-area" className="hidden print:block absolute top-0 left-0 w-[58mm] bg-white text-black p-2 font-mono text-[11px] leading-tight z-[9999]">
        <div className="text-center mb-2">
          <h2 className="font-bold text-sm uppercase">{headerName.split('-')[0]}</h2>
          <p className="text-[9px]">{headerName.split('-')[1] || ''}</p>
          <p className="text-[9px]">------------------------</p>
          <div className="my-1 py-1 border-y border-dashed border-black"><h3 className="font-black text-sm">{pIsLunas ? '>>> LUNAS <<<' : '>>> BELUM BAYAR <<<'}</h3></div>
        </div>
        {pOT && <div className="text-center font-bold text-xs mb-1">[ {pOT} ]</div>}
        <div className="text-left text-[9px] mb-2 border-b border-dashed border-black pb-1">
          {pCO && pCO !== 'TIDAK PAKE KOL' && <div>Kol    : {pCO}</div>}
          {pSO && pSO !== 'TIDAK PAKE SAMBAL' && <div>Sambal : {pSO}</div>}
        </div>
        <p className="mb-1 text-[9px]">Waktu: {pDateStr}</p>
        <p className="mb-2 font-bold text-sm">Antrian: {pQueueStr}</p>
        {pNote && <p className="mb-2 text-[9px] font-bold">Catatan: {pNote}</p>}
        <div className="mb-2">
          {pRealItems.map((itemObj, idx) => (
            <div key={idx} className="mb-1.5">
              <div className="font-bold">{itemObj.main}</div>
              {itemObj.sub.length > 0 && <div className="pl-2.5 text-[9px] mt-0.5 ml-1 border-l border-dashed border-gray-400">{itemObj.sub.map((s, i) => <div key={i}>- {s}</div>)}</div>}
            </div>
          ))}
        </div>
        <p className="text-[9px]">------------------------</p>
        <div className="flex justify-between font-bold text-sm mt-1"><span>TOTAL</span><span>{formatRupiah(pTotal)}</span></div>
        <div className="text-center mt-4 text-[9px]"><p>Terima Kasih!</p><p>Selamat Menikmati</p></div>
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="flex-1 w-full h-[100dvh] bg-gray-100 flex flex-col font-sans overflow-hidden text-gray-800 relative">
      <style dangerouslySetInnerHTML={{ __html: `@media print { body * { visibility: hidden; } #print-area, #print-area * { visibility: visible; } } @keyframes shrink { from { width: 100%; } to { width: 0%; } }` }} />
      <ReceiptPrintArea data={printModal.data || detailModal.data} />

      {/* STOCK ALERT TOAST */}
      {stockAlert && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl font-black text-sm flex items-center gap-2 border-2 border-red-700">
            <AlertCircle size={18} /> {stockAlert}
          </div>
        </div>
      )}

      {/* ===== MODAL: TAPPING ===== */}
      {isTappingModalOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[115] flex items-center justify-center animate-in fade-in p-4 sm:p-6">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-gray-100 animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-orange-50 to-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center border border-orange-200 shadow-sm"><Clock size={28} className="text-orange-600" /></div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">Antrian Tapping</h3>
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-widest mt-1">Selesaikan Pembayaran & Serahkan Pesanan</p>
                </div>
              </div>
              <button onClick={() => setIsTappingModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all border border-gray-200 shadow-sm active:scale-95"><X size={24} /></button>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm font-bold text-gray-500">Menampilkan <span className="font-black text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">{employeeLocalOrders.length}</span> antrian</p>
              <div className="flex bg-white rounded-xl p-1.5 border border-gray-200 shadow-sm w-full sm:w-auto">
                <button onClick={() => setTappingSortOrder('Terlama')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-black transition-all ${tappingSortOrder === 'Terlama' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Urutan Terlama</button>
                <button onClick={() => setTappingSortOrder('Terbaru')} className={`flex-1 sm:flex-none px-5 py-2 rounded-lg text-xs font-black transition-all ${tappingSortOrder === 'Terbaru' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>Paling Baru</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50/50">
              {employeeLocalOrders.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-80">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4"><CheckCircle2 size={40} className="text-gray-300" /></div>
                  <h3 className="text-2xl font-black text-gray-900">Semua Lunas!</h3>
                  <p className="text-sm font-bold mt-1">Tidak ada antrian tapping saat ini.</p>
                </div>
              ) : (
                [...employeeLocalOrders].sort((a, b) => tappingSortOrder === 'Terlama' ? a.id - b.id : b.id - a.id).map(order => {
                  const qName = order.queue.split(' (')[0];
                  const qTimeMatch = order.queue.match(/\((Ambil.*?)\)/);
                  const qTime = qTimeMatch ? qTimeMatch[1] : 'Ambil: Bebas/Nanti';
                  const rawItemsStr = order.items || '';
                  const itemArray = rawItemsStr.split(',').map(i => i.trim()).filter(i => i);
                  let options = []; let ordersList = []; let noteStr = '';
                  itemArray.forEach(str => {
                    if (str.startsWith('**')) options.push(str.replace(/\*/g, '').trim());
                    else if (str.startsWith('++ CATATAN:')) noteStr = str.replace('++ CATATAN:', '').trim();
                    else if (!str.startsWith('++ PAY:')) ordersList.push(str);
                  });
                  return (
                    <div key={order.id} className="bg-white p-5 rounded-[1.5rem] border border-gray-200 shadow-sm hover:border-orange-300 hover:shadow-md transition-all flex flex-col gap-4 relative group">
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-gray-100 pb-4">
                        <div className="flex flex-col gap-2">
                          <span className="font-black text-gray-900 text-2xl leading-none">{qName}</span>
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-black rounded-xl border uppercase tracking-wide w-fit ${qTime.includes('Bebas/Nanti') ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-orange-100 text-orange-700 border-orange-200'}`}><Clock size={16} /> Rencana {qTime}</span>
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-100 self-end sm:self-start">
                          {order.printCount > 0 && <span className="text-[10px] font-black text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm flex items-center gap-1"><Printer size={12} /> {order.printCount}x</span>}
                          <button onClick={() => handleEditTappingOrder(order)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit Pesanan Ini"><Pencil size={18} /></button>
                          <div className="w-px h-5 bg-gray-200 mx-1" />
                          {isDeletingId === order.id ? (
                            <button disabled className="bg-red-500 text-white text-[10px] px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 cursor-wait"><Loader2 size={12} className="animate-spin" /> Proses...</button>
                          ) : deleteConfirm === order.id ? (
                            <button onClick={() => { setIsDeletingId(order.id); deleteLocalOrder(order.id); setIsDeletingId(null); setDeleteConfirm(null); }} className="bg-red-500 hover:bg-red-600 text-white text-xs px-4 py-1.5 rounded-lg font-black animate-in zoom-in shadow-sm transition-colors">Yakin Batal?</button>
                          ) : (
                            <button onClick={() => setDeleteConfirm(order.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Hapus Permanen"><Trash2 size={18} /></button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 bg-gray-50/80 p-4 rounded-2xl border border-gray-100">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Detail Pesanan:</p>
                          {options.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">{options.map((opt, idx) => <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100 shadow-sm">{opt}</span>)}</div>}
                          <ul className="space-y-2.5 mb-3">
                            {ordersList.map((item, idx) => {
                              const qtyMatch = item.match(/^(\d+)x\s(.*)/);
                              return <li key={idx} className="flex items-start gap-3">{qtyMatch && <span className="text-sm font-black text-gray-900 bg-white border border-gray-200 px-2 py-0.5 rounded-md shadow-sm">{qtyMatch[1]}x</span>}<span className="text-sm font-bold text-gray-700 pt-1">{qtyMatch ? qtyMatch[2] : item}</span></li>;
                            })}
                          </ul>
                          {noteStr && <div className="bg-orange-50 p-2.5 rounded-xl border border-orange-100 mt-3"><p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={12} /> Catatan Pelanggan</p><p className="text-xs font-bold text-orange-900">{noteStr}</p></div>}
                        </div>
                        <div className="sm:w-48 bg-orange-50 p-4 rounded-2xl border border-orange-100 flex flex-col justify-center shrink-0 text-right sm:text-left">
                          <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Total Tagihan</p>
                          <span className="text-3xl font-black text-orange-600 tracking-tight">{formatRupiah(order.total)}</span>
                        </div>
                      </div>
                      <div className="pt-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 text-center sm:text-left">Pilih Pembayaran & Lunasi:</p>
                        <div className="grid grid-cols-3 gap-3">
                          <button onClick={() => markAsPaid(order.id, 'Cash')} className="py-3.5 bg-gray-900 text-white hover:bg-black rounded-xl text-sm font-black transition-all active:scale-95 shadow-md border-b-4 border-gray-950 flex justify-center items-center gap-2"><Wallet size={16} className="hidden sm:block" /> CASH</button>
                          <button onClick={() => markAsPaid(order.id, 'BCA')} className="py-3.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-black transition-all active:scale-95 shadow-sm border border-blue-200 flex justify-center items-center gap-2"><CreditCard size={16} className="hidden sm:block" /> BCA</button>
                          <button onClick={() => markAsPaid(order.id, 'QRIS')} className="py-3.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-sm font-black transition-all active:scale-95 shadow-sm border border-purple-200 flex justify-center items-center gap-2">QRIS</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: DETAIL TRANSAKSI ===== */}
      {detailModal.isOpen && detailModal.data && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[110] flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl max-w-sm w-full border border-gray-100 animate-in zoom-in-95 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-start mb-4 shrink-0">
              <div><h3 className="text-xl font-black text-gray-900 leading-tight">Detail Transaksi</h3><p className="text-xs font-bold text-gray-400 mt-1">{detailModal.data._id ? new Date(detailModal.data.createdAt).toLocaleTimeString('id-ID') : detailModal.data.time}</p></div>
              <button onClick={() => setDetailModal({ isOpen: false, data: null })} className="p-2 bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 transition-colors"><X size={18} /></button>
            </div>
            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Antrian / Nama</span>
                <span className="font-black text-gray-900 text-lg">{detailModal.data._id ? (detailModal.data.jenisPengeluaran.split(']')[0].replace('[', '')) : detailModal.data.queue.split(' (Ambil:')[0]}</span>
              </div>
              {(() => {
                const rawItemsStr = detailModal.data._id ? detailModal.data.jenisPengeluaran.split('] ')[1] : detailModal.data.items;
                const itemArray = (rawItemsStr || '').split(',').map(i => i.trim()).filter(i => i);
                let options = []; let ordersList = []; let noteStr = '';
                itemArray.forEach(str => {
                  if (str.startsWith('**')) options.push(str.replace(/\*/g, '').trim());
                  else if (str.startsWith('++ CATATAN:')) noteStr = str.replace('++ CATATAN:', '').trim();
                  else if (!str.startsWith('++ PAY:')) ordersList.push(str);
                });
                return (
                  <>
                    {options.length > 0 && <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Keterangan Opsi</p><div className="flex flex-wrap gap-1.5">{options.map((opt, idx) => <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-black rounded-lg border border-blue-100 shadow-sm">{opt}</span>)}</div></div>}
                    <div><p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Menu Yang Dipesan</p><div className="space-y-2">{ordersList.map((item, idx) => { const match = item.match(/^(\d+)x\s(.*)/); return <div key={idx} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">{match && <span className="text-sm font-black text-gray-900 bg-gray-100 border border-gray-200 px-2.5 py-0.5 rounded-md">{match[1]}x</span>}<span className="text-sm font-bold text-gray-700 leading-tight pt-0.5">{match ? match[2] : item}</span></div>; })}</div></div>
                    {noteStr && <div className="bg-orange-50 p-3 rounded-xl border border-orange-100"><p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1 flex items-center gap-1"><FileText size={12} /> Catatan Request</p><p className="text-sm font-bold text-orange-900">{noteStr}</p></div>}
                  </>
                );
              })()}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100 shrink-0">
              <div className="flex justify-between items-end mb-4 bg-gray-50 p-3 rounded-xl">
                <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Total Tagihan</span>
                <span className="text-2xl font-black text-green-600">{formatRupiah(detailModal.data._id ? ((detailModal.data.cash || 0) + (detailModal.data.bca || 0) + (detailModal.data.gofood || 0)) : detailModal.data.total)}</span>
              </div>
              <button onClick={() => handlePrintTransaction(detailModal.data)} className="w-full py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"><Printer size={20} /> Cetak Nota Sekarang</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: PRINT SUKSES ===== */}
      {printModal.isOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center animate-in fade-in">
          <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 border border-gray-100 animate-in zoom-in-95 text-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 mx-auto"><CheckCircle2 size={40} className="text-green-500" /></div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Tersimpan!</h3>
            <p className={`text-sm font-bold mb-8 transition-colors ${printModal.printCount === 0 ? 'text-gray-500' : 'text-blue-600 bg-blue-50 p-2 rounded-xl border border-blue-100'}`}>{printModal.printCount === 0 ? 'Apakah pelanggan meminta struk/nota?' : '✅ Struk pertama tercetak. Cabut kertas, lalu klik untuk cetak struk kedua (arsip toko).'}</p>
            <div className="flex gap-3 flex-col sm:flex-row">
              <button onClick={() => setPrintModal({ isOpen: false, data: null, printCount: 0 })} className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-colors">Tutup Saja</button>
              <button onClick={() => handlePrintTransaction(printModal.data, true)} className={`flex-[2] py-4 text-white font-black rounded-xl active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 ${printModal.printCount === 0 ? 'bg-gray-900 hover:bg-black' : 'bg-blue-600 hover:bg-blue-700'}`}><Printer size={20} /> {printModal.printCount === 0 ? 'YA, CETAK STRUK' : 'CETAK KE-2 & TUTUP'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: CUSTOMER (nama, pickup) ===== */}
      {customerModal.isOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[90] flex items-center justify-center animate-in fade-in">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl max-w-md w-full mx-4 border border-gray-100 animate-in zoom-in-95 relative">
            <button onClick={() => { setCustomerModal({ isOpen: false, type: null }); setCustomerName(''); }} className="absolute top-5 right-5 p-2 bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6 mx-auto"><User size={32} className="text-gray-900" /></div>
            <h3 className="text-xl font-black text-center text-gray-900 mb-2">Atas Nama Siapa?</h3>
            <p className="text-center text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">{customerModal.type === 'BELUM_BAYAR' ? 'PENTING: JANGAN DISKIP BIAR GAMPANG DITAGIH' : 'Opsional: Boleh di-skip kalau antrian rame'}</p>
            <input type="text" placeholder="Masukkan nama..." className="w-full bg-gray-50 border border-gray-200 p-4 rounded-2xl text-center text-lg font-bold outline-none focus:bg-white focus:border-gray-900 focus:ring-4 focus:ring-gray-100 transition-all mb-4" value={customerName} onChange={e => setCustomerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && executeSubmitSale(false)} />
            {customerModal.type === 'BELUM_BAYAR' && (
              <div className="mb-6 space-y-3 bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest text-center">Kapan Akan Diambil?</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Tidak Ada Keterangan', 'Kondisi', 'Waktu Tertentu'].map(pt => (
                    <button key={pt} onClick={() => setPickupType(pt)} className={`py-2 rounded-xl font-black text-[10px] transition-all border-2 ${pickupType === pt ? 'border-orange-500 bg-orange-500 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-orange-300'}`}>{pt === 'Tidak Ada Keterangan' ? 'Bebas / Nanti' : pt}</button>
                  ))}
                </div>
                {pickupType === 'Kondisi' && (
                  <div className="grid grid-cols-4 gap-2 animate-in fade-in zoom-in-95">
                    {['Pagi', 'Siang', 'Sore', 'Malam'].map(cond => (
                      <button key={cond} onClick={() => setPickupCondition(cond)} className={`py-2 rounded-xl font-black text-[10px] sm:text-xs transition-all border-2 ${pickupCondition === cond ? 'border-gray-900 bg-gray-900 text-white shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400'}`}>{cond}</button>
                    ))}
                  </div>
                )}
                {pickupType === 'Waktu Tertentu' && (
                  <div className="animate-in fade-in zoom-in-95"><input type="time" className="w-full bg-white border-2 border-gray-200 p-3 rounded-xl text-center text-lg font-black outline-none focus:border-gray-900 transition-all text-gray-900" value={pickupTime} onChange={e => setPickupTime(e.target.value)} /></div>
                )}
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => executeSubmitSale(true)} disabled={isSubmitting || (pickupType === 'Waktu Tertentu' && !pickupTime)} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">Skip Nama</button>
              <button onClick={() => executeSubmitSale(false)} disabled={isSubmitting || !customerName.trim() || (pickupType === 'Waktu Tertentu' && !pickupTime)} className="flex-[2] py-4 bg-gray-900 text-white font-black rounded-xl active:scale-95 transition-transform shadow-lg disabled:opacity-50">LANJUT</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: VARIAN AYAM & NASI ===== */}
      {variantModal.isOpen && (
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm z-[120] flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl max-w-sm w-full border border-gray-100 animate-in zoom-in-95 relative">
            <button onClick={() => setVariantModal({ isOpen: false, item: null })} className="absolute top-5 right-5 p-2 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-full transition-colors active:scale-90"><X size={20} /></button>
            <h3 className="text-2xl font-black text-gray-900 mb-1 text-center">Pilih Opsi</h3>
            <p className="text-center text-xs font-bold text-gray-400 mb-6 uppercase tracking-widest">{variantModal.item?.name}</p>
            <div className="space-y-4">
              {variantSelections.ayam !== 'N/A' && (
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Bagian Ayam</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setVariantSelections(prev => ({ ...prev, ayam: 'Paha' }))} className={`py-4 rounded-2xl font-black text-lg transition-all border-2 active:scale-95 ${variantSelections.ayam === 'Paha' ? 'bg-orange-500 border-orange-600 text-white shadow-md' : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'}`}>PAHA</button>
                    <button onClick={() => setVariantSelections(prev => ({ ...prev, ayam: 'Dada' }))} className={`py-4 rounded-2xl font-black text-lg transition-all border-2 active:scale-95 ${variantSelections.ayam === 'Dada' ? 'bg-red-500 border-red-600 text-white shadow-md' : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'}`}>DADA</button>
                  </div>
                </div>
              )}
              {variantSelections.nasi !== 'N/A' && (
                <div>
                  <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Porsi Nasi</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setVariantSelections(prev => ({ ...prev, nasi: 'Nasi Full' }))} className={`py-4 rounded-2xl font-black text-sm transition-all border-2 active:scale-95 ${variantSelections.nasi === 'Nasi Full' ? 'bg-blue-500 border-blue-600 text-white shadow-md' : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-200'}`}>NASI FULL (5rb)</button>
                    <button onClick={() => setVariantSelections(prev => ({ ...prev, nasi: 'Nasi Setengah' }))} className={`py-4 rounded-2xl font-black text-sm transition-all border-2 active:scale-95 ${variantSelections.nasi === 'Nasi Setengah' ? 'bg-blue-500 border-blue-600 text-white shadow-md' : 'bg-white hover:bg-blue-50 text-gray-700 border-gray-200 hover:border-blue-200'}`}>1/2 PORSI (3rb)</button>
                  </div>
                </div>
              )}
              <div className="flex gap-3 mt-6">
                <button onClick={() => setVariantModal({ isOpen: false, item: null })} className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-xl hover:bg-gray-200 transition-colors">Batal</button>
                <button onClick={confirmVariantSelection} disabled={(variantSelections.ayam !== 'N/A' && !variantSelections.ayam) || (variantSelections.nasi !== 'N/A' && !variantSelections.nasi)} className="flex-[2] py-4 bg-gray-900 text-white font-black rounded-xl active:scale-95 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">MASUKAN KERANJANG</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: ITEM OPTION ===== */}
      {itemOptionModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[999] flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-[95vw] sm:w-full max-w-4xl max-h-[90dvh] flex flex-col border border-gray-100 animate-in zoom-in-95 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 bg-blue-50/80 rounded-t-[2rem] flex justify-between items-center shrink-0">
              <div><h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Detail Modifikasi Item</h3><p className="text-xs sm:text-sm font-bold text-blue-600 mt-1">{itemOptionModal.item?.name}</p></div>
              <button onClick={() => setItemOptionModal({ isOpen: false, cartKey: null, item: null, options: { type: 'Bawaan Global', cabbage: 'Bawaan Global', sambal: 'Bawaan Global', note: '' } })} className="p-3 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full border border-gray-200 shadow-sm transition-colors active:scale-90"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
                <div className="space-y-6">
                  <div><label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">1</div> Tipe Bawaan</label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">{['Bawaan Global', 'Makan Sini', 'Bungkus'].map(opt => (<button key={opt} onClick={() => setItemOptionModal(p => ({ ...p, options: { ...p.options, type: opt } }))} className={`py-3 sm:py-4 rounded-xl font-black text-[10px] sm:text-xs transition-all border-2 active:scale-95 ${itemOptionModal.options.type === opt ? 'border-blue-600 bg-blue-600 text-white shadow-lg transform scale-[1.02]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>{opt === 'Bawaan Global' ? 'Ikut Global' : opt}</button>))}</div>
                  </div>
                  <div><label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px]">2</div> Opsi Kol</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">{['Bawaan Global', 'Tidak Pake Kol', 'Pake Kol Biasa', 'Pake Kol Goreng'].map(opt => (<button key={opt} onClick={() => setItemOptionModal(p => ({ ...p, options: { ...p.options, cabbage: opt } }))} className={`py-3 sm:py-4 rounded-xl font-black text-xs sm:text-sm transition-all border-2 active:scale-95 flex items-center justify-center text-center gap-1 ${itemOptionModal.options.cabbage === opt ? 'border-gray-900 bg-gray-900 text-white shadow-md transform scale-[1.01]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}><span>{opt === 'Bawaan Global' ? 'Ikut Global' : opt}</span>{itemOptionModal.options.cabbage === opt && <CheckCircle2 size={16} className="text-white hidden sm:block" />}</button>))}</div>
                  </div>
                </div>
                <div className="space-y-6 flex flex-col">
                  <div><label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px]">3</div> Opsi Sambal</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">{['Bawaan Global', 'Tidak Pake Sambal', 'Pake Semua', 'Sambal Merah Saja', 'Sambal Ijo Saja'].map(opt => (<button key={opt} onClick={() => setItemOptionModal(p => ({ ...p, options: { ...p.options, sambal: opt } }))} className={`py-3 sm:py-4 rounded-xl font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${itemOptionModal.options.sambal === opt ? 'border-red-500 bg-red-500 text-white shadow-md transform scale-[1.02]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>{opt === 'Bawaan Global' ? 'Ikut Global' : opt}</button>))}</div>
                  </div>
                  <div className="flex-1 flex flex-col min-h-[100px]"><label className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center text-[10px]">4</div> Catatan Titipan / Bebas</label>
                    <textarea placeholder="Misal: tambah kecap, dipisah (Pesanan A)..." className="w-full flex-1 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-bold outline-none focus:bg-white focus:border-blue-500 focus:shadow-inner resize-none transition-all placeholder:text-gray-400 placeholder:font-normal" value={itemOptionModal.options.note} onChange={e => setItemOptionModal(p => ({ ...p, options: { ...p.options, note: e.target.value } }))} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveItemOptions(); } }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/80 rounded-b-[2rem] shrink-0"><button onClick={saveItemOptions} className="w-full py-4 sm:py-5 bg-gray-900 text-white font-black text-lg sm:text-xl rounded-2xl hover:bg-black shadow-lg active:scale-[0.98] transition-all tracking-wider flex items-center justify-center gap-3 border-b-4 border-gray-950"><CheckCircle2 size={28} className="text-green-400" /> SIMPAN CATATAN ITEM</button></div>
          </div>
        </div>
      )}


      {/* ===== MODAL: OPSI GLOBAL (Makan Sini, Kol, Sambal) ===== */}
      {isOptionModalOpen && (
        <div className="fixed inset-0 bg-gray-900/70 backdrop-blur-sm z-[999] flex items-center justify-center animate-in fade-in p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-[95vw] sm:w-full max-w-4xl max-h-[90dvh] flex flex-col border border-gray-100 animate-in zoom-in-95 overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 rounded-t-[2rem] shrink-0">
              <div><h3 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">Opsi Detail Pesanan</h3><p className="text-xs sm:text-sm font-bold text-gray-500 mt-1">Pilih sesuai request pelanggan</p></div>
              <button onClick={() => setIsOptionModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full border border-gray-200 shadow-sm transition-colors active:scale-90"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 bg-white">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-full">
                <div className="space-y-6">
                  <div><p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px]">1</div> Tipe Pesanan</p>
                    <div className="grid grid-cols-2 gap-3">{['Makan Sini', 'Bungkus'].map(opt => (<button key={opt} onClick={() => setOrderType(opt)} className={`py-4 sm:py-5 rounded-2xl font-black text-base sm:text-lg transition-all border-2 active:scale-95 ${orderType === opt ? 'border-blue-600 bg-blue-600 text-white shadow-md transform scale-[1.02]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>{opt}</button>))}</div>
                  </div>
                  <div><p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px]">2</div> Opsi Kol</p>
                    <div className="flex flex-col gap-2 sm:gap-3">{['Tidak Pake Kol', 'Pake Kol Biasa', 'Pake Kol Goreng'].map(opt => (<button key={opt} onClick={() => setCabbageOption(opt)} className={`py-3 px-4 rounded-xl font-black text-sm transition-all border-2 active:scale-95 flex items-center justify-center text-center gap-1 ${cabbageOption === opt ? 'border-gray-900 bg-gray-900 text-white shadow-md transform scale-[1.01]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}><span>{opt}</span>{cabbageOption === opt && <CheckCircle2 size={16} className="text-white" />}</button>))}</div>
                  </div>
                </div>
                <div className="space-y-6 flex flex-col">
                  <div><p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-[10px]">3</div> Opsi Sambal</p>
                    <div className="grid grid-cols-2 gap-3">{['Tidak Pake Sambal', 'Pake Semua', 'Sambal Merah Saja', 'Sambal Ijo Saja'].map(opt => (<button key={opt} onClick={() => setSambalOption(opt)} className={`py-3 sm:py-4 rounded-xl font-black text-xs sm:text-sm transition-all border-2 active:scale-95 ${sambalOption === opt ? 'border-red-500 bg-red-500 text-white shadow-md transform scale-[1.02]' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-400 hover:bg-gray-50'}`}>{opt}</button>))}</div>
                  </div>
                  <div className="flex-1 flex flex-col min-h-[100px]"><p className="text-xs sm:text-sm font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-[10px]">4</div> Catatan Khusus <span className="text-[10px] font-bold capitalize text-gray-400">(Opsional)</span></p>
                    <textarea placeholder="Ketik request tambahan di sini..." className="w-full flex-1 p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:bg-white focus:border-gray-900 focus:shadow-inner resize-none transition-all placeholder:text-gray-400" value={orderNote} onChange={e => setOrderNote(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setIsOptionModalOpen(false); } }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50/80 rounded-b-[2rem] shrink-0"><button onClick={() => setIsOptionModalOpen(false)} className="w-full py-4 sm:py-5 bg-gray-900 text-white font-black text-lg sm:text-xl rounded-2xl hover:bg-black shadow-lg active:scale-[0.98] transition-all tracking-wider flex items-center justify-center gap-3 border-b-4 border-gray-950"><CheckCircle size={28} className="text-green-400" /> SIMPAN OPSI & LANJUTKAN</button></div>
          </div>
        </div>
      )}

      {/* ===== NAVBAR HEADER ===== */}
      {!isNavOpen && (
        <button
          onClick={() => setIsNavOpen(true)}
          className="fixed bottom-4 right-4 bg-emerald-700 text-white px-3 py-2 rounded-full font-black text-xs shadow-xl z-50 flex items-center gap-1.5 hover:bg-emerald-800 active:scale-95 transition-all border border-emerald-500"
        >
          <Menu size={14} /> BUKA MENU
        </button>
      )}
      {isNavOpen && (
        <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center border-b border-gray-200 shrink-0 gap-3 transition-all duration-300">
          <div className="flex justify-between w-full sm:w-auto items-center">
            <div className="flex items-center gap-2.5">
              {/* <div className="w-3 h-3 rounded-full animate-pulse bg-emerald-500 shrink-0" />
              <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight truncate max-w-[200px] sm:max-w-none">
                {branchInfo?.name || 'Kasir Penjualan'}
              </h3> */}
            </div>
            <button
              onClick={() => setIsNavOpen(false)}
              className="sm:hidden p-1.5 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 active:scale-95 flex items-center gap-1 font-bold text-xs"
            >
              <ChevronUp size={16} /> Tutup
            </button>
          </div>

          <div className="flex items-center flex-wrap gap-2 justify-end w-full sm:w-auto">
            {/* ===== PARENT DROPDOWN MENU ===== */}
            <div className="relative">
              <button
                onClick={() => setIsUtilityMenuOpen(prev => !prev)}
                className="px-3 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-xl transition-colors flex items-center gap-1.5 font-extrabold text-xs active:scale-95"
              >
                <Menu size={14} />
                <span>Menu</span>
                <span className={`transition-transform duration-200 ${isUtilityMenuOpen ? 'rotate-180' : ''}`}>
                  ▾
                </span>
              </button>

              {isUtilityMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden">
                  {/* PERBESAR */}
                  <button
                    onClick={() => {
                      setIsUtilityMenuOpen(false);
                      toggleFullscreen();
                    }}
                    className="w-full px-4 py-3 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                      ⛶
                    </span>
                    {isFullscreen ? 'Kecilkan' : 'Perbesar'}
                  </button>

                  {/* LAPOR MASALAH */}
                  <button
                    onClick={() => {
                      setIsUtilityMenuOpen(false);
                      handleEmergencySystem();
                    }}
                    className="w-full px-4 py-3 text-left text-xs font-black text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center">
                      <AlertCircle size={14} />
                    </span>
                    Lapor Masalah
                  </button>

                  {/* KONEK PRINTER */}
                  <button
                    onClick={() => {
                      setIsUtilityMenuOpen(false);
                      connectBluetoothPrinter();
                    }}
                    className={`w-full px-4 py-3 text-left text-xs font-bold flex items-center gap-3 transition-colors ${btDevice ? 'text-emerald-700 hover:bg-emerald-50' : 'text-orange-700 hover:bg-orange-50'
                      }`}
                  >
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${btDevice ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                      <Printer size={14} />
                    </span>
                    {btDevice ? 'Printer Konek' : 'Konek Printer'}
                  </button>
                </div>
              )}
            </div>

            {/* REFRESH */}
            <button
              onClick={handleRefresh}
              disabled={effectiveIsFetching}
              className="px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors flex items-center gap-1.5 font-extrabold text-xs disabled:opacity-50 border border-emerald-100 active:scale-95"
            >
              <RefreshCw size={14} className={effectiveIsFetching ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>

            {/* LOGOUT */}
            <button
              onClick={onLogout}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors active:scale-95"
              title="Keluar"
            >
              <LogOut size={16} />
            </button>

            {/* SEMBUNYIKAN MENU */}
            <button
              onClick={() => setIsNavOpen(false)}
              className="hidden sm:flex px-3 py-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-xl transition-colors font-extrabold text-xs items-center gap-1 active:scale-95"
            >
              <ChevronUp size={14} />
              <span>Tutup Menu</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== MAIN LAYOUT: RESPONSIVE 3 KOLOM / TABLET / MOBILE TABBED ===== */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* MOBILE & TABLET TAB BAR (hanya muncul di layar < lg) */}
        <div className="lg:hidden flex bg-gray-100 p-1.5 border-b border-gray-200 shrink-0 gap-1.5 z-20">
          <button
            onClick={() => setMobileTab('menu')}
            className={`flex-1 py-2 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${mobileTab === 'menu'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 bg-white border border-gray-200'
              }`}
          >
            📋 Menu ({filteredMenu.length})
          </button>

          <button
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-2 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 relative ${mobileTab === 'cart'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 bg-white border border-gray-200'
              }`}
          >
            🛒 Cart ({Object.keys(cart).length})
            {totalCartPrice > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping absolute top-1 right-1" />
            )}
          </button>

          <button
            onClick={() => setMobileTab('live')}
            className={`flex-1 py-2 px-2 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1 ${mobileTab === 'live'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 bg-white border border-gray-200'
              }`}
          >
            📊 Live ({employeeVisibleData.length})
          </button>
        </div>

        {/* KOLOM 1: MENU */}
        <div
          className={`bg-gray-50 h-full overflow-y-auto flex flex-col ${mobileTab !== 'menu' && mobileTab !== 'cart' ? 'hidden lg:flex' : 'w-full lg:w-auto'
            } ${mobileTab === 'cart' ? 'hidden md:flex' : ''}`}
          style={{ width: windowWidth >= 1024 ? `${widths[0]}%` : windowWidth >= 768 ? '55%' : '100%' }}
        >
          <div className="p-3 sm:p-4 flex-1 flex flex-col">
            <div className="flex gap-2 overflow-x-auto mb-3 sm:mb-4 pb-1 shrink-0 no-scrollbar">
              {['Semua', 'Satuan', 'Paketan', 'Lainnya'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all shadow-xs ${activeCategory === cat
                      ? 'bg-emerald-600 text-white scale-105 shadow-emerald-600/20'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* GRID MENU (EXACTLY 2 ITEMS PER ROW ALWAYS) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 pb-20">
              {filteredMenu.map(item => {
                const totalStok = item.stock;
                const isHabis = totalStok <= 0 && !STOCK_BYPASS_IDS.includes(item.id);
                return (
                  <div key={item.id} className="relative group">
                    <button
                      onClick={() => handleItemClick(item)}
                      className={`w-full min-h-[110px] h-auto p-3 sm:p-4 rounded-2xl border-2 transition-all active:scale-95 flex flex-col items-center justify-between shadow-xs relative overflow-hidden ${isHabis ? 'bg-gray-100 border-red-200 grayscale-[40%]' : item.bg
                        }`}
                    >
                      <div className="w-full flex items-center justify-between gap-1 mb-1">
                        {item.id === 'nasi' ? (
                          <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs bg-yellow-100 text-yellow-700 border border-yellow-200">
                            Pilih Porsi
                          </span>
                        ) : STOCK_BYPASS_IDS.filter(id => id !== 'nasi').includes(item.id) ? (
                          <span className="text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs bg-emerald-100 text-emerald-700 border border-emerald-200">
                            Tersedia
                          </span>
                        ) : (
                          <span
                            className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded shadow-xs ${isHabis
                                ? 'bg-red-500 text-white animate-pulse'
                                : totalStok < 10
                                  ? 'bg-orange-100 text-orange-700 border border-orange-200'
                                  : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              }`}
                          >
                            {isHabis ? 'HABIS' : `Stok: ${totalStok}`}
                          </span>
                        )}
                      </div>
                      <span className="font-extrabold text-xs sm:text-sm text-gray-900 text-center my-1.5 line-clamp-2 leading-tight break-words w-full">
                        {item.name}
                      </span>
                      {item.id !== 'nasi' && (
                        <span className="text-xs font-black text-emerald-700 mt-auto">
                          {formatRupiah(item.price)}
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RESIZER 1 (Hidden on mobile & tablet) */}
        <div className="hidden lg:block w-1 bg-gray-200 hover:bg-emerald-400 cursor-col-resize z-10" onMouseDown={() => setIsDragging(0)} />

        {/* KOLOM 2: CART */}
        <div
          className={`bg-white h-full flex flex-col border-x border-gray-100 relative ${mobileTab !== 'cart' && mobileTab !== 'menu' ? 'hidden lg:flex' : 'w-full lg:w-auto'
            } ${mobileTab === 'menu' ? 'hidden md:flex' : ''}`}
          style={{ width: windowWidth >= 1024 ? `${widths[1]}%` : windowWidth >= 768 ? '45%' : '100%' }}
        >
          <div className="p-3 sm:p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
            <span className="font-extrabold text-xs sm:text-sm text-gray-700">
              Antrian Masuk:{' '}
              <span className="text-gray-900 px-2 py-1 bg-gray-200 rounded-md ml-1 font-black">
                {formatQueue(currentQueueNumber)}
              </span>
            </span>
            {totalCartPrice > 0 && (
              <button onClick={() => setCart({})} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-lg">
                Reset
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
            {Object.keys(cart).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-2 py-12">
                <ShoppingBag size={36} className="opacity-50" />
                <p className="text-xs font-bold text-gray-400">Belum ada pesanan di keranjang</p>
              </div>
            ) : (
              Object.values(cart).map(item => (
                <div key={item.cartKey} className="flex justify-between items-center bg-gray-50/80 p-3 rounded-2xl border border-gray-200/70 gap-2 hover:border-gray-300 transition-all">
                  <div className="leading-tight flex-1 pr-1 min-w-0">
                    <p className="font-extrabold text-gray-900 text-xs sm:text-sm truncate">{item.name}</p>
                    {item.itemOptions && (
                      <p className="text-[10px] font-black text-emerald-600 mt-1 leading-tight flex flex-wrap gap-1">
                        {item.itemOptions.type !== 'Bawaan Global' && <span className="bg-emerald-100 px-1 rounded">{item.itemOptions.type}</span>}
                        {item.itemOptions.cabbage !== 'Bawaan Global' && <span className="bg-emerald-100 px-1 rounded">{item.itemOptions.cabbage}</span>}
                        {item.itemOptions.sambal !== 'Bawaan Global' && <span className="bg-emerald-100 px-1 rounded">{item.itemOptions.sambal}</span>}
                        {item.itemOptions.note && <span className="bg-yellow-100 text-yellow-700 px-1 rounded">📝 {item.itemOptions.note}</span>}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-xs text-gray-600 font-extrabold">{formatRupiah(item.price * item.qty)}</p>
                      <button onClick={() => deleteFromCart(item.cartKey)} className="text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 p-1.5 rounded transition-colors" title="Hapus dari Keranjang"><Trash2 size={12} /></button>
                      <button onClick={() => openItemOptionModal(item)} className="text-emerald-500 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 p-1.5 rounded transition-colors" title="Catatan Per Item"><FileText size={12} /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl p-1 shadow-xs shrink-0 h-fit">
                    <button onClick={() => decreaseQty(item.cartKey)} className="w-6 h-6 rounded-lg bg-gray-100 text-gray-700 font-bold active:scale-90">-</button>
                    <span className="font-black text-gray-900 w-5 text-center text-xs sm:text-sm">{item.qty}</span>
                    <button onClick={() => addToCart(item, item.itemOptions)} className="w-6 h-6 rounded-lg bg-emerald-600 text-white font-bold active:scale-90">+</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* CHECKOUT AREA */}
          <div className="p-4 sm:p-5 bg-white border-t border-gray-200 shrink-0 shadow-lg z-10 space-y-3">
            <button
              onClick={() => setIsOptionModalOpen(true)}
              className="w-full py-2.5 sm:py-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-extrabold text-xs sm:text-sm transition-all border border-emerald-200 flex items-center justify-center gap-2 shadow-xs active:scale-95"
            >
              <ListFilter size={16} /> OPSI PESANAN (Makan Sini, Kol, Catatan)
            </button>

            <div className="grid grid-cols-3 gap-2">
              {['Cash', 'BCA', 'QRIS'].map(m => (
                <button
                  key={m}
                  onClick={() => setPaymentMethod(m)}
                  className={`py-2 rounded-xl font-black text-xs sm:text-sm transition-all border-2 ${paymentMethod === m
                      ? 'border-emerald-600 bg-emerald-600 text-white shadow-md'
                      : 'border-gray-100 bg-gray-50 text-gray-600 hover:border-gray-300'
                    }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex justify-between items-end">
              <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Tagihan</span>
              <span className="text-2xl sm:text-3xl font-black text-gray-900">{formatRupiah(totalCartPrice)}</span>
            </div>

            {/* CASH INPUT */}
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${paymentMethod === 'Cash' && totalCartPrice > 0 ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-gray-50 border border-gray-200 p-3 sm:p-4 rounded-2xl space-y-2">
                <div className="flex justify-between items-center gap-3">
                  <span className="text-xs font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">Bayar Uang</span>
                  <div className="relative w-full max-w-[170px]">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs sm:text-sm">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      className={`w-full pl-8 pr-3 py-1.5 sm:py-2 bg-white border-2 rounded-xl font-black text-base sm:text-lg outline-none text-right transition-colors ${isCashInsufficient ? 'border-red-400 focus:border-red-500 text-red-600' : 'border-gray-200 focus:border-emerald-600 text-gray-900'
                        }`}
                      value={amountPaidStr}
                      onChange={e => {
                        const raw = e.target.value.replace(/\D/g, '');
                        setAmountPaidStr(raw ? new Intl.NumberFormat('id-ID').format(raw) : '');
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200/60">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Kembalian</span>
                  {isCashInsufficient ? (
                    <span className="text-xs font-black text-red-500 bg-red-100 px-2 py-0.5 rounded animate-pulse">Uang Kurang!</span>
                  ) : (
                    <span className="text-lg sm:text-xl font-black text-emerald-600">
                      {amountPaidNum > 0 ? formatRupiah(amountPaidNum - totalCartPrice) : 'Rp 0'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => triggerSubmitSale('BELUM_BAYAR')}
                disabled={totalCartPrice === 0 || isSubmitting}
                className="flex-1 py-3 sm:py-4 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-xl font-black text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-50 border border-orange-200 flex flex-col items-center justify-center leading-none"
              >
                <span>Belum Bayar</span>
                <span className="text-[9px] mt-0.5 font-bold opacity-70 uppercase">Parkir Order</span>
              </button>

              <button
                onClick={() => triggerSubmitSale('LUNAS')}
                disabled={totalCartPrice === 0 || isSubmitting || isCashInsufficient}
                className={`flex-[2] py-3 sm:py-4 rounded-xl font-black text-xs sm:text-sm transition-all shadow-lg flex flex-col items-center justify-center leading-none border-b-4 ${isCashInsufficient
                    ? 'bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-800 active:scale-95 shadow-emerald-600/20'
                  }`}
              >
                <span className="text-sm sm:text-base">SIMPAN LUNAS</span>
                {isCashInsufficient && (
                  <span className="text-[9px] mt-0.5 text-red-600 font-bold uppercase tracking-widest bg-white/80 px-2 py-0.5 rounded-full shadow-xs">
                    Uang Masih Kurang
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* RESIZER 2 (Hidden on mobile & tablet) */}
        <div className="hidden lg:block w-1 bg-gray-200 hover:bg-emerald-400 cursor-col-resize z-10" onMouseDown={() => setIsDragging(1)} />

        {/* KOLOM 3: RIWAYAT TRANSAKSI (HANYA MASUK) */}
        <div
          className={`bg-gray-50 h-full flex flex-col relative ${mobileTab !== 'live' ? 'hidden lg:flex' : 'w-full lg:w-auto'
            }`}
          style={{ width: windowWidth >= 1024 ? `${widths[2]}%` : '100%' }}
        >
          <div className="p-3 border-b border-gray-200 bg-white flex justify-between items-center shrink-0">
            <span className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-emerald-600" /> Riwayat
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTappingModalOpen(true)}
                className="relative p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-100 rounded-lg transition-colors flex items-center gap-1 border border-orange-100"
                title="Pesanan Tapping / Belum Bayar"
              >
                <Clock size={14} />
                <span className="text-[11px] font-black hidden sm:inline">Tapping</span>
                {employeeLocalOrders.length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow-xs animate-bounce">
                    {employeeLocalOrders.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 pb-20 no-scrollbar">
            {employeeVisibleData
              .filter(x => x.totalPengeluaran === 0 && !(x.jenisPengeluaran && x.jenisPengeluaran.includes('[LAPORAN SISTEM]')))
              .slice()
              .reverse()
              .map(item => {
                const income = (item.cash || 0) + (item.bca || 0) + (item.gofood || 0);
                const queueLabel = item.jenisPengeluaran ? item.jenisPengeluaran.split(']')[0].replace('[', '') : 'Lunas';
                const rawItemsStr = item.jenisPengeluaran ? item.jenisPengeluaran.split('] ')[1] : '';
                const itemArray = (rawItemsStr || '').split(',').map(i => i.trim()).filter(i => i);
                let options = []; let ordersList = []; let noteStr = ''; let payMethodStr = '';
                itemArray.forEach(str => {
                  if (str.startsWith('**')) options.push(str.replace(/\*/g, '').trim());
                  else if (str.startsWith('++ CATATAN:')) noteStr = str.replace('++ CATATAN:', '').trim();
                  else if (str.startsWith('++ PAY:')) { const pd = str.replace('++ PAY:', '').split('|'); payMethodStr = pd[0]; }
                  else ordersList.push(str);
                });
                if (!payMethodStr) { if (item.cash > 0) payMethodStr = 'CASH'; else if (item.bca > 0) payMethodStr = 'BCA'; else if (item.gofood > 0) payMethodStr = 'QRIS'; }
                let badgeColor = 'bg-gray-100 text-gray-700 border-gray-300';
                if (payMethodStr === 'BCA') badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';
                else if (payMethodStr === 'QRIS') badgeColor = 'bg-purple-50 text-purple-700 border-purple-200';

                return (
                  <div
                    key={item._id}
                    onClick={() => setDetailModal({ isOpen: true, data: item })}
                    className="p-2.5 rounded-xl border bg-white border-gray-200 shadow-xs relative cursor-pointer hover:border-emerald-600 transition-all group flex flex-col gap-1.5"
                  >
                    {/* Header Row: Queue + Time + Actions */}
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-black text-gray-900 text-xs bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                        [{queueLabel}]
                      </span>
                      <div className="flex items-center gap-1 ml-auto">
                        <span className="text-[10px] font-bold text-gray-400">
                          {new Date(item.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {item.printCount > 0 && (
                          <span className="text-[9px] font-bold text-gray-500 bg-gray-50 px-1 rounded border">
                            {item.printCount}x
                          </span>
                        )}
                        {isDeletingId === item._id ? (
                          <Loader2 size={12} className="animate-spin text-red-500" />
                        ) : deleteConfirm === item._id ? (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              setIsDeletingId(item._id);
                              await handleDelete(item._id);
                              setDeleteConfirm(null);
                              setIsDeletingId(null);
                            }}
                            className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded font-black"
                          >
                            Batal?
                          </button>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item._id); }}
                            className="text-gray-300 hover:text-red-500 p-0.5 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Options & Items */}
                    {options.length > 0 && (
                      <div className="flex flex-wrap gap-0.5">
                        {options.map((opt, idx) => (
                          <span key={idx} className="px-1 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase rounded border border-emerald-100">
                            {opt}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-800 font-bold leading-snug line-clamp-2 break-words">
                      {ordersList.join(', ') || 'Penjualan Kasir'}
                    </p>
                    {noteStr && (
                      <p className="text-[10px] font-bold text-orange-600 truncate">
                        📝 {noteStr}
                      </p>
                    )}

                    {/* Footer Row: Pay Method + Price */}
                    <div className="flex justify-between items-center pt-1.5 border-t border-gray-100 mt-0.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${badgeColor}`}>
                        {payMethodStr}
                      </span>
                      <span className="font-black text-xs sm:text-sm text-emerald-600">
                        {formatRupiah(income)}
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
}
