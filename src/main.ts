import { createArSceneMarkup } from "./ar/scene";
import { PLANET_BY_ID, PLANETS, type PlanetData, type PlanetId } from "./data/planets";
import "./styles/main.css";
import { APP_TEMPLATE } from "./ui/templates";

type RequiredElements = {
  app: HTMLElement;
  landingPage: HTMLElement;
  scannerPage: HTMLElement;
  arMount: HTMLElement;
  startArBtn: HTMLButtonElement;
  howToBtn: HTMLButtonElement;
  closeScannerBtn: HTMLButtonElement;
  switchCameraBtn: HTMLButtonElement;
  markerStatus: HTMLElement;
  scannerHint: HTMLElement;
  planetPanel: HTMLElement;
  planetPreview: HTMLElement;
  planetName: HTMLElement;
  planetDescription: HTMLElement;
  planetDiameter: HTMLElement;
  planetDistance: HTMLElement;
  planetOrbit: HTMLElement;
  planetRotation: HTMLElement;
  planetFact: HTMLElement;
  closePlanetBtn: HTMLButtonElement;
  howToModal: HTMLElement;
  closeHowToBtn: HTMLButtonElement;
  toast: HTMLElement;
  fatalError: HTMLElement;
};

let sceneEl: HTMLElement | null = null;
let markerEl: HTMLElement | null = null;
let solarRootEl: HTMLElement | null = null;
let solarSystemEl: HTMLElement | null = null;
let solarFallbackEl: HTMLElement | null = null;
let planetDetailRootEl: HTMLElement | null = null;
let arCameraEl: HTMLElement | null = null;
let hitZoneEls: HTMLElement[] = [];
let isSolarSystemModelReady = false;

let currentPlanet: PlanetData | null = null;
let isMarkerDetected = false;
let isTransitioning = false;
let pendingSceneBoot = false;
let toastTimer = 0;

type CameraFacingMode = "environment" | "user";

let currentFacingMode: CameraFacingMode = "environment";
let manualFacingModeApplied = false;
let activeScannerSession = 0;

const cleanupListeners: Array<() => void> = [];
let delayedArtifactCleanupTimers: number[] = [];
let landingResetTimers: number[] = [];
let viewportListenersBound = false;
let planetPreviewRenderToken = 0;

const MIN_VIEWPORT_HEIGHT = 320;
const MAX_TOUCH_VIEWPORT_HEIGHT = 1400;
const MAX_TOUCH_VIEWPORT_ASPECT = 2.35;
const SOLAR_OVERVIEW_TARGET_SIZE = 2.4;
const PANEL_PREVIEW_TARGET_SIZE = 1.26;
const PANEL_PREVIEW_LARGE_TARGET_SIZE = 1.44;
const MOBILE_CLOSE_RELOAD_DELAY_MS = 180;
const SOLAR_MODEL_VERTICAL_OFFSET = 0.12;
const SOLAR_MODEL_CLUTTER_NAME_PARTS = ["asteroid", "asteroidi", "ceres", "pluto", "moon"];

function getSolarScaleMultiplier(): number {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (!isTouch) {
    return 1;
  }

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth ?? 0;
  if (viewportWidth <= 360) {
    return 3.75;
  }
  if (viewportWidth <= 420) {
    return 3.55;
  }
  if (viewportWidth <= 520) {
    return 3.2;
  }
  if (viewportWidth <= 768) {
    return 2.6;
  }
  return 1;
}

function getSolarOverviewTargetSize(): number {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (!isTouch) {
    return SOLAR_OVERVIEW_TARGET_SIZE;
  }

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth ?? 0;
  if (viewportWidth <= 360) {
    return 4.25;
  }
  if (viewportWidth <= 420) {
    return 4.05;
  }
  if (viewportWidth <= 520) {
    return 3.7;
  }
  if (viewportWidth <= 768) {
    return 3.15;
  }
  return SOLAR_OVERVIEW_TARGET_SIZE;
}

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}

function getStableViewportHeight(): number {
  const visualHeight = window.visualViewport?.height ?? 0;
  const visualWidth = window.visualViewport?.width ?? 0;
  const layoutHeight = window.innerHeight || 0;
  const layoutWidth = window.innerWidth || 0;
  const fallbackHeight = window.screen?.height || MIN_VIEWPORT_HEIGHT;
  const fallbackWidth = window.screen?.width || layoutWidth || 1;
  const rawHeight = visualHeight > 0 ? visualHeight : layoutHeight || fallbackHeight;
  const viewportWidth = visualWidth > 0 ? visualWidth : layoutWidth || fallbackWidth;
  const isTouchViewport = window.matchMedia("(pointer: coarse)").matches;
  const aspectHeightLimit = Math.max(MIN_VIEWPORT_HEIGHT, viewportWidth * MAX_TOUCH_VIEWPORT_ASPECT);
  const maxHeight = isTouchViewport ? Math.min(MAX_TOUCH_VIEWPORT_HEIGHT, aspectHeightLimit) : rawHeight;

  return Math.round(Math.min(Math.max(rawHeight, MIN_VIEWPORT_HEIGHT), maxHeight));
}

function setupVhVariable(): void {
  const appHeight = getStableViewportHeight();
  const vh = appHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
  document.documentElement.style.setProperty("--app-height", `${appHeight}px`);

  if (isScannerViewportActive()) {
    syncArViewportLayout();
  }
}

function applyLandingViewportStyles(): void {
  ui.app.style.width = "100vw";
  ui.app.style.height = "var(--app-height, 100svh)";
  ui.app.style.minHeight = "var(--app-height, 100svh)";
  ui.landingPage.style.width = "100vw";
  ui.landingPage.style.height = "var(--app-height, 100svh)";
  ui.landingPage.style.minHeight = "var(--app-height, 100svh)";
}

function cancelLandingResetTimers(): void {
  landingResetTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
  });
  landingResetTimers = [];
}

