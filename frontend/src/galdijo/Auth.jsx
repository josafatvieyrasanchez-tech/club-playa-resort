import React, { useState } from "react";

export function Landing({ setPantalla }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-5xl font-black tracking-tight text-slate-100">
          GAL<span className="text-cyan-400">DIJO</span>
        </div>
        <div className="text-[10px] tracking-[0.4em] text-slate-500 mt-1">BEACH · CLUB · CANCUN</div>
        <h1 className="mt-10 text-3xl font-black text-slate-100 leading-tight">
          La experiencia premium de playa en Cancún
        </h1>
        <p className="text-slate-400 text-sm mt-3">Selecciona tu acceso</p>
        <div className="flex flex-col gap-3 mt-8">
          <button
            data-testid="acceso-cliente-btn"
            onClick={() => setPantalla("login-cliente")}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black py-4 px-6 rounded-2xl text-sm uppercase tracking-[0.2em] shadow-2xl shadow-cyan-500/30"
          >
            🌴 Acceso Cliente
          </button>
          <button
            data-testid="acceso-admin-btn"
            onClick={() => setPantalla("login-admin")}
            className="bg-slate-950 border border-amber-500/40 text-amber-300 font-black py-4 px-6 rounded-2xl text-sm uppercase tracking-[0.2em]"
          >
            🔐 Acceso Admin
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-8">
          © {new Date().getFullYear()} · Beach Club GALDIJO · Cancún, MX
        </p>
      </div>
    </div>
  );
}

export function LoginCliente({ setPantalla, onLogin, CLIENTE_DEMO }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    setError("");
    if (correo === CLIENTE_DEMO.correo && password === CLIENTE_DEMO.password) {
      onLogin("cliente", CLIENTE_DEMO.nombre, CLIENTE_DEMO.correo);
      return;
    }
    const reg = JSON.parse(localStorage.getItem("galdijo_clientes") || "[]");
    const found = reg.find((c) => c.correo === correo && c.password === password);
    if (found) {
      onLogin("cliente", found.nombre, found.correo);
      return;
    }
    setError("Correo o contraseña incorrectos.");
  };
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <form onSubmit={submit} className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
        <button
          type="button"
          onClick={() => setPantalla("landing")}
          className="text-xs font-mono text-cyan-400 mb-6"
        >
          ← Volver
        </button>
        <h2 className="text-2xl font-black text-slate-100">Bienvenido</h2>
        <p className="text-xs text-slate-400 mt-1">Inicia sesión para reservar tu lugar</p>
        <label className="text-xs text-slate-300 block mt-5">
          Correo
          <input
            data-testid="login-cliente-correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="cliente@galdijo.com"
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
        </label>
        <label className="text-xs text-slate-300 block mt-3">
          Contraseña
          <input
            data-testid="login-cliente-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
          />
        </label>
        {error && (
          <div className="text-red-400 text-xs mt-3 bg-red-500/10 rounded p-2 border border-red-500/30">
            {error}
          </div>
        )}
        <button
          data-testid="login-cliente-submit"
          type="submit"
          className="mt-5 w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-widest"
        >
          Iniciar Sesión
        </button>
        <p className="text-xs text-slate-400 mt-4 text-center">
          ¿Sin cuenta?{" "}
          <button
            type="button"
            data-testid="ir-registro-btn"
            onClick={() => setPantalla("registro")}
            className="text-cyan-400 font-bold"
          >
            Regístrate
          </button>
        </p>
        <p className="text-[10px] text-slate-600 text-center mt-3 font-mono">
          demo: cliente@galdijo.com / Cliente2026!
        </p>
      </form>
    </div>
  );
}

