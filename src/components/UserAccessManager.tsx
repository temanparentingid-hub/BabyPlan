import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { AllowedEmail } from "../types";
import { auth } from "../firebase";
import { 
  Shield,
  UserPlus,
  Mail,
  Check,
  AlertCircle,
  Trash2,
  Users
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import InstantTooltip from "./InstantTooltip";
import { api } from "../api";

interface UserAccessProps {
  isDemo: boolean;
  onTriggerLogin: () => void;
}

export default function UserAccessManager({ isDemo, onTriggerLogin }: UserAccessProps) {
  const [isAdmin, setIsAdmin] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState<AllowedEmail[]>([]);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailToDelete, setEmailToDelete] = useState<string | null>(null);

  const fetchAllowedEmails = async () => {
    setLoading(true);
    try {
      const list = await api.getWhitelist();
      // Sort: newly added emails first
      list.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setAllowedEmails(list);
    } catch (err) {
      console.error("Gagal memuat daftar email whitelist:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const adminCheck = auth.currentUser?.email?.toLowerCase() === "temanparenting.id@gmail.com";
    setIsAdmin(adminCheck);

    if (!adminCheck) {
      setLoading(false);
      return;
    }

    fetchAllowedEmails();
  }, [isDemo]);

  const handleAddEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);

    const emailToRegister = newEmailInput.trim().toLowerCase();
    if (!emailToRegister) return;

    // Email format checks
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailToRegister)) {
      setActionError("Format email tidak valid. Silakan cek kembali ya Admin.");
      return;
    }

    if (emailToRegister === "temanparenting.id@gmail.com") {
      setActionError("Email Anda sendiri adalah admin utama, tidak perlu didaftarkan kembali.");
      return;
    }

    try {
      await api.addWhitelistEmail(emailToRegister);
      setNewEmailInput("");
      setActionSuccess(`Email "${emailToRegister}" berhasil didaftarkan sebagai pembeli resmi! 🎉`);
      fetchAllowedEmails(); // Refresh list
      setTimeout(() => setActionSuccess(null), 5000);
    } catch (err: any) {
      console.error(err);
      setActionError("Gagal mendaftarkan email ke database: " + err.message);
    }
  };

  const handleDeleteEmail = async (targetEmail: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await api.deleteWhitelistEmail(targetEmail);
      setActionSuccess(`Akses untuk email "${targetEmail}" berhasil dihapus!`);
      fetchAllowedEmails(); // Refresh list
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      console.error(err);
      setActionError("Gagal menghapus email dari database: " + err.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-white border border-red-100 rounded-3xl p-6 text-center max-w-lg mx-auto my-12 shadow-xs space-y-4">
        <Shield className="w-12 h-12 text-rose-500 mx-auto animate-bounce" />
        <h3 className="text-lg font-black text-gray-800">Akses Terbatas (Admin Only)</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          Maaf, halaman ini khusus diperuntukkan bagi Administrator Yayasan Teman Parenting dengan koordinat masuk <strong>temanparenting.id@gmail.com</strong>.
        </p>
        {isDemo && (
          <button 
            onClick={onTriggerLogin}
            className="bg-[#14B8B8] text-white text-xs font-bold px-4 py-2 rounded-xl"
          >
            Masuk sebagai Admin
          </button>
        )}
      </div>
    );
  }

  return (
    <div id="user-access-view" className="space-y-6 pb-20 md:pb-6 text-[#2F3A3A] animate-fade-in">
      {/* SECTION BAR */}
      <div>
        <span className="text-xs font-black text-[#14B8B8] uppercase tracking-widest font-mono">
          Otorisasi & Keamanan
        </span>
        <h2 className="text-2xl font-black text-[#2F3A3A] tracking-tight text-left flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#14B8B8]" /> Akses Pengguna
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Daftarkan email pembeli/user baru di bawah ini agar mereka diberikan hak istimewa autentikasi oleh gerbang pelindung Firebase Auth.
        </p>
      </div>

      <div className="bg-white border border-[#E8E4FF] rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex items-center space-x-2 text-[#14B8B8] font-bold border-b border-gray-100 pb-3 uppercase tracking-wider font-mono text-xs">
          <Users className="w-4.5 h-4.5" />
          <span>Kontrol Akses Email Whitelist Pembeli</span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed max-w-3xl">
          Halo Admin! Sebagai pemilik tunggal aplikasi <strong>Baby Budget Plan</strong>, Anda memiliki hak istimewa untuk mendaftarkan email pembeli/user agar mereka bisa masuk ke sistem. Email yang tidak terdaftar di daftar di bawah ini <strong>tidak akan diberikan akses masuk</strong> sama sekali oleh Firebase Auth & Firestore.
        </p>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <div className="w-8 h-8 border-3 border-[#14B8B8] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-400">Sinkronisasi data whitelist...</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Form to add email */}
            <div className="space-y-4">
              <strong className="text-xs font-bold text-[#2F3A3A] block uppercase tracking-widest">
                Daftarkan Email Pembeli Baru
              </strong>

              <form onSubmit={handleAddEmail} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    required
                    placeholder="contoh: pembeliberbayar@gmail.com"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    className="w-full bg-[#FAF9F5] border border-[#2F3A3A]/10 rounded-xl py-2.5 pl-9 pr-3 text-[#2F3A3A] text-xs outline-none focus:bg-white focus:border-[#14B8B8] transition-all"
                  />
                </div>

                {actionSuccess && (
                  <div className="bg-[#DDF7EF] border border-[#14B8B8]/30 rounded-xl p-3 text-[11px] text-[#14B8B8] font-bold flex items-center space-x-1.5 animate-fade-in">
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{actionSuccess}</span>
                  </div>
                )}

                {actionError && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-[11px] text-red-600 font-bold flex items-center space-x-1.5 animate-fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{actionError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-[#14B8B8] hover:bg-[#14B8B8]/95 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-xs cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Daftarkan Akses Email</span>
                </button>
              </form>
            </div>

            {/* List of Whitelisted emails */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <strong className="text-xs font-bold text-[#2F3A3A] block uppercase tracking-widest">
                  Daftar Email Terdaftar ({allowedEmails.length})
                </strong>
                <span className="text-[10px] text-gray-400 font-mono italic">Akses Terkunci</span>
              </div>

              <div className="bg-[#FAF9F5] border border-gray-100 rounded-2xl p-4 max-h-[220px] overflow-y-auto space-y-2 text-xs">
                {allowedEmails.length === 0 ? (
                  <p className="text-gray-400 text-center italic py-6">
                    Belum ada email pembeli tambahan yang terdaftar.
                  </p>
                ) : (
                  allowedEmails.map((item) => (
                    <div 
                      key={item.email} 
                      className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-xl hover:shadow-2xs transition-shadow relative"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-gray-700 truncate text-xs">{item.email}</p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          Didaftarkan: {new Date(item.createdAt).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric"
                          })}
                        </p>
                      </div>
                      {item.email.toLowerCase() !== "temanparenting.id@gmail.com" ? (
                        <InstantTooltip content="Hapus Akses" position="left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEmailToDelete(item.email);
                            }}
                            className="text-red-400 hover:text-red-650 hover:bg-red-50 p-2 rounded-lg transition-colors cursor-pointer relative z-10 flex items-center justify-center"
                          >
                            <Trash2 className="w-4 h-4 pointer-events-none text-red-500" />
                          </button>
                        </InstantTooltip>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg select-none">
                          Admin Utama
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="bg-[#FAF9F5] border border-gray-100 rounded-3xl p-5 text-center text-xs text-gray-400 leading-normal max-w-4xl mx-auto space-y-1">
        <strong>Pemberitahuan Lisensi Medis:</strong> Konten dan fungsionalitas dalam Baby Budget Plan dirancang murni untuk asisten perencanaan keuangan mandiri dan stimulasi estimasi. Teman Parenting tidak memberikan nasihat medis klinis, instruksi bidan darurat, resep obat, konsensus gizi janin, atau bimbingan diagnosa klinis lainnya. Jika Moms mengalami pendarahan, kontraksi hebat di luar HPL, air ketuban meresembes, dsb, segera hubungi ruang darurat obgyn/bidan terdekat Anda secara langsung.
      </footer>

      {/* CUSTOM CONFIRMATION DIALOG (IFRAME SAFE PORTAL) */}
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {emailToDelete && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setEmailToDelete(null)}
                className="fixed inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative bg-white rounded-3xl p-6 max-w-sm w-full border border-red-100 shadow-2xl space-y-4 text-center z-10 pointer-events-auto"
              >
                <div className="w-12 h-12 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-500 animate-pulse">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-black text-gray-800 uppercase tracking-wider">Hapus Akses Pengguna?</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Apakah Anda yakin ingin menghapus akses untuk <strong className="text-gray-700 font-mono break-all">{emailToDelete}</strong>? Pengguna dengan email ini tidak akan bisa masuk ke aplikasi lagi.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailToDelete(null)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = emailToDelete;
                      setEmailToDelete(null);
                      handleDeleteEmail(target);
                    }}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl cursor-pointer transition-all active:scale-95 shadow-md shadow-red-200"
                  >
                    Ya, Hapus
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
