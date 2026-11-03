-- fechaNacimiento pasa de DATETIME a DATE: "1990-05-10" se guardaba como
-- medianoche UTC y en Argentina (UTC-3) se veía como el día anterior.
-- AlterTable
ALTER TABLE `pacientes` MODIFY `fechaNacimiento` DATE NULL;
