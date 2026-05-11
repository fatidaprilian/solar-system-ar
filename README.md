# TUGAS-AKHIR-VAR-TATA-SURYA

Project Web AR marker-based (Hiro) untuk eksplorasi tata surya menggunakan:
- Vite
- TypeScript
- A-Frame
- AR.js (`@ar-js-org/ar.js`)
- GSAP
- GLB/glTF models

## Jalankan Lokal

```bash
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Build dan Preview

```bash
npm run build
npm run preview
```

## Struktur Penting

- `public/assets/models/solar-system/solar_system.glb`
- `public/assets/models/planets/*.glb`
- `public/assets/markers/hiro.png`
- `public/assets/markers/patt.hiro`
- `public/vendor/aframe.min.js`
- `public/vendor/aframe-ar.js`
- `public/marker-test.html`
- `src/data/planets.ts`
- `src/ar/scene.ts`
- `src/ui/templates.ts`
- `src/styles/main.css`
- `src/main.ts`

## Deploy Vercel

1. Push project ke repository.
2. Import project di Vercel.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy.

`vercel.json` sudah disiapkan untuk SPA rewrite ke `index.html`.

## Cara Ubah Data Planet

Edit `src/data/planets.ts` pada array `PLANETS`:
- `name`, `description`, `diameter`, `distanceFromSun`, `orbitalPeriod`, `rotationPeriod`, `funFact`
- `modelPath` / `modelId`
- `themeColor`
- `hitZonePosition` / `hitZoneRadius`

## Atur Hit Zone Jika Belum Pas

Masih di `src/data/planets.ts`, ubah:
- `hitZonePosition` (format: `x y z`)
- `hitZoneRadius` (angka radius sphere)

Untuk kalibrasi visual hit zone saat testing, atur flag `DEBUG_HIT_ZONES` di `src/ar/scene.ts`:
- `true`: hit zone terlihat semi-transparan (`opacity: 0.18`)
- `false`: hit zone transparan penuh (`opacity: 0`)

Rekomendasi tuning cepat:
1. Naikkan/turunkan `y` jika klik terasa meleset di atas/bawah planet.
2. Geser `x` untuk kiri/kanan, `z` untuk depan/belakang marker.
3. Jika sulit diklik di HP, naikkan `hitZoneRadius` sedikit (misalnya +0.02).