function buildUi(): RequiredElements {
  const app = getRequiredElement<HTMLElement>("#app");
  app.innerHTML = APP_TEMPLATE;

  return {
    app,
    landingPage: getRequiredElement<HTMLElement>("#landingPage"),
    scannerPage: getRequiredElement<HTMLElement>("#scannerPage"),
    arMount: getRequiredElement<HTMLElement>("#arMount"),
    startArBtn: getRequiredElement<HTMLButtonElement>("#startArBtn"),
    howToBtn: getRequiredElement<HTMLButtonElement>("#howToBtn"),
    closeScannerBtn: getRequiredElement<HTMLButtonElement>("#closeScannerBtn"),
    switchCameraBtn: getRequiredElement<HTMLButtonElement>("#switchCameraBtn"),
    markerStatus: getRequiredElement<HTMLElement>("#markerStatus"),
    scannerHint: getRequiredElement<HTMLElement>("#scannerHint"),
    planetPanel: getRequiredElement<HTMLElement>("#planetPanel"),
    planetPreview: getRequiredElement<HTMLElement>("#planetPreview"),
    planetName: getRequiredElement<HTMLElement>("#planetName"),
    planetDescription: getRequiredElement<HTMLElement>("#planetDescription"),
    planetDiameter: getRequiredElement<HTMLElement>("#planetDiameter"),
    planetDistance: getRequiredElement<HTMLElement>("#planetDistance"),
    planetOrbit: getRequiredElement<HTMLElement>("#planetOrbit"),
    planetRotation: getRequiredElement<HTMLElement>("#planetRotation"),
    planetFact: getRequiredElement<HTMLElement>("#planetFact"),
    closePlanetBtn: getRequiredElement<HTMLButtonElement>("#closePlanetBtn"),
    howToModal: getRequiredElement<HTMLElement>("#howToModal"),
    closeHowToBtn: getRequiredElement<HTMLButtonElement>("#closeHowToBtn"),
    toast: getRequiredElement<HTMLElement>("#toast"),
    fatalError: getRequiredElement<HTMLElement>("#fatalError")
  };
}

let ui = buildUi();

function setMarkerStatus(text: string, detected: boolean): void {
  ui.markerStatus.textContent = text;
  ui.markerStatus.classList.toggle("is-detected", detected);
  ui.scannerHint.textContent = detected
    ? "Marker terdeteksi. Tap planet untuk melihat detail."
    : "Arahkan kamera ke Hiro marker";
}

function showToast(message: string, tone: "info" | "warning" | "error" = "info"): void {
  ui.toast.textContent = message;
  ui.toast.classList.remove("is-hidden", "tone-info", "tone-warning", "tone-error");
  ui.toast.classList.add(`tone-${tone}`);

  if (toastTimer) {
    window.clearTimeout(toastTimer);
  }

  toastTimer = window.setTimeout(() => {
    ui.toast.classList.add("is-hidden");
  }, 2800);
}

function showFatalError(message: string): void {
  ui.fatalError.textContent = message;
  ui.fatalError.classList.remove("is-hidden");
}

function clearFatalError(): void {
  ui.fatalError.classList.add("is-hidden");
  ui.fatalError.textContent = "";
}

function showLanding(): void {
  document.body.classList.remove("is-ar-active");
  ui.landingPage.classList.remove("is-hidden");
  ui.scannerPage.classList.add("is-hidden");
  ui.howToModal.classList.add("is-hidden");
  enableLandingInteraction();
  resetLandingViewport();
}

function showScanner(): void {
  cancelDelayedArtifactCleanups();
  cancelLandingResetTimers();
  document.body.classList.add("is-ar-active");
  ui.landingPage.classList.add("is-hidden");
  ui.scannerPage.classList.remove("is-hidden");
  enableScannerInteraction();
}

function openHowToModal(): void {
  ui.howToModal.classList.remove("is-hidden");
}

function closeHowToModal(): void {
  ui.howToModal.classList.add("is-hidden");
}

function getPanelPreviewTargetSize(planet: PlanetData): number {
  const baseSize = planet.id === "jupiter" || planet.id === "saturn"
    ? PANEL_PREVIEW_LARGE_TARGET_SIZE
    : PANEL_PREVIEW_TARGET_SIZE;

  return baseSize * planet.previewScale;
}

function isTouchDevice(): boolean {
  return window.matchMedia("(pointer: coarse)").matches;
}

function clearPlanetPanelPreview(): void {
  planetPreviewRenderToken += 1;
  const previewScene = ui.planetPreview.querySelector<HTMLElement & { pause?: () => void }>("a-scene");
  previewScene?.pause?.();
  ui.planetPreview.innerHTML = "";
  delete ui.planetPreview.dataset.state;
  delete ui.planetPreview.dataset.planet;
}

type PreviewRendererLike = {
  setPixelRatio?: (pixelRatio: number) => void;
  setSize?: (width: number, height: number, updateStyle?: boolean) => void;
  domElement?: HTMLCanvasElement;
};

type PreviewSceneLike = HTMLElement & {
  renderer?: PreviewRendererLike;
  resize?: () => void;
};

function syncPlanetPreviewCanvas(previewScene: PreviewSceneLike | null): void {
  if (!previewScene) {
    return;
  }

  const rect = previewScene.getBoundingClientRect();
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  if (width <= 0 || height <= 0) {
    return;
  }

  const pixelRatio = Math.min(Math.max(window.devicePixelRatio || 1, 1), 2.5);
  previewScene.renderer?.setPixelRatio?.(pixelRatio);
  previewScene.renderer?.setSize?.(width, height, false);
  previewScene.resize?.();

  const canvas = previewScene.renderer?.domElement ?? previewScene.querySelector<HTMLCanvasElement>("canvas");
  if (!canvas) {
    return;
  }

  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.background = "transparent";
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
}

function setPlanetPreviewError(status: HTMLElement | null, planetName: string, message?: string): void {
  ui.planetPreview.dataset.state = "error";
  if (status) {
    status.textContent = message ?? `Model ${planetName} belum bisa ditampilkan.`;
  }
}

