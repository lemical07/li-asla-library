# LI-ASLA-LIBRARY

API REST para administrar el catálogo bibliográfico, lectores, préstamos de ejemplares e inventario de ventas. El proyecto existente se organiza con rutas, controladores, servicios, repositorios, DTO, validaciones y middleware, siguiendo las convenciones del proyecto de referencia Lumen.

## Tecnologías y requisitos

- Node.js 20 o posterior.
- MySQL 8 con InnoDB.
- Express 5, mysql2, express-validator y bcrypt.
- Variables de entorno para conexión a la base de datos y firma JWT.

## Instalación y configuración

1. Crear la base de datos y sus tablas ejecutando [`db/schema.sql`](./db/schema.sql) en MySQL.
2. Instalar dependencias:

   ```powershell
   npm install
   ```

3. Si no existe `.env`, crearlo a partir de `.env.example`; si ya existe, conservar la configuración de base de datos y agregar `JWT_SECRET`. Generar un secreto JWT aleatorio de al menos 32 caracteres; por ejemplo:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"
   ```

   No publicar el archivo `.env` ni reutilizar el valor de ejemplo de `JWT_SECRET`.
4. Iniciar el servicio:

   ```powershell
   npm run dev
   ```

   Para ejecución normal: `npm start`. La API escucha en `SERVER_PORT` (3000 por defecto). `GET /salud` permite comprobar que el proceso responde.

El esquema establece inicialmente el rol `lector` para los registros públicos. Para habilitar el primer administrador, registre su cuenta y asígnele el rol desde un procedimiento administrativo seguro de MySQL, por ejemplo:

```sql
UPDATE usuario SET rol = 'admin' WHERE email = 'correo-administrador@example.com';
```

No hay un endpoint público para crear administradores ni para cambiar roles.

## Aplicación web

El frontend está integrado en el mismo servidor Express y no requiere un proceso ni dependencias adicionales. Con el servidor iniciado, abre `http://localhost:3000/`.

- `index.html` en la raíz es la página de bienvenida.
- Los demás documentos están en `public/html/`: inicio de sesión, registro y aplicación.
- Los estilos están en `public/css/`, el JavaScript del navegador en `public/js/` y los recursos visuales en `public/assets/` y `public/favicon/`.
- Express sirve la portada en `/` y los archivos públicos desde sus rutas bajo `/html/`, `/css/`, `/js/`, `/assets/` y `/favicon/`; las rutas de la API conservan sus direcciones.
- La aplicación presenta vistas distintas para `admin` y `lector`, y obtiene libros, perfiles, préstamos, ventas y registros administrativos desde la API.
- El JWT se conserva en `sessionStorage` y se envía en el encabezado `Authorization`. El backend actual no ofrece cookies HttpOnly. Al cerrar la pestaña se elimina la sesión del navegador.
- La recuperación de contraseña no está disponible porque la API no expone ese servicio.

El servicio calcula los importes y valida las operaciones de negocio; la interfaz solo presenta validación de entrada y mensajes de estado. Las operaciones que modifican datos requieren una cuenta y permisos válidos.

## Arquitectura

- `routes/`: endpoints y encadenamiento de autenticación, autorización y validaciones.
- `controladores/`: adaptación de solicitudes y respuestas HTTP.
- `servicios/`: reglas de negocio y coordinación de operaciones.
- `repositorios/`: consultas parametrizadas a MySQL y transacciones.
- `dto/`: representación controlada de datos de entrada y salida.
- `validaciones/`: reglas centralizadas con express-validator.
- `util/`: JWT, control de roles, límite de solicitudes y manejo de errores.
- `config/` y `db/`: conexión y esquema SQL.

Las ventas, los cambios de inventario y los préstamos/devoluciones utilizan transacciones. El stock de venta se mantiene separado de los ejemplares físicos para préstamo. Los préstamos vencidos se calculan al consultar; el historial se conserva en las tablas existentes.

## Roles

- `lector`: consultar el catálogo, ver su perfil y sus historiales, actualizar los campos permitidos de su perfil y registrar compras a su propio nombre.
- `admin`: administrar usuarios, catálogo, existencias, ejemplares, préstamos, devoluciones y ventas.

