import React, { useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { zonasGeoJSON, tileLayerConfig, getAlbercas, COLOR_GENERAL, COLOR_VIP } from "./data";

// Mapeo de iconos por categoría y estado
const COLORES_ESTADO = {
  disponible: "#10b981",
  reservado: "#ef4444",
  apartado: "#a855f7",
  bloqueado: "#f59e0b",
};

const EMOJI_CAT = {
  "Cabaña Normal": "🏡",
  "Cabaña Premium": "🏛️",
  Palapa: "⛱️",
  Camastro: "🛋️",
};

const buildIcon = (espacio, enCarrito) => {
  // Color: si está en carrito => cyan; si no => color del estado pero con borde de su zona
  const colorFondo = enCarrito ? "#22d3ee" : COLORES_ESTADO[espacio.estado] || "#94a3b8";
  const borderZona = espacio.zona === "vip" ? COLOR_VIP : COLOR_GENERAL;
  return L.divIcon({
    className: "galdijo-marker",
    html: `<div class="pin" style="background:${colorFondo}; border-color:${borderZona}; border-width:3px;">${EMOJI_CAT[espacio.categoria] || "📍"}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

const buildAlbercaIcon = (zona) => {
  const color = zona === "vip" ? COLOR_VIP : COLOR_GENERAL;
  return L.divIcon({
    className: "galdijo-marker",
    html: `<div class="pin" style="background:${color}; width:56px; height:56px; font-size:24px; border-width:4px; border-color:white;">🏊</div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
  });
};

export default function BeachMap({ playa, espacios, carrito, onAddEspacio, onRemoveEspacio, turnoMap, onSetTurno }) {
  const tile = useMemo(tileLayerConfig, []);
  const zonas = useMemo(() => zonasGeoJSON(playa), [playa]);
  const albercas = useMemo(() => getAlbercas(playa), [playa]);

  // Estilo por zona (color desde properties)
  const zonaStyle = (feature) => ({
    color: feature.properties.color,
    weight: 3,
    fillColor: feature.properties.color,
    fillOpacity: 0.38,
    dashArray: "6 3",
  });

  return (
    <div
      className="w-full h-[560px] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative"
      data-testid="beach-map"
    >
      <MapContainer
        center={playa.centro}
        zoom={playa.zoom}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />

        {/* Zonas coloreadas (General verde / VIP ámbar) */}
        <GeoJSON
          data={zonas}
          style={zonaStyle}
          onEachFeature={(feature, layer) =>
            layer.bindTooltip(feature.properties.label, { permanent: false, sticky: true })
          }
        />

        {/* Albercas */}
        {albercas.map((alb) => (
          <Marker key={alb.id} position={alb.pos} icon={buildAlbercaIcon(alb.zona)}>
            <Popup minWidth={220} maxWidth={240}>
              <div className="font-sans" data-testid={`popup-${alb.id}`}>
                <img src={alb.img} alt={alb.nombre} className="w-full h-24 object-cover rounded-lg mb-2" />
                <div
                  className="text-[10px] uppercase tracking-widest font-mono"
                  style={{ color: alb.zona === "vip" ? COLOR_VIP : COLOR_GENERAL }}
                >
                  {alb.zona === "vip" ? "Zona VIP" : "Zona General"}
                </div>
                <div className="font-black text-base text-white">{alb.nombre}</div>
                <div className="text-[11px] text-slate-300 mt-1 leading-snug">{alb.descripcion}</div>
                <div className="mt-2 text-[10px] text-slate-400 italic">
                  Acceso incluido con tu{" "}
                  <span style={{ color: alb.zona === "vip" ? COLOR_VIP : COLOR_GENERAL }} className="font-bold">
                    {alb.zona === "vip" ? "Pase VIP" : "Pase General"}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Espacios reservables */}
        {espacios.map((esp) => {
          const turno = turnoMap[esp.id] || "Día Completo";
          const key = `${playa.id}-${esp.id}-${turno}`;
          const enCarrito = carrito.find((c) => c.key === key);
          const disponible = esp.estado === "disponible";
          const precio = turno === "Día Completo" ? esp.precio : Math.round(esp.precio * 0.6);
          const zonaColor = esp.zona === "vip" ? COLOR_VIP : COLOR_GENERAL;
          return (
            <Marker key={esp.id} position={esp.pos} icon={buildIcon(esp, !!enCarrito)}>
              <Popup minWidth={240} maxWidth={260}>
                <div className="font-sans" data-testid={`popup-${esp.id}`}>
                  <img src={esp.img} alt={esp.nombre} className="w-full h-28 object-cover rounded-lg mb-2" />
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-cyan-300">{esp.categoria}</div>
                    <div
                      className="text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-widest"
                      style={{ background: zonaColor + "33", color: zonaColor }}
                    >
                      {esp.zona === "vip" ? "VIP" : "General"}
                    </div>
                  </div>
                  <div className="font-black text-base text-white">{esp.nombre}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{esp.id}</div>
                  <div className="mt-2 text-xs">
                    Estado:{" "}
                    <span className="font-bold" style={{ color: COLORES_ESTADO[esp.estado] }}>
                      {esp.estado.toUpperCase()}
                    </span>
                  </div>
                  {disponible && (
                    <>
                      <div className="flex gap-1 mt-2">
                        {["Turno AM", "Turno PM", "Día Completo"].map((t) => (
                          <button
                            key={t}
                            data-testid={`turno-${esp.id}-${t.replace(/ /g, "-")}`}
                            onClick={() => onSetTurno(esp.id, t)}
                            className={`flex-1 text-[9px] py-1 rounded uppercase tracking-wider font-bold ${
                              turno === t ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300"
                            }`}
                          >
                            {t.replace("Turno ", "").replace("Día Completo", "Día")}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div>
                          <div className="text-emerald-300 font-black text-lg tabular-nums">
                            ${precio.toLocaleString("es-MX")}
                          </div>
                          <div className="text-[9px] text-slate-400 uppercase tracking-widest">
                            MXN · {turno === "Día Completo" ? "por día" : "por turno"}
                          </div>
                        </div>
                        {enCarrito ? (
                          <button
                            data-testid={`remove-${esp.id}`}
                            onClick={() => onRemoveEspacio(enCarrito.key)}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest"
                          >
                            ✕ Quitar
                          </button>
                        ) : (
                          <button
                            data-testid={`add-${esp.id}`}
                            onClick={() => onAddEspacio(esp, turno, precio)}
                            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-950"
                            style={{ background: zonaColor }}
                          >
                            + Agregar
                          </button>
                        )}
                      </div>
                    </>
                  )}
                  {!disponible && (
                    <div className="mt-2 text-[10px] text-slate-400 italic">
                      No disponible para reservar actualmente.
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Leyenda flotante */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur border border-slate-700 rounded-xl p-3 text-[10px] font-mono space-y-1">
        <div className="font-black text-[11px] text-slate-100 mb-1 uppercase tracking-widest">Leyenda zonas</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ background: COLOR_GENERAL }}></span>
          <span style={{ color: COLOR_GENERAL }}>Pase General · Norte</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded" style={{ background: COLOR_VIP }}></span>
          <span style={{ color: COLOR_VIP }}>Pase VIP · Sur</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-700">
          <span className="text-base">🏊</span>
          <span className="text-slate-300">Alberca por zona</span>
        </div>
      </div>
    </div>
  );
}
