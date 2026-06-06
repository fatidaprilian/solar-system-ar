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
  category: string;
  diameter: string;
  distanceFromSun: string;
  orbitalPeriod: string;
  rotationPeriod: string;
  moons: string;
  atmosphere: string;
  averageTemperature: string;
  gravity: string;
  composition: string;
  keyFeature: string;
  explorationNote: string;
  funFact: string;
  learningQuestion: string;
  learningAnswer: string;
  quizOptions: string[];
  quizCorrectAnswer: string;
  quizExplanation: string;
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
    category: "Planet terestrial (batuan)",
    diameter: "4,879 km",
    distanceFromSun: "57.9 juta km",
    orbitalPeriod: "88 hari",
    rotationPeriod: "58.6 hari",
    moons: "Tidak punya bulan alami.",
    atmosphere: "Eksosfer sangat tipis berisi oksigen, natrium, hidrogen, helium, dan kalium.",
    averageTemperature: "Rata-rata 167 derajat C; siang bisa sekitar 430 derajat C dan malam sekitar -180 derajat C.",
    gravity: "3.7 m/s2 (sekitar 38% gravitasi Bumi)",
    composition: "Inti logam besar dengan mantel dan kerak batuan yang relatif tipis.",
    keyFeature: "Planet tercepat mengelilingi Matahari, hanya 88 hari untuk satu revolusi.",
    explorationNote: "MESSENGER memetakan permukaan Mercury dan menemukan bukti es air di kawah kutub yang selalu gelap.",
    funFact: "Satu hari matahari di Mercury lebih lama daripada satu tahun di Mercury.",
    learningQuestion: "Mengapa Mercury bukan planet terpanas walau paling dekat Matahari?",
    learningAnswer: "Karena Mercury hampir tidak punya atmosfer untuk menahan panas. Venus lebih panas akibat atmosfer CO2 yang sangat tebal.",
    quizOptions: ["Mercury tidak punya atmosfer tebal", "Mercury lebih jauh dari Mars", "Mercury punya banyak es permukaan"],
    quizCorrectAnswer: "Mercury tidak punya atmosfer tebal",
    quizExplanation: "Atmosfer Mercury terlalu tipis untuk menjebak panas. Venus menjadi lebih panas karena efek rumah kaca ekstrem.",
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
    category: "Planet terestrial (batuan)",
    diameter: "12,104 km",
    distanceFromSun: "108.2 juta km",
    orbitalPeriod: "225 hari",
    rotationPeriod: "243 hari (retrograde)",
    moons: "Tidak punya bulan alami.",
    atmosphere: "Atmosfer CO2 sangat tebal dengan awan asam sulfat dan tekanan permukaan sekitar 93 kali Bumi.",
    averageTemperature: "Rata-rata sekitar 464-467 derajat C, cukup panas untuk melelehkan timbal.",
    gravity: "8.87 m/s2 (sekitar 90% gravitasi Bumi)",
    composition: "Planet batuan berukuran mirip Bumi dengan kerak, mantel, dan inti logam.",
    keyFeature: "Rotasinya retrograde: Venus berputar berlawanan arah dari sebagian besar planet.",
    explorationNote: "Magellan memetakan permukaan Venus dengan radar karena awan tebal menutupi permukaannya.",
    funFact: "Venus berputar berlawanan arah dibanding sebagian besar planet lain.",
    learningQuestion: "Apa penyebab utama Venus menjadi planet terpanas?",
    learningAnswer: "Atmosfer CO2 yang sangat tebal menjebak panas melalui efek rumah kaca ekstrem.",
    quizOptions: ["Atmosfer CO2 sangat tebal", "Jaraknya paling dekat Matahari", "Venus tidak punya awan"],
    quizCorrectAnswer: "Atmosfer CO2 sangat tebal",
    quizExplanation: "Venus memiliki atmosfer CO2 padat dan awan tebal yang menjebak panas dengan sangat efektif.",
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
    category: "Planet terestrial (batuan)",
    diameter: "12,742 km",
    distanceFromSun: "149.6 juta km",
    orbitalPeriod: "365.25 hari",
    rotationPeriod: "23 jam 56 menit",
    moons: "1 bulan alami: Bulan.",
    atmosphere: "Nitrogen dan oksigen dominan; atmosfer melindungi permukaan dan mendukung air cair.",
    averageTemperature: "Rata-rata sekitar 15 derajat C.",
    gravity: "9.81 m/s2",
    composition: "Kerak batuan, mantel silikat, inti besi-nikel, dan air menutup sekitar 71% permukaan.",
    keyFeature: "Satu-satunya planet yang diketahui memiliki kehidupan dan air cair stabil di permukaan.",
    explorationNote: "Satelit observasi Bumi memantau atmosfer, laut, daratan, cuaca, dan perubahan iklim.",
    funFact: "Sekitar 71% permukaan Bumi tertutup air.",
    learningQuestion: "Faktor apa yang paling mendukung kelayakhunian Bumi?",
    learningAnswer: "Air cair, atmosfer pelindung, jarak yang sesuai dari Matahari, dan medan magnet membantu menjaga lingkungan Bumi.",
    quizOptions: ["Air cair dan atmosfer pelindung", "Tidak ada atmosfer", "Jarak paling dekat dari Matahari"],
    quizCorrectAnswer: "Air cair dan atmosfer pelindung",
    quizExplanation: "Bumi berada di zona yang mendukung air cair dan punya atmosfer yang membantu menjaga kestabilan lingkungan.",
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
    category: "Planet terestrial (batuan)",
    diameter: "6,779 km",
    distanceFromSun: "227.9 juta km",
    orbitalPeriod: "687 hari",
    rotationPeriod: "24 jam 37 menit",
    moons: "2 bulan alami: Phobos dan Deimos.",
    atmosphere: "Atmosfer tipis yang didominasi CO2; tekanan permukaan jauh lebih rendah daripada Bumi.",
    averageTemperature: "Rata-rata sekitar -65 derajat C.",
    gravity: "3.71 m/s2 (sekitar 38% gravitasi Bumi)",
    composition: "Planet batuan dengan permukaan kaya besi oksida yang memberi warna merah.",
    keyFeature: "Memiliki Olympus Mons dan Valles Marineris, dua fitur geologi raksasa di tata surya.",
    explorationNote: "Rover dan orbiter Mars meneliti jejak air purba serta lingkungan yang pernah mungkin layak huni.",
    funFact: "Olympus Mons di Mars tingginya hampir 22 km.",
    learningQuestion: "Mengapa Mars disebut planet merah?",
    learningAnswer: "Debu dan batuan permukaannya kaya besi oksida, mirip karat, sehingga tampak kemerahan.",
    quizOptions: ["Permukaannya kaya besi oksida", "Atmosfernya penuh oksigen", "Mars tertutup lautan merah"],
    quizCorrectAnswer: "Permukaannya kaya besi oksida",
    quizExplanation: "Besi oksida pada debu dan batuan Mars memberi warna kemerahan yang khas.",
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
    category: "Gas giant",
    diameter: "139,820 km",
    distanceFromSun: "778.5 juta km",
    orbitalPeriod: "11.86 tahun",
    rotationPeriod: "9 jam 56 menit",
    moons: "Banyak; yang terkenal adalah Io, Europa, Ganymede, dan Callisto. Jumlah resmi dapat berubah saat penemuan baru.",
    atmosphere: "Didominasi hidrogen dan helium, dengan awan amonia, ammonium hidrosulfida, serta air.",
    averageTemperature: "Sekitar -110 derajat C pada level atmosfer bertekanan sebanding permukaan laut Bumi.",
    gravity: "24.79 m/s2 (sekitar 2.5 kali gravitasi Bumi)",
    composition: "Hidrogen, helium, lapisan hidrogen metalik cair, dan inti yang diperkirakan diffuse atau fuzzy.",
    keyFeature: "Great Red Spot, badai raksasa yang bertahan sangat lama di atmosfer Jupiter.",
    explorationNote: "Juno mempelajari atmosfer, magnetosfer, gravitasi, dan struktur interior Jupiter.",
    funFact: "Jupiter punya medan magnet terkuat di antara planet tata surya.",
    learningQuestion: "Mengapa Jupiter disebut gas giant?",
    learningAnswer: "Karena Jupiter didominasi gas dan fluida hidrogen-helium, tanpa permukaan padat seperti planet batuan.",
    quizOptions: ["Didominasi hidrogen dan helium", "Tersusun terutama dari batuan padat", "Ukurannya lebih kecil dari Bumi"],
    quizCorrectAnswer: "Didominasi hidrogen dan helium",
    quizExplanation: "Jupiter adalah raksasa gas karena komposisinya didominasi hidrogen dan helium.",
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
    category: "Gas giant",
    diameter: "116,460 km",
    distanceFromSun: "1.43 miliar km",
    orbitalPeriod: "29.45 tahun",
    rotationPeriod: "10 jam 33 menit",
    moons: "Banyak; contoh pentingnya Titan, Enceladus, Mimas, dan Tethys. Titan memiliki atmosfer tebal.",
    atmosphere: "Didominasi hidrogen dan helium, dengan lapisan awan dan badai di atmosfer atas.",
    averageTemperature: "Sekitar -140 derajat C pada level atmosfer bertekanan sebanding permukaan laut Bumi.",
    gravity: "10.44 m/s2 (sedikit lebih kuat dari gravitasi Bumi)",
    composition: "Hidrogen dan helium dengan inti batuan/es; sistem cincin tersusun dari partikel es dan debu.",
    keyFeature: "Sistem cincin paling terang dan mudah dikenali di tata surya.",
    explorationNote: "Cassini meneliti Saturn, cincin, Titan, dan Enceladus selama lebih dari satu dekade.",
    funFact: "Kepadatan Saturn lebih rendah daripada air.",
    learningQuestion: "Mengapa cincin Saturn terlihat sangat mencolok?",
    learningAnswer: "Cincinnya tersusun dari banyak partikel es dan debu yang memantulkan cahaya Matahari.",
    quizOptions: ["Partikel es dan debu memantulkan cahaya", "Cincinnya adalah permukaan padat planet", "Cincinnya terbentuk dari api"],
    quizCorrectAnswer: "Partikel es dan debu memantulkan cahaya",
    quizExplanation: "Cincin Saturn terdiri dari partikel es dan debu yang membuatnya terang saat terkena cahaya Matahari.",
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
    category: "Ice giant",
    diameter: "50,724 km",
    distanceFromSun: "2.87 miliar km",
    orbitalPeriod: "84 tahun",
    rotationPeriod: "17 jam 14 menit (retrograde)",
    moons: "Banyak; contoh pentingnya Titania, Oberon, Umbriel, Ariel, dan Miranda.",
    atmosphere: "Hidrogen, helium, dan metana; metana berperan memberi warna biru kehijauan.",
    averageTemperature: "Sekitar -195 derajat C; beberapa area atmosfernya bisa lebih dingin dari Neptune.",
    gravity: "8.69 m/s2 (sekitar 89% gravitasi Bumi)",
    composition: "Raksasa es dengan campuran air, amonia, metana, hidrogen, dan helium.",
    keyFeature: "Sumbu rotasi sangat miring, sehingga Uranus tampak seperti berguling saat mengorbit Matahari.",
    explorationNote: "Voyager 2 adalah satu-satunya wahana yang pernah melakukan flyby dekat Uranus.",
    funFact: "Uranus tampak berputar seperti berguling di orbitnya.",
    learningQuestion: "Apa yang membuat musim di Uranus sangat ekstrem?",
    learningAnswer: "Sumbu rotasinya miring hampir 98 derajat, membuat kutubnya lama menghadap atau menjauhi Matahari.",
    quizOptions: ["Sumbu rotasinya sangat miring", "Uranus paling dekat Matahari", "Uranus tidak berotasi"],
    quizCorrectAnswer: "Sumbu rotasinya sangat miring",
    quizExplanation: "Kemiringan sumbu hampir 98 derajat membuat tiap kutub Uranus mengalami periode terang/gelap yang sangat panjang.",
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
    category: "Ice giant",
    diameter: "49,244 km",
    distanceFromSun: "4.50 miliar km",
    orbitalPeriod: "164.8 tahun",
    rotationPeriod: "16 jam 6 menit",
    moons: "Banyak; yang paling terkenal adalah Triton, bulan besar dengan orbit retrograde.",
    atmosphere: "Hidrogen, helium, dan metana; atmosfernya memiliki badai dan angin sangat cepat.",
    averageTemperature: "Sekitar -200 derajat C pada level atmosfer bertekanan sebanding permukaan laut Bumi.",
    gravity: "11.15 m/s2 (sedikit lebih kuat dari gravitasi Bumi)",
    composition: "Raksasa es dengan campuran air, amonia, metana, hidrogen, dan helium.",
    keyFeature: "Angin atmosfernya dapat melebihi 2,000 km/jam.",
    explorationNote: "Voyager 2 melakukan flyby Neptune pada 1989 dan mengamati Triton dari dekat.",
    funFact: "Kecepatan angin Neptune dapat melebihi 2,000 km/jam.",
    learningQuestion: "Mengapa Neptune tampak berwarna biru?",
    learningAnswer: "Metana dan partikel kabut di atmosfer menyerap sebagian cahaya merah dan membuat warna biru lebih dominan.",
    quizOptions: ["Metana memengaruhi warna atmosfer", "Permukaannya berupa samudra biru", "Neptune memancarkan cahaya biru sendiri"],
    quizCorrectAnswer: "Metana memengaruhi warna atmosfer",
    quizExplanation: "Metana dan kabut atmosfer membantu menyerap cahaya merah sehingga warna biru tampak dominan.",
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
