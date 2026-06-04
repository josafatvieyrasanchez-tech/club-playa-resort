import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";

// Página de ticket pública (a la que apunta el QR)
// El payload viaja en base64 dentro de la URL, así no depende del navegador donde se generó.
export default function TicketPage() {
  const { payload } = useParams();
  const navigate = useNavigate();

  let ticket = null;
  try {
    const decoded = atob(decodeURIComponent(payload));
    ticket = JSON.parse(decoded);
  } catch {
    ticket = null;
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/30 rounded-2xl p-8 text-center">
          <div className="text-5xl mb-3">⚠️</div>
          <h1 className="text-xl font-black">Ticket inválido</h1>
          <p className="text-sm text-slate-400 mt-2">
            El código escaneado no es válido o ha expirado.
          </p>
          <button
            data-testid="ticket-go-home"
            onClick={() => navigate("/")}
            className="mt-6 px-5 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl"
          >
            Ir al inicio
          </button>
        </div>
      </div>
    );
  }

  const url = window.location.href;
  const fecha = new Date(ticket.fechaCreacion);

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 text-slate-100">
      <div className="max-w-2xl mx-auto bg-white text-slate-900 rounded-3xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-6 text-slate-950">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold">GALDIJO BEACH CLUB</div>
              <h1 className="text-3xl font-black mt-1">Ticket Digital</h1>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-widest">Reservación</div>
              <div className="font-mono font-black">{ticket.id}</div>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 border-b border-slate-200 flex items-start justify-between gap-6">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">Titular</div>
            <div className="font-bold text-lg">{ticket.cliente?.nombre || "—"}</div>
            <div className="text-sm text-slate-500">{ticket.cliente?.correo}</div>
            {ticket.fechaReservacion && (
              <>
                <div className="mt-3 text-[10px] uppercase tracking-widest text-emerald-600 font-black">
                  📅 Fecha de visita
                </div>
                <div className="text-base font-black capitalize">
                  {new Date(ticket.fechaReservacion + "T12:00:00").toLocaleDateString("es-MX", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </div>
              </>
            )}
            <div className="mt-3 text-[10px] uppercase tracking-widest text-slate-500">Emitido</div>
            <div className="text-sm font-mono">{fecha.toLocaleString("es-MX")}</div>
            <div className="mt-3">
              <span
                className={`px-3 py-1 text-[10px] font-black rounded-full ${
                  ticket.tipo === "pago" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}
              >
                {ticket.tipo === "pago" ? "PAGADO" : "APARTADO"}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
            <QRCodeSVG value={url} size={140} level="M" />
            <div className="text-[9px] text-center text-slate-500 mt-1 font-mono">SCAN ME</div>
          </div>
        </div>

        <div className="px-8 py-6">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Items reservados</div>
          <div className="space-y-3" data-testid="ticket-items">
            {ticket.items.map((it, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-dashed border-slate-200 pb-2">
                <div>
                  <div className="font-bold text-sm">
                    {it.tipo === "pase" ? it.item.tipo : it.item.categoria} · {it.item.playaNombre}
                  </div>
                  <div className="text-xs text-slate-500">
                    {it.item.nombre}
                    {it.tipo === "espacio" ? ` · ${it.turno}` : it.item.cantidad > 1 ? ` × ${it.item.cantidad}` : ""}
                  </div>
                </div>
                <div className="font-black tabular-nums">${it.precio.toLocaleString("es-MX")}</div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between bg-slate-900 text-white px-5 py-4 rounded-2xl">
            <div className="text-xs uppercase tracking-widest">Total</div>
            <div className="text-2xl font-black tabular-nums">
              ${ticket.total.toLocaleString("es-MX")} <span className="text-xs">{ticket.currency || "MXN"}</span>
            </div>
          </div>

          <div className="mt-4 text-[10px] text-slate-500 leading-relaxed">
            Presenta este ticket impreso o en pantalla en la entrada de GALDIJO Beach Club el día de tu reserva.
            El código QR contiene el comprobante criptográfico de tu compra.
          </div>
        </div>

        <div className="px-8 py-4 bg-slate-50 flex items-center justify-between gap-3 no-print">
          <button
            data-testid="ticket-print-btn"
            onClick={() => window.print()}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-bold uppercase tracking-widest rounded-lg"
          >
            🖨️ Imprimir
          </button>
          <button
            data-testid="ticket-back-btn"
            onClick={() => navigate("/")}
            className="px-4 py-2 bg-cyan-500 text-slate-950 text-xs font-bold uppercase tracking-widest rounded-lg"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    </div>
  );
}
