import { PLANETS } from "../data/planets";

type FacingMode = "environment" | "user";

const LEGACY_SOLAR_SYSTEM_SCALE = 0.35;
const SOLAR_SYSTEM_MODEL_SCALE = 0.0012;
const SOLAR_FALLBACK_SCALE = 0.72;
const SOLAR_ROOT_Y_POSITION = 0.02;
const DEBUG_HIT_ZONES = false;

function formatUniformScale(scale: number): string {
  return `${scale} ${scale} ${scale}`;
}

function getHitZoneMaterial(): string {
  if (DEBUG_HIT_ZONES) {
    return "color: #00b7ff; opacity: 0.18; transparent: true";
  }

  return "color: #00b7ff; opacity: 0; transparent: true";
}

function buildAssetItems(): string {
  const planetAssets = PLANETS.map(
    (planet) =>
      `<a-asset-item id="${planet.modelId}" src="${planet.modelPath}"></a-asset-item>`
  ).join("\n    ");

  return `
    <a-asset-item id="solarSystemModel" src="/assets/models/solar-system/solar_system_animation.glb"></a-asset-item>
    ${planetAssets}`;
}

function buildHitZones(): string {
  const hitZoneMaterial = getHitZoneMaterial();

  return PLANETS.map(
    (planet) =>
      `<a-sphere class="planet-hit-zone" data-planet="${planet.id}" position="${planet.hitZonePosition}" radius="${planet.hitZoneRadius}" material="${hitZoneMaterial}" ></a-sphere>`
  ).join("\n      ");
}

export function createArSceneMarkup(
  facingMode: FacingMode = "environment",
  scaleMultiplier = 1
): string {
  const safeMultiplier = Number.isFinite(scaleMultiplier)
    ? Math.min(Math.max(scaleMultiplier, 0.9), 4.8)
    : 1;
  const scaledSolarScale = SOLAR_SYSTEM_MODEL_SCALE * safeMultiplier;
  const scaledFallbackScale = SOLAR_FALLBACK_SCALE * safeMultiplier;
  const solarScaleValue = formatUniformScale(scaledSolarScale);
  const fallbackScaleValue = formatUniformScale(scaledFallbackScale);
  const hitZoneScaleFactor = Math.max(
    scaledSolarScale / LEGACY_SOLAR_SYSTEM_SCALE,
    scaledFallbackScale
  );
  const hitZoneScaleValue = formatUniformScale(hitZoneScaleFactor);

  return `
<a-scene
  id="arScene"
  embedded
  vr-mode-ui="enabled: false"
  renderer="logarithmicDepthBuffer: true; alpha: true; antialias: true"
  arjs="sourceType: webcam; facingMode: ${facingMode}; debugUIEnabled: false; detectionMode: mono;"
>
  <a-assets timeout="30000">
    ${buildAssetItems()}
  </a-assets>

  <a-marker id="hiroMarker" preset="hiro" emitevents="true">
    <a-entity id="solarRoot">
      <a-entity
        id="solarSystem"
        gltf-model="#solarSystemModel"
        animation-mixer="loop: repeat; timeScale: 0.5"
        visible="false"
        position="0 ${SOLAR_ROOT_Y_POSITION} 0"
        rotation="0 90 0"
        scale="${solarScaleValue}"
      ></a-entity>

      <a-entity id="solarFallback" visible="true" position="0 ${SOLAR_ROOT_Y_POSITION} 0" scale="${fallbackScaleValue}">
        <a-sphere color="#ffbe73" radius="0.08" position="0 0.12 0"></a-sphere>
        <a-sphere color="#afafaf" radius="0.05" position="-1.45 0.12 -0.02"></a-sphere>
        <a-sphere color="#d6b07b" radius="0.06" position="-1.05 0.12 -0.02"></a-sphere>
        <a-sphere color="#5aa6ff" radius="0.06" position="-0.65 0.12 -0.02"></a-sphere>
        <a-sphere color="#d18d70" radius="0.055" position="-0.25 0.12 -0.02"></a-sphere>
        <a-sphere color="#d4ad83" radius="0.1" position="0.34 0.12 0"></a-sphere>
        <a-sphere color="#ccb180" radius="0.09" position="0.88 0.12 0.01"></a-sphere>
        <a-ring color="#ccb180" radius-inner="0.1" radius-outer="0.14" rotation="90 0 0" position="0.88 0.12 0.01"></a-ring>
        <a-sphere color="#8cd6e5" radius="0.075" position="1.31 0.12 0.02"></a-sphere>
        <a-sphere color="#5b83e0" radius="0.075" position="1.69 0.12 0.03"></a-sphere>
      </a-entity>

      <a-entity id="solarHitZones" position="0 ${SOLAR_ROOT_Y_POSITION} 0" scale="${hitZoneScaleValue}">
      ${buildHitZones()}
      </a-entity>
    </a-entity>

    <a-entity id="planetDetailRoot" visible="false"></a-entity>
  </a-marker>

  <a-entity
    id="arCamera"
    camera
    cursor="rayOrigin: mouse"
    raycaster="objects: .planet-hit-zone; far: 20"
  >
    <a-entity
      id="touchCursor"
      cursor="fuse: false; rayOrigin: entity"
      raycaster="objects: .planet-hit-zone; far: 20"
      position="0 0 -1"
    ></a-entity>
  </a-entity>
</a-scene>
`.trim();
}
