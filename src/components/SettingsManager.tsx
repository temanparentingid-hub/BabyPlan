import React, { useState } from "react";
import { PregnancyProfile } from "../types";
import { 
  User, 
  Trash2, 
  Sparkles 
} from "lucide-react";

interface SettingsManagerProps {
  profile: PregnancyProfile;
  onUpdateProfile: (p: Partial<PregnancyProfile>) => void;
  onResetAllData: () => void;
  onLogout: () => void;
  isDemo: boolean;
  onTriggerLogin: () => void;
}

export default function SettingsManager({
  profile,
  onUpdateProfile,
  onResetAllData,
  onLogout,
  isDemo,
  onTriggerLogin
}: SettingsManagerProps) {
  
  // Fields state
  const [namaMoms, setNamaMoms] = useState(profile.namaMoms);
  const [namaDads, setNamaDads] = useState(profile.namaDads || "");
  const [namaBayi, setNamaBayi] = useState(profile.namaBayi || "");
  const [hpht, setHpht] = useState(profile.hpht);
  const [hpl, setHpl] = useState(profile.hpl);
  const [pilihanPerhitungan, setPilihanPerhitungan] = useState<"HPHT" | "HPL">(profile.pilihanPerhitungan);
  const [targetBudget, setTargetBudget] = useState(profile.targetBudget);
  const [mataUang, setMataUang] = useState(profile.mataUang);
  
  // Save feedbacks
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaveSuccess(false);

    if (isDemo) {
      onTriggerLogin();
      return;
    }

    if (!namaMoms.trim()) {
      setErrorMsg("Nama Moms harus diisi terlebih dahulu ya, Moms.");
      return;
    }

    if (targetBudget <= 0) {
      setErrorMsg("Target budget minimal di atas 0.");
      return;
    }

    // Process dates
    let finalHpht = hpht;
    let finalHpl = hpl;

    if (pilihanPerhitungan === "HPHT" && hpht) {
      const d = new Date(hpht);
      const autoHpl = new Date(d.getTime() + 280 * 24 * 60 * 60 * 1000);
      finalHpl = autoHpl.toISOString().split("T")[0];
      setHpl(finalHpl);
    } else if (pilihanPerhitungan === "HPL" && hpl) {
      const d = new Date(hpl);
      const autoHpht = new Date(d.getTime() - 280 * 24 * 60 * 60 * 1000);
      finalHpht = autoHpht.toISOString().split("T")[0];
      setHpht(finalHpht);
    }

    onUpdateProfile({
      namaMoms: namaMoms.trim(),
      namaDads: namaDads.trim() || undefined,
      namaBayi: namaBayi.trim() || undefined,
      hpht: finalHpht,
      hpl: finalHpl,
      pilihanPerhitungan,
      targetBudget: Number(targetBudget),
      mataUang,
      updatedAt: new Date().toISOString()
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (isDemo) {
      onTriggerLogin();
      return;
    }

    if (window.confirm("⚠️ Moms & Dads, apakah Anda yakin ingin MERESET SEMUA DATA? Tindakan ini akan menghapus semua rincian anggaran, catatan wishlist, rekam kontrol medis, checklist trimester, dan bawaan tas rumah sakit Anda secara permanen. Tindakan ini tidak dapat dibatalkan!")) {
      onResetAllData();
      alert("Seluruh database data Anda berhasil diset ulang.");
      window.location.reload();
    }
  };

  return (
    <div id="settings-view" className="space-y-6 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in">
      
      {/* 1. SECTION BAR */}
      <div>
        <span className="text-xs font-black text-[#14B8B8] uppercase tracking-widest font-mono">
          Utilitas Sistem
        </span>
        <h2 className="text-2xl font-black text-[#2F3A3A] tracking-tight text-left">
          Pengaturan & Info Aplikasi
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Perbarui informasi profil Moms & Dads, ganti target pagu anggaran, kustomisasi kalkulasi kehamilan, atau kosongkan database.
        </p>
      </div>

      {saveSuccess && (
        <div className="bg-[#DDF7EF] border border-[#14B8B8]/30 rounded-2xl p-4 text-xs text-[#14B8B8] font-bold">
          ✓ Profil kehamilan dan sasaran anggaran berhasil diperbarui di Cloud Database!
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-xs text-red-600 font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* 2. GRID PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Profile Settings form card */}
        <div className="md:col-span-2 bg-white border border-[#E8E4FF] rounded-3xl p-6 shadow-xs">
          <div className="flex items-center space-x-2 text-[#14B8B8] font-bold border-b border-gray-100 pb-3 mb-6 uppercase tracking-wider font-mono text-xs">
            <User className="w-4 h-4 text-[#14B8B8]" />
            <span>Formulir Data Kehamilan & Budget</span>
          </div>

          <form id="settings-profile-form" onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            {/* Moms and Dads Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="set-nama-moms" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                  Nama Lengkap Moms <span className="text-[#14B8B8]">*</span>
                </label>
                <input
                  id="set-nama-moms"
                  type="text"
                  required
                  value={namaMoms}
                  onChange={(e) => setNamaMoms(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-[#2F3A3A] outline-none focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="set-nama-dads" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                  Nama Dads / Pendamping <span className="text-gray-400 font-normal">(Opsional)</span>
                </label>
                <input
                  id="set-nama-dads"
                  type="text"
                  placeholder="Nama Pasangan"
                  value={namaDads}
                  onChange={(e) => setNamaDads(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-[#2F3A3A] outline-none focus:bg-white"
                />
              </div>
            </div>

            {/* Baby nick / budget */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="set-nama-bayi" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                  Nama Panggilan Si Kecil
                </label>
                <input
                  id="set-nama-bayi"
                  type="text"
                  placeholder="e.g. Dek Kirana"
                  value={namaBayi}
                  onChange={(e) => setNamaBayi(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-[#2F3A3A] outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.55">
                  <label htmlFor="set-currency" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Mata Uang
                  </label>
                  <select
                    id="set-currency"
                    value={mataUang}
                    onChange={(e) => setMataUang(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-[#2F3A3A]"
                  >
                    <option>Rp (Rupiah)</option>
                    <option>$ (USD)</option>
                    <option>S$ (SGD)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="set-target-budget" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                    Target Saku (Rp)
                  </label>
                  <input
                    id="set-target-budget"
                    type="number"
                    required
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(Number(e.target.value))}
                    className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-xl py-2.5 px-3 text-[#2F3A3A] outline-none font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Calculation choices and Date preferences */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-gray-100 pt-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                  Dasar Perhitungan
                </label>
                <div className="flex space-x-1.5 bg-[#FAF9F5] p-1 rounded-xl border border-gray-100">
                  <button
                    id="set-prep-hpht"
                    type="button"
                    onClick={() => setPilihanPerhitungan("HPHT")}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg ${
                      pilihanPerhitungan === "HPHT" ? "bg-[#14B8B8] text-white" : "text-gray-500 hover:bg-white"
                    }`}
                  >
                    HPHT Moms
                  </button>
                  <button
                    id="set-prep-hpl"
                    type="button"
                    onClick={() => setPilihanPerhitungan("HPL")}
                    className={`flex-1 text-[10px] font-bold py-1.5 rounded-lg ${
                      pilihanPerhitungan === "HPL" ? "bg-[#14B8B8] text-white" : "text-gray-500 hover:bg-white"
                    }`}
                  >
                    Estimasi HPL
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="set-hpht-val" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                  Tanggal HPHT
                </label>
                <input
                  id="set-hpht-val"
                  type="date"
                  value={hpht}
                  disabled={pilihanPerhitungan === "HPL"}
                  onChange={(e) => setHpht(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-xl py-2 px-3 text-xs disabled:opacity-50"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="set-hpl-val" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-widest">
                  Tanggal HPL
                </label>
                <input
                  id="set-hpl-val"
                  type="date"
                  value={hpl}
                  disabled={pilihanPerhitungan === "HPHT"}
                  onChange={(e) => setHpl(e.target.value)}
                  className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-xl py-2 px-3 text-xs disabled:opacity-50"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                id="save-profile-btn"
                type="submit"
                className="bg-[#14B8B8] hover:bg-[#14B8B8]/95 text-white text-xs font-extrabold rounded-xl py-3 px-8 shadow-md shadow-[#14B8B8]/10 cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>

        {/* Brand context and reset area */}
        <div className="space-y-6">
          
          {/* Brand info */}
          <div className="bg-gradient-to-br from-[#DDF7EF] to-white border border-[#E8E4FF] rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-[#14B8B8] font-black uppercase text-xs tracking-widest font-mono">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
              <span>YAYASAN TEMAN PARENTING</span>
            </div>
            
            <div className="space-y-1.5 text-xs">
              <strong className="text-sm font-black text-[#2F3A3A] block">Tentang Baby Budget Plan</strong>
              <p className="text-[#2F3A3A]/70 leading-relaxed text-[11px]">
                Aplikasi ini dikembangkan oleh <strong>Teman Parenting</strong> sebagai dedikasi murni menemani Moms & Dads merencanakan pengeluaran kehamilan, mengantisipasi kebutuhan, mencari arti nama bayi paling mulia, serta mengorganisir tas hospital bag.
              </p>
              <span className="text-[10px] text-[#14B8B8] font-bold block bg-white px-2 py-1 rounded border border-teal-100 italic">
                “Pelan-pelan ya, Moms. Mulai dari kebutuhan yang paling penting dulu.”
              </span>
            </div>
          </div>

          {/* Reset database card */}
          <div className="bg-white border rounded-3xl p-5 border-red-100 space-y-3.5">
            <div className="flex items-center space-x-1.5 text-red-500 font-bold text-xs uppercase tracking-widest font-mono">
              <Trash2 className="w-4 h-4 shrink-0" />
              <span>Zona Bahaya</span>
            </div>

            <p className="text-[11px] text-gray-400 leading-normal">
              Mengosongkan semua rincian anggaran belanja, data checklist trimester, usulan nama, catatan rekam klinis dokter, dan bawaan tas bersalin dari database Cloudflare D1.
            </p>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                id="reset-database-btn"
                onClick={handleReset}
                className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-black rounded-2xl py-2 px-3 text-xs transition-all cursor-pointer text-center"
              >
                Mulai Dari Nol (Reset)
              </button>

              {!isDemo && (
                <button
                  id="logout-btn"
                  onClick={onLogout}
                  className="flex-1 border border-red-200 text-red-600 font-black hover:bg-red-50 rounded-2xl py-2 px-3 text-xs transition-all cursor-pointer text-center"
                >
                  Keluar Akun
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 3. FINAL DISCLAIMER ON ALL FOOTERS OF APPLET PREVENTS LAWSUITS AND RISKS */}
      <footer className="bg-[#FAF9F5] border border-gray-100 rounded-3xl p-5 text-center text-xs text-gray-400 leading-normal max-w-4xl mx-auto space-y-1">
        <strong>Pemberitahuan Lisensi Medis:</strong> Konten dan fungsionalitas dalam Baby Budget Plan dirancang murni untuk asisten perencanaan keuangan mandiri dan stimulasi estimasi. Teman Parenting tidak memberikan nasihat medis klinis, instruksi bidan darurat, resep obat, konsensus gizi janin, atau bimbingan diagnosa klinis lainnya. Jika Moms mengalami pendarahan, kontraksi hebat di luar HPL, air ketuban meresembes, dsb, segera hubungi ruang darurat obgyn/bidan terdekat Anda secara langsung.
      </footer>

    </div>
  );
}
