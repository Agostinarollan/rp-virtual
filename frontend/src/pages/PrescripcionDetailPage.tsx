import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Typography, Spin, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/axios';
import { ESTADO_PRESCRIPCION_COLOR, TIPO_PRACTICA_LABEL, type Prescripcion } from '../types';

export function PrescripcionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prescripcion, setPrescripcion] = useState<Prescripcion | null>(null);
  const [cargando, setCargando] = useState(true);

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
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/prescripciones')} style={{ marginBottom: 16 }}>
        Volver al listado
      </Button>
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
      </Descriptions>
    </Card>
  );
}
