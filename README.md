# Zúrich en Navidad 2026

Guía personal en español para la visita del 20 al 27 de noviembre de 2026.
Online: https://mikefaehch.github.io/zuerich/

- `index.html` – página, estilos y lógica. Orden: hero · lo mejor para vosotros · favoritos de Mike · descubrir (filtros, mapa, tarjetas) · ideas para después del trabajo · mi plan · información práctica
- `data.js` – lugares (`PLACES`) e ideas (`IDEAS`), con horarios, fuente y estado de verificación. `poc:true` = favorito de Mike (estrella). `img:'img/nombre'` usa `nombre-400.webp` (miniatura) y `nombre-800.webp` (favoritos)
- `img/` – fotos WebP; `hero-limmat-m.webp` (móvil) y `hero-limmat-d.webp` (escritorio)
- `sw.js` – caché sin conexión
- `vendor/` – fuentes Cormorant Garamond e Inter (OFL) y Leaflet

Actualizar: editar `data.js` (o `index.html`), hacer commit en `main`; GitHub Pages publica solo.
Al cambiar archivos, subir el número de versión en `sw.js` (`zuerich-vN`).