Las rutas privadas requieren `Authorization: Bearer <JWT>`. Los tokens HS256 expiran en una hora. El inicio de sesión permite hasta cinco solicitudes por ventana de 15 minutos y el registro hasta diez, por dirección IP y proceso de aplicación.

## Endpoints

### Cuenta y usuarios

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| POST | `/usuarios/registro` | Público | Registrar una cuenta con rol `lector` |
| POST | `/usuarios/login` | Público | Iniciar sesión y obtener JWT |
| GET | `/usuarios/perfil` | Autenticado | Consultar el propio perfil |
| PATCH | `/usuarios/perfil` | Autenticado | Actualizar datos permitidos o contraseña |
| GET | `/usuarios` | Admin | Listar y buscar usuarios; admite `pagina`, `limite`, `busqueda` |
| GET | `/usuarios/:id` | Admin | Consultar un usuario |
| PATCH | `/usuarios/:id` | Admin | Actualizar datos de usuario permitidos |
| PATCH | `/usuarios/:id/estado` | Admin | Activar o desactivar una cuenta (`activo`) |

El ID interno y el rol no pueden modificarse mediante el registro o la actualización de perfiles. Las contraseñas se almacenan con bcrypt y nunca se incluyen en las respuestas.

### Libros, categorías y autores

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| GET | `/libros` | Público | Buscar, filtrar por `categoria_id`, paginar y ordenar catálogo |
| GET | `/libros/:id` | Público | Consultar libro y disponibilidad |
| POST | `/libros` | Admin | Crear libro; opcionalmente admite `autores_ids` |
| PATCH | `/libros/:id` | Admin | Actualizar libro y autores |
| DELETE | `/libros/:id` | Admin | Eliminar solo si no tiene historial o ejemplares |
| POST | `/libros/:id/inventario` | Admin | Añadir stock de venta y registrar movimiento |
| POST | `/libros/:id/ejemplares` | Admin | Crear ejemplares físicos para préstamo |
| GET | `/libros/:id/ejemplares` | Admin | Consultar IDs y disponibilidad de ejemplares físicos |
| GET | `/libros/:id/movimientos` | Admin | Consultar historial de cambios de inventario |
| GET | `/categorias`, `/autores` | Público | Consultar categorías o autores |
| POST | `/categorias`, `/autores` | Admin | Crear categorías o autores |

Los filtros de catálogo aceptan `busqueda`, `categoria_id`, `pagina`, `limite` (máximo 100), `ordenar` (`titulo`, `precio`, `fecha`, `id`) y `direccion` (`asc`, `desc`). El campo de autores es una lista de IDs.

### Préstamos

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| GET | `/prestamos/mis-prestamos` | Autenticado | Consultar únicamente el historial propio |
| GET | `/prestamos` | Admin | Consultar préstamos |
| POST | `/prestamos` | Admin | Prestar un `ejemplar_id` a un `usuario_id` con `fecha_limite` |
| POST | `/prestamos/:id/devolucion` | Admin | Registrar devolución una sola vez |

No se presta un ejemplar no operativo ni uno que ya tenga préstamo activo. La base de datos impone unicidad de ejemplar prestado; las fechas se validan en la API y en el esquema. `vencido` es un estado derivado en las consultas; el esquema conserva `prestado` o `devuelto`.

### Ventas e historiales

| Método | Ruta | Acceso | Función |
|---|---|---|---|
| GET | `/ventas/mis-ventas` | Autenticado | Consultar exclusivamente las compras propias |
| GET | `/ventas` | Admin | Consultar ventas e ítems |
| POST | `/ventas` | Autenticado | Registrar venta con `libros: [{ libro_id, cantidad }]` |

Los administradores indican `usuario_id` o `nombre_cliente`; los lectores quedan asociados a su propia cuenta. El servidor obtiene los precios de la base de datos, calcula el total y descuenta existencias dentro de una transacción. No se aceptan precios ni totales del cliente.

## Pruebas y estado

Ejecutar pruebas unitarias con:

```powershell
npm test
```

Las pruebas actuales verifican firma, alteración y expiración de JWT sin requerir una base de datos. Para comprobar los endpoints de negocio se necesita una instancia MySQL configurada con el esquema y datos de prueba. No se incluyen migraciones automáticas: aplicar cambios al esquema en una base existente requiere revisión y respaldo previos.
