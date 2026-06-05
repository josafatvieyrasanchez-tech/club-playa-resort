const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// =====================
// CONEXIÓN BD
// =====================
const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  options: { encrypt: true }
};

async function getPool() {
  return await sql.connect(dbConfig);
}

// =====================
// USUARIOS
// =====================
app.post('/api/usuarios/registro', async (req, res) => {
  try {
    const { nombre, correo, password, Rol } = req.body;

    let pool = await sql.connect(dbConfig);

    const existe = await pool.request()
      .input('correo', sql.NVarChar, correo)
      .query(`SELECT ID FROM Usuarios WHERE correo = @correo`);

    if (existe.recordset.length > 0) {
      return res.status(400).json({ mensaje: 'El correo ya está registrado' });
    }

    await pool.request()
      .input('nombre', sql.NVarChar, nombre)
      .input('correo', sql.NVarChar, correo)
      .input('password', sql.NVarChar, password)
      .input('Rol', sql.NVarChar, Rol || 'cliente')
      .query(`
        INSERT INTO Usuarios (nombre, correo, password, Rol, FechaRegistro)
        VALUES (@nombre, @correo, @password, @Rol, GETDATE())
      `);

    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/usuarios/login', async (req, res) => {
  try {
    const { correo, password } = req.body;

    let pool = await sql.connect(dbConfig);

    const result = await pool.request()
      .input('correo', sql.NVarChar, correo)
      .input('password', sql.NVarChar, password)
      .query(`
        SELECT ID, nombre, correo, Rol
        FROM Usuarios
        WHERE correo = @correo AND password = @password
      `);

    if (result.recordset.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    res.json(result.recordset[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// 2. ADMIN: DATOS COMPLETOS (CLAVE)
// ================================
app.get("/api/admin/datos", async (req, res) => {
  try {
    const pool = await getPool();

    // RESERVAS
    const reservas = await pool.request().query(`
      SELECT 
        r.ID,
        r.UsuarioID,
        r.FechaVisita,
        r.Turno,
        r.Total,
        r.Estatus,
        r.FechaCreacion,
        u.nombre,
        u.correo
      FROM Reservas r
      INNER JOIN Usuarios u ON u.ID = r.UsuarioID
    `);

    // DETALLES DE RESERVA
    const detalles = await pool.request().query(`
      SELECT 
        dr.ReservaID,
        dr.ProductoID,
        dr.Cantidad,
        p.nombre,
        p.precio
      FROM DetallesReserva dr
      INNER JOIN Productos p ON p.ID = dr.ProductoID
    `);

    // ESPACIOS (MAPA)
    const espacios = await pool.request().query(`
      SELECT ID, Playa, Categoria, Precio, Estado
      FROM Productos
    `);

    res.json({
      reservas: reservas.recordset,
      detalles: detalles.recordset,
      espacios: espacios.recordset,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================================
// 3. CAMBIAR ESTADO ESPACIO
// ================================
app.post("/api/admin/estado-espacio", async (req, res) => {
  try {
    const { productoId, accion } = req.body;
    const pool = await getPool();

    await pool
      .request()
      .input("ProductoID", sql.Int, productoId)
      .input("Accion", sql.NVarChar, accion)
      .query(`
        UPDATE Productos
        SET Estado = 
          CASE 
            WHEN @Accion = 'Bloquear' THEN 'bloqueado'
            ELSE 'disponible'
          END
        WHERE ID = @ProductoID
      `);

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// =====================
// FRONTEND
// =====================
app.use(express.static(path.join(__dirname, '../dist')));

app.get(/^(?!\/api).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// =====================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log("Servidor corriendo en puerto", PORT));
