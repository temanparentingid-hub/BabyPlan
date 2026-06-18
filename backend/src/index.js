// Cloudflare Worker API for Baby Budget Plan

// Cache for Google JWK keys to avoid refetching on every request
let jwkCache = null;
let jwkCacheTimestamp = 0;
const JWK_CACHE_DURATION = 3600 * 1000; // 1 hour

async function getGooglePublicKeys() {
  const now = Date.now();
  if (jwkCache && (now - jwkCacheTimestamp < JWK_CACHE_DURATION)) {
    return jwkCache;
  }

  const res = await fetch("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com");
  if (!res.ok) {
    throw new Error("Failed to fetch Google public JWKs");
  }
  const jwks = await res.json();
  jwkCache = jwks.keys;
  jwkCacheTimestamp = now;
  return jwkCache;
}

// Helper to base64url decode
function base64UrlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  const decoded = atob(str);
  const bytes = new Uint8Array(decoded.length);
  for (let i = 0; i < decoded.length; i++) {
    bytes[i] = decoded.charCodeAt(i);
  }
  return bytes;
}

// Verify Firebase Auth JWT Token using Web Crypto
async function verifyFirebaseToken(token, projectId) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  
  // Parse header
  const headerDecoded = new TextDecoder().decode(base64UrlDecode(headerB64));
  const header = JSON.parse(headerDecoded);
  if (header.alg !== "RS256") {
    throw new Error("Unsupported algorithm");
  }

  // Parse payload
  const payloadDecoded = new TextDecoder().decode(base64UrlDecode(payloadB64));
  const payload = JSON.parse(payloadDecoded);

  // Verify claims
  const nowSecs = Math.floor(Date.now() / 1000);
  if (payload.exp < nowSecs) {
    throw new Error("Token expired");
  }
  if (payload.aud !== projectId) {
    throw new Error("Invalid audience");
  }
  if (payload.iss !== `https://securetoken.google.com/${projectId}`) {
    throw new Error("Invalid issuer");
  }

  // Get matching public key
  const keys = await getGooglePublicKeys();
  const jwk = keys.find(k => k.kid === header.kid);
  if (!jwk) {
    throw new Error("Matching public key not found");
  }

  // Import key
  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256"
    },
    false,
    ["verify"]
  );

  // Verify signature
  const enc = new TextEncoder();
  const data = enc.encode(`${headerB64}.${payloadB64}`);
  const sig = base64UrlDecode(signatureB64);

  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    sig,
    data
  );

  if (!isValid) {
    throw new Error("Invalid signature");
  }

  return payload; // Returns decoded user info, including user_id (uid) and email
}

