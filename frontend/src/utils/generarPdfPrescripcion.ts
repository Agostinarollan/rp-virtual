import { jsPDF } from 'jspdf';
import dayjs from 'dayjs';
import { TIPO_PRACTICA_LABEL, type Prescripcion } from '../types';

// Descarga una imagen (la firma, servida por el emulador de Firebase Storage)
// y la convierte a base64 para poder incrustarla en el PDF con jsPDF.
async function imagenABase64(url: string): Promise<string | null> {
  try {
    const respuesta = await fetch(url);
    const blob = await respuesta.blob();
    return await new Promise((resolve, reject) => {
      const lector = new FileReader();
      lector.onload = () => resolve(lector.result as string);
      lector.onerror = reject;
      lector.readAsDataURL(blob);
    });
  } catch {
    return null; // si falla la descarga, el PDF sigue sin la imagen (no rompe nada)
  }
}

// Genera el PDF de una prescripción (RP) y dispara la descarga en el navegador.
// No depende de nada del backend: todo el armado del documento pasa acá.
export async function generarPdfPrescripcion(prescripcion: Prescripcion) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margenIzq = 20;
  let y = 20;

  // --- Encabezado ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 118, 110); // verde institucional (matching el color de la app)
  doc.text('RP Virtual', margenIzq, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(120);
  doc.text('Prescripción médica virtual', margenIzq, y + 6);

  doc.setDrawColor(15, 118, 110);
  doc.setLineWidth(0.5);
  y += 12;
  doc.line(margenIzq, y, 190, y);
  y += 12;

  // --- Datos generales ---
  doc.setTextColor(0);
  doc.setFontSize(11);

  const fila = (etiqueta: string, valor: string) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${etiqueta}:`, margenIzq, y);
    doc.setFont('helvetica', 'normal');
    doc.text(valor, margenIzq + 42, y);
    y += 7;
  };

  fila('Prescripción N°', String(prescripcion.idPrescripcion));
  fila('Fecha', dayjs(prescripcion.fecha).format('DD/MM/YYYY'));
  fila('Estado', prescripcion.estado);
  y += 3;

  fila('Paciente', `${prescripcion.paciente.apellido}, ${prescripcion.paciente.nombre}`);
  fila('DNI', prescripcion.paciente.dni);
  fila('Obra social', prescripcion.paciente.obraSocial?.nombre ?? 'Sin obra social');
  y += 3;

  fila(
    'Profesional',
    `${prescripcion.profesional.apellido}, ${prescripcion.profesional.nombre} (M.P. ${prescripcion.profesional.matricula})`,
  );
  fila('Especialidad', prescripcion.profesional.especialidad);
  fila('Tipo de práctica', TIPO_PRACTICA_LABEL[prescripcion.tipoPractica]);
  y += 6;

  // --- Diagnóstico ---
  doc.setFont('helvetica', 'bold');
  doc.text('Diagnóstico:', margenIzq, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const diagnosticoLineas = doc.splitTextToSize(prescripcion.diagnostico, 170);
  doc.text(diagnosticoLineas, margenIzq, y);
  y += diagnosticoLineas.length * 6 + 6;

  // --- Observaciones ---
  if (prescripcion.observaciones) {
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', margenIzq, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const observacionesLineas = doc.splitTextToSize(prescripcion.observaciones, 170);
    doc.text(observacionesLineas, margenIzq, y);
    y += observacionesLineas.length * 6 + 6;
  }

  // --- Firma ---
  y = Math.max(y + 20, 230);

  if (prescripcion.profesional.firma) {
    const imagenFirma = await imagenABase64(prescripcion.profesional.firma);
    if (imagenFirma) {
      try {
        // jsPDF no calcula el ancho solo: hay que sacarle las proporciones
        // reales a la imagen y escalarlas manteniendo el aspect ratio.
        const altoMm = 18;
        const propiedades = doc.getImageProperties(imagenFirma);
        const anchoMm = (propiedades.width / propiedades.height) * altoMm;
        doc.addImage(imagenFirma, margenIzq, y - altoMm, anchoMm, altoMm);
      } catch {
        // Si el formato de imagen no es compatible, seguimos sin romper el PDF.
      }
    }
  }

  y += 2;
  doc.setDrawColor(0);
  doc.line(margenIzq, y, margenIzq + 70, y);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text('Firma y sello del profesional', margenIzq, y + 5);

  doc.setFontSize(8);
  doc.text(
    `Documento generado por RP Virtual el ${dayjs().format('DD/MM/YYYY HH:mm')}`,
    margenIzq,
    285,
  );

  doc.save(`RP-${prescripcion.idPrescripcion}-${prescripcion.paciente.apellido}.pdf`);
}
