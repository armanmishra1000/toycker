# Cloudflare R2 Media Storage Rollout

Simple end-to-end steps to move Medusa product media (images, videos, GIFs, other assets) into Cloudflare R2 while keeping the Google Cloud backend and Vercel storefront unchanged.

## 0. Create a Cloudflare Account and Enable R2

1. Visit https://dash.cloudflare.com/sign-up and create a free account (email + password). Confirm the email when Cloudflare sends the verification link.
2. Log back into the dashboard, open **Billing → Payment info**, and add a payment method (Cloudflare requires this before you can enable R2, even though the free tier covers the first 10 GB/month).
3. In the sidebar, select **Workers & Pages → R2 (Object Storage)** and click **Enable R2**. Accept the terms to finish provisioning the service for your account.
4. Still inside the R2 view, click **Create bucket**, supply a globally unique name (e.g., `toycker-assets`), and choose the data residency (most teams use Automatic). The bucket appears immediately and is ready for the later configuration steps below.

## 1. Prerequisites (Easy Checklist)

1. **Stay signed in** to the Cloudflare dashboard and open your new R2 bucket page (screenshot above).
2. **Write down these five things right now** so you don’t need to hunt for them later:
   - Account ID (top right of the dashboard).
   - Bucket name (e.g., `toycker-assets`).
   - Public URL you plan to use (`https://<accountid>.r2.dev` works if you don’t have a custom domain yet).
   - Access Key ID.
   - Secret Access Key.
3. **Create the keys** if you haven’t already: R2 → **Settings** → **Manage R2 API Tokens** → “Create API token”, pick **Object Read & Write**, and copy the Access/Secret keys once.
4. **Allow your apps to talk to R2**:
   - Backend origin (your Google VM URL) should be allowed to PUT/DELETE in the bucket CORS settings.
   - Storefront origins (Vercel production + `http://localhost:8000`) should be allowed to GET.
5. Optional but helpful: note `CLOUDFLARE_R2_ENDPOINT` (usually `https://<accountid>.r2.cloudflarestorage.com`), leave `CLOUDFLARE_R2_REGION=auto`, and keep `CLOUDFLARE_R2_PREFIX=uploads/` unless you prefer another folder name.

## 2. Backend (Medusa on Google Cloud VM)

1. Duplicate the new variables in `backend/.env` (the template already contains placeholders). Do **not** commit secrets:
   ```bash
   CLOUDFLARE_R2_ACCOUNT_ID=cf_xxxxx
   CLOUDFLARE_R2_BUCKET=toycker-assets
   CLOUDFLARE_R2_PUBLIC_URL=https://cdn.toycker.com
   CLOUDFLARE_R2_ACCESS_KEY_ID=<ACCESS_KEY_ID>
   CLOUDFLARE_R2_SECRET_KEY=<SECRET_KEY>
   CLOUDFLARE_R2_ENDPOINT=https://cf_xxxxx.r2.cloudflarestorage.com
   CLOUDFLARE_R2_REGION=auto
   CLOUDFLARE_R2_PREFIX=uploads/
   ```
2. `backend/medusa-config.ts` now registers the File Module (`@medusajs/file`) and injects the S3-compatible provider so every upload goes straight to R2. All sensitive values are pulled from env variables:
   ```ts
   modules: [
     {
       resolve: "@medusajs/file",
       options: {
         providers: [
           {
             resolve: "@medusajs/file-s3",
             id: "cloudflare-r2",
             options: {
               bucket: process.env.CLOUDFLARE_R2_BUCKET!,
               region: process.env.CLOUDFLARE_R2_REGION ?? "auto",
               endpoint: r2Endpoint!,
               access_key_id: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
               file_url: process.env.CLOUDFLARE_R2_PUBLIC_URL!,
               prefix: process.env.CLOUDFLARE_R2_PREFIX ?? "uploads/",
               additional_client_config: { forcePathStyle: true },
             },
           },
         ],
       },
     },
   ]
   ```
   The helper derives `r2Endpoint` (and the provider automatically reads the secret key env) when a custom endpoint is not provided.
3. Restart the Medusa process (`npm run build && npm run start` or PM2) so the provider picks up the new env values.

## 3. Frontend (Next.js on Vercel)

1. Fill the new public env vars (and keep them consistent across `.env.local`, `.env.production`, and Vercel project settings):
   ```bash
   NEXT_PUBLIC_R2_MEDIA_PROTOCOL=https
   NEXT_PUBLIC_R2_MEDIA_HOSTNAME=cdn.toycker.com
   NEXT_PUBLIC_R2_MEDIA_PATHNAME=/uploads/**
   ```
2. `frontend/next.config.js` now reads those envs and adds the domain to `images.remotePatterns`, allowing Next/Image to optimize media from R2 both locally and on Vercel.
3. No other frontend code paths change—product image URLs already come from Medusa, which now returns the R2 URL.

## 4. Verification

1. **Backend checks**
   - `cd backend && npm run build`
   - Start the server and upload a product image via the Medusa Admin UI. Confirm the stored URL matches `CLOUDFLARE_R2_PUBLIC_URL`.
2. **Frontend checks**
   - `cd frontend && npm run lint`
   - Open the storefront (local or Vercel preview) and ensure product media renders correctly from the R2 domain.
3. Monitor the R2 bucket to verify new objects (images/videos/GIFs) arrive under the configured prefix.

## 5. Code Changes in This Branch

| File | Description |
| --- | --- |
| `backend/.env.template` | Added Cloudflare R2 credential placeholders. |
| `backend/medusa-config.ts` | Registered `@medusajs/file-s3` module with R2 options and forced path-style requests. |
| `frontend/.env.template` | Added public envs that describe the R2 host for image optimization. |
| `frontend/next.config.js` | Dynamically whitelists the R2 domain for the Next/Image optimizer. |
| `CLOUDFLARE_R2_SETUP.md` | This document with step-by-step instructions, code summary, verification steps, and before/after notes. |

## 6. Before / After (Simple English)

- **Before**: Medusa relied on its default file adapter, so uploads lived on the starter S3 bucket and the storefront only trusted the original demo hosts for optimized images. Asset domains were inconsistent between Google Cloud (backend) and Vercel (frontend).
- **After**: Every upload now goes straight to Cloudflare R2 using the S3-compatible provider, and the storefront explicitly trusts the R2 domain, so both environments share the same fast, zero-egress media pipeline.

That’s it—deploy the backend (Google Cloud VM) and frontend (Vercel) with the new env values, and product media will automatically flow through Cloudflare R2.
