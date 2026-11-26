# Dhaka Bites

Full-stack restaurant review platform for Dhaka built with **Next.js (App Router)**, **PostgreSQL**, **Leaflet + OpenStreetMap**, **HTTP-only cookie JWT auth**, **Email/Phone OTP**, and a **QR-based Face Verification Demo** (strictly free tools, no paid APIs).

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Start PostgreSQL
**Option A — Docker Compose (auto-runs schema & seed):**
```bash
docker compose up -d
```

**Option B — Local PostgreSQL:**
```bash
createdb dhaka_bites
psql "postgresql://postgres:postgres@localhost:5432/dhaka_bites" -f db/schema.sql
psql "postgresql://postgres:postgres@localhost:5432/dhaka_bites" -f db/seed.sql
```

### 3. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## Project Structure
- `app/page.tsx` — Main UI (search, area filter, Dhaka map, restaurant cards, review form, add-restaurant modal)
- `app/verify-face/[sessionId]/page.tsx` — QR target page with browser camera demo liveness check
- `app/api/auth/*` — Register, Login, Logout, Me, OTP Verification, QR Face Verification endpoints
- `app/api/restaurants/*` — List/Add Dhaka restaurants and List/Submit verified reviews
- `components/DhakaMap.tsx` — Interactive Leaflet + OpenStreetMap map centered on Dhaka
- `components/AuthModal.tsx` — Multi-step Registration (Form → OTP → QR Face Verification) & Login
- `lib/faceVerification/index.ts` — Clean provider separation (`DemoFaceVerificationProvider` vs `ProductionBiometricProvider`)
- `db/schema.sql` & `db/seed.sql` — PostgreSQL schema and sample Dhaka restaurants
