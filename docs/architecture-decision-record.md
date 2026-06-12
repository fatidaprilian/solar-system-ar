# Architecture Decision Record

## ADR-001: Arsitektur Web AR statis berbasis Vite + A-Frame + AR.js

- Status: Accepted
- Tanggal: 2026-05-12

### Context

Proyek ini adalah Web AR berbasis Vite + TypeScript yang menggunakan A-Frame, AR.js, tracking marker Hiro, serta asset GLB lokal. Target demo utama adalah browser mobile di Android, iOS, dan tablet dengan hosting statis.

Scene AR harus menjaga feed kamera tetap stabil, menampilkan tata surya dengan ukuran terbaca di layar kecil, memungkinkan tap planet untuk detail, dan kembali ke landing dengan bersih setelah scanner ditutup.

### Decision

- Menggunakan `solar_system_animation.glb` sebagai tampilan utama saat marker terdeteksi, dengan runtime cleanup untuk menyembunyikan asteroid/dwarf clutter dan sphere row hanya sebagai fallback ketika file GLB gagal dimuat.
- Menjaga orientasi `solar_system_animation.glb` dekat dengan bidang marker Hiro melalui wrapper presentasi khusus (`solarPresentation`) dengan pitch `-42deg` dan yaw `-8deg`. Model tetap difit dan dipusatkan lebih dulu, lalu wrapper memberi sudut orbit yang lebih terbaca tanpa kembali berdiri/miring ekstrem. Gesture drag hanya boleh memutar yaw pada wrapper, bukan menambah pitch.
- Mempertahankan ukuran desktop/laptop sebagai baseline, tetapi membatasi target fit dan scale multiplier pada perangkat touch agar tata surya tidak membesar berlebihan di layar smartphone portrait.
- Meminta profil kamera AR dengan target 1280x720, `trackingMethod: best`, canvas tracking 1280x720, dan smoothing marker moderat agar scan Hiro lebih tajam/stabil ketika perangkat mendukungnya. Stream kamera manual saat switch juga memakai constraint kualitas yang sama dengan fallback otomatis ke kemampuan device.
- Detail planet tetap memakai GLB individual, dengan ukuran disesuaikan otomatis berdasarkan bounding box, posisi dipusatkan ulang, dan canvas preview yang dipaksa crisp di panel informasi.
- Saat panel detail dibuka, scene AR utama menyembunyikan tata surya tanpa merender planet besar tambahan. Tombol kembali langsung mengembalikan overview tata surya secara deterministik.
- Cleanup lifecycle AR dipusatkan di `src/main.ts`: mematikan stream, membersihkan preview GLB panel, menghapus artefak A-Frame, reset state scanner, cleanup berulang setelah close, dan reload khusus perangkat touch untuk menghapus side-effect mobile browser yang tersisa.
- Menggunakan `visualViewport` untuk menjaga stabilitas tinggi tampilan mobile (`--app-height`).

### Rationale

Model `solar_system_animation.glb` punya skala internal besar dan membawa objek dekoratif seperti asteroid/dwarf body yang membuat tampilan marker mobile berantakan. Runtime cleanup menjaga asset asli tetap dipakai tanpa mengedit file GLB, sementara penyesuaian bounding box, centering, dan canvas preview mencegah model detail planet tampak blur atau keluar dari panel.

AR.js kadang meninggalkan elemen video/canvas dan kelas fullscreen setelah close. Cleanup berulang, reset landing, dan reload khusus perangkat touch mencegah UI glitch pada siklus buka-tutup berulang.

### Consequences

- Tampilan utama mengikuti asset `solar_system_animation.glb` dengan ukuran marker dan presentation tilt yang lebih terkendali.
- Ukuran AR di laptop tetap memakai target desktop, sedangkan smartphone memakai target lebih kecil agar planet dan orbit tidak menutup marker.
- Marker tracking dapat memakai resolusi lebih tinggi, sehingga beban CPU di perangkat lama bisa meningkat; browser tetap boleh menurunkan kualitas stream jika hardware tidak mendukung.
- Detail planet tetap memakai asset 3D individual.
- Kalibrasi hit zone tetap dikendalikan dari `src/data/planets.ts`.
- Verifikasi visual wajib di perangkat nyata (Android Chrome, iOS Safari, tablet).
