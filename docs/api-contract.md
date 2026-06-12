# API Contract - AR Tata Surya Explorer

## Ringkasan

Aplikasi ini tidak memiliki API backend. Semua data dan asset disajikan statis oleh web server.

## Kontrak Asset Statis

- `/` -> halaman utama.
- `/assets/models/solar-system/solar_system_animation.glb` -> model tata surya.
- `/assets/models/planets/*.glb` -> model planet.
- `/assets/markers/hiro.png` -> marker untuk print.
- `/assets/markers/patt.hiro` -> pattern marker.
- `/marker-test.html` -> halaman uji marker.
- `/vendor/aframe.min.js`, `/vendor/aframe-ar.js` -> library runtime.

## Data Lokal

- `src/data/planets.ts` berisi data planet (nama, deskripsi, ukuran, jarak, periode, fakta).

## Keamanan dan Privasi

- Akses kamera menggunakan izin browser.
- Tidak ada data pengguna yang disimpan atau dikirim.

## Catatan

Jika nanti ditambahkan API backend, dokumen ini harus diperbarui dengan:

- Base URL
- Endpoint list
- Skema request/response
- Error format
- Auth rules
