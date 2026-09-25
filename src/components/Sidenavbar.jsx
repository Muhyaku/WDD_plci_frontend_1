import React, { useState } from 'react';
import { Store, Zap, Pencil, CloudUpload, LogOut, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';

export default function Sidenavbar({ currentMode, onSwitchMode, onLogout }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Navigation items: Kasir Normal, Fast Kasir, Edit Product, Sync Cloud, Logout
  const navItems = [
    {
      id: 'kasir_normal',
      aliasIds: ['kasir_normal'],
      label: 'Kasir Normal',
      icon: Store,
    },
    {
      id: 'kasir_fast',
      aliasIds: ['kasir_fast'],
      label: 'Fast Kasir',
      icon: Zap,
    },
    {
      id: 'product_edit',
      aliasIds: ['product_edit'],
      label: 'Edit Product',
      icon: Pencil,
    },
    {
      id: 'sync_cloud',
      aliasIds: ['sync_cloud'],
      label: 'Sync Cloud',
      icon: CloudUpload,
    },
  ];

  return (
    <>
      {/* MOBILE FLOATING TOGGLE BUTTON (Visible only on small screens < md) */}
      <div className="md:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-700/30 active:scale-95 transition-all flex items-center justify-center border border-emerald-500"
          title="Toggle Navigation"
        >
          {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* MOBILE BACKDROP OVERLAY */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 animate-in fade-in duration-200"
        />
      )}

      {/* DESKTOP COLLAPSED FLOATING TRIGGER BUTTON (Positioned at the BOTTOM LEFT when collapsed) */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="hidden md:flex fixed bottom-6 left-4 z-50 items-center justify-center w-11 h-11 rounded-2xl bg-emerald-700 text-white border border-emerald-500 shadow-xl hover:bg-emerald-800 active:scale-90 transition-all duration-300 group"
          title="Tampilkan Navigation Sidebar"
        >
          <ChevronRight size={20} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {/* MAIN SIDENAVBAR CONTAINER */}
      <aside
        className={`
          fixed md:relative top-0 left-0 h-full z-50 select-none
          bg-emerald-700 text-white flex flex-col justify-between py-6 px-2
          shadow-2xl border-r border-emerald-600/40 transition-all duration-300 ease-in-out
          ${/* Mobile Drawer logic */ ''}
          ${isMobileOpen ? 'translate-x-0 w-24' : '-translate-x-full md:translate-x-0'}
          ${/* Desktop Collapsed logic */ ''}
          ${isCollapsed ? 'md:w-0 md:py-0 md:px-0 md:border-none md:overflow-hidden opacity-0 md:opacity-0 pointer-events-none' : 'md:w-20 lg:w-24 md:opacity-100 md:pointer-events-auto'}
        `}
      >
        {/* TOP SECTION: BRAND LOGO & NAV ITEMS */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo Badge */}
          <div className="w-12 h-12 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/25 shadow-inner group hover:scale-105 transition-transform duration-300">
            <div className="w-8 h-8 rounded-xl bg-white text-emerald-700 font-black text-xl flex items-center justify-center shadow-md">
              P
            </div>
          </div>

          {/* Navigation Items (3 main modes) */}
          <nav className="flex flex-col gap-4 mt-2 w-full items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.aliasIds.includes(currentMode);

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSwitchMode(item.id);
                    setIsMobileOpen(false);
                  }}
                  title={item.label}
                  className={`group relative w-13 h-13 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${
                    isActive
                      ? 'bg-white text-emerald-700 shadow-lg shadow-emerald-900/40 scale-105 font-bold'
                      : 'text-emerald-100/75 hover:text-white hover:bg-white/15 active:scale-95'
                  }`}
                >
                  <Icon size={22} className="transition-transform group-hover:scale-110" />
                  <span className="text-[9px] font-extrabold tracking-wider leading-none opacity-90">
                    {item.label === 'Kasir Normal' ? 'Kasir' : item.label === 'Fast Kasir' ? 'Fast' : item.label === 'Edit Product' ? 'Edit' : 'Sync'}
                  </span>

                  {/* Active Left Pill Indicator */}
                  {isActive && (
                    <span className="absolute -left-2.5 w-1.5 h-7 bg-white rounded-r-full shadow-glow" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* BOTTOM SECTION: HIDE/SHOW TOGGLE + LOGOUT BUTTON (Placed at the BOTTOM as requested) */}
        <div className="w-full flex flex-col items-center gap-3 mt-auto pt-4 border-t border-emerald-600/40">
          {/* Hide/Collapse Sidebar Toggle Button (At Bottom) */}
          <button
            onClick={() => setIsCollapsed(true)}
            title="Sembunyikan Sidebar"
            className="group relative w-13 h-10 rounded-xl flex items-center justify-center text-emerald-100/80 hover:text-white hover:bg-white/15 active:scale-95 transition-all duration-200"
          >
            <ChevronLeft size={20} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="sr-only">Hide Sidebar</span>
          </button>

          {/* Logout Button (4th Item) */}
          <button
            onClick={() => {
              setIsMobileOpen(false);
              onLogout();
            }}
            title="Keluar / Logout"
            className="group relative w-13 h-13 rounded-2xl flex flex-col items-center justify-center gap-1 text-emerald-100/75 hover:text-red-200 hover:bg-red-500/30 active:scale-95 transition-all duration-300"
          >
            <LogOut size={20} className="transition-transform group-hover:-translate-x-0.5" />
            <span className="text-[9px] font-extrabold tracking-wider leading-none">Keluar</span>
          </button>
        </div>
      </aside>
    </>
  );
}
