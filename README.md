# TUGAS-AKHIR-VAR-TATA-SURYA

Project Web AR marker-based (Hiro) untuk eksplorasi tata surya menggunakan:
- Vite
- TypeScript
- A-Frame
- AR.js (`@ar-js-org/ar.js`)
- A-Frame Extras `animation-mixer`
- Google `<model-viewer>` untuk preview GLB planet di panel detail
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

- `public/assets/models/solar-system/solar_system_animation.glb`
- `public/assets/models/planets/*.glb`
- `public/assets/markers/hiro.png`
- `public/assets/markers/patt.hiro`
- `public/vendor/aframe.min.js`
- `public/vendor/aframe-ar.js`
- `public/vendor/aframe-extras.min.js`
- `public/marker-test.html`
- `src/data/planets.ts`
- `src/ar/scene.ts`
- `src/ui/templates.ts`
- `src/styles/main.css`
- `src/main.ts`

## Fitur Utama

- Landing dengan tombol `Mulai AR` dan `Cara Pakai`.
- Scanner AR berbasis Hiro marker.
- Model tata surya utama dari `solar_system_animation.glb`.
- Detail 8 planet utama dengan preview GLB planet individual.
- Profil edukasi planet: kategori, bulan, atmosfer, suhu, gravitasi, komposisi, ciri utama, eksplorasi, dan fakta menarik.
- Kuis pilihan jawaban per planet dengan feedback langsung.
- Switch Kamera Depan/Belakang beserta deteksi fallback apabila hardware tidak tersedia.
- Optimasi tampilan mobile (penanganan SVH dan area tap yang adaptif).

## Deploy Static Hosting

Untuk Vercel atau static hosting sejenis:

1. Push project ke repository.
2. Import project di platform hosting.
3. Build command: `npm run build`.
4. Output directory: `dist`.
5. Deploy.

Saat ini project tidak memakai `vercel.json` khusus. Route utama berjalan sebagai static Vite app dari `index.html`.

## Cara Ubah Data Planet

Edit `src/data/planets.ts` pada array `PLANETS`:
- `name`, `description`, `category`
- `diameter`, `distanceFromSun`, `orbitalPeriod`, `rotationPeriod`
- `moons`, `atmosphere`, `averageTemperature`, `gravity`, `composition`, `keyFeature`, `explorationNote`
- `funFact`, `learningQuestion`, `learningAnswer`, `quizOptions`, `quizCorrectAnswer`, `quizExplanation`
- `modelPath` / `modelId`
- `themeColor`
- `hitZonePosition` / `hitZoneRadius`

## Atur Hit Zone Jika Belum Pas

Masih di `src/data/planets.ts`, ubah:
- `hitZonePosition` (format: `x y z`)
- `hitZoneRadius` (angka radius sphere)

Rekomendasi tuning cepat:
1. Naikkan/turunkan `y` jika klik terasa meleset di atas/bawah planet.
2. Geser `x` untuk kiri/kanan, `z` untuk depan/belakang marker.
3. Jika sulit diklik di HP, naikkan `hitZoneRadius` sedikit (misalnya +0.02).

## Validasi Manual

Minimal sebelum demo:
1. Buka aplikasi di Android Chrome dan iOS Safari.
2. Tap `Cara Pakai`, cek link marker, lalu tutup.
3. Tap `Mulai AR`, izinkan kamera, dan arahkan ke Hiro marker.
4. Tap tombol kamera `Belakang/Depan` dan pastikan transisi tidak menampilkan flash kamera yang salah.
5. Tap beberapa planet, cek judul panel dan preview GLB sesuai planet yang dipilih.
6. Coba kuis planet dan pastikan feedback benar/salah tampil.
7. Tap `Kembali ke Tata Surya`, lalu tutup scanner dan pastikan landing kembali normal.
