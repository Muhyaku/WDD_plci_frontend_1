// =============================================================================
// SHARED CONSTANTS — Single Source of Truth
// Digunakan oleh App.jsx (router), NormalCashierView, FastCashierView, ProductEditView
// =============================================================================

// --- API ENDPOINTS ---
export const API_URL = "https://wddplcibackend.vercel.app/api/transactions";
export const SETTINGS_URL = "https://wddplcibackend.vercel.app/api/settings";
export const ACTIVITY_URL = "https://wddplcibackend.vercel.app/api/activities";
export const MENU_MASTER_URL = "https://wddplcibackend.vercel.app/api/menu";
export const EMERGENCY_URL = "https://wddplcibackend.vercel.app/api/emergency";

// --- BRANCH & MODE CONFIG ---
// HANYA TERDAPAT 1 KEY PIN INTI: 1010 (Kasir Penjualan Normal)
export const BRANCH_CONFIG = {
  '1010': {
    id: 'plci1',
    name: 'Pecel Lele Cabe Ijo - Kantin SMB',
    brand: 'pecel',
    sheetName: 'PLCI Kantin SMB',
    bg: 'bg-green-50',
    color: 'text-green-600',
    mode: 'kasir_normal',
  },
};

// --- STOCK BYPASS IDs ---
// Item-item ini tidak pernah dicek stoknya (tidak boleh habis/abu-abu)
export const STOCK_BYPASS_IDS = ['nasi', 'usus', 'sambal'];

// --- NASI PUTIH VARIANT OPTIONS (Single Source of Truth) ---
export const NASI_OPTIONS = [
  { label: 'Full Porsi', price: 5000 },
  { label: '1/2 Porsi', price: 3000 },
];

// --- MENU LIST: PECEL LELE CABE IJO ---
export const MENU_PLCI = [
  { id: 'lele', name: 'Lele Goreng', price: 15000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
  { id: 'ayam', name: 'Ayam Goreng', price: 17000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'], image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=400&q=80' },
  { id: 'tahu', name: 'Tahu', price: 3000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  { id: 'tempe', name: 'Tempe', price: 3000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1584278860047-22db9f055492?auto=format&fit=crop&w=400&q=80' },
  { id: 'ati', name: 'Ati Ampela', price: 6000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=400&q=80' },
  { id: 'usus', name: 'Sate Usus', price: 3000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=400&q=80' },
  { id: 'nasi', name: 'Nasi Putih', price: 5000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?auto=format&fit=crop&w=400&q=80' },
  { id: 'sambal', name: 'Extra Sambal', price: 2000, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80' },
  { id: 'paket-lele', name: 'Paket Nasi Lele', price: 18000, category: 'Paketan', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200', image: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=400&q=80' },
  { id: 'paket-ayam', name: 'Paket Nasi Ayam', price: 23000, category: 'Paketan', bg: 'bg-blue-50 hover:bg-blue-100 border-blue-200', hasVariants: ['Paha', 'Dada'], image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80' },
];

// --- MENU LIST: MUTIARA MINANG ---
export const MENU_MM = [
  // Satuan
  { id: 'rendang', name: 'Rendang', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'dendeng', name: 'Dendeng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'kikil', name: 'Kikil', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  { id: 'ayambakar', name: 'Ayam Bakar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'], image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80' },
  { id: 'ayamgoreng', name: 'Ayam Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'], image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=400&q=80' },
  { id: 'ayamgulai', name: 'Ayam Gulai', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', hasVariants: ['Paha', 'Dada'], image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80' },
  { id: 'ikanbawal-bakar', name: 'Ikan Bawal Bakar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
  { id: 'ikansalam-bakar', name: 'Ikan Salam Bakar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
  { id: 'ikansalam-goreng', name: 'Ikan Salam Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
  { id: 'ikantongkol-goreng', name: 'Ikan Tongkol Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
  { id: 'ikantongkol-gulaikuning', name: 'Ikan Tongkol Gulai Kuning', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80' },
  { id: 'ikantongkol-asampedas', name: 'Ikan Tongkol Asam Pedas', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80' },
  { id: 'lele-goreng', name: 'Lele Goreng', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
  { id: 'telur-dadar', name: 'Telur Dadar', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80' },
  { id: 'telur-balado', name: 'Telur Balado', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80' },
  { id: 'ati-ampela', name: 'Ati Ampela', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=400&q=80' },
  { id: 'perkedel', name: 'Perkedel', price: 0, category: 'Satuan', bg: 'bg-white hover:bg-gray-50 border-gray-200', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  // Paketan
  { id: 'pkt-rendang', name: 'Nasi Rames + Rendang', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-dendeng', name: 'Nasi Rames + Dendeng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-kikil', name: 'Nasi Rames + Kikil', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ayambakar', name: 'Nasi Rames + Ayam Bakar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', hasVariants: ['Paha', 'Dada'], image: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ayamgoreng', name: 'Nasi Rames + Ayam Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', hasVariants: ['Paha', 'Dada'], image: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ayamgulai', name: 'Nasi Rames + Ayam Gulai', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', hasVariants: ['Paha', 'Dada'], image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ikanbawal-bakar', name: 'Nasi Rames + Ikan Bawal Bakar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ikansalam-bakar', name: 'Nasi Rames + Ikan Salam Bakar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ikansalam-goreng', name: 'Nasi Rames + Ikan Salam Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ikantongkol-goreng', name: 'Nasi Rames + Ikan Tongkol Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ikantongkol-gulaikuning', name: 'Nasi Rames + Ikan Tongkol Gulai Kuning', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ikantongkol-asampedas', name: 'Nasi Rames + Ikan Tongkol Asam Pedas', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-lele-goreng', name: 'Nasi Rames + Lele Goreng', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-telur-dadar', name: 'Nasi Rames + Telur Dadar', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-telur-balado', name: 'Nasi Rames + Telur Balado', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-ati-ampela', name: 'Nasi Rames + Ati Ampela', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?auto=format&fit=crop&w=400&q=80' },
  { id: 'pkt-perkedel', name: 'Nasi Rames + Perkedel', price: 0, category: 'Paketan', bg: 'bg-red-50 hover:bg-red-100 border-red-200', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80' },
  // Minuman
  { id: 'esteh', name: 'Es Teh', price: 4000, category: 'Lainnya', bg: 'bg-green-50 hover:bg-green-100 border-green-200', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=400&q=80' },
  { id: 'esjeruk', name: 'Es Jeruk', price: 6000, category: 'Lainnya', bg: 'bg-green-50 hover:bg-green-100 border-green-200', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=400&q=80' },
];