function schedulePlanetPreviewReveal(
  planet: PlanetData,
  model: HTMLElement,
  status: HTMLElement | null,
  previewScene: PreviewSceneLike | null,
  renderToken: number,
  attempt = 0
): void {
  if (renderToken !== planetPreviewRenderToken || !ui.planetPreview.contains(model)) {
    return;
  }

  window.requestAnimationFrame(() => {
    if (renderToken !== planetPreviewRenderToken || !ui.planetPreview.contains(model)) {
      return;
    }

    syncPlanetPreviewCanvas(previewScene);
    const didFit = fitModelToMarkerSize(model, getPanelPreviewTargetSize(planet), {
      center: true,
      centerY: true
    });

    if (didFit) {
      ui.planetPreview.dataset.state = "ready";
      model.setAttribute("visible", "true");
      window.requestAnimationFrame(() => syncPlanetPreviewCanvas(previewScene));
      window.setTimeout(() => syncPlanetPreviewCanvas(previewScene), 180);
      return;
    }

    if (attempt < 14) {
      window.setTimeout(() => {
        schedulePlanetPreviewReveal(planet, model, status, previewScene, renderToken, attempt + 1);
      }, 120);
      return;
    }

    setPlanetPreviewError(status, planet.name);
    model.setAttribute("visible", "false");
  });
}

function renderPlanetPanelPreview(planet: PlanetData): void {
  clearPlanetPanelPreview();

  const assetId = `panel-${planet.id}-model`;
  const renderToken = planetPreviewRenderToken;
  ui.planetPreview.dataset.planet = planet.id;
  ui.planetPreview.dataset.state = "loading";
  ui.planetPreview.innerHTML = `
    <div class="planet-preview-status">Memuat model ${planet.name}...</div>
    <a-scene
      class="planet-preview-scene"
      embedded
      renderer="alpha: true; antialias: true; logarithmicDepthBuffer: true; precision: high"
      vr-mode-ui="enabled: false"
      loading-screen="enabled: false"
      device-orientation-permission-ui="enabled: false"
    >
      <a-assets timeout="15000">
        <a-asset-item id="${assetId}" src="${planet.modelPath}"></a-asset-item>
      </a-assets>
      <a-entity
        id="planetPreviewModel"
        gltf-model="#${assetId}"
        visible="false"
        position="0 0 0"
        rotation="0 -22 0"
        scale="${planet.detailScale}"
      ></a-entity>
      <a-light type="ambient" intensity="1.65"></a-light>
      <a-light type="directional" intensity="1.8" position="1.5 1.5 2"></a-light>
      <a-camera
        position="0 0 2.65"
        look-controls="enabled: false"
        wasd-controls="enabled: false"
      ></a-camera>
    </a-scene>
  `;

  const model = ui.planetPreview.querySelector<HTMLElement>("#planetPreviewModel");
  const status = ui.planetPreview.querySelector<HTMLElement>(".planet-preview-status");
  const previewScene = ui.planetPreview.querySelector<PreviewSceneLike>(".planet-preview-scene");
  if (!model) {
    setPlanetPreviewError(null, planet.name);
    ui.planetPreview.innerHTML = `<div class="planet-preview-status">Model ${planet.name} belum bisa ditampilkan.</div>`;
    return;
  }

  const revealModel = () => schedulePlanetPreviewReveal(planet, model, status, previewScene, renderToken);

  const showPreviewError = () => {
    setPlanetPreviewError(status, planet.name, `Model ${planet.name} gagal dimuat dari file GLB.`);
    model.setAttribute("visible", "false");
  };

  const syncPreview = () => syncPlanetPreviewCanvas(previewScene);
  previewScene?.addEventListener("loaded", syncPreview, { once: true });
  previewScene?.addEventListener("renderstart", syncPreview, { once: true });
  window.requestAnimationFrame(syncPreview);
  window.requestAnimationFrame(revealModel);
  window.setTimeout(revealModel, 240);

  model.addEventListener("model-loaded", revealModel, { once: true });
  model.addEventListener("model-error", showPreviewError, { once: true });
}

function fillPlanetPanel(planet: PlanetData): void {
  clearPlanetPanelPreview();
  ui.planetPanel.style.setProperty("--planet-theme", planet.themeColor);
  ui.planetPanel.style.setProperty("--planet-preview-scale", `${planet.previewScale}`);
  ui.planetPanel.dataset.planet = planet.id;
  ui.planetName.textContent = planet.name;
  ui.planetDescription.textContent = planet.description;
  ui.planetDiameter.textContent = planet.diameter;
  ui.planetDistance.textContent = planet.distanceFromSun;
  ui.planetOrbit.textContent = planet.orbitalPeriod;
  ui.planetRotation.textContent = planet.rotationPeriod;
  ui.planetFact.textContent = planet.funFact;
  ui.planetPanel.classList.remove("is-hidden");
  renderPlanetPanelPreview(planet);
}

function hidePlanetPanel(): void {
  clearPlanetPanelPreview();
  ui.planetPanel.classList.add("is-hidden");
  ui.planetPanel.style.setProperty("--planet-preview-scale", "1");
  delete ui.planetPanel.dataset.planet;
}

function stopVideoStreams(root: ParentNode): void {
  const videos = root.querySelectorAll<HTMLVideoElement>("video");
  videos.forEach((videoEl) => {
    const stream = videoEl.srcObject;
    if (stream instanceof MediaStream) {
      stopMediaStream(stream);
      videoEl.srcObject = null;
    }
  });
}

