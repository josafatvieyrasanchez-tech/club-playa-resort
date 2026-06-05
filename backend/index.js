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

// =====================
// ESTADO ESPACIOS
// =====================
app.post('/api/admin/estado-espacio', async (req, res) => {
  try {
    const { productoId, accion } = req.body;

    let pool = await sql.connect(dbConfig);

    await pool.request()
      .input('ProductoID', sql.Int, productoId)
      .input('Accion', sql.NVarChar, accion)
      .execute('sp_CambiarEstadoProducto');

    res.json({ mensaje: "Estado actualizado" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// 🔥 DASHBOARD PRINCIPAL
// =====================
app.get('/api/admin/datos', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);

    const reservas = await pool.request().query(`SELECT * FROM Reservas`);
    const espacios = await pool.request().query(`SELECT * FROM Productos`);
    const detalles = await pool.request().query(`SELECT * FROM Detalles_Reserva`);
    const apartados = await pool.request().query(`SELECT * FROM Apartados`);

    res.json({
      reservas: reservas.recordset,
      espacios: espacios.recordset,
      detalles: detalles.recordset,
      apartados: apartados.recordset
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// CAMBIAR ESTATUS RESERVA
// =====================
app.patch('/api/admin/reservas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { estatus } = req.body;

    let pool = await sql.connect(dbConfig);

    await pool.request()
      .input('ID', sql.Int, id)
      .input('Estatus', sql.NVarChar, estatus)
      .query(`
        UPDATE Reservas
        SET Estatus = @Estatus
        WHERE ID = @ID
      `);

    res.json({ mensaje: "Reserva actualizada" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// INGRESOS POR DÍA
// =====================
app.get('/api/admin/ingresos', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT 
        FechaVisita,
        SUM(Total) AS ingresos
      FROM Reservas
      WHERE Estatus IN ('paid','checked_in')
      GROUP BY FechaVisita
      ORDER BY FechaVisita
    `);

    res.json(result.recordset);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// =====================
// OCUPACIÓN POR DÍA
// =====================
app.get('/api/admin/ocupacion', async (req, res) => {
  try {
    let pool = await sql.connect(dbConfig);

    const result = await pool.request().query(`
      SELECT 
        FechaVisita,
        COUNT(*) AS ocupados
      FROM Reservas
      WHERE Estatus IN ('confirmed','paid','checked_in')
      GROUP BY FechaVisita
      ORDER BY FechaVisita
    `);

    res.json(result.recordset);

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
