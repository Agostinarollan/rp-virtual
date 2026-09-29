-- CreateTable
CREATE TABLE `usuarios` (
    `idUsuario` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `nombreUsuario` VARCHAR(50) NOT NULL,
    `contrasena` VARCHAR(255) NOT NULL,
    `rol` ENUM('ADMINISTRADOR', 'PROFESIONAL') NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuarios_nombreUsuario_key`(`nombreUsuario`),
    PRIMARY KEY (`idUsuario`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `profesionales` (
    `idProfesional` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `especialidad` VARCHAR(100) NOT NULL,
    `matricula` VARCHAR(50) NOT NULL,
    `firma` VARCHAR(255) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,
    `idUsuario` INTEGER NOT NULL,

    UNIQUE INDEX `profesionales_matricula_key`(`matricula`),
    UNIQUE INDEX `profesionales_idUsuario_key`(`idUsuario`),
    PRIMARY KEY (`idProfesional`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pacientes` (
    `idPaciente` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `apellido` VARCHAR(100) NOT NULL,
    `dni` VARCHAR(20) NOT NULL,
    `fechaNacimiento` DATETIME(3) NULL,
    `numeroAfiliado` VARCHAR(50) NULL,
    `celular` VARCHAR(30) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,
    `idObraSocial` INTEGER NULL,

    UNIQUE INDEX `pacientes_dni_key`(`dni`),
    PRIMARY KEY (`idPaciente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `obras_sociales` (
    `idObraSocial` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,

    UNIQUE INDEX `obras_sociales_nombre_key`(`nombre`),
    PRIMARY KEY (`idObraSocial`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prescripciones` (
    `idPrescripcion` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoPractica` ENUM('MEDICAMENTO', 'CIRUGIA', 'INTERNACION') NOT NULL,
    `diagnostico` TEXT NOT NULL,
    `observaciones` TEXT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `estado` ENUM('PENDIENTE', 'APROBADA', 'ENTREGADA', 'ANULADA') NOT NULL DEFAULT 'PENDIENTE',
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `fechaActualizacion` DATETIME(3) NOT NULL,
    `idPaciente` INTEGER NOT NULL,
    `idProfesional` INTEGER NOT NULL,

    PRIMARY KEY (`idPrescripcion`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `profesionales` ADD CONSTRAINT `profesionales_idUsuario_fkey` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios`(`idUsuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pacientes` ADD CONSTRAINT `pacientes_idObraSocial_fkey` FOREIGN KEY (`idObraSocial`) REFERENCES `obras_sociales`(`idObraSocial`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescripciones` ADD CONSTRAINT `prescripciones_idPaciente_fkey` FOREIGN KEY (`idPaciente`) REFERENCES `pacientes`(`idPaciente`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prescripciones` ADD CONSTRAINT `prescripciones_idProfesional_fkey` FOREIGN KEY (`idProfesional`) REFERENCES `profesionales`(`idProfesional`) ON DELETE RESTRICT ON UPDATE CASCADE;