export function RegistroCliente({ setPantalla, onLogin }) {
  const [form, setForm] = useState({ nombre: "", correo: "", password: "", password2: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    // Validaciones básicas en el frontend
    if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
    if (form.password.length < 6) return setError("Mínimo 6 caracteres.");
    if (form.password !== form.password2) return setError("Las contraseñas no coinciden.");

    setCargando(true);

    try {
      // Petición directa a la URL real del backend en Azure
      const response = await fetch('https://club-playa-resort-app-2026.azurewebsites.net/api/usuarios/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          nombre: form.nombre, 
          correo: form.correo, 
          password: form.password,
          rol: 'cliente',
          Rol: 'cliente' // Enviamos ambos por el nombre de la columna en tu Azure SQL
        })
      });

      if (response.ok) {
        // Si Azure guarda con éxito en SQL Server, iniciamos sesión en la app
        onLogin(form.nombre, form.correo, form.password);
      } else {
        const resultado = await response.json().catch(() => ({}));
        setError(resultado.mensaje || "Ese correo ya está registrado o los datos son inválidos.");
      }
    } catch (err) {
      console.error("Error al registrar cliente:", err);
      setError("Error al conectar con el servidor de Azure.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <form onSubmit={submit} className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
        <button
          type="button"
          onClick={() => setPantalla("login-cliente")}
          className="text-xs font-mono text-emerald-400 mb-6"
        >
          &larr; Volver al login
        </button>
        <h2 className="text-2xl font-black text-slate-100">Crear cuenta</h2>
        <div className="space-y-3 mt-5">
          {[
            { k: "nombre", t: "text", ph: "Nombre completo" },
            { k: "correo", t: "email", ph: "Correo electrónico" },
            { k: "password", t: "password", ph: "Contraseña" },
            { k: "password2", t: "password", ph: "Confirmar contraseña" },
          ].map(({ k, t, ph }) => (
            <input
              key={k}
              disabled={cargando}
              data-testid={`reg-${k}`}
              type={t}
              placeholder={ph}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-slate-100 text-sm focus:outline-none focus:border-emerald-500 disabled:opacity-50"
            />
          ))}
        </div>
        {error && (
          <div className="text-red-400 text-xs mt-3 bg-red-500/10 rounded p-2 border border-red-500/30">
            {error}
          </div>
        )}
        <button
          data-testid="reg-submit"
          type="submit"
          disabled={cargando}
          className="mt-5 w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black py-3 rounded-xl text-xs uppercase tracking-widest disabled:opacity-50"
        >
          {cargando ? "Guardando en Azure..." : "Crear cuenta y entrar"}
        </button>
      </form>
    </div>
  );
}
export function LoginAdmin({ setPantalla, onLogin }) {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Usamos la URL completa de producción para evitar el error 404
      const response = await fetch('https://club-playa-resort-app-2026.azurewebsites.net/api/usuarios/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });

      if (response.ok) {
        const datos = await response.json();
        
        // Verificamos que el usuario que intenta entrar realmente tenga el rol de admin
        if (datos.rol === 'admin' || datos.Rol === 'admin') {
          onLogin(datos.nombre, datos.correo); // Modificado para el formato de tu App.jsx corregido
        } else {
          setError("Acceso denegado. No eres administrador.");
        }
      } else {
        setError("Credenciales de administrador inválidas.");
      }
    } catch (err) {
      console.error("Error en login admin:", err);
      setError("Error al conectar con el servidor de Azure.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <form onSubmit={submit} className="max-w-md w-full bg-slate-900/80 border border-amber-500/30 rounded-3xl p-8">
        <button
          type="button"
          onClick={() => setPantalla("landing")}
          className="text-xs font-mono text-amber-400 mb-6"
        >
          &larr; Volver
        </button>
        <div className="text-[10px] uppercase tracking-[0.3em] text-amber-400 font-mono">
          🔐 Restricted · Admin
        </div>
        <h2 className="text-2xl font-black text-amber-100 mt-1">Consola Administrativa</h2>
        <div className="space-y-3 mt-5">
          <input
            data-testid="login-admin-correo"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            placeholder="admin@galdijo.com"
            className="w-full bg-slate-950 border border-amber-900/40 rounded-lg p-3.5 text-amber-100 text-sm font-mono focus:outline-none focus:border-amber-500"
          />
          <input
            data-testid="login-admin-pass"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-slate-950 border border-amber-900/40 rounded-lg p-3.5 text-amber-100 text-sm font-mono focus:outline-none focus:border-amber-500"
          />
        </div>
        {error && (
          <div className="text-red-400 text-xs mt-3 bg-red-500/10 rounded p-2 border border-red-500/30">
            ⚠ {error}
          </div>
        )}
        <button
          data-testid="login-admin-submit"
          type="submit"
          className="mt-5 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-lg text-xs uppercase tracking-widest"
        >
          Acceder al Panel
        </button>
        <p className="text-[10px] text-slate-600 text-center mt-3 font-mono">
          admin@galdijo.com / Admin2026!
        </p>
      </form>
    </div>
  );
}
