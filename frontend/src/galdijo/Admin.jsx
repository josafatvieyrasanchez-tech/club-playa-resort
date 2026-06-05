import React, { useMemo, useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// =======================
// HELPERS
// =======================
const fmt = (n) => `$${(n || 0).toLocaleString("es-MX")}`;
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

const downloadFile = (filename, content, mime = "text/csv;charset=utf-8") => {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  setTimeout(() => URL.revokeObjectURL(url), 5000);
};

// =======================
// PANEL ADMIN
// =======================
export default function PanelAdmin() {
  const [reservas, setReservas] = useState([]);
  const [detalles, setDetalles] = useState([]);
  const [espacios, setEspacios] = useState({});

  const [rangoDias, setRangoDias] = useState(7);
  const [filtroStatus, setFiltroStatus] = useState("all");

  // =======================
  // FETCH BACKEND REAL
  // =======================
  useEffect(() => {
    fetch("https://club-playa-resort-app-2026.azurewebsites.net/api/admin/datos")
      .then((res) => res.json())
      .then((data) => {
        setReservas(data.reservas || []);
        setDetalles(data.detalles || []);

        const mapa = {};
        (data.espacios || []).forEach((e) => {
          if (!mapa[e.Playa]) mapa[e.Playa] = [];
          mapa[e.Playa].push({
            id: e.ID,
            categoria: e.Categoria,
            precio: e.Precio,
            estado: e.Estado,
          });
        });

        setEspacios(mapa);
      });
  }, []);

  // =======================
  // FILTROS BASE
  // =======================
  const reservasFiltradas = useMemo(() => {
    return reservas.filter(
      (r) => filtroStatus === "all" || r.Estatus === filtroStatus
    );
  }, [reservas, filtroStatus]);

  const reservasConfirmadas = reservas.filter(
    (r) => r.Estatus === "confirmed" || r.Estatus === "checked_in"
  );

  // =======================
  // OCUPACIÓN
  // =======================
  const ocupacionPorDia = useMemo(() => {
    const dias = lastNDays(rangoDias);

    return dias.map((d) => {
      const count = reservasConfirmadas.filter(
        (r) => r.FechaVisita?.slice(0, 10) === d
      ).length;

      return {
        fecha: d.slice(5),
        ocupados: count,
      };
    });
  }, [reservasConfirmadas, rangoDias]);

  // =======================
  // INGRESOS
  // =======================
  const ingresosPorDia = useMemo(() => {
    const dias = lastNDays(rangoDias);

    return dias.map((d) => {
      const total = reservas
        .filter((r) => r.Estatus === "confirmed" || r.Estatus === "checked_in")
        .filter((r) => r.FechaVisita?.slice(0, 10) === d)
        .reduce((acc, r) => acc + (Number(r.Total) || 0), 0);

      return {
        fecha: d.slice(5),
        ingreso: total,
      };
    });
  }, [reservas, rangoDias]);

  const ingresoTotal = ingresosPorDia.reduce((a, b) => a + b.ingreso, 0);

  // =======================
  // CSV (CORREGIDO)
  // =======================
  const buildCSV = () => {
    const headers = [
      "ID",
      "ReservaID",
      "Correo",
      "FechaVisita",
      "Total",
      "Productos",
    ];

    const rows = reservas.map((r) => {
      const productos = detalles
        .filter((d) => d.ReservaID === r.ID)
        .map((d) => `${d.nombre} x${d.Cantidad}`)
        .join(" | ");

      return [
        r.ID,
        r.ID,
        r.correo,
        r.FechaVisita,
        r.Total,
        productos,
      ];
    });

    return [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  };

  const exportCSV = () => {
    downloadFile(`reservas_${todayKey()}.csv`, buildCSV());
  };

  // =======================
  // UI
  // =======================
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-white">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h2 className="text-3xl font-black">Panel Admin</h2>

        <button
          onClick={exportCSV}
          className="bg-emerald-500 text-black px-4 py-2 rounded"
        >
          Descargar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900 p-4 rounded">
          <p>Ingresos</p>
          <h2 className="text-2xl">{fmt(ingresoTotal)}</h2>
        </div>

        <div className="bg-slate-900 p-4 rounded">
          <p>Reservas</p>
          <h2 className="text-2xl">{reservas.length}</h2>
        </div>
      </div>

      {/* GRAFICAS */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">

        <div className="bg-slate-900 p-4 rounded">
          <h3>Ocupación</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={ocupacionPorDia}>
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Line dataKey="ocupados" stroke="#22d3ee" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-900 p-4 rounded">
          <h3>Ingresos</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ingresosPorDia}>
              <XAxis dataKey="fecha" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ingreso" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* FILTRO */}
      <select
        className="bg-slate-800 p-2 rounded mb-4"
        value={filtroStatus}
        onChange={(e) => setFiltroStatus(e.target.value)}
      >
        <option value="all">Todas</option>
        <option value="pending">Pendientes</option>
        <option value="confirmed">Confirmadas</option>
        <option value="cancelled">Canceladas</option>
        <option value="checked_in">Check-in</option>
      </select>

      {/* TABLA RESERVAS */}
      <div className="bg-slate-900 p-4 rounded">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-400">
              <th>ID</th>
              <th>Correo</th>
              <th>Fecha</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            {reservasFiltradas.map((r) => (
              <tr key={r.ID} className="border-t border-slate-700">
                <td>{r.ID}</td>
                <td>{r.correo}</td>
                <td>{r.FechaVisita?.slice(0, 10)}</td>
                <td>{fmt(r.Total)}</td>
                <td>{r.Estatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
