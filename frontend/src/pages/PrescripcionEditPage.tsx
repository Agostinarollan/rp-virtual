import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, Form, Select, Input, Button, Typography, Descriptions, message, Spin } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { api } from '../api/axios';
import {
  EstadoPrescripcion,
  ESTADO_PRESCRIPCION_LABEL,
  type Prescripcion,
  type TipoPractica,
} from '../types';

const { TextArea } = Input;

interface FormValues {
  idTipoPractica: number;
  diagnostico: string;
  observaciones?: string;
  estado: EstadoPrescripcion;
}

export function PrescripcionEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();

  const [prescripcion, setPrescripcion] = useState<Prescripcion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [tiposPractica, setTiposPractica] = useState<TipoPractica[]>([]);

  useEffect(() => {
    api
      .get<TipoPractica[]>('/tipos-practica')
      .then(({ data }) => setTiposPractica(data))
      .catch(() => message.error('No se pudieron cargar los tipos de práctica.'));
  }, []);

  useEffect(() => {
    api
      .get<Prescripcion>(`/prescripciones/${id}`)
      .then(({ data }) => {
        setPrescripcion(data);
        form.setFieldsValue({
          idTipoPractica: data.tipoPractica.idTipoPractica,
          diagnostico: data.diagnostico,
          observaciones: data.observaciones ?? undefined,
          estado: data.estado,
        });
      })
      .catch(() => message.error('No se pudo cargar la prescripción.'))
      .finally(() => setCargando(false));
  }, [id, form]);

  const onFinish = async (values: FormValues) => {
    setGuardando(true);
    try {
      await api.patch(`/prescripciones/${id}`, values);
      message.success('Prescripción actualizada.');
      navigate(`/prescripciones/${id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo guardar.';
      message.error(Array.isArray(msg) ? msg.join(' / ') : msg);
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) return <Spin />;
  if (!prescripcion) return null;

  return (
    <Card style={{ maxWidth: 720, margin: '0 auto' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/prescripciones/${id}`)} style={{ marginBottom: 16 }}>
        Volver
      </Button>
      <Typography.Title level={3}>Editar prescripción #{prescripcion.idPrescripcion}</Typography.Title>

      {/* Paciente y profesional no se reasignan desde una edición (se mantiene
          la trazabilidad); para eso se anula esta y se crea una nueva. */}
      <Descriptions size="small" bordered column={2} style={{ marginBottom: 24 }}>
        <Descriptions.Item label="Paciente">
          {prescripcion.paciente.apellido}, {prescripcion.paciente.nombre}
        </Descriptions.Item>
        <Descriptions.Item label="DNI">{prescripcion.paciente.dni}</Descriptions.Item>
        <Descriptions.Item label="Profesional" span={2}>
          {prescripcion.profesional.apellido}, {prescripcion.profesional.nombre} (M.P.{' '}
          {prescripcion.profesional.matricula})
        </Descriptions.Item>
      </Descriptions>

      <Form form={form} layout="vertical" onFinish={onFinish} disabled={guardando}>
        <Form.Item
          label="Tipo de prescripción"
          name="idTipoPractica"
          rules={[{ required: true, message: 'Seleccioná el tipo de práctica.' }]}
        >
          {/* Se muestran los activos + el actual (aunque se haya dado de baja). */}
          <Select
            options={tiposPractica
              .filter((tp) => tp.activo || tp.idTipoPractica === prescripcion.tipoPractica.idTipoPractica)
              .map((tp) => ({ value: tp.idTipoPractica, label: tp.nombre }))}
          />
        </Form.Item>

        <Form.Item
          label="Diagnóstico"
          name="diagnostico"
          rules={[{ required: true, message: 'Ingresá el diagnóstico.' }]}
        >
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Observaciones" name="observaciones">
          <TextArea rows={3} />
        </Form.Item>

        <Form.Item label="Estado" name="estado" rules={[{ required: true, message: 'Requerido.' }]}>
          <Select
            options={Object.values(EstadoPrescripcion).map((e) => ({
              value: e,
              label: ESTADO_PRESCRIPCION_LABEL[e],
            }))}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={() => navigate(`/prescripciones/${id}`)} style={{ marginRight: 8 }}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" loading={guardando}>
            Guardar cambios
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
