# Flow Overview - AR Tata Surya Explorer

## 1. Landing -> Mulai AR

1. User membuka aplikasi.
2. Landing tampil dengan tombol `Mulai AR` dan `Cara Pakai`, preview model GLB, serta marker Hiro.
3. User tap `Mulai AR`.
4. Browser meminta izin kamera jika belum diizinkan.
5. Scanner AR aktif, HUD menampilkan status marker.

## 2. Deteksi Marker -> Detail Planet

1. Marker Hiro terlihat di kamera.
2. Status berubah menjadi `Marker terdeteksi`.
3. User tap planet di model tata surya.
4. Tata surya disembunyikan sementara agar panel detail fokus.
5. Panel detail planet muncul dengan data utama, preview model `.glb`, profil edukasi, catatan eksplorasi, fakta menarik, dan kuis pilihan jawaban.
6. User dapat menjawab kuis dan menerima feedback benar/salah langsung di panel.
7. User tap `Kembali ke Tata Surya` untuk menghapus detail dan menampilkan tata surya lagi.

## 3. Cara Pakai

1. User tap `Cara Pakai`.
2. Modal tampil berisi langkah penggunaan dan link marker.
3. User tap `Tutup` atau area luar modal untuk menutup.

## 4. Switch Camera

1. User tap tombol kamera `Belakang/Depan`.
2. Sistem melakukan preflight stream kamera target sebelum rebuild scene AR.
3. Overlay `Menyiapkan kamera...` menutup preview selama transisi agar frame kamera yang salah tidak terlihat.
4. Jika kamera target tidak tersedia, scanner tetap memakai kamera sebelumnya dan menampilkan warning.

## 5. Close AR

1. User tap tombol `X`.
2. Scanner AR ditutup, stream kamera dihentikan, preview detail dibersihkan, dan artefak A-Frame dibersihkan.
3. Kembali ke landing, UI reset normal.
4. Pada perangkat touch/mobile, halaman direload setelah cleanup singkat agar side-effect AR.js di browser HP benar-benar hilang.

## 6. Error & Empty States

- Kamera ditolak: tampil pesan error/warna merah.
- Model gagal dimuat: fallback sphere ditampilkan + toast warning.
- Marker hilang: status kembali ke `Mencari marker...`.
- Kuis belum dijawab: feedback dikosongkan sampai user memilih opsi.
