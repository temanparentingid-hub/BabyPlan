<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and Deploy Baby Budget Plan

Aplikasi perencanaan anggaran dan persiapan kehamilan dari Teman Parenting.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the app:
   ```bash
   npm run dev
   ```

---

## Deploy to Firebase Hosting & Connect Custom Domain

Since this application uses Firebase and you already have your own DNS provider, here are the steps to deploy the app and connect your custom domain:

### Step 1: Install Firebase CLI
If you haven't installed Firebase CLI, install it globally using npm:
```bash
npm install -g firebase-tools
```

### Step 2: Login and Select Firebase Project
1. Log in to your Firebase account:
   ```bash
   firebase login
   ```
2. Initialize Firebase in this project directory (if not already linked) or directly target the project:
   ```bash
   firebase use steel-market-8jhcx
   ```
   *(Note: The project ID is configured as `steel-market-8jhcx`)*

### Step 3: Build & Deploy
1. Build the production application bundle:
   ```bash
   npm run build
   ```
2. Deploy to Firebase Hosting:
   ```bash
   firebase deploy --only hosting
   ```
   Once deployed, Firebase will provide a hosting URL like `https://steel-market-8jhcx.web.app` or `https://steel-market-8jhcx.firebaseapp.com`.

### Step 4: Add Your Custom Domain in Firebase Console
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Select your project **steel-market-8jhcx**.
3. In the left sidebar, navigate to **Build** > **Hosting**.
4. Scroll down to the **Domains** section and click **Add custom domain**.
5. Enter your domain name (e.g., `yourdomain.com` or `babyplan.yourdomain.com`).
6. Firebase will provide you with DNS verification details (either a **TXT record** or **A records**).

### Step 5: Update DNS Records on Your DNS Provider
1. Log into your DNS provider's dashboard (e.g., Cloudflare, Niagahoster, Rumahweb, GoDaddy, Namecheap, etc.).
2. Go to the DNS Management/Zone Editor settings for your domain.
3. Add the DNS records provided by Firebase:
   - **TXT Record** (for ownership verification, if prompted)
   - **A Records** (pointing to the Firebase Hosting IP addresses provided by Firebase)
4. Save the DNS configuration.

*Note: DNS propagation can take anywhere from a few minutes up to 24-48 hours. Once verified, Firebase will automatically provision an SSL certificate for your custom domain.*

