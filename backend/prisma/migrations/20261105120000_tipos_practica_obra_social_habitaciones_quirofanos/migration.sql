-- Cambios pedidos por el docente:
--   1. TipoPractica pasa de enum a entidad (tabla tipos_practica).
--   2. EstadoPrescripcion: ENTREGADA_PACIENTE / ENTREGADA_OBRA_SOCIAL / ANULADA.
--   3. Rol OBRA_SOCIAL (usuarios.idObraSocial) + auditoría en prescripciones.
--   4. Entidades Habitacion, Quirofano y TurnoQuirofano.
-- Está escrita a mano (no la autogenerada) para conservar los datos existentes.

-- ─── 1. Tipos de práctica ────────────────────────────────────────────────
CREATE TABLE `tipos_practica` (
    `idTipoPractica` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` VARCHAR(50) NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tipos_practica_codigo_key`(`codigo`),
    UNIQUE INDEX `tipos_practica_nombre_key`(`nombre`),
    PRIMARY KEY (`idTipoPractica`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Los mismos 3 valores que tenía el enum.
INSERT INTO `tipos_practica` (`codigo`, `nombre`, `fechaActualizacion`) VALUES
    ('MEDICAMENTO', 'Medicamento', CURRENT_TIMESTAMP(3)),
    ('CIRUGIA', 'Cirugía', CURRENT_TIMESTAMP(3)),
    ('INTERNACION', 'Internación', CURRENT_TIMESTAMP(3));

-- Se agrega la FK como NULL, se completa con el valor del enum viejo,
-- y recién ahí se hace NOT NULL y se borra la columna del enum.
ALTER TABLE `prescripciones` ADD COLUMN `idTipoPractica` INTEGER NULL;

UPDATE `prescripciones` p
    JOIN `tipos_practica` t ON t.`codigo` = p.`tipoPractica`
    SET p.`idTipoPractica` = t.`idTipoPractica`;

ALTER TABLE `prescripciones`
    MODIFY `idTipoPractica` INTEGER NOT NULL,
    DROP COLUMN `tipoPractica`;

-- ─── 2. Estados de prescripción ──────────────────────────────────────────
-- Primero se amplía el ENUM (conviviendo viejo y nuevo), se pasan las
-- ENTREGADA a ENTREGADA_PACIENTE, y después se deja solo el ENUM nuevo.
ALTER TABLE `prescripciones`
    MODIFY `estado` ENUM('ENTREGADA', 'ENTREGADA_PACIENTE', 'ENTREGADA_OBRA_SOCIAL', 'ANULADA') NOT NULL DEFAULT 'ENTREGADA_PACIENTE';

UPDATE `prescripciones` SET `estado` = 'ENTREGADA_PACIENTE' WHERE `estado` = 'ENTREGADA';

ALTER TABLE `prescripciones`
    MODIFY `estado` ENUM('ENTREGADA_PACIENTE', 'ENTREGADA_OBRA_SOCIAL', 'ANULADA') NOT NULL DEFAULT 'ENTREGADA_PACIENTE';

-- ─── 3. Rol OBRA_SOCIAL y auditoría ──────────────────────────────────────
ALTER TABLE `usuarios`
    ADD COLUMN `idObraSocial` INTEGER NULL,
    MODIFY `rol` ENUM('ADMINISTRADOR', 'PROFESIONAL', 'OBRA_SOCIAL') NOT NULL;

ALTER TABLE `prescripciones`
    ADD COLUMN `estadoAuditoria` ENUM('EN_AUDITORIA', 'APROBADA', 'RECHAZADA') NULL,
    ADD COLUMN `observacionesAuditoria` TEXT NULL,
    ADD COLUMN `fechaAuditoria` DATETIME(3) NULL;

-- ─── 4. Habitaciones, quirófanos y turnos ────────────────────────────────
CREATE TABLE `habitaciones` (
    `idHabitacion` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(20) NOT NULL,
    `piso` VARCHAR(20) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `habitaciones_numero_key`(`numero`),
    PRIMARY KEY (`idHabitacion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `prescripciones` ADD COLUMN `idHabitacion` INTEGER NULL;

CREATE TABLE `quirofanos` (
    `idQuirofano` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `quirofanos_nombre_key`(`nombre`),
    PRIMARY KEY (`idQuirofano`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `turnos_quirofano` (
    `idTurnoQuirofano` INTEGER NOT NULL AUTO_INCREMENT,
    `fechaHora` DATETIME(3) NOT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,
    `idQuirofano` INTEGER NOT NULL,
    `idPrescripcion` INTEGER NOT NULL,

    UNIQUE INDEX `turnos_quirofano_idPrescripcion_key`(`idPrescripcion`),
    UNIQUE INDEX `turnos_quirofano_idQuirofano_fechaHora_key`(`idQuirofano`, `fechaHora`),
    PRIMARY KEY (`idTurnoQuirofano`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ─── Claves foráneas ─────────────────────────────────────────────────────
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_idObraSocial_fkey` FOREIGN KEY (`idObraSocial`) REFERENCES `obras_sociales`(`idObraSocial`) ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE `turnos_quirofano` ADD CONSTRAINT `turnos_quirofano_idQuirofano_fkey` FOREIGN KEY (`idQuirofano`) REFERENCES `quirofanos`(`idQuirofano`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `turnos_quirofano` ADD CONSTRAINT `turnos_quirofano_idPrescripcion_fkey` FOREIGN KEY (`idPrescripcion`) REFERENCES `prescripciones`(`idPrescripcion`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `prescripciones` ADD CONSTRAINT `prescripciones_idTipoPractica_fkey` FOREIGN KEY (`idTipoPractica`) REFERENCES `tipos_practica`(`idTipoPractica`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `prescripciones` ADD CONSTRAINT `prescripciones_idHabitacion_fkey` FOREIGN KEY (`idHabitacion`) REFERENCES `habitaciones`(`idHabitacion`) ON DELETE SET NULL ON UPDATE CASCADE;
