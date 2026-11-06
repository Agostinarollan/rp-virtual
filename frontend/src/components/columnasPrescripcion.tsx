import { Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import {
  ESTADO_AUDITORIA_COLOR,
  ESTADO_AUDITORIA_LABEL,
  ESTADO_PRESCRIPCION_COLOR,
  ESTADO_PRESCRIPCION_LABEL,
  type Prescripcion,
} from '../types';

// Columnas base de una prescripción. Las comparten el listado de
// Prescripciones y las vistas de Habitaciones y Turnero de Quirófano, para
// que todas muestren la prescripción de la misma forma.
export const columnasPrescripcion: ColumnsType<Prescripcion> = [
  { title: 'ID', dataIndex: 'idPrescripcion', width: 70 },
  {
    title: 'Paciente',
    render: (_, r) => `${r.paciente.apellido}, ${r.paciente.nombre}`,
  },
  { title: 'DNI', render: (_, r) => r.paciente.dni },
  {
    title: 'Obra social',
    render: (_, r) => r.paciente.obraSocial?.nombre ?? '-',
  },
  {
    title: 'Profesional',
    render: (_, r) => `${r.profesional.apellido}, ${r.profesional.nombre}`,
  },
  { title: 'Tipo', render: (_, r) => r.tipoPractica.nombre },
  {
    title: 'Fecha',
    render: (_, r) => dayjs(r.fecha).format('DD/MM/YYYY'),
  },
  {
    title: 'Estado',
    render: (_, r) => (
      <Tag color={ESTADO_PRESCRIPCION_COLOR[r.estado]}>{ESTADO_PRESCRIPCION_LABEL[r.estado]}</Tag>
    ),
  },
];

// Estado de la auditoría de la obra social (vacío = todavía no auditada).
export const columnaAuditoria: ColumnsType<Prescripcion>[number] = {
  title: 'Auditoría OS',
  render: (_, r) =>
    r.estadoAuditoria ? (
      <Tag color={ESTADO_AUDITORIA_COLOR[r.estadoAuditoria]}>
        {ESTADO_AUDITORIA_LABEL[r.estadoAuditoria]}
      </Tag>
    ) : (
      <Tag>Pendiente</Tag>
    ),
};
