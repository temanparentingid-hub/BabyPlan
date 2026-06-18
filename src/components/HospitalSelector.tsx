import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { HospitalComparison } from "../types";
import { formatRupiah } from "../pregnancyUtils";
import { 
  Building2, 
  Plus, 
  Search, 
  Star, 
  Trash2, 
  Edit2, 
  MapPin, 
  DollarSign, 
  CheckCircle,
  Sparkles,
  AlertCircle,
  X,
  Phone,
  ExternalLink,
  Coins
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InstantTooltip from "./InstantTooltip";

interface HospitalSelectorProps {
  hospitalComparisons: HospitalComparison[];
  onAddHospital: (h: Omit<HospitalComparison, "id" | "userId" | "createdAt" | "updatedAt">) => void;
  onEditHospital: (id: string, h: Partial<HospitalComparison>) => void;
  onDeleteHospital: (id: string) => void;
  isDemo: boolean;
  onTriggerLogin: () => void;
}

const BIRTH_METHODS = ["Normal", "Caesar ERACS", "Caesar Biasa", "Water Birth"];

export default function HospitalSelector({
  hospitalComparisons = [],
  onAddHospital,
  onEditHospital,
  onDeleteHospital,
  isDemo,
  onTriggerLogin
}: HospitalSelectorProps) {
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState("Semua");
  const [formOpen, setFormOpen] = useState(false);
  const [editingHospital, setEditingHospital] = useState<HospitalComparison | null>(null);
  const [hospitalToDelete, setHospitalToDelete] = useState<HospitalComparison | null>(null);

  // Form Fields
  const [nama, setNama] = useState("");
  const [metode, setMetode] = useState(BIRTH_METHODS[0]);
  const [estimasiBiaya, setEstimasiBiaya] = useState<number | "">("");
  const [fasilitas, setFasilitas] = useState<string[]>([]);
  const [kelebihan, setKelebihan] = useState("");
  const [kekurangan, setKekurangan] = useState("");
  const [lokasi, setLokasi] = useState("");
  const [catatanBiaya, setCatatanBiaya] = useState("");
  const [kontak, setKontak] = useState("");
  const [linkGmap, setLinkGmap] = useState("");
  const [rating, setRating] = useState(5);

  const availableFacilities = [
    "Inisiasi Menyusu Dini (IMD)",
    "Rawat Gabung (Rooming-In)",
    "Klinik Laktasi Berlisensi",
    "Kamar NICU / PICU Lengkap",
    "Pendampingan Suami saat bersalin",
    "Sertifikat Lahir & Pengurusan Dukcapil",
    "Pilihan Makanan Penyembuhan Sehat"
  ];

  const resetForm = () => {
    setNama("");
    setMetode(BIRTH_METHODS[0]);
    setEstimasiBiaya("");
    setFasilitas([]);
    setKelebihan("");
    setKekurangan("");
    setLokasi("");
    setCatatanBiaya("");
    setKontak("");
    setLinkGmap("");
    setRating(5);
    setEditingHospital(null);
  };

  const handleOpenAdd = () => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    resetForm();
    setFormOpen(true);
  };

  const handleOpenEdit = (h: HospitalComparison) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setEditingHospital(h);
    setNama(h.nama);
    setMetode(h.metodePersalinan);
    setEstimasiBiaya(h.estimasiBiaya !== undefined && h.estimasiBiaya !== null ? h.estimasiBiaya : "");
    setFasilitas(h.fasilitasLayanan);
    setKelebihan(h.kelebihan || "");
    setKekurangan(h.kekurangan || "");
    setLokasi(h.lokasi || "");
    setCatatanBiaya(h.catatanBiaya || "");
    setKontak(h.kontak || "");
    setLinkGmap(h.linkGmap || "");
    setRating(h.rating);
    setFormOpen(true);
  };

  const handleDeleteTrigger = (h: HospitalComparison) => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }
    setHospitalToDelete(h);
  };

  const handleConfirmDelete = () => {
    if (hospitalToDelete) {
      onDeleteHospital(hospitalToDelete.id);
      setHospitalToDelete(null);
    }
  };

  const handleFacilityCheckbox = (fac: string) => {
    if (fasilitas.includes(fac)) {
      setFasilitas(fasilitas.filter(f => f !== fac));
    } else {
      setFasilitas([...fasilitas, fac]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const payload = {
      nama: nama.trim(),
      metodePersalinan: metode,
      estimasiBiaya: estimasiBiaya === "" ? 0 : Number(estimasiBiaya),
      fasilitasLayanan: fasilitas,
      kelebihan: kelebihan.trim() || undefined,
      kekurangan: kekurangan.trim() || undefined,
      lokasi: lokasi.trim() || undefined,
      catatanBiaya: catatanBiaya.trim() || undefined,
      kontak: kontak.trim() || undefined,
      linkGmap: linkGmap.trim() || undefined,
      rating: Number(rating)
    };

    if (editingHospital) {
      onEditHospital(editingHospital.id, payload);
    } else {
      onAddHospital(payload);
    }
    setFormOpen(false);
    resetForm();
  };

  const filteredHospitals = useMemo(() => {
    return hospitalComparisons.filter(h => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        h.nama.toLowerCase().includes(term) ||
        (h.lokasi && h.lokasi.toLowerCase().includes(term)) ||
        (h.kelebihan && h.kelebihan.toLowerCase().includes(term));

      const matchesMethod = methodFilter === "Semua" || h.metodePersalinan === methodFilter;

      return matchesSearch && matchesMethod;
    }).sort((a,b) => b.rating - a.rating);
  }, [hospitalComparisons, searchTerm, methodFilter]);

  return (
    <div id="hospital-selector-view" className="space-y-6 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in">
      
      {/* 1. SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black text-[#14B8B8] uppercase tracking-widest font-mono">
            Riset Rumah Sakit Bersalin
          </span>
          <h2 className="text-2xl font-black text-[#2F3A3A] tracking-tight">
            Perbandingan Rumah Sakit & Klinik 🏥
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Bandingkan biaya persalinan normal maupun caesar ERACS, jarak lokasi, serta fasilitas rawat gabung dalam satu panel agar Moms merasa tenang.
          </p>
        </div>

        <button
          id="btn-add-hospital-compare"
          onClick={handleOpenAdd}
          className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 text-white text-xs sm:text-sm font-black px-5 py-3 rounded-2xl shadow-md shadow-[#14B8B8]/15 tracking-tight flex items-center justify-center space-x-2 transition-all cursor-pointer active:scale-95 shrink-0 self-stretch sm:self-center w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 text-white" />
          <span>Tambah Riset RS</span>
        </button>
      </div>

      {/* 2. DYNAMIC FILTERS BAR */}
      <div className="bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-gray-400 w-3.5 h-3.5" />
          <input
            id="hospital-query-search"
            type="text"
            placeholder="Cari nama rumah sakit/klinik, proses, fasilitas, kelebihan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-[#2F3A3A]/10 rounded-xl py-2 px-3 pl-9 text-xs outline-none focus:ring-1 focus:ring-[#14B8B8] focus:border-[#14B8B8]"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 md:w-auto w-full">
          <span className="text-xs text-gray-400 font-extrabold font-mono shrink-0 uppercase tracking-wider block">PROSES LAHIR:</span>
          <select
            id="filter-hospital-metode"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-white border border-[#2F3A3A]/10 rounded-xl py-2 px-3 text-xs text-[#2F3A3A] outline-none focus:ring-1 focus:ring-[#14B8B8] focus:border-[#14B8B8] w-full sm:w-auto font-semibold"
          >
            <option value="Semua">Semua Metode</option>
            {BIRTH_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* 4. HOSPITAL CARPARISON CARDS DENSITY */}
      {filteredHospitals.length === 0 ? (
        <div className="bg-white border border-[#E8E4FF] rounded-3xl p-10 text-center space-y-3">
          <Building2 className="w-12 h-12 text-[#14B8B8] mx-auto opacity-70 animate-bounce" />
          <h3 className="text-sm font-extrabold text-[#2F3A3A]">Belum ada data perbandingan Rumah Sakit.</h3>
          <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
            Moms & Dads, ketuk tombol &quot;Tambah Riset RS&quot; di atas untuk mulai memetakan estimasi biaya persalinan dan fasilitas rawat gabung pilihan Anda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredHospitals.map((h) => (
            <div 
              key={h.id} 
              className="bg-white border border-[#E8E4FF] rounded-3xl p-5 hover:border-[#14B8B8]/30 transition-all shadow-xs space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Headers */}
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-[#2F3A3A] tracking-tight">{h.nama}</h3>
                    <div className="flex flex-wrap gap-2">
                      {h.lokasi && (
                        <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" /> {h.lokasi}
                        </span>
                      )}
                      {h.kontak && (
                        <span className="text-[11px] text-gray-400 font-semibold flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-indigo-400 shrink-0" /> {h.kontak}
                        </span>
                      )}
                      {h.linkGmap && (
                        <a 
                          href={h.linkGmap.startsWith('http') ? h.linkGmap : `https://${h.linkGmap}`}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#14B8B8] hover:underline font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3 text-[#14B8B8] shrink-0" /> Petunjuk Arah GMap
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Star ratings */}
                    <div className="flex items-center space-x-0.5" title={`${h.rating} Star Rating`}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-3.5 h-3.5 ${i < h.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} 
                        />
                      ))}
                    </div>
                    <span className="text-[10px] bg-[#DDF7EF] text-[#14B8B8] font-bold px-2 py-0.5 rounded uppercase font-mono">
                      {h.metodePersalinan}
                    </span>
                  </div>
                </div>

                {/* Costs block */}
                <div className="bg-[#FAF9F5] rounded-2xl p-4 border border-gray-100 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block font-mono">ESTIMASI BIAYA LAHIRAN</span>
                      <strong className="text-lg font-mono font-black text-[#14B8B8]">
                        {h.estimasiBiaya && h.estimasiBiaya > 0 ? formatRupiah(h.estimasiBiaya) : "Hubungi RS / Belum Ditentukan"}
                      </strong>
                    </div>
                    <span className="text-[10px] text-gray-400 italic font-medium leading-relaxed max-w-[150px] text-right shrink-0">
                      *Estimasi paket kamar standar & obat utama.
                    </span>
                  </div>
                  {h.catatanBiaya && (
                    <div className="text-[11px] text-gray-500 font-semibold border-t border-dashed border-gray-200/60 pt-2 flex items-start gap-1">
                      <Coins className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span>{h.catatanBiaya}</span>
                    </div>
                  )}
                </div>

                {/* Facilities List */}
                {h.fasilitasLayanan.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-[#2F3A3A]/75 font-mono uppercase tracking-widest block">Fasilitas Utama:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {h.fasilitasLayanan.map((fac, idx) => (
                        <span key={idx} className="bg-[#DDF7EF]/40 text-xs text-[#14B8B8] px-2.5 py-1 rounded-full border border-teal-100 font-medium">
                          ✓ {fac}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pros & Cons */}
                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  {h.kelebihan && (
                    <div className="bg-[#DDF7EF]/30 p-3 rounded-2xl border border-[#DDF7EF] space-y-1">
                      <span className="font-extrabold text-[#14B8B8]">✓ Kelebihan:</span>
                      <p className="text-gray-600 leading-normal text-[11px] font-medium italic">{h.kelebihan}</p>
                    </div>
                  )}
                  {h.kekurangan && (
                    <div className="bg-red-50/40 p-3 rounded-2xl border border-red-100 space-y-1">
                      <span className="font-extrabold text-red-600">⚠️ Catatan/Kekurangan:</span>
                      <p className="text-gray-500 leading-normal text-[11px] font-medium italic">{h.kekurangan}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit and delete operations */}
              <div className="border-t border-gray-100 pt-4 mt-2 flex justify-end gap-1.5 opacity-90">
                <InstantTooltip content="Ubah Rincian" position="top">
                  <button
                    onClick={() => handleOpenEdit(h)}
                    className="p-1.5 border border-gray-100 text-gray-400 hover:text-[#14B8B8] hover:bg-[#DDF7EF] rounded-xl transition-all cursor-pointer bg-white flex items-center justify-center"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </InstantTooltip>
                
                <InstantTooltip content="Hapus" position="top">
                  <button
                    onClick={() => handleDeleteTrigger(h)}
                    className="p-1.5 border border-red-50 text-red-400 hover:bg-red-50 rounded-xl transition-all cursor-pointer bg-white flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </InstantTooltip>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. ADD / EDIT COMPARISON FORM MODAL */}
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
              id="hospital-modal-card"
              className="w-full max-w-lg bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-6 shadow-2xl relative overflow-hidden my-auto max-h-[90vh] flex flex-col z-10"
            >
              <div className="flex justify-between items-start shrink-0 mb-4 pb-3 border-b border-[#E8E4FF]/40">
                <div className="flex items-center space-x-2 text-[#14B8B8]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <h3 className="text-lg font-black text-[#2F3A3A] tracking-tight">
                    {editingHospital ? "Edit Perbandingan RS" : "Tambahkan Riset RS Baru"}
                  </h3>
                </div>
                <button 
                  id="close-hospital-modal-btn"
                  onClick={() => setFormOpen(false)}
                  className="text-[#2F3A3A]/40 hover:text-[#2F3A3A] hover:bg-gray-100 p-2 rounded-full border border-gray-100 transition-colors cursor-pointer bg-white"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form id="hospital-form" onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="hp-form-nama" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Nama Rumah Sakit / Klinik <span className="text-[#14B8B8]">*</span>
                    </label>
                    <input
                      id="hp-form-nama"
                      type="text"
                      required
                      placeholder="e.g. RSIA Hermina Podomoro"
                      value={nama}
                      onChange={(e) => setNama(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="hp-form-lokasi" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Alamat Lokasi & Jarak Jauh
                    </label>
                    <input
                      id="hp-form-lokasi"
                      type="text"
                      placeholder="e.g. Kemayoran (Jarak 4.5 km dari rumah)"
                      value={lokasi}
                      onChange={(e) => setLokasi(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="hp-form-metode" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Sistem Persalinan
                    </label>
                    <select
                      id="hp-form-metode"
                      value={metode}
                      onChange={(e) => setMetode(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    >
                      {BIRTH_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="hp-form-biaya" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Estimasi Biaya Paket (Rp)
                    </label>
                    <input
                      id="hp-form-biaya"
                      type="number"
                      placeholder="e.g. 18500000 (Kosongkan bila belum ada)"
                      value={estimasiBiaya}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEstimasiBiaya(val === "" ? "" : Number(val));
                      }}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs font-mono outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="hp-form-kontak" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Nomor Kontak
                  </label>
                  <input
                    id="hp-form-kontak"
                    type="text"
                    placeholder="e.g. 021-1234567 / WA 0812-xxxx"
                    value={kontak}
                    onChange={(e) => setKontak(e.target.value)}
                    className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="hp-form-linkgmap" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Link Google Maps
                  </label>
                  <input
                    id="hp-form-linkgmap"
                    type="text"
                    placeholder="e.g. https://maps.app.goo.gl/xxxx"
                    value={linkGmap}
                    onChange={(e) => setLinkGmap(e.target.value)}
                    className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs outline-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Fasilitas Yang Tersedia
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-100 p-2.5 bg-white rounded-2xl">
                    {availableFacilities.map((fac, idx) => (
                      <label key={idx} className="flex items-center space-x-2 text-xs font-medium text-gray-600">
                        <input
                          type="checkbox"
                          checked={fasilitas.includes(fac)}
                          onChange={() => handleFacilityCheckbox(fac)}
                          className="rounded border-[#14B8B8]/30 text-[#14B8B8]"
                        />
                        <span>{fac}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="hp-form-kelebihan" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Kelebihan / Keunggulan RS
                    </label>
                    <textarea
                      id="hp-form-kelebihan"
                      placeholder="e.g. Kamar sangat luas, ramah IMD, dan klinik laktasinya 24 jam."
                      value={kelebihan}
                      onChange={(e) => setKelebihan(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs h-16 resize-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="hp-form-kekurangan" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                      Kekurangan / Keterbatasan RS
                    </label>
                    <textarea
                      id="hp-form-kekurangan"
                      placeholder="e.g. Antrean dokter obgyn sangat ramai, biaya parkir sedikit mahal."
                      value={kekurangan}
                      onChange={(e) => setKekurangan(e.target.value)}
                      className="w-full bg-white border border-[#2F3A3A]/15 rounded-xl py-2 px-3 text-xs h-16 resize-none focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="hp-form-star" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Level Keinginan Penilaian (Rating 1-5 Bintang)
                  </label>
                  <div className="flex items-center space-x-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        id={`star-btn-${num}`}
                        key={num}
                        type="button"
                        onClick={() => setRating(num)}
                        className="p-1 cursor-pointer transition-colors"
                        title={`Beri Rating ${num} Bintang`}
                      >
                        <Star 
                          className={`w-6 h-6 ${num <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300"}`} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 bg-[#FAF9F5] border-t border-[#E8E4FF]/40 shrink-0">
                  <button
                    id="cancel-hospital-form"
                    type="button"
                    onClick={() => setFormOpen(false)}
                    className="border border-[#2F3A3A]/10 text-[#2F3A3A]/70 font-bold rounded-2xl py-2.5 px-6 text-xs hover:bg-[#FAF9F5] transition-all cursor-pointer"
                  >
                    Urungkan
                  </button>
                  <button
                    id="submit-hospital-form"
                    type="submit"
                    className="bg-[#14B8B8] hover:bg-[#0E9090] text-white font-black rounded-2xl py-2.5 px-8 text-xs shadow-md shadow-[#14B8B8]/15 hover:shadow-lg transition-all cursor-pointer"
                  >
                    {editingHospital ? "Simpan Perubahan" : "Masukkan Riset RS"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* 6. CUSTOM CONFIRM DELETION MODAL */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {hospitalToDelete && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#2F3A3A]/45 backdrop-blur-xs transition-opacity" 
                onClick={() => setHospitalToDelete(null)}
              />

              {/* Confirm modal box */}
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
                  <h4 className="text-base font-black text-[#2F3A3A]">Hapus Riset RS?</h4>
                  <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                    Moms & Dads, apakah yakin ingin menghapus perbandingan rumah sakit <strong className="text-[#2F3A3A] font-extrabold">&quot;{hospitalToDelete.nama}&quot;</strong>? Tindakan ini tidak dapat diurungkan.
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    onClick={() => setHospitalToDelete(null)}
                    type="button"
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-bold rounded-2xl py-3 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    type="button"
                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-2xl py-3 shadow-md shadow-rose-500/10 transition-colors cursor-pointer"
                  >
                    Hapus
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
