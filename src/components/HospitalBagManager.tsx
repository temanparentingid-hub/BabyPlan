import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { HospitalBagItem } from "../types";
import { 
  Briefcase, 
  Plus, 
  Trash2, 
  CheckSquare, 
  Square, 
  ChevronRight, 
  Baby, 
  Heart, 
  User, 
  FileText,
  Sparkles,
  AlertTriangle,
  Pencil,
  X
} from "lucide-react";
import InstantTooltip from "./InstantTooltip";

interface HospitalBagManagerProps {
  hospitalBagItems: HospitalBagItem[];
  onToggleBagStatus: (id: string) => void;
  onAddBagItem: (item: Omit<HospitalBagItem, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onEditBagItem?: (id: string, fields: Partial<HospitalBagItem>) => void;
  onDeleteBagItem: (id: string) => void;
  isDemo: boolean;
  onTriggerLogin: () => void;
}

const CATEGORIES = [
  "Perlengkapan Bayi",
  "Perlengkapan Ibu",
  "Perlengkapan Ayah",
  "Dokumen Penting"
];

// Preloaded recommended bag list based on specifications
const RECOMMENDATION_DATA = [
  // 1. Kategori Bayi
  { barang: "Baju newborn", kategori: "Perlengkapan Bayi", jumlah: 3, satuan: "pcs" as const, catatan: "Katun lembut" },
  { barang: "Bedong", kategori: "Perlengkapan Bayi", jumlah: 2, satuan: "pcs" as const, catatan: "Bahan adem" },
  { barang: "Popok newborn", kategori: "Perlengkapan Bayi", jumlah: 1, satuan: "pack" as const, catatan: "Ukuran NB" },
  { barang: "Topi bayi", kategori: "Perlengkapan Bayi", jumlah: 1, satuan: "pcs" as const, catatan: "Untuk pulang RS" },
  { barang: "Selimut bayi", kategori: "Perlengkapan Bayi", jumlah: 1, satuan: "pcs" as const, catatan: "Untuk perjalanan pulang" },
  { barang: "Tisu basah bayi", kategori: "Perlengkapan Bayi", jumlah: 1, satuan: "pack" as const, catatan: "Pilih non parfum" },

  // 2. Kategori Ibu
  { barang: "Baju ganti", kategori: "Perlengkapan Ibu", jumlah: 2, satuan: "pcs" as const, catatan: "Nyaman dipakai" },
  { barang: "Pembalut nifas", kategori: "Perlengkapan Ibu", jumlah: 1, satuan: "pack" as const, catatan: "Cadangan cukup" },
  { barang: "Bra menyusui", kategori: "Perlengkapan Ibu", jumlah: 2, satuan: "pcs" as const, catatan: "Perlu beli lagi" },
  { barang: "Perlengkapan mandi", kategori: "Perlengkapan Ibu", jumlah: 1, satuan: "pcs" as const, catatan: "Travel size" },

  // 3. Kategori Ayah
  { barang: "Charger", kategori: "Perlengkapan Ayah", jumlah: 1, satuan: "pcs" as const, catatan: "Untuk HP utama" },
  { barang: "Uang tunai / kartu", kategori: "Perlengkapan Ayah", jumlah: 1, satuan: "pcs" as const, catatan: "Untuk administrasi" },
  { barang: "Baju ganti", kategori: "Perlengkapan Ayah", jumlah: 1, satuan: "pcs" as const, catatan: "Jika ikut menginap" },
  { barang: "Snack / minum", kategori: "Perlengkapan Ayah", jumlah: 1, satuan: "pcs" as const, catatan: "Beli dekat hari H" },
  { barang: "Power bank", kategori: "Perlengkapan Ayah", jumlah: 1, satuan: "pcs" as const, catatan: "Cadangan baterai" },

  // 4. Kategori Dokumen
  { barang: "KTP ibu", kategori: "Dokumen Penting", jumlah: 1, satuan: "pcs" as const, catatan: "Simpan di map" },
  { barang: "KTP ayah", kategori: "Dokumen Penting", jumlah: 1, satuan: "pcs" as const, catatan: "Jika diminta administrasi" },
  { barang: "Kartu BPJS / asuransi", kategori: "Dokumen Penting", jumlah: 1, satuan: "pcs" as const, catatan: "Cek masa aktif" },
  { barang: "Buku KIA", kategori: "Dokumen Penting", jumlah: 1, satuan: "pcs" as const, catatan: "Wajib dibawa" },
  { barang: "Hasil USG / lab terakhir", kategori: "Dokumen Penting", jumlah: 1, satuan: "pcs" as const, catatan: "Gabungkan dokumen" },
  { barang: "Surat rujukan", kategori: "Dokumen Penting", jumlah: 1, satuan: "pcs" as const, catatan: "Jika diperlukan" },
];

export default function HospitalBagManager({
  hospitalBagItems = [],
  onToggleBagStatus,
  onAddBagItem,
  onEditBagItem,
  onDeleteBagItem,
  isDemo,
  onTriggerLogin
}: HospitalBagManagerProps) {
  
  // Category filter state
  const [activeCategory, setActiveCategory] = useState<string>("Semua");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<HospitalBagItem | null>(null);

  // Form field states
  const [barangInput, setBarangInput] = useState("");
  const [kategoriInput, setKategoriInput] = useState(CATEGORIES[0]);
  const [jumlahInput, setJumlahInput] = useState<number | "">("");
  const [satuanInput, setSatuanInput] = useState<"pcs" | "pack">("pcs");
  const [catatanInput, setCatatanInput] = useState("");

  // Notification status
  const [notification, setNotification] = useState<{ message: string; type: "success" | "info" } | null>(null);

  // Auto-dismiss notification toast
  React.useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Delete caution state
  const [itemToDelete, setItemToDelete] = useState<HospitalBagItem | null>(null);

  // Stats
  const stats = useMemo(() => {
    const total = hospitalBagItems.length;
    const completed = hospitalBagItems.filter(i => i.status === "Siap").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Group percentages
    const groupItems: Record<string, { total: number; comp: number }> = {};
    CATEGORIES.forEach(c => {
      groupItems[c] = { total: 0, comp: 0 };
    });

    hospitalBagItems.forEach(i => {
      if (groupItems[i.kategori]) {
        groupItems[i.kategori].total++;
        if (i.status === "Siap") groupItems[i.kategori].comp++;
      }
    });

    return { total, completed, percent, groupItems };
  }, [hospitalBagItems]);

  const handleToggle = (id: string) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    onToggleBagStatus(id);
  };

