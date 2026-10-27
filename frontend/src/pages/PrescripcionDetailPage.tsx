import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Typography, Spin, message, Space } from 'antd';
import { ArrowLeftOutlined, FilePdfOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/axios';
import { ESTADO_PRESCRIPCION_COLOR, TIPO_PRACTICA_LABEL, type Prescripcion } from '../types';
import { generarPdfPrescripcion } from '../utils/generarPdfPrescripcion';

export function PrescripcionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescripcion, setPrescripcion] = useState<Prescripcion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  useEffect(() => {
    api
      .get<Prescripcion>(`/prescripciones/${id}`)
      .then(({ data }) => setPrescripcion(data))
      .catch(() => message.error('No se pudo cargar la prescripción.'))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <Spin />;
  if (!prescripcion) return null;

  return (
    <Card style={{ maxWidth: 720, margin: '0 auto' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/prescripciones')}>
          Volver al listado
        </Button>
        <Space>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/prescripciones/${prescripcion.idPrescripcion}/editar`)}>
            Editar
          </Button>
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
          <Tag color={ESTADO_PRESCRIPCION_COLOR[prescripcion.estado]}>{prescripcion.estado}</Tag>
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
        <Descriptions.Item label="Tipo de práctica">
          {TIPO_PRACTICA_LABEL[prescripcion.tipoPractica]}
        </Descriptions.Item>
        <Descriptions.Item label="Diagnóstico" span={2}>
          {prescripcion.diagnostico}
        </Descriptions.Item>
        <Descriptions.Item label="Observaciones" span={2}>
          {prescripcion.observaciones || '-'}
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
    </Card>
  );
}
