const express = require('express');
const sql = require('mssql');
const cors = require('cors');
const path = require('path'); // Necesario para servir el frontend
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// Configuración de conexión (Azure SQL)
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: true }
};

// --- RUTA PARA BLOQUEAR/ACTIVAR ---
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

// --- CORRECCIÓN: Servir el Frontend (React) ---
// Esto debe ir al final, después de tus rutas de API

// 1. Servir los archivos estáticos desde la carpeta dist que está al lado de index.js
// Usamos una expresión regular para atrapar TODO sin que falle el validador
app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- CORRECCIÓN: Puerto dinámico para Azure ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
