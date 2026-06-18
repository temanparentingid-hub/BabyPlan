// Pregnancy calculation utilities for Baby Budget Plan

export interface SizeAnalogy {
  emoji: string;
  name: string;
  length: string;
  weight: string;
  description: string;
}

export interface PregnancyDetails {
  weeks: number;
  days: number;
  trimester: number;
  hpl: string;
  countdownDays: number;
  progressPercent: number;
  analogy: SizeAnalogy;
}

const ANALOGIES: Record<number, SizeAnalogy> = {
  1: { emoji: "🌱", name: "Sel Telur Kecil", length: "0.1 mm", weight: "0g", description: "Mulai bersiap! Tubuh sedang mempersiapkan diri untuk perjalanan indah ini." },
  2: { emoji: "🌱", name: "Pembuahan", length: "0.1 mm", weight: "0g", description: "Pembuahan terjadi, sel pertama kehidupan baru Moms & Dads mulai membelah diri." },
  3: { emoji: "🔬", name: "Blastokista", length: "0.2 mm", weight: "0g", description: "Bakal janin menempel di rahim Moms, menancapkan fondasi kehidupan." },
  4: { emoji: "🌱", name: "Biji Wijen", length: "1 mm", weight: "0.1g", description: "Sel-sel mulai membentuk organ vital serta struktur plasenta." },
  5: { emoji: "🍎", name: "Biji Apel", length: "2 mm", weight: "0.2g", description: "Tabung saraf bayi mulai terbentuk, dan detak jantung mikro pertama mulai ada!" },
  6: { emoji: "🟢", name: "Kacang Polong", length: "5 mm", weight: "0.4g", description: "Wajah mungilnya sudah mulai membentuk mata, hidung, dan telinga mini." },
  7: { emoji: "🫐", name: "Blueberry", length: "1.2 cm", weight: "1g", description: "Tangan dan kaki kecilnya tumbuh seperti kuncup tanaman yang lucu." },
  8: { emoji: "🍒", name: "Raspberry", length: "1.6 cm", weight: "1.5g", description: "Bayi Moms sudah mulai melakukan gerakan-gerakan acak halus reflektif." },
  9: { emoji: "🍒", name: "Ceri", length: "2.3 cm", weight: "2g", description: "Ekor kecilnya menghilang sepenuhnya, sekarang ia resmi dipanggil janin!" },
  10: { emoji: "🍓", name: "Stroberi", length: "3.1 cm", weight: "4g", description: "Otak bayi tumbuh sangat cepat, sekitar 250.000 sel saraf diproduksi tiap menit." },
  11: { emoji: "🍋", name: "Jeruk Nipis", length: "4.1 cm", weight: "7g", description: "Organ internalnya sudah terorganisir dan kuku mungilnya mulai terbentuk." },
  12: { emoji: "🍑", name: "Plum", length: "5.4 cm", weight: "14g", description: "Selamat Moms, akhir trimester pertamamu! Bayi sudah bisa merenggangkan jemarinya." },
  13: { emoji: "🍋", name: "Lemon", length: "7.4 cm", weight: "23g", description: "Sidik jari bayi yang unik sudah terukir permanen di ujung jarinya." },
  14: { emoji: "🍊", name: "Jeruk Manis", length: "8.7 cm", weight: "43g", description: "Bayi sudah bisa tersenyum, mengerutkan dahi, dan menghisap jempolnya." },
  15: { emoji: "🍎", name: "Apel", length: "10.1 cm", weight: "70g", description: "Kulitnya yang sangat tipis mulai ditumbuhi rambut halus pelindung (lanugo)." },
  16: { emoji: "🥑", name: "Alpukat", length: "11.6 cm", weight: "100g", description: "Bayi sudah bisa mendengarkan detak jantung Moms, aliran darah, dan suara di luar." },
  17: { emoji: "🍅", name: "Delima", length: "12 cm", weight: "140g", description: "Kerangka tubuh bayi yang semula lunak seperti tulang rawan mulai mengeras." },
  18: { emoji: "🍠", name: "Ubi Jalar", length: "14.2 cm", weight: "190g", description: "Bagus, Moms! Bayi sudah mulai bisa menguap dan cegukan di dalam kandungan." },
  19: { emoji: "🥭", name: "Mangga", length: "15.3 cm", weight: "240g", description: "Lapisan pelindung vernix caseosa mulai menyelimuti kulit bayi agar tidak keriput." },
  20: { emoji: "🍌", name: "Pisang", length: "25.6 cm", weight: "300g", description: "Pertengahan perjalanan (20 minggu)! Indra pengecap dan saraf sensoriknya aktif." },
  21: { emoji: "🥕", name: "Wortel", length: "27 cm", weight: "360g", description: "Si Kecil semakin aktif menendang, sikut, dan berputar. Hangat dan menyenangkan!" },
  22: { emoji: "🥥", name: "Pepaya Kecil", length: "28 cm", weight: "430g", description: "Kelopak mata bayi belum terbuka, tapi respons terhadap cahaya luar kian meningkat." },
  23: { emoji: "🍆", name: "Terung", length: "29 cm", weight: "500g", description: "Pembuluh darah paru-paru berkembang pesat agar dapat bernapas di luar rahim nanti." },
  24: { emoji: "🌽", name: "Jagung", length: "30 cm", weight: "600g", description: "Bobot bayi bertambah karena otot, tulang, dan jaringan lemaknya makin padat." },
  25: { emoji: "🥬", name: "Kol Cabang", length: "34 cm", weight: "660g", description: "Bayi sudah mulai bisa membedakan suara Moms dan Dads dengan lebih jelas." },
  26: { emoji: "🌭", name: "Mentimun", length: "35 cm", weight: "760g", description: "Bayi mulai belajar bernapas dengan menghirup amandel/air ketuban di sekitarnya." },
  27: { emoji: "🥦", name: "Kembang Kol", length: "36 cm", weight: "870g", description: "Selamat datang di Trimester Ketiga! Matanya mulai bisa berkedip terbuka." },
  28: { emoji: "🍆", name: "Terung Besar", length: "37.5 cm", weight: "1 kg", description: "Berat bayi mencapai 1 kg! Bulu matanya makin lentik dan lebat mendampingi matanya." },
  29: { emoji: "🎃", name: "Labu Kecil", length: "38.6 cm", weight: "1.15 kg", description: "Si kecil makin responsif terhadap elusan tangan Moms & Dads di perut." },
  30: { emoji: "🥬", name: "Kubis Besar", length: "40 cm", weight: "1.3 kg", description: "Volume air ketuban sedikit menyusut karena Si Kecil bertumbuh makin besar mendominasi rahim." },
  31: { emoji: "🥥", name: "Kelapa Tua", length: "41.1 cm", weight: "1.5 kg", description: "Bayi sudah bisa memutar kepalanya dari satu sisi ke sisi lain dengan lincah." },
  32: { emoji: "🍈", name: "Blewah", length: "42.4 cm", weight: "1.7 kg", description: "Lapisan lemak bayi makin tebal, membuat kulitnya terlihat ranum dan kemerahan." },
  33: { emoji: "🍍", name: "Nanas", length: "43.7 cm", weight: "1.9 kg", description: "Sistem imun Si Kecil diperkuat oleh antibodi yang tersalur lewat tali pusar Moms." },
  34: { emoji: "🍈", name: "Melon Cantaloupe", length: "45 cm", weight: "2.1 kg", description: "Paru-parunya sudah hampir matang sempurna. Persiapan nafas pertama luar biasa!" },
  35: { emoji: "🍉", name: "Semangka Mini", length: "46.2 cm", weight: "2.4 kg", description: "Hampir siap melahirkan! Si Kecil mulai memposisikan kepala menghadap ke bawah pinggul." },
  36: { emoji: "🥬", name: "Selada Romaine", length: "47.4 cm", weight: "2.62 kg", description: "Setiap hari Si Kecil menimbun lemak sekitar 28 gram agar tubuhnya hangat nanti." },
  37: { emoji: "🍉", name: "Semangka Kecil", length: "48.6 cm", weight: "2.85 kg", description: "Secara medis kandungan usia ini sudah dianggap matang (full term). Tenang ya Moms." },
  38: { emoji: "🎃", name: "Labu Madu", length: "49.8 cm", weight: "3.1 kg", description: "Semua sistem tubuh bayi sudah siap mandiri di luar rahim. Ayo tunggu masanya." },
  39: { emoji: "🍉", name: "Semangka Sedang", length: "50.7 cm", weight: "3.3 kg", description: "Moms & Dads, siapkan mental dengan senyuman hangat. Tali pusar mulai melambat menyalurkan plasenta." },
  40: { emoji: "🎃", name: "Labu Besar", length: "51.2 cm", weight: "3.45 kg", description: "Hari Perkiraan Lahir (HPL) tiba! Si Kecil mungkin lahir tepat waktu, nikmati saatnya." },
};

