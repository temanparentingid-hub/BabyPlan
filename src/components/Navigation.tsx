import { useState } from "react";
import { 
  LayoutDashboard, 
  Wallet, 
  Heart, 
  CheckSquare, 
  Stethoscope, 
  Baby, 
  Briefcase, 
  Building2, 
  Settings, 
  LogOut, 
  LogIn, 
  Menu, 
  X,
  MoreHorizontal,
  Sparkles,
  Shield
} from "lucide-react";

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: any; // User object from Firebase or null
  onLoginClick: () => void;
  onLogout: () => void;
  isDemo: boolean;
}

export default function Navigation({ 
  currentTab, 
  onTabChange, 
  user, 
  onLoginClick, 
  onLogout,
  isDemo 
}: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  // Check if current user is admin
  const isAdmin = user?.email?.toLowerCase() === "temanparenting.id@gmail.com";

  const menuItems = [
    { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "Master Budget", label: "Master Budget", icon: Wallet },
    { id: "Wishlist Produk", label: "Wishlist Produk", icon: Heart },
    { id: "Trimester Checklist", label: "Trimester Checklist", icon: CheckSquare },
    { id: "Kunjungan Medis", label: "Kunjungan Medis", icon: Stethoscope },
    { id: "Nama Bayi", label: "Inspirasi Nama", icon: Baby },
    { id: "Hospital Bag", label: "Hospital Bag", icon: Briefcase },
    { id: "Rumah Sakit", label: "Bandingkan RS", icon: Building2 },
    { id: "Pengaturan", label: "Pengaturan", icon: Settings },
    ...(isAdmin ? [{ id: "Akses Pengguna", label: "Akses Pengguna", icon: Shield }] : []),
  ];

  // Mobile Bottom Navigation primary items
  const primaryMobileItems = [
    { id: "Dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "Master Budget", label: "Budget", icon: Wallet },
    { id: "Wishlist Produk", label: "Wishlist", icon: Heart },
    { id: "Hospital Bag", label: "Bag", icon: Briefcase },
  ];

  // Mobile More secondary items
  const secondaryMobileItems = [
    { id: "Trimester Checklist", label: "Trimester Checklist", icon: CheckSquare },
    { id: "Kunjungan Medis", label: "Kunjungan Medis", icon: Stethoscope },
    { id: "Nama Bayi", label: "Inspirasi Nama", icon: Baby },
    { id: "Rumah Sakit", label: "Bandingkan RS", icon: Building2 },
    { id: "Pengaturan", label: "Pengaturan & Info", icon: Settings },
    ...(isAdmin ? [{ id: "Akses Pengguna", label: "Akses Pengguna", icon: Shield }] : []),
  ];

  return (
    <>
      {/* --- DESKTOP SIDEBAR --- */}
      <aside 
        id="desktop-sidebar" 
        className="hidden md:flex flex-col w-64 bg-[#FAF9F5] border-r border-[#E8E4FF] h-screen sticky top-0 shrink-0 text-[#2F3A3A]"
      >
        {/* Branding */}
        <div className="p-6 border-b border-[#E8E4FF] bg-[#DDF7EF]/30">
          <div className="flex items-center space-x-2 text-[#14B8B8] font-bold">
            <Sparkles className="w-6 h-6 shrink-0" />
            <div className="flex flex-col">
              <span className="text-base tracking-tight text-[#2F3A3A] font-extrabold leading-tight">Baby Budget Plan</span>
              <span className="text-[10px] text-[#14B8B8] tracking-widest uppercase font-mono">Teman Parenting</span>
            </div>
          </div>
          {isDemo && (
            <div className="mt-3 bg-[#FFF1D6] text-amber-800 text-[10px] font-bold px-2 py-1 rounded-full text-center tracking-wider uppercase border border-amber-200">
              ⚡ Mode Preview (Read Only)
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                id={`sidebar-item-${item.id.replace(/\s+/g, '-')}`}
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all cursor-pointer ${
                  isActive 
                    ? "bg-[#14B8B8] text-white shadow-md shadow-[#14B8B8]/15" 
                    : "text-[#2F3A3A]/80 hover:bg-[#DDF7EF]/50 hover:text-[#14B8B8]"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#2F3A3A]/60"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer / Account Section */}
        <div className="p-4 border-t border-[#E8E4FF] bg-[#FAF9F5]">
          {user ? (
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-3 px-2 py-1">
                <div className="w-8 h-8 rounded-full bg-[#14B8B8]/20 flex items-center justify-center font-bold text-xs text-[#14B8B8] border border-[#14B8B8]/30">
                  {user.email ? user.email.slice(0, 2).toUpperCase() : "M"}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-semibold text-[#2F3A3A] truncate">{user.email}</span>
                  <span className="text-[9px] text-[#14B8B8] tracking-wider font-semibold">Tersambung Cloud</span>
                </div>
              </div>
              <button
                id="sidebar-logout-btn"
                onClick={onLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-2xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun</span>
              </button>
            </div>
          ) : (
            <button
              id="sidebar-login-btn"
              onClick={onLoginClick}
              className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-2xl bg-[#14B8B8] hover:bg-[#14B8B8]/90 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Teman Parenting</span>
            </button>
          )}
        </div>
      </aside>

      {/* --- MOBILE CONTAINER HEADER --- */}
      <header 
        id="mobile-header" 
        className="md:hidden flex items-center justify-between px-4 py-3 bg-[#FAF9F5] border-b border-[#E8E4FF] sticky top-0 z-40 text-[#2F3A3A]"
      >
        <div className="flex items-center space-x-2 text-[#14B8B8]">
          <Sparkles className="w-5 h-5 shrink-0" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-[#2F3A3A] tracking-tight leading-tight">Baby Budget Plan</span>
            <span className="text-[8px] text-[#14B8B8] tracking-widest uppercase font-mono">Teman Parenting</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isDemo && (
            <span className="bg-[#FFF1D6] text-amber-800 text-[8px] font-bold px-2 py-0.5 rounded-full uppercase scale-90 border border-amber-200">
              Preview
            </span>
          )}
          {user ? null : (
            <button
              id="mobile-header-login-btn"
              onClick={onLoginClick}
              className="px-3 py-1.5 rounded-full bg-[#14B8B8] text-white text-[10px] font-black tracking-wide uppercase shadow-sm cursor-pointer"
            >
              Login
            </button>
          )}
        </div>
      </header>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <nav 
        id="mobile-bottom-nav" 
        className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FAF9F5] border-t border-[#E8E4FF] flex justify-around items-center px-2 pb-1 z-40 text-[#2F3A3A]"
      >
        {primaryMobileItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id && !moreMenuOpen;
          return (
            <button
              id={`nav-item-${item.id.replace(/\s+/g, '-')}`}
              key={item.id}
              onClick={() => {
                setMoreMenuOpen(false);
                onTabChange(item.id);
              }}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-all cursor-pointer ${
                isActive ? "text-[#14B8B8] font-bold" : "text-[#2F3A3A]/60 hover:text-[#14B8B8]"
              }`}
            >
              <div className={`p-1 rounded-full transition-all ${isActive ? "bg-[#DDF7EF]" : ""}`}>
                <Icon className="w-5 h-5 shrink-0" />
              </div>
              <span className="mt-0.5 scale-90">{item.label}</span>
            </button>
          );
        })}

        {/* Mobile 'Lainnya' Button */}
        <button
          id="nav-item-more"
          onClick={() => setMoreMenuOpen(!moreMenuOpen)}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] transition-all cursor-pointer ${
            moreMenuOpen ? "text-[#14B8B8] font-bold" : "text-[#2F3A3A]/60 hover:text-[#14B8B8]"
          }`}
        >
          <div className={`p-1 rounded-full transition-all ${moreMenuOpen ? "bg-[#DDF7EF]" : ""}`}>
            <MoreHorizontal className="w-5 h-5 shrink-0" />
          </div>
          <span className="mt-0.5 scale-90">Lainnya</span>
        </button>
      </nav>

      {/* --- MOBILE 'LAINNYA' EXPANDED PANEL --- */}
      {moreMenuOpen && (
        <div 
          id="mobile-more-overlay" 
          className="md:hidden fixed inset-0 z-35 bg-black/30 backdrop-blur-xs flex flex-end justify-center items-end"
          onClick={() => setMoreMenuOpen(false)}
        >
          <div 
            id="mobile-more-panel" 
            className="w-full bg-[#FAF9F5] rounded-t-3xl border-t border-[#E8E4FF] p-6 pb-24 space-y-4 shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center pb-2 border-b border-[#2F3A3A]/5">
              <span className="font-extrabold text-xs text-[#2F3A3A]/50 uppercase tracking-widest font-mono">Fitur Tambahan</span>
              <button 
                id="close-more-btn"
                onClick={() => setMoreMenuOpen(false)}
                className="text-[#2F3A3A]/40 p-1 bg-gray-100 rounded-full font-bold"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {secondaryMobileItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    id={`more-item-${item.id.replace(/\s+/g, '-')}`}
                    key={item.id}
                    onClick={() => {
                      onTabChange(item.id);
                      setMoreMenuOpen(false);
                    }}
                    className={`flex items-center space-x-3 p-3.5 rounded-2xl text-xs font-semibold cursor-pointer transition-all border ${
                      isActive 
                        ? "bg-[#14B8B8] text-white border-[#14B8B8] shadow-sm" 
                        : "bg-white border-[#2F3A3A]/5 text-[#2F3A3A] hover:bg-[#DDF7EF]/40"
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-[#14B8B8]"}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Quote of Teman Parenting to feel warmer */}
            <div className="p-4 bg-[#FFF1D6]/70 border border-[#FFF1D6] rounded-2xl text-[11px] text-[#2F3A3A]/70 italic leading-relaxed text-center">
              “Semua persiapan bisa dilakukan sedikit demi sedikit, Moms & Dads. Nikmati prosesnya bersama-sama ya.”
            </div>
          </div>
        </div>
      )}
    </>
  );
}
