export default function PanelAdmin() {
  const [data, setData] = useState({
    reservas: [],
    detalles: [],
    espacios: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://club-playa-resort-app-2026.azurewebsites.net/api/admin/datos")
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error admin:", err);
        setLoading(false);
      });
  }, []);

  const reservas = data.reservas || [];
  const detalles = data.detalles || [];
  const espacios = data.espacios || [];

  // ======================
  // KPIs SEGUROS
  // ======================
  const ingresosTotales = reservas.reduce((acc, r) => acc + (r.Total || 0), 0);

  const pendientes = reservas.filter(r => r.Estatus === "pending").length;

  const confirmadas = reservas.filter(r =>
    r.Estatus === "confirmed" || r.Estatus === "checked_in"
  );

  // ======================
  // CSV EXPORT (BACKEND)
  // ======================
  const exportCSV = () => {
    window.open(
      "https://club-playa-resort-app-2026.azurewebsites.net/api/admin/export-reservas",
      "_blank"
    );
  };

  if (loading) {
    return <div className="text-white p-10">Cargando panel...</div>;
  }

  return (
    <div className="text-white p-6">

      <h1 className="text-2xl font-bold mb-4">Panel Admin</h1>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800 p-4 rounded">
          Ingresos<br />
          <b>${ingresosTotales}</b>
        </div>

        <div className="bg-slate-800 p-4 rounded">
          Pendientes<br />
          <b>{pendientes}</b>
        </div>

        <div className="bg-slate-800 p-4 rounded">
          Confirmadas<br />
          <b>{confirmadas.length}</b>
        </div>
      </div>

      {/* BOTÓN EXPORT */}
      <button
        onClick={exportCSV}
        className="bg-green-500 px-4 py-2 rounded text-black font-bold"
      >
        Descargar CSV
      </button>

      {/* RESERVAS */}
      <h2 className="mt-6 font-bold">Reservas</h2>

      <table className="w-full text-sm mt-2">
        <thead>
          <tr>
            <th>ID</th>
            <th>Correo</th>
            <th>Fecha</th>
            <th>Total</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {reservas.map(r => (
            <tr key={r.reservaId}>
              <td>{r.reservaId}</td>
              <td>{r.correo}</td>
              <td>{r.FechaVisita}</td>
              <td>{r.Total}</td>
              <td>{r.Estatus}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ESPACIOS */}
      <h2 className="mt-6 font-bold">Espacios</h2>

      <div className="grid grid-cols-4 gap-2">
        {espacios.map(e => (
          <div key={e.ID} className="bg-slate-800 p-2 rounded">
            {e.ID} - {e.Estado}
          </div>
        ))}
      </div>

    </div>
  );
}
