import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { ChecklistItem } from "../types";
import { 
  CheckSquare, 
  Square, 
  Plus, 
  Trash2, 
  Sparkles, 
  Heart,
  TrendingUp,
  Filter,
  Calendar,
  AlertCircle,
  X,
  Edit2
} from "lucide-react";
import InstantTooltip from "./InstantTooltip";
import { motion, AnimatePresence } from "motion/react";

interface ChecklistManagerProps {
  checklistItems: ChecklistItem[];
  onToggleStatus: (id: string, nextStatusChecklist?: "Belum Dimulai" | "Dipersiapkan" | "Selesai") => void;
  onUpdateStatusOnly: (id: string, statusChecklist: "Belum Dimulai" | "Dipersiapkan" | "Selesai") => void;
  onAddItem: (item: Omit<ChecklistItem, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onEditItem?: (id: string, item: Partial<Omit<ChecklistItem, "id" | "userId" | "createdAt" | "updatedAt">>) => void;
  onDeleteItem: (id: string) => void;
  isDemo: boolean;
  onTriggerLogin: () => void;
}

const MONTHS_MAP: Record<number, { name: string; weeks: number[] }[]> = {
  1: [
    { name: "Bulan 1", weeks: [1, 2, 3, 4] },
    { name: "Bulan 2", weeks: [5, 6, 7, 8] },
    { name: "Bulan 3", weeks: [9, 10, 11, 12, 13] },
  ],
  2: [
    { name: "Bulan 4", weeks: [14, 15, 16, 17] },
    { name: "Bulan 5", weeks: [18, 19, 20, 21, 22] },
    { name: "Bulan 6", weeks: [23, 24, 25, 26, 27] },
  ],
  3: [
    { name: "Bulan 7", weeks: [28, 29, 30, 31] },
    { name: "Bulan 8", weeks: [32, 33, 34, 35] },
    { name: "Bulan 9", weeks: [36, 37, 38, 39, 40] },
  ]
};

export default function ChecklistManager({
  checklistItems = [],
  onToggleStatus,
  onUpdateStatusOnly,
  onAddItem,
  onEditItem,
  onDeleteItem,
  isDemo,
  onTriggerLogin
}: ChecklistManagerProps) {
  
  // STATS CALCULATIONS
  const stats = useMemo(() => {
    const total = checklistItems.length;
    const completed = checklistItems.filter(item => item.status === "Selesai").length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // T1 stats
    const t1Items = checklistItems.filter(i => i.trimester === 1);
    const t1Comp = t1Items.filter(i => i.status === "Selesai").length;
    
    // T2 stats
    const t2Items = checklistItems.filter(i => i.trimester === 2);
    const t2Comp = t2Items.filter(i => i.status === "Selesai").length;

    // T3 stats
    const t3Items = checklistItems.filter(i => i.trimester === 3);
    const t3Comp = t3Items.filter(i => i.status === "Selesai").length;

    return {
      total,
      completed,
      percent,
      t1: { total: t1Items.length, comp: t1Comp },
      t2: { total: t2Items.length, comp: t2Comp },
      t3: { total: t3Items.length, comp: t3Comp }
    };
  }, [checklistItems]);

  // SECTION A: Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTrimester, setNewTrimester] = useState<1 | 2 | 3>(1);
  const [newBulan, setNewBulan] = useState("Bulan 1");
  const [newMinggu, setNewMinggu] = useState<number>(1);
  const [newStatusChecklist, setNewStatusChecklist] = useState<"Belum Dimulai" | "Dipersiapkan" | "Selesai">("Belum Dimulai");

  // SECTION B: Filter States
  const [selectedTrimester, setSelectedTrimester] = useState<number | "Semua">("Semua");
  const [selectedBulan, setSelectedBulan] = useState<string | "Semua">("Semua");
  const [selectedMinggu, setSelectedMinggu] = useState<number | "Semua">("Semua");
  const [taskFilter, setTaskFilter] = useState<"Semua" | "Belum Dimulai" | "Dipersiapkan" | "Selesai">("Semua");
  const [itemToDelete, setItemToDelete] = useState<{ id: string; nama: string } | null>(null);

  // EDIT STATE
  const [editingItem, setEditingItem] = useState<ChecklistItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editTrimester, setEditTrimester] = useState<1 | 2 | 3>(1);
  const [editBulan, setEditBulan] = useState("Bulan 1");
  const [editMinggu, setEditMinggu] = useState<number>(1);
  const [editStatusChecklist, setEditStatusChecklist] = useState<"Belum Dimulai" | "Dipersiapkan" | "Selesai">("Belum Dimulai");

