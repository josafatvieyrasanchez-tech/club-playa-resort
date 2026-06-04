// =================================================================
// GALDIJO BEACH CLUB - Configuración y datos
// =================================================================
export const PAYPAL_CLIENT_ID =
  "AdHkMO8pkBAhqqa3C-uW0U-0XZZk5GSQWeGzMM0lrM0qRipiegcuQ5QdtROyMFPy4i_wp2ntZPODOIVP";

export const ADMIN_CREDENCIALES = { correo: "admin@galdijo.com", password: "Admin2026!" };
export const CLIENTE_DEMO = { correo: "cliente@galdijo.com", password: "Cliente2026!", nombre: "Cliente Demo" };

// Colores oficiales por tipo de pase (se usan en zonas, albercas y pases)
export const COLOR_GENERAL = "#10b981"; // emerald-500
export const COLOR_VIP = "#f59e0b"; // amber-500

// Pases beach club
export const PASES_BEACH_CLUB = [
  { id: "pase-general", tipo: "Pase General", nombre: "Pase General Beach Club", precio: 500, color: COLOR_GENERAL },
  { id: "pase-vip", tipo: "Pase VIP", nombre: "Pase VIP Beach Club", precio: 1200, color: COLOR_VIP },
];

// Amenidades por playa
export const AMENIDADES_POR_PLAYA = {
  delfines: {
    general: [
      "Acceso al área de playa privada",
      "Toallas de cortesía",
      "Estacionamiento gratis",
      "WiFi en áreas comunes",
      "Bebida de bienvenida (agua de coco o limonada)",
      "Camastro básico de uso compartido",
      "Acceso a Alberca General",
    ],
    vip: [
      "Todo lo del Pase General",
      "Barra libre nacional e internacional ilimitada",
      "Buffet gourmet con cortes premium y mariscos",
      "Lluvia de espuma cada hora en la pista",
      "Concierge personal 24/7",
      "Hookah lounge premium ilimitado",
      "Botella de champagne de cortesía",
      "Acceso a Alberca VIP infinita con jacuzzi",
    ],
  },
  marlin: {
    general: [
      "Acceso a la playa familiar",
      "Toallas y carriola gratis",
      "Estacionamiento gratis",
      "WiFi",
      "Área infantil supervisada",
      "Bebida de bienvenida (no alcohólica)",
      "Acceso a Alberca General familiar",
    ],
    vip: [
      "Todo lo del Pase General",
      "Buffet familiar premium (kids menu incluido)",
      "Barra libre familiar (cervezas, vinos, cocteles ligeros)",
      "Animación temática con DJ kids",
      "Estación de algodón de azúcar y nieves ilimitadas",
      "Cabaña climatizada con sombra extendida",
      "Sesión de yoga matutina en familia",
      "Alberca VIP climatizada exclusiva",
    ],
  },
  caracol: {
    general: [
      "Acceso al oasis lounge",
      "Camastro básico",
      "WiFi de alta velocidad",
      "Música lounge ambiental",
      "Toallas perfumadas",
      "Bebida de bienvenida (mocktail tropical)",
      "Acceso a Alberca General lounge",
    ],
    vip: [
      "Todo lo del Pase General",
      "Barra libre de mixología tropical premium",
      "Buffet healthy & estación de sushi",
      "Masaje relajante de 20 minutos",
      "Hookah premium con sabores especiales",
      "Aromaterapia y cromoterapia en cabaña",
      "Set DJ lounge en vivo al atardecer",
      "Alberca VIP infinity con cromoterapia",
    ],
  },
  tortugas: {
    general: [
      "Acceso al club de aventura",
      "Chaleco salvavidas básico",
      "WiFi",
      "Toallas",
      "Bebida de bienvenida (cerveza o refresco)",
      "Acceso a juegos de playa (voley, futbol)",
      "Acceso a Alberca General de fiesta",
    ],
    vip: [
      "Todo lo del Pase General",
      "Barra libre fiesta (tequila, mezcal, vodka, ron premium)",
      "Buffet caribeño con mariscos frescos",
      "Lluvia de espuma cada 2 horas",
      "Acceso a moto acuática (30 min incluidos)",
      "Show de fuego al atardecer",
      "Foam party nocturna",
      "Alberca VIP con bar swim-up",
    ],
  },
};

// Imágenes representativas (galería visual de los tipos de espacios)
export const IMG_CABANA_NORMAL =
  "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=900&q=80";
export const IMG_CABANA_PREMIUM =
  "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80";
export const IMG_PALAPA =
  "https://images.unsplash.com/photo-1602002418082-a4443e081dd1?auto=format&fit=crop&w=900&q=80";
export const IMG_CAMASTRO =
  "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=900&q=80";
export const IMG_ALBERCA_GENERAL =
  "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?auto=format&fit=crop&w=900&q=80";
export const IMG_ALBERCA_VIP =
  "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=900&q=80";

