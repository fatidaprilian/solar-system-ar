# Flow Overview - AR Tata Surya Explorer

## 1. Landing -> Mulai AR

1. User membuka aplikasi.
2. Landing tampil dengan tombol “Mulai AR” dan “Cara Pakai”.
3. User tap “Mulai AR”.
4. Browser meminta izin kamera (jika belum diizinkan).
5. Scanner AR aktif, HUD menampilkan status marker.

## 2. Deteksi Marker -> Detail Planet

1. Marker Hiro terlihat di kamera.
2. Status berubah menjadi “Marker terdeteksi”.
3. User tap planet (hit zone) di model tata surya.
4. Panel detail planet muncul dengan data utama.
5. User tap “Kembali ke Tata Surya” untuk kembali.

## 3. Cara Pakai (Modal)

1. User tap “Cara Pakai”.
2. Modal tampil berisi langkah penggunaan dan link marker.
3. User tap “Tutup” atau area luar modal untuk menutup.

## 4. Switch Camera

1. User tap tombol kamera “Belakang/Depan”.
2. Sistem mencoba switch facingMode.
3. Jika browser tidak mendukung, tampil pesan warning.

## 5. Close AR (Tombol X)

1. User tap tombol X.
2. Scanner AR ditutup.
3. Kembali ke landing, UI reset normal.

## 6. Error & Empty States

- Kamera ditolak: tampil pesan error/warna merah.
- Model gagal dimuat: fallback sphere ditampilkan + toast warning.
- Marker hilang: status kembali ke “Mencari marker...”.
