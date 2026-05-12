import { createArSceneMarkup } from "./ar/scene";
import { PLANET_BY_ID, PLANETS, type PlanetData, type PlanetId } from "./data/planets";
import "./styles/main.css";
import { APP_TEMPLATE } from "./ui/templates";

const maybeWindow = window as Window & { AFRAME?: any };
if (maybeWindow.AFRAME) {
  maybeWindow.AFRAME.registerComponent("continuous-sun-spin", {
    tick: function (_time: number, timeDelta: number) {
      if (!this.el.object3D) return;
      this.el.object3D.traverse((child: any) => {
        if (child.name === "sun_53" || child.name === "Object_56") {
          child.rotation.y += (0.0003 * timeDelta);
        }
      });
    }
  });

  maybeWindow.AFRAME.registerComponent("planet-orbit-animation", {
    schema: {
      speedMultiplier: { type: "number", default: 1 }
    },
    tick: function (_time: number, timeDelta: number) {
      if (!this.el.object3D) return;
      
      const speed = (this.data.speedMultiplier * timeDelta) / 1000;
      
      this.el.object3D.traverse((child: any) => {
        const planetId = getPlanetIdFromNodeName(child.name);
        if (planetId && child.isMesh && child.position) {
          // Different speeds for different planets
          let orbitSpeed = speed;
          if (planetId === "mercury") orbitSpeed *= 4.1;
          if (planetId === "venus") orbitSpeed *= 1.6;
          if (planetId === "earth") orbitSpeed *= 1.0;
          if (planetId === "mars") orbitSpeed *= 0.5;
          if (planetId === "jupiter") orbitSpeed *= 0.2;
          if (planetId === "saturn") orbitSpeed *= 0.1;
          if (planetId === "uranus") orbitSpeed *= 0.05;
          if (planetId === "neptune") orbitSpeed *= 0.03;
          
          const x = child.position.x;
          const z = child.position.z;
          const cos = Math.cos(orbitSpeed);
          const sin = Math.sin(orbitSpeed);
          
          child.position.x = x * cos - z * sin;
          child.position.z = x * sin + z * cos;
          
          // Also spin the planet on its own axis
          child.rotation.y += orbitSpeed * 2;
        }
      });
    }
  });
}

function getPlanetIdFromNodeName(name: string): PlanetId | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  
  if (lower.includes("mercury")) return "mercury";
  if (lower.includes("venus")) return "venus";
  if (lower.includes("earth") || lower.includes("erath")) return "earth";
  if (lower.includes("mars")) return "mars";
  if (lower.includes("jupiter")) return "jupiter";
  if (lower.includes("saturn") && !lower.includes("ring")) return "saturn";
  if (lower.includes("uranus")) return "uranus";
  if (lower.includes("neptune")) return "neptune";
  
  return null;
}

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
  planetPanel: HTMLDivElement;
  planetPreview: HTMLDivElement;
  planetName: HTMLHeadingElement;
  planetDescription: HTMLParagraphElement;
  planetDiameter: HTMLElement;
  planetDistance: HTMLElement;
  planetOrbit: HTMLElement;
  planetRotation: HTMLElement;
  planetFact: HTMLParagraphElement;
  closePlanetBtn: HTMLButtonElement;
  prevPlanetBtn: HTMLButtonElement;
  nextPlanetBtn: HTMLButtonElement;
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
let isSolarSystemModelReady = false;
let initialSolarScale: { x: number; y: number; z: number } | null = null;

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
const SOLAR_OVERVIEW_TARGET_SIZE = 2.8;
const PANEL_PREVIEW_TARGET_SIZE = 1.3;
const PANEL_PREVIEW_LARGE_TARGET_SIZE = 1.5;
const MOBILE_CLOSE_RELOAD_DELAY_MS = 180;
const SOLAR_MODEL_VERTICAL_OFFSET = 0.08;
const SOLAR_MODEL_CLUTTER_NAME_PARTS = ["asteroid", "asteroidi", "ceres", "pluto", "moon"];

