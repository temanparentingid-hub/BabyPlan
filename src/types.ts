// Shared types for Baby Budget Plan "Teman Parenting"

export interface PregnancyProfile {
  userId: string;
  namaMoms: string;
  namaDads?: string;
  namaBayi?: string;
  hpht: string; // YYYY-MM-DD
  hpl: string;  // YYYY-MM-DD
  pilihanPerhitungan: "HPHT" | "HPL";
  targetBudget: number;
  mataUang: string; // e.g. "Rp (Rupiah)"
  createdAt: any;
  updatedAt: any;
}

export interface BudgetItem {
  id: string;
  userId: string;
  tanggal: string; // YYYY-MM-DD
  nama: string;
  kategori: string; // "Medis & Kontrol", "Perlengkapan Bayi", "Perlengkapan Ibu", "Persalinan", "Syukuran & Aqiqah", "Lainnya"
  subkategori?: string;
  prioritas: "Tinggi" | "Sedang" | "Rendah";
  rencana: number;
  aktual: number;
  statusPembayaran: "Belum Lunas" | "Lunas" | "DP";
  metode?: string;
  catatan?: string;
  createdAt: any;
  updatedAt: any;
}

export interface WishlistItem {
  id: string;
  userId: string;
  nama: string;
  kategori: string;
  brand?: string;
  estimasi: number;
  hargaAktual: number;
  jumlah: number;
  link?: string;
  status: "Belum Dibeli" | "Sudah Dibeli";
  prioritas: "Tinggi" | "Sedang" | "Rendah";
  catatan?: string;
  createdAt: any;
  updatedAt: any;
}

export interface ChecklistItem {
  id: string;
  userId: string;
  judul: string;
  status: "Belum Selesai" | "Selesai";
  trimester: number; // 1, 2, or 3
  bulan: string; // e.g. "Bulan 1" or others
  kategori: string; // e.g. "Medis", "Belanja", "Kustom"
  minggu?: number;
  statusChecklist?: "Belum Dimulai" | "Dipersiapkan" | "Selesai";
  createdAt: any;
  updatedAt: any;
}

export interface MedicalVisit {
  id: string;
  userId: string;
  tanggalKunjungan: string; // YYYY-MM-DD
  usiaKehamilan: string; // e.g. "14 Minggu"
  dokterBidan: string;
  tempat: string;
  tensi?: string; // e.g. "120/80"
  beratBadan?: string; // e.g. "58" for 58kg
  hasilCatatan: string;
  biaya?: number;
  resepVitamin?: string;
  jadwalBerikutnya?: string; // YYYY-MM-DD
  createdAt: any;
  updatedAt: any;
}

export interface BabyName {
  id: string;
  userId: string;
  nama: string;
  gender: "Laki-laki" | "Perempuan" | "Netral";
  asal: string; // Origin Language, e.g. "Sanskerta"
  arti: string; // Meaning description
  panggilan?: string;
  catatan?: string;
  statusPilihan?: "Pilihan Utama" | "Favorit" | "Pertimbangan" | "Pilihan Kami";
  isFavorite?: boolean;
  votes: number; // Upvote counter
  createdAt: any;
  updatedAt: any;
}

export interface HospitalBagItem {
  id: string;
  userId: string;
  barang: string;
  kategori: string; // "Perlengkapan Bayi", "Perlengkapan Ibu", "Perlengkapan Ayah", "Dokumen Penting"
  jumlah: number;
  satuan?: "pcs" | "pack";
  catatan?: string;
  status: "Belum Siap" | "Siap";
  createdAt: any;
  updatedAt: any;
}

export interface HospitalComparison {
  id: string;
  userId: string;
  nama: string;
  metodePersalinan: string; // "Normal", "Caesar ERACS", etc.
  estimasiBiaya: number;
  fasilitasLayanan: string[]; // List of facility amenities
  kelebihan?: string;
  kekurangan?: string;
  lokasi?: string;
  catatanBiaya?: string;
  kontak?: string;
  linkGmap?: string;
  rating: number; // 1 to 5
  createdAt: any;
  updatedAt: any;
}

export interface AllowedEmail {
  email: string; // Document ID is the lowercase email
  addedBy: string;
  createdAt: any;
}

