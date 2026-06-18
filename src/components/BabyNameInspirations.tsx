import React, { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { BabyName } from "../types";
import { 
  Baby, 
  Plus, 
  Search, 
  Star, 
  Sparkles, 
  Trash2, 
  Award,
  X,
  Pencil,
  Heart,
  Scale,
  Check,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InstantTooltip from "./InstantTooltip";

interface BabyNameInspirationsProps {
  babyNames: BabyName[];
  onAddName: (name: Omit<BabyName, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onEditName?: (id: string, fields: Partial<BabyName>) => void;
  onVoteName: (id: string, votesCount: number) => void;
  onDeleteName: (id: string) => void;
  isDemo: boolean;
  onTriggerLogin: () => void;
  user: any;
}

const PRELOADED_NAMES = [
  { nama: "Aisha Az-Zahra", gender: "Perempuan", asal: "Arab", arti: "Anak perempuan yang penuh semangat kehidupan, hidup bahagia, suci, dan bercahaya cemerlang", panggilan: "Aisha", catatan: "Sangat disukai Moms karena maknanya yang mulia dan panggilannya yang feminin.", statusPilihan: "Pilihan Utama", isFavorite: true, votes: 12 },
  { nama: "Banyu Segoro", gender: "Laki-laki", asal: "Jawa", arti: "Air laut yang melingkupi bumi, lambang keluasan hikmah, kearifan, dan pemberi ketenteraman", panggilan: "Banyu", catatan: "Pilihan bernuansa Indonesia kearifan lokal yang gagah sekaligus tenang.", statusPilihan: "Favorit", isFavorite: true, votes: 14 },
  { nama: "Chandra Wirawan", gender: "Laki-laki", asal: "Sanskerta", arti: "Sinar rembulan malam hari yang gagah berani, membawa kedamaian dan membela kebenaran", panggilan: "Chandra", catatan: "Artinya puitis dan penuh karisma ksatria.", statusPilihan: "Pertimbangan", isFavorite: false, votes: 5 },
  { nama: "Danendra Kalandra", gender: "Laki-laki", asal: "Sanskerta", arti: "Raja kaya raya pembawa kemuliaan yang menerangi masyarakat dengan keceriaannya", panggilan: "Rayan / Danen", catatan: "Dads sangat menyukai ini karena terdengar gagah dan berwibawa tinggi.", statusPilihan: "Pilihan Kami", isFavorite: true, votes: 9 },
  { nama: "Elina Claretta", gender: "Perempuan", asal: "Yunani - Latin", arti: "Wanita pintar, terang murni bersinar membawa cahaya kebaikan sejati bagi sesamanya", panggilan: "Elina", catatan: "Panggilan yang anggun dan internasional yang modern.", statusPilihan: "Pertimbangan", isFavorite: false, votes: 6 },
  { nama: "Faris Al-Ghazali", gender: "Laki-laki", asal: "Arab", arti: "Ksatria berkuda penolong cerdas, berilmu luas, dan bijaksana laksana imam besar", panggilan: "Faris", catatan: "Recomendasi klasik religius namun tetap relevan di zaman modern.", statusPilihan: "Favorit", isFavorite: true, votes: 11 },
  { nama: "Gempita Kirana", gender: "Perempuan", asal: "Indonesia - Sanskerta", arti: "Sinar keindahan elok mempesona yang disambut meriah penuh sorak kegembiraan", panggilan: "Kirana", catatan: "Kombinasi nama agung lokal yang kaya arti.", statusPilihan: "Pilihan Kami", isFavorite: false, votes: 8 },
  { nama: "Nirmala Safira", gender: "Perempuan", asal: "Sanskerta - Melayu", arti: "Suci, bersih tanpa noda sedikit pun bagaikan permata safir biru berkilau indah", panggilan: "Nirmala", catatan: "Nama lokal legendaris dengan harapan sifat yang luhur budi.", statusPilihan: "Pilihan Utama", isFavorite: true, votes: 15 },
  { nama: "Rumi El-Arif", gender: "Netral", asal: "Persia", arti: "Pujangga cinta kasih yang arif bijaksana, cinta kedamaian dan berwawasan agung", panggilan: "Rumi", catatan: "Nama unisex yang puitis dan penuh kedalaman filosofis spiritual.", statusPilihan: "Favorit", isFavorite: false, votes: 10 },
];

export default function BabyNameInspirations({
  babyNames = [],
  onAddName,
  onEditName,
  onVoteName,
  onDeleteName,
  isDemo,
  onTriggerLogin,
  user
}: BabyNameInspirationsProps) {
  
  // Search & Filters state
  const [searchTerm, setSearchTerm] = useState("");
  const [genderFilter, setGenderFilter] = useState<"Semua" | "Perempuan" | "Laki-laki" | "Netral">("Semua");
  const [originFilter, setOriginFilter] = useState("Semua");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Local state overlay for demo mode
  const [customDemoNames, setCustomDemoNames] = useState<BabyName[] | null>(null);

  // Success Toast Notice state
  const [toastMessage, setToastMessage] = useState("");

  // Modals visibility setup
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [editingName, setEditingName] = useState<BabyName | null>(null);
  const [nameToDelete, setNameToDelete] = useState<BabyName | null>(null);

  // Comparison module selection list
  const [compareIds, setCompareIds] = useState<string[]>([]);

  // Deletion logic persistence (hidden names whether custom or preloaded)
  const [hiddenNameIds, setHiddenNameIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("babyplan_hidden_names");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const hideNameId = (id: string) => {
    setHiddenNameIds(prev => {
      const next = [...prev, id];
      try {
        localStorage.setItem("babyplan_hidden_names", JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  // Modal Form States
  const [formData, setFormData] = useState({
    nama: "",
    panggilan: "",
    gender: "Perempuan" as "Laki-laki" | "Perempuan" | "Netral",
    asal: "",
    arti: "",
    catatan: "",
    statusPilihan: "Favorit" as "Pilihan Utama" | "Favorit" | "Pertimbangan" | "Pilihan Kami"
  });

  // Helper inside to push notices safely
  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Combine and map values
  const allNames = useMemo(() => {
    const userNamesMap = new Map(babyNames.map(n => [n.nama.toLowerCase(), n]));
    const combined: BabyName[] = [];

    // 1. User database items (from firebase sync)
    babyNames.forEach(n => {
      combined.push({
        ...n,
        // Ensure defaults are handled
        panggilan: n.panggilan || "-",
        catatan: n.catatan || "",
        statusPilihan: n.statusPilihan || "Favorit",
        isFavorite: n.isFavorite !== undefined ? n.isFavorite : (n.votes > 5)
      });
    });

    // 2. Preloaded names if not overridden by user
    PRELOADED_NAMES.forEach((p, idx) => {
      if (!userNamesMap.has(p.nama.toLowerCase())) {
        combined.push({
          id: `prebuilt-${idx}`,
          userId: "preloaded",
          nama: p.nama,
          gender: p.gender as any,
          asal: p.asal,
          arti: p.arti,
          panggilan: p.panggilan,
          catatan: p.catatan,
          statusPilihan: p.statusPilihan as any,
          isFavorite: p.isFavorite,
          votes: p.votes,
          createdAt: "",
          updatedAt: ""
        });
      }
    });

    // Default sort: custom user entries at top, then sort by votes / order
    return combined;
  }, [babyNames]);

  // The active list to display based on Demo vs Production
  const displayNames = useMemo(() => {
    const rawList = customDemoNames === null ? allNames : customDemoNames;
    return rawList.filter(n => !hiddenNameIds.includes(n.id));
  }, [allNames, customDemoNames, hiddenNameIds]);

  // Dynamic set of Asal Bahasa for filtering dropdown
  const originsList = useMemo(() => {
    const listSet = new Set<string>();
    displayNames.forEach(n => {
      if (n.asal) {
        // split comma separated if any, or add whole
        const parts = n.asal.split(/[-,\/]/);
        parts.forEach(p => {
          const trim = p.trim();
          if (trim) listSet.add(trim);
        });
      }
    });
    return ["Semua", ...Array.from(listSet)];
  }, [displayNames]);

  // Computes filtered list
  const filteredNames = useMemo(() => {
    return displayNames.filter(n => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        n.nama.toLowerCase().includes(term) ||
        (n.panggilan && n.panggilan.toLowerCase().includes(term)) ||
        n.arti.toLowerCase().includes(term) ||
        (n.catatan && n.catatan.toLowerCase().includes(term)) ||
        (n.asal && n.asal.toLowerCase().includes(term));

      const matchesGender = genderFilter === "Semua" || n.gender === genderFilter;
      
      let matchesOrigin = true;
      if (originFilter !== "Semua") {
        matchesOrigin = !!n.asal && n.asal.toLowerCase().includes(originFilter.toLowerCase());
      }

      const matchesFavorite = !showFavoritesOnly || !!n.isFavorite;

      return matchesSearch && matchesGender && matchesOrigin && matchesFavorite;
    });
  }, [displayNames, searchTerm, genderFilter, originFilter, showFavoritesOnly]);

  // Modal open helpers
  const handleOpenAdd = () => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setFormData({
      nama: "",
      panggilan: "",
      gender: "Perempuan",
      asal: "",
      arti: "",
      catatan: "",
      statusPilihan: "Favorit"
    });
    setEditingName(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: BabyName) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setFormData({
      nama: item.nama,
      panggilan: item.panggilan || "",
      gender: item.gender,
      asal: item.asal || "",
      arti: item.arti,
      catatan: item.catatan || "",
      statusPilihan: item.statusPilihan || "Favorit"
    });
    setEditingName(item);
    setIsModalOpen(true);
  };

  // Safe action triggers
  const handleSaveNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nama.trim()) {
      showToast("⚠️ Nama Lengkap wajib diisi!");
      return;
    }
    if (!formData.arti.trim()) {
      showToast("⚠️ Makna & Arti Filosofi wajib diisi!");
      return;
    }

    const itemPayload = {
      nama: formData.nama.trim(),
      panggilan: formData.panggilan.trim() || "-",
      gender: formData.gender,
      asal: formData.asal.trim() || "Internasional",
      arti: formData.arti.trim(),
      catatan: formData.catatan.trim(),
      statusPilihan: formData.statusPilihan,
      isFavorite: editingName ? (editingName.isFavorite || false) : false,
      votes: editingName ? (editingName.votes || 1) : 1
    };

    if (editingName) {
      // EDIT MODE
      if (isDemo) {
        const updated = displayNames.map(n => {
          if (n.id === editingName.id) {
            return {
              ...n,
              ...itemPayload
            };
          }
          return n;
        });
        setCustomDemoNames(updated);
        showToast("✅ Nama bayi berhasil diperbarui.");
      } else {
        // If it was prebuilt, insert as a new user entry override
        if (editingName.id.startsWith("prebuilt-")) {
          onAddName(itemPayload);
          showToast("✅ Nama berhasil disalin & diperbarui ke database!");
        } else {
          onEditName?.(editingName.id, itemPayload);
          showToast("✅ Nama bayi berhasil diperbarui.");
        }
      }
    } else {
      // ADD MODE
      if (isDemo) {
        const generatedId = "demo_name_" + Math.random().toString(36).substring(2, 11);
        const newRecord: BabyName = {
          id: generatedId,
          userId: "demo_user",
          ...itemPayload,
          createdAt: "",
          updatedAt: ""
        };
        setCustomDemoNames([newRecord, ...displayNames]);
        showToast("✅ Nama bayi berhasil ditambahkan.");
      } else {
        onAddName(itemPayload);
        showToast("✅ Nama bayi berhasil ditambahkan.");
      }
    }

    setIsModalOpen(false);
  };

  // Toggle favorite star icon directly
  const handleToggleFavorite = (item: BabyName) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    const nextVal = !item.isFavorite;

    if (item.id.startsWith("prebuilt-")) {
      // Copy to database with favorite enabled
      onAddName({
        nama: item.nama,
        gender: item.gender,
        asal: item.asal,
        arti: item.arti,
        panggilan: item.panggilan || item.nama,
        catatan: item.catatan || "",
        statusPilihan: item.statusPilihan || "Favorit",
        isFavorite: nextVal,
        votes: item.votes + 1
      });
      showToast("⭐ Rekomendasi disalin & difavoritkan!");
    } else {
      onEditName?.(item.id, { isFavorite: nextVal });
      showToast(nextVal ? "⭐ Ditambahkan ke Favorit" : "Dilepas dari Favorit");
    }
  };

  // Perform delete trigger
  const handleDeleteTrigger = (item: BabyName) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setNameToDelete(item);
  };

  // Confirm delete handler
  const handleConfirmDelete = () => {
    if (!nameToDelete) return;
    const id = nameToDelete.id;

    // Always hide locally first to provide instant UI responsiveness
    hideNameId(id);

    // If it's a demo name or demo mode, let's also remove it from customDemoNames state if set
    if (isDemo && customDemoNames) {
      setCustomDemoNames(prev => prev ? prev.filter(n => n.id !== id) : null);
    }

    // Clear from compare selection
    setCompareIds(prev => prev.filter(itemId => itemId !== id));

    if (!isDemo && !id.startsWith("prebuilt-")) {
      onDeleteName(id);
    }

    showToast("🗑️ Nama bayi berhasil dihapus.");
    setNameToDelete(null);
  };

  // Compare selection hooks
  const toggleSelectionCompare = (id: string) => {
    setCompareIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 3) {
        showToast("⚠️ Anda dapat membandingkan maksimal hingga 3 nama.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const getComparedNames = useMemo(() => {
    return displayNames.filter(n => compareIds.includes(n.id));
  }, [displayNames, compareIds]);

  return (
    <div id="baby-names-view" className="space-y-6 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in relative">
      
      {/* SUCCESS FLOATING TOAST NOTIFIER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#2F3A3A] text-white px-5 py-3.5 rounded-2xl shadow-xl border border-white/10 flex items-center gap-3 animate-slide-up text-xs font-semibold">
          <div className="h-2 w-2 rounded-full bg-[#14B8B8] animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. HEADER SECTION (Consistent with other views) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#14B8B8] uppercase tracking-widest font-mono">
            RISET NAMA & PANGGILAN
          </span>
          <h2 className="text-2xl font-black text-[#2F3A3A] tracking-tight mt-1 text-left">
            Inspirasi & Cari Nama Bayi
          </h2>
          <p className="text-xs text-gray-400 mt-1 max-w-2xl">
            Cari makna nama terbaik bagi buah hati kesayangan Moms & Dads. Tentukan target gender, filter asal bahasa, tambahkan nama kustom, serta nikmati perbandingan instan secara side-by-side.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          id="btn-trigger-add-name-modal"
          className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 max-sm:w-full sm:w-auto text-white text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-md shadow-[#14B8B8]/15 tracking-tight flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 shrink-0 self-stretch sm:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Nama Baru</span>
        </button>
      </div>

      {/* 2. FILTER BAR */}
      <div className="bg-[#FAF9F5]/70 border border-[#E8E4FF] rounded-3xl p-4 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-2xs">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-gray-400 w-3.5 h-3.5" />
          <input
            id="names-directory-search-input"
            type="text"
            placeholder="Cari arti / nama..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8] rounded-xl py-2 pl-9 pr-3 text-xs text-[#2F3A3A] outline-none transition-all placeholder:text-gray-400 font-medium"
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 md:w-auto w-full">
          <select
            id="dropdown-filter-gender"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value as any)}
            className="bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-semibold text-[#2F3A3A] focus:outline-none focus:border-[#14B8B8] w-full sm:w-auto"
          >
            <option value="Semua">Semua Gender</option>
            <option value="Laki-laki">Laki-laki 👕</option>
            <option value="Perempuan">Perempuan 🌸</option>
            <option value="Netral">Unisex/Netral 🍀</option>
          </select>

          <select
            id="dropdown-filter-asal"
            value={originFilter}
            onChange={(e) => setOriginFilter(e.target.value)}
            className="bg-white border border-gray-200 rounded-xl py-2 px-3 text-xs font-semibold text-[#2F3A3A] focus:outline-none focus:border-[#14B8B8] w-full sm:max-w-[180px] truncate"
          >
            <option value="Semua">Semua Bahasa</option>
            {originsList.filter(o => o !== "Semua").map(o => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            id="btn-filter-favorites-only"
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border w-full sm:w-auto ${
              showFavoritesOnly
                ? "bg-rose-50 border-rose-200 text-rose-600"
                : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-rose-500"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 transition-transform ${showFavoritesOnly ? "fill-rose-500 text-rose-500 scale-110" : "text-gray-400"}`} />
            <span>Favorit Saja</span>
          </button>
        </div>

        {/* Compare Trigger button (Side border) */}
        <button
          onClick={() => {
            if (compareIds.length === 0) {
              showToast("💡 Centang icon banding atau pilih minimal 1 nama untuk membandingkan!");
            }
            setIsCompareOpen(true);
          }}
          className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shrink-0 ${
            compareIds.length > 0 
              ? "bg-amber-500 text-white hover:bg-amber-600 shadow-xs cursor-pointer shadow-amber-500/10" 
              : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 cursor-pointer"
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Bandingkan Nama ({compareIds.length})</span>
        </button>
      </div>

      {/* QUICK COMPARISON MINI BANNER IF SELECTIONS ARE ACTIVE */}
      {compareIds.length > 0 && (
        <div className="bg-[#EEEBFF] border border-[#C7BEFF] px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs font-medium animate-fade-in text-[#5233E8]">
          <div className="flex items-center gap-2">
            <span className="flex h-1.5 w-1.5 rounded-full bg-[#5233E8] animate-ping" />
            <span>Memilih <strong>{compareIds.length} nama</strong> untuk dibandingkan. Ketuk tombol &quot;Bandingkan Nama&quot; di atas untuk membuka visual.</span>
          </div>
          <button 
            onClick={() => setCompareIds([])}
            className="text-[10px] bg-white px-2 py-1 rounded-lg border border-[#C7BEFF] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
          >
            Reset Pilihan
          </button>
        </div>
      )}

      {/* 3. CARD GRID VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNames.length === 0 ? (
          <div className="bg-white border border-[#E8E4FF] rounded-3xl p-12 text-center col-span-full space-y-3">
            <Baby className="w-12 h-12 text-gray-300 mx-auto animate-bounce-slow" />
            <h4 className="text-sm font-bold text-gray-500">Hasil tidak ditemukan.</h4>
            <p className="text-xs text-gray-400 max-w-md mx-auto">
              Tidak ada usulan nama yang cocok dengan kata kunci filter &quot;{searchTerm}&quot;. Coba ganti kata kunci pencarian atau tambah ide nama baru Anda.
            </p>
          </div>
        ) : (
          filteredNames.map((item) => {
            const isComparedSelected = compareIds.includes(item.id);
            return (
              <div 
                key={item.id} 
                id={`name-card-${item.id}`}
                className={`bg-white border-2 rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 shadow-xs hover:shadow-md relative ${
                  isComparedSelected 
                    ? "border-amber-400 ring-2 ring-amber-100 bg-amber-50/5" 
                    : "border-[#E8E4FF] hover:border-[#14B8B8]/30"
                }`}
              >
                {/* TOP HEADER Inside Card */}
                <div className="flex justify-between items-start gap-2">
                  {/* Badge Gender (Soft Pastel) */}
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-extrabold shadow-3xs uppercase tracking-wider border ${
                    item.gender === "Perempuan" ? "bg-rose-50 text-rose-600 border-rose-100" :
                    item.gender === "Laki-laki" ? "bg-sky-50 text-sky-600 border-sky-100" :
                    "bg-indigo-50 text-indigo-600 border-indigo-100"
                  }`}>
                    {item.gender === "Perempuan" ? "🌸 Perempuan" : item.gender === "Laki-laki" ? "👕 Laki-Laki" : "🍀 Netral"}
                  </span>

                  {/* Actions (Compare + Favorite Checkbox) */}
                  <div className="flex items-center gap-1.5">
                    {/* Compare Selector Checkbox */}
                    <InstantTooltip content={isComparedSelected ? "Batal Bandingkan" : "Bandingkan Name"} position="top">
                      <button 
                        onClick={() => toggleSelectionCompare(item.id)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isComparedSelected 
                            ? "bg-amber-400 text-white border-amber-500" 
                            : "bg-white text-gray-400 border-gray-100 hover:text-amber-500 hover:bg-amber-50/50"
                        }`}
                      >
                        <Scale className="w-3 h-3" />
                      </button>
                    </InstantTooltip>

                    {/* Star Favorite Button */}
                    <InstantTooltip content={item.isFavorite ? "Hapus dari Favorit" : "Simpan ke Favorit"} position="top">
                      <button
                        onClick={() => handleToggleFavorite(item)}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          item.isFavorite 
                            ? "bg-amber-50 text-amber-500 border-amber-100 shadow-3xs text-yellow-500" 
                            : "bg-white text-gray-300 border-gray-100 hover:text-amber-500"
                        }`}
                        id={`btn-fav-toggle-${item.id}`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-[#14B8B8] text-[#14B8B8]" : "text-gray-300"}`} />
                      </button>
                    </InstantTooltip>
                  </div>
                </div>

                {/* MAIN BODY of Card */}
                <div className="space-y-3 mt-4 flex-1">
                  <div>
                    <span className="text-[9px] text-[#A78BFA] font-black uppercase tracking-wider font-mono">
                      ASAL BAHASA: {item.asal ? item.asal.toUpperCase() : "LOKAL"}
                    </span>
                    <h3 className="text-lg font-black text-[#2F3A3A] tracking-tight hover:text-[#14B8B8] transition-colors mt-0.5 break-words leading-tight">
                      {item.nama}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Panggilan: <strong className="text-teal-700 italic font-serif">&quot;{item.panggilan || "-"}&quot;</strong>
                    </p>
                  </div>

                  {/* Arti Box */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wide font-mono block">
                      ARTI FILOSOFI:
                    </span>
                    <div className="bg-[#FAF9F5]/90 border border-[#E8E4FF]/40 rounded-xl p-3 text-xs text-gray-700 leading-relaxed italic pr-5 font-serif shadow-3xs overflow-hidden max-h-24 overflow-y-auto">
                      &ldquo;{item.arti}&rdquo;
                    </div>
                  </div>

                  {/* Catatan / Rekomendasi */}
                  {item.catatan && (
                    <div className="pt-1.5">
                      <span className="text-[9px] text-gray-400 font-semibold block">Catatan:</span>
                      <p className="text-[11px] text-gray-500 italic mt-0.5 leading-snug line-clamp-2">
                        {item.catatan}
                      </p>
                    </div>
                  )}
                </div>

                {/* BOTTOM COMPONENT ROWS */}
                <div className="border-t border-[#E8E4FF]/40 pt-3.5 mt-4 flex items-center justify-between">
                  {/* Status Badge */}
                  <span className={`text-[9.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider font-sans border ${
                    item.statusPilihan === "Pilihan Utama" ? "bg-rose-50 border-rose-100 text-rose-700" :
                    item.statusPilihan === "Favorit" ? "bg-amber-50 border-amber-100 text-amber-700" :
                    item.statusPilihan === "Pertimbangan" ? "bg-slate-50 border-slate-100 text-slate-700" :
                    "bg-emerald-50 border-emerald-100 text-emerald-700"
                  }`}>
                    {item.statusPilihan || "Favorit"}
                  </span>

                  {/* Actions: Edit, Delete */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <InstantTooltip content="Edit Catatan" position="top">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="text-gray-400 hover:text-[#14B8B8] transition-colors p-1 bg-gray-50 hover:bg-teal-50 border border-transparent hover:border-teal-200/50 rounded-lg cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </InstantTooltip>
                    
                    <InstantTooltip content="Hapus Usulan" position="top">
                      <button
                        onClick={() => handleDeleteTrigger(item)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 bg-gray-50 hover:bg-rose-50 border border-transparent hover:border-rose-100 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </InstantTooltip>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 4. MODAL POPUP FOR ADD & EDIT */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              {/* Overlay - truly full viewport fixed background */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
                onClick={() => setIsModalOpen(false)}
              />

              {/* Dialog Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="bg-white border-2 border-[#E8E4FF] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="bg-[#FAF9F5] px-6 py-4 border-b border-[#E8E4FF] flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#14B8B8] font-bold">
                    <Sparkles className="w-5 h-5 text-[#14B8B8] animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-wider">
                      {editingName ? "Edit Catatan Nama" : "Usulkan Nama Favorit"}
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSaveNameSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
                  {/* Nama Lengkap */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Kombinasi Nama / Nama Lengkap <span className="text-[#14B8B8]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Aisha Kirana"
                      value={formData.nama}
                      onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-gray-200 focus:border-[#14B8B8] rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nama Panggilan */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                        Nama Panggilan <span className="text-gray-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Aisha"
                        value={formData.panggilan}
                        onChange={(e) => setFormData({ ...formData, panggilan: e.target.value })}
                        className="w-full bg-[#FAF9F5] border border-gray-200 focus:border-[#14B8B8] rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A] outline-none"
                      />
                    </div>

                    {/* Target Gender */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                        Target Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                        className="w-full bg-[#FAF9F5] border border-gray-200 focus:border-[#14B8B8] rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A]"
                      >
                        <option value="Perempuan">Perempuan 🌸</option>
                        <option value="Laki-laki">Laki-laki 👕</option>
                        <option value="Netral">Netral/Unisex 🍀</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Asal Bahasa */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                        Asal Bahasa / Suku
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Arab / Jawa / Sanskerta"
                        value={formData.asal}
                        onChange={(e) => setFormData({ ...formData, asal: e.target.value })}
                        className="w-full bg-[#FAF9F5] border border-gray-200 focus:border-[#14B8B8] rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A] outline-none"
                      />
                    </div>

                    {/* Status Pilihan dropdown */}
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                        Status Pilihan
                      </label>
                      <select
                        value={formData.statusPilihan}
                        onChange={(e) => setFormData({ ...formData, statusPilihan: e.target.value as any })}
                        className="w-full bg-[#FAF9F5] border border-gray-200 focus:border-[#14B8B8] rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A]"
                      >
                        <option value="Pilihan Utama">Pilihan Utama 🥇</option>
                        <option value="Favorit">Favorit ⭐</option>
                        <option value="Pertimbangan">Pertimbangan 📝</option>
                        <option value="Pilihan Kami">Pilihan Kami ✔️</option>
                      </select>
                    </div>
                  </div>

                  {/* Makna & Doa */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Makna & Doa Arti Nama <span className="text-[#14B8B8]">*</span>
                    </label>
                    <textarea
                      required
                      placeholder="e.g. Anak perempuan pintar berhati bersih laksana emas..."
                      value={formData.arti}
                      onChange={(e) => setFormData({ ...formData, arti: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-gray-200 focus:border-[#14B8B8] rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none h-20 resize-none font-serif"
                    />
                  </div>

                  {/* Catatan Tambahan */}
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Catatan Tambahan / Rekomendasi
                    </label>
                    <textarea
                      placeholder="e.g. Nama dari anjuran nenek, terkesan agung namun gampang diingat..."
                      value={formData.catatan}
                      onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
                      className="w-full bg-[#FAF9F5] border border-gray-200 focus:border-[#14B8B8] rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none h-16 resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-4 flex items-center justify-end space-x-2 border-t border-[#E8E4FF]/45">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-4 py-2.5 rounded-xl cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 text-white text-xs font-black px-5 py-2.5 rounded-xl shadow-xs cursor-pointer"
                    >
                      {editingName ? "Simpan Perubahan" : "Simpan Nama"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 5. MODAL POPUP FOR COMPARATIVE VIEW */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {isCompareOpen && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              {/* Overlay - truly full viewport fixed background */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
                onClick={() => setIsCompareOpen(false)}
              />

              {/* Dialog Container */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ type: "spring", duration: 0.4 }}
                className="bg-white border-2 border-[#E8E4FF] rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
              >
                {/* Header */}
                <div className="bg-[#FAF9F5] px-6 py-4 border-b border-[#E8E4FF] flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-[#14B8B8] font-bold">
                    <Scale className="w-5 h-5 text-amber-500 animate-pulse" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-teal-900">
                      Perbandingan Nama Bayi Side-by-Side
                    </h3>
                  </div>
                  <button 
                    onClick={() => setIsCompareOpen(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                  {/* Candidate selector checklist */}
                  <div className="bg-[#FAF9F5] p-4 rounded-2xl border border-[#E8E4FF]/60">
                    <span className="text-[10px] font-black text-[#14B8B8] uppercase block tracking-wider mb-2 font-mono">
                      PILIH MAKSIMAL 3 NAMA UNTUK DIBANDINGKAN:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {displayNames.map(item => {
                        const isSelected = compareIds.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleSelectionCompare(item.id)}
                            className={`text-xs px-3 py-2 rounded-xl border flex items-center gap-1.5 transition-all text-left ${
                              isSelected 
                                ? "bg-amber-100 text-amber-800 border-amber-300 font-extrabold" 
                                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                            <span className="truncate max-w-[120px]">{item.nama}</span>
                            <span className="text-[9px] text-gray-400 font-mono">({item.gender === "Laki-laki" ? "👕" : item.gender === "Perempuan" ? "🌸" : "🍀"})</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Comparative table */}
                  {getComparedNames.length === 0 ? (
                    <div className="text-center py-12 bg-[#FAF9F5] rounded-3xl border border-dashed border-[#E8E4FF] space-y-2">
                      <Scale className="w-10 h-10 text-gray-300 mx-auto" />
                      <p className="text-xs text-gray-500 font-bold">Belum ada nama yang dipilih.</p>
                      <p className="text-[11px] text-gray-400">Silakan beri tanda centang pada tombol timbangan di card, atau pilih salah satu di box atas.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {getComparedNames.map(item => (
                        <div key={item.id} className="bg-white border-2 border-amber-200 hover:border-[#14B8B8] rounded-2xl p-5 shadow-xs space-y-4 transition-all flex flex-col justify-between">
                          {/* Sub card-header */}
                          <div className="space-y-1.5 border-b border-gray-100 pb-3">
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border uppercase tracking-wider ${
                              item.gender === "Perempuan" ? "bg-rose-50 text-rose-600 border-rose-100" :
                              item.gender === "Laki-laki" ? "bg-sky-50 text-sky-600 border-sky-100" :
                              "bg-purple-50 text-purple-600 border-purple-100"
                            }`}>
                              {item.gender}
                            </span>
                            <h4 className="text-base font-black text-[#2F3A3A] hover:text-[#14B8B8] truncate">
                              {item.nama}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Panggilan: <strong className="text-teal-700 italic font-mono">&quot;{item.panggilan || "-"}&quot;</strong>
                            </p>
                          </div>

                          {/* Asal Bahasa */}
                          <div className="text-xs">
                            <span className="text-[10px] text-gray-400 font-black block tracking-wide uppercase font-mono">ASAL BAHASA:</span>
                            <strong className="text-teal-900 mt-0.5 inline-block">{item.asal || "Lokal / Umum"}</strong>
                          </div>

                          {/* Makna Filosofi */}
                          <div className="text-xs flex-1">
                            <span className="text-[10px] text-gray-400 font-black block tracking-wide uppercase font-mono">MAKNA & FILOSOFI:</span>
                            <div className="bg-amber-50/40 p-3 rounded-lg border border-amber-100/40 italic font-serif leading-relaxed mt-1 text-gray-700">
                              &ldquo;{item.arti}&rdquo;
                            </div>
                          </div>

                          {/* Rekomendasi */}
                          {item.catatan && (
                            <div className="text-xs text-gray-500 pt-1 border-t border-[#E8E4FF]/45 pt-1 border-t border-gray-100/60 font-sans leading-snug">
                              <span className="font-bold text-gray-400 block text-[10px] uppercase font-mono">CATATAN:</span>
                              <span className="italic">&ldquo;{item.catatan}&ldquo;</span>
                            </div>
                          )}

                          {/* Status */}
                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                              item.statusPilihan === "Pilihan Utama" ? "bg-rose-50 border-rose-100 text-rose-700" :
                              item.statusPilihan === "Favorit" ? "bg-amber-50 border-amber-100 text-amber-700" :
                              item.statusPilihan === "Pertimbangan" ? "bg-slate-50 border-slate-100 text-slate-700" :
                              "bg-emerald-50 border-emerald-100 text-emerald-700"
                            }`}>
                              {item.statusPilihan || "Favorit"}
                            </span>
                            
                            <button
                              onClick={() => toggleSelectionCompare(item.id)}
                              className="text-xs text-red-500 hover:text-red-700 font-bold bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded-lg transition-all"
                            >
                              Keluarkan
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="bg-[#FAF9F5] px-6 py-4 border-t border-[#E8E4FF] flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setCompareIds([])}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Bersihkan Semua</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCompareOpen(false)}
                    className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 text-white text-xs font-black px-5 py-2 rounded-xl cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 6. CUSTOM CONFIRM DELETION MODAL */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {nameToDelete && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity" 
                onClick={() => setNameToDelete(null)}
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
                  <Trash2 className="w-5 h-5 shrink-0" />
                </div>
                <div>
                  <h4 className="text-base font-black text-[#2F3A3A]">Hapus Ide Nama Bayi?</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Moms & Dads, apakah yakin ingin menghapus nama <strong className="text-[#2F3A3A] font-extrabold">&quot;{nameToDelete.nama}&quot;</strong>? Tindakan ini tidak dapat diurungkan.
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => setNameToDelete(null)}
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

    </div>
  );
}
