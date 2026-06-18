import { useMemo, useState } from "react";
import { 
  PregnancyProfile, 
  BudgetItem, 
  WishlistItem, 
  ChecklistItem, 
  MedicalVisit, 
  HospitalBagItem 
} from "../types";
import { 
  calculatePregnancy, 
  formatRupiah 
} from "../pregnancyUtils";
import { 
  Heart, 
  Calendar, 
  Wallet, 
  CheckSquare, 
  Stethoscope, 
  ChevronRight, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Baby,
  Briefcase
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  Cell, 
  PieChart, 
  Pie 
} from "recharts";
import { motion, AnimatePresence } from "motion/react";

interface PregnancyDashboardProps {
  profile: PregnancyProfile;
  budgetItems: BudgetItem[];
  wishlistItems: WishlistItem[];
  checklistItems: ChecklistItem[];
  medicalVisits: MedicalVisit[];
  hospitalBagItems: HospitalBagItem[];
  onNavigate: (tab: string) => void;
}

export default function PregnancyDashboard({
  profile,
  budgetItems = [],
  wishlistItems = [],
  checklistItems = [],
  medicalVisits = [],
  hospitalBagItems = [],
  onNavigate
}: PregnancyDashboardProps) {

  // Interactive Belly Rub/Cinta State for Si Kecil
  const [bellyRubs, setBellyRubs] = useState<number>(0);
  const [rubMessage, setRubMessage] = useState<string | null>(null);

  const handleVirtualRub = () => {
    setBellyRubs(prev => prev + 1);
    const messages = [
      `👣 Hore! ${profile.namaBayi || "Si Kecil"} merespons dengan gerakan halus di perut Moms!`,
      `🥰 ${profile.namaBayi || "Si Kecil"} senang sekali diusap dan didoakan Moms & Dads!`,
      `💓 DEG-DEG! Detak jantung ${profile.namaBayi || "Si Kecil"} terdengar seirama dengan tawa hangat Moms!`,
      `💋 Cup! Satu elusan penuh limpahan berkah terkirim langsung ke rahim.`,
      `🍼 ${profile.namaBayi || "Si Kecil"} sedang asyik tersenyum sambil mengisap jempol kecilnya yang lucu!`,
      `✨ Saraf sensorik Si Kecil terstimulasi optimal oleh kehangatan elusan kasih sayang ini.`,
      `🤲 Sebut doa terbaik Anda hari ini, malaikat pelindung kecil selalu mendengarkan!`
    ];
    const randomMsg = messages[Math.floor(Math.random() * messages.length)];
    setRubMessage(randomMsg);
  };

  // Pregnancy metrics
  const preg = useMemo(() => {
    return calculatePregnancy(profile.hpht, profile.hpl, profile.pilihanPerhitungan);
  }, [profile.hpht, profile.hpl, profile.pilihanPerhitungan]);

  // Budget calculations
  const budgetStats = useMemo(() => {
    let plannedTotal = 0;
    let actualTotal = 0;
    
    budgetItems.forEach(item => {
      plannedTotal += item.rencana || 0;
      actualTotal += item.aktual || 0;
    });

    const targetLimit = profile.targetBudget || 0;
    const remainingBudget = targetLimit - actualTotal;
    const usagePercent = targetLimit > 0 ? Math.min(100, Math.round((actualTotal / targetLimit) * 100)) : 0;
    const overBudget = actualTotal > targetLimit;

    return {
      plannedTotal,
      actualTotal,
      remainingBudget,
      usagePercent,
      overBudget,
      targetLimit
    };
  }, [budgetItems, profile.targetBudget]);

  // Prepared Checklists and Progress Metrics
  const checklistStats = useMemo(() => {
    const total = checklistItems.length;
    const finished = checklistItems.filter(i => i.status === "Selesai").length;
    const percent = total > 0 ? Math.round((finished / total) * 100) : 0;
    return { total, finished, percent };
  }, [checklistItems]);

  const bagStats = useMemo(() => {
    const total = hospitalBagItems.length;
    const finished = hospitalBagItems.filter(i => i.status === "Siap").length;
    const percent = total > 0 ? Math.round((finished / total) * 100) : 0;
    return { total, finished, percent };
  }, [hospitalBagItems]);

  const wishlistStats = useMemo(() => {
    const total = wishlistItems.length;
    const finished = wishlistItems.filter(i => i.status === "Sudah Dibeli").length;
    const percent = total > 0 ? Math.round((finished / total) * 100) : 0;
    return { total, finished, percent };
  }, [wishlistItems]);

  // Upcoming Medical Visit based on the latest actual medical visit that advises a schedule
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

  // Recharts Data preparation: Expenses per category
  const expensesByCategoryData = useMemo(() => {
    const categories: Record<string, { rencana: number; aktual: number }> = {};
    
    // Group budget items by category
    budgetItems.forEach(i => {
      const cat = i.kategori || "Lainnya";
      if (!categories[cat]) {
        categories[cat] = { rencana: 0, aktual: 0 };
      }
      categories[cat].rencana += i.rencana || 0;
      categories[cat].aktual += i.aktual || 0;
    });

    return Object.keys(categories).map(catName => ({
      name: catName,
      Rencana: categories[catName].rencana,
      Aktual: categories[catName].aktual
    }));
  }, [budgetItems]);

  // Recharts Data: Allocation distribution pie chart
  const pieData = useMemo(() => {
    return expensesByCategoryData.map(item => ({
      name: item.name,
      value: item.Aktual
    })).filter(i => i.value > 0);
  }, [expensesByCategoryData]);

  // Theme palettes matching guidelines
  const COLORS = ["#14B8B8", "#FD9F80", "#FCC75A", "#8D82F2", "#2F3A3A", "#DDF7EF"];

  return (
    <div id="dashboard-view" className="space-y-6 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in">
      
      {/* 1. TOP CARING HEADER */}
      <section className="bg-gradient-to-r from-[#DDF7EF] via-[#FAF9F5] to-[#FFF1D6] rounded-3xl p-6 border border-[#E8E4FF] relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-300 filter blur-3xl opacity-20 -mr-6 -mt-6"></div>
        <div className="relative">
          <span className="text-xs font-bold text-[#14B8B8] font-mono tracking-wider uppercase bg-white/75 px-3 py-1 rounded-full border border-teal-100/50">
            Teman Parenting Care
          </span>
          <h1 className="text-xl md:text-2xl font-black text-[#2F3A3A] mt-2 tracking-tight">
            Semangat mempersiapkan kedatangan buah hati, {profile.namaMoms}! 🌸
          </h1>
          {profile.namaDads && (
            <p className="text-xs text-[#2F3A3A]/70 mt-1 font-semibold">
              Kompak terus bersama <span className="text-[#14B8B8] font-bold">{profile.namaDads}</span> demi masa depan Si Kecil.
            </p>
          )}
          
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-[11px] bg-[#14B8B8]/10 text-[#14B8B8] font-black px-3 py-1 rounded-full border border-[#14B8B8]/20">
              “Pelan-pelan ya, Moms. Mulai dari kebutuhan yang paling penting dulu.”
            </span>
            <span className="text-[11px] bg-amber-800/10 text-[#2F3A3A]/80 px-3 py-1 rounded-full border border-amber-200">
              “Semua persiapan bisa dilakukan sedikit demi sedikit.”
            </span>
          </div>
        </div>
      </section>

      {/* 2. CORE STATS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* A. Pregnancy Profile & Countdown */}
        <div id="dash-pregnancy-card" className="bg-white border border-[#E8E4FF] rounded-3xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#2F3A3A]/40 font-mono">
                Profil Kehamilan
              </span>
              <span className="text-xs font-extrabold bg-[#DDF7EF] text-[#14B8B8] px-3 py-1 rounded-full border border-[#14B8B8]/10">
                Trimester {preg.trimester}
              </span>
            </div>

            <div className="space-y-1">
              <div className="text-sm font-medium text-[#2F3A3A]/50">Perkiraan Lahir (HPL)</div>
              <div className="text-2xl font-black text-[#2F3A3A] tracking-tight">
                {new Date(preg.hpl).toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric"
                })}
              </div>
              {profile.namaBayi && (
                <div className="text-sm text-[#14B8B8] font-bold flex items-center gap-1 mt-1">
                  <Baby className="w-4 h-4" /> Mencintai {profile.namaBayi}
                </div>
              )}
            </div>

            {/* Progress bar info for pregnancy */}
            <div className="space-y-2 pt-3">
              <div className="flex justify-between text-xs font-semibold">
                <span>Usia Kehamilan: <strong className="text-[#14B8B8] text-sm">{preg.weeks} Minggu {preg.days} Hari</strong></span>
                <span>{preg.progressPercent}%</span>
              </div>
              <div className="w-full bg-[#FAF9F5] h-3 rounded-full overflow-hidden border border-[#2F3A3A]/5">
                <div 
                  className="bg-gradient-to-r from-[#DDF7EF] to-[#14B8B8] h-full rounded-full transition-all duration-1000"
                  style={{ width: `${preg.progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#2F3A3A]/5 pt-4 mt-6">
            <div className="bg-[#FAF9F5] rounded-2xl p-3 text-center border border-gray-100">
              <div className="text-2xl font-black text-[#14B8B8] font-mono">{preg.countdownDays}</div>
              <div className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider">Hari Lagi HPL</div>
            </div>
            <button 
              id="edit-profile-dash-btn"
              onClick={() => onNavigate("Pengaturan")}
              className="flex flex-col justify-center items-center rounded-2xl border border-[#2F3A3A]/10 hover:bg-[#DDF7EF]/40 text-[#2F3A3A]/70 text-xs font-bold transition-all p-3 cursor-pointer"
            >
              <Calendar className="w-4 h-4 mb-1 text-[#14B8B8]" />
              <span>Edit Profil</span>
            </button>
          </div>
        </div>

        {/* B. Baby Growth Analogy Widget */}
        <div id="dash-growth-card" className="bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200 filter blur-3xl opacity-20 -mr-6 -mt-6"></div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#2F3A3A]/40 font-mono">
                Ukuran Bayi Minggu ke-{preg.weeks}
              </span>
              <span className="text-[10px] uppercase font-bold bg-[#FFF1D6] text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                Analogi Buah
              </span>
            </div>

            <div className="flex items-start space-x-4">
              <motion.div 
                whileHover={{ scale: 1.15, rotate: [0, -10, 10, -10, 0] }}
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 rounded-3xl bg-white border-2 border-amber-200 shadow-sm flex items-center justify-center text-4xl shrink-0 cursor-pointer relative"
                title="Senggol Si Kecil!"
              >
                <span className="relative z-10">{preg.analogy.emoji}</span>
                <span className="absolute -bottom-1 -right-1 text-[8px] bg-[#14B8B8] text-white px-1.5 py-0.5 rounded-full font-black animate-bounce">Tap!</span>
              </motion.div>
              <div className="space-y-1 min-w-0">
                <div className="text-lg font-black text-[#2F3A3A] truncate flex items-center gap-1">
                  Sebesar {preg.analogy.name} <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                </div>
                <div className="flex space-x-2 text-xs font-mono text-gray-500">
                  <span className="bg-white/85 px-2 py-0.5 rounded-lg border border-gray-150">📏 {preg.analogy.length}</span>
                  <span className="bg-white/85 px-2 py-0.5 rounded-lg border border-gray-150">⚖️ {preg.analogy.weight}</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-[#2F3A3A]/70 leading-relaxed italic bg-white/60 p-3 rounded-2xl border border-white">
              “{preg.analogy.description}”
            </p>

            {/* Interactive Belly Rub */}
            <div className="space-y-2 pt-1 border-t border-[#2F3A3A]/5">
              <button
                id="dash-belly-rub-btn"
                onClick={handleVirtualRub}
                className="w-full bg-gradient-to-r from-pink-100 to-rose-100 hover:from-pink-200 hover:to-rose-200 border border-pink-200 text-rose-700 rounded-2xl py-2 px-3 text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-95"
              >
                <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 animate-pulse" />
                <span>Elus Perut Moms & Kirim Cinta 👼 ({bellyRubs})</span>
              </button>

              <AnimatePresence mode="wait">
                {rubMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-[11px] text-pink-700 bg-white/90 border border-pink-100 px-3 py-2 rounded-2xl leading-relaxed font-bold italic text-center"
                  >
                    {rubMessage}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="border-t border-[#2F3A3A]/5 pt-3 text-[10px] text-gray-400 italic text-center leading-normal mt-2">
            *Ukuran di atas hanya stimulasi estimasi berdasarkan usia kehamilan Moms.
          </div>
        </div>

        {/* C. Budget Metrics summary */}
        <div id="dash-budget-summary" className="bg-white border border-[#E8E4FF] rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-[#2F3A3A]/40 font-mono">
                Ringkasan Anggaran Kehamilan
              </span>
              <button 
                id="dash-go-budget-btn"
                onClick={() => onNavigate("Master Budget")}
                className="text-xs text-[#14B8B8] font-extrabold flex items-center hover:underline cursor-pointer"
              >
                Rincian <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Saku</span>
                <div className="text-lg font-black text-[#2F3A3A] font-mono whitespace-nowrap">
                  {formatRupiah(budgetStats.targetLimit)}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right block">Aktual Terbayar</span>
                <div className="text-lg font-black text-[#14B8B8] font-mono text-right whitespace-nowrap">
                  {formatRupiah(budgetStats.actualTotal)}
                </div>
              </div>
            </div>

            {/* Custom progress ring / line */}
            <div className="space-y-1 pt-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-[#2F3A3A]/60">Sisa Anggaran:</span>
                <span className={budgetStats.overBudget ? "text-red-500 font-bold" : "text-gray-500"}>
                  {formatRupiah(budgetStats.remainingBudget)}
                </span>
              </div>
              <div className="w-full bg-[#FAF9F5] h-2.5 rounded-full overflow-hidden border border-[#2F3A3A]/5">
                <div 
                  className={`h-full rounded-full transition-all duration-700 ${
                    budgetStats.overBudget ? "bg-red-500" : "bg-gradient-to-r from-[#DDF7EF] to-[#14B8B8]"
                  }`}
                  style={{ width: `${budgetStats.usagePercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {budgetStats.overBudget ? (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-3 flex items-start space-x-2 text-[11px] leading-relaxed">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span><strong>Over-budget!</strong> Total aktual belanjaan Kamu telah melebihi target saku. Silakan kaji ulang prioritas di rencana anggaran Kamu.</span>
              </div>
            ) : (
              <div className="bg-[#DDF7EF] border border-[#14B8B8]/20 text-teal-800 rounded-2xl p-3 flex items-start space-x-2 text-[11px] leading-relaxed">
                <TrendingUp className="w-4 h-4 shrink-0 mt-0.5 text-[#14B8B8]" />
                <span>Anggaran terkontrol dengan baik, masih tersisa <strong className="font-mono">{formatRupiah(budgetStats.remainingBudget)}</strong> untuk persiapan lanjut!</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. CHART & ENGAGEMENTS PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* A. Recharts graphs (Rencana vs Aktual) */}
        <div className="bg-white border border-[#E8E4FF] rounded-3xl p-6 shadow-xs lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-[#2F3A3A] tracking-tight">
              Sandingan Grafik: Rencana vs Aktual Pengeluaran
            </h3>
            <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-mono font-semibold">
              Berdasarkan Kategori
            </span>
          </div>

          {expensesByCategoryData.length === 0 ? (
            <div className="h-64 flex flex-col justify-center items-center text-center text-[#2F3A3A]/40 bg-[#FAF9F5]/40 rounded-2xl border border-dashed border-[#E8E4FF]">
              <Wallet className="w-8 h-8 opacity-40 mb-2 text-[#14B8B8]" />
              <span className="text-xs font-semibold">Belum ada rincian anggaran yang tercatat.</span>
              <p className="text-[11px] max-w-xs mt-1">
                Ayo tambahkan rencana kebutuhan Moms & Dads di Master Budget untuk melihat sandingan grafik.
              </p>
            </div>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={expensesByCategoryData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                >
                  <XAxis dataKey="name" tick={{ fill: "#2F3A3A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#2F3A3A", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: "16px", background: "#FAF9F5", border: "1px solid #E8E4FF", fontFamily: "monospace", fontSize: 11 }}
                    formatter={(value: any) => [formatRupiah(value), ""]}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Rencana" fill="#8D82F2" stroke="#6D5DF0" strokeWidth={1} radius={[8, 8, 0, 0]} />
                  <Bar dataKey="Aktual" fill="#14B8B8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* B. Progress checklist cards & Medical Control banner */}
        <div className="space-y-6">
          
          {/* Progress Tracker Widget */}
          <div className="bg-white border border-[#E8E4FF] rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#2F3A3A]/40 font-mono">
              Progress Persiapan Belanja & Tugas
            </h3>

            <div className="space-y-4">
              {/* Checklist */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><CheckSquare className="w-3.5 h-3.5 text-[#14B8B8]" /> Trimester Checklist</span>
                  <span className="font-mono text-[11px]">{checklistStats.finished}/{checklistStats.total} ({checklistStats.percent}%)</span>
                </div>
                <div className="w-full bg-[#FAF9F5] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#14B8B8] h-full" style={{ width: `${checklistStats.percent}%` }}></div>
                </div>
              </div>

              {/* Hospital Bag */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-[#14B8B8]" /> Hospital Bag Checklist</span>
                  <span className="font-mono text-[11px]">{bagStats.finished}/{bagStats.total} ({bagStats.percent}%)</span>
                </div>
                <div className="w-full bg-[#FAF9F5] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#14B8B8] h-full" style={{ width: `${bagStats.percent}%` }}></div>
                </div>
              </div>

              {/* Wishlist */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-[#14B8B8]" /> Wishlist Terbeli</span>
                  <span className="font-mono text-[11px]">{wishlistStats.finished}/{wishlistStats.total} ({wishlistStats.percent}%)</span>
                </div>
                <div className="w-full bg-[#FAF9F5] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#14B8B8] h-full" style={{ width: `${wishlistStats.percent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Next Doctor Visit Widget */}
          <div className="bg-gradient-to-br from-[#E8E4FF] to-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-5 shadow-xs relative overflow-hidden">
            <div className="absolute -right-5 -bottom-5 w-24 h-24 bg-[#14B8B8]/10 rounded-full"></div>
            <div className="space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] bg-white text-purple-700 font-extrabold px-2.5 py-0.5 rounded-full border border-purple-200">
                  Kontrol Obgyn & Bidan berikutnya
                </span>
                <Stethoscope className="w-4 h-4 text-[#14B8B8]" />
              </div>

              {nextVisit ? (
                <div className="space-y-1">
                  <div className="text-lg font-black text-[#2F3A3A] tracking-tight truncate">
                    {nextVisit.visit.usiaKehamilan || "Belum diisi"}
                  </div>
                  <p className="text-xs text-[#2F3A3A]/70 line-clamp-1 font-semibold">
                    📍 {nextVisit.visit.tempat} ({nextVisit.visit.dokterBidan})
                  </p>
                  <p className={`text-xs font-bold mt-1 bg-white/80 p-2 rounded-xl inline-block border ${nextVisit.isUpcoming ? "text-[#14B8B8] border-teal-100" : "text-gray-500 border-gray-200"}`}>
                    📅 {nextVisit.isUpcoming ? "Tanggal Kontrol" : "Kontrol Terakhir"}: <strong className="font-mono text-[#2F3A3A]">{nextVisit.visit.jadwalBerikutnya}</strong> {!nextVisit.isUpcoming && "(Lewat)"}
                  </p>
                </div>
              ) : (
                <div className="py-2 space-y-2">
                  <span className="text-xs font-bold text-[#2F3A3A]/60 block leading-tight">
                    Belum ada jadwal konsultasi mendatang yang terdaftar.
                  </span>
                  <button 
                    id="dash-add-visit-btn"
                    onClick={() => onNavigate("Kunjungan Medis")}
                    className="text-[11px] bg-white hover:bg-teal-50 text-[#14B8B8] px-3 py-1.5 rounded-xl border border-teal-200/50 font-extrabold transition-all cursor-pointer"
                  >
                    Atur Kunjungan Medis Pertama
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* 4. CLINICAL SAFETY DISCLAIMER */}
      <footer className="bg-[#FAF9F5] border border-[#E8E4FF] border-dashed rounded-3xl p-5 text-center text-xs text-gray-500 leading-normal max-w-4xl mx-auto space-y-2 mt-8">
        <span className="font-bold block text-[#2F3A3A]/90">
          ⚠️ Disclaimer Penting Teman Parenting
        </span>
        <p className="text-[11px] text-gray-400">
          Aplikasi Baby Budget Plan bukan merupakan aplikasi medis, bukan alat diagnosis klinis, dan bukan pengganti konsultasi kehamilan dari dokter kandungan, bidan, ahli gizi, atau tenaga kesehatan profesional berlisensi lainnya. Seluruh informasi perkembangan janin, estimasi HPL, usia kehamilan, analogi buah, dan perhitungan trimester murni merupakan estimasi edukatif berdasarkan input tanggal pengguna. Untuk pertolongan medis dan kehamilan tertentu, harap selalu berkonsultasi langsung ke fasilitas kesehatan pilihan utama Anda.
        </p>
      </footer>
    </div>
  );
}
