-- Simplifica los estados de prescripción: solo ENTREGADA (por defecto) y ANULADA.
-- Primero se pasan a ENTREGADA las filas existentes con los estados que se eliminan,
-- y recién después se reduce el ENUM (si no, MySQL rechazaría el cambio por datos huérfanos).
UPDATE `prescripciones` SET `estado` = 'ENTREGADA' WHERE `estado` IN ('PENDIENTE', 'APROBADA');

ALTER TABLE `prescripciones` MODIFY `estado` ENUM('ENTREGADA', 'ANULADA') NOT NULL DEFAULT 'ENTREGADA';
