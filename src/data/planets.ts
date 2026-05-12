export type PlanetId =
  | "mercury"
  | "venus"
  | "earth"
  | "mars"
  | "jupiter"
  | "saturn"
  | "uranus"
  | "neptune";

export interface PlanetData {
  id: PlanetId;
  name: string;
  modelId: string;
  modelPath: string;
  description: string;
  diameter: string;
  distanceFromSun: string;
  orbitalPeriod: string;
  rotationPeriod: string;
  funFact: string;
  themeColor: string;
  hitZonePosition: string;
  hitZoneRadius: number;
  detailScale: string;
  previewScale: number;
}

export const PLANETS: PlanetData[] = [
  {
    id: "mercury",
    name: "Mercury",
    modelId: "mercuryModel",
    modelPath: "/assets/models/planets/mercury.glb",
    description: "Planet terdekat dari Matahari dengan suhu yang sangat ekstrem.",
    diameter: "4,879 km",
    distanceFromSun: "57.9 juta km",
    orbitalPeriod: "88 hari",
    rotationPeriod: "58.6 hari",
    funFact: "Satu hari matahari di Mercury lebih lama daripada satu tahun di Mercury.",
    themeColor: "#b5b6bc",
    hitZonePosition: "-1.45 0.12 -0.02",
    hitZoneRadius: 0.24,
    detailScale: "1 1 1",
    previewScale: 0.88
  },
  {
    id: "venus",
    name: "Venus",
    modelId: "venusModel",
    modelPath: "/assets/models/planets/venus.glb",
    description: "Planet paling panas karena atmosfer tebal dengan efek rumah kaca.",
    diameter: "12,104 km",
    distanceFromSun: "108.2 juta km",
    orbitalPeriod: "225 hari",
    rotationPeriod: "243 hari (retrograde)",
    funFact: "Venus berputar berlawanan arah dibanding sebagian besar planet lain.",
    themeColor: "#e7c48e",
    hitZonePosition: "-1.05 0.12 -0.02",
    hitZoneRadius: 0.26,
    detailScale: "1 1 1",
    previewScale: 0.95
  },
  {
    id: "earth",
    name: "Earth",
    modelId: "earthModel",
    modelPath: "/assets/models/planets/earth.glb",
    description: "Satu-satunya planet yang diketahui mendukung kehidupan.",
    diameter: "12,742 km",
    distanceFromSun: "149.6 juta km",
    orbitalPeriod: "365.25 hari",
    rotationPeriod: "23 jam 56 menit",
    funFact: "Sekitar 71% permukaan Bumi tertutup air.",
    themeColor: "#58a6ff",
    hitZonePosition: "-0.65 0.12 -0.02",
    hitZoneRadius: 0.26,
    detailScale: "1 1 1",
    previewScale: 1
  },
  {
    id: "mars",
    name: "Mars",
    modelId: "marsModel",
    modelPath: "/assets/models/planets/mars.glb",
    description: "Planet merah dengan gunung berapi terbesar di tata surya.",
    diameter: "6,779 km",
    distanceFromSun: "227.9 juta km",
    orbitalPeriod: "687 hari",
    rotationPeriod: "24 jam 37 menit",
    funFact: "Olympus Mons di Mars tingginya hampir 22 km.",
    themeColor: "#d88a6d",
    hitZonePosition: "-0.25 0.12 -0.02",
    hitZoneRadius: 0.24,
    detailScale: "1 1 1",
    previewScale: 0.9
  },
  {
    id: "jupiter",
    name: "Jupiter",
    modelId: "jupiterModel",
    modelPath: "/assets/models/planets/jupiter.glb",
    description: "Planet terbesar dengan badai raksasa Great Red Spot.",
    diameter: "139,820 km",
    distanceFromSun: "778.5 juta km",
    orbitalPeriod: "11.86 tahun",
    rotationPeriod: "9 jam 56 menit",
    funFact: "Jupiter punya medan magnet terkuat di antara planet tata surya.",
    themeColor: "#d7b497",
    hitZonePosition: "0.34 0.12 0",
    hitZoneRadius: 0.34,
    detailScale: "1 1 1",
    previewScale: 1.08
  },
  {
    id: "saturn",
    name: "Saturn",
    modelId: "saturnModel",
    modelPath: "/assets/models/planets/saturn.glb",
    description: "Planet bercincin paling ikonik dengan ribuan ring partikel es.",
    diameter: "116,460 km",
    distanceFromSun: "1.43 miliar km",
    orbitalPeriod: "29.45 tahun",
    rotationPeriod: "10 jam 33 menit",
    funFact: "Kepadatan Saturn lebih rendah daripada air.",
    themeColor: "#d3c18a",
    hitZonePosition: "0.88 0.12 0.01",
    hitZoneRadius: 0.38,
    detailScale: "1 1 1",
    previewScale: 1.12
  },
  {
    id: "uranus",
    name: "Uranus",
    modelId: "uranusModel",
    modelPath: "/assets/models/planets/uranus.glb",
    description: "Raksasa es yang berotasi miring hampir 98 derajat.",
    diameter: "50,724 km",
    distanceFromSun: "2.87 miliar km",
    orbitalPeriod: "84 tahun",
    rotationPeriod: "17 jam 14 menit (retrograde)",
    funFact: "Uranus tampak berputar seperti berguling di orbitnya.",
    themeColor: "#8fd7e8",
    hitZonePosition: "1.31 0.12 0.02",
    hitZoneRadius: 0.3,
    detailScale: "1 1 1",
    previewScale: 1.02
  },
  {
    id: "neptune",
    name: "Neptune",
    modelId: "neptuneModel",
    modelPath: "/assets/models/planets/neptune.glb",
    description: "Planet terluar dengan angin tercepat di tata surya.",
    diameter: "49,244 km",
    distanceFromSun: "4.50 miliar km",
    orbitalPeriod: "164.8 tahun",
    rotationPeriod: "16 jam 6 menit",
    funFact: "Kecepatan angin Neptune dapat melebihi 2,000 km/jam.",
    themeColor: "#5783e1",
    hitZonePosition: "1.69 0.12 0.03",
    hitZoneRadius: 0.3,
    detailScale: "1 1 1",
    previewScale: 1.02
  }
];

export const PLANET_BY_ID = Object.fromEntries(
  PLANETS.map((planet) => [planet.id, planet])
) as Record<PlanetId, PlanetData>;
