import { PLANETS } from "../data/planets";

type FacingMode = "environment" | "user";

export const SOLAR_SYSTEM_SCALE = {
  mobile: 0.12,
  tablet: 0.16,
  desktop: 0.2
} as const;

const LEGACY_SOLAR_SYSTEM_SCALE = 0.35;
const DEBUG_HIT_ZONES = true;

function formatUniformScale(scale: number): string {
  return `${scale} ${scale} ${scale}`;
}

function resolveSolarSystemScale(): number {
  const viewportWidth = window.innerWidth;

  if (viewportWidth <= 767) {
    return SOLAR_SYSTEM_SCALE.mobile;
  }

  if (viewportWidth <= 1024) {
    return SOLAR_SYSTEM_SCALE.tablet;
  }

  return SOLAR_SYSTEM_SCALE.desktop;
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
    <a-asset-item id="solarSystemModel" src="/assets/models/solar-system/solar_system.glb"></a-asset-item>
    ${planetAssets}`;
}

function buildHitZones(): string {
  const hitZoneMaterial = getHitZoneMaterial();

  return PLANETS.map(
    (planet) =>
      `<a-sphere class="planet-hit-zone" data-planet="${planet.id}" position="${planet.hitZonePosition}" radius="${planet.hitZoneRadius}" material="${hitZoneMaterial}" ></a-sphere>`
  ).join("\n      ");
}

export function createArSceneMarkup(facingMode: FacingMode = "environment"): string {
  const solarScale = resolveSolarSystemScale();
  const solarScaleValue = formatUniformScale(solarScale);
  const fallbackScaleValue = formatUniformScale(Math.max(solarScale * 2.2, 0.24));
  const hitZoneScaleValue = formatUniformScale(solarScale / LEGACY_SOLAR_SYSTEM_SCALE);

  return `
<a-scene
  id="arScene"
  embedded
  vr-mode-ui="enabled: false"
  renderer="logarithmicDepthBuffer: true; alpha: true; antialias: true"
  arjs="sourceType: webcam; facingMode: ${facingMode}; debugUIEnabled: false; detectionMode: mono; sourceWidth: 640; sourceHeight: 480;"
>
  <a-assets timeout="30000">
    ${buildAssetItems()}
  </a-assets>

  <a-marker id="hiroMarker" preset="hiro" emitevents="true">
    <a-entity id="solarRoot">
      <a-entity
        id="solarSystem"
        gltf-model="#solarSystemModel"
        visible="false"
        position="0 0.05 0"
        rotation="0 0 0"
        scale="${solarScaleValue}"
      ></a-entity>

      <a-entity id="solarFallback" visible="true" position="0 0.05 0" scale="${fallbackScaleValue}">
        <a-sphere color="#ffbe73" radius="0.2" position="0 0.12 0"></a-sphere>
        <a-sphere color="#afafaf" radius="0.05" position="-1.45 0.12 -0.02"></a-sphere>
        <a-sphere color="#d6b07b" radius="0.07" position="-1.05 0.12 -0.02"></a-sphere>
        <a-sphere color="#5aa6ff" radius="0.07" position="-0.65 0.12 -0.02"></a-sphere>
        <a-sphere color="#d18d70" radius="0.06" position="-0.25 0.12 -0.02"></a-sphere>
        <a-sphere color="#d4ad83" radius="0.13" position="0.34 0.12 0"></a-sphere>
        <a-sphere color="#ccb180" radius="0.11" position="0.88 0.12 0.01"></a-sphere>
        <a-ring color="#ccb180" radius-inner="0.12" radius-outer="0.17" rotation="90 0 0" position="0.88 0.12 0.01"></a-ring>
        <a-sphere color="#8cd6e5" radius="0.09" position="1.31 0.12 0.02"></a-sphere>
        <a-sphere color="#5b83e0" radius="0.09" position="1.69 0.12 0.03"></a-sphere>
      </a-entity>

      <a-entity id="solarHitZones" position="0 0.05 0" scale="${hitZoneScaleValue}">
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
