import { gsap } from "gsap";
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

function getRequiredElement<T extends HTMLElement>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Element not found: ${selector}`);
  }
  return element;
}

function setupVhVariable(): void {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
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

const ui = buildUi();

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
}

function showScanner(): void {
  document.body.classList.add("is-ar-active");
  ui.landingPage.classList.add("is-hidden");
  ui.scannerPage.classList.remove("is-hidden");
}

function openHowToModal(): void {
  ui.howToModal.classList.remove("is-hidden");
}

function closeHowToModal(): void {
  ui.howToModal.classList.add("is-hidden");
}

function fillPlanetPanel(planet: PlanetData): void {
  ui.planetPanel.style.setProperty("--planet-theme", planet.themeColor);
  ui.planetName.textContent = planet.name;
  ui.planetDescription.textContent = planet.description;
  ui.planetDiameter.textContent = planet.diameter;
  ui.planetDistance.textContent = planet.distanceFromSun;
  ui.planetOrbit.textContent = planet.orbitalPeriod;
  ui.planetRotation.textContent = planet.rotationPeriod;
  ui.planetFact.textContent = planet.funFact;
  ui.planetPanel.classList.remove("is-hidden");
}

function hidePlanetPanel(): void {
  ui.planetPanel.classList.add("is-hidden");
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

  document.querySelectorAll<HTMLCanvasElement>("canvas.a-canvas, canvas[data-aframe-canvas]").forEach((canvas) => {
    if (ui.arMount.contains(canvas) || canvas.classList.contains("a-canvas")) {
      canvas.remove();
    }
  });

  document.querySelectorAll<HTMLElement>(".a-enter-vr, .a-enter-ar, .arjs-loader, .a-orientation-modal").forEach((el) => {
    el.remove();
  });

  document.documentElement.classList.remove("a-html");
  document.body.classList.remove("a-body", "aframe-inspector-opened");
  document.documentElement.classList.remove("a-fullscreen");
  document.body.classList.remove("is-ar-active");
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
  style.height = "calc(var(--vh, 1vh) * 100)";
  style.minHeight = "100dvh";
  style.objectFit = "cover";
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

  try {
    if (typeof videoTrack.applyConstraints === "function") {
      await videoTrack.applyConstraints({
        facingMode: { ideal: currentFacingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      });
    }

    const settingsFacingMode = videoTrack.getSettings?.().facingMode;
    if (settingsFacingMode && settingsFacingMode !== currentFacingMode) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("[CAMERA] facingMode constraint failed", error);
    return false;
  }
}

function bindArVideoLoadedEvent(): void {
  const handler = (event: Event) => {
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

function teardownScene(): void {
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
    solarSystemEl.setAttribute("visible", "true");
  }
}

function renderDetailModel(planet: PlanetData): void {
  if (!planetDetailRootEl) {
    return;
  }

  planetDetailRootEl.innerHTML = `
    <a-entity id="planetDetailWrapper" position="0 0.12 0" scale="0.01 0.01 0.01">
      <a-entity
        id="planetDetailModel"
        gltf-model="#${planet.modelId}"
        rotation="0 25 0"
        scale="${planet.detailScale}"
      ></a-entity>
      <a-sphere
        id="planetDetailFallback"
        visible="false"
        radius="0.22"
        color="${planet.themeColor}"
        position="0 0 0"
      ></a-sphere>
    </a-entity>
  `;

  const detailModel = planetDetailRootEl.querySelector<HTMLElement>("#planetDetailModel");
  const detailFallback = planetDetailRootEl.querySelector<HTMLElement>("#planetDetailFallback");

  if (!detailModel || !detailFallback) {
    return;
  }

  const onModelLoaded = () => {
    detailModel.setAttribute("visible", "true");
    detailFallback.setAttribute("visible", "false");
  };

  const onModelError = () => {
    detailModel.setAttribute("visible", "false");
    detailFallback.setAttribute("visible", "true");
    showToast(`Model ${planet.name} gagal dimuat. Fallback sphere ditampilkan.`, "warning");
  };

  detailModel.addEventListener("model-loaded", onModelLoaded);
  detailModel.addEventListener("model-error", onModelError);

  cleanupListeners.push(() => {
    detailModel.removeEventListener("model-loaded", onModelLoaded);
    detailModel.removeEventListener("model-error", onModelError);
  });
}

function getEntityScaleObject(
  entity: HTMLElement | null
): { x: number; y: number; z: number } | null {
  if (!entity) {
    return null;
  }

  const object3D = (entity as HTMLElement & { object3D?: { scale?: { x: number; y: number; z: number } } }).object3D;
  return object3D?.scale ?? null;
}

function openPlanetDetail(planetId: PlanetId): void {
  if (!planetDetailRootEl || !solarRootEl || isTransitioning) {
    return;
  }

  const planet = PLANET_BY_ID[planetId];
  if (!planet) {
    return;
  }

  renderDetailModel(planet);

  const detailWrapper = planetDetailRootEl.querySelector<HTMLElement>("#planetDetailWrapper");
  if (!detailWrapper) {
    return;
  }

  const solarScale = getEntityScaleObject(solarRootEl);
  const detailScale = getEntityScaleObject(planetDetailRootEl);
  if (!solarScale || !detailScale) {
    return;
  }

  planetDetailRootEl.setAttribute("visible", "true");
  detailScale.x = 0.01;
  detailScale.y = 0.01;
  detailScale.z = 0.01;

  const detailWrapperScale = getEntityScaleObject(detailWrapper);
  if (detailWrapperScale) {
    detailWrapperScale.x = 0.01;
    detailWrapperScale.y = 0.01;
    detailWrapperScale.z = 0.01;
  }

  isTransitioning = true;
  const detailWrapperTarget = detailWrapperScale ?? detailScale;

  gsap
    .timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        currentPlanet = planet;
        fillPlanetPanel(planet);
        isTransitioning = false;
      }
    })
    .to(solarScale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.85 })
    .add(() => {
      solarRootEl?.setAttribute("visible", "false");
    })
    .to(detailScale, { x: 1, y: 1, z: 1, duration: 0.85 })
    .to(detailWrapperTarget, { x: 1, y: 1, z: 1, duration: 0.85 }, "<");
}

function closePlanetDetail(): void {
  if (!planetDetailRootEl || !solarRootEl || isTransitioning || !currentPlanet) {
    return;
  }

  const detailScale = getEntityScaleObject(planetDetailRootEl);
  const solarScale = getEntityScaleObject(solarRootEl);
  if (!detailScale || !solarScale) {
    return;
  }

  isTransitioning = true;
  solarRootEl.setAttribute("visible", "true");
  solarScale.x = 0.01;
  solarScale.y = 0.01;
  solarScale.z = 0.01;

  hidePlanetPanel();

  gsap
    .timeline({
      defaults: { ease: "power2.inOut" },
      onComplete: () => {
        currentPlanet = null;
        if (planetDetailRootEl) {
          planetDetailRootEl.setAttribute("visible", "false");
          planetDetailRootEl.innerHTML = "";
        }
        if (solarSystemEl) {
          solarSystemEl.setAttribute("visible", "true");
        }
        if (solarFallbackEl?.getAttribute("visible") === "true" && solarSystemEl) {
          solarSystemEl.setAttribute("visible", "false");
        }
        solarScale.x = 1;
        solarScale.y = 1;
        solarScale.z = 1;
        detailScale.x = 1;
        detailScale.y = 1;
        detailScale.z = 1;
        isTransitioning = false;
      }
    })
    .to(detailScale, { x: 0.01, y: 0.01, z: 0.01, duration: 0.85 })
    .to(solarScale, { x: 1, y: 1, z: 1, duration: 0.85 });
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
    solarSystemEl?.setAttribute("visible", "true");
    solarFallbackEl?.setAttribute("visible", "false");
  };

  const onSolarError = (error: Event) => {
    console.error("[MODEL] solar_system.glb failed", error);
    solarSystemEl?.setAttribute("visible", "false");
    solarFallbackEl?.setAttribute("visible", "true");
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
    }

    const maybeWindow = window as Window & { AFRAME?: Record<string, unknown> };
    if (!maybeWindow.AFRAME) {
      throw new Error("A-Frame tidak tersedia.");
    }

    clearFatalError();
    ui.arMount.innerHTML = createArSceneMarkup(currentFacingMode);
    bindSceneReferences();
    bindArVideoLoadedEvent();
    resetSolarTransforms();
    bindMarkerEvents();
    bindHitZoneEvents();
    bindSolarModelFallback();
    bindTouchFallbackRaycast();

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

  if (!manualFacingModeApplied) {
    showToast("Switch kamera tidak didukung browser ini. Gunakan kamera default.", "warning");
    return;
  }

  showToast(`Kamera ${getFacingModeLabel(currentFacingMode).toLowerCase()} aktif.`);
}

async function startArFlow(): Promise<void> {
  activeScannerSession += 1;
  const sessionId = activeScannerSession;

  currentFacingMode = "environment";
  updateCameraButtonLabel();
  setupVhVariable();
  showScanner();
  hidePlanetPanel();

  const didBoot = await bootScene(false, sessionId);
  if (!didBoot) {
    if (!isScannerSessionActive(sessionId)) {
      return;
    }
    showToast("Gagal memulai scanner AR.", "error");
  }
}

function stopArFlow(): void {
  activeScannerSession += 1;
  teardownScene();
  showLanding();
  setMarkerStatus("Mencari marker...", false);
  ui.toast.classList.add("is-hidden");
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
  ui.closePlanetBtn.addEventListener("click", closePlanetDetail);

  ui.switchCameraBtn.addEventListener("click", (event) => {
    void switchCamera(event);
  });

  window.addEventListener("resize", setupVhVariable);
  window.addEventListener("orientationchange", setupVhVariable);
  window.visualViewport?.addEventListener("resize", setupVhVariable);
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
