import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { MedicalVisit } from "../types";
import { formatRupiah } from "../pregnancyUtils";
import { 
  Stethoscope, 
  Plus, 
  Search, 
  Calendar, 
  Heart, 
  Activity, 
  Clock, 
  Trash2, 
  Edit2, 
  FileText,
  DollarSign,
  AlertCircle,
  Sparkles,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InstantTooltip from "./InstantTooltip";

interface MedicalVisitTrackerProps {
  medicalVisits: MedicalVisit[];
  onAddVisit: (visit: Omit<MedicalVisit, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onEditVisit: (id: string, visit: Partial<MedicalVisit>) => void;
  onDeleteVisit: (id: string) => void;
  isDemo: boolean;
  onTriggerLogin: () => void;
}

export default function MedicalVisitTracker({
  medicalVisits = [],
  onAddVisit,
  onEditVisit,
  onDeleteVisit,
  isDemo,
  onTriggerLogin
}: MedicalVisitTrackerProps) {
  
  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVisit, setEditingVisit] = useState<MedicalVisit | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; tanggal: string } | null>(null);

  // Calculate next upcoming visit based on the latest visit (by tanggalKunjungan descending) that advises a next schedule
  const nextVisit = useMemo(() => {
    if (!medicalVisits || medicalVisits.length === 0) return null;

    // Filter to visits that have a next schedule date specified, and sort by latest actual visit date
    const sortedByVisitDateDesc = [...medicalVisits]
      .filter((v) => !!v.jadwalBerikutnya)
      .sort((a, b) => {
        const dateA = a.tanggalKunjungan || "";
        const dateB = b.tanggalKunjungan || "";
        return dateB.localeCompare(dateA);
      });

    if (sortedByVisitDateDesc.length === 0) {
      return null;
    }

    const latestVisitWithSchedule = sortedByVisitDateDesc[0];
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const isUpcoming = latestVisitWithSchedule.jadwalBerikutnya! >= todayStr;

    return {
      visit: latestVisitWithSchedule,
      isUpcoming
    };
  }, [medicalVisits]);

  // Form Fields
  const [tanggalKunjungan, setTanggalKunjungan] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [usiaKehamilan, setUsiaKehamilan] = useState("");
  const [dokterBidan, setDokterBidan] = useState("");
  const [tempat, setTempat] = useState("");
  const [tensi, setTensi] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [hasilCatatan, setHasilCatatan] = useState("");
  const [biaya, setBiaya] = useState("");
  const [resepVitamin, setResepVitamin] = useState("");
  const [jadwalBerikutnya, setJadwalBerikutnya] = useState("");

  const resetForm = () => {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setTanggalKunjungan(todayStr);
    setUsiaKehamilan("");
    setDokterBidan("");
    setTempat("");
    setTensi("");
    setBeratBadan("");
    setHasilCatatan("");
    setBiaya("");
    setResepVitamin("");
    setJadwalBerikutnya("");
    setEditingVisit(null);
  };

  const handleOpenAdd = () => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    resetForm();
    setShowAddForm(true);
  };

  const handleOpenEdit = (v: MedicalVisit) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setEditingVisit(v);
    setTanggalKunjungan(v.tanggalKunjungan);
    setUsiaKehamilan(v.usiaKehamilan);
    setDokterBidan(v.dokterBidan);
    setTempat(v.tempat);
    setTensi(v.tensi || "");
    setBeratBadan(v.beratBadan || "");
    setHasilCatatan(v.hasilCatatan);
    setBiaya(v.biaya?.toString() || "");
    setResepVitamin(v.resepVitamin || "");
    setJadwalBerikutnya(v.jadwalBerikutnya || "");
    setShowAddForm(true);
  };

  const handleDelete = (id: string, date: string) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setItemToDelete({ id, tanggal: date });
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      onDeleteVisit(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dokterBidan.trim() || !tempat.trim()) return;

    const payload = {
      tanggalKunjungan,
      usiaKehamilan: usiaKehamilan.trim(),
      dokterBidan: dokterBidan.trim(),
      tempat: tempat.trim(),
      tensi: tensi.trim() || undefined,
      beratBadan: beratBadan.trim() || undefined,
      hasilCatatan: hasilCatatan.trim(),
      biaya: biaya ? Number(biaya) : undefined,
      resepVitamin: resepVitamin.trim() || undefined,
      jadwalBerikutnya: jadwalBerikutnya || undefined
    };

    if (editingVisit) {
      onEditVisit(editingVisit.id, payload);
    } else {
      onAddVisit(payload);
    }

    setShowAddForm(false);
    resetForm();
  };

  // Search filter
  const filteredVisits = useMemo(() => {
    return medicalVisits.filter((v) => {
      const term = searchTerm.toLowerCase();
      return (
        v.dokterBidan.toLowerCase().includes(term) ||
        v.tempat.toLowerCase().includes(term) ||
        v.hasilCatatan.toLowerCase().includes(term) ||
        (v.resepVitamin && v.resepVitamin.toLowerCase().includes(term))
      );
    }).sort((a, b) => b.tanggalKunjungan.localeCompare(a.tanggalKunjungan));
  }, [medicalVisits, searchTerm]);

  return (
    <div id="medical-tracker-view" className="space-y-6 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in">
      
      {/* 1. HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#14B8B8] uppercase tracking-widest font-mono">
            Kesehatan & Kontrol Kehamilan
          </span>
          <h2 className="text-2xl font-black text-[#2F3A3A] tracking-tight">
            Log Buku Kunjungan Medis
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Simpan hasil kontrol kandungan, rekomendasi dokter/bidan, jadwal kontrol berikutnya, resep vitamin, serta perkembangan tensi & berat badan Moms.
          </p>
        </div>

        <button
          id="btn-add-medical-item"
          onClick={handleOpenAdd}
          className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 max-sm:w-full sm:w-auto text-white text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-md shadow-[#14B8B8]/15 tracking-tight flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 shrink-0 self-stretch sm:self-center"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Buat Log Kontrol Baru</span>
        </button>
      </div>

      {/* 2. WARNING REMINDER AND INFO BLOCKS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#DDF7EF] border border-[#14B8B8]/20 rounded-2xl p-4 flex items-start space-x-3 text-xs leading-relaxed text-teal-900">
          <Activity className="w-5 h-5 text-[#14B8B8] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-teal-800 block">Mengapa mencatat rekam medis ini penting?</span>
            <span>Mencatat tensi darah secara berkala mempermudah mendeteksi risiko preeklamsia. Grafik penambahan berat badan juga membantu Moms memantau kenyamanan perkembangan gizi janin tercinta.</span>
          </div>
        </div>

        <div className="bg-[#FFF1D6] border border-[#FFF1D6]/30 rounded-2xl p-4 flex items-start space-x-3 text-xs leading-relaxed text-[#2F3A3A]/95">
          <Clock className="w-5 h-5 text-[#14B8B8] shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-800 block">Jadwal Kontrol Berikutnya Sesuai Anjuran Dokter:</span>
            {nextVisit ? (
              <span className="font-semibold text-gray-700">
                {nextVisit.isUpcoming ? (
                  <>Terdekat: <strong className="text-[#14B8B8] font-mono">{nextVisit.visit.jadwalBerikutnya}</strong>. Cek lagi bersama pasangan supaya janji temu tidak terlewat!</>
                ) : (
                  <>Jadwal sebelumnya: <strong className="text-gray-500 font-mono">{nextVisit.visit.jadwalBerikutnya}</strong> (Sudah terlewati). Silakan jadwalkan kembali kontrol berikutnya.</>
                )}
              </span>
            ) : (
              <span>Rata-rata 4 minggu sekali di Trimester 1 & 2, serta 1-2 minggu sekali saat Trimester 3. Ayo buat pengingatnya disini kelak.</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. CLINICAL MEDICAL DISCLAIMER ALERT IN PARENTING ZONE */}
      <div className="bg-red-50 border border-red-100 rounded-2xl p-3.5 text-[10px] text-gray-400 leading-normal flex items-start space-x-2">
        <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
        <span><strong>Disclaimer Keamanan Konten:</strong> Informasi rekam medis, ukuran tensi, berat badan, atau pengingat kunjungan obgyn dalam aplikasi Baby Budget Plan murni bersifat edukasi pencatatan mandiri. Jangan jadikan aplikasi ini sebagai patokan diagnosis tunggal kehamilan. Selalu konsultasikan segala keluhan sensitif, rekomendasi suplemen, obat, atau tes darah lanjut ke obgyn atau bidan berizin medis resmi yang menangani persalinan Anda.</span>
      </div>

      {/* 3. SEARCH CONTROLLER */}
      <div className="bg-[#FAF9F5] border border-[#E8E4FF] rounded-2xl p-3.5">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
          <input
            id="medical-search"
            type="text"
            placeholder="Cari dokter, nama rumah sakit, resep vitamin, atau ringkasan diagnosa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#2F3A3A]/10 rounded-xl py-2 pl-9 pr-4 text-xs text-[#2F3A3A] outline-none"
          />
        </div>
      </div>

      {/* 5. VISITS HISTORY LIST */}
      {filteredVisits.length === 0 ? (
        <div className="bg-white border border-[#E8E4FF] rounded-3xl p-10 text-center space-y-2">
          <Stethoscope className="w-10 h-10 text-gray-300 mx-auto" />
          <h4 className="text-sm font-bold text-[#2F3A3A]">Log buku kunjungan medis Anda masih kosong.</h4>
          <p className="text-xs text-gray-400">Tekan tombol &quot;Buat Log Kontrol Baru&quot; untuk mengabadikan hasil konsultasi kehamilan pertama Moms.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVisits.map((item, index) => (
            <div 
              key={item.id} 
              className="bg-white border border-[#E8E4FF] rounded-3xl p-5 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 hover:border-[#14B8B8]/30 transition-all"
            >
              <div className="space-y-3 flex-1">
                {/* Header card log */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold bg-[#FAF9F5] text-gray-500 px-3 py-1 rounded-xl border border-[#2F3A3A]/5">
                    📅 {item.tanggalKunjungan}
                  </span>
                  {item.usiaKehamilan && (
                    <span className="text-[11px] bg-[#DDF7EF] text-[#14B8B8] px-2.5 py-0.5 rounded-lg font-bold">
                      Usia Janin: {item.usiaKehamilan}
                    </span>
                  )}
                  {item.biaya && (
                    <span className="text-[11px] bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-0.5 rounded-lg font-mono font-semibold">
                      💳 {formatRupiah(item.biaya)}
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-[#2F3A3A] tracking-tight">
                    {item.dokterBidan} <span className="text-[11px] text-gray-400 font-normal">at {item.tempat}</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#FAF9F5]/80 p-2.5 rounded-2xl border border-gray-100">
                    <div>
                      <span className="text-gray-400 block font-semibold">🩺 Tensi Darah</span>
                      <strong className="text-gray-700 font-mono">{item.tensi || "-"} mmHg</strong>
                    </div>
                    <div>
                      <span className="text-gray-400 block font-semibold">⚖️ Berat Ibu</span>
                      <strong className="text-gray-700 font-mono">{item.beratBadan || "-"} kg</strong>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-gray-400 block font-semibold">💊 Resep / Vitamin</span>
                      <span className="text-gray-700 font-semibold line-clamp-1">{item.resepVitamin || "-"}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1.5">
                  <span className="text-xs font-extrabold text-teal-800 uppercase tracking-wider font-mono block">Hasil Pemeriksaan obgyn:</span>
                  <p className="text-xs text-gray-600 bg-[#FAF9F5]/40 p-3 rounded-2xl border border-gray-100/50 leading-relaxed whitespace-pre-line">
                    {item.hasilCatatan}
                  </p>
                </div>

                {item.jadwalBerikutnya && (
                  <div className="pt-1">
                    {index === 0 ? (
                      <div className="bg-[#DDF7EF]/60 border-l-4 border-[#14B8B8] p-3 rounded-r-2xl rounded-l-md shadow-xs shadow-[#14B8B8]/5 animate-pulse-subtle flex flex-wrap items-center gap-2 max-w-max">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#14B8B8] opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#14B8B8]"></span>
                        </span>
                        <span className="text-xs text-teal-900 font-extrabold flex items-center gap-1.5">
                          📌 Jadwal Kontrol Selanjutnya: <strong className="font-mono text-[#2F3A3A] bg-white px-2 py-0.5 rounded-lg border border-[#14B8B8]/15 shadow-2xs text-xs">{item.jadwalBerikutnya}</strong>
                        </span>
                        <span className="text-[9px] bg-[#14B8B8] text-white px-2 py-0.5 rounded-full font-sans uppercase font-black tracking-wider shadow-2xs shrink-0">
                          Terdekat
                        </span>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-400 font-bold bg-[#FAF9F5]/50 border border-gray-100 px-3 py-2 rounded-xl inline-block">
                        📌 Jadwal Kontrol Selanjutnya: <strong className="font-mono text-gray-600 font-semibold">{item.jadwalBerikutnya}</strong>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action operations buttons */}
              <div className="flex md:flex-col items-center justify-end md:justify-start gap-1 shrink-0 border-t md:border-t-0 border-[#E8E4FF]/40 pt-2.5 md:pt-0">
                <InstantTooltip content="Edit Log" position="top">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="flex items-center space-x-1 p-2 rounded-xl border border-gray-100 text-xs text-gray-500 hover:bg-[#DDF7EF] hover:text-[#14B8B8] transition-all bg-white cursor-pointer w-full justify-center md:w-auto"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="md:hidden">Edit</span>
                  </button>
                </InstantTooltip>
                
                <InstantTooltip content="Hapus Log" position="top">
                  <button
                    onClick={() => handleDelete(item.id, item.tanggalKunjungan)}
                    className="flex items-center space-x-1 p-2 rounded-xl border border-red-50 text-xs text-red-500 hover:bg-red-50 transition-all bg-white cursor-pointer w-full justify-center md:w-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span className="md:hidden">Hapus</span>
                  </button>
                </InstantTooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. LOG DIALOG FORM OVERLAY */}
      {createPortal(
        <AnimatePresence>
          {showAddForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              {/* Backdrop with custom theme glass blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowAddForm(false)}
                className="fixed inset-0 bg-[#2F3A3A]/60 backdrop-blur-md"
              />

              {/* Modal Card content */}
              <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              id="medical-modal-card"
              className="w-full max-w-lg bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-6 shadow-2xl relative overflow-hidden my-auto max-h-[90vh] flex flex-col z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-start shrink-0 mb-4 pb-3 border-b border-[#E8E4FF]/40">
                <div className="flex items-center space-x-2 text-[#14B8B8]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <h3 className="text-lg font-black text-[#2F3A3A] tracking-tight">
                    {editingVisit ? "Edit Log Kunjungan Medis" : "Catat Hasil Kontrol Obgyn Baru"}
                  </h3>
                </div>
                <button 
                  id="close-medical-modal-btn"
                  onClick={() => setShowAddForm(false)}
                  className="text-[#2F3A3A]/40 hover:text-[#2F3A3A] hover:bg-gray-100 p-2 rounded-full border border-gray-100 transition-colors cursor-pointer bg-white"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form body */}
              <form id="medical-visit-form" onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="med-form-tgl" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Tanggal Pemeriksaan
                    </label>
                    <input
                      id="med-form-tgl"
                      type="date"
                      required
                      value={tanggalKunjungan}
                      onChange={(e) => setTanggalKunjungan(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="med-form-usia" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Usia Kehamilan Moms
                    </label>
                    <input
                      id="med-form-usia"
                      type="text"
                      placeholder="e.g. 14 Minggu atau Bulan 4"
                      value={usiaKehamilan}
                      onChange={(e) => setUsiaKehamilan(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="med-form-dr" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Nama Dokter / Bidan <span className="text-[#14B8B8]">*</span>
                    </label>
                    <input
                      id="med-form-dr"
                      type="text"
                      required
                      placeholder="e.g. Dr. Citra SpOG / Bidan Endang"
                      value={dokterBidan}
                      onChange={(e) => setDokterBidan(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="med-form-tempat" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Tempat / Rumah Sakit <span className="text-[#14B8B8]">*</span>
                    </label>
                    <input
                      id="med-form-tempat"
                      type="text"
                      required
                      placeholder="e.g. RSIA Bunda Menteng / Puskesmas"
                      value={tempat}
                      onChange={(e) => setTempat(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="med-form-tensi" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Tensi Darah Moms (mmHg)
                    </label>
                    <input
                      id="med-form-tensi"
                      type="text"
                      placeholder="e.g. 110/80"
                      value={tensi}
                      onChange={(e) => setTensi(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="med-form-berat" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Berat Badan Ibu (kg)
                    </label>
                    <input
                      id="med-form-berat"
                      type="text"
                      placeholder="e.g. 58"
                      value={beratBadan}
                      onChange={(e) => setBeratBadan(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="med-form-cost" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Biaya Kontrol
                    </label>
                    <input
                      id="med-form-cost"
                      type="number"
                      placeholder="e.g. 750000"
                      value={biaya}
                      onChange={(e) => setBiaya(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="med-form-next" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Jadwal Kontrol Berikutnya
                    </label>
                    <input
                      id="med-form-next"
                      type="date"
                      value={jadwalBerikutnya}
                      onChange={(e) => setJadwalBerikutnya(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="med-form-resep" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Resep Suplemen / Vitamin Yang Diminum
                  </label>
                  <input
                    id="med-form-resep"
                    type="text"
                    placeholder="e.g. Folamil Genio, Cal-95 kalsium, dll..."
                    value={resepVitamin}
                    onChange={(e) => setResepVitamin(e.target.value)}
                    className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="med-form-hasil" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Hasil Pemeriksaan Lengkap & Catatan Dokter <span className="text-[#14B8B8]">*</span>
                  </label>
                  <textarea
                    id="med-form-hasil"
                    required
                    placeholder="e.g. Ketuban cukup lancar, berat janin perkiraan 310 gram, plasenta menempel aman tidak menutup jalan lahir, gerak aktif puji Tuhan."
                    value={hasilCatatan}
                    onChange={(e) => setHasilCatatan(e.target.value)}
                    className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none h-20 resize-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4 bg-[#FAF9F5] border-t border-[#E8E4FF]/40 shrink-0">
                  <button
                    id="cancel-medical-form"
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="border border-[#2F3A3A]/10 text-[#2F3A3A]/70 font-bold rounded-2xl py-2.5 px-6 text-xs hover:bg-gray-100 transition-all cursor-pointer"
                  >
                    Urungkan
                  </button>
                  <button
                    id="submit-medical-form"
                    type="submit"
                    className="bg-[#14B8B8] hover:bg-[#0E9090] text-white font-black rounded-2xl py-2.5 px-8 text-xs shadow-md shadow-[#14B8B8]/15 hover:shadow-lg transition-all cursor-pointer"
                  >
                    {editingVisit ? "Perbarui Rekam" : "Bubuhkan Catatan"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* PORTAL CONFIRM DELETE */}
      {typeof window !== "undefined" && itemToDelete && createPortal(
        <div className="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-[#2F3A3A]/60 backdrop-blur-xs transition-opacity" 
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
              <h4 className="text-base font-black text-[#2F3A3A]">Hapus Catatan Medis?</h4>
              <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                Moms, apakah yakin ingin menghapus catatan kunjungan medis tanggal <strong className="text-[#2F3A3A] font-extrabold">&quot;{itemToDelete.tanggal}&quot;</strong>? Tindakan ini tidak dapat dibatalkan.
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

    </div>
  );
}
