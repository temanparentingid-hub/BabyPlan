import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { BudgetItem } from "../types";
import { formatRupiah } from "../pregnancyUtils";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit2, 
  Copy, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  TrendingUp, 
  AlertTriangle,
  FolderMinus,
  Sparkles,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InstantTooltip from "./InstantTooltip";

interface MasterBudgetManagerProps {
  budgetItems: BudgetItem[];
  onAddItem: (item: Omit<BudgetItem, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onEditItem: (id: string, item: Partial<BudgetItem>) => void;
  onDeleteItem: (id: string) => void;
  isDemo: boolean;
  onTriggerLogin: () => void;
}

const CATEGORIES = [
  "Medis & Kontrol",
  "Perlengkapan Bayi",
  "Perlengkapan Ibu",
  "Persalinan",
  "Syukuran & Aqiqah",
  "Lainnya"
];

const PAY_STATUSES = ["Belum Lunas", "Lunas", "DP"];
const PRIORITIES = ["Tinggi", "Sedang", "Rendah"];

export default function MasterBudgetManager({
  budgetItems = [],
  onAddItem,
  onEditItem,
  onDeleteItem,
  isDemo,
  onTriggerLogin
}: MasterBudgetManagerProps) {
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [itemToDelete, setItemToDelete] = useState<{ id: string; nama: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [selectedStatus, setSelectedStatus] = useState("Semua");
  const [selectedPriority, setSelectedPriority] = useState("Semua");
  const [sortBy, setSortBy] = useState<"tanggal" | "rencana" | "aktual" | "prioritas">("tanggal");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Form Modal state
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);

  // Form Fields
  const [tanggal, setTanggal] = useState("");
  const [nama, setNama] = useState("");
  const [kategori, setKategori] = useState(CATEGORIES[0]);
  const [subkategori, setSubkategori] = useState("");
  const [prioritas, setPrioritas] = useState<"Tinggi" | "Sedang" | "Rendah">("Tinggi");
  const [rencana, setRencana] = useState<number | "">("");
  const [aktual, setAktual] = useState<number | "">("");
  const [statusPembayaran, setStatusPembayaran] = useState<"Belum Lunas" | "Lunas" | "DP">("Belum Lunas");
  const [metode, setMetode] = useState("");
  const [catatan, setCatatan] = useState("");

  // Clean form fields
  const resetForm = () => {
    setTanggal(new Date().toISOString().split("T")[0]);
    setNama("");
    setKategori(CATEGORIES[0]);
    setSubkategori("");
    setPrioritas("Tinggi");
    setRencana("");
    setAktual("");
    setStatusPembayaran("Belum Lunas");
    setMetode("");
    setCatatan("");
    setEditingItem(null);
  };

  // Trigger form opening for addition
  const handleOpenAdd = () => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    resetForm();
    setFormOpen(true);
  };

  // Trigger form opening for edits
  const handleOpenEdit = (item: BudgetItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setEditingItem(item);
    setTanggal(item.tanggal);
    setNama(item.nama);
    setKategori(item.kategori);
    setSubkategori(item.subkategori || "");
    setPrioritas(item.prioritas);
    setRencana(item.rencana === 0 ? "" : item.rencana);
    setAktual(item.aktual === 0 ? "" : item.aktual);
    setStatusPembayaran(item.statusPembayaran);
    setMetode(item.metode || "");
    setCatatan(item.catatan || "");
    setFormOpen(true);
  };

  const handleDuplicate = (item: BudgetItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    const duplicated: Omit<BudgetItem, "id" | "createdAt" | "updatedAt"> = {
      userId: item.userId,
      tanggal: item.tanggal,
      nama: `${item.nama} (Duplikat)`,
      kategori: item.kategori,
      subkategori: item.subkategori,
      prioritas: item.prioritas,
      rencana: item.rencana,
      aktual: item.aktual,
      statusPembayaran: item.statusPembayaran,
      metode: item.metode,
      catatan: item.catatan
    };
    onAddItem(duplicated);
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
      onDeleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const payload = {
      tanggal,
      nama: nama.trim(),
      kategori,
      subkategori: subkategori.trim() || undefined,
      prioritas,
      rencana: rencana === "" ? 0 : Number(rencana),
      aktual: aktual === "" ? 0 : Number(aktual),
      statusPembayaran,
      metode: metode.trim() || undefined,
      catatan: catatan.trim() || undefined
    };

    if (editingItem) {
      onEditItem(editingItem.id, payload);
    } else {
      onAddItem(payload);
    }
    setFormOpen(false);
    resetForm();
  };

