import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import { isSignInWithEmailLink, signInWithEmailLink, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { Sparkles, AlertTriangle, Loader2, X, ArrowRight, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "../api";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (email: string) => void;
}

const ADMIN_EMAIL = "temanparenting.id@gmail.com";

export async function checkEmailWhitelisted(emailAddress: string): Promise<boolean> {
  const cleanEmail = emailAddress.trim().toLowerCase();
  
  // The owner/developer is always allowed
  if (cleanEmail === ADMIN_EMAIL) {
    return true;
  }
  
  return api.checkEmailWhitelisted(cleanEmail);
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Check if page opened via a magic link callback (kept for backward compatibility with existing links)
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let storedEmail = window.localStorage.getItem("emailForSignIn");
      if (!storedEmail) {
        storedEmail = window.prompt("Harap masukkan kembali email Anda untuk verifikasi:");
      }

      if (storedEmail) {
        setIsSending(true);
        const targetEmail = storedEmail.trim().toLowerCase();
        
        checkEmailWhitelisted(targetEmail).then((isWhitelisted) => {
          if (!isWhitelisted) {
            setErrorMsg("Email belum terdaftar, silahkan daftarkan email anda untuk mendapatkan akses");
            setIsSending(false);
            return;
          }

          signInWithEmailLink(auth, targetEmail, window.location.href)
            .then(() => {
              window.localStorage.removeItem("emailForSignIn");
              onSuccess(targetEmail);
              onClose();
            })
            .catch((err) => {
              console.error("Gagal verifikasi Magic Link:", err);
              setErrorMsg("Link verifikasi sudah kedaluwarsa atau tidak valid. Silakan coba masuk kembali.");
            })
            .finally(() => {
              setIsSending(false);
            });
        }).catch((err) => {
          console.error("Error check whitelist:", err);
          setErrorMsg("Gagal melakukan otorisasi login. Hubungi admin.");
          setIsSending(false);
        });
      }
    }
  }, [onSuccess, onClose]);

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsSending(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email?.toLowerCase();
      
      if (userEmail) {
        const isWhitelisted = await checkEmailWhitelisted(userEmail);
        if (isWhitelisted) {
          onSuccess(userEmail);
          onClose();
        } else {
          await signOut(auth);
          setErrorMsg(
            "Email belum terdaftar, silahkan daftarkan email anda untuk mendapatkan akses"
          );
        }
      } else {
        await signOut(auth);
        setErrorMsg("⚠️ Gagal mendapatkan informasi email yang valid dari akun Google Anda.");
      }
    } catch (err: any) {
      console.error("Detail Error Google Sign In:", err);
      if (err.code === "auth/popup-blocked") {
        setErrorMsg("⚠️ POPUP TERBLOKIR\n\nJendela masuk Google diblokir oleh browser Moms & Dads. Silakan aktifkan popup di browser Anda, lalu coba lagi.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setErrorMsg("⚠️ PROSES DIBATALKAN\n\nMoms & Dads menutup jendela pilihan akun Google sebelum sempat memilih email.");
      } else if (err.code === "auth/network-request-failed") {
        setErrorMsg("⚠️ KONEKSI BERMASALAH\n\nSilakan periksa kembali jaringan internet Moms & Dads.");
      } else {
        setErrorMsg("❌ GAGAL MASUK\n\nTerjadi kendala teknis: " + (err.message || err));
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop with custom theme blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2F3A3A]/60 backdrop-blur-md"
          />

          {/* Modal Card content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            id="login-modal-card"
            className="w-full max-w-md bg-[#FAF9F5] border border-[#E8E4FF] rounded-3xl p-4 sm:p-6 shadow-2xl relative overflow-hidden my-auto z-10 max-h-[92vh] sm:max-h-[95vh] flex flex-col"
          >
            {/* Decorative layout elements */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#DDF7EF] rounded-full filter blur-2xl opacity-75 -mr-6 -mt-6 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-[#FFF1D6] rounded-full filter blur-3xl opacity-70 -ml-10 -mb-10 pointer-events-none"></div>

            <div className="relative overflow-y-auto pr-1 flex-1 scrollbar-none sm:scrollbar-thin">
              {/* Header */}
              <div className="flex justify-between items-center mb-4 pb-2.5 border-b border-[#E8E4FF]/40">
                <div className="flex items-center space-x-2 text-[#14B8B8]">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                  <span className="font-semibold text-xs sm:text-sm uppercase tracking-wider font-mono">Teman Parenting</span>
                </div>
                <button 
                  id="close-login-btn"
                  onClick={onClose}
                  className="text-[#2F3A3A]/40 hover:text-[#2F3A3A] hover:bg-gray-100 p-1.5 rounded-full border border-gray-100 transition-colors cursor-pointer bg-white"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Title & Descr */}
              <div className="mb-4 sm:mb-5">
                <h3 className="text-lg sm:text-xl font-bold text-[#2F3A3A] tracking-tight mb-1.5">
                  Masuk ke Baby Budget Plan
                </h3>
                <p className="text-xs sm:text-sm text-[#2F3A3A]/70 leading-relaxed">
                  Moms & Dads, silakan masuk menggunakan akun <strong className="text-[#14B8B8]">Google</strong> Anda yang sudah terdaftar. Jika akun belum terdaftar di database kami, silakan melakukan pendaftaran terlebih dahulu untuk mendapatkan akses penuh.
                </p>
              </div>

              {/* Google Sign In Container */}
              <div className="space-y-3">
                <button
                  id="google-login-btn"
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isSending}
                  className="w-full bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl py-2.5 sm:py-3.5 px-4 text-xs sm:text-sm border border-gray-200 shadow-sm transition-all flex items-center justify-center space-x-3 cursor-pointer disabled:opacity-50"
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#14B8B8]" />
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                  )}
                  <span>Masuk dengan Google Terdaftar</span>
                </button>

                {errorMsg && (
                  <div 
                    id="login-error-box" 
                    className="bg-[#FFEFEF] border border-red-100 rounded-2xl p-3 sm:p-4 text-[#C53030] flex items-start space-x-2 animate-fade-in text-xs leading-relaxed animate-bounce-subtle"
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <span className="font-medium whitespace-pre-line">{errorMsg}</span>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center my-4 sm:my-5">
                <div className="flex-grow border-t border-[#2F3A3A]/15"></div>
                <span className="mx-3 text-[10px] sm:text-xs text-[#2F3A3A]/40 font-mono tracking-wider">Akses & Pendaftaran</span>
                <div className="flex-grow border-t border-[#2F3A3A]/15"></div>
              </div>

              {/* Promo Call To Action Card / Section */}
              <div 
                id="promo-activation-box" 
                className="bg-white border border-[#FFF1D6] rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden group transition-all duration-300 hover:border-[#14B8B8]/30"
              >
                {/* Background glow styling */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-[#FFF1D6]/40 rounded-full filter blur-xl -mr-6 -mt-6 pointer-events-none"></div>

                <div className="relative">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#E4FBF5] text-[#14B8B8] uppercase tracking-wider">
                      🔥 PROMO TERBATAS
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#FFF1D6] text-[#D97706] uppercase tracking-wider">
                      AKSES SELAMANYA
                    </span>
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-[#2F3A3A] mb-1">
                    Belum punya akses? Yuk, daftarkan email Moms & Dads!
                  </h4>
                  <p className="text-[11px] sm:text-xs text-[#2F3A3A]/70 leading-relaxed mb-3">
                    Rasakan kemudahan estimasi, visualisasi budget kehamilan, serta checklist persiapan persalinan secara eksklusif.
                  </p>

                  <div className="flex items-baseline space-x-1.5 mb-3 bg-[#FAF9F5]/80 p-2.5 rounded-xl border border-dashed border-[#2F3A3A]/5">
                    <div className="text-[10px] sm:text-xs text-red-500 font-medium line-through">
                      Rp 250.000
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-[#14B8B8]">
                      Rp 55.000
                    </div>
                    <span className="text-[9px] sm:text-[10px] text-[#2F3A3A]/60 font-mono">
                      (Sekali Bayar)
                    </span>
                  </div>

                  <a
                    id="cta-get-access-btn"
                    href="https://lynk.id/temanparenting/knq724z7657z"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#14B8B8] hover:bg-[#0E9090] text-white font-bold rounded-xl py-2.5 text-xs sm:text-sm shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer text-center group-hover:scale-[1.01]"
                  >
                    <span>Dapatkan Akses</span>
                    <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 sm:mt-5 border-t border-[#2F3A3A]/5 pt-3.5 flex justify-between items-center text-[9px] sm:text-[10px] text-[#2F3A3A]/50">
                <span className="flex items-center space-x-1">
                  <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#14B8B8]" />
                  <span>Aman, Resmi & Terenkripsi</span>
                </span>
                <span>© Teman Parenting</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
