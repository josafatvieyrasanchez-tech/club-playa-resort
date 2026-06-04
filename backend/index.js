const express = require('express');
const sql = require('mssql');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Permite peticiones desde tu frontend
app.use(express.json());

// Configuración de conexión (usando variables de entorno)
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER, // galdijoresortsql2026.database.windows.net
    database: process.env.DB_NAME,
    options: { encrypt: true }
};

// --- RUTA PARA BLOQUEAR/ACTIVAR (Backend para Admin.jsx) ---
app.post('/api/admin/estado-espacio', async (req, res) => {
    try {
        const { productoId, accion } = req.body;
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input('ProductoID', sql.Int, productoId)
            .input('Accion', sql.NVarChar, accion)
            .execute('sp_CambiarEstadoProducto');
        res.json({ mensaje: "Estado actualizado exitosamente" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(3000, () => console.log('Servidor corriendo en puerto 3000'));