// =================================================================
// Playas con coordenadas reales en Cancún (sobre la franja de arena)
// =================================================================
// Cada playa define:
//   - centro [lat, lng]: centro de la zona del beach club (sobre arena)
//   - zoom: nivel de zoom inicial
//   - zonaGeneral: 4 esquinas del polígono de la zona General (verde)
//   - zonaVIP: 4 esquinas del polígono de la zona VIP (ámbar)
//   - albercaGen / albercaVip: [lat, lng] de cada alberca
// El layout es una franja N-S sobre la arena:
//   Norte = Zona General (verde)
//   Sur   = Zona VIP (ámbar)
const beachAxis = (lat, lng, halfLat = 0.00080, halfLng = 0.00022) => ({
  // El "centro" para spawnear espacios. La zona general va al norte (+lat), la VIP al sur (-lat).
  centro: [lat, lng],
  zonaGeneral: [
    [lat, lng - halfLng],
    [lat, lng + halfLng],
    [lat + halfLat, lng + halfLng],
    [lat + halfLat, lng - halfLng],
  ],
  zonaVIP: [
    [lat - halfLat, lng - halfLng],
    [lat - halfLat, lng + halfLng],
    [lat, lng + halfLng],
    [lat, lng - halfLng],
  ],
  albercaGen: [lat + halfLat * 0.55, lng],
  albercaVip: [lat - halfLat * 0.55, lng],
});

export const playasCancun = [
  {
    id: "delfines",
    nombre: "Playa Delfines",
    tag: "Zona Diamante VIP",
    icono: "👑",
    imagen: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
    descripcion:
      "La joya de Cancún. Aguas turquesa infinitas, oleaje majestuoso y un ambiente de exclusividad absoluta.",
    zoom: 19,
    ...beachAxis(21.04610, -86.78225),
  },
  {
    id: "marlin",
    nombre: "Playa Marlin",
    tag: "Zona Confort Familiar",
    icono: "⛱️",
    imagen: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
    descripcion: "Extensa franja de arena blanca ideal para descansar con la familia con áreas recreativas seguras.",
    zoom: 19,
    ...beachAxis(21.08815, -86.77100),
  },
  {
    id: "caracol",
    nombre: "Playa Caracol",
    tag: "Oasis Lounge & Chill",
    icono: "🍹",
    imagen: "https://images.unsplash.com/photo-1520520731457-9283dd14aa66?auto=format&fit=crop&w=800&q=80",
    descripcion: "Aguas tranquilas tipo piscina natural. Perfecto para relajarse en cabaña privada con música lounge.",
    zoom: 19,
    ...beachAxis(21.13050, -86.74710),
  },
  {
    id: "tortugas",
    nombre: "Playa Tortugas",
    tag: "Zona Club & Adventure",
    icono: "🏄",
    imagen: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=800&q=80",
    descripcion: "Ambiente vibrante. Ideal para deportes acuáticos, muelles de fiesta y mixología tropical.",
    zoom: 19,
    ...beachAxis(21.14225, -86.74815),
  },
];

// =================================================================
// Generador de espacios con coordenadas geográficas reales
// =================================================================
// Por playa: 2 Cabaña Normal (general) + 2 Cabaña Premium (vip) + 6 Palapas (3+3) + 6 Camastros (3+3)
const offset = (centro, dLat, dLng) => [centro[0] + dLat, centro[1] + dLng];

