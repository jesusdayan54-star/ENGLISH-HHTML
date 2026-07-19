# Cómo publicar este sitio en GitHub Pages

1. Sube TODO el contenido de esta carpeta a la raíz de tu repo `English-page`
   (o a una carpeta `/docs` si prefieres, ajustando la configuración de Pages).
2. En GitHub: Settings → Pages → Source → selecciona la rama `main` y la carpeta `/ (root)`.
3. Guarda. En 1-2 minutos tu sitio estará en:
   https://TU-USUARIO.github.io/English-page/

Estructura de este paquete:
- index.html      → página de inicio (mapa de niveles)
- level.html      → página que lista los temas de un nivel
- lesson.html     → página que renderiza cada lección en Markdown
- styles.css      → todo el diseño visual
- app.js          → lógica de navegación y render de Markdown/diagramas
- content/        → todas las lecciones en Markdown + index.json (mapa del curso)

Para AGREGAR una lección nueva:
1. Crea el archivo .md en content/lessons/NIVEL/grammar (o vocabulary)/
2. Vuelve a generar content/index.json (o edítalo a mano siguiendo el mismo formato)
3. Sube los cambios — no hace falta tocar HTML ni JS.
