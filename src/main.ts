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

  maybeWindow.AFRAME.registerComponent("touch-rotate", {
    schema: { speed: { default: 0.005 } },
    init: function () {
      this.isDragging = false;
      this.previousMousePosition = { x: 0, y: 0 };
      this.dragDistance = 0;
      this.baseRotationX = 0;
      this.baseRotationZ = 0;

      this.onPointerDown = (e: PointerEvent) => {
        this.isDragging = true;
        this.previousMousePosition = { x: e.clientX, y: e.clientY };
        this.dragDistance = 0;
        this.baseRotationX = this.el.object3D?.rotation.x ?? 0;
        this.baseRotationZ = this.el.object3D?.rotation.z ?? 0;
      };

      this.onPointerUp = () => {
        this.isDragging = false;
        (window as any).__lastSolarDragDistance = this.dragDistance;
      };

      this.onPointerMove = (e: PointerEvent) => {
        if (!this.isDragging || !this.el.object3D) return;

        const deltaX = e.clientX - this.previousMousePosition.x;
        const deltaY = e.clientY - this.previousMousePosition.y;
        this.dragDistance += Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        this.el.object3D.rotation.y += deltaX * this.data.speed;
        this.el.object3D.rotation.x = this.baseRotationX;
        this.el.object3D.rotation.z = this.baseRotationZ;

        this.previousMousePosition = { x: e.clientX, y: e.clientY };
      };

      const sceneEl = document.querySelector('a-scene');
      if (sceneEl) {
        sceneEl.addEventListener('pointerdown', this.onPointerDown);
        sceneEl.addEventListener('pointerup', this.onPointerUp);
        sceneEl.addEventListener('pointermove', this.onPointerMove);
      }
    },
    remove: function () {
      const sceneEl = document.querySelector('a-scene');
      if (sceneEl) {
        sceneEl.removeEventListener('pointerdown', this.onPointerDown);
        sceneEl.removeEventListener('pointerup', this.onPointerUp);
        sceneEl.removeEventListener('pointermove', this.onPointerMove);
      }
    }
  });
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
  cameraSwitchCover: HTMLElement;
  markerStatus: HTMLElement;
  scannerHint: HTMLElement;
  planetPanel: HTMLDivElement;
  planetPreview: HTMLDivElement;
  planetName: HTMLHeadingElement;
  planetCategory: HTMLElement;
  planetDescription: HTMLParagraphElement;
  planetDiameter: HTMLElement;
  planetDistance: HTMLElement;
  planetOrbit: HTMLElement;
  planetRotation: HTMLElement;
  planetMoons: HTMLElement;
  planetAtmosphere: HTMLElement;
  planetTemperature: HTMLElement;
  planetGravity: HTMLElement;
  planetComposition: HTMLElement;
  planetFeature: HTMLElement;
  planetExploration: HTMLParagraphElement;
  planetFact: HTMLParagraphElement;
  planetQuestion: HTMLParagraphElement;
  planetQuizOptions: HTMLDivElement;
  planetQuizFeedback: HTMLParagraphElement;
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


let currentPlanet: PlanetData | null = null;
let isMarkerDetected = false;
let isTransitioning = false;
let pendingSceneBoot = false;
let toastTimer = 0;

type CameraFacingMode = "environment" | "user";
type CameraTrackIdentity = {
  deviceId?: string;
  label?: string;
};

let currentFacingMode: CameraFacingMode = "environment";
let manualFacingModeApplied = false;
let activeScannerSession = 0;
let preparedCameraStream: MediaStream | null = null;

const cleanupListeners: Array<() => void> = [];
let delayedArtifactCleanupTimers: number[] = [];
let landingResetTimers: number[] = [];
let viewportListenersBound = false;
let planetPreviewRenderToken = 0;

const MIN_VIEWPORT_HEIGHT = 320;
const MAX_TOUCH_VIEWPORT_HEIGHT = 1400;
const MAX_TOUCH_VIEWPORT_ASPECT = 2.35;
const SOLAR_OVERVIEW_TARGET_SIZE = 2.8;
const MOBILE_CLOSE_RELOAD_DELAY_MS = 180;
const SOLAR_MODEL_VERTICAL_OFFSET = 0.08;
const SOLAR_MODEL_CLUTTER_NAME_PARTS = ["asteroid", "asteroidi", "ceres", "pluto", "moon"];
const PLANET_TAP_RADIUS_MULTIPLIER: Record<PlanetId, number> = {
  mercury: 3,
  venus: 2.8,
  earth: 2.8,
  mars: 2.9,
  jupiter: 1.9,
  saturn: 1.9,
  uranus: 2.3,
  neptune: 2.3
};
const TOUCH_SCREEN_PICK_RADIUS_PX = 82;
const POINTER_SCREEN_PICK_RADIUS_PX = 54;
const AR_CAMERA_TARGET_WIDTH = 1280;
const AR_CAMERA_TARGET_HEIGHT = 720;
const AR_CAMERA_TARGET_FRAME_RATE = 30;

