import { PLANETS } from "../data/planets";

type FacingMode = "environment" | "user";

const SOLAR_SYSTEM_MODEL_SCALE = 0.0012;
const SOLAR_FALLBACK_SCALE = 0.72;
const SOLAR_PRESENTATION_Y_POSITION = 0.02;
const SOLAR_PRESENTATION_TILT_DEG = -42;
const SOLAR_PRESENTATION_YAW_DEG = -8;
const SOLAR_PRESENTATION_ROTATION = `${SOLAR_PRESENTATION_TILT_DEG} ${SOLAR_PRESENTATION_YAW_DEG} 0`;
const AR_CAMERA_SOURCE_WIDTH = 1280;
const AR_CAMERA_SOURCE_HEIGHT = 720;

function formatUniformScale(scale: number): string {
  return `${scale} ${scale} ${scale}`;
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

function buildArjsConfig(facingMode: FacingMode): string {
  return [
    "trackingMethod: best",
    "sourceType: webcam",
    `facingMode: ${facingMode}`,
    "debugUIEnabled: false",
    "detectionMode: mono",
    "maxDetectionRate: 60",
    `sourceWidth: ${AR_CAMERA_SOURCE_WIDTH}`,
    `sourceHeight: ${AR_CAMERA_SOURCE_HEIGHT}`,
    `displayWidth: ${AR_CAMERA_SOURCE_WIDTH}`,
    `displayHeight: ${AR_CAMERA_SOURCE_HEIGHT}`,
    `canvasWidth: ${AR_CAMERA_SOURCE_WIDTH}`,
    `canvasHeight: ${AR_CAMERA_SOURCE_HEIGHT}`
  ].join("; ");
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

  return `
<a-scene
  id="arScene"
  embedded
  vr-mode-ui="enabled: false"
  renderer="logarithmicDepthBuffer: true; alpha: true; antialias: true"
  arjs="${buildArjsConfig(facingMode)}"
>
  <a-assets timeout="30000">
    ${buildAssetItems()}
  </a-assets>

  <a-marker
    id="hiroMarker"
    preset="hiro"
    emitevents="true"
    smooth="true"
    smoothCount="8"
    smoothTolerance="0.01"
    smoothThreshold="4"
  >
    <a-entity id="solarRoot">
      <a-entity
        id="solarPresentation"
        touch-rotate="speed: 0.005"
        position="0 ${SOLAR_PRESENTATION_Y_POSITION} 0"
        rotation="${SOLAR_PRESENTATION_ROTATION}"
      >
        <a-entity
          id="solarSystem"
          class="interactable-planet"
          continuous-sun-spin
          visible="false"
          position="0 0 0"
          rotation="0 0 0"
          scale="${solarScaleValue}"
        >
          <a-entity
            id="glbWrapper"
            gltf-model="#solarSystemModel"
            animation-mixer="clip: *; loop: repeat; timeScale: 0.5"
            rotation="-90 0 0"
          ></a-entity>
        </a-entity>

        <a-entity id="solarFallback" visible="true" position="0 0 0" scale="${fallbackScaleValue}">
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
      </a-entity>
    </a-entity>

    <a-entity id="planetDetailRoot" visible="false"></a-entity>
  </a-marker>

  <a-entity
    id="arCamera"
    camera
    cursor="rayOrigin: mouse"
    raycaster="objects: .interactable-planet; far: 20"
  >
    <a-entity
      id="touchCursor"
      cursor="fuse: false; rayOrigin: entity"
      raycaster="objects: .interactable-planet; far: 20"
      position="0 0 -1"
    ></a-entity>
  </a-entity>
</a-scene>
`.trim();
}
