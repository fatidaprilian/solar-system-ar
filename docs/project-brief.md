# Project Brief - AR Tata Surya Explorer

## Ringkasan

AR Tata Surya Explorer adalah aplikasi Web AR marker-based (Hiro) untuk eksplorasi tata surya di perangkat mobile. Fokus utama: masuk AR cepat, kamera stabil, dan detail planet mudah diakses.

## Tujuan Produk

- Memberikan pengalaman belajar tata surya yang interaktif berbasis kamera.
- Menyediakan detail planet (deskripsi, diameter, jarak, periode) tanpa menutup tampilan AR.
- Menjaga alur cepat: buka aplikasi -> mulai AR -> deteksi marker -> tap planet.

## Target Pengguna

- Siswa dan guru untuk demo kelas.
- Pengguna umum yang ingin eksplorasi AR cepat di mobile.

## Ruang Lingkup

- Landing page dan modal “Cara Pakai”.
- AR scanner berbasis Hiro marker.
- Tampilan tata surya (model atau fallback) dan detail planet.
- Data planet statis dari file lokal.

## Di Luar Lingkup

- Backend server, autentikasi, akun pengguna.
- Penyimpanan progres pengguna.
- Analitik atau pelacakan pengguna.

## Bukti Stack dan Runtime

- Frontend: Vite + TypeScript.
- AR runtime: A-Frame + AR.js.
- Animasi: CSS transitions ringan; detail planet memakai state change langsung agar stabil di mobile.
- Asset 3D: GLB/glTF.
- Tidak ada backend; semua asset disajikan statis.

## Data dan Konten

- Data planet tersimpan di `src/data/planets.ts`.
- Model 3D di `public/assets/models/**`.
- Marker dan test page di `public/assets/markers/**` dan `public/marker-test.html`.

## UX / UI Constraints

- Kamera adalah surface utama (camera-first).
- Overlay HUD ringkas, tidak menutupi marker.
- Target sentuh minimal 44px.
- Tanpa forced fullscreen dan tanpa lock orientation.

## Keamanan dan Privasi

- Aplikasi hanya membutuhkan akses kamera.
- Tidak menyimpan atau mengirim data pengguna.
- Kamera memerlukan HTTPS pada produksi.

## Testing Strategy

- Manual test pada Android dan iOS.
- Uji izin kamera, deteksi marker, interaksi tap planet, dan close AR.
- Tidak ada automated tests saat ini.

## Deployment

- Static hosting (mis. Vercel).
- Output build di `dist`.

## Risiko Utama

- Perbedaan perilaku kamera di perangkat iOS/Android.
- Performa model 3D di perangkat low-end.
- Ukuran model terlalu kecil/besar di berbagai viewport.

## Langkah Validasi Berikutnya

- Uji skala planet pada iPhone (Safari), Android (Chrome).
- Uji close AR lalu kembali ke landing tanpa UI glitch.
- Uji akses marker dalam kondisi cahaya rendah.
