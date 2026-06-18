import { auth } from "./firebase";
import { 
  PregnancyProfile, 
  BudgetItem, 
  WishlistItem, 
  ChecklistItem, 
  MedicalVisit, 
  BabyName, 
  HospitalBagItem, 
  HospitalComparison,
  AllowedEmail
} from "./types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787";

async function getAuthHeaders() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated");
  }
  const token = await user.getIdToken();
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };
}

export const api = {
  // Public Endpoint: check email whitelist
  checkEmailWhitelisted: async (email: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/api/auth/check-whitelist?email=${encodeURIComponent(email)}`);
      if (!res.ok) return false;
      const data = (await res.json()) as { whitelisted: boolean };
      return !!data.whitelisted;
    } catch (err) {
      console.error("Error checking whitelist:", err);
      return false;
    }
  },

  // Profile
  getProfile: async (): Promise<PregnancyProfile | null> => {
    const res = await fetch(`${API_URL}/api/profile`, { headers: await getAuthHeaders() });
    if (!res.ok) return null;
    return res.json();
  },
  saveProfile: async (profile: Omit<PregnancyProfile, "userId" | "createdAt" | "updatedAt">): Promise<void> => {
    const res = await fetch(`${API_URL}/api/profile`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(profile)
    });
    if (!res.ok) {
      const err = (await res.json()) as { error?: string };
      throw new Error(err.error || "Failed to save profile");
    }
  },

  // Budget Items
  getBudgets: async (): Promise<BudgetItem[]> => {
    const res = await fetch(`${API_URL}/api/budget`, { headers: await getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  addBudget: async (item: Omit<BudgetItem, "id" | "userId" | "createdAt" | "updatedAt"> & { id: string }): Promise<void> => {
    const res = await fetch(`${API_URL}/api/budget`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error("Failed to add budget item");
  },
  updateBudget: async (id: string, fields: Partial<BudgetItem>): Promise<void> => {
    const res = await fetch(`${API_URL}/api/budget/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error("Failed to update budget item");
  },
  deleteBudget: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/budget/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete budget item");
  },

  // Wishlist Items
  getWishlist: async (): Promise<WishlistItem[]> => {
    const res = await fetch(`${API_URL}/api/wishlist`, { headers: await getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  addWishlist: async (item: Omit<WishlistItem, "id" | "userId" | "createdAt" | "updatedAt"> & { id: string }): Promise<void> => {
    const res = await fetch(`${API_URL}/api/wishlist`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error("Failed to add wishlist item");
  },
  updateWishlist: async (id: string, fields: Partial<WishlistItem>): Promise<void> => {
    const res = await fetch(`${API_URL}/api/wishlist/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error("Failed to update wishlist item");
  },
  deleteWishlist: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/wishlist/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete wishlist item");
  },

  // Checklist Items
  getChecklist: async (): Promise<ChecklistItem[]> => {
    const res = await fetch(`${API_URL}/api/checklist`, { headers: await getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  addChecklist: async (item: Omit<ChecklistItem, "id" | "userId" | "createdAt" | "updatedAt"> & { id: string }): Promise<void> => {
    const res = await fetch(`${API_URL}/api/checklist`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error("Failed to add checklist item");
  },
  updateChecklist: async (id: string, fields: Partial<ChecklistItem>): Promise<void> => {
    const res = await fetch(`${API_URL}/api/checklist/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error("Failed to update checklist item");
  },
  deleteChecklist: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/checklist/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete checklist item");
  },

  // Medical Visits
  getMedicalVisits: async (): Promise<MedicalVisit[]> => {
    const res = await fetch(`${API_URL}/api/medical`, { headers: await getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  addMedicalVisit: async (item: Omit<MedicalVisit, "id" | "userId" | "createdAt" | "updatedAt"> & { id: string }): Promise<void> => {
    const res = await fetch(`${API_URL}/api/medical`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error("Failed to add medical visit");
  },
  updateMedicalVisit: async (id: string, fields: Partial<MedicalVisit>): Promise<void> => {
    const res = await fetch(`${API_URL}/api/medical/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error("Failed to update medical visit");
  },
  deleteMedicalVisit: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/medical/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete medical visit");
  },

  // Baby Names
  getBabyNames: async (): Promise<BabyName[]> => {
    const res = await fetch(`${API_URL}/api/names`, { headers: await getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  addBabyName: async (item: Omit<BabyName, "id" | "createdAt" | "updatedAt"> & { id: string }): Promise<void> => {
    const res = await fetch(`${API_URL}/api/names`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error("Failed to add baby name");
  },
  updateBabyName: async (id: string, fields: Partial<BabyName>): Promise<void> => {
    const res = await fetch(`${API_URL}/api/names/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error("Failed to update baby name");
  },
  deleteBabyName: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/names/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete baby name");
  },

  // Hospital Bag Items
  getBagItems: async (): Promise<HospitalBagItem[]> => {
    const res = await fetch(`${API_URL}/api/bag`, { headers: await getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  addBagItem: async (item: Omit<HospitalBagItem, "id" | "userId" | "createdAt" | "updatedAt"> & { id: string }): Promise<void> => {
    const res = await fetch(`${API_URL}/api/bag`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error("Failed to add hospital bag item");
  },
  updateBagItem: async (id: string, fields: Partial<HospitalBagItem>): Promise<void> => {
    const res = await fetch(`${API_URL}/api/bag/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error("Failed to update hospital bag item");
  },
  deleteBagItem: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/bag/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete hospital bag item");
  },

  // Hospital Comparisons
  getHospitals: async (): Promise<HospitalComparison[]> => {
    const res = await fetch(`${API_URL}/api/hospital`, { headers: await getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  addHospital: async (item: Omit<HospitalComparison, "id" | "userId" | "createdAt" | "updatedAt"> & { id: string }): Promise<void> => {
    const res = await fetch(`${API_URL}/api/hospital`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify(item)
    });
    if (!res.ok) throw new Error("Failed to add hospital comparison");
  },
  updateHospital: async (id: string, fields: Partial<HospitalComparison>): Promise<void> => {
    const res = await fetch(`${API_URL}/api/hospital/${id}`, {
      method: "PUT",
      headers: await getAuthHeaders(),
      body: JSON.stringify(fields)
    });
    if (!res.ok) throw new Error("Failed to update hospital comparison");
  },
  deleteHospital: async (id: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/hospital/${id}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to delete hospital comparison");
  },

  // Admin: Whitelist management
  getWhitelist: async (): Promise<AllowedEmail[]> => {
    const res = await fetch(`${API_URL}/api/admin/whitelist`, { headers: await getAuthHeaders() });
    if (!res.ok) return [];
    return res.json();
  },
  addWhitelistEmail: async (email: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/admin/whitelist`, {
      method: "POST",
      headers: await getAuthHeaders(),
      body: JSON.stringify({ email })
    });
    if (!res.ok) throw new Error("Failed to whitelist email");
  },
  deleteWhitelistEmail: async (email: string): Promise<void> => {
    const res = await fetch(`${API_URL}/api/admin/whitelist/${encodeURIComponent(email)}`, {
      method: "DELETE",
      headers: await getAuthHeaders()
    });
    if (!res.ok) throw new Error("Failed to remove email from whitelist");
  }
};
