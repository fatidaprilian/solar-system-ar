export const APP_TEMPLATE = `
<div class="app-shell">
  <div class="space-backdrop" aria-hidden="true"></div>

  <section id="landingPage" class="view view-landing" aria-label="Landing">
    <div class="landing-content">
      <p class="landing-kicker">TUGAS AKHIR VAR</p>
      <h1>AR Tata Surya Explorer</h1>
      <p class="landing-subtitle">Jelajahi tata surya melalui Augmented Reality</p>
      <div class="landing-actions">
        <button id="startArBtn" class="btn btn-primary" type="button">Mulai AR</button>
        <button id="howToBtn" class="btn btn-secondary" type="button">Cara Pakai</button>
      </div>
    </div>
  </section>

  <section id="scannerPage" class="view view-scanner is-hidden" aria-label="Scanner AR">
    <div id="arMount" class="ar-mount" aria-live="polite"></div>

    <div class="scanner-overlay">
      <div class="hud-top">
        <button id="closeScannerBtn" class="icon-btn icon-btn-close" type="button" aria-label="Tutup Scanner">X</button>
        <div id="markerStatus" class="marker-status">Mencari marker...</div>
        <button id="switchCameraBtn" class="icon-btn icon-btn-camera" type="button" aria-label="Kamera Belakang">Kamera Belakang</button>
      </div>

      <div id="scannerHint" class="scanner-hint">Arahkan kamera ke Hiro marker</div>
    </div>

    <aside id="planetPanel" class="planet-panel is-hidden" aria-label="Detail planet">
      <div class="panel-head">
        <h2 id="planetName">Planet</h2>
        <button id="closePlanetBtn" class="text-btn" type="button">Kembali ke Tata Surya</button>
      </div>
      <p id="planetDescription" class="planet-description"></p>
      <dl class="planet-meta">
        <div><dt>Diameter</dt><dd id="planetDiameter"></dd></div>
        <div><dt>Jarak dari Matahari</dt><dd id="planetDistance"></dd></div>
        <div><dt>Periode Revolusi</dt><dd id="planetOrbit"></dd></div>
        <div><dt>Periode Rotasi</dt><dd id="planetRotation"></dd></div>
      </dl>
      <div class="planet-fact">
        <h3>Fakta Menarik</h3>
        <p id="planetFact"></p>
      </div>
    </aside>

    <div id="fatalError" class="fatal-error is-hidden" role="alert"></div>
  </section>

  <div id="howToModal" class="modal is-hidden" role="dialog" aria-modal="true" aria-labelledby="howToTitle">
    <div class="modal-card">
      <h2 id="howToTitle">Cara Pakai</h2>
      <ol>
        <li>Gunakan kamera belakang untuk hasil tracking paling stabil.</li>
        <li>Buka halaman <a href="/marker-test.html" target="_blank" rel="noreferrer">marker test Hiro</a> lalu siapkan marker di layar/print.</li>
        <li>Jaga jarak sekitar 30-60 cm dan pastikan seluruh kotak marker terlihat.</li>
        <li>Saat model tata surya muncul, tap planet untuk melihat detail.</li>
      </ol>
      <div class="modal-actions">
        <a class="btn btn-secondary" href="/assets/markers/hiro.png" target="_blank" rel="noreferrer">Download Hiro Marker</a>
        <button id="closeHowToBtn" class="btn btn-primary" type="button">Tutup</button>
      </div>
    </div>
  </div>

  <div id="toast" class="toast is-hidden" role="status" aria-live="polite"></div>
</div>
`;