type CameraQualityCapabilities = MediaTrackCapabilities & {
  exposureMode?: string[];
  focusMode?: string[];
  whiteBalanceMode?: string[];
};

type CameraQualityConstraintSet = MediaTrackConstraintSet & {
  exposureMode?: string;
  focusMode?: string;
  whiteBalanceMode?: string;
};

function getSolarScaleMultiplier(): number {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  if (!isTouch) {
    return 1;
  }

  const viewportWidth = window.visualViewport?.width ?? window.innerWidth ?? 0;
  if (viewportWidth <= 360) {
    return 1.25;
  }
  if (viewportWidth <= 420) {
    return 1.18;
  }
  if (viewportWidth <= 520) {
    return 1.1;
  }
  if (viewportWidth <= 768) {
    return 1;
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
    return 1.9;
  }
  if (viewportWidth <= 420) {
    return 2.05;
  }
  if (viewportWidth <= 520) {
    return 2.2;
  }
  if (viewportWidth <= 768) {
    return 2.45;
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
    cameraSwitchCover: getRequiredElement<HTMLElement>("#cameraSwitchCover"),
    markerStatus: getRequiredElement<HTMLElement>("#markerStatus"),
    scannerHint: getRequiredElement<HTMLElement>("#scannerHint"),
    planetPanel: getRequiredElement<HTMLDivElement>("#planetPanel"),
    planetPreview: getRequiredElement<HTMLDivElement>("#planetPreview"),
    planetName: getRequiredElement<HTMLHeadingElement>("#planetName"),
    planetCategory: getRequiredElement<HTMLElement>("#planetCategory"),
    planetDescription: getRequiredElement<HTMLParagraphElement>("#planetDescription"),
    planetDiameter: getRequiredElement<HTMLElement>("#planetDiameter"),
    planetDistance: getRequiredElement<HTMLElement>("#planetDistance"),
    planetOrbit: getRequiredElement<HTMLElement>("#planetOrbit"),
    planetRotation: getRequiredElement<HTMLElement>("#planetRotation"),
    planetMoons: getRequiredElement<HTMLElement>("#planetMoons"),
    planetAtmosphere: getRequiredElement<HTMLElement>("#planetAtmosphere"),
    planetTemperature: getRequiredElement<HTMLElement>("#planetTemperature"),
    planetGravity: getRequiredElement<HTMLElement>("#planetGravity"),
    planetComposition: getRequiredElement<HTMLElement>("#planetComposition"),
    planetFeature: getRequiredElement<HTMLElement>("#planetFeature"),
    planetExploration: getRequiredElement<HTMLParagraphElement>("#planetExploration"),
    planetFact: getRequiredElement<HTMLParagraphElement>("#planetFact"),
    planetQuestion: getRequiredElement<HTMLParagraphElement>("#planetQuestion"),
    planetQuizOptions: getRequiredElement<HTMLDivElement>("#planetQuizOptions"),
    planetQuizFeedback: getRequiredElement<HTMLParagraphElement>("#planetQuizFeedback"),
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

function renderPlanetQuiz(planet: PlanetData): void {
  ui.planetQuizOptions.innerHTML = "";
  ui.planetQuizFeedback.textContent = "";
  ui.planetQuizFeedback.classList.remove("is-correct", "is-wrong");

  planet.quizOptions.forEach((option) => {
    const optionButton = document.createElement("button");
    optionButton.type = "button";
    optionButton.className = "quiz-option";
    optionButton.textContent = option;
    optionButton.dataset.answer = option;
    ui.planetQuizOptions.appendChild(optionButton);
  });
}

function answerPlanetQuiz(selectedAnswer: string): void {
  if (!currentPlanet) {
    return;
  }

  const isCorrect = selectedAnswer === currentPlanet.quizCorrectAnswer;
  const optionButtons = ui.planetQuizOptions.querySelectorAll<HTMLButtonElement>(".quiz-option");

  optionButtons.forEach((button) => {
    const isSelected = button.dataset.answer === selectedAnswer;
    const isAnswer = button.dataset.answer === currentPlanet?.quizCorrectAnswer;
    button.disabled = true;
    button.classList.toggle("is-selected", isSelected);
    button.classList.toggle("is-correct", isAnswer);
    button.classList.toggle("is-wrong", isSelected && !isCorrect);
  });

  ui.planetQuizFeedback.textContent = isCorrect
    ? `Benar. ${currentPlanet.quizExplanation}`
    : `Belum tepat. Jawaban yang benar: ${currentPlanet.quizCorrectAnswer}. ${currentPlanet.quizExplanation}`;
  ui.planetQuizFeedback.classList.toggle("is-correct", isCorrect);
  ui.planetQuizFeedback.classList.toggle("is-wrong", !isCorrect);
}

function fillPlanetPanel(planet: PlanetData): void {
  clearPlanetPanelPreview();
  ui.planetPanel.style.setProperty("--planet-theme", planet.themeColor);
  ui.planetPanel.style.setProperty("--planet-preview-scale", `${planet.previewScale}`);
  ui.planetPanel.dataset.planet = planet.id;
  ui.planetName.textContent = planet.name;
  ui.planetCategory.textContent = planet.category;
  ui.planetDescription.textContent = planet.description;
  ui.planetDiameter.textContent = planet.diameter;
  ui.planetDistance.textContent = planet.distanceFromSun;
  ui.planetOrbit.textContent = planet.orbitalPeriod;
  ui.planetRotation.textContent = planet.rotationPeriod;
  ui.planetMoons.textContent = planet.moons;
  ui.planetAtmosphere.textContent = planet.atmosphere;
  ui.planetTemperature.textContent = planet.averageTemperature;
  ui.planetGravity.textContent = planet.gravity;
  ui.planetComposition.textContent = planet.composition;
  ui.planetFeature.textContent = planet.keyFeature;
  ui.planetExploration.textContent = planet.explorationNote;
  ui.planetFact.textContent = planet.funFact;
  ui.planetQuestion.textContent = planet.learningQuestion;
  renderPlanetQuiz(planet);
  ui.planetPanel.classList.remove("is-hidden");
  renderPlanetPanelPreview(planet);
}

function hidePlanetPanel(): void {
  clearPlanetPanelPreview();
  ui.planetQuizOptions.innerHTML = "";
  ui.planetQuizFeedback.textContent = "";
  ui.planetQuizFeedback.classList.remove("is-correct", "is-wrong");
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
  discardPreparedCameraStream();
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

function discardPreparedCameraStream(): void {
  stopMediaStream(preparedCameraStream);
  preparedCameraStream = null;
}

function setCameraSwitchingState(isSwitching: boolean, requestedMode?: CameraFacingMode): void {
  ui.scannerPage.classList.toggle("is-camera-switching", isSwitching);
  ui.scannerPage.setAttribute("aria-busy", isSwitching ? "true" : "false");
  ui.switchCameraBtn.disabled = isSwitching;

  if (isSwitching) {
    const cameraLabel = requestedMode ? getFacingModeLabel(requestedMode).toLowerCase() : "target";
    ui.cameraSwitchCover.textContent = `Menyiapkan kamera ${cameraLabel}...`;
    ui.cameraSwitchCover.classList.remove("is-hidden");
    return;
  }

  ui.cameraSwitchCover.classList.add("is-hidden");
  ui.cameraSwitchCover.textContent = "Menyiapkan kamera...";
}

function getFacingModeLabel(mode: CameraFacingMode): string {
  return mode === "environment" ? "Belakang" : "Depan";
}

const CAMERA_LABEL_HINTS: Record<CameraFacingMode, string[]> = {
  environment: ["back", "rear", "environment", "world", "belakang"],
  user: ["front", "user", "face", "facetime", "selfie", "depan"]
};

function normalizeCameraLabel(label: string | undefined): string {
  return label?.trim().toLowerCase() ?? "";
}

function getCameraTrackIdentity(track: MediaStreamTrack | undefined): CameraTrackIdentity | null {
  if (!track) {
    return null;
  }

  const settings = typeof track.getSettings === "function" ? track.getSettings() : undefined;
  const deviceId = typeof settings?.deviceId === "string" ? settings.deviceId : undefined;
  const label = normalizeCameraLabel(track.label);

  if (!deviceId && !label) {
    return null;
  }

  return { deviceId, label };
}

function getActiveCameraTrackIdentity(): CameraTrackIdentity | null {
  const videoEl = findArVideoElement();
  if (!(videoEl?.srcObject instanceof MediaStream)) {
    return null;
  }

  return getCameraTrackIdentity(videoEl.srcObject.getVideoTracks()[0]);
}

function isSameCameraIdentity(
  currentIdentity: CameraTrackIdentity | null,
  previousIdentity: CameraTrackIdentity | null | undefined
): boolean {
  if (!currentIdentity || !previousIdentity) {
    return false;
  }

  if (
    currentIdentity.deviceId &&
    previousIdentity.deviceId &&
    currentIdentity.deviceId === previousIdentity.deviceId
  ) {
    return true;
  }

  return Boolean(
    currentIdentity.label &&
    previousIdentity.label &&
    currentIdentity.label === previousIdentity.label
  );
}

function detectFacingModeFromLabel(label: string): CameraFacingMode | null {
  if (!label) {
    return null;
  }

  if (CAMERA_LABEL_HINTS.user.some((hint) => label.includes(hint))) {
    return "user";
  }

  if (CAMERA_LABEL_HINTS.environment.some((hint) => label.includes(hint))) {
    return "environment";
  }

  return null;
}

function detectFacingModeFromTrack(track: MediaStreamTrack | undefined): CameraFacingMode | null {
  if (!track) {
    return null;
  }

  const settings = typeof track.getSettings === "function" ? track.getSettings() : undefined;
  const settingsFacingMode = typeof settings?.facingMode === "string" ? settings.facingMode : "";

  if (settingsFacingMode === "environment" || settingsFacingMode === "user") {
    return settingsFacingMode;
  }

  return detectFacingModeFromLabel(normalizeCameraLabel(track.label));
}

function isRequestedFacingModeTrack(
  track: MediaStreamTrack | undefined,
  requestedMode: CameraFacingMode,
  previousIdentity?: CameraTrackIdentity | null
): boolean {
  if (!track) {
    return false;
  }

  const detectedMode = detectFacingModeFromTrack(track);
  if (detectedMode) {
    return detectedMode === requestedMode;
  }

  const currentIdentity = getCameraTrackIdentity(track);
  if (isSameCameraIdentity(currentIdentity, previousIdentity)) {
    return false;
  }

  return Boolean(previousIdentity && currentIdentity);
}

function isRequestedFacingModeStream(
  stream: MediaStream,
  requestedMode: CameraFacingMode,
  previousIdentity?: CameraTrackIdentity | null
): boolean {
  return isRequestedFacingModeTrack(stream.getVideoTracks()[0], requestedMode, previousIdentity);
}

function withHighClarityCameraConstraints(
  videoConstraints: MediaTrackConstraints
): MediaTrackConstraints {
  return {
    width: { ideal: AR_CAMERA_TARGET_WIDTH },
    height: { ideal: AR_CAMERA_TARGET_HEIGHT },
    frameRate: { ideal: AR_CAMERA_TARGET_FRAME_RATE },
    ...videoConstraints
  };
}

async function applyCameraQualityConstraints(track: MediaStreamTrack): Promise<void> {
  if (typeof track.applyConstraints !== "function") {
    return;
  }

  try {
    const capabilities = typeof track.getCapabilities === "function"
      ? (track.getCapabilities() as CameraQualityCapabilities)
      : undefined;
    const advanced: CameraQualityConstraintSet[] = [];

    if (capabilities?.focusMode?.includes("continuous")) {
      advanced.push({ focusMode: "continuous" });
    }
    if (capabilities?.exposureMode?.includes("continuous")) {
      advanced.push({ exposureMode: "continuous" });
    }
    if (capabilities?.whiteBalanceMode?.includes("continuous")) {
      advanced.push({ whiteBalanceMode: "continuous" });
    }

    await track.applyConstraints({
      width: { ideal: AR_CAMERA_TARGET_WIDTH },
      height: { ideal: AR_CAMERA_TARGET_HEIGHT },
      frameRate: { ideal: AR_CAMERA_TARGET_FRAME_RATE },
      ...(advanced.length > 0 ? { advanced } : {})
    });
  } catch (error) {
    console.warn("[CAMERA] high clarity constraints skipped", error);
  }
}

async function requestCameraStream(
  videoConstraints: MediaTrackConstraints,
  requestedMode: CameraFacingMode,
  previousIdentity?: CameraTrackIdentity | null
): Promise<MediaStream | null> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: withHighClarityCameraConstraints(videoConstraints),
      audio: false
    });
    const [videoTrack] = stream.getVideoTracks();

    if (videoTrack) {
      await applyCameraQualityConstraints(videoTrack);
    }

    if (isRequestedFacingModeStream(stream, requestedMode, previousIdentity)) {
      return stream;
    }

    stopMediaStream(stream);
  } catch (error) {
    console.warn("[CAMERA] requested camera stream failed", error);
  }

  return null;
}

