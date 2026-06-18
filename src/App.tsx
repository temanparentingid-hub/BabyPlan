import React, { useState, useEffect } from "react";
import { 
  auth, 
} from "./firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { api } from "./api";

// Types
import { 
  PregnancyProfile, 
  BudgetItem, 
  WishlistItem, 
  ChecklistItem, 
  MedicalVisit, 
  BabyName, 
  HospitalBagItem, 
  HospitalComparison 
} from "./types";

// Mock Data for Demo
import { 
  mockProfile, 
  mockBudgetItems, 
  mockWishlistItems, 
  mockChecklistItems, 
  mockMedicalVisits, 
  mockBabyNames, 
  mockHospitalBagItems, 
  mockHospitalComparisons 
} from "./mockData";

// Components
import Navigation from "./components/Navigation";
import LoginModal from "./components/LoginModal";
import OnboardingModal from "./components/OnboardingModal";
import PregnancyDashboard from "./components/PregnancyDashboard";
import MasterBudgetManager from "./components/MasterBudgetManager";
import WishlistManager from "./components/WishlistManager";
import ChecklistManager from "./components/ChecklistManager";
import MedicalVisitTracker from "./components/MedicalVisitTracker";
import BabyNameInspirations from "./components/BabyNameInspirations";
import HospitalBagManager from "./components/HospitalBagManager";
import HospitalSelector from "./components/HospitalSelector";
import SettingsManager from "./components/SettingsManager";
import UserAccessManager from "./components/UserAccessManager";