  // Filter & Search computation
  const filteredItems = useMemo(() => {
    return budgetItems
      .filter((item) => {
        // Search term
        const term = searchTerm.toLowerCase();
        const matchesSearch = 
          item.nama.toLowerCase().includes(term) ||
          (item.subkategori && item.subkategori.toLowerCase().includes(term)) ||
          (item.catatan && item.catatan.toLowerCase().includes(term));

        // Filters
        const matchesCategory = selectedCategory === "Semua" || item.kategori === selectedCategory;
        const matchesStatus = selectedStatus === "Semua" || item.statusPembayaran === selectedStatus;
        const matchesPriority = selectedPriority === "Semua" || item.prioritas === selectedPriority;

        return matchesSearch && matchesCategory && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        let fieldA: any = a[sortBy];
        let fieldB: any = b[sortBy];

        if (sortBy === "prioritas") {
          const map = { Tinggi: 3, Sedang: 2, Rendah: 1 };
          fieldA = map[a.prioritas];
          fieldB = map[b.prioritas];
        }

        if (fieldA < fieldB) return sortOrder === "asc" ? -1 : 1;
        if (fieldA > fieldB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [budgetItems, searchTerm, selectedCategory, selectedStatus, selectedPriority, sortBy, sortOrder]);

  // Aggregate metrics summary for filtered lists
  const aggregates = useMemo(() => {
    let budgetTotal = 0;
    let spendTotal = 0;
    let lunasTotal = 0;
    let overCount = 0;

    filteredItems.forEach(item => {
      budgetTotal += item.rencana || 0;
      spendTotal += item.aktual || 0;
      if (item.statusPembayaran === "Lunas") {
        lunasTotal += item.aktual || 0;
      }
      if (item.aktual > item.rencana) {
        overCount++;
      }
    });

    const diff = budgetTotal - spendTotal;

    return {
      budgetTotal,
      spendTotal,
      lunasTotal,
      diff,
      overCount
    };
  }, [filteredItems]);

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div id="budget-manager-view" className="space-y-6 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in">
      
      {/* 1. SECTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#14B8B8] uppercase tracking-widest font-mono">
            Rencana & Realisasi
          </span>
          <h2 className="text-2xl font-black text-[#2F3A3A] tracking-tight">
            Master Keuangan & Budget
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Membantu memantau pengeluaran aktual dan membandingkannya dengan anggaran awal Moms & Dads.
          </p>
        </div>
        
        <button
          id="btn-add-budget-item"
          onClick={handleOpenAdd}
          className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 max-sm:w-full sm:w-auto text-white text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-md shadow-[#14B8B8]/15 tracking-tight flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 shrink-0 self-stretch sm:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Item Anggaran</span>
        </button>
      </div>

      {/* 2. AGGREGATE SUMMARY MODULES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Planned */}
        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
            <span>TOTAL RENCANA</span>
            <FolderMinus className="w-4 h-4 text-amber-300" />
          </div>
          <div className="text-lg font-black text-[#2F3A3A] font-mono">
            {formatRupiah(aggregates.budgetTotal)}
          </div>
          <span className="text-[10px] text-gray-400">Total anggaran kebutuhan terdaftar</span>
        </div>

        {/* Paid Actual */}
        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
            <span>REALISASI AKTUAL</span>
            <TrendingUp className="w-4 h-4 text-[#14B8B8]" />
          </div>
          <div className="text-lg font-black text-[#14B8B8] font-mono">
            {formatRupiah(aggregates.spendTotal)}
          </div>
          <span className="text-[10px] text-gray-400">Kas nyata yang telah dibayarkan</span>
        </div>

        {/* Savings / Diff */}
        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
            <span>TERSELAMATKAN / SELISIH</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-lg font-black font-mono ${aggregates.diff >= 0 ? "text-emerald-600" : "text-red-500"}`}>
            {formatRupiah(aggregates.diff)}
          </div>
          <span className="text-[10px] text-gray-400">
            {aggregates.diff >= 0 ? "Anggaran tersisa (hemat) 👍" : "Perkiraan over-budget! ⚠️"}
          </span>
        </div>

        {/* Overbudget warning */}
        <div className="bg-[#FFF1D6] rounded-2xl p-4 border border-[#FFF1D6] flex flex-col justify-between">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[#14B8B8]" />
            <span>SIAGA OVERBUDGET</span>
          </div>
          <div className="text-base font-extrabold text-[#2F3A3A] mt-1">
            {aggregates.overCount} Item overbudget
          </div>
          <span className="text-[10px] text-amber-900/60 leading-tight block mt-1">
            “Cek lagi bersama pasangan supaya persiapannya terasa lebih ringan.”
          </span>
        </div>
      </div>

      {/* 3. SEARCH & CONTROL FILTER ROW */}
      <div className="bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 text-[#2F3A3A]/30 w-4 h-4" />
            <input
              id="budget-search"
              type="text"
              placeholder="Cari nama pengeluaran, subkategori, atau catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-[#2F3A3A]/10 rounded-2xl py-3 pl-10 pr-4 text-[#2F3A3A] text-xs placeholder-[#2F3A3A]/40 outline-none focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8] transition-all"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-col sm:flex-row gap-2 shrink-0 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-gray-400 text-xs font-bold shrink-0">
              <Filter className="w-3.5 h-3.5" />
              <span>Saringan:</span>
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-row gap-2 w-full md:w-auto">
              <select
                id="filter-category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A] w-full sm:w-auto font-semibold outline-none focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8] transition-all"
              >
                <option value="Semua">Semua Kategori</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-white border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A] w-full sm:w-auto font-semibold outline-none focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8] transition-all"
              >
                <option value="Semua">Semua Status</option>
                {PAY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select
                id="filter-priority"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="bg-white border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-xs text-[#2F3A3A] w-full sm:w-auto font-semibold outline-none focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8] transition-all"
              >
                <option value="Semua">Semua Prioritas</option>
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 4. DYNAMIC LIST (RESPONSIVE CARDS vs TABLE) */}
      {filteredItems.length === 0 ? (
        <div id="budget-empty-state" className="bg-white border border-[#E8E4FF] rounded-3xl p-10 text-center space-y-3">
          <FolderMinus className="w-12 h-12 text-[#14B8B8] mx-auto opacity-70 animate-bounce" />
          <h3 className="text-sm font-extrabold text-[#2F3A3A]">Tidak ada rincian anggaran yang cocok.</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Tenang ya Moms, data kosong bukan masalah. “Budget belum harus langsung sempurna, yang penting mulai dicatat.” Ketuk tombol Tambah untuk memulai.
          </p>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div id="desktop-budget-table" className="hidden md:block bg-white border border-[#E8E4FF] rounded-3xl overflow-hidden shadow-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF9F5] border-b border-[#E8E4FF] text-xs font-bold text-[#2F3A3A]/60 font-mono">
                  <th className="p-4 cursor-pointer hover:bg-gray-100/50" onClick={() => toggleSort("tanggal")}>Tanggal</th>
                  <th className="p-4">Kebutuhan / Kategori</th>
                  <th className="p-4">Prioritas</th>
                  <th className="p-4 text-right cursor-pointer hover:bg-gray-100/50" onClick={() => toggleSort("rencana")}>Rencana</th>
                  <th className="p-4 text-right cursor-pointer hover:bg-gray-100/50" onClick={() => toggleSort("aktual")}>Aktual</th>
                  <th className="p-4 text-right">Selisih</th>
                  <th className="p-4">Status & Bayar</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E4FF]/40 text-xs">
                {filteredItems.map((item) => {
                  const selisih = item.rencana - item.aktual;
                  const isOver = item.aktual > item.rencana;
                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isOver && item.aktual > 0 ? "bg-red-50/20 text-red-950" : ""
                      }`}
                    >
                      <td className="p-4 font-mono font-semibold">{item.tanggal}</td>
                      <td className="p-4">
                        <div className="font-extrabold text-[#2F3A3A] text-sm">{item.nama}</div>
                        <div className="flex items-center space-x-1.5 mt-1 text-[10px]">
                          <span className="bg-[#DDF7EF] text-[#14B8B8] font-bold px-2 py-0.5 rounded-md">
                            {item.kategori}
                          </span>
                          {item.subkategori && (
                            <span className="bg-[#FAF9F5] text-gray-500 px-2 py-0.5 rounded-md border border-[#2F3A3A]/5">
                              {item.subkategori}
                            </span>
                          )}
                        </div>
                        {item.catatan && (
                          <p className="text-[10px] text-gray-400 mt-1 italic tracking-tight line-clamp-1" title={item.catatan}>
                            📝 {item.catatan}
                          </p>
                        )}
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
                      <td className="p-4 text-right font-mono font-medium">{formatRupiah(item.rencana)}</td>
                      <td className="p-4 text-right font-mono font-bold text-[#14B8B8]">
                        {item.aktual > 0 ? formatRupiah(item.aktual) : "-"}
                      </td>
                      <td className={`p-4 text-right font-mono font-black ${isOver && item.aktual > 0 ? "text-red-500" : "text-emerald-600"}`}>
                        {item.aktual > 0 ? (
                          <>
                            {selisih < 0 ? "-" : ""}
                            {formatRupiah(Math.abs(selisih))}
                            <span className="text-[8px] font-semibold block uppercase">
                              {selisih < 0 ? "Over ⚠️" : "Simpan 👍"}
                            </span>
                          </>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide uppercase inline-block ${
                            item.statusPembayaran === "Lunas" ? "bg-emerald-100 text-emerald-800" :
                            item.statusPembayaran === "DP" ? "bg-amber-100 text-[#14B8B8]" :
                            "bg-rose-50 text-rose-700"
                          }`}>
                            {item.statusPembayaran === "Lunas" && <CheckCircle className="w-3 h-3 inline-block mr-1 -mt-0.5" />}
                            {item.statusPembayaran === "DP" && <Clock className="w-3 h-3 inline-block mr-1 -mt-0.5" />}
                            {item.statusPembayaran}
                          </span>
                          {item.metode && <span className="text-[10px] text-gray-400 block font-semibold">{item.metode}</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center space-x-2">
                          <InstantTooltip content="Edit Anggaran" position="top">
                            <button
                              onClick={() => handleOpenEdit(item)}
                              className="p-1.5 hover:bg-[#DDF7EF] text-gray-500 hover:text-[#14B8B8] rounded-xl transition-all cursor-pointer"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </InstantTooltip>
                          <InstantTooltip content="Duplikat Anggaran" position="top">
                            <button
                              onClick={() => handleDuplicate(item)}
                              className="p-1.5 hover:bg-[#FFF1D6] text-gray-500 hover:text-amber-700 rounded-xl transition-all cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </InstantTooltip>
                          <InstantTooltip content="Hapus Anggaran" position="top">
                            <button
                              onClick={() => handleDelete(item.id, item.nama)}
                              className="p-1.5 hover:bg-red-50 text-gray-500 hover:text-red-600 rounded-xl transition-all cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </InstantTooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARD LISTS VIEW */}
          <div id="mobile-budget-cards" className="md:hidden space-y-3">
            {filteredItems.map((item) => {
              const clockDiff = item.rencana - item.aktual;
              const isOver = item.aktual > item.rencana;
              return (
                <div 
                  key={item.id} 
                  className={`bg-white border rounded-2xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between ${
                    isOver && item.aktual > 0 ? "border-red-200 bg-red-50/10" : "border-[#E8E4FF]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-gray-400">{item.tanggal}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      item.prioritas === "Tinggi" ? "bg-red-50 text-red-600 border border-red-100" :
                      item.prioritas === "Sedang" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                      "bg-gray-50 text-gray-500"
                    }`}>
                      Prioritas: {item.prioritas}
                    </span>
                  </div>

                  <div className="my-2.5">
                    <h4 className="font-extrabold text-sm text-[#2F3A3A]">{item.nama}</h4>
                    <p className="text-[11px] text-gray-400 mt-0.5 mb-2">{item.kategori} {item.subkategori ? `• ${item.subkategori}` : ""}</p>
                    
                    {item.catatan && (
                      <div className="bg-[#FAF9F5] p-2 rounded-xl text-[10px] text-gray-500 mb-2 leading-relaxed">
                        📝 {item.catatan}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 bg-[#FAF9F5]/60 p-2.5 rounded-xl border border-gray-100 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold">Rencana</span>
                        <strong className="font-mono text-gray-700">{formatRupiah(item.rencana)}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-400 block font-semibold text-right">Aktual</span>
                        <strong className="font-mono text-[#14B8B8] block text-right">
                          {item.aktual > 0 ? formatRupiah(item.aktual) : "-"}
                        </strong>
                      </div>
                    </div>

                    {item.aktual > 0 && (
                      <div className="mt-2 text-right">
                        <span className={`text-[10px] font-extrabold ${isOver ? "text-red-500" : "text-emerald-600"}`}>
                          {isOver ? `Over budget: ${formatRupiah(Math.abs(clockDiff))} ⚠️` : `Sisa hemat: ${formatRupiah(clockDiff)} 👍`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[#E8E4FF]/40 pt-2.5 mt-1 flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block ${
                      item.statusPembayaran === "Lunas" ? "bg-emerald-100 text-emerald-800" :
                      item.statusPembayaran === "DP" ? "bg-amber-100 text-[#14B8B8]" :
                      "bg-rose-50 text-rose-700"
                    }`}>
                      {item.statusPembayaran}
                    </span>
                    
                    <div className="flex space-x-1.5">
                      <InstantTooltip content="Edit Anggaran" position="top">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1.5 border border-gray-100 bg-white hover:bg-[#DDF7EF] text-[#2F3A3A] rounded-lg cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </InstantTooltip>
                      <InstantTooltip content="Duplikat Anggaran" position="top">
                        <button
                          onClick={() => handleDuplicate(item)}
                          className="p-1.5 border border-gray-100 bg-white hover:bg-slate-100 text-[#2F3A3A] rounded-lg cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </InstantTooltip>
                      <InstantTooltip content="Hapus Anggaran" position="top">
                        <button
                          onClick={() => handleDelete(item.id, item.nama)}
                          className="p-1.5 border border-red-100 bg-white hover:bg-red-50 text-red-600 rounded-lg cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </InstantTooltip>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* 5. ADD / EDIT DIALOG FORM MODAL */}
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
              id="budget-modal-card"
              className="w-full max-w-lg bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-6 shadow-2xl relative overflow-hidden my-auto max-h-[90vh] flex flex-col z-10"
            >
              <div className="flex justify-between items-start shrink-0 mb-4 pb-3 border-b border-[#E8E4FF]/40">
                <div className="flex items-center space-x-2 text-[#14B8B8]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <h3 className="text-lg font-black text-[#2F3A3A] tracking-tight">
                    {editingItem ? "Edit Kebutuhan" : "Tambahkan Kebutuhan Baru"}
                  </h3>
                </div>
                <button 
                  id="close-budget-modal"
                  onClick={() => setFormOpen(false)}
                  className="text-[#2F3A3A]/40 hover:text-[#2F3A3A] hover:bg-gray-100 p-2 rounded-full border border-gray-100 transition-colors cursor-pointer bg-white"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form id="budget-item-form" onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="budget-form-tanggal" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Tanggal Persiapan
                    </label>
                    <input
                      id="budget-form-tanggal"
                      type="date"
                      required
                      value={tanggal}
                      onChange={(e) => setTanggal(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="budget-form-nama" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Nama Kebutuhan <span className="text-[#14B8B8]">*</span>
                    </label>
                    <input
                      id="budget-form-nama"
                      type="text"
                      required
                      placeholder="e.g. Kasur Bayi / USG Trimester 2"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="budget-form-category" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Kategori Utama
                    </label>
                    <select
                      id="budget-form-category"
                      value={kategori}
                      onChange={(e) => setKategori(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    >
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="budget-form-sub" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Subkategori <span className="text-gray-400 font-normal">(Opsional)</span>
                    </label>
                    <input
                      id="budget-form-sub"
                      type="text"
                      placeholder="e.g. Furnitur / Kontrol Bulanan"
                      value={subkategori}
                      onChange={(e) => setSubkategori(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="budget-form-rencana" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Anggaran Rencana (Rp)
                    </label>
                    <input
                      id="budget-form-rencana"
                      type="number"
                      placeholder="e.g. 500000"
                      value={rencana}
                      onChange={(e) => setRencana(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="budget-form-aktual" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Pengeluaran Aktual (Rp)
                    </label>
                    <input
                      id="budget-form-aktual"
                      type="number"
                      placeholder="e.g. 450000 (0 jika belum dibeli)"
                      value={aktual}
                      onChange={(e) => setAktual(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="budget-form-pembayaran" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Status Bayar
                    </label>
                    <select
                      id="budget-form-pembayaran"
                      value={statusPembayaran}
                      onChange={(e) => setStatusPembayaran(e.target.value as any)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    >
                      {PAY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="budget-form-prioritas" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Prioritas Kebutuhan
                    </label>
                    <select
                      id="budget-form-prioritas"
                      value={prioritas}
                      onChange={(e) => setPrioritas(e.target.value as any)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    >
                      {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="budget-form-metode" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Metode Bayar
                  </label>
                  <input
                    id="budget-form-metode"
                    type="text"
                    placeholder="e.g. Cash / Debit BCA / Kartu Kredit"
                    value={metode}
                    onChange={(e) => setMetode(e.target.value)}
                    className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="budget-form-catatan" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Catatan Keterangan Tambahan
                  </label>
                  <textarea
                    id="budget-form-catatan"
                    placeholder="e.g. Beli di Toko Sebelah, garansi 1 tahun, atau kado dari Tante..."
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 h-16 resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4 bg-[#FAF9F5] shrink-0 border-t border-[#E8E4FF]/40">
                  <button
                    id="cancel-budget-form"
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="border border-[#2F3A3A]/10 text-[#2F3A3A]/70 font-bold rounded-2xl py-2.5 px-6 text-xs hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    Urungkan
                  </button>
                  <button
                    id="submit-budget-form"
                    type="submit"
                    className="bg-[#14B8B8] hover:bg-[#0E9090] text-white font-black rounded-2xl py-2.5 px-8 text-xs shadow-md shadow-[#14B8B8]/15 hover:shadow-lg transition-all cursor-pointer"
                  >
                    {editingItem ? "Perbarui Catatan" : "Masukkan Anggaran"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* CUSTOM CONFIRMATION DIALOG FOR DELETE (IFRAME SAFE PORTAL) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {itemToDelete && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setItemToDelete(null)}
                className="fixed inset-0 bg-[#2F3A3A]/60 backdrop-blur-xs cursor-pointer"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white border border-red-100 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 text-center z-10 pointer-events-auto text-[#2F3A3A]"
              >
                <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-500 animate-pulse">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Hapus Anggaran ini?</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Moms & Dads, apakah yakin ingin menghapus catatan anggaran <strong className="text-gray-700 font-mono break-all">{itemToDelete.nama}</strong>? Pengeluaran ini tidak bisa dikembalikan setelah dihapus.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setItemToDelete(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-red-200"
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