// Handle CORS
function handleOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400"
    }
  });
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    }
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    if (method === "OPTIONS") {
      return handleOptions();
    }

    // Public Route: Check email whitelist (without requiring JWT token)
    if (path === "/api/auth/check-whitelist" && method === "GET") {
      const email = url.searchParams.get("email")?.toLowerCase().trim();
      if (!email) {
        return jsonResponse({ error: "Missing email parameter" }, 400);
      }
      
      // Admin bypass
      if (email === "temanparenting.id@gmail.com") {
        return jsonResponse({ whitelisted: true });
      }

      try {
        const value = await env.BABYPLAN_KV.get(`allowedEmail:${email}`);
        return jsonResponse({ whitelisted: value !== null });
      } catch (err) {
        return jsonResponse({ error: "Database error", details: err.message }, 500);
      }
    }

    // Authenticate all other endpoints
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Missing authorization token" }, 401);
    }
    const token = authHeader.split("Bearer ")[1];
    
    let user;
    try {
      user = await verifyFirebaseToken(token, env.FIREBASE_PROJECT_ID);
    } catch (err) {
      return jsonResponse({ error: "Unauthorized: " + err.message }, 401);
    }

    const uid = user.user_id;
    const userEmail = user.email?.toLowerCase();

    // Secondary security: verify if the authenticated email is whitelisted
    if (userEmail !== "temanparenting.id@gmail.com") {
      const isWhitelisted = await env.BABYPLAN_KV.get(`allowedEmail:${userEmail}`);
      if (isWhitelisted === null) {
        return jsonResponse({ error: "Email not whitelisted" }, 403);
      }
    }

    // ROUTING HANDLERS
    try {
      
      // 1. PROFILES ENDPOINTS
      if (path === "/api/profile") {
        if (method === "GET") {
          const profile = await env.DB.prepare(
            "SELECT * FROM pregnancy_profiles WHERE userId = ?"
          ).bind(uid).first();
          return jsonResponse(profile || null);
        }
        
        if (method === "POST") {
          const body = await request.json();
          const { namaMoms, namaDads, namaBayi, hpht, hpl, pilihanPerhitungan, targetBudget, mataUang } = body;
          const now = new Date().toISOString();
          
          await env.DB.prepare(`
            INSERT INTO pregnancy_profiles (userId, namaMoms, namaDads, namaBayi, hpht, hpl, pilihanPerhitungan, targetBudget, mataUang, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(userId) DO UPDATE SET
              namaMoms = excluded.namaMoms,
              namaDads = excluded.namaDads,
              namaBayi = excluded.namaBayi,
              hpht = excluded.hpht,
              hpl = excluded.hpl,
              pilihanPerhitungan = excluded.pilihanPerhitungan,
              targetBudget = excluded.targetBudget,
              mataUang = excluded.mataUang,
              updatedAt = excluded.updatedAt
          `).bind(
            uid, namaMoms, namaDads || null, namaBayi || null, hpht, hpl, pilihanPerhitungan, targetBudget, mataUang || "IDR", now, now
          ).run();
          
          return jsonResponse({ success: true });
        }
      }

      // 2. BUDGET ITEMS ENDPOINTS
      if (path === "/api/budget") {
        if (method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT * FROM budget_items WHERE userId = ? ORDER BY tanggal DESC"
          ).bind(uid).all();
          return jsonResponse(results);
        }
        
        if (method === "POST") {
          const body = await request.json();
          const { id, tanggal, nama, kategori, subkategori, prioritas, rencana, aktual, statusPembayaran, metode, catatan } = body;
          const now = new Date().toISOString();
          
          await env.DB.prepare(`
            INSERT INTO budget_items (id, userId, tanggal, nama, kategori, subkategori, prioritas, rencana, aktual, statusPembayaran, metode, catatan, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id, uid, tanggal, nama, kategori, subkategori || null, prioritas, rencana, aktual, statusPembayaran, metode || null, catatan || null, now, now
          ).run();
          
          return jsonResponse({ success: true });
        }
      }
      
      if (path.startsWith("/api/budget/")) {
        const itemId = path.split("/")[3];
        if (method === "PUT") {
          const body = await request.json();
          const now = new Date().toISOString();
          
          // Dynamically build update query
          const fields = [];
          const values = [];
          for (const [k, v] of Object.entries(body)) {
            if (["tanggal", "nama", "kategori", "subkategori", "prioritas", "rencana", "aktual", "statusPembayaran", "metode", "catatan"].includes(k)) {
              fields.push(`${k} = ?`);
              values.push(v);
            }
          }
          fields.push("updatedAt = ?");
          values.push(now);
          
          // Where clause bind
          values.push(itemId);
          values.push(uid); // Scoped to owner
          
          await env.DB.prepare(`
            UPDATE budget_items SET ${fields.join(", ")} WHERE id = ? AND userId = ?
          `).bind(...values).run();
          
          return jsonResponse({ success: true });
        }
        
        if (method === "DELETE") {
          await env.DB.prepare(
            "DELETE FROM budget_items WHERE id = ? AND userId = ?"
          ).bind(itemId, uid).run();
          return jsonResponse({ success: true });
        }
      }

      // 3. WISHLIST ITEMS ENDPOINTS
      if (path === "/api/wishlist") {
        if (method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT * FROM wishlist_items WHERE userId = ? ORDER BY createdAt DESC"
          ).bind(uid).all();
          return jsonResponse(results);
        }
        
        if (method === "POST") {
          const body = await request.json();
          const { id, nama, kategori, brand, estimasi, hargaAktual, jumlah, link, status, prioritas, catatan } = body;
          const now = new Date().toISOString();
          
          await env.DB.prepare(`
            INSERT INTO wishlist_items (id, userId, nama, kategori, brand, estimasi, hargaAktual, jumlah, link, status, prioritas, catatan, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id, uid, nama, kategori || null, brand || null, estimasi, hargaAktual || 0, jumlah || 1, link || null, status, prioritas, catatan || null, now, now
          ).run();
          
          return jsonResponse({ success: true });
        }
      }
      
      if (path.startsWith("/api/wishlist/")) {
        const itemId = path.split("/")[3];
        if (method === "PUT") {
          const body = await request.json();
          const now = new Date().toISOString();
          const fields = [];
          const values = [];
          for (const [k, v] of Object.entries(body)) {
            if (["nama", "kategori", "brand", "estimasi", "hargaAktual", "jumlah", "link", "status", "prioritas", "catatan"].includes(k)) {
              fields.push(`${k} = ?`);
              values.push(v);
            }
          }
          fields.push("updatedAt = ?");
          values.push(now);
          values.push(itemId);
          values.push(uid);
          
          await env.DB.prepare(`
            UPDATE wishlist_items SET ${fields.join(", ")} WHERE id = ? AND userId = ?
          `).bind(...values).run();
          
          return jsonResponse({ success: true });
        }
        
        if (method === "DELETE") {
          await env.DB.prepare(
            "DELETE FROM wishlist_items WHERE id = ? AND userId = ?"
          ).bind(itemId, uid).run();
          return jsonResponse({ success: true });
        }
      }

      // 4. CHECKLIST ITEMS ENDPOINTS
      if (path === "/api/checklist") {
        if (method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT * FROM checklist_items WHERE userId = ? ORDER BY bulan ASC, prioritas DESC"
          ).bind(uid).all();
          return jsonResponse(results);
        }
        
        if (method === "POST") {
          const body = await request.json();
          const { id, nama, trimester, bulan, prioritas, status, minggu, statusChecklist } = body;
          const now = new Date().toISOString();
          
          await env.DB.prepare(`
            INSERT INTO checklist_items (id, userId, nama, trimester, bulan, prioritas, status, minggu, statusChecklist, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id, uid, nama, trimester, bulan, prioritas || "Sedang", status, minggu || null, statusChecklist || "Belum Dimulai", now, now
          ).run();
          
          return jsonResponse({ success: true });
        }
      }
      
      if (path.startsWith("/api/checklist/")) {
        const itemId = path.split("/")[3];
        if (method === "PUT") {
          const body = await request.json();
          const now = new Date().toISOString();
          const fields = [];
          const values = [];
          for (const [k, v] of Object.entries(body)) {
            if (["nama", "trimester", "bulan", "prioritas", "status", "minggu", "statusChecklist"].includes(k)) {
              fields.push(`${k} = ?`);
              values.push(v);
            }
          }
          fields.push("updatedAt = ?");
          values.push(now);
          values.push(itemId);
          values.push(uid);
          
          await env.DB.prepare(`
            UPDATE checklist_items SET ${fields.join(", ")} WHERE id = ? AND userId = ?
          `).bind(...values).run();
          
          return jsonResponse({ success: true });
        }
        
        if (method === "DELETE") {
          await env.DB.prepare(
            "DELETE FROM checklist_items WHERE id = ? AND userId = ?"
          ).bind(itemId, uid).run();
          return jsonResponse({ success: true });
        }
      }

      // 5. MEDICAL VISITS ENDPOINTS
      if (path === "/api/medical") {
        if (method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT * FROM medical_visits WHERE userId = ? ORDER BY tanggal DESC"
          ).bind(uid).all();
          return jsonResponse(results);
        }
        
        if (method === "POST") {
          const body = await request.json();
          const { id, tanggal, usiaKehamilan, dokterBidan, tempat, jenisPemeriksaan, hasilCatatan, tensi, beratBadan, biaya, resepVitamin, jadwalBerikutnya } = body;
          const now = new Date().toISOString();
          
          await env.DB.prepare(`
            INSERT INTO medical_visits (id, userId, tanggal, usiaKehamilan, dokterBidan, tempat, jenisPemeriksaan, hasilCatatan, tensi, beratBadan, biaya, resepVitamin, jadwalBerikutnya, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id, uid, tanggal, usiaKehamilan, dokterBidan, tempat, jenisPemeriksaan, hasilCatatan || null, tensi || null, beratBadan || null, biaya || 0, resepVitamin || null, jadwalBerikutnya || null, now, now
          ).run();
          
          return jsonResponse({ success: true });
        }
      }
      
      if (path.startsWith("/api/medical/")) {
        const itemId = path.split("/")[3];
        if (method === "PUT") {
          const body = await request.json();
          const now = new Date().toISOString();
          const fields = [];
          const values = [];
          for (const [k, v] of Object.entries(body)) {
            if (["tanggal", "usiaKehamilan", "dokterBidan", "tempat", "jenisPemeriksaan", "hasilCatatan", "tansi", "beratBadan", "biaya", "resepVitamin", "jadwalBerikutnya"].includes(k)) {
              fields.push(`${k} = ?`);
              values.push(v);
            }
          }
          fields.push("updatedAt = ?");
          values.push(now);
          values.push(itemId);
          values.push(uid);
          
          await env.DB.prepare(`
            UPDATE medical_visits SET ${fields.join(", ")} WHERE id = ? AND userId = ?
          `).bind(...values).run();
          
          return jsonResponse({ success: true });
        }
        
        if (method === "DELETE") {
          await env.DB.prepare(
            "DELETE FROM medical_visits WHERE id = ? AND userId = ?"
          ).bind(itemId, uid).run();
          return jsonResponse({ success: true });
        }
      }

      // 6. BABY NAMES ENDPOINTS
      if (path === "/api/names") {
        if (method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT * FROM baby_names WHERE userId = ? ORDER BY votes DESC, nama ASC"
          ).bind(uid).all();
          return jsonResponse(results);
        }
        
        if (method === "POST") {
          const body = await request.json();
          const { id, nama, gender, asal, arti, panggilan, catatan, statusPilihan, isFavorite, votes } = body;
          const now = new Date().toISOString();
          
          await env.DB.prepare(`
            INSERT INTO baby_names (id, userId, nama, gender, asal, arti, panggilan, catatan, statusPilihan, isFavorite, votes, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id, uid, nama, gender, asal || "Lokal", arti, panggilan || null, catatan || null, statusPilihan || "Favorit", isFavorite ? 1 : 0, votes || 0, now, now
          ).run();
          
          return jsonResponse({ success: true });
        }
      }
      
      if (path.startsWith("/api/names/")) {
        const itemId = path.split("/")[3];
        if (method === "PUT") {
          const body = await request.json();
          const now = new Date().toISOString();
          const fields = [];
          const values = [];
          for (const [k, v] of Object.entries(body)) {
            if (["nama", "gender", "asal", "arti", "panggilan", "catatan", "statusPilihan", "isFavorite", "votes"].includes(k)) {
              fields.push(`${k} = ?`);
              // Map boolean to SQLite integer (0/1)
              values.push(k === "isFavorite" ? (v ? 1 : 0) : v);
            }
          }
          fields.push("updatedAt = ?");
          values.push(now);
          values.push(itemId);
          values.push(uid);
          
          await env.DB.prepare(`
            UPDATE baby_names SET ${fields.join(", ")} WHERE id = ? AND userId = ?
          `).bind(...values).run();
          
          return jsonResponse({ success: true });
        }
        
        if (method === "DELETE") {
          await env.DB.prepare(
            "DELETE FROM baby_names WHERE id = ? AND userId = ?"
          ).bind(itemId, uid).run();
          return jsonResponse({ success: true });
        }
      }

      // 7. HOSPITAL BAG ENDPOINTS
      if (path === "/api/bag") {
        if (method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT * FROM hospital_bag_items WHERE userId = ? ORDER BY kategori ASC, barang ASC"
          ).bind(uid).all();
          return jsonResponse(results);
        }
        
        if (method === "POST") {
          const body = await request.json();
          const { id, barang, kategori, jumlah, satuan, catatan, prioritas, status, tasMana } = body;
          const now = new Date().toISOString();
          
          await env.DB.prepare(`
            INSERT INTO hospital_bag_items (id, userId, barang, kategori, jumlah, satuan, catatan, prioritas, status, tasMana, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id, uid, barang, kategori, jumlah || 1, satuan || "pcs", catatan || null, prioritas || "Tinggi", status, tasMana || "Koper Utama", now, now
          ).run();
          
          return jsonResponse({ success: true });
        }
      }
      
      if (path.startsWith("/api/bag/")) {
        const itemId = path.split("/")[3];
        if (method === "PUT") {
          const body = await request.json();
          const now = new Date().toISOString();
          const fields = [];
          const values = [];
          for (const [k, v] of Object.entries(body)) {
            if (["barang", "kategori", "jumlah", "satuan", "catatan", "prioritas", "status", "tasMana"].includes(k)) {
              fields.push(`${k} = ?`);
              values.push(v);
            }
          }
          fields.push("updatedAt = ?");
          values.push(now);
          values.push(itemId);
          values.push(uid);
          
          await env.DB.prepare(`
            UPDATE hospital_bag_items SET ${fields.join(", ")} WHERE id = ? AND userId = ?
          `).bind(...values).run();
          
          return jsonResponse({ success: true });
        }
        
        if (method === "DELETE") {
          await env.DB.prepare(
            "DELETE FROM hospital_bag_items WHERE id = ? AND userId = ?"
          ).bind(itemId, uid).run();
          return jsonResponse({ success: true });
        }
      }

      // 8. HOSPITAL COMPARISON ENDPOINTS
      if (path === "/api/hospital") {
        if (method === "GET") {
          const { results } = await env.DB.prepare(
            "SELECT * FROM hospital_comparisons WHERE userId = ? ORDER BY rating DESC"
          ).bind(uid).all();
          
          // Map sqlite fields back to frontend array structures if needed
          const formatted = results.map(r => ({
            ...r,
            nicu: r.nicu === 1,
            bpjsAsuransi: r.bpjsAsuransi === 1,
          }));
          return jsonResponse(formatted);
        }
        
        if (method === "POST") {
          const body = await request.json();
          const { id, nama, jenis, lokasi, jarak, biayaNormal, biayaCaesar, fasilitas, nicu, bpjsAsuransi, kontak, linkGmap, statusKunjungan, kelebihan, kekurangan, catatanBiaya, rating } = body;
          const now = new Date().toISOString();
          
          await env.DB.prepare(`
            INSERT INTO hospital_comparisons (id, userId, nama, jenis, lokasi, jarak, biayaNormal, biayaCaesar, fasilitas, nicu, bpjsAsuransi, kontak, linkGmap, statusKunjungan, kelebihan, kekurangan, catatanBiaya, rating, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            id, uid, nama, jenis, lokasi || "", jarak || 1.0, biayaNormal || 0, biayaCaesar || 0, fasilitas || null, nicu ? 1 : 0, bpjsAsuransi ? 1 : 0, kontak || null, linkGmap || null, statusKunjungan || "Belum Disurvei", kelebihan || null, kekurangan || null, catatanBiaya || null, rating || 4, now, now
          ).run();
          
          return jsonResponse({ success: true });
        }
      }
      
      if (path.startsWith("/api/hospital/")) {
        const itemId = path.split("/")[3];
        if (method === "PUT") {
          const body = await request.json();
          const now = new Date().toISOString();
          const fields = [];
          const values = [];
          for (const [k, v] of Object.entries(body)) {
            if (["nama", "jenis", "lokasi", "jarak", "biayaNormal", "biayaCaesar", "fasilitas", "nicu", "bpjsAsuransi", "kontak", "linkGmap", "statusKunjungan", "kelebihan", "kekurangan", "catatanBiaya", "rating"].includes(k)) {
              fields.push(`${k} = ?`);
              if (["nicu", "bpjsAsuransi"].includes(k)) {
                values.push(v ? 1 : 0);
              } else {
                values.push(v);
              }
            }
          }
          fields.push("updatedAt = ?");
          values.push(now);
          values.push(itemId);
          values.push(uid);
          
          await env.DB.prepare(`
            UPDATE hospital_comparisons SET ${fields.join(", ")} WHERE id = ? AND userId = ?
          `).bind(...values).run();
          
          return jsonResponse({ success: true });
        }
        
        if (method === "DELETE") {
          await env.DB.prepare(
            "DELETE FROM hospital_comparisons WHERE id = ? AND userId = ?"
          ).bind(itemId, uid).run();
          return jsonResponse({ success: true });
        }
      }

      // 9. ADMIN EMAIL WHITELIST LISTENER & MUTATIONS
      if (path === "/api/admin/whitelist") {
        // Only admin email can access these
        if (userEmail !== "temanparenting.id@gmail.com") {
          return jsonResponse({ error: "Forbidden: Admin Only" }, 403);
        }

        if (method === "GET") {
          // Fetch from D1 (allowed_emails)
          const { results } = await env.DB.prepare(
            "SELECT * FROM allowed_emails ORDER BY createdAt DESC"
          ).all();
          return jsonResponse(results);
        }

        if (method === "POST") {
          const body = await request.json();
          const { email } = body;
          const cleanEmail = email?.toLowerCase().trim();
          if (!cleanEmail) {
            return jsonResponse({ error: "Missing email" }, 400);
          }

          const now = new Date().toISOString();
          const valObj = {
            email: cleanEmail,
            addedBy: userEmail,
            createdAt: now
          };

          // Update KV
          await env.BABYPLAN_KV.put(`allowedEmail:${cleanEmail}`, JSON.stringify(valObj));

          // Replica in D1
          await env.DB.prepare(`
            INSERT INTO allowed_emails (email, addedBy, createdAt)
            VALUES (?, ?, ?)
            ON CONFLICT(email) DO NOTHING
          `).bind(cleanEmail, userEmail, now).run();

          return jsonResponse({ success: true });
        }
      }

      if (path.startsWith("/api/admin/whitelist/")) {
        if (userEmail !== "temanparenting.id@gmail.com") {
          return jsonResponse({ error: "Forbidden: Admin Only" }, 403);
        }

        const emailToDelete = decodeURIComponent(path.split("/")[4])?.toLowerCase().trim();
        if (method === "DELETE") {
          if (emailToDelete === "temanparenting.id@gmail.com") {
            return jsonResponse({ error: "Cannot delete primary admin" }, 400);
          }

          // Delete from KV
          await env.BABYPLAN_KV.delete(`allowedEmail:${emailToDelete}`);

          // Delete from D1 replica
          await env.DB.prepare(
            "DELETE FROM allowed_emails WHERE email = ?"
          ).bind(emailToDelete).run();

          return jsonResponse({ success: true });
        }
      }

      return jsonResponse({ error: "Endpoint not found" }, 404);

    } catch (err) {
      return jsonResponse({ error: "Server error", details: err.message }, 500);
    }
  }
};