const buildEspacios = (prefix, centro) => {
  // dLat positivo = norte (zona General). dLat negativo = sur (zona VIP).
  // dLng pequeño porque la franja de playa es estrecha (~25m).
  const cabanas = [
    // Normales en zona General (norte)
    { id: `${prefix}-CN1`, categoria: "Cabaña Normal", nombre: "Cabaña Normal I", precio: 3200, img: IMG_CABANA_NORMAL, zona: "general", pos: offset(centro, 0.00038, -0.00008) },
    { id: `${prefix}-CN2`, categoria: "Cabaña Normal", nombre: "Cabaña Normal II", precio: 3200, img: IMG_CABANA_NORMAL, zona: "general", pos: offset(centro, 0.00038, 0.00008) },
    // Premium en zona VIP (sur)
    { id: `${prefix}-CP1`, categoria: "Cabaña Premium", nombre: "Cabaña Premium I", precio: 5800, img: IMG_CABANA_PREMIUM, zona: "vip", pos: offset(centro, -0.00038, -0.00008) },
    { id: `${prefix}-CP2`, categoria: "Cabaña Premium", nombre: "Cabaña Premium II", precio: 5800, img: IMG_CABANA_PREMIUM, zona: "vip", pos: offset(centro, -0.00038, 0.00008) },
  ];
  const palapas = [
    // 3 en general (norte)
    { id: `${prefix}-P1`, zona: "general", pos: offset(centro, 0.00025, -0.00008) },
    { id: `${prefix}-P2`, zona: "general", pos: offset(centro, 0.00025, 0.00008) },
    { id: `${prefix}-P3`, zona: "general", pos: offset(centro, 0.00015, 0.00000) },
    // 3 en VIP (sur)
    { id: `${prefix}-P4`, zona: "vip", pos: offset(centro, -0.00015, 0.00000) },
    { id: `${prefix}-P5`, zona: "vip", pos: offset(centro, -0.00025, -0.00008) },
    { id: `${prefix}-P6`, zona: "vip", pos: offset(centro, -0.00025, 0.00008) },
  ].map((p, i) => ({
    ...p,
    categoria: "Palapa",
    nombre: `Palapa Imperial ${i + 1}`,
    precio: 2200,
    img: IMG_PALAPA,
  }));
  const camastros = [
    // 3 general (más al norte)
    { id: `${prefix}-M1`, zona: "general", pos: offset(centro, 0.00007, -0.00010) },
    { id: `${prefix}-M2`, zona: "general", pos: offset(centro, 0.00007, 0.00000) },
    { id: `${prefix}-M3`, zona: "general", pos: offset(centro, 0.00007, 0.00010) },
    // 3 VIP (más al sur)
    { id: `${prefix}-M4`, zona: "vip", pos: offset(centro, -0.00007, -0.00010) },
    { id: `${prefix}-M5`, zona: "vip", pos: offset(centro, -0.00007, 0.00000) },
    { id: `${prefix}-M6`, zona: "vip", pos: offset(centro, -0.00007, 0.00010) },
  ].map((c, i) => ({
    ...c,
    categoria: "Camastro",
    nombre: `Camastro Balinés ${i + 1}`,
    precio: 1200,
    img: IMG_CAMASTRO,
  }));
  return [...cabanas, ...palapas, ...camastros].map((s) => ({ ...s, estado: "disponible" }));
};

export const generarEspaciosIniciales = () => ({
  delfines: buildEspacios("DEL", playasCancun.find((p) => p.id === "delfines").centro),
  marlin: buildEspacios("MAR", playasCancun.find((p) => p.id === "marlin").centro),
  caracol: buildEspacios("CAR", playasCancun.find((p) => p.id === "caracol").centro),
  tortugas: buildEspacios("TOR", playasCancun.find((p) => p.id === "tortugas").centro),
});

// GeoJSON de las zonas General y VIP (polígonos coloreados)
export const zonasGeoJSON = (playa) => ({
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { zona: "general", color: COLOR_GENERAL, label: "Zona General" },
      geometry: {
        type: "Polygon",
        coordinates: [playa.zonaGeneral.concat([playa.zonaGeneral[0]]).map(([lat, lng]) => [lng, lat])],
      },
    },
    {
      type: "Feature",
      properties: { zona: "vip", color: COLOR_VIP, label: "Zona VIP" },
      geometry: {
        type: "Polygon",
        coordinates: [playa.zonaVIP.concat([playa.zonaVIP[0]]).map(([lat, lng]) => [lng, lat])],
      },
    },
  ],
});

// Albercas por playa
export const getAlbercas = (playa) => [
  {
    id: `${playa.id.toUpperCase()}-ALB-GEN`,
    nombre: "Alberca General",
    zona: "general",
    pos: playa.albercaGen,
    img: IMG_ALBERCA_GENERAL,
    descripcion: "Alberca incluida con tu Pase General. Sombrillas y servicio a tabla.",
  },
  {
    id: `${playa.id.toUpperCase()}-ALB-VIP`,
    nombre: "Alberca VIP",
    zona: "vip",
    pos: playa.albercaVip,
    img: IMG_ALBERCA_VIP,
    descripcion: "Alberca infinity exclusiva del Pase VIP. Swim-up bar y jacuzzi.",
  },
];

// Tile URL: MapTiler si hay key, OSM si no
export const tileLayerConfig = () => {
  const key = import.meta.env.VITE_MAPTILER_KEY;
  if (key && key.trim()) {
    return {
      url: `https://api.maptiler.com/maps/hybrid/{z}/{x}/{y}.jpg?key=${key}`,
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> &copy; OpenStreetMap',
    };
  }
  return {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: "&copy; OpenStreetMap contributors",
  };
};

// =================================================================
// localStorage helpers
// =================================================================
const KEY_RESERVAS = "galdijo_reservaciones_v2";
const KEY_ESTADOS = "galdijo_estados_v3"; // v3 porque cambió la estructura

export const loadReservas = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY_RESERVAS) || "[]");
  } catch {
    return [];
  }
};
export const saveReservas = (r) => localStorage.setItem(KEY_RESERVAS, JSON.stringify(r));

export const loadEstados = () => {
  try {
    const v = localStorage.getItem(KEY_ESTADOS);
    if (!v) return null;
    return JSON.parse(v);
  } catch {
    return null;
  }
};
export const saveEstados = (e) => localStorage.setItem(KEY_ESTADOS, JSON.stringify(e));
