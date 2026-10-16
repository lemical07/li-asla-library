CREATE DATABASE IF NOT EXISTS asla_library
    CHARACTER SET utf8mb4;

USE asla_library;

-- Personas que pueden usar el sistema: lectores y administradores.
CREATE TABLE IF NOT EXISTS usuario (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    identificacion VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    telefono VARCHAR(20),
    direccion VARCHAR(200),
    email VARCHAR(120) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'lector') NOT NULL DEFAULT 'lector',
    activo TINYINT(1) NOT NULL DEFAULT 1 CHECK (activo IN (0, 1)),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Autores disponibles en el catálogo.
CREATE TABLE autor (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

-- Categorías para organizar los libros.
CREATE TABLE categoria (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Información general y precio de cada libro.
CREATE TABLE libro (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    isbn VARCHAR(17) NOT NULL UNIQUE,
    titulo VARCHAR(200) NOT NULL,
    categoria_id INT UNSIGNED NOT NULL,
    fecha_publicacion DATE,
    precio DECIMAL(10, 2) NOT NULL CHECK (precio >= 0),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (categoria_id) REFERENCES categoria (id)
) ENGINE=InnoDB;

-- Un libro puede tener varios autores, y un autor puede escribir varios libros.
CREATE TABLE libro_autor (
    libro_id INT UNSIGNED NOT NULL,
    autor_id INT UNSIGNED NOT NULL,
    orden TINYINT UNSIGNED NOT NULL DEFAULT 1,

    PRIMARY KEY (libro_id, autor_id),
    FOREIGN KEY (libro_id) REFERENCES libro (id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES autor (id)
) ENGINE=InnoDB;

-- Cada ejemplar es una copia física que se puede prestar.
CREATE TABLE ejemplar (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    libro_id INT UNSIGNED NOT NULL,
    estado ENUM('operativo', 'danado', 'perdido', 'baja') NOT NULL DEFAULT 'operativo',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (libro_id) REFERENCES libro (id)
) ENGINE=InnoDB;

-- Existencias disponibles para la venta, separadas de las copias de préstamo.
CREATE TABLE IF NOT EXISTS inventario (
    libro_id INT UNSIGNED NOT NULL PRIMARY KEY,
    stock_venta INT NOT NULL DEFAULT 0 CHECK (stock_venta >= 0),
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (libro_id) REFERENCES libro (id)
) ENGINE=InnoDB;

-- Historial de entradas, ventas y ajustes de existencias.
CREATE TABLE IF NOT EXISTS movimiento_inventario (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    libro_id INT UNSIGNED NOT NULL,
    usuario_id INT UNSIGNED,
    tipo ENUM('entrada', 'venta', 'ajuste') NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad <> 0),
    motivo VARCHAR(200),
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (libro_id) REFERENCES libro (id),
    FOREIGN KEY (usuario_id) REFERENCES usuario (id)
) ENGINE=InnoDB;

-- Préstamos de ejemplares a lectores.
CREATE TABLE IF NOT EXISTS prestamo (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED NOT NULL,
    admin_id INT UNSIGNED NOT NULL,
    ejemplar_id INT UNSIGNED NOT NULL,
    fecha_prestamo DATE NOT NULL,
    fecha_limite DATE NOT NULL,
    fecha_devolucion_real DATE,
    estado ENUM('prestado', 'devuelto') NOT NULL DEFAULT 'prestado',
    creado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ejemplar_activo INT UNSIGNED GENERATED ALWAYS AS (IF(estado = 'prestado', ejemplar_id, NULL)) STORED,

    FOREIGN KEY (usuario_id) REFERENCES usuario (id),
    FOREIGN KEY (admin_id) REFERENCES usuario (id),
    FOREIGN KEY (ejemplar_id) REFERENCES ejemplar (id),

    CHECK (fecha_limite >= fecha_prestamo),
    CHECK ((estado = 'prestado' AND fecha_devolucion_real IS NULL) OR (estado = 'devuelto' AND fecha_devolucion_real IS NOT NULL AND fecha_devolucion_real >= fecha_prestamo))
) ENGINE=InnoDB;

-- Una venta puede registrarse a nombre de un usuario o de un cliente de mostrador.
CREATE TABLE IF NOT EXISTS venta (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT UNSIGNED,
    nombre_cliente VARCHAR(100),
    fecha_venta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (usuario_id) REFERENCES usuario (id),

    CHECK (usuario_id IS NOT NULL OR nombre_cliente IS NOT NULL)
) ENGINE=InnoDB;

-- Libros incluidos en cada venta y el precio que tenían al venderse.
CREATE TABLE IF NOT EXISTS detalle_venta (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    venta_id INT UNSIGNED NOT NULL,
    libro_id INT UNSIGNED NOT NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL CHECK (precio_unitario >= 0),
    subtotal DECIMAL(12, 2) GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,

    FOREIGN KEY (venta_id) REFERENCES venta (id),
    FOREIGN KEY (libro_id) REFERENCES libro (id)
) ENGINE=InnoDB;

-- Índices para búsquedas frecuentes. MySQL crea los índices necesarios
-- para las claves foráneas automáticamente.
CREATE INDEX ix_libro_titulo ON libro (titulo);
CREATE INDEX ix_mov_libro_fecha ON movimiento_inventario (libro_id, creado_en);
CREATE UNIQUE INDEX uq_prestamo_ejemplar_activo ON prestamo (ejemplar_activo);
CREATE INDEX ix_prestamo_usuario_estado ON prestamo (usuario_id, estado);
CREATE INDEX ix_prestamo_estado_limite ON prestamo (estado, fecha_limite);
CREATE INDEX ix_venta_fecha ON venta (fecha_venta);