export default function App() {
  // Current screen / tab state
  const [activeTab, setActiveTab] = useState<string>("Dashboard");

  // Auth states
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Business Data States
  const [profile, setProfile] = useState<PregnancyProfile | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [medicalVisits, setMedicalVisits] = useState<MedicalVisit[]>([]);
  const [babyNames, setBabyNames] = useState<BabyName[]>([]);
  const [hospitalBagItems, setHospitalBagItems] = useState<HospitalBagItem[]>([]);
  const [hospitalComparisons, setHospitalComparisons] = useState<HospitalComparison[]>([]);

  // 1. LISTEN TO FIREBASE AUTH STATE CHANGES & LOAD DATA
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userEmail = currentUser.email?.toLowerCase();
        if (userEmail) {
          const isWhitelisted = await api.checkEmailWhitelisted(userEmail);
          if (isWhitelisted) {
            setLoading(true);
            setUser(currentUser);
            setIsDemo(false);

            // Auto-register parent admin email in allowedEmails database if they logged in
            if (userEmail === "temanparenting.id@gmail.com") {
              try {
                await api.addWhitelistEmail("temanparenting.id@gmail.com");
                console.log("Admin email temanparenting.id@gmail.com auto-registered in D1 allowed_emails.");
              } catch (err) {
                console.error("Auto-registration of admin email failed:", err);
              }
            }
          } else {
            console.warn(`User ${userEmail} is not whitelisted. Signing out.`);
            await signOut(auth);
            setUser(null);
            setIsDemo(true);
            setLoading(false);
          }
        } else {
          await signOut(auth);
          setUser(null);
          setIsDemo(true);
          setLoading(false);
        }
      } else {
        setUser(null);
        setIsDemo(true);
        // Load demo defaults directly
        setProfile(mockProfile);
        setBudgetItems(mockBudgetItems);
        setWishlistItems(mockWishlistItems);
        setChecklistItems(mockChecklistItems);
        setMedicalVisits(mockMedicalVisits);
        setBabyNames(mockBabyNames);
        setHospitalBagItems(mockHospitalBagItems);
        setHospitalComparisons(mockHospitalComparisons);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadAllData = async () => {
    if (!user || isDemo) return;
    setLoading(true);
    try {
      const prof = await api.getProfile();
      setProfile(prof);

      const budgets = await api.getBudgets();
      setBudgetItems(budgets);

      const wishlists = await api.getWishlist();
      setWishlistItems(wishlists);

      const checklists = await api.getChecklist();
      setChecklistItems(checklists.map((d: any) => ({
        ...d,
        judul: d.nama || "Usulan rencana",
        status: d.status === "Selesai" ? "Selesai" : "Belum Selesai",
        bulan: `Bulan ${d.bulan || 1}`
      })));

      const medicals = await api.getMedicalVisits();
      setMedicalVisits(medicals.map((d: any) => ({
        ...d,
        tanggalKunjungan: d.tanggal || d.tanggalKunjungan || "2026-06-12",
        hasilCatatan: d.hasilCatatan || d.hasil || d.jenisPemeriksaan || "Hasil normal",
        tensi: d.tensi || "",
        beratBadan: d.beratBadan || "",
        biaya: d.biaya !== undefined && d.biaya !== null ? Number(d.biaya) : 0,
        resepVitamin: d.resepVitamin || d.resep || "",
        jadwalBerikutnya: d.jadwalBerikutnya || d.jadwal || ""
      })));

      const names = await api.getBabyNames();
      setBabyNames(names.map((d: any) => ({
        ...d,
        asal: d.asal || d.asalBahasa || "Lokal",
        arti: d.arti || "Punya doa mulia"
      })));

      const bags = await api.getBagItems();
      setHospitalBagItems(bags.map((d: any) => ({
        ...d,
        barang: d.namaBarang || d.barang,
        satuan: d.satuan || "pcs",
        catatan: d.catatan || ""
      })));

      const hospitals = await api.getHospitals();
      setHospitalComparisons(hospitals.map((d: any) => ({
        ...d,
        metodePersalinan: d.jenis || "Normal",
        estimasiBiaya: d.biayaNormal || d.estimasiBiaya || 0,
        fasilitasLayanan: d.fasilitas ? d.fasilitas.split(", ") : [],
        rating: d.statusKunjungan === "Pilihan Utama" ? 5 : 4
      })));
    } catch (err) {
      console.error("Gagal memuat data dari Cloudflare Workers:", err);
    } finally {
      setLoading(false);
    }
  };

  // 2. LOAD USER DATA ONCE AUTHENTICATED
  useEffect(() => {
    if (user && !isDemo) {
      loadAllData();
    }
  }, [user, isDemo]);

  // 3. MUTATION HANDLERS
  const handleOnboardingComplete = async (fields: Omit<PregnancyProfile, "userId" | "createdAt" | "updatedAt">) => {
    if (isDemo || !user) return;
    try {
      await api.saveProfile(fields);
      await loadAllData();
    } catch (e) {
      console.error("Gagal menyimpan onboarding:", e);
    }
  };

  const handleUpdateProfile = async (fields: Partial<PregnancyProfile>) => {
    if (isDemo || !user) return;
    try {
      const updatedFields = {
        namaMoms: fields.namaMoms || profile?.namaMoms || "",
        namaDads: fields.namaDads !== undefined ? fields.namaDads : profile?.namaDads,
        namaBayi: fields.namaBayi !== undefined ? fields.namaBayi : profile?.namaBayi,
        hpht: fields.hpht || profile?.hpht || "",
        hpl: fields.hpl || profile?.hpl || "",
        pilihanPerhitungan: fields.pilihanPerhitungan || profile?.pilihanPerhitungan || "HPHT",
        targetBudget: fields.targetBudget !== undefined ? fields.targetBudget : profile?.targetBudget || 0,
        mataUang: fields.mataUang || profile?.mataUang || "IDR",
      };
      await api.saveProfile(updatedFields);
      await loadAllData();
    } catch (e) {
      console.error("Gagal update profil:", e);
    }
  };

  // B. Budget CRUD
  const handleAddBudget = async (item: Omit<BudgetItem, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (isDemo || !user) return;
    const cleanId = "item_" + Math.random().toString(36).substring(2, 11);
    try {
      await api.addBudget({
        ...item,
        id: cleanId
      });
      await loadAllData();
    } catch (e) {
      console.error("Gagal tambah budget:", e);
    }
  };

  const handleEditBudget = async (id: string, fields: Partial<BudgetItem>) => {
    if (isDemo || !user) return;
    try {
      await api.updateBudget(id, fields);
      await loadAllData();
    } catch (e) {
      console.error("Gagal edit budget:", e);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (isDemo || !user) return;
    try {
      await api.deleteBudget(id);
      await loadAllData();
    } catch (e) {
      console.error("Gagal hapus budget:", e);
    }
  };

  // C. Wishlist CRUD
  const handleAddWishlist = async (item: Omit<WishlistItem, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (isDemo || !user) return;
    const cleanId = "wish_" + Math.random().toString(36).substring(2, 11);
    try {
      await api.addWishlist({
        ...item,
        id: cleanId
      });
      await loadAllData();
    } catch (e) {
      console.error("Gagal tambah wishlist:", e);
    }
  };

  const handleEditWishlist = async (id: string, fields: Partial<WishlistItem>) => {
    if (isDemo || !user) return;
    try {
      await api.updateWishlist(id, fields);
      await loadAllData();
    } catch (e) {
      console.error("Gagal edit wishlist:", e);
    }
  };

  const handleDeleteWishlist = async (id: string) => {
    if (isDemo || !user) return;
    try {
      await api.deleteWishlist(id);
      await loadAllData();
    } catch (e) {
      console.error("Gagal hapus wishlist:", e);
    }
  };

  const handleConvertToBudget = async (wish: WishlistItem) => {
    if (isDemo || !user) return;
    try {
      const budgetPayload: Omit<BudgetItem, "id" | "userId" | "createdAt" | "updatedAt"> = {
        nama: wish.nama,
        kategori: "Perlengkapan Bayi",
        subkategori: wish.kategori || "Wishlist",
        prioritas: wish.prioritas === "Tinggi" ? "Tinggi" : wish.prioritas === "Sedang" ? "Sedang" : "Rendah",
        rencana: wish.estimasi,
        aktual: wish.hargaAktual || 0,
        statusPembayaran: wish.status === "Sudah Dibeli" ? "Lunas" : "Belum Lunas",
        metode: "Belum Ditentukan",
        tanggal: new Date().toISOString().split("T")[0],
        catatan: `Disalin dari Wishlist Produk (Brand: ${wish.brand || "-"}). ${wish.catatan || ""}`
      };
      const cleanId = "item_" + Math.random().toString(36).substring(2, 11);
      await api.addBudget({ ...budgetPayload, id: cleanId });
      await api.updateWishlist(wish.id, { status: "Sudah Dibeli", hargaAktual: wish.estimasi });
      await loadAllData();
    } catch (e) {
      console.error("Gagal melakukan konversi wishlist ke budget:", e);
    }
  };

  // D. Checklist CRUD
  const handleToggleChecklist = async (
    id: string, 
    currentStatus: "Belum Selesai" | "Selesai", 
    statusChecklist?: "Belum Dimulai" | "Dipersiapkan" | "Selesai"
  ) => {
    if (isDemo || !user) return;
    const nextStatus = currentStatus === "Selesai" ? "Belum Selesai" : "Selesai";
    try {
      const updateData: any = {
        status: nextStatus === "Selesai" ? "Selesai" : "Belum"
      };
      if (statusChecklist) {
        updateData.statusChecklist = statusChecklist;
      } else {
        updateData.statusChecklist = nextStatus === "Selesai" ? "Selesai" : "Belum Dimulai";
      }
      await api.updateChecklist(id, updateData);
      await loadAllData();
    } catch (e) {
      console.error("Gagal toggle checklist:", e);
    }
  };

  const handleUpdateChecklistStatusOnly = async (
    id: string,
    statusChecklist: "Belum Dimulai" | "Dipersiapkan" | "Selesai"
  ) => {
    if (isDemo || !user) return;
    const nextStatus = statusChecklist === "Selesai" ? "Selesai" : "Belum";
    try {
      await api.updateChecklist(id, {
        status: nextStatus,
        statusChecklist: statusChecklist
      });
      await loadAllData();
    } catch (e) {
      console.error("Gagal update checklist status:", e);
    }
  };

  const handleAddChecklist = async (item: Omit<ChecklistItem, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (isDemo || !user) return;
    const cleanId = "chk_" + Math.random().toString(36).substring(2, 11);
    const monthNum = parseInt(item.bulan.replace("Bulan ", "")) || 5;

    try {
      await api.addChecklist({
        id: cleanId,
        nama: item.judul,
        trimester: Number(item.trimester),
        bulan: monthNum,
        prioritas: "Sedang",
        status: item.status === "Selesai" ? "Selesai" : "Belum",
        minggu: item.minggu || null,
        statusChecklist: item.statusChecklist || (item.status === "Selesai" ? "Selesai" : "Belum Dimulai")
      } as any);
      await loadAllData();
    } catch (e) {
      console.error("Gagal tambah checklist:", e);
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    if (isDemo || !user) return;
    try {
      await api.deleteChecklist(id);
      await loadAllData();
    } catch (e) {
      console.error("Gagal hapus checklist:", e);
    }
  };

  const handleEditChecklist = async (
    id: string,
    item: Partial<Omit<ChecklistItem, "id" | "userId" | "createdAt" | "updatedAt">>
  ) => {
    if (isDemo || !user) return;
    try {
      const updateData: any = {};
      if (item.judul !== undefined) {
        updateData.nama = item.judul;
      }
      if (item.trimester !== undefined) {
        updateData.trimester = Number(item.trimester);
      }
      if (item.bulan !== undefined) {
        updateData.bulan = parseInt(item.bulan.replace("Bulan ", "")) || 5;
      }
      if (item.minggu !== undefined) {
        updateData.minggu = item.minggu || null;
      }
      if (item.statusChecklist !== undefined) {
        updateData.statusChecklist = item.statusChecklist;
        updateData.status = item.statusChecklist === "Selesai" ? "Selesai" : "Belum";
      }
      await api.updateChecklist(id, updateData);
      await loadAllData();
    } catch (e) {
      console.error("Gagal edit checklist:", e);
    }
  };

  // E. Medical Visit CRUD
  const handleAddMedicalVisit = async (item: Omit<MedicalVisit, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (isDemo || !user) return;
    const cleanId = "med_" + Math.random().toString(36).substring(2, 11);
    try {
      await api.addMedicalVisit({
        id: cleanId,
        tanggal: item.tanggalKunjungan,
        usiaKehamilan: item.usiaKehamilan,
        dokterBidan: item.dokterBidan,
        tempat: item.tempat,
        jenisPemeriksaan: item.hasilCatatan || "Pemeriksaan Rutin",
        hasilCatatan: item.hasilCatatan || "Pemeriksaan Rutin",
        tensi: item.tensi || "",
        beratBadan: item.beratBadan || "",
        biaya: item.biaya !== undefined && item.biaya !== null ? Number(item.biaya) : 0,
        resepVitamin: item.resepVitamin || "",
        jadwalBerikutnya: item.jadwalBerikutnya || ""
      } as any);
      await loadAllData();
    } catch (e) {
      console.error("Gagal tambah medical visit:", e);
    }
  };

  const handleDeleteMedicalVisit = async (id: string) => {
    if (isDemo || !user) return;
    try {
      await api.deleteMedicalVisit(id);
      await loadAllData();
    } catch (e) {
      console.error("Gagal hapus medical visit:", e);
    }
  };

  const handleEditMedicalVisit = async (id: string, visit: Partial<MedicalVisit>) => {
    if (isDemo || !user) return;
    try {
      const updatePayload: any = {};
      if (visit.tanggalKunjungan !== undefined) updatePayload.tanggal = visit.tanggalKunjungan;
      if (visit.usiaKehamilan !== undefined) updatePayload.usiaKehamilan = visit.usiaKehamilan;
      if (visit.dokterBidan !== undefined) updatePayload.dokterBidan = visit.dokterBidan;
      if (visit.tempat !== undefined) updatePayload.tempat = visit.tempat;
      if (visit.hasilCatatan !== undefined) {
        updatePayload.jenisPemeriksaan = visit.hasilCatatan;
        updatePayload.hasilCatatan = visit.hasilCatatan;
      }
      if (visit.tensi !== undefined) updatePayload.tensi = visit.tensi;
      if (visit.beratBadan !== undefined) updatePayload.beratBadan = visit.beratBadan;
      if (visit.biaya !== undefined) updatePayload.biaya = visit.biaya !== null ? Number(visit.biaya) : 0;
      if (visit.resepVitamin !== undefined) updatePayload.resepVitamin = visit.resepVitamin;
      if (visit.jadwalBerikutnya !== undefined) updatePayload.jadwalBerikutnya = visit.jadwalBerikutnya;

      await api.updateMedicalVisit(id, updatePayload);
      await loadAllData();
    } catch (e) {
      console.error("Gagal edit medical visit:", e);
    }
  };

  // F. Baby name CRUD
  const handleAddName = async (nameObj: Omit<BabyName, "id" | "createdAt" | "updatedAt">) => {
    if (isDemo || !user) return;
    const cleanId = "name_" + Math.random().toString(36).substring(2, 11);
    try {
      await api.addBabyName({
        id: cleanId,
        nama: nameObj.nama,
        gender: nameObj.gender,
        asal: nameObj.asal || "Lokal",
        arti: nameObj.arti || "Punya doa mulia",
        panggilan: nameObj.panggilan || "",
        catatan: nameObj.catatan || "",
        statusPilihan: nameObj.statusPilihan || "Favorit",
        isFavorite: nameObj.isFavorite !== undefined ? nameObj.isFavorite : false,
        votes: nameObj.votes || 0
      } as any);
      await loadAllData();
    } catch (e) {
      console.error("Gagal tambah nama bayi:", e);
    }
  };

  const handleEditName = async (id: string, fields: Partial<BabyName>) => {
    if (isDemo || !user) return;
    try {
      await api.updateBabyName(id, fields);
      await loadAllData();
    } catch (e) {
      console.error("Gagal edit nama bayi:", e);
    }
  };

  const handleVoteName = async (id: string, votesCount: number) => {
    if (isDemo || !user) return;
    try {
      await api.updateBabyName(id, { votes: votesCount });
      await loadAllData();
    } catch (e) {
      console.error("Gagal vote nama bayi:", e);
    }
  };

  const handleDeleteName = async (id: string) => {
    if (isDemo || !user) return;
    try {
      await api.deleteBabyName(id);
      await loadAllData();
    } catch (e) {
      console.error("Gagal hapus nama bayi:", e);
    }
  };

  // G. Hospital Bag CRUD
  const handleToggleBagStatus = async (id: string) => {
    if (isDemo || !user) {
      setHospitalBagItems(prev => prev.map(i => i.id === id ? { ...i, status: i.status === "Siap" ? "Belum Siap" : "Siap" } : i));
      return;
    }
    const item = hospitalBagItems.find(i => i.id === id);
    if (!item) return;
    const targetStatus = item.status === "Siap" ? "Belum Siap" : "Siap";
    try {
      await api.updateBagItem(id, { status: targetStatus });
      await loadAllData();
    } catch (e) {
      console.error("Gagal toggle bag status:", e);
    }
  };

  const handleAddBagItem = async (bag: Omit<HospitalBagItem, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const cleanId = "bag_" + Math.random().toString(36).substring(2, 11);
    if (isDemo || !user) {
       const newItem: HospitalBagItem = {
         id: cleanId,
         userId: "demo",
         barang: bag.barang,
         kategori: bag.kategori,
         jumlah: bag.jumlah !== undefined && bag.jumlah !== null ? Number(bag.jumlah) : 1,
         satuan: bag.satuan || "pcs",
         catatan: bag.catatan || "",
         status: bag.status,
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
       };
       setHospitalBagItems(prev => [...prev, newItem]);
       return;
    }
    try {
      await api.addBagItem({
        id: cleanId,
        barang: bag.barang,
        kategori: bag.kategori,
        jumlah: bag.jumlah !== undefined && bag.jumlah !== null ? Number(bag.jumlah) : 1,
        satuan: bag.satuan || "pcs",
        catatan: bag.catatan || "",
        prioritas: "Tinggi",
        status: bag.status,
        tasMana: "Koper Utama"
      } as any);
      await loadAllData();
    } catch (e) {
      console.error("Gagal tambah bag item:", e);
    }
  };

  const handleEditBagItem = async (id: string, fields: Partial<HospitalBagItem>) => {
    if (isDemo || !user) {
      setHospitalBagItems(prev => prev.map(i => i.id === id ? { ...i, ...fields } : i));
      return;
    }
    try {
      const updateData: any = {};
      if (fields.barang !== undefined) updateData.barang = fields.barang;
      if (fields.kategori !== undefined) updateData.kategori = fields.kategori;
      if (fields.jumlah !== undefined) updateData.jumlah = fields.jumlah !== undefined && fields.jumlah !== null ? Number(fields.jumlah) : 1;
      if (fields.satuan !== undefined) updateData.satuan = fields.satuan;
      if (fields.catatan !== undefined) updateData.catatan = fields.catatan;
      if (fields.status !== undefined) updateData.status = fields.status;
      
      await api.updateBagItem(id, updateData);
      await loadAllData();
    } catch (e) {
      console.error("Gagal edit bag item:", e);
    }
  };

  const handleDeleteBagItem = async (id: string) => {
    if (isDemo || !user) {
      setHospitalBagItems(prev => prev.filter(i => i.id !== id));
      return;
    }
    try {
      await api.deleteBagItem(id);
      await loadAllData();
    } catch (e) {
      console.error("Gagal hapus bag item:", e);
    }
  };

  // H. Hospital comparisons CRUD
  const handleAddHospital = async (h: Omit<HospitalComparison, "id" | "userId" | "createdAt" | "updatedAt">) => {
    const cleanId = "hosp_" + Math.random().toString(36).substring(2, 11);
    if (isDemo || !user) {
      const newItem: HospitalComparison = {
        id: cleanId,
        userId: "demo",
        nama: h.nama,
        metodePersalinan: h.metodePersalinan,
        estimasiBiaya: h.estimasiBiaya,
        fasilitasLayanan: h.fasilitasLayanan,
        kelebihan: h.kelebihan || "",
        kekurangan: h.kekurangan || "",
        lokasi: h.lokasi || "",
        catatanBiaya: h.catatanBiaya || "",
        kontak: h.kontak || "",
        linkGmap: h.linkGmap || "",
        rating: h.rating,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setHospitalComparisons(prev => [newItem, ...prev]);
      return;
    }
    try {
      await api.addHospital({
        id: cleanId,
        nama: h.nama,
        jenis: h.metodePersalinan,
        lokasi: h.lokasi || "Alamat",
        jarak: 1.0,
        biayaNormal: h.estimasiBiaya,
        biayaCaesar: h.estimasiBiaya,
        fasilitas: h.fasilitasLayanan.join(", "),
        kelebihan: h.kelebihan || "",
        kekurangan: h.kekurangan || "",
        catatanBiaya: h.catatanBiaya || "",
        kontak: h.kontak || "",
        linkGmap: h.linkGmap || "",
        statusKunjungan: h.rating >= 4 ? "Pilihan Utama" : "Belum Disurvei",
        rating: h.rating
      } as any);
      await loadAllData();
    } catch (e) {
      console.error("Gagal tambah RS:", e);
    }
  };

  const handleEditHospital = async (id: string, h: Partial<HospitalComparison>) => {
    if (isDemo || !user) {
      setHospitalComparisons(prev => prev.map(item => {
        if (item.id === id) {
          return {
            ...item,
            ...h,
            updatedAt: new Date().toISOString()
          };
        }
        return item;
      }));
      return;
    }
    try {
      const updatePayload: any = {
        nama: h.nama,
        jenis: h.metodePersalinan,
        lokasi: h.lokasi,
        biayaNormal: h.estimasiBiaya,
        biayaCaesar: h.estimasiBiaya,
        nicu: h.fasilitasLayanan?.includes("Kamar NICU / PICU Lengkap"),
        statusKunjungan: h.rating && h.rating >= 4 ? "Pilihan Utama" : "Belum Disurvei",
        kelebihan: h.kelebihan || "",
        kekurangan: h.kekurangan || "",
        catatanBiaya: h.catatanBiaya,
        kontak: h.kontak,
        linkGmap: h.linkGmap,
        rating: h.rating
      };
      if (h.fasilitasLayanan) {
        updatePayload.fasilitas = h.fasilitasLayanan.join(", ");
      }
      await api.updateHospital(id, updatePayload);
      await loadAllData();
    } catch (e) {
      console.error("Gagal edit RS:", e);
    }
  };

  const handleDeleteHospital = async (id: string) => {
    if (isDemo || !user) {
      setHospitalComparisons(prev => prev.filter(h => h.id !== id));
      return;
    }
    try {
      await api.deleteHospital(id);
      await loadAllData();
    } catch (e) {
      console.error("Gagal hapus RS:", e);
    }
  };

  // I. Pure reset all collections
  const handleResetAllData = async () => {
    if (isDemo || !user) return;
    try {
      await api.saveProfile({
        namaMoms: "",
        namaDads: "",
        namaBayi: "",
        hpht: "",
        hpl: "",
        pilihanPerhitungan: "HPHT",
        targetBudget: 0,
        mataUang: "IDR"
      });
      await loadAllData();
    } catch (e) {
      console.error("Gagal mereset data:", e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsDemo(true);
      setUser(null);
    } catch (err) {
      console.error(err);
    }
  };

  // 4. PREVIEW LOGIN MODIFIER INTERCEPT
  const handleTriggerLogin = () => {
    setShowLoginModal(true);
  };

  // RENDERING ENGINE
  // Loading splash spinner
  if (loading && !isDemo) {
    return (
      <div className="min-h-screen bg-[#FAF9F5] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-10 h-10 border-4 border-[#14B8B8] border-t-transparent rounded-full animate-spin"></div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-[#2F3A3A] tracking-wider font-mono">TEMAN PARENTING</h4>
          <p className="text-xs text-gray-400">Menghubungkan ke amanah cloud database Anda, mohon tunggu...</p>
        </div>
      </div>
    );
  }

  // Signed in but has no setup profile yet -> Trigger modal onboarding!
  const showOnboarding = !isDemo && user && !profile;

  return (
    <div className="min-h-screen bg-[#FAF9F5] flex flex-col md:flex-row relative font-sans text-[#2F3A3A]">
      
      {/* PERSISTENT BRAND TOP BANNER FOR GUEST ONLY */}
      {isDemo && (
        <div className="bg-[#14B8B8] text-white py-2.5 px-4 text-xs font-semibold text-center flex flex-col sm:flex-row items-center justify-center gap-2 md:fixed md:top-0 md:left-64 md:right-0 md:z-40">
          <span>👋 Moms & Dads, Anda sedang dalam <strong>Mode Demo (Pratinjau)</strong> dengan data sampel.</span>
          <button
            onClick={handleTriggerLogin}
            className="underline decoration-current font-extrabold hover:text-[#FFF1D6] transition-colors cursor-pointer bg-transparent border-none text-xs"
          >
            Masuk Akun Sekarang untuk Menyimpan Rencana Anda →
          </button>
        </div>
      )}

      {/* RENDER RESPONSIVE SIDEBAR NAVIGATION */}
      <Navigation 
        currentTab={activeTab} 
        onTabChange={setActiveTab} 
        user={user}
        onLoginClick={handleTriggerLogin}
        onLogout={handleLogout}
        isDemo={isDemo}
      />

      {/* PRIMARY VIEWS SWITCHER CONTENT AREA */}
      <main className={`flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full ${isDemo ? "md:pt-16" : ""}`}>
        {activeTab === "Dashboard" && (
          <PregnancyDashboard
            profile={profile || mockProfile}
            budgetItems={budgetItems}
            wishlistItems={wishlistItems}
            checklistItems={checklistItems}
            medicalVisits={medicalVisits}
            hospitalBagItems={hospitalBagItems}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === "Master Budget" && (
          <MasterBudgetManager
            budgetItems={budgetItems}
            onAddItem={handleAddBudget}
            onEditItem={handleEditBudget}
            onDeleteItem={handleDeleteBudget}
            isDemo={isDemo}
            onTriggerLogin={handleTriggerLogin}
          />
        )}

        {activeTab === "Wishlist Produk" && (
          <WishlistManager
            wishlistItems={wishlistItems}
            onAddWish={handleAddWishlist}
            onEditWish={handleEditWishlist}
            onDeleteWish={handleDeleteWishlist}
            onConvertToBudget={handleConvertToBudget}
            isDemo={isDemo}
            onTriggerLogin={handleTriggerLogin}
          />
        )}

        {activeTab === "Trimester Checklist" && (
          <ChecklistManager
            checklistItems={checklistItems}
            onToggleStatus={(id, statusChecklist) => {
              const current = checklistItems.find(i => i.id === id);
              if (current) {
                handleToggleChecklist(id, current.status, statusChecklist);
              }
            }}
            onUpdateStatusOnly={handleUpdateChecklistStatusOnly}
            onAddItem={handleAddChecklist}
            onEditItem={handleEditChecklist}
            onDeleteItem={handleDeleteChecklist}
            isDemo={isDemo}
            onTriggerLogin={handleTriggerLogin}
          />
        )}

        {activeTab === "Kunjungan Medis" && (
          <MedicalVisitTracker
            medicalVisits={medicalVisits}
            onAddVisit={handleAddMedicalVisit}
            onEditVisit={handleEditMedicalVisit}
            onDeleteVisit={handleDeleteMedicalVisit}
            isDemo={isDemo}
            onTriggerLogin={handleTriggerLogin}
          />
        )}

        {activeTab === "Nama Bayi" && (
          <BabyNameInspirations
            babyNames={babyNames}
            onAddName={handleAddName}
            onEditName={handleEditName}
            onVoteName={handleVoteName}
            onDeleteName={handleDeleteName}
            isDemo={isDemo}
            onTriggerLogin={handleTriggerLogin}
            user={user}
          />
        )}

        {activeTab === "Hospital Bag" && (
          <HospitalBagManager
            hospitalBagItems={hospitalBagItems}
            onToggleBagStatus={handleToggleBagStatus}
            onAddBagItem={handleAddBagItem}
            onEditBagItem={handleEditBagItem}
            onDeleteBagItem={handleDeleteBagItem}
            isDemo={isDemo}
            onTriggerLogin={handleTriggerLogin}
          />
        )}

        {activeTab === "Rumah Sakit" && (
          <HospitalSelector
            hospitalComparisons={hospitalComparisons}
            onAddHospital={handleAddHospital}
            onEditHospital={handleEditHospital}
            onDeleteHospital={handleDeleteHospital}
            isDemo={isDemo}
            onTriggerLogin={handleTriggerLogin}
          />
        )}

        {activeTab === "Pengaturan" && (
          <SettingsManager
            profile={profile || mockProfile}
            onUpdateProfile={handleUpdateProfile}
            onResetAllData={handleResetAllData}
            onLogout={handleLogout}
            isDemo={isDemo}
            onTriggerLogin={handleTriggerLogin}
          />
        )}

        {activeTab === "Akses Pengguna" && (
          <UserAccessManager
            isDemo={isDemo}
            onTriggerLogin={handleTriggerLogin}
          />
        )}
      </main>

      {/* ONBOARDING FLOW MODAL IF REGISTERED NEW PROFILE */}
      {showOnboarding && (
        <OnboardingModal
          userId={user?.uid || "preview"}
          onSave={handleOnboardingComplete}
        />
      )}

      {/* PASSWORDLESS EMAIL LINK SIGN-IN MODAL PORTAL */}
      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onSuccess={(email) => {
            console.log("Logged in with: ", email);
          }}
        />
      )}

    </div>
  );
}
