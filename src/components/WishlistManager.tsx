import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { WishlistItem, BudgetItem } from "../types";
import { formatRupiah } from "../pregnancyUtils";
import { 
  Heart, 
  Plus, 
  Search, 
  Filter, 
  ExternalLink, 
  CheckCircle2, 
  Coins, 
  Trash2, 
  Edit2, 
  Layers, 
  ArrowRight,
  Sparkles,
  List,
  Grid,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InstantTooltip from "./InstantTooltip";

interface WishlistManagerProps {
  wishlistItems: WishlistItem[];
  onAddWish: (item: Omit<WishlistItem, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onEditWish: (id: string, item: Partial<WishlistItem>) => void;
  onDeleteWish: (id: string) => void;
  onConvertToBudget: (wish: WishlistItem) => void; // copies item data to budget
  isDemo: boolean;
  onTriggerLogin: () => void;
}

const WISH_CATEGORIES = [
  "Paket Perlengkapan Mandi",
  "Peralatan Makan & Susu",
  "Pakaian & Bedong",
  "Sling & Carrier",
  "Furnitur Kamar",
  "Kesehatan & Skincare",
  "Perlengkapan Ibu",
  "Lain-lain"
];

export default function WishlistManager({
  wishlistItems = [],
  onAddWish,
  onEditWish,
  onDeleteWish,
  onConvertToBudget,
  isDemo,
  onTriggerLogin
}: WishlistManagerProps) {
  
  // Tab states
  const [viewType, setViewType] = useState<"card" | "table">("card");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedPriority, setSelectedPriority] = useState("Semua");

  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [editingWish, setEditingWish] = useState<WishlistItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; nama: string } | null>(null);

  // Form Fields
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState(WISH_CATEGORIES[0]);
  const [brand, setBrand] = useState("");
  const [estimasi, setEstimasi] = useState<number | "">("");
  const [hargaAktual, setHargaAktual] = useState<number | "">("");
  const [jumlah, setJumlah] = useState(1);
  const [link, setLink] = useState("");
  const [status, setStatus] = useState<"Belum Dibeli" | "Sudah Dibeli">("Belum Dibeli");
  const [prioritas, setPrioritas] = useState<"Tinggi" | "Sedang" | "Rendah">("Tinggi");
  const [catatan, setCatatan] = useState("");

  const resetForm = () => {
    setNama("");
    setKategori(WISH_CATEGORIES[0]);
    setBrand("");
    setEstimasi("");
    setHargaAktual("");
    setJumlah(1);
    setLink("");
    setStatus("Belum Dibeli");
    setPrioritas("Tinggi");
    setCatatan("");
    setEditingWish(null);
  };

  const handleOpenAdd = () => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    resetForm();
    setFormOpen(true);
  };

  const handleOpenEdit = (item: WishlistItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setEditingWish(item);
    setNama(item.nama);
    setKategori(item.kategori);
    setBrand(item.brand || "");
    setEstimasi(item.estimasi === 0 ? "" : item.estimasi);
    setHargaAktual(item.hargaAktual === 0 ? "" : item.hargaAktual);
    setJumlah(item.jumlah);
    setLink(item.link || "");
    setStatus(item.status);
    setPrioritas(item.prioritas);
    setCatatan(item.catatan || "");
    setFormOpen(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setItemToDelete({ id, nama: name });
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteWish(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleToggleBought = (item: WishlistItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    const nextStatus = item.status === "Belum Dibeli" ? "Sudah Dibeli" : "Belum Dibeli";
    onEditWish(item.id, { status: nextStatus });
  };

  const handleTransferToBudget = (item: WishlistItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    if (window.confirm(`Salin "${item.nama}" langsung ke rencana anggaran Master Budget Anda?`)) {
      onConvertToBudget(item);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const payload = {
      nama: nama.trim(),
      kategori,
      brand: brand.trim() || undefined,
      estimasi: estimasi === "" ? 0 : Number(estimasi),
      hargaAktual: hargaAktual === "" ? 0 : Number(hargaAktual),
      jumlah: Number(jumlah),
      link: link.trim() || undefined,
      status,
      prioritas,
      catatan: catatan.trim() || undefined
    };

    if (editingWish) {
      onEditWish(editingWish.id, payload);
    } else {
      onAddWish(payload);
    }
    setFormOpen(false);
    resetForm();
  };

  // Filter application
  const filteredWishlist = useMemo(() => {
    return wishlistItems.filter((item) => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        item.nama.toLowerCase().includes(term) ||
        (item.brand && item.brand.toLowerCase().includes(term)) ||
        (item.catatan && item.catatan.toLowerCase().includes(term));

      const matchesCategory = selectedCategory === "Semua" || item.kategori === selectedCategory;
      const matchesStatus = selectedStatus === "Semua" || item.status === selectedStatus;
      const matchesPriority = selectedPriority === "Semua" || item.prioritas === selectedPriority;

      return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
    });
  }, [wishlistItems, searchTerm, selectedCategory, selectedStatus, selectedPriority]);

  // Calculations
  const calculatedSum = useMemo(() => {
    let estimasiTotal = 0;
    let aktualTotal = 0;
    let itemsBoughtCount = 0;

    filteredWishlist.forEach((item) => {
      estimasiTotal += (item.estimasi || 0) * (item.jumlah || 1);
      aktualTotal += (item.hargaAktual || 0) * (item.jumlah || 1);
      if (item.status === "Sudah Dibeli") {
        itemsBoughtCount++;
      }
    });

    return {
      estimasiTotal,
      aktualTotal,
      itemsBoughtCount,
      percentBought: filteredWishlist.length > 0 ? Math.round((itemsBoughtCount / filteredWishlist.length) * 100) : 0
    };
  }, [filteredWishlist]);

  return (
    <div id="wishlist-manager-view" className="space-y-6 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#14B8B8] uppercase tracking-widest font-mono">
            Riset & Kebutuhan Bayi
          </span>
          <h2 className="text-2xl font-black text-[#2F3A3A] tracking-tight">
            Wishlist Produk & Hadiah
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Simpan, kumpulkan, dan bandingkan merek produk bayi sebelum membelinya, lalu masukkan langsung ke anggaran keuangan Anda.
          </p>
        </div>

        <button
          id="btn-add-wish-item"
          onClick={handleOpenAdd}
          className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 max-sm:w-full sm:w-auto text-white text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-md shadow-[#14B8B8]/15 tracking-tight flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 shrink-0 self-stretch sm:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Produk Ke Wishlist</span>
        </button>
      </div>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Total Estimasi Kebutuhan</span>
          <strong className="text-base font-mono font-black text-[#2F3A3A]">
            {formatRupiah(calculatedSum.estimasiTotal)}
          </strong>
          <span className="text-[10px] text-gray-400 block mt-1">Total harga perkiraan seluruh produk</span>
        </div>

        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Estimasi Aktual Dibeli</span>
          <strong className="text-base font-mono font-black text-[#14B8B8]">
            {formatRupiah(calculatedSum.aktualTotal)}
          </strong>
          <span className="text-[10px] text-gray-400 block mt-1">Total harga riil barang yang siap dibeli</span>
        </div>

        <div className="bg-[#DDF7EF] border border-[#14B8B8]/10 rounded-2xl p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest font-mono">Progress Terbeli</span>
            <span className="text-xs font-black text-[#14B8B8]">{calculatedSum.itemsBoughtCount} / {filteredWishlist.length}</span>
          </div>
          <div className="w-full bg-[#FAF9F5] h-2.5 rounded-full overflow-hidden border border-teal-100">
            <div className="bg-[#14B8B8] h-full transition-all duration-700" style={{ width: `${calculatedSum.percentBought}%` }}></div>
          </div>
          <span className="text-[10px] text-teal-800/75 block mt-1.5 font-medium">Bagus Moms! Persentase terbeli {calculatedSum.percentBought}%</span>
        </div>
      </div>

      {/* 3. FILTERS & SEARCH ROW */}
      <div className="bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-3.5 text-[#2F3A3A]/30 w-4 h-4" />
            <input
              id="wishlist-search"
              type="text"
              placeholder="Cari nama produk, merek (brand), atau rincian catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#2F3A3A]/10 rounded-2xl py-3 pl-10 pr-4 text-xs text-[#2F3A3A] placeholder-[#2F3A3A]/40 outline-none focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8]"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
            <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 w-full md:w-auto">
              {/* Category selection */}
              <select
                id="wish-filter-cat"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A] outline-none w-full sm:w-auto font-semibold focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8]"
              >
                <option value="Semua">Semua Kategori</option>
                {WISH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                id="wish-filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A] outline-none w-full sm:w-auto font-semibold focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8]"
              >
                <option value="Semua">Semua Status</option>
                <option value="Belum Dibeli">Belum Dibeli</option>
                <option value="Sudah Dibeli">Sudah Dibeli</option>
              </select>
            </div>

            {/* View Switchers */}
            <div className="flex items-center justify-center bg-white border border-[#2F3A3A]/10 rounded-xl p-1 shrink-0 w-full sm:w-auto">
              <button
                _id="view-grid-btn"
                onClick={() => setViewType("card")}
                className={`flex-1 sm:flex-initial p-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${viewType === "card" ? "bg-[#14B8B8] text-white" : "text-gray-400 hover:bg-slate-50"}`}
                title="Bento Grid"
              >
                <Grid className="w-3.5 h-3.5" />
                <span className="sm:hidden">Grid</span>
              </button>
              <button
                _id="view-table-btn"
                onClick={() => setViewType("table")}
                className={`flex-1 sm:flex-initial p-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 text-xs font-bold ${viewType === "table" ? "bg-[#14B8B8] text-white" : "text-gray-400 hover:bg-slate-50"}`}
                title="Daftar Baris"
              >
                <List className="w-3.5 h-3.5" />
                <span className="sm:hidden">List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CONTENT ZONE */}
      {filteredWishlist.length === 0 ? (
        <div id="wishlist-empty-state" className="bg-white border border-[#E8E4FF] rounded-3xl p-10 text-center space-y-3">
          <Heart className="w-12 h-12 text-[#14B8B8] mx-auto opacity-70" />
          <h3 className="text-sm font-extrabold text-[#2F3A3A]">Wishlist Moms & Dads masih steril.</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            “Cek lagi bersama pasangan supaya persiapannya terasa lebih ringan.” Cari perlengkapan bayi impian Moms & Dads lalu tambahkan ke sini ya.
          </p>
        </div>
      ) : viewType === "card" ? (
        /* GRID VIEW */
        <div id="wishlist-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWishlist.map((item) => (
            <div 
              key={item.id} 
              className={`bg-white border rounded-3xl p-5 shadow-xs relative flex flex-col justify-between transition-transform duration-300 ${
                item.status === "Sudah Dibeli" ? "border-emerald-100 bg-emerald-50/5" : "border-[#E8E4FF] hover:-translate-y-1"
              }`}
            >
              {/* Card top flags */}
              <div className="flex justify-between items-start">
                <span className="text-[10px] bg-[#DDF7EF] text-[#14B8B8] font-bold px-2 py-0.5 rounded-md">
                  {item.kategori}
                </span>

                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  item.prioritas === "Tinggi" ? "bg-red-50 text-red-600 border border-red-100" :
                  item.prioritas === "Sedang" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                  "bg-gray-50 text-gray-500"
                }`}>
                  {item.prioritas}
                </span>
              </div>

              {/* Main Product Info */}
              <div className="my-4 space-y-2">
                <div>
                  <h4 className="font-extrabold text-sm text-[#2F3A3A] leading-tight flex items-center gap-1.5">
                    {item.nama}
                  </h4>
                  {item.brand && <span className="text-[11px] text-gray-400 font-medium">Merek: {item.brand}</span>}
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#FAF9F5] p-2.5 rounded-2xl text-xs border border-gray-100">
                  <div>
                    <span className="text-[9px] text-gray-400 block font-semibold">Estimasi Harga</span>
                    <strong className="font-mono text-[#2F3A3A]">{formatRupiah(item.estimasi)}</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-gray-400 block font-semibold text-right">Harga Riil</span>
                    <strong className="font-mono text-[#14B8B8] block text-right">
                      {item.hargaAktual > 0 ? formatRupiah(item.hargaAktual) : "-"}
                    </strong>
                  </div>
                </div>

                {item.catatan && (
                  <p className="text-[10.5px] text-gray-500 bg-[#FAF9F5] p-2 rounded-xl italic">
                    📝 {item.catatan}
                  </p>
                )}

                {item.link && (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 text-[#14B8B8] text-[10px] font-bold hover:underline"
                  >
                    <span>Buka Tautan Toko</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="border-t border-[#E8E4FF]/40 pt-4 flex items-center justify-between">
                <button
                  onClick={() => handleToggleBought(item)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-[10px] font-bold rounded-xl transition-all cursor-pointer border ${
                    item.status === "Sudah Dibeli"
                      ? "bg-emerald-100 border-emerald-100 text-emerald-800"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-[#DDF7EF] hover:text-[#14B8B8]"
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{item.status === "Sudah Dibeli" ? "Terbeli" : "Belum Dibeli"}</span>
                </button>

                <div className="flex items-center space-x-1">
                  {/* Convert to master budget button */}
                  <InstantTooltip content="Salin Anggaran ke Master" position="top">
                    <button
                      onClick={() => handleTransferToBudget(item)}
                      className="p-1.5 bg-[#FAF9F5] hover:bg-[#DDF7EF] text-gray-600 hover:text-[#14B8B8] rounded-xl border border-gray-100 cursor-pointer"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </InstantTooltip>
                  <InstantTooltip content="Edit Produk" position="top">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 bg-white hover:bg-[#DDF7EF] hover:text-[#14B8B8] border border-gray-100 rounded-xl cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-gray-400 hover:text-[#14B8B8]" />
                    </button>
                  </InstantTooltip>
                  <InstantTooltip content="Hapus Produk" position="top">
                    <button
                      onClick={() => handleDelete(item.id, item.nama)}
                      className="p-1.5 bg-white hover:bg-red-50 text-red-500 border border-gray-100 rounded-xl cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </InstantTooltip>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div id="wishlist-table" className="bg-white border border-[#E8E4FF] rounded-3xl overflow-hidden shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF9F5] border-b border-[#E8E4FF] text-xs font-bold text-[#2F3A3A]/60 font-mono">
                <th className="p-4">Barang</th>
                <th className="p-4">Kategori / Brand</th>
                <th className="p-4">Prioritas</th>
                <th className="p-4 text-center">Jumlah</th>
                <th className="p-4 text-right">Estimasi</th>
                <th className="p-4 text-right">Aktual</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4FF]/40 text-xs">
              {filteredWishlist.map((item) => (
                <tr key={item.id} className="hover:bg-[#FAF9F5]/40 transition-colors">
                  <td className="p-4">
                    <strong className="text-sm text-[#2F3A3A] font-bold">{item.nama}</strong>
                    {item.catatan && <p className="text-[10px] text-gray-400 mt-0.5 max-w-xs">{item.catatan}</p>}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-gray-600">{item.kategori}</div>
                    {item.brand && <span className="text-[10px] text-gray-400 block">Merek: {item.brand}</span>}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      item.prioritas === "Tinggi" ? "bg-red-50 text-red-600 border border-red-100" :
                      item.prioritas === "Sedang" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      {item.prioritas}
                    </span>
                  </td>
                  <td className="p-4 text-center font-mono font-medium">{item.jumlah} pcs</td>
                  <td className="p-4 text-right font-mono font-semibold">{formatRupiah(item.estimasi)}</td>
                  <td className="p-4 text-right font-mono font-semibold text-[#14B8B8]">
                    {item.hargaAktual > 0 ? formatRupiah(item.hargaAktual) : "-"}
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleToggleBought(item)}
                      className={`px-3 py-1 text-[10px] font-black rounded-lg ${
                        item.status === "Sudah Dibeli" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-gray-500"
                      }`}
                    >
                      {item.status}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center space-x-1.5">
                      <InstantTooltip content="Salin Anggaran ke Master" position="top">
                        <button
                          onClick={() => handleTransferToBudget(item)}
                          className="p-1.5 hover:bg-teal-50 text-[#14B8B8] rounded-xl cursor-pointer"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </InstantTooltip>
                      <InstantTooltip content="Edit Produk" position="top">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 hover:bg-slate-100 text-gray-400 hover:text-[#14B8B8] rounded-xl cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </InstantTooltip>
                      <InstantTooltip content="Hapus Produk" position="top">
                        <button
                          onClick={() => handleDelete(item.id, item.nama)}
                          className="p-1.5 hover:bg-red-50 text-red-600 rounded-xl cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </InstantTooltip>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. ADD / EDIT WISHLIST DIALOG */}
      {createPortal(
        <AnimatePresence>
          {formOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              {/* Backdrop with custom theme blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setFormOpen(false)}
                className="fixed inset-0 bg-[#2F3A3A]/60 backdrop-blur-md"
              />

              {/* Modal Card content */}
              <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              id="wish-modal-card"
              className="w-full max-w-lg bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-6 shadow-2xl relative overflow-hidden my-auto max-h-[90vh] flex flex-col z-10"
            >
              <div className="flex justify-between items-start shrink-0 mb-4 pb-3 border-b border-[#E8E4FF]/40">
                <div className="flex items-center space-x-2 text-[#14B8B8]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <h3 className="text-lg font-black text-[#2F3A3A] tracking-tight">
                    {editingWish ? "Edit Detail Produk Wishlist" : "Kumpulkan Produk Baru ke Wishlist"}
                  </h3>
                </div>
                <button 
                  id="close-wishlist-modal-btn"
                  onClick={() => setFormOpen(false)}
                  className="text-[#2F3A3A]/40 hover:text-[#2F3A3A] hover:bg-gray-100 p-2 rounded-full border border-gray-100 transition-colors cursor-pointer bg-white"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form id="wishlist-form" onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="wish-form-nama" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Nama Barang / Produk <span className="text-[#14B8B8]">*</span>
                    </label>
                    <input
                      id="wish-form-nama"
                      type="text"
                      required
                      placeholder="e.g. Sterilizer Botol UV"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="wish-form-brand" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Brand / Merek <span className="text-gray-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      id="wish-form-brand"
                      type="text"
                      placeholder="e.g. Upang / BabySafe"
                      value={brand}
                      onChange={(e) => setBrand(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-sans"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="wish-form-cat" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Kategori Perlengkapan
                    </label>
                    <select
                      id="wish-form-cat"
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-sans"
                    >
                      {WISH_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="wish-form-jumlah" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Jumlah Estimasi (Pcs)
                    </label>
                    <input
                      id="wish-form-jumlah"
                      type="number"
                      required
                      min={1}
                      value={jumlah}
                      onChange={(e) => setJumlah(Number(e.target.value))}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="wish-form-est" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Estimasi Harga Satuan (Rp)
                    </label>
                    <input
                      id="wish-form-est"
                      type="number"
                      required
                      placeholder="e.g. 1500000"
                      value={estimasi}
                      onChange={(e) => setEstimasi(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="wish-form-act" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Harga Aktual Satuan (Rp)
                    </label>
                    <input
                      id="wish-form-act"
                      type="number"
                      placeholder="e.g. 1450000 (0 jika kado atau ditiadakan)"
                      value={hargaAktual}
                      onChange={(e) => setHargaAktual(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="wish-form-link" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Link/Tautan Toko Online
                    </label>
                    <input
                      id="wish-form-link"
                      type="url"
                      placeholder="e.g. https://shopee.co.id/product..."
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="wish-form-status" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Status
                    </label>
                    <select
                      id="wish-form-status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-sans"
                    >
                      <option value="Belum Dibeli">Belum Dibeli</option>
                      <option value="Sudah Dibeli">Sudah Dibeli</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="wish-form-pri" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Prioritas Kebutuhan
                    </label>
                    <select
                      id="wish-form-pri"
                      value={prioritas}
                      onChange={(e) => setPrioritas(e.target.value as any)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-sans"
                    >
                      <option value="Tinggi">Tinggi (Mendesak)</option>
                      <option value="Sedang">Sedang</option>
                      <option value="Rendah">Rendah (Opsional)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="wish-form-catatan" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Catatan Keterangan
                  </label>
                  <input
                    id="wish-form-catatan"
                    type="text"
                    placeholder="e.g. Merk recommended Dr. Tiwi, atau kado Tante..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-sans"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4 bg-[#FAF9F5] border-t border-[#E8E4FF]/40 shrink-0">
                  <button
                    id="cancel-wish-form"
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="border border-[#2F3A3A]/10 text-[#2F3A3A]/70 font-bold rounded-2xl py-2.5 px-6 text-xs hover:bg-gray-100 transition-all cursor-pointer font-sans"
                  >
                    Urungkan
                  </button>
                  <button
                    id="submit-wish-form"
                    type="submit"
                    className="bg-[#14B8B8] hover:bg-[#0E9090] text-white font-black rounded-2xl py-2.5 px-8 text-xs shadow-md shadow-[#14B8B8]/15 hover:shadow-lg transition-all cursor-pointer font-sans"
                  >
                    {editingWish ? "Simpan Perubahan" : "Masukkan ke Wishlist"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 6. CUSTOM CONFIRMATION DIALOG FOR DELETE (IFRAME SAFE PORTAL) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {itemToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setItemToDelete(null)}
                className="fixed inset-0 bg-[#2F3A3A]/60 backdrop-blur-xs"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="w-full max-w-sm bg-white border border-[#E8E4FF] rounded-3xl p-6 shadow-2xl relative z-10 text-center space-y-4 font-sans"
              >
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-extrabold text-[#2F3A3A]">Hapus Produk Wishlist?</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Moms & Dads, apakah yakin ingin menghapus <strong className="text-red-600">"{itemToDelete.nama}"</strong> dari daftar Riset & Kebutuhan Wishlist Anda?
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => setItemToDelete(null)}
                    type="button"
                    className="flex-1 border border-gray-200 text-gray-500 hover:bg-gray-50 font-bold rounded-2xl py-2.5 text-xs transition-colors cursor-pointer"
                  >
                    Urungkan
                  </button>
                  <button
                    onClick={confirmDelete}
                    type="button"
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black rounded-2xl py-2.5 text-xs shadow-md shadow-red-500/15 transition-colors cursor-pointer"
                  >
                    Ya, Hapus
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

    </div>
  );
}
