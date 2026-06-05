import React, { useMemo, useState, useEffect } from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

// --- Helpers (se mantienen igual) ---
const fmt = (n) => `$${(n || 0).toLocaleString("es-MX")}`;
const dateKey = (iso) => (iso ? new Date(iso).toISOString().slice(0, 10) : "—");
const todayKey = () => new Date().toISOString().slice(0, 10);
const lastNDays = (n) => {
  const arr = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
};

// --- Panel Admin ---
export default function PanelAdmin() {
  const [data, setData] = useState({ reservas: [], detalles: [], espacios: [] });
  const [rangoDias, setRangoDias] = useState(7);
  const [filtroStatus, setFiltroStatus] = useState("all");

  useEffect(() => {
    fetch("https://club-playa-resort-app-2026.azurewebsites.net/api/admin/datos")
      .then(res => res.json())
      .then(d => setData({
        reservas: d.reservas.map(r => ({
          ...r,
          id: r.ID,
          status: r.Estatus,
          total: r.Total,
          items: d.detalles.filter(dt => dt.ReservaID === r.ID)
        })),
        espacios: d.espacios
      }));
  }, []);

  const ejecutarAccion = async (url, body) => {
    await fetch(url, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body) 
    });
    window.location.reload();
  };

  const reservas = data.reservas;
  const mapasEstado = useMemo(() => {
    const mapa = {};
    data.espacios.forEach(e => {
      if (!mapa[e.PlayaID]) mapa[e.PlayaID] = [];
      mapa[e.PlayaID].push({ id: e.ID, categoria: e.Categoria, precio: e.Precio, estado: e.Estado.toLowerCase() });
    });
    return mapa;
  }, [data.espacios]);
  
  // ---- Cálculos KPIs ----
  const arrayEspacios = useMemo(() => Object.values(mapasEstado || {}).flat(), [mapasEstado]);
  const totalEspacios = arrayEspacios.length;

  const reservasConfirmadas = reservas.filter((r) => r.status === "confirmed" || r.status === "checked_in");
  const reservasPending = reservas.filter((r) => r.status === "pending");

  // KPI 1: ocupación por día de RESERVACIÓN
  const ocupacionPorDia = useMemo(() => {
    const dias = lastNDays(rangoDias);
    return dias.map((d) => {
      const count = reservasConfirmadas
        .filter((r) => (r.fechaReservacion || dateKey(r.fechaCreacion)) === d)
        .reduce((acc, r) => acc + r.items.filter((it) => it.tipo === "espacio").length, 0);
      return { fecha: d.slice(5), ocupados: count, pct: Math.round((count / totalEspacios) * 100) };
    });
  }, [reservasConfirmadas, rangoDias, totalEspacios]);

  const ocupacionHoy = ocupacionPorDia[ocupacionPorDia.length - 1] || { pct: 0, ocupados: 0 };

  // KPI 2: ingresos por día (basado en fechaReservacion = fecha de visita)
 const ingresosPorDia = useMemo(() => {
  // 1. Verificación de seguridad: si no hay reservas, devolver array vacío
  if (!reservas || !Array.isArray(reservas)) return [];

  const dias = lastNDays(rangoDias);
  return dias.map((d) => {
    const total = reservas
      .filter((r) => {
        // 2. Verificación de seguridad por objeto individual
        if (!r) return false;
        
        // Ajusta aquí los estados que SÍ consideras ingresos
        const estadosValidos = ["confirmed", "checked_in", "paid"];
        const esValido = estadosValidos.includes(r.status);
        
        // Coincidencia de fecha
        const fecha = (r.fechaReservacion || dateKey(r.fechaConfirmada || r.fechaCreacion)) === d;
        return esValido && fecha;
      })
      .reduce((acc, r) => {
        // 3. Conversión segura
        const monto = r.total ? parseFloat(r.total) : 0;
        return acc + monto;
      }, 0);
    
    return { fecha: d.slice(5), ingreso: total };
  });
}, [reservas, rangoDias]);
  const ingresoTotalPeriodo = ingresosPorDia.reduce((a, b) => a + b.ingreso, 0);

  // KPI 3: tasa de conversión por día de creación
  const conversionPorDia = useMemo(() => {
    const dias = lastNDays(rangoDias);
    return dias.map((d) => {
      const creadas = reservas.filter((r) => dateKey(r.fechaCreacion) === d).length;
      const conf = reservasConfirmadas.filter((r) => dateKey(r.fechaCreacion) === d).length;
      const tasa = creadas > 0 ? Math.round((conf / creadas) * 100) : 0;
      return { fecha: d.slice(5), tasa, total: creadas, conf };
    });
  }, [reservas, reservasConfirmadas, rangoDias]);
  const totalCreadas = reservas.length;
  const tasaGlobal = totalCreadas > 0 ? Math.round((reservasConfirmadas.length / totalCreadas) * 100) : 0;

  // KPI 4: top N espacios
  const topEspacios = useMemo(() => {
    const counter = {};
    reservasConfirmadas.forEach((r) =>
      r.items
        .filter((it) => it.tipo === "espacio")
        .forEach((it) => {
          counter[it.item.id] = (counter[it.item.id] || 0) + 1;
        })
    );
    return Object.entries(counter)
      .map(([id, n]) => ({ id, reservas: n }))
      .sort((a, b) => b.reservas - a.reservas)
      .slice(0, 8);
  }, [reservasConfirmadas]);

  // ---- Acciones ----
  const exportCSV = () => downloadFile(`galdijo_reservas_${todayKey()}.csv`, buildCSV(reservas));
  const exportXLS = () => {
    // Excel acepta CSV con BOM como xls aceptable. Genera .xls como tipo Excel-compatible CSV.
    const bom = "\uFEFF";
    downloadFile(
      `galdijo_reservas_${todayKey()}.xls`,
      bom + buildCSV(reservas),
      "application/vnd.ms-excel"
    );
  };

  // Filtros tabla
  const reservasFiltradas = reservas.filter(
    (r) => filtroStatus === "all" || r.status === filtroStatus
  );

  // Estadísticas espacios
  const totalReservados = arrayEspacios.filter((e) => e.estado === "reservado").length;
  const totalApartados = arrayEspacios.filter((e) => e.estado === "apartado").length;
  const totalBloqueados = arrayEspacios.filter((e) => e.estado === "bloqueado").length;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-slate-100">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-black">Consola de Control</h2>
          <p className="text-xs text-slate-400">Panel administrativo · datos en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            data-testid="admin-rango"
            value={rangoDias}
            onChange={(e) => setRangoDias(Number(e.target.value))}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono"
          >
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimos 14 días</option>
            <option value={30}>Últimos 30 días</option>
          </select>
          <button
            data-testid="export-csv-btn"
            onClick={exportCSV}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs uppercase tracking-widest"
          >
            ⬇ CSV
          </button>
          <button
            data-testid="export-xls-btn"
            onClick={exportXLS}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-4 py-2 rounded-lg text-xs uppercase tracking-widest"
          >
            ⬇ Excel
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KpiCard
          testid="kpi-ocupacion"
          label="Ocupación hoy"
          value={`${ocupacionHoy.pct}%`}
          sub={`${ocupacionHoy.ocupados}/${totalEspacios} espacios`}
          color="cyan"
        />
        <KpiCard
          testid="kpi-ingresos"
          label={`Ingresos · ${rangoDias} días`}
          value={fmt(ingresoTotalPeriodo)}
          sub={`MXN`}
          color="emerald"
        />
        <KpiCard
          testid="kpi-conversion"
          label="Conversión"
          value={`${tasaGlobal}%`}
          sub={`${reservasConfirmadas.length}/${totalCreadas} reservas`}
          color="amber"
        />
        <KpiCard
          testid="kpi-pending"
          label="Pendientes / Apartados"
          value={`${reservasPending.length}`}
          sub={`Bloqueados: ${totalBloqueados}`}
          color="purple"
        />
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <ChartCard title="Ocupación diaria (%)">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={ocupacionPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
              <Line type="monotone" dataKey="pct" stroke="#22d3ee" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Ingresos diarios (MXN)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={ingresosPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
              <Bar dataKey="ingreso" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Tasa de conversión diaria (%)">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={conversionPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="fecha" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
              <Bar dataKey="tasa" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Top espacios más reservados">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topEspacios} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis type="number" stroke="#64748b" fontSize={11} />
              <YAxis dataKey="id" type="category" stroke="#64748b" fontSize={10} width={80} />
              <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b" }} />
              <Bar dataKey="reservas" fill="#a855f7" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Reservas */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-black">Reservas registradas</h3>
          <select
            data-testid="filtro-status"
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
          >
            <option value="all">Todas</option>
            <option value="pending">Pendientes</option>
            <option value="confirmed">Confirmadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="checked_in">Check-in</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="reservas-table">
            <thead className="text-slate-400 uppercase tracking-widest">
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 px-2">ID</th>
                <th className="text-left py-2 px-2">Cliente</th>
                <th className="text-left py-2 px-2">Visita</th>
                <th className="text-left py-2 px-2">Creada</th>
                <th className="text-left py-2 px-2">Items</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reservasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-slate-500 py-6">
                    Sin reservaciones aún.
                  </td>
                </tr>
              )}
              {reservasFiltradas.map((r) => (
                <tr key={r.id} className="border-b border-slate-800/60">
                  <td className="py-2 px-2 font-mono text-cyan-300">{r.id}</td>
                  <td className="py-2 px-2">
                    {r.cliente?.nombre}
                    <div className="text-[10px] text-slate-500">{r.cliente?.correo}</div>
                  </td>
                  <td className="py-2 px-2 font-mono text-emerald-300">
                    {r.fechaReservacion || "—"}
                  </td>
                  <td className="py-2 px-2 font-mono text-slate-400">{dateKey(r.fechaCreacion)}</td>
                  <td className="py-2 px-2">{r.items.length}</td>
                  <td className="py-2 px-2 text-right tabular-nums font-bold">{fmt(r.total)}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${statusColor(r.status)}`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                      {r.status !== "confirmed" && r.status !== "checked_in" && (
                        <button
                          data-testid={`confirmar-${r.id}`}
                          onClick={() => onCambiarReserva(r.id, "confirmed")}
                          className="bg-emerald-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black"
                        >
                          ✓ Confirmar
                        </button>
                      )}
                      {r.status === "confirmed" && (
                        <button
                          data-testid={`checkin-${r.id}`}
                          onClick={() => onCambiarReserva(r.id, "checked_in")}
                          className="bg-cyan-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black"
                        >
                          ✔ Check-in
                        </button>
                      )}
                      {r.status !== "cancelled" && (
                        <button
                          data-testid={`cancelar-${r.id}`}
                          onClick={() => onCambiarReserva(r.id, "cancelled")}
                          className="bg-red-500 text-white px-2 py-0.5 rounded text-[10px] font-black"
                        >
                          ✕ Cancelar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Espacios mgmt */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
        <h3 className="font-black mb-3">Gestión de Espacios</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-3 text-[10px] font-mono">
          <div className="bg-emerald-500/10 text-emerald-300 rounded px-2 py-1">
            Disponibles: {arrayEspacios.filter((e) => e.estado === "disponible").length}
          </div>
          <div className="bg-red-500/10 text-red-300 rounded px-2 py-1">Reservados: {totalReservados}</div>
          <div className="bg-purple-500/10 text-purple-300 rounded px-2 py-1">Apartados: {totalApartados}</div>
          <div className="bg-amber-500/10 text-amber-300 rounded px-2 py-1">Bloqueados: {totalBloqueados}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" data-testid="espacios-table">
            <thead className="text-slate-400 uppercase tracking-widest">
              <tr className="border-b border-slate-800">
                <th className="text-left py-2 px-2">ID</th>
                <th className="text-left py-2 px-2">Playa</th>
                <th className="text-left py-2 px-2">Categoría</th>
                <th className="text-right py-2 px-2">Tarifa</th>
                <th className="text-left py-2 px-2">Estado</th>
                <th className="text-left py-2 px-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(mapasEstado).map(([playaId, lista]) =>
                lista.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800/60">
                    <td className="py-2 px-2 font-mono">{item.id}</td>
                    <td className="py-2 px-2 capitalize">{playaId}</td>
                    <td className="py-2 px-2">{item.categoria}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{fmt(item.precio)}</td>
                    <td className="py-2 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black ${estadoColor(item.estado)}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex gap-1">
                        <button
  data-testid={`toggle-${item.id}`}
  onClick={async () => {
    try {
      const response = await fetch('/api/admin/estado-espacio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productoId: item.id, 
          accion: item.estado === 'disponible' ? 'Bloquear' : 'Activar' 
        })
      });
      
      if (response.ok) {
        window.location.reload(); // Recarga para ver cambios reales[cite: 1]
      } else {
        alert("Error al actualizar la base de datos");
      }
    } catch (error) {
      console.error("Error de conexión:", error); //[cite: 1, 2]
      alert("No se pudo conectar con el servidor");
    }
  }}
  className="bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded text-[10px] text-white transition-colors"
>
  {item.estado === "disponible" ? "Desactivar" : "Activar"}
</button>
                        <button
                          data-testid={`maint-${item.id}`}
                          onClick={() => onMaintenance(playaId, item.id)}
                          className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold"
                        >
                          🔧 Mantenimiento
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, testid }) {
  const map = {
    cyan: "from-cyan-500/20 to-cyan-500/0 border-cyan-500/30 text-cyan-300",
    emerald: "from-emerald-500/20 to-emerald-500/0 border-emerald-500/30 text-emerald-300",
    amber: "from-amber-500/20 to-amber-500/0 border-amber-500/30 text-amber-300",
    purple: "from-purple-500/20 to-purple-500/0 border-purple-500/30 text-purple-300",
  };
  return (
    <div
      data-testid={testid}
      className={`bg-gradient-to-b ${map[color]} border rounded-2xl p-4`}
    >
      <div className="text-[10px] uppercase tracking-widest font-mono">{label}</div>
      <div className="text-3xl font-black mt-1 text-slate-100">{value}</div>
      <div className="text-[10px] text-slate-400 mt-1">{sub}</div>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-300 mb-2">{title}</div>
      {children}
    </div>
  );
}

function statusColor(s) {
  return {
    pending: "bg-amber-500/20 text-amber-300",
    confirmed: "bg-emerald-500/20 text-emerald-300",
    cancelled: "bg-red-500/20 text-red-300",
    checked_in: "bg-cyan-500/20 text-cyan-300",
  }[s] || "bg-slate-500/20 text-slate-300";
}
function estadoColor(s) {
  return {
    disponible: "bg-emerald-500/20 text-emerald-300",
    reservado: "bg-red-500/20 text-red-300",
    apartado: "bg-purple-500/20 text-purple-300",
    bloqueado: "bg-amber-500/20 text-amber-300",
  }[s] || "bg-slate-500/20 text-slate-300";
}

