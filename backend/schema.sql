-- D1 SQLite Database Schema for Baby Budget Plan

-- 1. Pregnancy Profiles
CREATE TABLE IF NOT EXISTS pregnancy_profiles (
  userId TEXT PRIMARY KEY,
  namaMoms TEXT NOT NULL,
  namaDads TEXT,
  namaBayi TEXT,
  hpht TEXT NOT NULL,
  hpl TEXT NOT NULL,
  pilihanPerhitungan TEXT NOT NULL CHECK(pilihanPerhitungan IN ('HPHT', 'HPL')),
  targetBudget REAL NOT NULL,
  mataUang TEXT NOT NULL DEFAULT 'IDR',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

-- 2. Budget Items
CREATE TABLE IF NOT EXISTS budget_items (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  subkategori TEXT,
  prioritas TEXT NOT NULL CHECK(prioritas IN ('Tinggi', 'Sedang', 'Rendah')),
  rencana REAL NOT NULL,
  aktual REAL NOT NULL,
  statusPembayaran TEXT NOT NULL CHECK(statusPembayaran IN ('Belum Lunas', 'Lunas', 'DP')),
  metode TEXT,
  catatan TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_budget_items_user ON budget_items(userId);

-- 3. Wishlist Items
CREATE TABLE IF NOT EXISTS wishlist_items (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  nama TEXT NOT NULL,
  kategori TEXT,
  brand TEXT,
  estimasi REAL NOT NULL,
  hargaAktual REAL NOT NULL,
  jumlah INTEGER NOT NULL DEFAULT 1,
  link TEXT,
  status TEXT NOT NULL CHECK(status IN ('Belum Dibeli', 'Sudah Dibeli')),
  prioritas TEXT NOT NULL CHECK(prioritas IN ('Tinggi', 'Sedang', 'Rendah')),
  catatan TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user ON wishlist_items(userId);

-- 4. Checklist Items
CREATE TABLE IF NOT EXISTS checklist_items (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  nama TEXT NOT NULL,
  trimester INTEGER NOT NULL,
  bulan INTEGER NOT NULL,
  prioritas TEXT NOT NULL DEFAULT 'Sedang',
  status TEXT NOT NULL CHECK(status IN ('Belum', 'Selesai')),
  minggu INTEGER,
  statusChecklist TEXT NOT NULL DEFAULT 'Belum Dimulai',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_checklist_items_user ON checklist_items(userId);

-- 5. Medical Visits
CREATE TABLE IF NOT EXISTS medical_visits (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  tanggal TEXT NOT NULL,
  usiaKehamilan TEXT NOT NULL,
  dokterBidan TEXT NOT NULL,
  tempat TEXT NOT NULL,
  jenisPemeriksaan TEXT NOT NULL,
  hasilCatatan TEXT,
  tensi TEXT,
  beratBadan TEXT,
  biaya REAL NOT NULL DEFAULT 0,
  resepVitamin TEXT,
  jadwalBerikutnya TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_medical_visits_user ON medical_visits(userId);

-- 6. Baby Names
CREATE TABLE IF NOT EXISTS baby_names (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  nama TEXT NOT NULL,
  gender TEXT NOT NULL CHECK(gender IN ('Laki-laki', 'Perempuan', 'Netral')),
  asal TEXT NOT NULL DEFAULT 'Lokal',
  arti TEXT NOT NULL,
  panggilan TEXT,
  catatan TEXT,
  statusPilihan TEXT NOT NULL DEFAULT 'Favorit',
  isFavorite INTEGER NOT NULL DEFAULT 0, -- 0 (false), 1 (true)
  votes INTEGER NOT NULL DEFAULT 0,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_baby_names_user ON baby_names(userId);

-- 7. Hospital Bag Items
CREATE TABLE IF NOT EXISTS hospital_bag_items (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  barang TEXT NOT NULL,
  kategori TEXT NOT NULL CHECK(kategori IN ('Bayi', 'Moms', 'Pendamping', 'Dokumen')),
  jumlah INTEGER NOT NULL DEFAULT 1,
  satuan TEXT NOT NULL DEFAULT 'pcs',
  catatan TEXT,
  prioritas TEXT NOT NULL DEFAULT 'Tinggi',
  status TEXT NOT NULL CHECK(status IN ('Belum Siap', 'Siap')),
  tasMana TEXT NOT NULL DEFAULT 'Koper Utama',
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hospital_bag_items_user ON hospital_bag_items(userId);

-- 8. Hospital Comparisons
CREATE TABLE IF NOT EXISTS hospital_comparisons (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  nama TEXT NOT NULL,
  jenis TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  jarak REAL NOT NULL DEFAULT 1.0,
  biayaNormal REAL NOT NULL,
  biayaCaesar REAL NOT NULL,
  fasilitas TEXT,
  nicu INTEGER NOT NULL DEFAULT 0, -- 0 (false), 1 (true)
  bpjsAsuransi INTEGER NOT NULL DEFAULT 0, -- 0 (false), 1 (true)
  kontak TEXT,
  linkGmap TEXT,
  statusKunjungan TEXT NOT NULL CHECK(statusKunjungan IN ('Belum Disurvei', 'Sudah Disurvei', 'Pilihan Utama')),
  kelebihan TEXT,
  kekurangan TEXT,
  catatanBiaya TEXT,
  rating INTEGER NOT NULL DEFAULT 4,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_hospital_comparisons_user ON hospital_comparisons(userId);

-- 9. Whitelisted Emails (Backup replica in D1 relational database)
CREATE TABLE IF NOT EXISTS allowed_emails (
  email TEXT PRIMARY KEY,
  addedBy TEXT NOT NULL,
  createdAt TEXT NOT NULL
);
