import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route} from "react-router-dom";

import {
  ADMIN_CREDENCIALES,
  CLIENTE_DEMO,
  generarEspaciosIniciales,
  loadEstados,
  saveEstados,
  loadReservas,
  saveReservas,
} from "./galdijo/data";
import { Landing, LoginCliente, RegistroCliente, LoginAdmin } from "./galdijo/Auth";
import { ListaPlayas, VistaPlaya, VistaCarrito, FormularioPago, ReciboQR, ApartadoOK } from "./galdijo/Client";
import PanelAdmin from "./galdijo/Admin";
import TicketPage from "./galdijo/Ticket";

// ============================================================
// SHELL Auth (RE-ENLAZADO Y CORREGIDO PARA QUE ARRANQUEN LOS BOTONES)
// ============================================================
function GaldijoShell() {
  const [usuario, setUsuario] = useState({ autenticado: false, rol: null, nombre: "", correo: "" });
  const [pantalla, setPantalla] = useState("landing");

  if (!usuario.autenticado) {
    // 1. LOGIN DE CLIENTES
    if (pantalla === "login-cliente")
      return (
        <LoginCliente
          setPantalla={setPantalla}
          CLIENTE_DEMO={CLIENTE_DEMO}
          onLogin={async (correo, password) => {
            try {
              const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, password, rol: 'cliente' })
              });
              if (response.ok) {
                const data = await response.json();
                setUsuario({ autenticado: true, rol: data.rol, nombre: data.nombre, correo: data.correo });
              } else {
                alert("Credenciales inválidas en la Base de Datos.");
              }
            } catch (err) {
              console.error("Error de login:", err);
              // Salvavidas local por si la API aún no está arriba en el backend, no congelar el botón demo
              if(correo === CLIENTE_DEMO.correo && password === CLIENTE_DEMO.password) {
                setUsuario({ autenticado: true, rol: "cliente", nombre: CLIENTE_DEMO.nombre, correo: CLIENTE_DEMO.correo });
              }
            }
          }}
        />
      );

    // 2. LOGIN DE ADMINISTRADORES
    if (pantalla === "login-admin")
      return (
        <LoginAdmin
          setPantalla={setPantalla}
          ADMIN_CREDENCIALES={ADMIN_CREDENCIALES}
          onLogin={async (correo, password) => {
            try {
              const response = await fetch('/api/usuarios/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, password, rol: 'admin' })
              });
              if (response.ok) {
                const data = await response.json();
                setUsuario({ autenticado: true, rol: data.rol, nombre: data.nombre, correo: data.correo });
              } else {
                alert("Credenciales de administrador inválidas.");
              }
            } catch (err) {
              console.error("Error de login admin:", err);
              // Salvavidas local para el administrador
              if(correo === ADMIN_CREDENCIALES.correo && password === ADMIN_CREDENCIALES.password) {
                setUsuario({ autenticado: true, rol: "admin", nombre: "Administrador", correo: ADMIN_CREDENCIALES.correo });
              }
            }
          }}
        />
      );

    // 3. REGISTRO DE NUEVOS CLIENTES
    if (pantalla === "registro")
      return (
        <RegistroCliente
          setPantalla={setPantalla}
          onLogin={async (rol, nombre, correo, password) => {
            try {
              const response = await fetch('/api/usuarios/registro', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rol, nombre, correo, password })
              });
              if (response.ok) {
                setUsuario({ autenticado: true, rol, nombre, correo });
              } else {
                alert("Error al registrar usuario en SQL Server.");
              }
            } catch (err) {
              console.error("Error de registro:", err);
              // Si falla la red, entra en modo contingencia para dejar probar la UI
              setUsuario({ autenticado: true, rol, nombre, correo });
            }
          }}
        />
      );

    return <Landing setPantalla={setPantalla} />;
  }

  return (
    <AplicacionPrincipal
      usuario={usuario}
      onLogout={() => {
        setUsuario({ autenticado: false, rol: null, nombre: "", correo: "" });
        setPantalla("landing");
      }}
    />
  );
}