async function findCameraDeviceIdByFacingMode(mode: CameraFacingMode): Promise<string | null> {
  if (typeof navigator.mediaDevices.enumerateDevices !== "function") {
    return null;
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter((device) => device.kind === "videoinput" && device.deviceId);
    const requestedHints = CAMERA_LABEL_HINTS[mode];
    const oppositeHints = CAMERA_LABEL_HINTS[mode === "environment" ? "user" : "environment"];

    const matchedDevice = videoDevices.find((device) => {
      const label = normalizeCameraLabel(device.label);
      return requestedHints.some((hint) => label.includes(hint)) &&
        !oppositeHints.some((hint) => label.includes(hint));
    });

    return matchedDevice?.deviceId ?? null;
  } catch (error) {
    console.warn("[CAMERA] enumerateDevices failed", error);
    return null;
  }
}

async function requestVerifiedFacingModeStream(
  requestedMode: CameraFacingMode,
  previousIdentity?: CameraTrackIdentity | null
): Promise<MediaStream | null> {
  const exactFacingModeStream = await requestCameraStream(
    { facingMode: { exact: requestedMode } },
    requestedMode,
    previousIdentity
  );
  if (exactFacingModeStream) {
    return exactFacingModeStream;
  }

  const deviceId = await findCameraDeviceIdByFacingMode(requestedMode);
  if (deviceId) {
    const exactDeviceStream = await requestCameraStream(
      { deviceId: { exact: deviceId } },
      requestedMode,
      previousIdentity
    );
    if (exactDeviceStream) {
      return exactDeviceStream;
    }
  }

  return requestCameraStream(
    { facingMode: { ideal: requestedMode } },
    requestedMode,
    previousIdentity
  );
}

