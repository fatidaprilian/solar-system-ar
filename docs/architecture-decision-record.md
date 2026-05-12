# Architecture Decision Record

## ADR-001: Arsitektur Web AR statis berbasis Vite + A-Frame + AR.js

- Status: Accepted
- Tanggal: 2026-05-12

### Context

Proyek ini adalah Web AR berbasis Vite + TypeScript yang menggunakan A-Frame, AR.js, tracking marker Hiro, serta asset GLB lokal. Target demo utama adalah browser mobile di Android, iOS, dan tablet dengan hosting statis.

Scene AR harus menjaga feed kamera tetap stabil, menampilkan tata surya dengan ukuran terbaca di layar kecil, memungkinkan tap planet untuk detail, dan kembali ke landing dengan bersih setelah scanner ditutup.

### Decision

- Menggunakan tata surya mini berbasis marker yang terkontrol untuk tampilan utama, bukan menampilkan `solar_system.glb` penuh di mobile.
- Detail planet tetap memakai GLB individual, dengan ukuran disesuaikan otomatis berdasarkan bounding box di preview panel informasi.
- Saat panel detail dibuka, scene AR utama menyembunyikan tata surya tanpa merender planet besar tambahan. Tombol kembali langsung mengembalikan overview tata surya secara deterministik.
- Cleanup lifecycle AR dipusatkan di `src/main.ts`: mematikan stream, membersihkan preview GLB panel, menghapus artefak A-Frame, reset state scanner, cleanup berulang setelah close, dan reload khusus perangkat touch untuk menghapus side-effect mobile browser yang tersisa.
- Menggunakan `visualViewport` untuk menjaga stabilitas tinggi tampilan mobile (`--app-height`).

### Rationale

Model `solar_system.glb` penuh punya skala internal yang tidak konsisten di berbagai perangkat. Mini row terkontrol memberi posisi dan ukuran yang lebih stabil, serta memudahkan tap pada hit zone. Penyesuaian bounding box mencegah model detail planet menutup kamera saat skala asli asset tidak seragam.

AR.js kadang meninggalkan elemen video/canvas dan kelas fullscreen setelah close. Cleanup berulang, reset landing, dan reload khusus perangkat touch mencegah UI glitch pada siklus buka-tutup berulang.

### Consequences

- Tampilan utama fokus pada keterbacaan edukasi, bukan komposisi penuh GLB.
- Detail planet tetap memakai asset 3D individual.
- Kalibrasi hit zone tetap dikendalikan dari `src/data/planets.ts`.
- Verifikasi visual wajib di perangkat nyata (Android Chrome, iOS Safari, tablet).
