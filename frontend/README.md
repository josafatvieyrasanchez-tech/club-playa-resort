# GALDIJO Beach Club — Versión Vite

Tu proyecto usa **Vite + React 19 + Tailwind 4**. Este ZIP está adaptado para eso.

## 🚀 Instalación (3 pasos)

### 1️⃣ Instala la dependencia que falta

Tu `package.json` ya tiene `leaflet`, `react-leaflet` y `qrcode.react` ✅
Pero **falta `react-router-dom`** (lo necesito para el ticket QR):

```powershell
npm install react-router-dom
```

### 2️⃣ Copia los archivos

Copia el contenido de la carpeta `src/` de este ZIP **sobre** tu `src/` actual:

- `src/App.jsx` → reemplaza el tuyo
- `src/galdijo/` → carpeta nueva con 6 archivos
- `src/galdijo.css` → archivo nuevo

### 3️⃣ Edita tu `src/index.css`

Agrega esta línea al **FINAL** de tu `src/index.css` actual (no lo reemplaces):

```css
@import "./galdijo.css";
```

> Esto agrega los estilos de Leaflet y los marcadores personalizados sin romper tu Tailwind.

### 4️⃣ Verifica `src/main.jsx`

Asegúrate de que tu `src/main.jsx` (el entry point de Vite) importe `App` correctamente. Debe verse algo así:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

Si tu `main.jsx` ya importa `App` así, no toques nada.

## 🎬 Arrancar

```powershell
npm run dev
```

Abre `http://localhost:5173` (el puerto por defecto de Vite).

## 🔑 Credenciales demo

- **Cliente**: `cliente@galdijo.com` / `Cliente2026!`
- **Admin**: `admin@galdijo.com` / `Admin2026!`

## 🌍 MapTiler opcional

Si quieres tiles satelitales en vez de OpenStreetMap, crea un archivo `.env` en la raíz de `frontend/`:

```
VITE_MAPTILER_KEY=tu_token_de_maptiler
```

(En Vite las vars deben empezar con `VITE_`, no con `REACT_APP_`)

## 📁 Estructura final que debes tener

```
frontend/
├── package.json              ← se agregó react-router-dom
├── src/
│   ├── main.jsx              ← tu archivo (no cambiar)
│   ├── index.css             ← tu archivo + 1 línea al final
│   ├── App.jsx               ← REEMPLAZADO
│   ├── galdijo.css           ← NUEVO
│   └── galdijo/              ← CARPETA NUEVA
│       ├── data.js
│       ├── Auth.jsx
│       ├── BeachMap.jsx
│       ├── Client.jsx
│       ├── Admin.jsx
│       └── Ticket.jsx
```

## ⚠️ Si te sale algún error

| Error | Solución |
|---|---|
| `Cannot find module 'react-router-dom'` | Te falta paso 1: `npm install react-router-dom` |
| `Cannot find module './galdijo/data'` | Verifica que la carpeta `galdijo/` esté dentro de `src/` |
| Pantalla blanca | Abre la consola del navegador (F12) y manda el error |
| Estilos sin Tailwind | Tu `index.css` no tiene la línea `@import "tailwindcss"` — revisa que sí esté |

¡Listo! Cualquier duda al main agent 🤝