async function waitForVideoMetadata(videoEl: HTMLVideoElement): Promise<void> {
  await new Promise<void>((resolve) => {
    const onReady = () => {
      videoEl.play().catch(() => undefined);
      resolve();
    };

    if (videoEl.readyState >= 2) {
      onReady();
      return;
    }

    videoEl.addEventListener("loadedmetadata", onReady, { once: true });
  });
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

type PlanetObject3DLike = Object3DLike & {
  add?: (object: unknown) => void;
  geometry?: {
    computeBoundingSphere?: () => void;
    boundingSphere?: {
      center?: { copy?: (target: unknown) => void };
      radius?: number;
    };
  };
  getWorldPosition?: (target: unknown) => unknown;
  isMesh?: boolean;
  material?: unknown;
  parent?: PlanetObject3DLike | null;
  userData?: Record<string, unknown>;
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

function getMaterialNames(material: unknown): string[] {
  const materials = Array.isArray(material) ? material : [material];

  return materials
    .map((item) => {
      if (item && typeof item === "object" && "name" in item) {
        const name = (item as { name?: unknown }).name;
        return typeof name === "string" ? name.toLowerCase() : "";
      }
      return "";
    })
    .filter(Boolean);
}

function getPlanetIdFromMaterial(material: unknown): PlanetId | null {
  const materialNames = getMaterialNames(material);

  for (const materialName of materialNames) {
    if (materialName.includes("mercury")) return "mercury";
    if (materialName.includes("venus")) return "venus";
    if (materialName.includes("earth") || materialName.includes("erath")) return "earth";
    if (materialName.includes("mars")) return "mars";
    if (materialName.includes("jupiter")) return "jupiter";
    if (materialName.includes("saturn")) return "saturn";
    if (materialName.includes("uranus")) return "uranus";
    if (materialName.includes("neptune")) return "neptune";
  }

  return null;
}

function isPlanetRingMesh(object: PlanetObject3DLike): boolean {
  const objectName = object.name?.toLowerCase() ?? "";
  return objectName.includes("ring") || getMaterialNames(object.material).some((name) => name.includes("ring"));
}

function tagPlanetObject(object: PlanetObject3DLike, planetId: PlanetId, isSelectableMesh: boolean): void {
  object.userData = object.userData || {};
  object.userData.planetId = planetId;

  if (isSelectableMesh) {
    object.userData.isSelectablePlanetMesh = true;
  }
}

function addPlanetTapTarget(meshObj: PlanetObject3DLike, planetId: PlanetId): void {
  if (meshObj.userData?.hasHitBox || !meshObj.isMesh || !meshObj.geometry || !meshObj.add) {
    return;
  }

  const THREE = (window as Window & { THREE?: any }).THREE;
  if (!THREE) {
    return;
  }

  meshObj.geometry.computeBoundingSphere?.();
  const sourceRadius = meshObj.geometry.boundingSphere?.radius;
  if (!Number.isFinite(sourceRadius) || !sourceRadius || sourceRadius <= 0) {
    return;
  }

  const radius = sourceRadius * PLANET_TAP_RADIUS_MULTIPLIER[planetId];
  const hitGeo = new THREE.SphereGeometry(radius, 16, 16);
  const hitMat = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    colorWrite: false,
    depthTest: false,
    depthWrite: false,
    opacity: 0,
    transparent: true
  });
  const hitMesh = new THREE.Mesh(hitGeo, hitMat);
  const center = meshObj.geometry.boundingSphere?.center;

  hitMesh.name = `${planetId}_tap_target`;
  hitMesh.userData = {
    planetId,
    isPlanetTapTarget: true
  };

  if (center && hitMesh.position?.copy) {
    hitMesh.position.copy(center);
  }

  meshObj.add(hitMesh);
  meshObj.userData = meshObj.userData || {};
  meshObj.userData.hasHitBox = true;
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

    const planetObject = object as PlanetObject3DLike;
    const materialPlanetId = getPlanetIdFromMaterial(planetObject.material);
    if (materialPlanetId) {
      const isSelectableMesh = Boolean(planetObject.isMesh && !isPlanetRingMesh(planetObject));
      tagPlanetObject(planetObject, materialPlanetId, isSelectableMesh);

      if (isSelectableMesh) {
        addPlanetTapTarget(planetObject, materialPlanetId);
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

async function applyFacingModeStream(previousCameraIdentity?: CameraTrackIdentity | null): Promise<boolean> {
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

  const currentStream = videoEl.srcObject as MediaStream;
  let facingModeApplied = isRequestedFacingModeTrack(
    currentStream.getVideoTracks()[0],
    currentFacingMode,
    previousCameraIdentity
  );

  if (!facingModeApplied && preparedCameraStream) {
    if (isRequestedFacingModeStream(preparedCameraStream, currentFacingMode, previousCameraIdentity)) {
      const verifiedStream = preparedCameraStream;
      preparedCameraStream = null;
      stopMediaStream(currentStream);
      videoEl.srcObject = verifiedStream;
      await waitForVideoMetadata(videoEl);
      facingModeApplied = true;
    } else {
      discardPreparedCameraStream();
    }
  }

  // 1. Try applyConstraints (works on desktop/multiple-webcam setups)
  const [videoTrack] = currentStream.getVideoTracks();
  if (!facingModeApplied && videoTrack) {
    try {
      if (typeof videoTrack.applyConstraints === "function") {
        await videoTrack.applyConstraints({
          facingMode: { exact: currentFacingMode }
        });
      }
      facingModeApplied = isRequestedFacingModeTrack(
        videoTrack,
        currentFacingMode,
        previousCameraIdentity
      );
    } catch (error) {
      console.warn("[CAMERA] facingMode constraint failed", error);
    }
  }

  // 2. Force manual stream replacement if applyConstraints failed (mobile requirement)
  if (!facingModeApplied) {
    const replacementStream = await requestVerifiedFacingModeStream(
      currentFacingMode,
      previousCameraIdentity
    );

    if (replacementStream) {
      stopMediaStream(currentStream);
      videoEl.srcObject = replacementStream;
      await waitForVideoMetadata(videoEl);
      facingModeApplied = true;
    } else if (previousCameraIdentity) {
      const staleStream = videoEl.srcObject instanceof MediaStream ? videoEl.srcObject : null;
      stopMediaStream(staleStream);
      videoEl.srcObject = null;

      const retryStream = await requestVerifiedFacingModeStream(
        currentFacingMode,
        previousCameraIdentity
      );

      if (retryStream) {
        videoEl.srcObject = retryStream;
        await waitForVideoMetadata(videoEl);
        facingModeApplied = true;
      }
    }
  }

  // 3. Apply high-clarity constraints and default zoom constraints
  if (videoEl.srcObject instanceof MediaStream) {
    const [currentTrack] = videoEl.srcObject.getVideoTracks();
    if (currentTrack) {
      await applyCameraQualityConstraints(currentTrack);

      try {
        const capabilities = typeof currentTrack.getCapabilities === "function"
          ? (currentTrack.getCapabilities() as { zoom?: number | ZoomCapabilityRange })
          : undefined;
        const zoomCapability = capabilities?.zoom;
        const zoomMin = typeof zoomCapability === "number" ? zoomCapability : zoomCapability?.min;

        if (typeof zoomMin === "number" && Number.isFinite(zoomMin) && typeof currentTrack.applyConstraints === "function") {
          const advancedZoomConstraint = [{ zoom: zoomMin }] as unknown as MediaTrackConstraintSet[];
          await currentTrack.applyConstraints({
            advanced: advancedZoomConstraint
          });
        }
      } catch (error) {
        console.warn("[CAMERA] default zoom reset skipped", error);
      }
    }
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
  if (planetDetailRootEl) {
    planetDetailRootEl.setAttribute("visible", "false");
    planetDetailRootEl.innerHTML = "";
  }
}

function setSolarOverviewVisible(isVisible: boolean): void {
  if (solarRootEl) {
    solarRootEl.setAttribute("visible", isVisible ? "true" : "false");
    const rootObj = (solarRootEl as any).object3D;
    if (rootObj) {
      rootObj.visible = isVisible;
      rootObj.scale.set(1, 1, 1);
    }
  }

  if (solarSystemEl) {
    const shouldShowModel = isSolarSystemModelReady && isVisible;
    solarSystemEl.setAttribute("visible", shouldShowModel ? "true" : "false");
    const sysObj = (solarSystemEl as any).object3D;
    if (sysObj) {
      sysObj.visible = shouldShowModel;
    }
    
    // Workaround for A-Frame animation-mixer getting stuck after being hidden
    if (shouldShowModel && typeof (solarSystemEl as any).play === 'function') {
      try {
        (solarSystemEl as any).play();
      } catch {
        // ignore errors
      }
    }
  }

  if (solarFallbackEl) {
    const shouldShowFallback = !isSolarSystemModelReady && isVisible;
    solarFallbackEl.setAttribute("visible", shouldShowFallback ? "true" : "false");
    const fbObj = (solarFallbackEl as any).object3D;
    if (fbObj) {
      fbObj.visible = shouldShowFallback;
    }
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

function resolvePlanetIdFromObjectRef(objectRef: unknown): PlanetId | null {
  let currentRef = objectRef;

  while (currentRef && typeof currentRef === "object") {
    const candidate = currentRef as PlanetObject3DLike;
    const maybePlanetId = candidate.userData?.planetId;

    if (typeof maybePlanetId === "string" && maybePlanetId in PLANET_BY_ID) {
      return maybePlanetId as PlanetId;
    }

    currentRef = candidate.parent;
  }

  return null;
}

function bindHitZoneEvents(): void {
  if (!solarSystemEl) return;

  const handler = (event: Event) => {
    if (!isMarkerDetected || currentPlanet || isTransitioning) {
      return;
    }

    const customEvent = event as Event & { detail?: { intersection?: { object?: any } } };
    if (customEvent.detail?.intersection?.object) {
      const planetId = resolvePlanetIdFromObjectRef(customEvent.detail.intersection.object);
      if (planetId) {
        openPlanetDetail(planetId);
      }
    }
  };

  solarSystemEl.addEventListener("click", handler);
  cleanupListeners.push(() => solarSystemEl?.removeEventListener("click", handler));
}

function getPointerBounds(): DOMRect | null {
  const target = ui.arMount.querySelector<HTMLCanvasElement>("canvas.a-canvas, canvas") ?? sceneEl ?? ui.arMount;
  const rect = target.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  return rect;
}

function getNormalizedPointerCoordinates(clientX: number, clientY: number): { x: number; y: number } | null {
  const rect = getPointerBounds();
  if (!rect) {
    return null;
  }

  return {
    x: ((clientX - rect.left) / rect.width) * 2 - 1,
    y: -(((clientY - rect.top) / rect.height) * 2 - 1)
  };
}

function getClientPointFromTapEvent(event: Event): { clientX: number; clientY: number } | null {
  if ("clientX" in event && "clientY" in event) {
    const pointerEvent = event as PointerEvent | MouseEvent;
    return {
      clientX: pointerEvent.clientX,
      clientY: pointerEvent.clientY
    };
  }

  if ("changedTouches" in event) {
    const touchEvent = event as TouchEvent;
    const touch = touchEvent.changedTouches[0] ?? touchEvent.touches[0];
    if (touch) {
      return {
        clientX: touch.clientX,
        clientY: touch.clientY
      };
    }
  }

  return null;
}

function pickPlanetByRaycastPoint(clientX: number, clientY: number): PlanetId | null {
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

  const pointerCoords = getNormalizedPointerCoordinates(clientX, clientY);
  if (!pointerCoords) {
    return null;
  }

  const cameraObject = (arCameraEl as HTMLElement & { getObject3D?: (name: string) => unknown }).getObject3D?.("camera");
  const solarSystemObj = (solarSystemEl as HTMLElement & { object3D?: unknown }).object3D;
  if (!cameraObject || !solarSystemObj) {
    return null;
  }

  const raycaster = new maybeWindow.THREE.Raycaster();
  raycaster.setFromCamera(new maybeWindow.THREE.Vector2(pointerCoords.x, pointerCoords.y), cameraObject);

  const intersections = raycaster.intersectObject(solarSystemObj, true);
  for (const intersection of intersections) {
    const planetId = resolvePlanetIdFromObjectRef(intersection.object);
    if (planetId) {
      return planetId;
    }
  }

  return null;
}

function pickNearestPlanetByScreenPoint(clientX: number, clientY: number): PlanetId | null {
  if (!arCameraEl || !solarSystemEl) {
    return null;
  }

  const THREE = (window as Window & { THREE?: any }).THREE;
  const rect = getPointerBounds();
  const cameraObject = (arCameraEl as HTMLElement & { getObject3D?: (name: string) => unknown }).getObject3D?.("camera");
  const solarSystemObj = (solarSystemEl as HTMLElement & { object3D?: PlanetObject3DLike }).object3D;

  if (!THREE || !rect || !cameraObject || !solarSystemObj?.traverse) {
    return null;
  }

  const candidates: Array<{ planetId: PlanetId; distance: number }> = [];

  solarSystemObj.updateMatrixWorld?.(true);
  solarSystemObj.traverse((object) => {
    const planetObject = object as PlanetObject3DLike;
    const maybePlanetId = planetObject.userData?.planetId;

    if (
      !planetObject.userData?.isSelectablePlanetMesh ||
      typeof maybePlanetId !== "string" ||
      !(maybePlanetId in PLANET_BY_ID) ||
      !planetObject.getWorldPosition
    ) {
      return;
    }

    const worldPosition = new THREE.Vector3();
    planetObject.getWorldPosition(worldPosition);
    worldPosition.project(cameraObject);

    if (worldPosition.z < -1 || worldPosition.z > 1) {
      return;
    }

    const screenX = rect.left + ((worldPosition.x + 1) / 2) * rect.width;
    const screenY = rect.top + ((1 - worldPosition.y) / 2) * rect.height;
    const distance = Math.hypot(clientX - screenX, clientY - screenY);

    candidates.push({
      planetId: maybePlanetId as PlanetId,
      distance
    });
  });

  const pickRadius = isTouchDevice() ? TOUCH_SCREEN_PICK_RADIUS_PX : POINTER_SCREEN_PICK_RADIUS_PX;
  const bestCandidate = candidates.sort((a, b) => a.distance - b.distance)[0];

  return bestCandidate && bestCandidate.distance <= pickRadius ? bestCandidate.planetId : null;
}

function pickPlanetFromTapPoint(clientX: number, clientY: number): PlanetId | null {
  return pickNearestPlanetByScreenPoint(clientX, clientY) ?? pickPlanetByRaycastPoint(clientX, clientY);
}

function bindTouchFallbackRaycast(): void {
  if (!sceneEl) {
    return;
  }

  let lastFallbackTapAt = 0;
  const handler = (event: Event) => {
    if (!isMarkerDetected || currentPlanet || isTransitioning) {
      return;
    }

    const now = window.performance.now();
    if (now - lastFallbackTapAt < 120) {
      return;
    }
    lastFallbackTapAt = now;

    const point = getClientPointFromTapEvent(event);
    if (!point) {
      return;
    }

    // Abaikan jika user ternyata melakukan drag/swipe untuk merotasi tata surya
    if ((window as any).__lastSolarDragDistance > 15) {
      return;
    }

    const planetId = pickPlanetFromTapPoint(point.clientX, point.clientY);
    if (planetId) {
      openPlanetDetail(planetId);
    }
  };

  sceneEl.addEventListener("pointerup", handler);
  sceneEl.addEventListener("touchend", handler, { passive: true });
  cleanupListeners.push(() => {
    sceneEl?.removeEventListener("pointerup", handler);
    sceneEl?.removeEventListener("touchend", handler);
  });
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
    console.error("[MODEL] solar_system_animation.glb failed", error);
    isSolarSystemModelReady = false;
    solarSystemEl?.setAttribute("visible", "false");
    solarFallbackEl?.setAttribute("visible", currentPlanet ? "false" : "true");
    showToast("solar_system_animation.glb gagal dimuat. Fallback tata surya sphere diaktifkan.", "warning");
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

async function bootScene(
  forceRebuild = false,
  sessionId = activeScannerSession,
  previousCameraIdentity?: CameraTrackIdentity | null
): Promise<boolean> {
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
    manualFacingModeApplied = videoEl ? await applyFacingModeStream(previousCameraIdentity) : false;
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
  const previousCameraIdentity = getActiveCameraTrackIdentity();
  const requestedMode = currentFacingMode === "environment" ? "user" : "environment";
  setCameraSwitchingState(true, requestedMode);

  showToast(
    `Mengganti ke kamera ${getFacingModeLabel(requestedMode).toLowerCase()}...`,
    "info"
  );

  try {
    preparedCameraStream = await requestVerifiedFacingModeStream(
      requestedMode,
      previousCameraIdentity
    );

    if (!preparedCameraStream) {
      showToast(
        `Kamera ${getFacingModeLabel(requestedMode).toLowerCase()} tidak tersedia atau tidak bisa diverifikasi. Tetap memakai kamera ${getFacingModeLabel(previousMode).toLowerCase()}.`,
        "warning"
      );
      return;
    }

    currentFacingMode = requestedMode;
    showScanner();
    syncArViewportLayout();

    const didBoot = await bootScene(true, activeScannerSession, previousCameraIdentity);
    if (!didBoot || !manualFacingModeApplied) {
      discardPreparedCameraStream();
      currentFacingMode = previousMode;
      updateCameraButtonLabel();

      const restored = await bootScene(true, activeScannerSession);
      showToast(
        restored
          ? `Switch kamera gagal. Tetap memakai kamera ${getFacingModeLabel(previousMode).toLowerCase()}.`
          : "Switch kamera gagal dan scanner perlu dibuka ulang.",
        "warning"
      );
      return;
    }

    updateCameraButtonLabel();
    setMarkerStatus("Mencari marker...", false);
    syncArViewportLayout();
    showToast(`Kamera ${getFacingModeLabel(currentFacingMode).toLowerCase()} aktif.`);
  } finally {
    discardPreparedCameraStream();
    setCameraSwitchingState(false);
    updateCameraButtonLabel();
  }
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
  discardPreparedCameraStream();
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

  ui.planetQuizOptions.addEventListener("click", (event) => {
    const optionButton = (event.target as HTMLElement).closest<HTMLButtonElement>(".quiz-option");
    if (!optionButton?.dataset.answer) {
      return;
    }

    answerPlanetQuiz(optionButton.dataset.answer);
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

  ui.closeHowToBtn.addEventListener("click", closeHowToModal);

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
}

bootstrap();