function getSolarScaleMultiplier(): number {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (!isTouch) {
    return 1;
  }

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth ?? 0;
  if (viewportWidth <= 360) {
    return 4.2;
  }
  if (viewportWidth <= 420) {
    return 3.9;
  }
  if (viewportWidth <= 520) {
    return 3.5;
  }
  if (viewportWidth <= 768) {
    return 2.8;
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
    return 4.8;
  }
  if (viewportWidth <= 420) {
    return 4.5;
  }
  if (viewportWidth <= 520) {
    return 4.0;
  }
  if (viewportWidth <= 768) {
    return 3.4;
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
    planetPanel: getRequiredElement<HTMLDivElement>("#planetPanel"),
    planetPreview: getRequiredElement<HTMLDivElement>("#planetPreview"),
    planetName: getRequiredElement<HTMLHeadingElement>("#planetName"),
    planetDescription: getRequiredElement<HTMLParagraphElement>("#planetDescription"),
    planetDiameter: getRequiredElement<HTMLElement>("#planetDiameter"),
    planetDistance: getRequiredElement<HTMLElement>("#planetDistance"),
    planetOrbit: getRequiredElement<HTMLElement>("#planetOrbit"),
    planetRotation: getRequiredElement<HTMLElement>("#planetRotation"),
    planetFact: getRequiredElement<HTMLParagraphElement>("#planetFact"),
    closePlanetBtn: getRequiredElement<HTMLButtonElement>("#closePlanetBtn"),
    prevPlanetBtn: getRequiredElement<HTMLButtonElement>("#prevPlanetBtn"),
    nextPlanetBtn: getRequiredElement<HTMLButtonElement>("#nextPlanetBtn"),
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
  ui.planetPreview.innerHTML = "";
  delete ui.planetPreview.dataset.state;
  delete ui.planetPreview.dataset.planet;
}

function renderPlanetPanelPreview(planet: PlanetData): void {
  clearPlanetPanelPreview();

  const renderToken = planetPreviewRenderToken;
  ui.planetPreview.dataset.planet = planet.id;
  ui.planetPreview.dataset.state = "loading";

  // Use model-viewer for high-fidelity textured previews instead of a secondary a-scene
  const scaleRatio = 1 / planet.previewScale;
  const distance = Math.max(105, 105 * scaleRatio);

  ui.planetPreview.innerHTML = `
    <model-viewer
      src="${planet.modelPath}"
      alt="${planet.name}"
      auto-rotate
      camera-controls
      rotation-per-second="30deg"
      interaction-prompt="none"
      camera-orbit="0deg 90deg ${distance}%"
      shadow-intensity="1"
      environment-image="neutral"
      style="width: 100%; height: 100%; background-color: transparent; outline: none; pointer-events: auto;"
    >
      <div slot="poster" class="planet-preview-status">Memuat model ${planet.name}...</div>
    </model-viewer>
  `;

  const modelViewer = ui.planetPreview.querySelector('model-viewer') as HTMLElement;
  
  if (!modelViewer) {
    ui.planetPreview.dataset.state = "error";
    ui.planetPreview.innerHTML = `<div class="planet-preview-status">Model ${planet.name} belum bisa ditampilkan.</div>`;
    return;
  }

  modelViewer.addEventListener('load', () => {
    if (renderToken === planetPreviewRenderToken) {
      ui.planetPreview.dataset.state = "ready";
    }
  }, { once: true });
  
  modelViewer.addEventListener('error', () => {
    if (renderToken === planetPreviewRenderToken) {
      ui.planetPreview.dataset.state = "error";
      ui.planetPreview.innerHTML = `<div class="planet-preview-status">Model ${planet.name} gagal dimuat dari file GLB.</div>`;
    }
  }, { once: true });
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

    const planetId = object.name ? getPlanetIdFromNodeName(object.name) : null;
    if (planetId) {
      const meshObj = object as any;
      meshObj.userData = meshObj.userData || {};
      meshObj.userData.planetId = planetId;

      if (!meshObj.userData.hasHitBox && (window as any).THREE) {
        const THREE = (window as any).THREE;
        if (meshObj.isMesh && meshObj.geometry) {
          meshObj.geometry.computeBoundingSphere();
          const radius = meshObj.geometry.boundingSphere.radius * 4;
          const hitGeo = new THREE.SphereGeometry(radius, 12, 12);
          const hitMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.0, depthWrite: false });
          const hitMesh = new THREE.Mesh(hitGeo, hitMat);
          hitMesh.userData = { planetId: planetId };
          meshObj.add(hitMesh);
          meshObj.userData.hasHitBox = true;
        }
      }
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
  initialSolarScale = null;
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

function resetSolarSystemScale(): void {
  if (!solarSystemEl || !initialSolarScale) {
    return;
  }

  const object3D = (solarSystemEl as HTMLElement & { object3D?: Object3DLike }).object3D;
  object3D?.scale?.set(initialSolarScale.x, initialSolarScale.y, initialSolarScale.z);
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

  resetSolarSystemScale();

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
    if (isSolarSystemModelReady && isVisible) {
      resetSolarSystemScale();
      tuneSolarSystemModelScale();
      fitModelToMarkerSize(solarSystemEl, getSolarOverviewTargetSize(), {
        center: true,
        centerY: true,
        verticalOffset: SOLAR_MODEL_VERTICAL_OFFSET
      });
      solarSystemEl.setAttribute("visible", "true");
    } else {
      solarSystemEl.setAttribute("visible", "false");
    }
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
  if (!solarRootEl) {
    return;
  }

  killPlanetTransition();
  isTransitioning = false;
  hidePlanetPanel();
  currentPlanet = null;
  resetSolarTransforms();
  setSolarOverviewVisible(true);
}

function bindHitZoneEvents(): void {
  if (!solarSystemEl) return;

  const handler = (event: Event) => {
    if (!isMarkerDetected || currentPlanet || isTransitioning) {
      return;
    }

    const customEvent = event as Event & { detail?: { intersection?: { object?: any } } };
    if (customEvent.detail?.intersection?.object) {
      let objectRef = customEvent.detail.intersection.object;
      while (objectRef) {
        if (objectRef.userData?.planetId) {
          openPlanetDetail(objectRef.userData.planetId as PlanetId);
          return;
        }
        objectRef = objectRef.parent;
      }
    }
  };

  solarSystemEl.addEventListener("click", handler);
  cleanupListeners.push(() => solarSystemEl?.removeEventListener("click", handler));
}

function pickPlanetFromCenterRay(): PlanetId | null {
  if (!arCameraEl || !solarSystemEl) {
    return null;
  }

  const maybeWindow = window as Window & {
    THREE?: {
      Raycaster: new () => {
        setFromCamera: (coords: { x: number; y: number }, camera: unknown) => void;
        intersectObject: (object: unknown, recursive?: boolean) => Array<{ object: { userData?: Record<string, unknown>; parent?: unknown } }>;
      };
      Vector2: new (x: number, y: number) => { x: number; y: number };
    };
  };

  if (!maybeWindow.THREE) {
    return null;
  }

  const cameraObject = (arCameraEl as HTMLElement & { getObject3D?: (name: string) => unknown }).getObject3D?.("camera");
  const solarSystemObj = (solarSystemEl as HTMLElement & { object3D?: unknown }).object3D;
  if (!cameraObject || !solarSystemObj) {
    return null;
  }

  const raycaster = new maybeWindow.THREE.Raycaster();
  raycaster.setFromCamera(new maybeWindow.THREE.Vector2(0, 0), cameraObject);

  const intersections = raycaster.intersectObject(solarSystemObj, true);
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
    console.log("[MODEL] solar_system_animation.glb loaded");

    if (solarSystemEl) {
      const obj3D = (solarSystemEl as HTMLElement & { object3D?: Object3DLike }).object3D;
      if (obj3D?.scale) {
        initialSolarScale = {
          x: obj3D.scale.x ?? 1,
          y: obj3D.scale.y ?? 1,
          z: obj3D.scale.z ?? 1
        };
        console.log("[MODEL] initial solar scale stored", initialSolarScale);
      }
    }

    tuneSolarSystemModelScale();
    if (solarSystemEl) {
      const didFit = fitModelToMarkerSize(solarSystemEl, getSolarOverviewTargetSize(), {
        center: true,
        centerY: true,
        verticalOffset: SOLAR_MODEL_VERTICAL_OFFSET
      });
      if (!didFit) {
        console.warn("[MODEL] solar_system_animation.glb fit skipped; using calibrated scene scale.");
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
  ui.closePlanetBtn.addEventListener("click", () => {
    closePlanetDetail();
  });

  const navigatePlanet = (offset: number) => {
    if (!currentPlanet) return;
    const currentIndex = PLANETS.findIndex(p => p.id === currentPlanet!.id);
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + offset + PLANETS.length) % PLANETS.length;
    fillPlanetPanel(PLANETS[nextIndex]);
    currentPlanet = PLANETS[nextIndex];
  };

  ui.prevPlanetBtn.addEventListener("click", () => navigatePlanet(-1));
  ui.nextPlanetBtn.addEventListener("click", () => navigatePlanet(1));

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