  // HELPERS
  const getWeekDisplay = (item: ChecklistItem) => {
    if (item.minggu) return `Minggu ${item.minggu}`;
    const monthNum = parseInt(item.bulan.replace("Bulan ", "")) || 1;
    const defaults: Record<number, string> = {
      1: "Minggu 1",
      2: "Minggu 5",
      3: "Minggu 9",
      4: "Minggu 14",
      5: "Minggu 18",
      6: "Minggu 23",
      7: "Minggu 28",
      8: "Minggu 32",
      9: "Minggu 36",
    };
    return defaults[monthNum] || "Minggu 1";
  };

  const getWeekNumber = (item: ChecklistItem): number => {
    if (item.minggu) return item.minggu;
    const display = getWeekDisplay(item);
    return parseInt(display.replace("Minggu ", "")) || 1;
  };

  const getStatusLabel = (item: ChecklistItem): "Belum Dimulai" | "Dipersiapkan" | "Selesai" => {
    if (item.status === "Selesai") return "Selesai";
    return item.statusChecklist || "Belum Dimulai";
  };

  // HANDLERS
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDemo) {
      onTriggerLogin();
      return;
    }

    if (!newTitle.trim()) return;

    onAddItem({
      judul: newTitle.trim(),
      status: newStatusChecklist === "Selesai" ? "Selesai" : "Belum Selesai",
      trimester: newTrimester,
      bulan: newBulan,
      kategori: "Kustom",
      minggu: newMinggu,
      statusChecklist: newStatusChecklist
    });

    setNewTitle("");
    setIsAddModalOpen(false);
  };

  const handleToggle = (item: ChecklistItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    const currentStatus = item.status;
    const nextStatusChecklist: "Belum Dimulai" | "Selesai" = currentStatus === "Selesai" ? "Belum Dimulai" : "Selesai";
    onToggleStatus(item.id, nextStatusChecklist);
  };

  const cycleStatus = (item: ChecklistItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    const currentLevel = getStatusLabel(item);
    let nextLevel: "Belum Dimulai" | "Dipersiapkan" | "Selesai";
    if (currentLevel === "Belum Dimulai") {
      nextLevel = "Dipersiapkan";
    } else if (currentLevel === "Dipersiapkan") {
      nextLevel = "Selesai";
    } else {
      nextLevel = "Belum Dimulai";
    }
    onUpdateStatusOnly(item.id, nextLevel);
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

  const handleOpenEdit = (item: ChecklistItem) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setEditingItem(item);
    setEditTitle(item.judul);
    setEditTrimester(item.trimester as 1 | 2 | 3);
    setEditBulan(item.bulan);
    setEditMinggu(item.minggu || 1);
    setEditStatusChecklist(getStatusLabel(item));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    if (!editTitle.trim()) return;

    if (onEditItem) {
      onEditItem(editingItem.id, {
        judul: editTitle.trim(),
        trimester: editTrimester,
        bulan: editBulan,
        minggu: editMinggu,
        statusChecklist: editStatusChecklist
      });
    }

    setEditingItem(null);
  };

  // FILTERED RESULT
  const filteredChecklist = useMemo(() => {
    return checklistItems.filter((item) => {
      // 1. Trimester Match
      const matchesTri = selectedTrimester === "Semua" || item.trimester === Number(selectedTrimester);
      
      // 2. Month Match (Only relevant if trimester matches and is not "Semua")
      let matchesBulan = true;
      if (selectedTrimester !== "Semua") {
        matchesBulan = selectedBulan === "Semua" || item.bulan === selectedBulan;
      }

      // 3. Week Match (Only relevant if trimester and month are not "Semua")
      let matchesMinggu = true;
      if (selectedTrimester !== "Semua" && selectedBulan !== "Semua") {
        matchesMinggu = selectedMinggu === "Semua" || getWeekNumber(item) === Number(selectedMinggu);
      }

      // 4. Status Match
      const itemStatus = getStatusLabel(item);
      const matchesStatus = taskFilter === "Semua" || itemStatus === taskFilter;

      return matchesTri && matchesBulan && matchesMinggu && matchesStatus;
    });
  }, [checklistItems, selectedTrimester, selectedBulan, selectedMinggu, taskFilter]);

  return (
    <div id="checklist-view" className="space-y-8 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in font-sans">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#14B8B8] uppercase tracking-widest font-mono">
            Pantauan Milestones
          </span>
          <h2 className="text-2xl font-black text-[#2F3A3A] tracking-tight">
            Pregnancy Planner & Trimester Checklist
          </h2>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Kelola rincian persiapan, agenda medis, pemenuhan nutrisi, dan belanja perlengkapan bayi yang ramah untuk dipantau kapan saja.
          </p>
        </div>
        <button
          id="section-add-custom-checklist"
          onClick={() => setIsAddModalOpen(true)}
          type="button"
          className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 max-sm:w-full sm:w-auto text-white text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-md shadow-[#14B8B8]/15 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 shrink-0 self-stretch sm:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Checklist</span>
        </button>
      </div>

      {/* PROGRESS OVERVIEW PANEL */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono block mb-2">
            OVERALL PREPARATION PROGRESS
          </span>
          <div>
            <div className="flex justify-between items-baseline mb-1">
              <strong className="text-3xl font-black text-[#14B8B8] font-mono">{stats.percent}%</strong>
              <span className="text-xs text-gray-400 font-bold">{stats.completed} dari {stats.total} Selesai</span>
            </div>
            <div className="w-full bg-[#FAF9F5] h-2.5 rounded-full overflow-hidden border border-gray-100">
              <div className="bg-[#14B8B8] h-full transition-all duration-500" style={{ width: `${stats.percent}%` }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-[#2F3A3A]/40 text-xs font-bold font-mono">
            <span>TRIMESTER 1</span>
            <span className="bg-[#FAF9F5] px-2 py-0.5 rounded text-[10px] font-mono">Bulan 1-3</span>
          </div>
          <div className="mt-3">
            <span className="text-sm font-extrabold text-[#2F3A3A] block">{stats.t1.comp} dari {stats.t1.total} Selesai</span>
            <span className="text-[10px] text-gray-400 leading-tight">Konfirmasi janin, asam folat, adaptasi tubuh awal.</span>
          </div>
        </div>

        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-[#2F3A3A]/40 text-xs font-bold font-mono">
            <span>TRIMESTER 2</span>
            <span className="bg-[#FAF9F5] px-2 py-0.5 rounded text-[10px] font-mono">Bulan 4-6</span>
          </div>
          <div className="mt-3">
            <span className="text-sm font-extrabold text-[#2F3A3A] block">{stats.t2.comp} dari {stats.t2.total} Selesai</span>
            <span className="text-[10px] text-gray-400 leading-tight">Screening anomali organ, beli perlengkapan bayi.</span>
          </div>
        </div>

        <div className="bg-white border border-[#E8E4FF] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-center text-[#2F3A3A]/40 text-xs font-bold font-mono">
            <span>TRIMESTER 3</span>
            <span className="bg-[#FAF9F5] px-2 py-0.5 rounded text-[10px] font-mono">Bulan 7-9</span>
          </div>
          <div className="mt-3">
            <span className="text-sm font-extrabold text-[#2F3A3A] block">{stats.t3.comp} dari {stats.t3.total} Selesai</span>
            <span className="text-[10px] text-gray-400 leading-tight">Hospital bag, persalinan, menyambut buah hati.</span>
          </div>
        </div>
      </div>

      {/* PORTAL MODAL FORM */}
      {typeof window !== "undefined" && isAddModalOpen && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsAddModalOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl z-10 border border-[#E8E4FF] animate-fade-in space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-[#14B8B8] font-bold text-sm">
                <Sparkles className="w-5 h-5 text-[#14B8B8] shrink-0" />
                <h3 className="text-[#2F3A3A] font-black text-base md:text-lg">Tambah Agenda Kustom Baru</h3>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-5">
              <div className="space-y-4">
                {/* Input Deskripsi Agenda */}
                <div className="space-y-1.5">
                  <label htmlFor="checklist-title-input" className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Deskripsi Agenda / Rencana <span className="text-[#14B8B8]">*</span>
                  </label>
                  <input
                    id="checklist-title-input"
                    type="text"
                    placeholder="e.g. Booking USG 4D Fetomaternal, beli pompa ASI hospital grade..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                    className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-2xl py-3 px-4 text-xs text-[#2F3A3A] placeholder-[#2F3A3A]/40 outline-none focus:border-[#14B8B8] focus:bg-white focus:ring-1 focus:ring-[#14B8B8] transition-all font-sans"
                  />
                </div>

                {/* Pilihan Trimester */}
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Pilih Trimester
                  </span>
                  <div id="new-trimester-chips" className="flex gap-2">
                    {([1, 2, 3] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setNewTrimester(t);
                          const defaultMonth = t === 1 ? "Bulan 1" : t === 2 ? "Bulan 4" : "Bulan 7";
                          setNewBulan(defaultMonth);
                          const defaultWeek = t === 1 ? 1 : t === 2 ? 14 : 28;
                          setNewMinggu(defaultWeek);
                        }}
                        className={`flex-1 py-2 px-3 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                          newTrimester === t
                            ? "bg-[#14B8B8] text-white border-[#14B8B8] shadow-sm shadow-[#14B8B8]/15"
                            : "bg-white text-[#2F3A3A]/75 border-gray-200 hover:border-[#14B8B8]/30"
                        }`}
                      >
                        Trimester {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pilihan Bulan */}
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Pilih rentang bulan
                  </span>
                  <div id="new-month-chips" className="flex flex-wrap gap-1.5">
                    {MONTHS_MAP[newTrimester].map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => {
                          setNewBulan(m.name);
                          setNewMinggu(m.weeks[0]);
                        }}
                        className={`py-2 px-3.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          newBulan === m.name
                            ? "bg-[#FFF1D6] text-[#A16207] border-[#FCD34D]"
                            : "bg-[#FAF9F5] text-[#2F3A3A]/70 border-gray-200 hover:border-[#FCD34D]/30"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pilihan Minggu */}
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Pilih Spesifik Minggu Kehamilan
                  </span>
                  <div id="new-week-chips" className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-slate-100 rounded-xl bg-[#FAF9F5]/50">
                    {MONTHS_MAP[newTrimester].find(m => m.name === newBulan)?.weeks.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setNewMinggu(w)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          newMinggu === w
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-white text-[#2F3A3A]/70 border-gray-200 hover:border-emerald-300/30"
                        }`}
                      >
                        Minggu {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pilihan Status Awal */}
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Status Persiapan Awal
                  </span>
                  <div id="new-status-chips" className="flex flex-wrap gap-2">
                    {(["Belum Dimulai", "Dipersiapkan", "Selesai"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setNewStatusChecklist(s)}
                        className={`py-2 px-4 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          newStatusChecklist === s
                            ? s === "Selesai"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm"
                              : s === "Dipersiapkan"
                              ? "bg-[#FFF9E6] text-[#D97706] border-[#FCD34D] shadow-sm"
                              : "bg-gray-100 text-gray-800 border-gray-300 shadow-sm"
                            : "bg-white text-[#2F3A3A]/60 border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-extrabold rounded-2xl py-3 px-6 transition-colors cursor-pointer"
                >
                  Urungkan
                </button>
                <button
                  id="checklist-submit-custom-btn"
                  type="submit"
                  className="bg-[#14B8B8] hover:bg-[#0E9090] text-white text-xs font-black rounded-2xl py-3 px-6 shadow-md shadow-[#14B8B8]/15 hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer font-sans"
                >
                  <Plus className="w-4 h-4" />
                  <span>Masukkan ke Checklist</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* PORTAL CONFIRM DELETE */}
      {typeof window !== "undefined" && itemToDelete && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 animate-fade-in">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity" 
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
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <h4 className="text-base font-black text-[#2F3A3A]">Hapus Agenda?</h4>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Moms & Dads, apakah yakin ingin menghapus agenda <strong className="text-[#2F3A3A] font-extrabold">"{itemToDelete.nama}"</strong>? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setItemToDelete(null)}
                type="button"
                className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-2xl py-3 transition-colors cursor-pointer"
              >
                Urungkan
              </button>
              <button
                onClick={confirmDelete}
                type="button"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-2xl py-3 shadow-md shadow-red-500/15 hover:shadow-lg transition-colors cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}

      {/* PORTAL EDIT FORM */}
      {typeof window !== "undefined" && editingItem && createPortal(
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={() => setEditingItem(null)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl z-10 border border-[#E8E4FF] animate-fade-in space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2 text-[#14B8B8] font-bold text-sm">
                <Sparkles className="w-5 h-5 text-[#14B8B8] shrink-0" />
                <h3 className="text-[#2F3A3A] font-black text-base md:text-lg font-sans">Ubah Agenda Checklist</h3>
              </div>
              <button 
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div className="space-y-4 font-sans">
                {/* Input Deskripsi Agenda */}
                <div className="space-y-1.5">
                  <label htmlFor="edit-checklist-title-input" className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Deskripsi Agenda / Rencana <span className="text-[#14B8B8]">*</span>
                  </label>
                  <input
                    id="edit-checklist-title-input"
                    type="text"
                    placeholder="e.g. Booking USG 4D Fetomaternal, beli pompa ASI hospital grade..."
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    required
                    className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-2xl py-3 px-4 text-xs text-[#2F3A3A] placeholder-[#2F3A3A]/40 outline-none focus:border-[#14B8B8] focus:bg-white focus:ring-1 focus:ring-[#14B8B8] transition-all"
                  />
                </div>

                {/* Pilihan Trimester */}
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Pilih Trimester
                  </span>
                  <div id="edit-trimester-chips" className="flex gap-2">
                    {([1, 2, 3] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setEditTrimester(t);
                          const defaultMonth = t === 1 ? "Bulan 1" : t === 2 ? "Bulan 4" : "Bulan 7";
                          setEditBulan(defaultMonth);
                          const defaultWeekVal = t === 1 ? 1 : t === 2 ? 14 : 28;
                          setEditMinggu(defaultWeekVal);
                        }}
                        className={`flex-1 py-2 px-3 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                          editTrimester === t
                            ? "bg-[#14B8B8] text-white border-[#14B8B8] shadow-sm shadow-[#14B8B8]/15"
                            : "bg-white text-[#2F3A3A]/75 border-gray-200 hover:border-[#14B8B8]/30"
                        }`}
                      >
                        Trimester {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pilihan Bulan */}
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Pilih rentang bulan
                  </span>
                  <div id="edit-month-chips" className="flex flex-wrap gap-1.5">
                    {MONTHS_MAP[editTrimester].map((m) => (
                      <button
                        key={m.name}
                        type="button"
                        onClick={() => {
                          setEditBulan(m.name);
                          setEditMinggu(m.weeks[0]);
                        }}
                        className={`py-2 px-3.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          editBulan === m.name
                            ? "bg-[#FFF1D6] text-[#A16207] border-[#FCD34D]"
                            : "bg-[#FAF9F5] text-[#2F3A3A]/70 border-gray-200 hover:border-[#FCD34D]/30"
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pilihan Minggu */}
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Pilih Spesifik Minggu Kehamilan
                  </span>
                  <div id="edit-week-chips" className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 border border-slate-100 rounded-xl bg-[#FAF9F5]/50">
                    {MONTHS_MAP[editTrimester].find(m => m.name === editBulan)?.weeks.map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setEditMinggu(w)}
                        className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          editMinggu === w
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                            : "bg-white text-[#2F3A3A]/70 border-gray-200 hover:border-emerald-300/30"
                        }`}
                      >
                        Minggu {w}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pilihan Status Awal */}
                <div className="space-y-2">
                  <span className="block text-xs font-extrabold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Status Capaian
                  </span>
                  <div id="edit-status-chips" className="flex flex-wrap gap-2">
                    {(["Belum Dimulai", "Dipersiapkan", "Selesai"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setEditStatusChecklist(s)}
                        className={`py-2 px-4 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          editStatusChecklist === s
                            ? s === "Selesai"
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm"
                              : s === "Dipersiapkan"
                              ? "bg-[#FFF9E6] text-[#D97706] border-[#FCD34D] shadow-sm"
                              : "bg-gray-100 text-gray-800 border-gray-300 shadow-sm"
                            : "bg-white text-[#2F3A3A]/60 border-gray-100 hover:bg-gray-50"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-extrabold rounded-2xl py-3 px-6 transition-colors cursor-pointer font-sans"
                >
                  Urungkan
                </button>
                <button
                  type="submit"
                  className="bg-[#14B8B8] hover:bg-[#0E9090] text-white text-xs font-black rounded-2xl py-3 px-6 shadow-md shadow-[#14B8B8]/15 hover:shadow-lg transition-all flex items-center space-x-1.5 cursor-pointer font-sans"
                >
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* SECTION B: Filter Checklist */}
      <div id="section-filter-checklist" className="bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-slate-500 font-bold text-xs font-mono uppercase tracking-wider">
            <Filter className="w-4 h-4 text-[#14B8B8]" />
            <span>Penyaringan Rencana & Checklist</span>
          </div>
          {(selectedTrimester !== "Semua" || selectedBulan !== "Semua" || selectedMinggu !== "Semua" || taskFilter !== "Semua") && (
            <button
              onClick={() => {
                setSelectedTrimester("Semua");
                setSelectedBulan("Semua");
                setSelectedMinggu("Semua");
                setTaskFilter("Semua");
              }}
              className="text-[10px] font-black text-[#14B8B8] hover:text-[#0E9090] transition-colors"
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Trimester Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">
              Langkah Trimester
            </label>
            <select
              value={selectedTrimester}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedTrimester(val === "Semua" ? "Semua" : Number(val));
                setSelectedBulan("Semua");
                setSelectedMinggu("Semua");
              }}
              className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 px-3.5 text-xs text-[#2F3A3A] font-bold outline-none cursor-pointer focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8] transition-all"
            >
              <option value="Semua">Semua Trimester</option>
              <option value={1}>Trimester 1 (Bulan 1-3)</option>
              <option value={2}>Trimester 2 (Bulan 4-6)</option>
              <option value={3}>Trimester 3 (Bulan 7-9)</option>
            </select>
          </div>

          {/* 2. Month Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">
              Urutan Bulan
            </label>
            <select
              disabled={selectedTrimester === "Semua"}
              value={selectedBulan}
              onChange={(e) => {
                setSelectedBulan(e.target.value);
                setSelectedMinggu("Semua");
              }}
              className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 px-3.5 text-xs text-[#2F3A3A] font-bold outline-none cursor-pointer focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8] transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              <option value="Semua">Semua Bulan</option>
              {selectedTrimester !== "Semua" && MONTHS_MAP[selectedTrimester as 1 | 2 | 3]?.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Week Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">
              Fokus Kegiatan Minggu
            </label>
            <select
              disabled={selectedTrimester === "Semua" || selectedBulan === "Semua"}
              value={selectedMinggu}
              onChange={(e) => {
                const val = e.target.value;
                setSelectedMinggu(val === "Semua" ? "Semua" : Number(val));
              }}
              className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 px-3.5 text-xs text-[#2F3A3A] font-bold outline-none cursor-pointer focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8] transition-all disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed"
            >
              <option value="Semua">Semua Minggu</option>
              {selectedTrimester !== "Semua" && selectedBulan !== "Semua" && 
                MONTHS_MAP[selectedTrimester as 1 | 2 | 3]
                  ?.find(m => m.name === selectedBulan)
                  ?.weeks?.map((w) => (
                    <option key={w} value={w}>
                      Minggu {w}
                    </option>
                  ))
              }
            </select>
          </div>

          {/* 4. Status Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">
              Status Capaian
            </label>
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value as any)}
              className="w-full bg-white border border-slate-200/80 rounded-xl py-2.5 px-3.5 text-xs text-[#2F3A3A] font-bold outline-none cursor-pointer focus:border-[#14B8B8] focus:ring-1 focus:ring-[#14B8B8] transition-all"
            >
              <option value="Semua">Semua Status</option>
              <option value="Belum Dimulai">Belum Dimulai</option>
              <option value="Dipersiapkan">Dipersiapkan</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>
        {selectedTrimester === "Semua" && (
          <p className="text-[10px] text-gray-400 text-center sm:text-left">
            💡 Pilih Trimester terlebih dahulu untuk memilih filter Bulan dan Minggu spesifik secara otomatis.
          </p>
        )}
      </div>

      {/* RENDER CHECKLIST CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black text-[#2F3A3A] uppercase tracking-wider font-mono">
            Agenda Kegiatan ({filteredChecklist.length})
          </h4>
          {selectedTrimester !== "Semua" && (
            <span className="text-[11px] text-gray-400 font-medium">
              Saringan aktif: Trimester {selectedTrimester} {selectedBulan !== "Semua" ? `• ${selectedBulan}` : ""} {selectedMinggu !== "Semua" ? `• Minggu ${selectedMinggu}` : ""}
            </span>
          )}
        </div>

        {filteredChecklist.length === 0 ? (
          <div className="bg-white border border-[#E8E4FF] rounded-3xl p-12 text-center space-y-3">
            <CheckSquare className="w-12 h-12 text-gray-200 mx-auto" />
            <h4 className="text-sm font-bold text-[#2F3A3A]">Tidak ada checklist untuk filter terpilih.</h4>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
              Moms & Dads, silakan bersihkan filter di atas atau tambah agenda kustom baru di formulir panel atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredChecklist.map((item) => {
              const isChecked = item.status === "Selesai";
              const currentStatusLabel = getStatusLabel(item);

              return (
                <div 
                  key={item.id}
                  className={`bg-white border rounded-2xl p-4 shadow-xs flex items-center justify-between transition-all ${
                    isChecked 
                      ? "border-emerald-100 bg-emerald-50/5 text-[#2F3A3A]/55" 
                      : "border-[#E8E4FF] hover:border-[#14B8B8]/30"
                  }`}
                >
                  <div className="flex items-start space-x-3.5 pr-4 flex-1">
                    {/* Tick box button with Tooltip */}
                    <InstantTooltip content={isChecked ? "Tandai Belum Selesai" : "Tandai Selesai"} position="right">
                      <button
                        onClick={() => handleToggle(item)}
                        className={`p-0.5 rounded-lg shrink-0 mt-0.5 cursor-pointer transition-colors ${
                          isChecked ? "text-[#14B8B8]" : "text-gray-300 hover:text-[#14B8B8]"
                        }`}
                        id={`check-badge-${item.id}`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-6 h-6 shrink-0 text-[#14B8B8]" />
                        ) : (
                          <Square className="w-6 h-6 shrink-0 text-gray-300" />
                        )}
                      </button>
                    </InstantTooltip>

                    <div className="space-y-2 flex-1">
                      {/* Title */}
                      <span 
                        className={`text-xs sm:text-sm font-bold block leading-relaxed ${
                          isChecked ? "line-through text-gray-400 font-semibold" : "text-[#2F3A3A]"
                        }`}
                      >
                        {item.judul}
                      </span>
                      
                      {/* Row of badges */}
                      <div className="flex flex-wrap gap-1.5 items-center">
                        <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md border border-slate-200/50">
                          Trimester {item.trimester}
                        </span>
                        
                        <span className="text-[9px] bg-[#FFF1D6] text-[#A16207] font-bold px-2 py-0.5 rounded-md border border-[#FCD34D]/35">
                          {item.bulan}
                        </span>

                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200/40">
                          {getWeekDisplay(item)}
                        </span>

                        {/* Status badge with CYCLE functionality */}
                        <InstantTooltip content="Hubungkan ke status kustom: Klik untuk putar status" position="top">
                          <button
                            type="button"
                            onClick={() => cycleStatus(item)}
                            className={`text-[9px] font-black px-2 py-0.5 rounded-md border cursor-pointer hover:scale-105 active:scale-95 transition-all uppercase tracking-wider ${
                              currentStatusLabel === "Selesai"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : currentStatusLabel === "Dipersiapkan"
                                ? "bg-[#FFF9E6] text-[#D97706] border-[#FCD34D]"
                                : "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {currentStatusLabel}
                          </button>
                        </InstantTooltip>

                        {item.kategori && (
                          <span className="text-[9px] text-gray-400 font-bold italic py-0.5 px-1 ml-1">
                            Kategori: {item.kategori}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions (Edit and Delete) */}
                  <div className="flex items-center space-x-1 shrink-0">
                    <InstantTooltip content="Edit Agenda" position="top">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 hover:bg-[#FAF9F5] text-gray-400 hover:text-[#14B8B8] rounded-xl transition-colors cursor-pointer"
                        id={`edit-chk-${item.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </InstantTooltip>

                    <InstantTooltip content="Hapus Agenda" position="top">
                      <button
                        onClick={() => handleDelete(item.id, item.judul)}
                        className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                        id={`del-chk-${item.id}`}
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
      </div>

      {/* CALMING QUOTE */}
      <div className="bg-[#FFF1D6]/70 border border-[#FFF1D6] rounded-3xl p-5 text-center max-w-2xl mx-auto text-xs text-[#2F3A3A] italic leading-relaxed">
        “Pelan-pelan ya, Moms & Dads. Setiap langkah kecil dalam checklist ini mendekatkan kita pada hari bahagia menyapa Si Kecil dengan siap dan riang.”
      </div>

    </div>
  );
}