function cleanupAFrameArtifacts(): void {
  document.querySelectorAll<HTMLVideoElement>("video").forEach((video) => {
    const stream = video.srcObject;
    if (stream instanceof MediaStream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    video.srcObject = null;
    video.remove();
  });

  document.querySelectorAll<HTMLCanvasElement>("canvas").forEach((canvas) => {
    if (
      ui.arMount.contains(canvas) ||
      canvas.classList.contains("a-canvas") ||
      canvas.hasAttribute("data-aframe-canvas")
    ) {
      canvas.remove();
    }
  });

  document.querySelectorAll<HTMLElement>(".a-enter-vr, .a-enter-ar, .arjs-loader, .a-orientation-modal").forEach((el) => {
    el.remove();
  });

  document.querySelectorAll<HTMLElement>("a-scene").forEach((scene) => {
    scene.remove();
  });

  document.documentElement.classList.remove("a-html");
  document.body.classList.remove("a-body", "aframe-inspector-opened");
  document.documentElement.classList.remove("a-fullscreen");
  document.body.classList.remove("is-ar-active");
  clearArDocumentSideEffects();
}

function clearArDocumentSideEffects(): void {
  document.documentElement.classList.remove("a-html", "a-fullscreen");
  document.body.classList.remove(
    "is-ar-active",
    "a-body",
    "aframe-inspector-opened",
    "a-grab-cursor",
    "a-mouse-cursor-hover",
    "a-pointer-lock"
  );

  const layoutProps = [
    "bottom",
    "display",
    "height",
    "left",
    "margin",
    "min-height",
    "overflow",
    "padding",
    "position",
    "right",
    "top",
    "touch-action",
    "transform",
    "visibility",
    "width"
  ];

  layoutProps.forEach((prop) => {
    document.documentElement.style.removeProperty(prop);
    document.body.style.removeProperty(prop);
  });

  document.body.removeAttribute("data-aframe-inspector");
}

function enableLandingInteraction(): void {
  ui.landingPage.style.pointerEvents = "auto";
  ui.landingPage.style.visibility = "visible";
  ui.landingPage.style.zIndex = "20";
  ui.scannerPage.style.pointerEvents = "none";
  ui.scannerPage.style.visibility = "hidden";
  ui.scannerPage.style.zIndex = "0";
  ui.arMount.style.pointerEvents = "none";
}

function enableScannerInteraction(): void {
  ui.landingPage.style.pointerEvents = "none";
  ui.landingPage.style.visibility = "hidden";
  ui.landingPage.style.removeProperty("z-index");
  ui.scannerPage.style.pointerEvents = "auto";
  ui.scannerPage.style.visibility = "visible";
  ui.scannerPage.style.removeProperty("z-index");
  ui.arMount.style.pointerEvents = "auto";
}

function resetLandingViewport(): void {
  setupVhVariable();
  applyLandingViewportStyles();
  window.scrollTo(0, 0);

  window.requestAnimationFrame(() => {
    if (isScannerViewportActive()) {
      return;
    }
    setupVhVariable();
    applyLandingViewportStyles();
    window.scrollTo(0, 0);
  });

  cancelLandingResetTimers();
  landingResetTimers = [140, 360, 780, 1200].map((delay) => {
    return window.setTimeout(() => {
      if (isScannerViewportActive()) {
        return;
      }
      setupVhVariable();
      applyLandingViewportStyles();
      window.scrollTo(0, 0);
    }, delay);
  });
}

function restoreLandingShellLayout(): void {
  ui.landingPage.classList.remove("is-hidden");
  ui.scannerPage.classList.add("is-hidden");
  clearArDocumentSideEffects();
  enableLandingInteraction();
  resetLandingViewport();
}

function remountCleanLandingShell(): void {
  cancelLandingResetTimers();
  clearArDocumentSideEffects();
  ui = buildUi();
  bindStaticUiEvents();
  showLanding();
  setMarkerStatus("Mencari marker...", false);
  clearFatalError();
  hidePlanetPanel();
  ui.toast.classList.add("is-hidden");
}

function scheduleMobileLandingReload(): void {
  if (!isTouchDevice()) {
    return;
  }

  window.setTimeout(() => {
    if (document.body.classList.contains("is-ar-active")) {
      return;
    }

    window.location.reload();
  }, MOBILE_CLOSE_RELOAD_DELAY_MS);
}

function cancelDelayedArtifactCleanups(): void {
  delayedArtifactCleanupTimers.forEach((timerId) => {
    window.clearTimeout(timerId);
  });
  delayedArtifactCleanupTimers = [];
}

function isScannerViewportActive(): boolean {
  return document.body.classList.contains("is-ar-active") && !ui.scannerPage.classList.contains("is-hidden");
}

function runPostCloseArtifactCleanup(sessionId: number): void {
  if (sessionId !== activeScannerSession || isScannerViewportActive()) {
    return;
  }

  ui.arMount.innerHTML = "";
  cleanupAFrameArtifacts();
  clearSceneReferences();
  restoreLandingShellLayout();
}

function schedulePostCloseArtifactCleanup(sessionId: number): void {
  cancelDelayedArtifactCleanups();

  window.requestAnimationFrame(() => runPostCloseArtifactCleanup(sessionId));
  delayedArtifactCleanupTimers = [80, 250, 600, 1200, 2000].map((delay) => {
    return window.setTimeout(() => runPostCloseArtifactCleanup(sessionId), delay);
  });
}

function prepareScannerForFreshBoot(): void {
  cancelDelayedArtifactCleanups();
  killPlanetTransition();
  runCleanupListeners();
  stopVideoStreams(document);
  ui.arMount.innerHTML = "";
  cleanupAFrameArtifacts();
  clearSceneReferences();
}

function stopMediaStream(stream: MediaStream | null): void {
  if (!stream) {
    return;
  }

  stream.getTracks().forEach((track) => track.stop());
}

function getFacingModeLabel(mode: CameraFacingMode): string {
  return mode === "environment" ? "Belakang" : "Depan";
}

type ZoomCapabilityRange = {
  min?: number;
  max?: number;
};

const SUN_MODEL_SCALE = 0.32;

type ScaleLike = {
  set: (x: number, y: number, z: number) => void;
  x?: number;
  y?: number;
  z?: number;
};

type Object3DLike = {
  name?: string;
  visible?: boolean;
  position?: ScaleLike;
  scale?: ScaleLike;
  traverse?: (callback: (object: Object3DLike) => void) => void;
  updateMatrixWorld?: (force?: boolean) => void;
};

type Vector3Like = {
  x: number;
  y: number;
  z: number;
};

type Box3Like = {
  setFromObject: (object: unknown) => Box3Like;
  getSize: (target: Vector3Like) => Vector3Like;
  getCenter: (target: Vector3Like) => Vector3Like;
};

type ThreeSizingLike = {
  Box3: new () => Box3Like;
  Vector3: new () => Vector3Like;
};

type FitModelOptions = {
  center?: boolean;
  centerY?: boolean;
  verticalOffset?: number;
};

function shouldHideSolarSystemNode(name: string | undefined): boolean {
  if (!name) {
    return false;
  }

  const normalizedName = name.toLowerCase();
  return SOLAR_MODEL_CLUTTER_NAME_PARTS.some((part) => normalizedName.includes(part));
}

function tuneSolarSystemModelScale(): void {
  const object3D = (solarSystemEl as HTMLElement & { object3D?: Object3DLike } | null)?.object3D;
  if (!object3D?.traverse) {
    return;
  }

  object3D.traverse((object) => {
    if (shouldHideSolarSystemNode(object.name)) {
      object.visible = false;
      object.scale?.set(0.0001, 0.0001, 0.0001);
      return;
    }

    if (object.name?.toLowerCase().includes("sun")) {
      object.scale?.set(SUN_MODEL_SCALE, SUN_MODEL_SCALE, SUN_MODEL_SCALE);
      console.log("[MODEL] sun node scaled", object.name, SUN_MODEL_SCALE);
    }
  });
}

function fitModelToMarkerSize(entity: HTMLElement, targetSize: number, options: FitModelOptions = {}): boolean {
  const maybeWindow = window as Window & { THREE?: ThreeSizingLike };
  const object3D = (entity as HTMLElement & { object3D?: Object3DLike }).object3D;
  const currentScale = object3D?.scale;

  if (!maybeWindow.THREE || !object3D || !currentScale) {
    return false;
  }

  object3D.updateMatrixWorld?.(true);

  const box = new maybeWindow.THREE.Box3().setFromObject(object3D);
  const size = box.getSize(new maybeWindow.THREE.Vector3());
  const maxAxis = Math.max(size.x, size.y, size.z);

  if (!Number.isFinite(maxAxis) || maxAxis <= 0) {
    return false;
  }

  const correction = targetSize / maxAxis;
  const nextX = (currentScale.x ?? 1) * correction;
  const nextY = (currentScale.y ?? 1) * correction;
  const nextZ = (currentScale.z ?? 1) * correction;
  currentScale.set(nextX, nextY, nextZ);

  if (options.center && object3D.position) {
    object3D.updateMatrixWorld?.(true);

    const centeredBox = new maybeWindow.THREE.Box3().setFromObject(object3D);
    const center = centeredBox.getCenter(new maybeWindow.THREE.Vector3());
    const currentX = object3D.position.x ?? 0;
    const currentY = object3D.position.y ?? 0;
    const currentZ = object3D.position.z ?? 0;
    const nextPositionX = currentX - center.x;
    const nextPositionY = options.centerY
      ? currentY - center.y + (options.verticalOffset ?? 0)
      : currentY + (options.verticalOffset ?? 0);
    const nextPositionZ = currentZ - center.z;

    object3D.position.set(nextPositionX, nextPositionY, nextPositionZ);
  }

  return true;
}

function normalizeArVideoLayer(videoEl: HTMLVideoElement): HTMLVideoElement {
  if (!videoEl.id) {
    videoEl.id = "arjs-video";
  }
  videoEl.classList.add("arjs-video");
  videoEl.setAttribute("playsinline", "true");
  videoEl.setAttribute("autoplay", "true");
  videoEl.muted = true;

  if (videoEl.parentElement !== ui.arMount) {
    ui.arMount.appendChild(videoEl);
  }

  const style = videoEl.style;
  style.position = "fixed";
  style.inset = "0";
  style.top = "0px";
  style.left = "0px";
  style.width = "100vw";
  style.height = "var(--app-height, 100svh)";
  style.minHeight = "var(--app-height, 100svh)";
  style.objectFit = "contain";
  style.objectPosition = "center center";
  style.margin = "0";
  style.marginTop = "0px";
  style.marginLeft = "0px";
  style.transform = "none";
  style.display = "block";
  style.opacity = "1";
  style.background = "#000";
  style.zIndex = "0";

  return videoEl;
}

function findArVideoElement(): HTMLVideoElement | null {
  const inMount = ui.arMount.querySelector<HTMLVideoElement>("video#arjs-video, video.arjs-video, video");
  if (inMount) {
    return inMount;
  }

  return document.querySelector<HTMLVideoElement>("video#arjs-video, video.arjs-video");
}

function syncArViewportLayout(): void {
  if (!isScannerViewportActive()) {
    return;
  }

  const targetHeight = "var(--app-height, 100svh)";
  const targetMinHeight = targetHeight;

  const scene = ui.arMount.querySelector<HTMLElement>("a-scene");
  if (scene) {
    scene.style.position = "fixed";
    scene.style.inset = "0";
    scene.style.width = "100vw";
    scene.style.height = targetHeight;
    scene.style.minHeight = targetMinHeight;
  }

  ui.arMount.querySelectorAll<HTMLCanvasElement>("canvas.a-canvas, canvas[data-aframe-canvas]").forEach((canvas) => {
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100vw";
    canvas.style.height = targetHeight;
    canvas.style.minHeight = targetMinHeight;
  });

  const videoEl = findArVideoElement();
  if (videoEl) {
    normalizeArVideoLayer(videoEl);
  }
}

async function waitForArVideoElement(timeoutMs = 3500): Promise<HTMLVideoElement | null> {
  const startedAt = window.performance.now();

  while (window.performance.now() - startedAt < timeoutMs) {
    const videoEl = findArVideoElement();
    if (videoEl) {
      return normalizeArVideoLayer(videoEl);
    }

    await new Promise((resolve) => {
      window.setTimeout(resolve, 80);
    });
  }

  return null;
}

async function applyFacingModeStream(): Promise<boolean> {
  if (!navigator.mediaDevices) {
    return false;
  }

  const videoEl = await waitForArVideoElement();
  if (!videoEl) {
    return false;
  }

  if (!(videoEl.srcObject instanceof MediaStream)) {
    return false;
  }

  const [videoTrack] = videoEl.srcObject.getVideoTracks();
  if (!videoTrack) {
    return false;
  }

  let facingModeApplied = false;

  try {
    if (typeof videoTrack.applyConstraints === "function") {
      await videoTrack.applyConstraints({
        facingMode: { ideal: currentFacingMode }
      });
    }

    const settingsFacingMode = videoTrack.getSettings?.().facingMode;
    facingModeApplied = !settingsFacingMode || settingsFacingMode === currentFacingMode;
  } catch (error) {
    console.error("[CAMERA] facingMode constraint failed", error);
  }

  try {
    const capabilities = typeof videoTrack.getCapabilities === "function"
      ? (videoTrack.getCapabilities() as { zoom?: number | ZoomCapabilityRange })
      : undefined;
    const zoomCapability = capabilities?.zoom;
    const zoomMin = typeof zoomCapability === "number" ? zoomCapability : zoomCapability?.min;

    if (typeof zoomMin === "number" && Number.isFinite(zoomMin) && typeof videoTrack.applyConstraints === "function") {
      const advancedZoomConstraint = [{ zoom: zoomMin }] as unknown as MediaTrackConstraintSet[];
      await videoTrack.applyConstraints({
        advanced: advancedZoomConstraint
      });
    }
  } catch (error) {
    console.warn("[CAMERA] default zoom reset skipped", error);
  }

  syncArViewportLayout();
  window.requestAnimationFrame(() => {
    setupVhVariable();
    syncArViewportLayout();
    window.dispatchEvent(new Event("resize"));
  });

  return facingModeApplied;
}

function bindArVideoLoadedEvent(): void {
  const handler = (event: Event) => {
    if (!isScannerViewportActive()) {
      cleanupAFrameArtifacts();
      return;
    }

    const customEvent = event as CustomEvent<{ component?: EventTarget | null }>;
    const fromEvent = customEvent.detail?.component;

    if (fromEvent instanceof HTMLVideoElement) {
      normalizeArVideoLayer(fromEvent);
      return;
    }

    const fallbackVideo = findArVideoElement();
    if (fallbackVideo) {
      normalizeArVideoLayer(fallbackVideo);
    }

    syncArViewportLayout();
  };

  window.addEventListener("arjs-video-loaded", handler as EventListener);
  cleanupListeners.push(() => window.removeEventListener("arjs-video-loaded", handler as EventListener));
}

function clearSceneReferences(): void {
  sceneEl = null;
  markerEl = null;
  solarRootEl = null;
  solarSystemEl = null;
  solarFallbackEl = null;
  isSolarSystemModelReady = false;
  planetDetailRootEl = null;
  arCameraEl = null;
  hitZoneEls = [];
}

function runCleanupListeners(): void {
  while (cleanupListeners.length > 0) {
    const dispose = cleanupListeners.pop();
    if (dispose) {
      dispose();
    }
  }
}

function killPlanetTransition(): void {
  isTransitioning = false;
}

function teardownScene(): void {
  killPlanetTransition();
  runCleanupListeners();
  stopVideoStreams(document);

  const activeScene = sceneEl as (HTMLElement & { pause?: () => void }) | null;
  activeScene?.pause?.();
  activeScene?.remove();

  manualFacingModeApplied = false;

  ui.arMount.innerHTML = "";
  cleanupAFrameArtifacts();

  clearSceneReferences();
  isMarkerDetected = false;
  isTransitioning = false;
  currentPlanet = null;
  hidePlanetPanel();
  clearFatalError();
}

function isScannerSessionActive(sessionId: number): boolean {
  return sessionId === activeScannerSession && !ui.scannerPage.classList.contains("is-hidden");
}

function isSessionCurrent(sessionId: number): boolean {
  return sessionId === activeScannerSession;
}

function resetSolarTransforms(): void {
  if (!solarRootEl) {
    return;
  }
  solarRootEl.setAttribute("visible", "true");
  const rootObject = (solarRootEl as HTMLElement & { object3D?: { scale: { set: (x: number, y: number, z: number) => void } } }).object3D;
  rootObject?.scale.set(1, 1, 1);

  if (planetDetailRootEl) {
    planetDetailRootEl.setAttribute("visible", "false");
    const detailObject = (planetDetailRootEl as HTMLElement & { object3D?: { scale: { set: (x: number, y: number, z: number) => void } } }).object3D;
    detailObject?.scale.set(1, 1, 1);
    planetDetailRootEl.innerHTML = "";
  }

  if (solarSystemEl) {
    solarSystemEl.setAttribute("visible", isSolarSystemModelReady ? "true" : "false");
  }

  if (solarFallbackEl) {
    solarFallbackEl.setAttribute("visible", isSolarSystemModelReady ? "false" : "true");
  }
}

function setSolarOverviewVisible(isVisible: boolean): void {
  const visibleValue = isVisible ? "true" : "false";

  if (solarRootEl) {
    solarRootEl.setAttribute("visible", visibleValue);
    const rootObject = (solarRootEl as HTMLElement & { object3D?: { scale?: ScaleLike } }).object3D;
    rootObject?.scale?.set(1, 1, 1);
  }

  if (solarSystemEl) {
    solarSystemEl.setAttribute("visible", isSolarSystemModelReady && isVisible ? "true" : "false");
  }

  if (solarFallbackEl) {
    solarFallbackEl.setAttribute("visible", !isSolarSystemModelReady && isVisible ? "true" : "false");
  }

  if (planetDetailRootEl) {
    planetDetailRootEl.setAttribute("visible", "false");
    const detailObject = (planetDetailRootEl as HTMLElement & { object3D?: { scale?: ScaleLike } }).object3D;
    detailObject?.scale?.set(1, 1, 1);
    planetDetailRootEl.innerHTML = "";
  }
}

function openPlanetDetail(planetId: PlanetId): void {
  if (!solarRootEl || isTransitioning) {
    return;
  }

  const planet = PLANET_BY_ID[planetId];
  if (!planet) {
    return;
  }

  killPlanetTransition();
  isTransitioning = false;
  currentPlanet = planet;
  setSolarOverviewVisible(false);
  fillPlanetPanel(planet);
}

function closePlanetDetail(): void {
  if (!solarRootEl || !currentPlanet) {
    return;
  }

  killPlanetTransition();
  isTransitioning = false;
  hidePlanetPanel();
  currentPlanet = null;
  setSolarOverviewVisible(true);
}

function bindHitZoneEvents(): void {
  hitZoneEls.forEach((hitZone) => {
    const planetId = hitZone.dataset.planet as PlanetId | undefined;
    if (!planetId) {
      return;
    }

    const object3D = (hitZone as HTMLElement & { object3D?: { userData?: Record<string, unknown> } }).object3D;
    if (object3D) {
      object3D.userData = {
        ...(object3D.userData ?? {}),
        planetId
      };
    }

    const handler = () => {
      if (!isMarkerDetected || currentPlanet || isTransitioning) {
        return;
      }
      openPlanetDetail(planetId);
    };

    hitZone.addEventListener("click", handler);
    cleanupListeners.push(() => hitZone.removeEventListener("click", handler));
  });
}

function pickPlanetFromCenterRay(): PlanetId | null {
  if (!arCameraEl || hitZoneEls.length === 0) {
    return null;
  }

  const maybeWindow = window as Window & {
    THREE?: {
      Raycaster: new () => {
        setFromCamera: (coords: { x: number; y: number }, camera: unknown) => void;
        intersectObjects: (objects: unknown[], recursive?: boolean) => Array<{ object: { userData?: Record<string, unknown>; parent?: unknown } }>;
      };
      Vector2: new (x: number, y: number) => { x: number; y: number };
    };
  };

  if (!maybeWindow.THREE) {
    return null;
  }

  const cameraObject = (arCameraEl as HTMLElement & { getObject3D?: (name: string) => unknown }).getObject3D?.("camera");
  if (!cameraObject) {
    return null;
  }

  const raycaster = new maybeWindow.THREE.Raycaster();
  raycaster.setFromCamera(new maybeWindow.THREE.Vector2(0, 0), cameraObject);

  const objects = hitZoneEls
    .map((hitZone) => (hitZone as HTMLElement & { object3D?: unknown }).object3D)
    .filter((obj): obj is unknown => Boolean(obj));

  const intersections = raycaster.intersectObjects(objects, true);
  for (const intersection of intersections) {
    let objectRef: unknown = intersection.object;
    while (objectRef && typeof objectRef === "object") {
      const candidate = objectRef as {
        userData?: Record<string, unknown>;
        parent?: unknown;
      };

      const maybePlanetId = candidate.userData?.planetId;
      if (typeof maybePlanetId === "string" && maybePlanetId in PLANET_BY_ID) {
        return maybePlanetId as PlanetId;
      }

      objectRef = candidate.parent;
    }
  }

  return null;
}

function bindTouchFallbackRaycast(): void {
  if (!sceneEl) {
    return;
  }

  const handler = () => {
    if (!isMarkerDetected || currentPlanet || isTransitioning) {
      return;
    }

    const planetId = pickPlanetFromCenterRay();
    if (planetId) {
      openPlanetDetail(planetId);
    }
  };

  sceneEl.addEventListener("touchend", handler, { passive: true });
  cleanupListeners.push(() => sceneEl?.removeEventListener("touchend", handler));
}

function bindMarkerEvents(): void {
  if (!markerEl) {
    return;
  }

  const onFound = () => {
    isMarkerDetected = true;
    setMarkerStatus("Marker terdeteksi", true);
  };

  const onLost = () => {
    isMarkerDetected = false;
    setMarkerStatus("Mencari marker...", false);
  };

  markerEl.addEventListener("markerFound", onFound);
  markerEl.addEventListener("markerLost", onLost);

  cleanupListeners.push(() => {
    markerEl?.removeEventListener("markerFound", onFound);
    markerEl?.removeEventListener("markerLost", onLost);
  });
}

function bindSolarModelFallback(): void {
  if (!solarSystemEl || !solarFallbackEl) {
    return;
  }

  const onSolarLoaded = () => {
    console.log("[MODEL] solar_system.glb loaded");
    tuneSolarSystemModelScale();
    if (solarSystemEl) {
      const didFit = fitModelToMarkerSize(solarSystemEl, getSolarOverviewTargetSize(), {
        center: true,
        centerY: true,
        verticalOffset: SOLAR_MODEL_VERTICAL_OFFSET
      });
      if (!didFit) {
        console.warn("[MODEL] solar_system.glb fit skipped; using calibrated scene scale.");
      }
    }
    isSolarSystemModelReady = true;
    setSolarOverviewVisible(!currentPlanet);
  };

  const onSolarError = (error: Event) => {
    console.error("[MODEL] solar_system.glb failed", error);
    isSolarSystemModelReady = false;
    solarSystemEl?.setAttribute("visible", "false");
    solarFallbackEl?.setAttribute("visible", currentPlanet ? "false" : "true");
    showToast("solar_system.glb gagal dimuat. Fallback tata surya sphere diaktifkan.", "warning");
  };

  solarSystemEl.addEventListener("model-loaded", onSolarLoaded);
  solarSystemEl.addEventListener("model-error", onSolarError);

  cleanupListeners.push(() => {
    solarSystemEl?.removeEventListener("model-loaded", onSolarLoaded);
    solarSystemEl?.removeEventListener("model-error", onSolarError);
  });
}

function bindSceneReferences(): void {
  sceneEl = ui.arMount.querySelector<HTMLElement>("#arScene");
  markerEl = ui.arMount.querySelector<HTMLElement>("#hiroMarker");
  solarRootEl = ui.arMount.querySelector<HTMLElement>("#solarRoot");
  solarSystemEl = ui.arMount.querySelector<HTMLElement>("#solarSystem");
  solarFallbackEl = ui.arMount.querySelector<HTMLElement>("#solarFallback");
  planetDetailRootEl = ui.arMount.querySelector<HTMLElement>("#planetDetailRoot");
  arCameraEl = ui.arMount.querySelector<HTMLElement>("#arCamera");
  hitZoneEls = Array.from(ui.arMount.querySelectorAll<HTMLElement>(".planet-hit-zone"));

  if (!sceneEl || !markerEl || !solarRootEl || !solarSystemEl || !planetDetailRootEl) {
    throw new Error("Scene AR tidak lengkap.");
  }
}

function updateCameraButtonLabel(): void {
  const cameraLabel = getFacingModeLabel(currentFacingMode);
  ui.switchCameraBtn.textContent = cameraLabel;
  ui.switchCameraBtn.setAttribute("aria-label", `Kamera ${cameraLabel}`);
}

async function bootScene(forceRebuild = false, sessionId = activeScannerSession): Promise<boolean> {
  if (pendingSceneBoot) {
    return false;
  }

  pendingSceneBoot = true;

  try {
    if (forceRebuild) {
      teardownScene();
      showScanner();
      syncArViewportLayout();
    }

    const maybeWindow = window as Window & { AFRAME?: Record<string, unknown> };
    if (!maybeWindow.AFRAME) {
      throw new Error("A-Frame tidak tersedia.");
    }

    if (!isSessionCurrent(sessionId)) {
      return false;
    }

    clearFatalError();
    const scaleMultiplier = getSolarScaleMultiplier();
    ui.arMount.innerHTML = createArSceneMarkup(currentFacingMode, scaleMultiplier);
    bindSceneReferences();
    if (!isSessionCurrent(sessionId)) {
      ui.arMount.innerHTML = "";
      cleanupAFrameArtifacts();
      return false;
    }
    bindArVideoLoadedEvent();
    resetSolarTransforms();
    bindMarkerEvents();
    bindHitZoneEvents();
    bindSolarModelFallback();
    bindTouchFallbackRaycast();
    syncArViewportLayout();

    const videoEl = await waitForArVideoElement(4500);
    if (!isScannerSessionActive(sessionId)) {
      return false;
    }
    manualFacingModeApplied = videoEl ? await applyFacingModeStream() : false;
    if (!isScannerSessionActive(sessionId)) {
      return false;
    }

    if (!videoEl) {
      showToast("Preview kamera belum siap. Coba arahkan ulang atau tekan switch kamera.", "warning");
    }

    syncArViewportLayout();
    window.requestAnimationFrame(() => {
      if (!isScannerSessionActive(sessionId)) {
        return;
      }
      setupVhVariable();
      syncArViewportLayout();
      window.dispatchEvent(new Event("resize"));
    });

    if (!isScannerSessionActive(sessionId)) {
      return false;
    }

    console.log("[AR LAYER]", {
      videos: document.querySelectorAll("video").length,
      canvases: document.querySelectorAll("canvas").length,
      arMountChildren: ui.arMount.children.length,
      hasArjsVideoInMount: Boolean(ui.arMount.querySelector("#arjs-video"))
    });

    updateCameraButtonLabel();

    setMarkerStatus("Mencari marker...", false);
    showToast("Scanner AR siap. Izinkan akses kamera jika diminta.");

    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    showFatalError(
      `AR.js gagal dijalankan: ${message}. Cek file /vendor/aframe.min.js dan /vendor/aframe-ar.js.`
    );
    return false;
  } finally {
    pendingSceneBoot = false;
  }
}

async function switchCamera(event: Event): Promise<void> {
  event.preventDefault();
  event.stopPropagation();

  if (pendingSceneBoot) {
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    showToast("Browser ini tidak mendukung switch kamera langsung.", "error");
    return;
  }

  const previousMode = currentFacingMode;
  currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
  showScanner();
  syncArViewportLayout();

  showToast(
    `Mengganti ke kamera ${currentFacingMode === "environment" ? "belakang" : "depan"}...`,
    "info"
  );

  const didBoot = await bootScene(true, activeScannerSession);
  if (!didBoot) {
    currentFacingMode = previousMode;
    updateCameraButtonLabel();
    showToast("Switch kamera gagal. Browser mungkin membatasi pergantian kamera saat runtime.", "error");
    return;
  }

  updateCameraButtonLabel();
  setMarkerStatus("Mencari marker...", false);
  syncArViewportLayout();

  if (!manualFacingModeApplied) {
    showToast("Switch kamera tidak didukung browser ini. Gunakan kamera default.", "warning");
    return;
  }

  showToast(`Kamera ${getFacingModeLabel(currentFacingMode).toLowerCase()} aktif.`);
}

async function startArFlow(): Promise<void> {
  activeScannerSession += 1;
  const sessionId = activeScannerSession;

  prepareScannerForFreshBoot();
  currentFacingMode = "environment";
  updateCameraButtonLabel();
  setupVhVariable();
  showScanner();
  hidePlanetPanel();
  syncArViewportLayout();

  let didBoot = await bootScene(false, sessionId);
  if (!didBoot && isScannerSessionActive(sessionId)) {
    showToast("Mengulang start kamera untuk sinkronisasi viewport...", "warning");
    teardownScene();
    showScanner();
    syncArViewportLayout();
    didBoot = await bootScene(false, sessionId);
  }

  if (!didBoot) {
    if (!isScannerSessionActive(sessionId)) {
      return;
    }
    showToast("Gagal memulai scanner AR.", "error");
    showLanding();
  }
}

function stopArFlow(): void {
  activeScannerSession += 1;
  const stoppedSession = activeScannerSession;
  cancelDelayedArtifactCleanups();
  closeHowToModal();
  ui.scannerPage.classList.add("is-hidden");
  document.body.classList.remove("is-ar-active");

  try {
    teardownScene();
  } catch (error) {
    console.error("[AR] stop flow error", error);
    ui.arMount.innerHTML = "";
    runCleanupListeners();
    clearSceneReferences();
    cleanupAFrameArtifacts();
  } finally {
    manualFacingModeApplied = false;
    isMarkerDetected = false;
    isTransitioning = false;
    currentPlanet = null;
    pendingSceneBoot = false;
    remountCleanLandingShell();
    schedulePostCloseArtifactCleanup(stoppedSession);
    scheduleMobileLandingReload();
  }
}

function bindStaticUiEvents(): void {
  ui.startArBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    void startArFlow();
  });

  ui.howToBtn.addEventListener("click", openHowToModal);
  ui.closeHowToBtn.addEventListener("click", closeHowToModal);

  ui.howToModal.addEventListener("click", (event) => {
    if (event.target === ui.howToModal) {
      closeHowToModal();
    }
  });

  ui.closeScannerBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    stopArFlow();
  });
  ui.closePlanetBtn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    closePlanetDetail();
  });

  ui.switchCameraBtn.addEventListener("click", (event) => {
    void switchCamera(event);
  });

  if (!viewportListenersBound) {
    const onViewportChange = () => {
      setupVhVariable();
    };

    window.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);
    window.visualViewport?.addEventListener("resize", onViewportChange);
    viewportListenersBound = true;
  }
}

function bootstrap(): void {
  setupVhVariable();
  updateCameraButtonLabel();
  bindStaticUiEvents();
  showLanding();
  setMarkerStatus("Mencari marker...", false);

  const totalPlanets = PLANETS.length;
  showToast(`Data planet siap: ${totalPlanets} planet.`);
}

bootstrap();
