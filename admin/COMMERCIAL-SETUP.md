# Campañas y calendario comercial de Peluvi

El administrador incorpora Campañas y Calendario comercial. Todos los endpoints requieren la sesión administrativa existente. Los importes diarios son manuales y la tasa USD/COP se guarda con cada reporte: no se recalculan reportes históricos usando una tasa actual. No se importan aún métricas de Meta.

## Desarrollo local

`npm start` utiliza `.data/commercial.json` cuando no hay credenciales de Supabase. El archivo queda fuera de Git y del servidor de archivos públicos. Las escrituras son atómicas, con control de revisión para evitar sobrescribir cambios de otra sesión. Copiar este archivo permite respaldar la información local.

## Producción / Supabase

1. Aplicar `supabase/migrations/20261008160000_commercial_workspace.sql` al proyecto correcto de Supabase.
2. Configurar en el servidor `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` (o `SUPABASE_SECRET_KEY`). Nunca incluir la credencial privada en archivos del navegador.
3. Si existen datos locales, respaldar `.data/commercial.json` e importar su contenido en la columna `state` de la fila `main` de `commercial_workspace` antes de cambiar el almacenamiento. No sobrescribir datos remotos existentes sin conciliarlos.
4. Reiniciar el servidor y comprobar que ambas pantallas indican “Guardado en Supabase”.

La migración guarda un documento comercial privado con campañas, resultados, cierres, configuración y eventos. Una función SQL comprueba la revisión y actualiza todos los componentes en una sola transacción. RLS está habilitado, sin acceso de anon/authenticated; solo el backend puede leer y escribir. Esto simplifica el módulo administrativo inicial; para un volumen elevado conviene separar las entidades en tablas y paginar consultas.

No hay fallback local en Vercel ni en NODE_ENV=production. Una configuración o migración faltante muestra un error y no simula un guardado.

## Reglas

- Un reporte por campaña y fecha; editarlo reemplaza sus valores y reabre el cierre del responsable de ese día.
- Campañas archivadas conservan los datos y no reciben reportes nuevos.
- Moneda bloqueada una vez registrados resultados. Presupuesto planeado separado del gasto real.
- Hora límite de Colombia; días laborales y festivos configurables globalmente.
- Cierre explícito, incluso sin resultados. Un reporte con ceros sin cierre no cuenta como jornada cerrada.
- No se permiten fechas imposibles, reportes futuros, números negativos ni escrituras con revisión desactualizada.
- El historial identifica la sesión como “Administrador”, coherente con el token administrativo compartido actual; no identifica personas individuales.

Validación: `node --test tests/*.test.mjs`.