// ============================================================
// App principal (Manejo de Estados Asíncronos de Azure)
// ============================================================
function AplicacionPrincipal({ usuario, onLogout }) {
  const [playaSeleccionada, setPlayaSeleccionada] = useState(null);
  const [vista, setVista] = useState("playas");
  const [carrito, setCarrito] = useState([]);
  const [datosCliente, setDatosCliente] = useState({ nombre: usuario.nombre, correo: usuario.correo });
  const [ultimaOperacion, setUltimaOperacion] = useState(null);
  const [fechaReserva, setFechaReserva] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });

  const [mapasEstado, setMapasEstado] = useState({});
  const [reservas, setReservas] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Carga inicial asíncrona desde Azure SQL
  useEffect(() => {
    async function fetchingData() {
      const estadosBD = await loadEstados();
      const reservasBD = await loadReservas();
      setMapasEstado(estadosBD || generarEspaciosIniciales());
      setReservas(reservasBD || []);
      setCargandoDatos(false);
    }
    fetchingData();
  }, []);

  useEffect(() => {
    if (!cargandoDatos) saveEstados(mapasEstado);
  }, [mapasEstado, cargandoDatos]);

  useEffect(() => {
    if (!cargandoDatos) saveReservas(reservas);
  }, [reservas, cargandoDatos]);

  if (cargandoDatos) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-xs tracking-widest">
        CONECTANDO CON GALDIJO SQL DATABASE...
      </div>
    );
  }

  const esAdmin = usuario.rol === "admin";

  const agregarAlCarrito = (item) =>
    setCarrito((prev) => (prev.find((x) => x.key === item.key) ? prev : [...prev, item]));
  const quitarDelCarrito = (key) => setCarrito((prev) => prev.filter((x) => x.key !== key));
  const limpiarCarrito = () => setCarrito([]);
  const totalCarrito = carrito.reduce((acc, x) => acc + x.precio, 0);

  const finalizarReserva = (tipoOperacion, paypalDetails = null) => {
    const ahora = new Date();
    const fechaVence = tipoOperacion === "apartado" ? new Date(Date.now() + 48 * 60 * 60 * 1000) : null;
    const status = tipoOperacion === "apartado" ? "pending" : "confirmed";

    const nueva = {
      id: "R-" + Date.now(),
      cliente: { ...datosCliente },
      items: [...carrito],
      total: totalCarrito,
      currency: "MXN",
      tipo: tipoOperacion,
      status,
      fechaReservacion: fechaReserva,
      fechaCreacion: ahora.toISOString(),
      fechaConfirmada: status === "confirmed" ? ahora.toISOString() : null,
      fechaCheckIn: null,
      fechaVence: fechaVence ? fechaVence.toISOString() : null,
      paymentRef: paypalDetails?.id || null,
    };
    setReservas((prev) => [nueva, ...prev]);
    setUltimaOperacion(nueva);
    limpiarCarrito();
    setVista(tipoOperacion === "apartado" ? "apartado-ok" : "recibo");
  };

  const alternarEstado = (playaId, elementoId) =>
    setMapasEstado((prev) => ({
      ...prev,
      [playaId]: prev[playaId].map((item) => {
        if (item.id !== elementoId) return item;
        const next = item.estado === "disponible" ? "bloqueado" : "disponible";
        return { ...item, estado: next };
      }),
    }));

  const setMantenimiento = (playaId, elementoId) =>
    setMapasEstado((prev) => ({
      ...prev,
      [playaId]: prev[playaId].map((item) =>
        item.id === elementoId ? { ...item, estado: item.estado === "bloqueado" ? "disponible" : "bloqueado" } : item
      ),
    }));

  const cambiarReserva = (reservaId, nuevoStatus) => {
    setReservas((prev) =>
      prev.map((r) => {
        if (r.id !== reservaId) return r;
        const upd = { ...r, status: nuevoStatus };
        if (nuevoStatus === "confirmed" && !r.fechaConfirmada) upd.fechaConfirmada = new Date().toISOString();
        if (nuevoStatus === "checked_in") upd.fechaCheckIn = new Date().toISOString();
        return upd;
      })
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-black text-slate-100">GAL<span className="text-cyan-400">DIJO</span></div>
            <div className="text-[9px] tracking-[0.4em] text-slate-500">BEACH · CLUB · CANCUN</div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-right hidden sm:block">
              <div className="text-slate-100 font-bold">{usuario.nombre}</div>
              <div className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">{usuario.rol}</div>
            </div>
            {!esAdmin && carrito.length > 0 && vista !== "carrito" && (
              <button onClick={() => setVista("carrito")} className="bg-cyan-500/10 border border-cyan-500/40 text-cyan-300 px-3 py-2 rounded-lg text-xs font-bold">
                🛒 {carrito.length}
              </button>
            )}
            <button onClick={onLogout} className="text-[10px] text-slate-400 hover:text-red-400 uppercase tracking-widest font-mono">Salir</button>
          </div>
        </div>
      </nav>

      {!esAdmin && vista === "playas" && <ListaPlayas setPlaya={(id) => { setPlayaSeleccionada(id); setVista("playa"); }} />}
      {!esAdmin && vista === "playa" && (
        <VistaPlaya playaId={playaSeleccionada} mapasEstado={mapasEstado} carrito={carrito} reservas={reservas} fechaReserva={fechaReserva} setFechaReserva={setFechaReserva} agregarAlCarrito={agregarAlCarrito} quitarDelCarrito={quitarDelCarrito} onVolver={() => setVista("playas")} onIrCarrito={() => setVista("carrito")} />
      )}
      {!esAdmin && vista === "carrito" && <VistaCarrito carrito={carrito} totalCarrito={totalCarrito} quitarDelCarrito={quitarDelCarrito} onVolver={() => setVista(playaSeleccionada ? "playa" : "playas")} onApartar={() => finalizarReserva("apartado")} onPagar={() => setVista("pago")} />}
      {!esAdmin && vista === "pago" && <FormularioPago datosCliente={datosCliente} setDatosCliente={setDatosCliente} carrito={carrito} totalCarrito={totalCarrito} onCancelar={() => setVista("carrito")} onPagoExitoso={(d) => finalizarReserva("pago", d)} />}
      {!esAdmin && vista === "recibo" && ultimaOperacion && <ReciboQR operacion={ultimaOperacion} onFinalizar={() => setVista("playas")} />}
      {!esAdmin && vista === "apartado-ok" && ultimaOperacion && <ApartadoOK operacion={ultimaOperacion} onFinalizar={() => setVista("playas")} />}

      {esAdmin && (
        <PanelAdmin mapasEstado={mapasEstado} reservas={reservas} onAlternarEstado={alternarEstado} onMaintenance={setMantenimiento} onCambiarReserva={cambiarReserva} />
      )}
    </div>
  );
}

// ============================================================
// Router root (AQUÍ ESTÁ TU RUTEADOR DE TICKETS COMPLETO)
// ============================================================
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GaldijoShell />} />
        <Route path="/ticket/:payload" element={<TicketPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