const DEFAULT_ANALOGY: SizeAnalogy = {
  emoji: "🍼",
  name: "Bayi Menggemaskan",
  length: "50+ cm",
  weight: "3.5 kg",
  description: "Selamat Moms & Dads! Perjalanan menyambut buah hati tercinta telah usai, masanya babak baru dimulai."
};

/**
 * Calculates pregnancy stats based on client current date (which is June 12, 2026, or any user provided date)
 * HPHT calculation is:
 * - HPL is 280 days after HPHT.
 * - Pregnancy weeks is days passed from HPHT divided by 7.
 */
export function calculatePregnancy(
  hphtStr: string,
  hplStr: string,
  pilihan: "HPHT" | "HPL"
): PregnancyDetails {
  const currentDate = new Date(); // In 2026 environment
  
  let validHpht: Date;
  let validHpl: Date;

  if (pilihan === "HPHT") {
    validHpht = new Date(hphtStr);
    // HPL is HPHT + 280 days
    validHpl = new Date(validHpht.getTime() + 280 * 24 * 60 * 60 * 1000);
  } else {
    validHpl = new Date(hplStr);
    // HPHT is HPL - 280 days
    validHpht = new Date(validHpl.getTime() - 280 * 24 * 60 * 60 * 1000);
  }

  // Calculate difference in milliseconds
  const diffTime = currentDate.getTime() - validHpht.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let weeks = Math.floor(diffDays / 7);
  let days = diffDays % 7;

  // Clamping
  if (weeks < 0) {
    weeks = 0;
    days = 0;
  }
  if (weeks > 42) {
    weeks = 42;
  }

  // Trimester calculation
  let trimester = 1;
  if (weeks >= 13 && weeks < 27) {
    trimester = 2;
  } else if (weeks >= 27) {
    trimester = 3;
  }

  // Estimated HPL string formatted as YYYY-MM-DD
  const hplFormatted = validHpl.toISOString().split("T")[0];

  // Countdown to HPL
  const countdownTime = validHpl.getTime() - currentDate.getTime();
  let countdownDays = Math.ceil(countdownTime / (1000 * 60 * 60 * 24));
  if (countdownDays < 0) {
    countdownDays = 0;
  }

  // Progress relative to 280 days (40 weeks)
  let progressPercent = Math.min(100, Math.max(0, Math.round((diffDays / 280) * 100)));

  // Analogy selection index: 1-40
  const weekIndex = Math.max(1, Math.min(40, weeks || 1));
  const analogy = ANALOGIES[weekIndex] || DEFAULT_ANALOGY;

  return {
    weeks,
    days,
    trimester,
    hpl: hplFormatted,
    countdownDays,
    progressPercent,
    analogy
  };
}

/**
 * Validates a date string (YYYY-MM-DD)
 */
export function isValidDateString(date: string): boolean {
  if (!date) return false;
  const regEx = /^\d{4}-\d{2}-\d{2}$/;
  if (!date.match(regEx)) return false; // Invalid format
  const d = new Date(date);
  const dNum = d.getTime();
  if (!dNum && dNum !== 0) return false; // NaN value, Invalid date
  return d.toISOString().slice(0, 10) === date;
}

/**
 * Formatting rupiah currency gracefully
 */
export function formatRupiah(val: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0
  }).format(val);
}
