import React, { useEffect, useMemo, useState } from "react";
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

// =========================
// HELPERS (los tuyos intactos)
// =========================
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

// =========================
// PANEL ADMIN CORREGIDO
// =========================
export default function PanelAdmin() {
  const [data, setData] = useState({
    reservas: [],
    detalles: [],
    espacios: [],
  });

  const [loading, setLoading] = useState(true);
  const [rangoDias, setRangoDias] = useState(7);

  // =========================
  // FETCH BACKEND REAL
  // =========================
  useEffect(() => {
    fetch("https://club-playa-resort-app-2026.azurewebsites.net/api/admin/datos")
      .then((res) => res.json())
      .then((d) => {
        setData({
          reservas: d.reservas || [],
          detalles: d.detalles || [],
          espacios: d.espacios || [],
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error admin:", err);
        setLoading(false);
      });
  }, []);

  const reservas = data.reservas;
  const espaciosRaw = data.espacios;

  // =========================
  // RECONSTRUIR MAPA (CRÍTICO)
  // =========================
  const mapasEstado = useMemo(() => {
    const mapa = {};

    espaciosRaw.forEach((e) => {
      if (!mapa[e.PlayaID]) mapa[e.PlayaID] = [];

      mapa[e.PlayaID].push({
        id: e.ID,
        categoria: e.Categoria,
        precio: e.Precio,
        estado: e.Estado,
      });
    });

    return mapa;
  }, [espaciosRaw]);

  // =========================
  // FILTROS SEGUROS
  // =========================
  const reservasConfirmadas = reservas.filter(
    (r) => r?.Estatus === "confirmed" || r?.Estatus === "checked_in"
  );

  const reservasPending = reservas.filter((r) => r?.Estatus === "pending");

  // =========================
  // KPIs ESTABLES
  // =========================
  const ingresosTotales = reservas.reduce(
    (acc, r) => acc + (Number(r.Total) || 0),
    0
  );

  const ocupacionHoy = reservasConfirmadas.length;

  const tasaConversion =
    reservas.length > 0
      ? Math.round((reservasConfirmadas.length / reservas.length) * 100)
      : 0;

  // =========================
  // CSV EXPORT (REAL BACKEND)
  // =========================
  const exportCSV = () => {
    window.open(
      "https://club-playa-resort-app-2026.azurewebsites.net/api/admin/export-reservas",
      "_blank"
    );
  };

  // =========================
  // LOADING SAFE
  // =========================
  if (loading) {
    return <div className="text-white p-10">Cargando panel admin...</div>;
  }

  // =========================
  // UI (TU PANEL RESTAURADO)
  // =========================
  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-slate-100">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-black">Consola de Control</h1>

        <button
          onClick={exportCSV}
          className="bg-emerald-500 text-black px-4 py-2 rounded font-bold"
        >
          Descargar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">

        <div className="bg-slate-900 p-4 rounded">
          <p>Ingresos</p>
          <b>{fmt(ingresosTotales)}</b>
        </div>

        <div className="bg-slate-900 p-4 rounded">
          <p>Reservas activas</p>
          <b>{reservas.length}</b>
        </div>

        <div className="bg-slate-900 p-4 rounded">
          <p>Conversión</p>
          <b>{tasaConversion}%</b>
        </div>

      </div>

      {/* RESERVAS */}
      <h2 className="font-bold mb-2">Reservas</h2>

      <table className="w-full text-sm mb-8">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Correo</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {reservas.map((r) => (
            <tr key={r.reservaId} className="border-t border-slate-800">
              <td>{r.reservaId}</td>
              <td>{r.nombre}</td>
              <td>{r.correo}</td>
              <td>{fmt(r.Total)}</td>
              <td>{r.Estatus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MAPA ESPACIOS */}
      <h2 className="font-bold mb-2">Mapa de Espacios</h2>

      <div className="space-y-4">
        {Object.entries(mapasEstado || {}).map(([playa, items]) => (
          <div key={playa} className="bg-slate-900 p-3 rounded">
            <h3 className="font-bold mb-2 capitalize">{playa}</h3>

            <div className="grid grid-cols-4 gap-2">
              {items.map((e) => (
                <div
                  key={e.id}
                  className="p-2 rounded bg-slate-800 text-xs"
                >
                  <div>{e.id}</div>
                  <div>{e.estado}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
