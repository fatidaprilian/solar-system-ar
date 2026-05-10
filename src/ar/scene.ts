import { PLANETS } from "../data/planets";

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
  return PLANETS.map(
    (planet) =>
      `<a-sphere class="planet-hit-zone" data-planet="${planet.id}" position="${planet.hitZonePosition}" radius="${planet.hitZoneRadius}" material="color: #00b7ff; opacity: 0; transparent: true" ></a-sphere>`
  ).join("\n      ");
}

export function createArSceneMarkup(deviceId?: string): string {
  const normalizedDeviceId = deviceId?.replace(/;/g, "").trim();
  const deviceIdConfig = normalizedDeviceId ? ` deviceId: ${normalizedDeviceId};` : "";

  return `
<a-scene
  id="arScene"
  embedded
  vr-mode-ui="enabled: false"
  renderer="logarithmicDepthBuffer: true; alpha: true; antialias: true"
  arjs="sourceType: webcam; debugUIEnabled: false; detectionMode: mono;${deviceIdConfig}"
>
  <a-assets timeout="30000">
    ${buildAssetItems()}
  </a-assets>

  <a-marker id="hiroMarker" preset="hiro" emitevents="true">
    <a-entity id="solarRoot">
      <a-entity
        id="solarSystem"
        gltf-model="#solarSystemModel"
        position="0 0 0"
        rotation="0 0 0"
        scale="0.35 0.35 0.35"
      ></a-entity>

      <a-entity id="solarFallback" visible="false" scale="0.45 0.45 0.45">
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

      ${buildHitZones()}
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
