const express = require("express");
const sql = require("mssql");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ================================
// CONFIG SQL AZURE
// ================================
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

// ================================
// CONEXIÓN REUTILIZABLE
// ================================
async function getPool() {
  return await sql.connect(dbConfig);
}

//
// =======================================================
// USUARIOS
// =======================================================
//

app.post("/api/usuarios/registro", async (req, res) => {
  try {
    const { nombre, correo, password, Rol } = req.body;

    const pool = await getPool();

    const existe = await pool.request()
      .input("correo", sql.NVarChar, correo)
      .query(`SELECT ID FROM Usuarios WHERE correo = @correo`);

    if (existe.recordset.length > 0) {
      return res.status(400).json({ mensaje: "El correo ya existe" });
    }

    await pool.request()
      .input("nombre", sql.NVarChar, nombre)
      .input("correo", sql.NVarChar, correo)
      .input("password", sql.NVarChar, password)
      .input("Rol", sql.NVarChar, Rol || "cliente")
      .query(`
        INSERT INTO Usuarios (nombre, correo, password, Rol, FechaRegistro)
        VALUES (@nombre, @correo, @password, @Rol, GETDATE())
      `);

    res.json({ mensaje: "Usuario creado correctamente" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/usuarios/login", async (req, res) => {
  try {
    const { correo, password } = req.body;

    const pool = await getPool();

    const result = await pool.request()
      .input("correo", sql.NVarChar, correo)
      .input("password", sql.NVarChar, password)
      .query(`
        SELECT ID, nombre, correo, Rol
        FROM Usuarios
        WHERE correo = @correo AND password = @password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ mensaje: "Credenciales inválidas" });
    }

    res.json(result.recordset[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//
// =======================================================
// ADMIN DASHBOARD (LO MÁS IMPORTANTE)
// =======================================================-

app.get("/api/admin/datos", async (req, res) => {
  try {
    const pool = await getPool();
    const reservas = await pool.request().query(`SELECT r.*, u.nombre, u.correo FROM Reservas r JOIN Usuarios u ON u.ID = r.UsuarioID`);
    const detalles = await pool.request().query(`SELECT d.*, p.Nombre as PNombre FROM DetallesReserva d JOIN Productos p ON p.ID = d.ProductoID`);
    const espacios = await pool.request().query(`SELECT * FROM Espacios`);
    res.json({ reservas: reservas.recordset, detalles: detalles.recordset, espacios: espacios.recordset });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/cancelar-reserva", async (req, res) => {
  try {
    const { reservaId } = req.body;
    const pool = await getPool();
    await pool.request().input("id", sql.Int, reservaId).query("UPDATE Reservas SET Estatus = 'cancelled' WHERE ID = @id");
    res.json({ mensaje: "Cancelada" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/admin/estado-espacio", async (req, res) => {
  try {
    const { productoId, accion } = req.body;
    const pool = await getPool();
    await pool.request().input("ProductoID", sql.Int, productoId).input("Accion", sql.NVarChar, accion).execute("sp_CambiarEstadoProducto");
    res.json({ mensaje: "Estado actualizado" });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

//
// =======================================================
// FRONTEND BUILD SERVIDO (AZURE)
// =======================================================
//

app.use(express.static(path.join(__dirname, "../dist")));

app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, "../dist/index.html"));
});

//
// =======================================================
// START SERVER
// =======================================================
//

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});
