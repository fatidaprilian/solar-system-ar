export const APP_TEMPLATE = `
<div class="app-shell">
  <div class="space-backdrop" aria-hidden="true"></div>

  <section id="landingPage" class="view view-landing" aria-label="Landing">
    <div class="landing-shell">
      <div class="landing-content">
        <p class="landing-kicker">TUGAS AKHIR VAR</p>
        <h1>AR Tata Surya Explorer</h1>
        <p class="landing-subtitle">Scan Hiro marker, tampilkan tata surya, lalu tap planet untuk membuka detail belajar.</p>
        <div class="landing-actions">
          <button id="startArBtn" class="btn btn-primary" type="button">
            <span class="btn-icon" aria-hidden="true">AR</span>
            Mulai AR
          </button>
          <button id="howToBtn" class="btn btn-secondary" type="button">Cara Pakai</button>
        </div>
        <dl class="landing-signals" aria-label="Ringkasan pengalaman">
          <div>
            <dt>8</dt>
            <dd>Planet interaktif</dd>
          </div>
          <div>
            <dt>Hiro</dt>
            <dd>Marker utama</dd>
          </div>
          <div>
            <dt>GLB</dt>
            <dd>Model lokal</dd>
          </div>
        </dl>
      </div>

      <div class="landing-visual" aria-label="Preview model dan marker AR">
        <div class="mission-status">
          <span class="status-dot" aria-hidden="true"></span>
          Siap scan marker
        </div>
        <div class="orbit-stage" aria-hidden="true">
          <span class="orbit-ring orbit-ring-wide"></span>
          <span class="orbit-ring orbit-ring-tight"></span>
          <model-viewer
            class="landing-planet"
            src="/assets/models/planets/earth.glb"
            alt="Model Bumi"
            auto-rotate
            camera-orbit="0deg 80deg 160%"
            interaction-prompt="none"
            shadow-intensity="0.8"
            environment-image="neutral"
          >
            <div slot="poster" class="landing-model-poster">Memuat model Bumi...</div>
          </model-viewer>
        </div>
        <div class="marker-preview">
          <div>
            <span>Marker</span>
            <strong>Hiro</strong>
          </div>
          <img src="/assets/markers/hiro.png" alt="Marker Hiro untuk AR" />
        </div>
      </div>
    </div>
  </section>

  <section id="scannerPage" class="view view-scanner is-hidden" aria-label="Scanner AR">
    <div id="arMount" class="ar-mount" aria-live="polite"></div>

    <div class="scanner-overlay">
      <div class="hud-top">
        <button id="closeScannerBtn" class="icon-btn icon-btn-close" type="button" aria-label="Tutup Scanner">X</button>
        <div id="markerStatus" class="marker-status">Mencari marker...</div>
        <button id="switchCameraBtn" class="icon-btn icon-btn-camera" type="button" aria-label="Kamera Belakang">Belakang</button>
      </div>

      <div id="scannerHint" class="scanner-hint">Arahkan kamera ke Hiro marker</div>
      <div id="cameraSwitchCover" class="camera-switch-cover is-hidden" role="status" aria-live="polite">
        Menyiapkan kamera...
      </div>
    </div>

    <aside id="planetPanel" class="planet-panel is-hidden" aria-label="Detail planet">
      <div class="panel-head">
        <h2 id="planetName">Planet</h2>
        <button id="closePlanetBtn" class="text-btn" type="button">Kembali ke Tata Surya</button>
      </div>
      <p id="planetCategory" class="planet-category"></p>
      <div id="planetPreview" class="planet-preview" aria-hidden="true">
        <div class="planet-preview-status">Memuat model planet...</div>
      </div>
      <p id="planetDescription" class="planet-description"></p>
      <dl class="planet-meta">
        <div><dt>Diameter</dt><dd id="planetDiameter"></dd></div>
        <div><dt>Jarak dari Matahari</dt><dd id="planetDistance"></dd></div>
        <div><dt>Periode Revolusi</dt><dd id="planetOrbit"></dd></div>
        <div><dt>Periode Rotasi</dt><dd id="planetRotation"></dd></div>
      </dl>
      <section class="planet-learning" aria-label="Profil edukasi planet">
        <h3>Profil Planet</h3>
        <dl class="planet-learning-grid">
          <div><dt>Bulan</dt><dd id="planetMoons"></dd></div>
          <div><dt>Atmosfer</dt><dd id="planetAtmosphere"></dd></div>
          <div><dt>Suhu</dt><dd id="planetTemperature"></dd></div>
          <div><dt>Gravitasi</dt><dd id="planetGravity"></dd></div>
          <div><dt>Komposisi</dt><dd id="planetComposition"></dd></div>
          <div><dt>Ciri Utama</dt><dd id="planetFeature"></dd></div>
        </dl>
      </section>
      <section class="planet-note" aria-label="Catatan eksplorasi planet">
        <h3>Eksplorasi</h3>
        <p id="planetExploration"></p>
      </section>
      <div class="planet-fact">
        <h3>Fakta Menarik</h3>
        <p id="planetFact"></p>
      </div>
      <section class="planet-quiz" aria-label="Pertanyaan cepat planet">
        <h3>Pertanyaan Cepat</h3>
        <p id="planetQuestion" class="planet-question"></p>
        <div id="planetQuizOptions" class="planet-quiz-options"></div>
        <p id="planetQuizFeedback" class="planet-quiz-feedback" role="status" aria-live="polite"></p>
      </section>
      <div class="planet-nav-actions">
        <button id="prevPlanetBtn" class="btn btn-secondary nav-btn" type="button">Sebelumnya</button>
        <button id="nextPlanetBtn" class="btn btn-primary nav-btn" type="button">Selanjutnya</button>
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
