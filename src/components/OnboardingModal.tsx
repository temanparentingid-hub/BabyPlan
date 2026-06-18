import React, { useState } from "react";
import { PregnancyProfile } from "../types";
import { Sparkles, Calendar, Wallet, Heart, AlertCircle } from "lucide-react";
import { isValidDateString } from "../pregnancyUtils";
import { motion, AnimatePresence } from "motion/react";

interface OnboardingModalProps {
  userId: string;
  onSave: (profile: PregnancyProfile) => void;
}

export default function OnboardingModal({ userId, onSave }: OnboardingModalProps) {
  const [namaMoms, setNamaMoms] = useState("");
  const [namaDads, setNamaDads] = useState("");
  const [namaBayi, setNamaBayi] = useState("");
  const [hpht, setHpht] = useState("");
  const [hpl, setHpl] = useState("");
  const [pilihanPerhitungan, setPilihanPerhitungan] = useState<"HPHT" | "HPL">("HPHT");
  const [targetBudget, setTargetBudget] = useState<number>(30000000); // 30 million
  const [mataUang, setMataUang] = useState("Rp (Rupiah)");
  const [tabIndex, setTabIndex] = useState(1); // 1: Profil, 2: Kehamilan, 3: Budget
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNextTab = () => {
    setErrorMsg(null);
    if (tabIndex === 1) {
      if (!namaMoms.trim()) {
        setErrorMsg("Nama Moms harus diisi terlebih dahulu ya, Moms.");
        return;
      }
      setTabIndex(2);
    } else if (tabIndex === 2) {
      if (pilihanPerhitungan === "HPHT" && !isValidDateString(hpht)) {
        setErrorMsg("Harap masukkan tanggal HPHT yang valid.");
        return;
      }
      if (pilihanPerhitungan === "HPL" && !isValidDateString(hpl)) {
        setErrorMsg("Harap masukkan tanggal Hari Perkiraan Lahir (HPL) yang valid.");
        return;
      }
      // Populate the other date if not set
      if (pilihanPerhitungan === "HPHT") {
        const d = new Date(hpht);
        const autoHpl = new Date(d.getTime() + 280 * 24 * 60 * 60 * 1000);
        setHpl(autoHpl.toISOString().split("T")[0]);
      } else {
        const d = new Date(hpl);
        const autoHpht = new Date(d.getTime() - 280 * 24 * 60 * 60 * 1000);
        setHpht(autoHpht.toISOString().split("T")[0]);
      }
      setTabIndex(3);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (targetBudget <= 0) {
      setErrorMsg("Target budget minimal di atas 0 ya, Moms & Dads.");
      return;
    }

    const newProfile: PregnancyProfile = {
      userId,
      namaMoms: namaMoms.trim(),
      namaDads: namaDads.trim() || undefined,
      namaBayi: namaBayi.trim() || undefined,
      hpht,
      hpl,
      pilihanPerhitungan,
      targetBudget,
      mataUang,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(newProfile);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#FAF9F5] overflow-y-auto">
        {/* Animated Background Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-[#FAF9F5]"
        />

        {/* Form Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", duration: 0.5 }}
          id="onboarding-container"
          className="w-full max-w-2xl bg-white border border-[#E8E4FF] rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden my-auto z-10"
        >
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#DDF7EF] rounded-full filter blur-3xl opacity-60 -mr-10 -mt-10"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-[#FFF1D6] rounded-full filter blur-3xl opacity-60 -ml-16 -mb-16"></div>

          <div className="relative space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center space-x-2 text-[#14B8B8] font-black uppercase tracking-wider font-mono text-xs">
                <Sparkles className="w-4 h-4 animate-spin-slow" />
                <span>Teman Parenting</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-extrabold text-[#2F3A3A] tracking-tight">
                Selamat Datang di Baby Budget Plan ✨
              </h2>
              <p className="text-sm text-[#2F3A3A]/70 max-w-lg mx-auto leading-relaxed">
                Perjalanan menyambut buah hati tercinta akan terasa lebih ringan dan terarah bila direncanakan bersama. Mari mulai buat profil kehamilan Moms & Dads!
              </p>
            </div>

            {/* Tab Progress Stepper */}
            <div className="flex justify-center items-center space-x-2 md:space-x-4">
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold ${tabIndex >= 1 ? "bg-[#14B8B8] text-white" : "bg-gray-100 text-[#2F3A3A]/50"}`}>
                <Heart className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">1. Ketuk Profil</span>
              </div>
              <div className="w-8 h-px bg-[#E8E4FF]"></div>
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold ${tabIndex >= 2 ? "bg-[#14B8B8] text-white" : "bg-gray-100 text-[#2F3A3A]/50"}`}>
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">2. Detail Kehamilan</span>
              </div>
              <div className="w-8 h-px bg-[#E8E4FF]"></div>
              <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold ${tabIndex >= 3 ? "bg-[#14B8B8] text-white" : "bg-gray-100 text-[#2F3A3A]/50"}`}>
                <Wallet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">3. Target Anggaran</span>
              </div>
            </div>

            {errorMsg && (
              <div className="bg-[#FFF1D6] border border-[#FFF1D6] rounded-2xl p-4 text-sm text-[#2F3A3A] flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-[#14B8B8] shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form blocks based on Step */}
            <form id="onboarding-form" onSubmit={handleSubmit} className="space-y-6">
              {tabIndex === 1 && (
                <div id="step-profile" className="space-y-4 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="onboarding-moms" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-wider">
                        Nama Moms <span className="text-[#14B8B8]">*</span>
                      </label>
                      <input
                        id="onboarding-moms"
                        type="text"
                        required
                        placeholder="e.g. Citra Lestari"
                        value={namaMoms}
                        onChange={(e) => setNamaMoms(e.target.value)}
                        className="w-full bg-[#FAF9F5]/80 border border-[#2F3A3A]/15 rounded-2xl py-3 px-4 text-[#2F3A3A] text-sm focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white outline-none transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="onboarding-dads" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-wider">
                        Nama Dads / Pasangan <span className="text-gray-400 font-normal">(Opsional)</span>
                      </label>
                      <input
                        id="onboarding-dads"
                        type="text"
                        placeholder="e.g. Aris Nugroho"
                        value={namaDads}
                        onChange={(e) => setNamaDads(e.target.value)}
                        className="w-full bg-[#FAF9F5]/80 border border-[#2F3A3A]/15 rounded-2xl py-3 px-4 text-[#2F3A3A] text-sm focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white outline-none transition-all duration-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="onboarding-baby" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-wider">
                      Nama Panggilan Bayi <span className="text-gray-400 font-normal">(Opsional / Sementara)</span>
                    </label>
                    <input
                      id="onboarding-baby"
                      type="text"
                      placeholder="e.g. Dek Aisha"
                      value={namaBayi}
                      onChange={(e) => setNamaBayi(e.target.value)}
                      className="w-full bg-[#FAF9F5]/80 border border-[#2F3A3A]/15 rounded-2xl py-3 px-4 text-[#2F3A3A] text-sm focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white outline-none transition-all duration-200"
                    />
                    <p className="text-[10px] text-gray-400 italic">
                      “Wording hangat: Cek lagi bersama pasangan supaya persiapannya terasa lebih ringan ya.”
                    </p>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      id="onboarding-next-1"
                      type="button"
                      onClick={handleNextTab}
                      className="bg-[#14B8B8] hover:bg-[#0E9090] text-white font-bold rounded-2xl py-3.5 px-8 text-sm shadow-md transition-all cursor-pointer hover:shadow-lg"
                    >
                      Lanjutkan Detail
                    </button>
                  </div>
                </div>
              )}

              {tabIndex === 2 && (
                <div id="step-kehamilan" className="space-y-4 animate-fade-in">
                  <div className="bg-[#DDF7EF] border border-[#14B8B8]/20 rounded-2xl p-4 text-[#2F3A3A] text-xs leading-relaxed space-y-1">
                    <span className="font-bold block text-[#14B8B8]">Bagaimana sistem mengukur estimasi?</span>
                    <span>Aplikasi kami menyediakan kalkulasi otomatis umur kehamilan, trimester, serta Countdown kelahiran berdasarkan hari pertama haid terakhir (HPHT) or dari tanggal HPL dokter.</span>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-wider">
                      Pilihan Metode Perhitungan
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        id="method-hpht-btn"
                        type="button"
                        onClick={() => setPilihanPerhitungan("HPHT")}
                        className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          pilihanPerhitungan === "HPHT"
                            ? "bg-[#DDF7EF] border-[#14B8B8] text-[#14B8B8]"
                            : "border-[#2F3A3A]/15 bg-[#FAF9F5] text-[#2F3A3A]/70"
                        }`}
                      >
                        Berdasarkan HPHT Moms
                      </button>
                      <button
                        id="method-hpl-btn"
                        type="button"
                        onClick={() => setPilihanPerhitungan("HPL")}
                        className={`py-3.5 px-4 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                          pilihanPerhitungan === "HPL"
                            ? "bg-[#DDF7EF] border-[#14B8B8] text-[#14B8B8]"
                            : "border-[#2F3A3A]/15 bg-[#FAF9F5] text-[#2F3A3A]/70"
                        }`}
                      >
                        Berdasarkan Estimasi HPL
                      </button>
                    </div>
                  </div>

                  {pilihanPerhitungan === "HPHT" ? (
                    <div className="space-y-2">
                      <label htmlFor="onboarding-hpht" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-wider">
                        Tanggal HPHT <span className="text-[#14B8B8]">*</span>
                      </label>
                      <input
                        id="onboarding-hpht"
                        type="date"
                        required
                        value={hpht}
                        onChange={(e) => setHpht(e.target.value)}
                        className="w-full bg-[#FAF9F5]/80 border border-[#2F3A3A]/15 rounded-2xl py-3 px-4 text-[#2F3A3A] text-sm focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white outline-none transition-all duration-200"
                      />
                      <p className="text-[10px] text-gray-400">
                        Hari Pertama Haid Terakhir Moms.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label htmlFor="onboarding-hpl" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-wider">
                        Tanggal HPL Dokter/Bidan <span className="text-[#14B8B8]">*</span>
                      </label>
                      <input
                        id="onboarding-hpl"
                        type="date"
                        required
                        value={hpl}
                        onChange={(e) => setHpl(e.target.value)}
                        className="w-full bg-[#FAF9F5]/80 border border-[#2F3A3A]/15 rounded-2xl py-3 px-4 text-[#2F3A3A] text-sm focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white outline-none transition-all duration-200"
                      />
                      <p className="text-[10px] text-gray-400">
                        Hari Perkiraan Lahir yang diberikan oleh Obgyn Moms.
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between pt-4">
                    <button
                      id="onboarding-back-2"
                      type="button"
                      onClick={() => setTabIndex(1)}
                      className="border border-[#2F3A3A]/10 text-[#2F3A3A]/70 font-bold rounded-2xl py-3.5 px-6 text-sm hover:bg-gray-150 transition-all cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      id="onboarding-next-2"
                      type="button"
                      onClick={handleNextTab}
                      className="bg-[#14B8B8] hover:bg-[#0E9090] text-white font-bold rounded-2xl py-3.5 px-8 text-sm shadow-md transition-all cursor-pointer hover:shadow-lg"
                    >
                      Berikutnya: Budget
                    </button>
                  </div>
                </div>
              )}

              {tabIndex === 3 && (
                <div id="step-budget" className="space-y-4 animate-fade-in">
                  <div className="bg-[#FFF1D6] border border-[#FFF1D6] rounded-2xl p-4 text-[#2F3A3A] text-xs leading-relaxed">
                    <span className="font-bold block text-amber-800">“Budget belum harus langsung sempurna, yang penting mulai dicatat, Moms & Dads.”</span>
                    <span className="opacity-85">Target budget ini menjadi patokan akumulasi total di Dasbor Anda, dapat dikustomisasi kapan saja di menu Pengaturan.</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="onboarding-target-budget" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-wider">
                        Total Target Budget <span className="text-[#14B8B8]">*</span>
                      </label>
                      <input
                        id="onboarding-target-budget"
                        type="number"
                        required
                        placeholder="e.g. 30000000"
                        value={targetBudget}
                        onChange={(e) => setTargetBudget(Number(e.target.value))}
                        className="w-full bg-[#FAF9F5]/80 border border-[#2F3A3A]/15 rounded-2xl py-3 px-4 text-[#2F3A3A] text-sm focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white outline-none transition-all duration-200 font-mono"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="onboarding-currency" className="block text-xs font-bold text-[#2F3A3A]/70 uppercase tracking-wider">
                        Mata Uang Acuan
                      </label>
                      <select
                        id="onboarding-currency"
                        value={mataUang}
                        onChange={(e) => setMataUang(e.target.value)}
                        className="w-full bg-[#FAF9F5]/80 border border-[#2F3A3A]/15 rounded-2xl py-3 px-4 text-[#2F3A3A] text-sm focus:ring-2 focus:ring-[#14B8B8]/20 focus:border-[#14B8B8] focus:bg-white outline-none transition-all duration-200"
                      >
                        <option>Rp (Rupiah)</option>
                        <option>$ (USD)</option>
                        <option>S$ (SGD)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <button
                      id="onboarding-back-3"
                      type="button"
                      onClick={() => setTabIndex(2)}
                      className="border border-[#2F3A3A]/10 text-[#2F3A3A]/70 font-bold rounded-2xl py-3.5 px-6 text-sm hover:bg-gray-150 transition-all cursor-pointer"
                    >
                      Kembali
                    </button>
                    <button
                      id="onboarding-submit-btn"
                      type="submit"
                      className="bg-[#14B8B8] hover:bg-[#0E9090] text-white font-black rounded-2xl py-3.5 px-8 text-sm shadow-md shadow-[#14B8B8]/15 transition-all cursor-pointer"
                    >
                      Simpan & Mulai Aplikasi 🎉
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Medical disclaimer at all times */}
            <div className="border-t border-[#2F3A3A]/5 pt-4 text-center">
              <span className="text-[10px] text-gray-400 leading-normal block">
                <strong>Disclaimer Medis:</strong> Informasi kehamilan dalam Baby Budget Plan bersifat estimasi dan edukatif. Untuk informasi medis dan kondisi kehamilan tertentu, tetap konsultasikan dengan dokter atau bidan.
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
