import React, { useState, useEffect, useRef } from "react";
import BeachMap from "./BeachMap";
import { QRCodeSVG } from "qrcode.react";
import {
  PAYPAL_CLIENT_ID,
  PASES_BEACH_CLUB,
  AMENIDADES_POR_PLAYA,
  playasCancun,
  IMG_CABANA_NORMAL,
  IMG_CABANA_PREMIUM,
  IMG_PALAPA,
  IMG_CAMASTRO,
} from "./data";

// ============================================================
// Lista de playas
// ============================================================
export function ListaPlayas({ setPlaya }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400 mb-3">Destinos Exclusivos</div>
      <h2 className="text-4xl md:text-5xl font-black text-slate-100 leading-tight">
        Comienza tu experiencia <span className="text-cyan-400">GALDIJO</span>
      </h2>
      <p className="text-slate-400 mt-3 max-w-2xl">
        Selecciona el ecosistema playero. Cada locación incluye pases Beach Club General y VIP con amenidades
        diferenciadas y un mapa geolocalizado de tus espacios.
      </p>
      <div className="grid md:grid-cols-2 gap-6 mt-10">
        {playasCancun.map((p) => (
          <div
            key={p.id}
            data-testid={`playa-card-${p.id}`}
            onClick={() => setPlaya(p.id)}
            className="group relative bg-slate-900/40 rounded-3xl border border-slate-800/80 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10"
          >
            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={p.imagen}
                alt={p.nombre}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-300 bg-cyan-500/10 px-2 py-1 rounded">
                  {p.tag}
                </span>
                <span className="text-xl">{p.icono}</span>
              </div>
              <h3 className="text-2xl font-black text-slate-100 mt-3">{p.nombre}</h3>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">{p.descripcion}</p>
              <div className="mt-4 text-xs font-mono text-cyan-300">Ver pases y mapa →</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// Galería visual de tipos de espacios (referencia para el cliente)
// ============================================================
function GaleriaEspacios() {
  const items = [
    { img: IMG_CABANA_NORMAL, titulo: "Cabaña Normal", desc: "Sombra privada, hamaca y servicio básico." },
    { img: IMG_CABANA_PREMIUM, titulo: "Cabaña Premium", desc: "Cabaña climatizada, mobiliario lujo y mayordomo." },
    { img: IMG_PALAPA, titulo: "Palapa Imperial", desc: "Palapa para grupos, mesa central y sombrilla XL." },
    { img: IMG_CAMASTRO, titulo: "Camastro Balinés", desc: "Camastro doble con cojines y cortinas premium." },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {items.map((it) => (
        <div key={it.titulo} className="bg-slate-900/60 rounded-2xl overflow-hidden border border-slate-800">
          <img src={it.img} alt={it.titulo} className="w-full h-24 object-cover" />
          <div className="p-3">
            <div className="text-[10px] uppercase tracking-widest text-cyan-400 font-mono">{it.titulo}</div>
            <div className="text-[11px] text-slate-400 mt-1 leading-snug">{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Vista detalle de la playa (pases + mapa)
// ============================================================
export function VistaPlaya({
  playaId,
  mapasEstado,
  carrito,
  reservas,
  fechaReserva,
  setFechaReserva,
  agregarAlCarrito,
  quitarDelCarrito,
  onVolver,
  onIrCarrito,
}) {
  const playa = playasCancun.find((p) => p.id === playaId);
  const amenidades = AMENIDADES_POR_PLAYA[playaId];
  const [turnoEspacio, setTurnoEspacio] = useState({});
  const [cantidadPase, setCantidadPase] = useState({ "pase-general": 1, "pase-vip": 1 });

  // IDs de espacios ocupados en la fecha seleccionada para esta playa
  const ocupadosEnFecha = React.useMemo(() => {
    const set = new Set();
    reservas.forEach((r) => {
      if (r.status === "cancelled") return;
      if (r.fechaReservacion !== fechaReserva) return;
      r.items.forEach((it) => {
        if (it.tipo === "espacio" && it.playaId === playaId) set.add(it.item.id);
      });
    });
    return set;
  }, [reservas, fechaReserva, playaId]);

  // Espacios con estado dinámico para la fecha
  const espaciosEnFecha = React.useMemo(
    () =>
      mapasEstado[playaId].map((esp) => {
        if (esp.estado === "bloqueado") return esp; // mantenimiento global
        return {
          ...esp,
          estado: ocupadosEnFecha.has(esp.id) ? "reservado" : "disponible",
        };
      }),
    [mapasEstado, playaId, ocupadosEnFecha]
  );

  const agregarPase = (pase) => {
    const cant = cantidadPase[pase.id] || 1;
    const key = `${playaId}-${pase.id}-${Date.now()}`;
    agregarAlCarrito({
      key,
      playaId,
      tipo: "pase",
      item: { ...pase, cantidad: cant, playaNombre: playa.nombre },
      turno: "Día Completo",
      precio: pase.precio * cant,
      fechaReservacion: fechaReserva,
    });
  };

  const agregarEspacio = (esp, turno, precio) => {
    const key = `${playaId}-${esp.id}-${turno}`;
    if (carrito.find((c) => c.key === key)) return;
    agregarAlCarrito({
      key,
      playaId,
      tipo: "espacio",
      item: { ...esp, playaNombre: playa.nombre },
      turno,
      precio,
      fechaReservacion: fechaReserva,
    });
  };

  const minDate = new Date().toISOString().slice(0, 10);
  const fechaLabel = new Date(fechaReserva + "T12:00:00").toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <button
        data-testid="back-to-playas"
        onClick={onVolver}
        className="text-xs font-mono text-cyan-400 hover:text-cyan-200 mb-4"
      >
        ← Regresar a Locaciones
      </button>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-400">{playa.tag}</div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-100">
            {playa.nombre} <span className="text-cyan-400">· GALDIJO</span>
          </h2>
        </div>
        {carrito.length > 0 && (
          <button
            data-testid="open-cart-floating"
            onClick={onIrCarrito}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black px-5 py-3 rounded-xl text-xs uppercase tracking-widest shadow-lg"
          >
            🛒 Ver Carrito ({carrito.length})
          </button>
        )}
      </div>

      {/* SELECTOR DE FECHA DE RESERVA */}
      <div
        data-testid="fecha-reserva-bar"
        className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-between gap-3"
      >
        <div>
          <div className="text-[10px] uppercase tracking-[0.25em] font-mono text-cyan-300">
            📅 Fecha de tu visita
          </div>
          <div className="text-lg font-black text-slate-100 capitalize mt-0.5">{fechaLabel}</div>
        </div>
        <div className="flex items-center gap-2">
          <input
            data-testid="fecha-reserva-input"
            type="date"
            min={minDate}
            value={fechaReserva}
            onChange={(e) => {
              if (carrito.length > 0) {
                if (
                  !window.confirm(
                    "Cambiar la fecha vaciará tu carrito actual. ¿Continuar?"
                  )
                )
                  return;
                carrito.forEach((c) => quitarDelCarrito(c.key));
              }
              setFechaReserva(e.target.value);
            }}
            className="bg-slate-950 border border-cyan-500/40 rounded-xl px-3 py-2 text-slate-100 text-sm font-mono focus:outline-none focus:border-cyan-300"
          />
        </div>
      </div>

      {/* PASES */}
      <h3 className="text-xl font-black text-slate-100 mb-1">Pases Beach Club · {playa.nombre}</h3>
      <p className="text-xs text-slate-400 mb-4">
        Comienza eligiendo tu pase. Aplica para todas las playas pero las amenidades incluidas varían por locación.
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-12">
        {PASES_BEACH_CLUB.map((pase) => {
          const isVip = pase.id === "pase-vip";
          const lista = isVip ? amenidades.vip : amenidades.general;
          return (
            <div
              key={pase.id}
              data-testid={`pase-card-${pase.id}`}
              className={`p-5 rounded-2xl border ${
                isVip ? "border-amber-500/40 bg-amber-500/5" : "border-emerald-500/40 bg-emerald-500/5"
              }`}
            >
              <div className="text-[10px] uppercase tracking-widest font-mono">{pase.tipo}</div>
              <div className="font-black text-lg text-slate-100 mt-1">{pase.nombre}</div>
              <div className="text-3xl font-black mt-2 text-slate-100 tabular-nums">
                ${pase.precio} <span className="text-xs text-slate-400">MXN / día por persona</span>
              </div>
              <ul className="mt-3 space-y-1 text-xs text-slate-300">
                {lista.map((a, i) => (
                  <li key={i}>
                    <span className="text-cyan-300 mr-1">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 mt-4">
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-1">
                  <button
                    data-testid={`dec-${pase.id}`}
                    onClick={() =>
                      setCantidadPase((p) => ({
                        ...p,
                        [pase.id]: Math.max(1, (p[pase.id] || 1) - 1),
                      }))
                    }
                    className="text-slate-300 font-black w-6 h-6 hover:bg-slate-800 rounded"
                  >
                    −
                  </button>
                  <span className="px-2 font-black text-slate-100">{cantidadPase[pase.id] || 1}</span>
                  <button
                    data-testid={`inc-${pase.id}`}
                    onClick={() =>
                      setCantidadPase((p) => ({ ...p, [pase.id]: (p[pase.id] || 1) + 1 }))
                    }
                    className="text-slate-300 font-black w-6 h-6 hover:bg-slate-800 rounded"
                  >
                    +
                  </button>
                </div>
                <button
                  data-testid={`add-pase-${pase.id}`}
                  onClick={() => agregarPase(pase)}
                  className={`flex-1 font-black py-2.5 rounded-lg text-xs uppercase tracking-widest active:scale-95 ${
                    isVip ? "bg-amber-500 text-slate-950" : "bg-emerald-500 text-slate-950"
                  }`}
                >
                  + Agregar al Carrito
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MAPA */}
      <h3 className="text-xl font-black text-slate-100 mb-1">
        Mapa Geolocalizado · Cabañas, Palapas y Camastros
      </h3>
      <p className="text-xs text-slate-400 mb-4">
        Haz click en cualquier ícono del mapa para ver foto, precio, elegir turno y agregarlo al carrito.
      </p>
      <GaleriaEspacios />
      <BeachMap
        playa={playa}
        espacios={espaciosEnFecha}
        carrito={carrito}
        onAddEspacio={agregarEspacio}
        onRemoveEspacio={quitarDelCarrito}
        turnoMap={turnoEspacio}
        onSetTurno={(id, t) => setTurnoEspacio((p) => ({ ...p, [id]: t }))}
      />

      <div className="flex flex-wrap gap-3 mt-4 text-[10px] font-mono">
        <span className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300">● Disponible</span>
        <span className="px-2 py-1 rounded bg-cyan-500/20 text-cyan-300">● En carrito</span>
        <span className="px-2 py-1 rounded bg-red-500/20 text-red-300">● Reservado</span>
        <span className="px-2 py-1 rounded bg-purple-500/20 text-purple-300">● Apartado</span>
        <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300">● Mantenimiento</span>
      </div>

      {carrito.length > 0 && (
        <div className="sticky bottom-4 mt-8 z-30">
          <button
            data-testid="cart-cta-bottom"
            onClick={onIrCarrito}
            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black py-4 rounded-2xl text-sm uppercase tracking-widest shadow-2xl"
          >
            🛒 Ver Carrito ({carrito.length}) · Continuar →
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Carrito
// ============================================================
export function VistaCarrito({ carrito, totalCarrito, quitarDelCarrito, onVolver, onApartar, onPagar }) {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <button
        data-testid="back-to-playa"
        onClick={onVolver}
        className="text-xs font-mono text-cyan-400 hover:text-cyan-200 mb-4"
      >
        ← Continuar comprando
      </button>
      <h2 className="text-3xl font-black text-slate-100">Tu Carrito</h2>
      {carrito.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-10 text-center mt-6">
          <div className="text-5xl mb-3">🛒</div>
          <p className="text-slate-400">Tu carrito está vacío. Selecciona pases y espacios.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3 mt-6" data-testid="cart-items">
            {carrito.map((c) => (
              <div
                key={c.key}
                className="flex items-center justify-between bg-slate-900/40 border border-slate-800 rounded-xl p-4"
              >
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-cyan-300 font-mono">
                    {c.tipo === "pase" ? c.item.tipo : c.item.categoria} · {c.item.playaNombre}
                  </div>
                  <div className="font-bold text-slate-100">
                    {c.item.nombre}
                    {c.tipo === "pase" && c.item.cantidad > 1 ? ` × ${c.item.cantidad}` : ""}
                  </div>
                  <div className="text-xs text-slate-400">
                    {c.tipo === "espacio" ? `Turno: ${c.turno}` : "Acceso día completo"}
                  </div>
                  {c.fechaReservacion && (
                    <div className="text-[10px] text-cyan-300 font-mono mt-0.5">
                      📅{" "}
                      {new Date(c.fechaReservacion + "T12:00:00").toLocaleDateString("es-MX", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="font-black text-slate-100 tabular-nums">
                      ${c.precio.toLocaleString("es-MX")}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-widest">
                      {c.tipo === "espacio" && c.turno !== "Día Completo" ? "/turno" : "/día"}
                    </div>
                  </div>
                  <button
                    data-testid={`remove-cart-${c.key}`}
                    onClick={() => quitarDelCarrito(c.key)}
                    className="text-red-400 hover:text-red-300 text-xl"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 bg-slate-900 border border-cyan-500/30 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-widest text-slate-400">Total Neto</div>
              <div className="text-3xl font-black text-cyan-300 tabular-nums">
                ${totalCarrito.toLocaleString("es-MX")} <span className="text-xs text-slate-400">MXN</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <button
                data-testid="apartar-btn"
                onClick={onApartar}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-black py-3 px-5 rounded-xl text-xs uppercase tracking-widest border border-amber-500/30"
              >
                📌 Apartar (48 hrs)
              </button>
              <button
                data-testid="pagar-btn"
                onClick={onPagar}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black py-3 px-5 rounded-xl text-xs uppercase tracking-widest"
              >
                💳 Pagar Ahora
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-3">
              📌 Apartar reserva los espacios sin pago. Vence en 48 horas si no se completa el pago.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Formulario PAGO con PayPal SDK
// ============================================================
export function FormularioPago({ datosCliente, setDatosCliente, carrito, totalCarrito, onCancelar, onPagoExitoso }) {
  const paypalRef = useRef(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (window.paypal) {
      setSdkReady(true);
      return;
    }
    const existing = document.getElementById("paypal-sdk-galdijo");
    if (existing) {
      existing.addEventListener("load", () => setSdkReady(true));
      return;
    }
    const script = document.createElement("script");
    script.id = "paypal-sdk-galdijo";
    script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=MXN&enable-funding=card&components=buttons`;
    script.async = true;
    script.onload = () => setSdkReady(true);
    script.onerror = () => setError("No se pudo cargar PayPal SDK. Revisa tu conexión.");
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !paypalRef.current) return;
    paypalRef.current.innerHTML = "";
    const baseOrder = (actions) =>
      actions.order.create({
        purchase_units: [
          {
            amount: { value: totalCarrito.toFixed(2), currency_code: "MXN" },
            description: `GALDIJO Beach Club - ${carrito.length} items`,
          },
        ],
      });
    const onApprove = (label) => (data, actions) =>
      actions.order.capture().then((details) => {
        const nombre = details.payer?.name?.given_name || "Cliente";
        alert(`¡Pago exitoso con ${label}, ${nombre}!`);
        onPagoExitoso(details);
      });

    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "blue", shape: "pill", label: "paypal", height: 48 },
        fundingSource: window.paypal.FUNDING.PAYPAL,
        createOrder: (d, a) => baseOrder(a),
        onApprove: onApprove("PayPal"),
        onError: (e) => {
          console.error(e);
          setError("Error en el pago con PayPal.");
        },
      })
      .render(paypalRef.current);

    if (window.paypal.FUNDING.CARD) {
      window.paypal
        .Buttons({
          style: { layout: "vertical", color: "black", shape: "pill", label: "pay", height: 48 },
          fundingSource: window.paypal.FUNDING.CARD,
          createOrder: (d, a) => baseOrder(a),
          onApprove: onApprove("tarjeta"),
          onError: (e) => {
            console.error(e);
            setError("Error en el pago con tarjeta.");
          },
        })
        .render(paypalRef.current);
    }
  }, [sdkReady, totalCarrito]);

  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <button
        data-testid="back-to-cart"
        onClick={onCancelar}
        className="text-xs font-mono text-cyan-400 hover:text-cyan-200 mb-4"
      >
        ← Volver al carrito
      </button>
      <h2 className="text-3xl font-black text-slate-100">Confirmación de Orden</h2>
      <div className="text-[10px] uppercase tracking-widest text-amber-300 mt-1">PAYPAL · SANDBOX</div>

      <div className="grid md:grid-cols-2 gap-3 mt-6">
        <label className="text-xs text-slate-300">
          Titular
          <input
            data-testid="pay-nombre"
            value={datosCliente.nombre}
            onChange={(e) => setDatosCliente({ ...datosCliente, nombre: e.target.value })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
        </label>
        <label className="text-xs text-slate-300">
          Correo
          <input
            data-testid="pay-correo"
            value={datosCliente.correo}
            onChange={(e) => setDatosCliente({ ...datosCliente, correo: e.target.value })}
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
        </label>
      </div>

      <div className="mt-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 space-y-2 text-sm text-slate-300">
        {carrito.map((c) => (
          <div key={c.key} className="flex justify-between">
            <span>
              {c.item.nombre}
              {c.tipo === "pase" && c.item.cantidad > 1 ? ` × ${c.item.cantidad}` : ""} ({c.item.playaNombre})
            </span>
            <span className="tabular-nums">${c.precio.toLocaleString("es-MX")}</span>
          </div>
        ))}
        <div className="flex justify-between pt-2 border-t border-slate-800 font-black text-slate-100 text-base">
          <span>Total a Pagar</span>
          <span className="tabular-nums">${totalCarrito.toLocaleString("es-MX")} MXN</span>
        </div>
      </div>

      <div className="mt-6">
        {!sdkReady && !error && (
          <div className="text-xs text-slate-400 text-center">Cargando PayPal...</div>
        )}
        <div ref={paypalRef}></div>
        {error && (
          <div className="text-red-400 text-xs mt-2 bg-red-500/10 rounded p-2 border border-red-500/30">
            {error}
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-500 mt-3 text-center">
        Procesado por PayPal Sandbox · PayPal o Tarjeta (débito/crédito)
      </p>
    </div>
  );
}

// ============================================================
// RECIBO QR (post pago) — el QR enlaza a /ticket/<payload>
// ============================================================
export function ReciboQR({ operacion, onFinalizar }) {
  // Construir payload base64 con todos los datos del ticket
  const payloadObj = {
    id: operacion.id,
    cliente: operacion.cliente,
    items: operacion.items,
    total: operacion.total,
    currency: "MXN",
    tipo: operacion.tipo,
    fechaReservacion: operacion.fechaReservacion,
    fechaCreacion: operacion.fechaCreacion,
  };
  const payload = encodeURIComponent(btoa(JSON.stringify(payloadObj)));
  const ticketUrl = `${window.location.origin}/ticket/${payload}`;

  return (
    <div className="max-w-md mx-auto px-6 py-12 text-center">
      <div className="text-5xl mb-3">✅</div>
      <h2 className="text-2xl font-black text-slate-100">Acceso Digital Emitido</h2>
      <p className="text-xs text-slate-400 mt-2">
        Enviamos la confirmación con token dinámico a:{" "}
        <span className="text-cyan-300">{operacion.cliente.correo || "sin correo"}</span>
      </p>

      <div className="mt-6 bg-white rounded-2xl p-5 inline-flex flex-col items-center" data-testid="qr-block">
        <QRCodeSVG value={ticketUrl} size={220} level="M" includeMargin={true} />
        <div className="text-[10px] text-slate-700 font-mono mt-2">{operacion.id}</div>
      </div>

      <div className="mt-6 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 text-left text-xs text-slate-300 space-y-1">
        <div>
          Titular: <span className="font-bold text-slate-100">{operacion.cliente.nombre}</span>
        </div>
        {operacion.fechaReservacion && (
          <div>
            📅 Fecha de visita:{" "}
            <span className="font-bold text-cyan-300 capitalize">
              {new Date(operacion.fechaReservacion + "T12:00:00").toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
        <div>
          Items: <span className="font-bold text-slate-100">{operacion.items.length}</span>
        </div>
        <div>
          Total: <span className="font-bold text-emerald-300">${operacion.total.toLocaleString("es-MX")} MXN</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 mt-6">
        <a
          data-testid="open-ticket-link"
          href={ticketUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-cyan-500 text-slate-950 font-black py-3 px-5 rounded-xl text-xs uppercase tracking-widest"
        >
          🎟️ Ver Ticket de Compra
        </a>
        <button
          data-testid="back-home-after-pay"
          onClick={onFinalizar}
          className="bg-slate-800 text-slate-200 font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-widest"
        >
          Volver al inicio
        </button>
      </div>
      <p className="text-[10px] text-slate-500 mt-4">
        Escanea el QR con tu teléfono para abrir el ticket completo.
      </p>
    </div>
  );
}

// ============================================================
// Apartado OK
// ============================================================
export function ApartadoOK({ operacion, onFinalizar }) {
  const vence = operacion.fechaVence ? new Date(operacion.fechaVence) : null;
  const payloadObj = {
    id: operacion.id,
    cliente: operacion.cliente,
    items: operacion.items,
    total: operacion.total,
    currency: "MXN",
    tipo: operacion.tipo,
    fechaReservacion: operacion.fechaReservacion,
    fechaCreacion: operacion.fechaCreacion,
  };
  const payload = encodeURIComponent(btoa(JSON.stringify(payloadObj)));
  const ticketUrl = `${window.location.origin}/ticket/${payload}`;
  return (
    <div className="max-w-md mx-auto px-6 py-12 text-center">
      <div className="text-5xl mb-3">📌</div>
      <h2 className="text-2xl font-black text-slate-100">Reservación Apartada</h2>
      <p className="text-sm text-slate-400 mt-2">Tus espacios y pases están apartados a tu nombre.</p>

      <div className="mt-6 bg-white rounded-2xl p-5 inline-flex flex-col items-center">
        <QRCodeSVG value={ticketUrl} size={180} level="M" />
        <div className="text-[10px] text-slate-700 font-mono mt-2">{operacion.id}</div>
      </div>

      <div className="mt-6 bg-slate-900/40 border border-amber-500/30 rounded-2xl p-4 text-left text-xs text-slate-300 space-y-1">
        <div>
          Titular: <span className="font-bold text-slate-100">{operacion.cliente.nombre}</span>
        </div>
        {operacion.fechaReservacion && (
          <div>
            📅 Fecha de visita:{" "}
            <span className="font-bold text-cyan-300 capitalize">
              {new Date(operacion.fechaReservacion + "T12:00:00").toLocaleDateString("es-MX", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        )}
        <div>
          Items apartados: <span className="font-bold text-slate-100">{operacion.items.length}</span>
        </div>
        <div>
          Total a pagar:{" "}
          <span className="font-bold text-amber-300">${operacion.total.toLocaleString("es-MX")} MXN</span>
        </div>
        {vence && (
          <div className="pt-2 mt-2 border-t border-slate-800">
            <span className="text-amber-300">⚠ Vence:</span>{" "}
            <span className="font-bold text-slate-100">
              {vence.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" })}
            </span>
          </div>
        )}
      </div>

      <a
        data-testid="open-ticket-apartado"
        href={ticketUrl}
        target="_blank"
        rel="noreferrer"
        className="block mt-4 bg-amber-500 text-slate-950 font-black py-3 px-5 rounded-xl text-xs uppercase tracking-widest"
      >
        🎟️ Ver Ticket de Apartado
      </a>
      <button
        data-testid="back-home-after-apartado"
        onClick={onFinalizar}
        className="mt-2 bg-slate-800 text-slate-200 font-bold py-3 px-5 rounded-xl text-xs uppercase tracking-widest w-full"
      >
        Volver al inicio
      </button>
    </div>
  );
}
