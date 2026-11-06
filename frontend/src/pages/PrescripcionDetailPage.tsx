import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Typography, Spin, message, Space } from 'antd';
import { ArrowLeftOutlined, FilePdfOutlined, EditOutlined, AuditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/axios';
import { useAuthStore } from '../store/auth.store';
import {
  CODIGO_CIRUGIA,
  CODIGO_INTERNACION,
  ESTADO_AUDITORIA_COLOR,
  ESTADO_AUDITORIA_LABEL,
  ESTADO_PRESCRIPCION_COLOR,
  ESTADO_PRESCRIPCION_LABEL,
  Rol,
  type Prescripcion,
} from '../types';
import { generarPdfPrescripcion } from '../utils/generarPdfPrescripcion';
import { AuditoriaModal } from '../components/AuditoriaModal';

export function PrescripcionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const esObraSocial = useAuthStore((s) => s.usuario?.rol === Rol.OBRA_SOCIAL);
  const [prescripcion, setPrescripcion] = useState<Prescripcion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [generandoPdf, setGenerandoPdf] = useState(false);
  const [auditando, setAuditando] = useState(false);

  useEffect(() => {
    api
      .get<Prescripcion>(`/prescripciones/${id}`)
      .then(({ data }) => setPrescripcion(data))
      .catch(() => message.error('No se pudo cargar la prescripción.'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <Spin />;
  if (!prescripcion) return null;

  const codigoTipo = prescripcion.tipoPractica.codigo;

  return (
    <Card style={{ maxWidth: 720, margin: '0 auto' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/prescripciones')}>
          Volver al listado
        </Button>
        <Space>
          {esObraSocial ? (
            <Button icon={<AuditOutlined />} onClick={() => setAuditando(true)}>
              Auditar
            </Button>
          ) : (
            <Button icon={<EditOutlined />} onClick={() => navigate(`/prescripciones/${prescripcion.idPrescripcion}/editar`)}>
              Editar
            </Button>
          )}
          <Button
            type="primary"
            icon={<FilePdfOutlined />}
            loading={generandoPdf}
            onClick={async () => {
              setGenerandoPdf(true);
              try {
                await generarPdfPrescripcion(prescripcion);
              } finally {
                setGenerandoPdf(false);
              }
            }}
          >
            Descargar PDF
          </Button>
        </Space>
      </Space>
      <Typography.Title level={3}>Prescripción #{prescripcion.idPrescripcion}</Typography.Title>

      <Descriptions bordered column={2} size="middle">
        <Descriptions.Item label="Estado" span={2}>
          <Tag color={ESTADO_PRESCRIPCION_COLOR[prescripcion.estado]}>
            {ESTADO_PRESCRIPCION_LABEL[prescripcion.estado]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Paciente">
          {prescripcion.paciente.apellido}, {prescripcion.paciente.nombre}
        </Descriptions.Item>
        <Descriptions.Item label="DNI">{prescripcion.paciente.dni}</Descriptions.Item>
        <Descriptions.Item label="Obra social">
          {prescripcion.paciente.obraSocial?.nombre ?? '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha">
          {dayjs(prescripcion.fecha).format('DD/MM/YYYY')}
        </Descriptions.Item>
        <Descriptions.Item label="Profesional">
          {prescripcion.profesional.apellido}, {prescripcion.profesional.nombre} (M.P.{' '}
          {prescripcion.profesional.matricula})
        </Descriptions.Item>
        <Descriptions.Item label="Tipo de práctica">{prescripcion.tipoPractica.nombre}</Descriptions.Item>
        {(codigoTipo === CODIGO_CIRUGIA || codigoTipo === CODIGO_INTERNACION) && (
          <Descriptions.Item label="Habitación" span={codigoTipo === CODIGO_CIRUGIA ? 1 : 2}>
            {prescripcion.habitacion
              ? `${prescripcion.habitacion.numero}${prescripcion.habitacion.piso ? ` (piso ${prescripcion.habitacion.piso})` : ''}`
              : 'Sin asignar'}
          </Descriptions.Item>
        )}
        {codigoTipo === CODIGO_CIRUGIA && (
          <Descriptions.Item label="Turno de quirófano">
            {prescripcion.turnoQuirofano
              ? `${prescripcion.turnoQuirofano.quirofano.nombre} — ${dayjs(prescripcion.turnoQuirofano.fechaHora).format('DD/MM/YYYY HH:mm')}`
              : 'Sin programar'}
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Diagnóstico" span={2}>
          {prescripcion.diagnostico}
        </Descriptions.Item>
        <Descriptions.Item label="Observaciones" span={2}>
          {prescripcion.observaciones || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Auditoría OS">
          {prescripcion.estadoAuditoria ? (
            <Tag color={ESTADO_AUDITORIA_COLOR[prescripcion.estadoAuditoria]}>
              {ESTADO_AUDITORIA_LABEL[prescripcion.estadoAuditoria]}
            </Tag>
          ) : (
            <Tag>Pendiente</Tag>
          )}
        </Descriptions.Item>
        <Descriptions.Item label="Fecha de auditoría">
          {prescripcion.fechaAuditoria ? dayjs(prescripcion.fechaAuditoria).format('DD/MM/YYYY HH:mm') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Observaciones de la OS" span={2}>
          {prescripcion.observacionesAuditoria || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="Firma del profesional" span={2}>
          {prescripcion.profesional.firma ? (
            <img
              src={prescripcion.profesional.firma}
              alt="Firma del profesional"
              style={{ height: 60 }}
            />
          ) : (
            <Typography.Text type="secondary">El profesional todavía no cargó su firma.</Typography.Text>
          )}
        </Descriptions.Item>
      </Descriptions>

      <AuditoriaModal
        prescripcion={auditando ? prescripcion : null}
        onCerrar={() => setAuditando(false)}
        onAuditada={(actualizada) => {
          setPrescripcion(actualizada);
          setAuditando(false);
        }}
      />
    </Card>
  );
}
