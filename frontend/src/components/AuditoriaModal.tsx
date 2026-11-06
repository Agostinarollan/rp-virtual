import { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Descriptions, message } from 'antd';
import { api } from '../api/axios';
import {
  ESTADO_AUDITORIA_LABEL,
  EstadoAuditoria,
  type Prescripcion,
} from '../types';

interface AuditoriaModalProps {
  prescripcion: Prescripcion | null; // null = modal cerrado
  onCerrar: () => void;
  onAuditada: (actualizada: Prescripcion) => void;
}

interface FormValues {
  estadoAuditoria: EstadoAuditoria;
  observacionesAuditoria?: string;
}

// Lo usa el rol Obra Social: elige Aprobada / Rechazada / En Auditoría desde un
// desplegable y puede dejar observaciones en un box de mensaje.
export function AuditoriaModal({ prescripcion, onCerrar, onAuditada }: AuditoriaModalProps) {
  const [form] = Form.useForm<FormValues>();
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (prescripcion) {
      form.setFieldsValue({
        estadoAuditoria: prescripcion.estadoAuditoria ?? undefined,
        observacionesAuditoria: prescripcion.observacionesAuditoria ?? undefined,
      });
    }
  }, [prescripcion, form]);

  const guardar = async () => {
    if (!prescripcion) return;
    const values = await form.validateFields();
    setGuardando(true);
    try {
      const { data } = await api.patch<Prescripcion>(
        `/prescripciones/${prescripcion.idPrescripcion}/auditoria`,
        values,
      );
      message.success('Auditoría guardada.');
      onAuditada(data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo guardar la auditoría.';
      message.error(Array.isArray(msg) ? msg.join(' / ') : msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal
      title={prescripcion ? `Auditar prescripción #${prescripcion.idPrescripcion}` : ''}
      open={!!prescripcion}
      onCancel={onCerrar}
      onOk={guardar}
      confirmLoading={guardando}
      okText="Guardar"
      cancelText="Cancelar"
      destroyOnClose
    >
      {prescripcion && (
        <Descriptions size="small" bordered column={1} style={{ marginBottom: 16 }}>
          <Descriptions.Item label="Afiliado">
            {prescripcion.paciente.apellido}, {prescripcion.paciente.nombre} (DNI {prescripcion.paciente.dni})
          </Descriptions.Item>
          <Descriptions.Item label="Práctica">{prescripcion.tipoPractica.nombre}</Descriptions.Item>
          <Descriptions.Item label="Diagnóstico">{prescripcion.diagnostico}</Descriptions.Item>
        </Descriptions>
      )}
      <Form form={form} layout="vertical">
        <Form.Item
          label="Resultado de la auditoría"
          name="estadoAuditoria"
          rules={[{ required: true, message: 'Seleccioná una opción.' }]}
        >
          <Select
            placeholder="Seleccioná una opción"
            options={Object.values(EstadoAuditoria).map((e) => ({
              value: e,
              label: ESTADO_AUDITORIA_LABEL[e],
            }))}
          />
        </Form.Item>
        <Form.Item label="Observaciones" name="observacionesAuditoria">
          <Input.TextArea rows={4} placeholder="Ej: Se requiere historia clínica para autorizar..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
