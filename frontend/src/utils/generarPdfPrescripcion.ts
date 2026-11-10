import { jsPDF } from 'jspdf';
import dayjs from 'dayjs';
import { ESTADO_PRESCRIPCION_LABEL, type Prescripcion } from '../types';
// Hoja membretada (A4) del sanatorio: encabezado con logo + pie con datos de contacto.
// Vite la resuelve a una URL servible, que después pasamos a base64.
import membreteUrl from '../assets/membrete-receta.png';

// Colores institucionales tomados del membrete
const AZUL: [number, number, number] = [22, 52, 90];
const VERDE: [number, number, number] = [20, 150, 145];

// Zona útil de la hoja (en mm) para no pisar el membrete ni el pie de página
const ZONA_TOP = 55;
const ZONA_BOTTOM = 258;

// Descarga una imagen (la firma o el membrete) y la convierte a base64
// para poder incrustarla en el PDF con jsPDF.
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
  const anchoPagina = doc.internal.pageSize.getWidth(); // 210
  const altoPagina = doc.internal.pageSize.getHeight(); // 297
  const margenIzq = 20;
  const margenDer = anchoPagina - 20;
  const anchoTexto = margenDer - margenIzq;

  // --- Fondo: hoja membretada ---
  const membrete = await imagenABase64(membreteUrl);
  const dibujarMembrete = () => {
    if (!membrete) return;
    try {
      doc.addImage(membrete, 'PNG', 0, 0, anchoPagina, altoPagina, 'membrete', 'FAST');
    } catch {
      // Si falla, el PDF se genera igual sin membrete.
    }
  };
  dibujarMembrete();

  let y = ZONA_TOP;

  // Si el contenido no entra, agrega otra hoja membretada
  const asegurarEspacio = (alto: number) => {
    if (y + alto > ZONA_BOTTOM) {
      doc.addPage();
      dibujarMembrete();
      y = ZONA_TOP;
    }
  };

  // --- Título ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...AZUL);
  doc.text('PEDIDO MÉDICO', margenIzq, y);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90);
  doc.text(`N° ${prescripcion.idPrescripcion}`, margenDer, y - 5, { align: 'right' });
  doc.text(dayjs(prescripcion.fecha).format('DD/MM/YYYY'), margenDer, y, { align: 'right' });
  y += 10;

  // --- Bloques de datos ---
  const tituloSeccion = (titulo: string) => {
    asegurarEspacio(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...VERDE);
    doc.text(titulo.toUpperCase(), margenIzq, y);
    doc.setDrawColor(...VERDE);
    doc.setLineWidth(0.3);
    doc.line(margenIzq, y + 1.5, margenDer, y + 1.5);
    y += 7;
  };

  const fila = (etiqueta: string, valor: string) => {
    asegurarEspacio(6);
    doc.setFontSize(10.5);
    doc.setTextColor(...AZUL);
    doc.setFont('helvetica', 'bold');
    doc.text(`${etiqueta}:`, margenIzq, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30);
    doc.text(valor, margenIzq + 38, y);
    y += 6;
  };

  tituloSeccion('Paciente');
  fila('Apellido y nombre', `${prescripcion.paciente.apellido}, ${prescripcion.paciente.nombre}`);
  fila('DNI', prescripcion.paciente.dni);
  fila('Obra social', prescripcion.paciente.obraSocial?.nombre ?? 'Sin obra social');
  y += 4;

  tituloSeccion('Profesional');
  fila(
    'Médico/a',
    `${prescripcion.profesional.apellido}, ${prescripcion.profesional.nombre} (M.P. ${prescripcion.profesional.matricula})`,
  );
  fila('Especialidad', prescripcion.profesional.especialidad);
  y += 4;

  tituloSeccion('Indicación');
  fila('Tipo de práctica', prescripcion.tipoPractica.nombre);
  fila('Estado', ESTADO_PRESCRIPCION_LABEL[prescripcion.estado]);
  y += 4;

  // --- Rp/ ---
  asegurarEspacio(12);
  doc.setFont('times', 'bolditalic');
  doc.setFontSize(20);
  doc.setTextColor(...AZUL);
  doc.text('Rp/', margenIzq, y + 4);
  y += 12;

  const parrafo = (titulo: string, texto: string) => {
    asegurarEspacio(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...AZUL);
    doc.text(`${titulo}:`, margenIzq, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30);
    const lineas: string[] = doc.splitTextToSize(texto, anchoTexto);
    for (const linea of lineas) {
      asegurarEspacio(6);
      doc.text(linea, margenIzq, y);
      y += 5.5;
    }
    y += 4;
  };

  parrafo('Diagnóstico', prescripcion.diagnostico);
  if (prescripcion.observaciones) {
    parrafo('Observaciones', prescripcion.observaciones);
  }

  // --- Firma (abajo a la derecha, encima del pie) ---
  const altoFirma = 18;
  const yLineaFirma = ZONA_BOTTOM - 12;
  if (y + altoFirma + 6 > yLineaFirma) {
    doc.addPage();
    dibujarMembrete();
  }
  const anchoLinea = 70;
  const xFirma = margenDer - anchoLinea;

  if (prescripcion.profesional.firma) {
    const imagenFirma = await imagenABase64(prescripcion.profesional.firma);
    if (imagenFirma) {
      try {
        // jsPDF no calcula el ancho solo: hay que sacarle las proporciones
        // reales a la imagen y escalarlas manteniendo el aspect ratio.
        const propiedades = doc.getImageProperties(imagenFirma);
        const anchoMm = Math.min((propiedades.width / propiedades.height) * altoFirma, anchoLinea);
        doc.addImage(
          imagenFirma,
          xFirma + (anchoLinea - anchoMm) / 2,
          yLineaFirma - altoFirma - 1,
          anchoMm,
          altoFirma,
        );
      } catch {
        // Si el formato de imagen no es compatible, seguimos sin romper el PDF.
      }
    }
  }

  doc.setDrawColor(...AZUL);
  doc.setLineWidth(0.3);
  doc.line(xFirma, yLineaFirma, margenDer, yLineaFirma);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80);
  doc.text('Firma y sello del profesional', xFirma + anchoLinea / 2, yLineaFirma + 5, {
    align: 'center',
  });

  // Leyenda de generación, justo arriba de las líneas del pie
  doc.setFontSize(7.5);
  doc.setTextColor(140);
  doc.text(
    `Documento generado por RP Virtual el ${dayjs().format('DD/MM/YYYY HH:mm')}`,
    margenIzq,
    ZONA_BOTTOM + 3,
  );

  doc.save(`RP-${prescripcion.idPrescripcion}-${prescripcion.paciente.apellido}.pdf`);
}