  const handleDeleteTrigger = (item: HospitalBagItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setItemToDelete(item);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteBagItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  // Convert preloads if list is totally empty
  const handlePreloadDefaults = () => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    let addedCount = 0;
    RECOMMENDATION_DATA.forEach(item => {
      const exists = hospitalBagItems.some(
        ex => ex.barang.toLowerCase().trim() === item.barang.toLowerCase().trim() &&
              ex.kategori === item.kategori
      );
      if (!exists) {
        onAddBagItem({
          barang: item.barang,
          kategori: item.kategori,
          jumlah: item.jumlah,
          satuan: item.satuan,
          catatan: item.catatan,
          status: "Belum Siap",
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setNotification({
        message: `Daftar rekomendasi berhasil ditambahkan (${addedCount} barang baru).`,
        type: "success"
      });
    } else {
      setNotification({
        message: "Semua barang rekomendasi sudah ada di dalam daftar Anda.",
        type: "info"
      });
    }
  };

  // Click recommend for single category helper
  const loadRecommendationCategory = (category: string | "Semua") => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    const toAdd = RECOMMENDATION_DATA.filter(item => {
      if (category === "Semua") return true;
      return item.kategori === category;
    });

    let addedCount = 0;
    toAdd.forEach(item => {
      const exists = hospitalBagItems.some(
        ex => ex.barang.toLowerCase().trim() === item.barang.toLowerCase().trim() &&
              ex.kategori === item.kategori
      );
      if (!exists) {
        onAddBagItem({
          barang: item.barang,
          kategori: item.kategori,
          jumlah: item.jumlah,
          satuan: item.satuan,
          catatan: item.catatan,
          status: "Belum Siap",
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      const categoryLabel = category === "Semua" ? "semua kategori" : category;
      setNotification({
        message: `Daftar rekomendasi ${categoryLabel} berhasil ditambahkan (${addedCount} barang baru).`,
        type: "success"
      });
    } else {
      const categoryLabel = category === "Semua" ? "semua kategori" : category;
      setNotification({
        message: `Semua barang rekomendasi untuk ${categoryLabel} sudah ada di dalam daftar Anda.`,
        type: "info"
      });
    }
  };

  // Modal Open For Add Mode
  const handleOpenAdd = () => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setEditingItem(null);
    setBarangInput("");
    setKategoriInput(CATEGORIES[0]);
    setJumlahInput("");
    setSatuanInput("pcs");
    setCatatanInput("");
    setIsModalOpen(true);
  };

  // Modal Open For Edit Mode
  const handleOpenEdit = (item: HospitalBagItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setEditingItem(item);
    setBarangInput(item.barang);
    setKategoriInput(item.kategori);
    setJumlahInput(item.jumlah !== undefined && item.jumlah !== null ? item.jumlah : "");
    setSatuanInput(item.satuan || "pcs");
    setCatatanInput(item.catatan || "");
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barangInput.trim()) return;

    const cleanedJumlah = jumlahInput === "" ? 1 : Number(jumlahInput);

    if (editingItem) {
      // Editing Mode
      onEditBagItem?.(editingItem.id, {
        barang: barangInput.trim(),
        kategori: kategoriInput,
        jumlah: cleanedJumlah,
        satuan: satuanInput,
        catatan: catatanInput.trim(),
      });
    } else {
      // Adding Mode
      onAddBagItem({
        barang: barangInput.trim(),
        kategori: kategoriInput,
        jumlah: cleanedJumlah,
        satuan: satuanInput,
        catatan: catatanInput.trim(),
        status: "Belum Siap"
      });
    }

    setIsModalOpen(false);
  };

  // Filter application
  const filteredBagItems = useMemo(() => {
    return hospitalBagItems.filter(i => {
      return activeCategory === "Semua" || i.kategori === activeCategory;
    });
  }, [hospitalBagItems, activeCategory]);

  return (
    <div id="hospital-bag-view" className="space-y-6 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in">
      
      {/* 1. COMPARTMENT HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#14B8B8] uppercase tracking-widest font-mono">
            Kesiapan Bersalin
          </span>
          <h2 className="text-2xl font-black text-[#2F3A3A] tracking-tight">
            Hospital Bag Checklist 🎒
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Persiapkan tas ke rumah sakit bersalin sejak memasuki bulan ke-7 atau ke-8 (Trimester 3) untuk menghindari kepanikan saat kontraksi mulai terasa.
          </p>
        </div>

        <button
          id="add-bag-item-btn"
          onClick={handleOpenAdd}
          className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 max-sm:w-full sm:w-auto text-white text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-md shadow-[#14B8B8]/15 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 self-stretch sm:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Bawaan</span>
        </button>
      </div>

      {/* 2. COMPARTMENTS PROGRESS BOXES */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Global summary */}
        <div className="bg-white border border-[#E8E4FF] rounded-3xl p-5 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 block tracking-widest font-mono mb-2">PROGRESS TOTAL TAS</span>
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <strong className="text-3xl font-black text-[#14B8B8] font-mono">{stats.percent}%</strong>
              <span className="text-xs text-gray-400 font-bold">{stats.completed} / {stats.total} Tas Masuk</span>
            </div>
            <div className="w-full bg-[#FAF9F5] h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#14B8B8] h-full" style={{ width: `${stats.percent}%` }}></div>
            </div>
          </div>
        </div>

        {/* Compartment 1: Bayi */}
        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-sm flex items-start space-x-3">
          <div className="p-2 sm:p-3 bg-[#DDF7EF] text-[#14B8B8] rounded-xl shrink-0">
            <Baby className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold block">Perlengkapan Bayi</span>
            <strong className="text-sm text-[#2F3A3A] font-extrabold">
              {stats.groupItems["Perlengkapan Bayi"]?.comp || 0} / {stats.groupItems["Perlengkapan Bayi"]?.total || 0} Siap
            </strong>
            <span className="text-[10px] text-gray-400 block mt-1">Baju, bedong, selimut kepala</span>
          </div>
        </div>

        {/* Compartment 2: Ibu */}
        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-sm flex items-start space-x-3">
          <div className="p-2 sm:p-3 bg-pink-50 text-pink-500 rounded-xl shrink-0">
            <Heart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold block">Perlengkapan Ibu</span>
            <strong className="text-sm text-[#2F3A3A] font-extrabold">
              {stats.groupItems["Perlengkapan Ibu"]?.comp || 0} / {stats.groupItems["Perlengkapan Ibu"]?.total || 0} Siap
            </strong>
            <span className="text-[10px] text-gray-400 block mt-1">Daster busui, gurita, pembalut</span>
          </div>
        </div>

        {/* Compartment 3: Pendamping & Dokumen */}
        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-sm flex items-start space-x-3">
          <div className="p-2 sm:p-3 bg-[#FFF1D6] text-amber-600 rounded-xl shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-gray-400 font-bold block">Dokumen & Ayah</span>
            <strong className="text-sm text-[#2F3A3A] font-extrabold">
              {((stats.groupItems["Dokumen Penting"]?.comp || 0) + (stats.groupItems["Perlengkapan Ayah"]?.comp || 0))} / {((stats.groupItems["Dokumen Penting"]?.total || 0) + (stats.groupItems["Perlengkapan Ayah"]?.total || 0))} Siap
            </strong>
            <span className="text-[10px] text-gray-400 block mt-1">KTP, KK, charger HP Dads</span>
          </div>
        </div>
      </div>

      {/* 4. COMPARTMENT TABS SELECTOR */}
      <div className="flex space-x-1.5 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveCategory("Semua")}
          className={`px-4 py-2 text-xs font-bold rounded-full cursor-pointer border shrink-0 transition-all ${
            activeCategory === "Semua"
              ? "bg-[#14B8B8] text-white border-[#14B8B8] shadow-sm"
              : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
          }`}
        >
          Semua Bagian ({hospitalBagItems.length} barang)
        </button>

        {CATEGORIES.map(categoryName => {
          const count = hospitalBagItems.filter(i => i.kategori === categoryName).length;
          return (
            <button
              key={categoryName}
              onClick={() => setActiveCategory(categoryName)}
              className={`px-4 py-2 text-xs font-bold rounded-full cursor-pointer border shrink-0 transition-all ${
                activeCategory === categoryName
                  ? "bg-[#14B8B8] text-white border-[#14B8B8] shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}
            >
              {categoryName} ({count})
            </button>
          );
        })}
      </div>

      {/* 5. ITEM CARDS LISTINGS */}
      {filteredBagItems.length === 0 ? (
        <div className="bg-white border border-[#E8E4FF] rounded-3xl p-10 text-center space-y-4 max-w-lg mx-auto">
          <Briefcase className="w-12 h-12 text-[#14B8B8] mx-auto opacity-70 animate-bounce" />
          <h4 className="text-sm font-extrabold text-[#2F3A3A]">Bagian Tas ini masih bersih kosong.</h4>
          <p className="text-xs text-gray-400 leading-relaxed">
            {hospitalBagItems.length === 0 
              ? "Moms & Dads belum memasukkan daftar ganti pakaian atau berkas. Ketuk tombol di bawah untuk instan mengisi barang bawaan dasar persalinan!"
              : "Belum ada barang bawaan yang ditambahkan untuk kategori ini."}
          </p>
          {hospitalBagItems.length === 0 && (
            <div className="pt-2">
              <button
                id="preload-bag-btn-empty"
                onClick={handlePreloadDefaults}
                className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-md shadow-amber-500/15 hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
              >
                📋 Muat Daftar Rekomendasi Standar
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBagItems.map((item) => {
            const isPacked = item.status === "Siap";
            return (
              <div 
                key={item.id} 
                className={`bg-white border rounded-2xl p-4 shadow-xs flex items-center justify-between transition-all ${
                  isPacked 
                    ? "border-emerald-100 bg-emerald-50/5 text-gray-400" 
                    : "border-[#E8E4FF] hover:border-teal-100"
                }`}
              >
                <div className="flex items-start space-x-3.5 pr-4">
                  {/* Tick packing button */}
                  <InstantTooltip content={isPacked ? "Tandai Belum Siap" : "Tandai Sudah Siap"} position="right">
                    <button
                      onClick={() => handleToggle(item.id)}
                      className="p-1 rounded-lg shrink-0 mt-0.5 cursor-pointer"
                      id={`pack-${item.id}`}
                    >
                      {isPacked ? (
                        <CheckSquare className="w-5 h-5 text-[#14B8B8]" />
                      ) : (
                        <Square className="w-5 h-5 text-gray-200" />
                      )}
                    </button>
                  </InstantTooltip>

                  <div className="space-y-0.5">
                    <span className={`text-xs font-bold leading-relaxed block ${isPacked ? "line-through text-gray-400" : "text-[#2F3A3A]"}`}>
                      {item.barang}
                    </span>
                    {item.catatan && (
                      <span className={`text-[10px] block opacity-85 mt-0.5 italic text-gray-400 ${isPacked ? "line-through" : ""}`}>
                        💡 {item.catatan}
                      </span>
                    )}
                    <div className="flex items-center space-x-2 text-[10px] pt-1">
                      <span className="bg-[#FAF9F5] border border-gray-100 text-gray-400 font-bold px-1.5 py-0.2 rounded font-mono">
                        Jumlah: {item.jumlah || 1} {item.satuan || "pcs"}
                      </span>
                      <span className="text-[#14B8B8] font-semibold">{item.kategori}</span>
                    </div>
                  </div>
                </div>

                {/* Actions: Edit & Delete */}
                <div className="flex items-center space-x-1 shrink-0">
                  <InstantTooltip content="Edit Bawaan" position="top">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="text-gray-400 hover:text-[#14B8B8] transition-colors p-1 bg-gray-50 hover:bg-teal-50 border border-transparent hover:border-teal-200/50 rounded-lg cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </InstantTooltip>

                  <InstantTooltip content="Hapus Bawaan" position="top">
                    <button
                      onClick={() => handleDeleteTrigger(item)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-gray-50 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </InstantTooltip>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. WARNING CRADLE */}
      <div className="bg-[#FFF1D6]/70 border border-[#FFF1D6] rounded-3xl p-5 text-center max-w-2xl mx-auto text-xs text-[#2F3A3A] italic leading-relaxed space-y-1">
        <span className="font-bold text-[#2F3A3A]/90 block">“Persiapan hospital bag sering dilakukan terlalu dekat dengan waktu persalinan, Moms & Dads.”</span>
        <span>Ayo kemas barang bawaan lebih dini biar Moms merasa tenang dan siap menyambut tibanya Si Kecil. Cek kembali kelengkapan KK dan Buku KIA ya!</span>
      </div>

      {/* 7. ADD & EDIT ITEM MODAL */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity" 
                onClick={() => setIsModalOpen(false)}
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="relative bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl z-10 border border-[#E8E4FF] font-sans text-left space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-teal-50 text-[#14B8B8] rounded-xl">
                      <Briefcase className="w-4 h-4 shrink-0 text-[#14B8B8]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#2F3A3A] tracking-tight">
                        {editingItem ? "Edit Barang Bawaan" : "Tambah Barang Bawaan"}
                      </h3>
                      <p className="text-[10px] text-gray-400">
                        Pastikan perlengkapan penting dan dokumen tidak tertinggal.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Barang Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 block uppercase font-mono">NAMA BARANG</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Pompa ASI elektrik / Baju hangat bayi..."
                      value={barangInput}
                      onChange={(e) => setBarangInput(e.target.value)}
                      className="w-full bg-[#FAF9F5]/75 border border-[#2F3A3A]/10 rounded-2xl py-3 px-4 text-xs text-[#2F3A3A] outline-none focus:border-[#14B8B8] placeholder-gray-400 font-bold"
                    />
                  </div>

                  {/* Category & Jumlah row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Category Selection */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 block uppercase font-mono">BAGIAN / KATEGORI</label>
                      <select
                        value={kategoriInput}
                        onChange={(e) => setKategoriInput(e.target.value)}
                        className="w-full bg-[#FAF9F5]/75 border border-[#2F3A3A]/10 rounded-2xl py-3 px-4 text-xs text-[#2F3A3A] font-bold outline-none focus:border-[#14B8B8]"
                      >
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    {/* Jumlah Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 block uppercase font-mono">JUMLAH BARANG</label>
                      <div className="flex gap-2">
                        <input
                          required
                          type="number"
                          min="1"
                          max="99"
                          placeholder="e.g. 5"
                          value={jumlahInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setJumlahInput(val === "" ? "" : Number(val));
                          }}
                          className="flex-1 min-w-0 bg-[#FAF9F5]/75 border border-[#2F3A3A]/10 rounded-2xl py-3 px-3 text-xs text-[#2F3A3A] font-bold text-center outline-none focus:border-[#14B8B8]"
                        />
                        <select
                          value={satuanInput}
                          onChange={(e) => setSatuanInput(e.target.value as "pcs" | "pack")}
                          className="w-24 bg-[#FAF9F5]/75 border border-[#2F3A3A]/10 rounded-2xl py-3 px-3 text-xs text-[#2F3A3A] font-bold outline-none focus:border-[#14B8B8] cursor-pointer"
                        >
                          <option value="pcs">pcs</option>
                          <option value="pack">pack</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Catatan / Keterangan Input */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-400 block uppercase font-mono">CATATAN / KETERANGAN</label>
                    <input
                      type="text"
                      placeholder="e.g. Bahan katun adem, diletakkan di tas kecil..."
                      value={catatanInput}
                      onChange={(e) => setCatatanInput(e.target.value)}
                      className="w-full bg-[#FAF9F5]/75 border border-[#2F3A3A]/10 rounded-2xl py-3 px-4 text-xs text-[#2F3A3A] outline-none focus:border-[#14B8B8] placeholder-gray-400 font-bold"
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      type="button"
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-2xl py-3.5 transition-colors cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-[#14B8B8] hover:bg-[#14B8B8]/95 text-white text-xs font-black rounded-2xl py-3.5 shadow-md shadow-teal-500/10 hover:shadow-lg transition-colors cursor-pointer"
                    >
                      {editingItem ? "Simpan Perubahan" : "Tambahkan"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 8. CUSTOM CONFIRM DELETION MODAL */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {itemToDelete && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity" 
                onClick={() => setItemToDelete(null)}
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.3 }}
                className="relative bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl z-10 border border-[#E8E4FF] text-center space-y-4 font-sans"
              >
                <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                  <Trash2 className="w-5 h-5 shrink-0 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#2F3A3A]">Hapus Barang Bawaan?</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Moms & Dads, apakah yakin ingin menghapus barang <strong className="text-[#2F3A3A] font-extrabold">&quot;{itemToDelete.barang}&quot;</strong> dari daftar Hospital Bag? Tindakan ini tidak dapat diurungkan.
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => setItemToDelete(null)}
                    type="button"
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-2xl py-3 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    type="button"
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-2xl py-3 shadow-md shadow-red-500/15 hover:shadow-lg transition-colors cursor-pointer"
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

      {/* 9. FLOATING TOAST NOTIFICATION */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-[2000] max-w-sm p-4 rounded-2xl shadow-xl flex items-center space-x-3 text-white ${
              notification.type === "success" ? "bg-[#14B8B8]" : "bg-amber-500"
            }`}
          >
            <div className="p-1 text-white bg-white/20 rounded-lg shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs font-bold leading-tight flex-1">
              {notification.message}
            </p>
            <button
              onClick={() => setNotification(null)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
