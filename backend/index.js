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
// ================================
// REGISTRO DE USUARIOS
// ================================
app.post('/api/usuarios/registro', async (req, res) => {
    try {

        const { nombre, correo, password, Rol } = req.body;

        let pool = await sql.connect(dbConfig);

        const existe = await pool.request()
            .input('correo', sql.NVarChar, correo)
            .query(`
                SELECT ID
                FROM Usuarios
                WHERE correo = @correo
            `);

        if (existe.recordset.length > 0) {
            return res.status(400).json({
                mensaje: 'El correo ya está registrado'
            });
        }

        await pool.request()
            .input('nombre', sql.NVarChar, nombre)
            .input('correo', sql.NVarChar, correo)
            .input('password', sql.NVarChar, password)
            .input('Rol', sql.NVarChar, Rol || 'cliente')
            .query(`
                INSERT INTO Usuarios
                (
                    nombre,
                    correo,
                    password,
                    Rol,
                    FechaRegistro
                )
                VALUES
                (
                    @nombre,
                    @correo,
                    @password,
                    @Rol,
                    GETDATE()
                )
            `);

        res.status(201).json({
            mensaje: 'Usuario registrado correctamente'
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }
});

// ================================
// LOGIN DE USUARIOS
// ================================
app.post('/api/usuarios/login', async (req, res) => {

    try {

        const { correo, password } = req.body;

        let pool = await sql.connect(dbConfig);

        const resultado = await pool.request()
            .input('correo', sql.NVarChar, correo)
            .input('password', sql.NVarChar, password)
            .query(`
                SELECT
                    ID,
                    nombre,
                    correo,
                    Rol
                FROM Usuarios
                WHERE correo = @correo
                AND password = @password
            `);

        if (resultado.recordset.length === 0) {

            return res.status(401).json({
                mensaje: 'Credenciales inválidas'
            });

        }

        res.json({
            id: resultado.recordset[0].ID,
            nombre: resultado.recordset[0].nombre,
            correo: resultado.recordset[0].correo,
            rol: resultado.recordset[0].Rol
        });

    } catch (err) {

        console.error(err);

        res.status(500).json({
            error: err.message
        });

    }

});

// 1. Servir los archivos estáticos desde la carpeta dist que está al lado de index.js
// Usamos una expresión regular para atrapar TODO sin que falle el validador

app.use(express.static(path.join(__dirname, '../dist')));

app.get(/^(?!\/api).*$/, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- CORRECCIÓN: Puerto dinámico para Azure ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
