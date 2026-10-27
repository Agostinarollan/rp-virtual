import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../api/axios';
import type { ObraSocial } from '../types';

export function ObrasSocialesPage() {
  const [data, setData] = useState<ObraSocial[]>([]);
  const [cargando, setCargando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<ObraSocial | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ nombre: string }>();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get<ObraSocial[]>('/obras-sociales');
      setData(data);
    } catch {
      message.error('No se pudieron cargar las obras sociales.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirNueva = () => {
    setEditando(null);
    form.resetFields();
    setModalAbierto(true);
  };

  const abrirEditar = (registro: ObraSocial) => {
    setEditando(registro);
    form.setFieldsValue({ nombre: registro.nombre });
    setModalAbierto(true);
  };

  const guardar = async () => {
    const values = await form.validateFields();
    setGuardando(true);
    try {
      if (editando) {
        await api.patch(`/obras-sociales/${editando.idObraSocial}`, values);
        message.success('Obra social actualizada.');
      } else {
        await api.post('/obras-sociales', values);
        message.success('Obra social creada.');
      }
      setModalAbierto(false);
      cargar();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo guardar.';
      message.error(Array.isArray(msg) ? msg.join(' / ') : msg);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (registro: ObraSocial) => {
    try {
      await api.delete(`/obras-sociales/${registro.idObraSocial}`);
      message.success('Obra social dada de baja.');
      cargar();
    } catch {
      message.error('No se pudo dar de baja.');
    }
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Obras sociales
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirNueva}>
          Nueva obra social
        </Button>
      </Space>

      <Table<ObraSocial>
        rowKey="idObraSocial"
        loading={cargando}
        dataSource={data}
        columns={[
          { title: 'ID', dataIndex: 'idObraSocial', width: 70 },
          { title: 'Nombre', dataIndex: 'nombre' },
          {
            title: 'Estado',
            render: (_, r) => <Tag color={r.activo ? 'green' : 'default'}>{r.activo ? 'ACTIVA' : 'INACTIVA'}</Tag>,
          },
          {
            title: 'Acciones',
            width: 140,
            render: (_, r) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(r)} />
                <Popconfirm
                  title="¿Dar de baja esta obra social?"
                  onConfirm={() => eliminar(r)}
                  okText="Sí"
                  cancelText="No"
                  disabled={!r.activo}
                >
                  <Button size="small" danger icon={<DeleteOutlined />} disabled={!r.activo} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editando ? 'Editar obra social' : 'Nueva obra social'}
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        onOk={guardar}
        confirmLoading={guardando}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Nombre"
            name="nombre"
            rules={[{ required: true, message: 'Ingresá el nombre de la obra social.' }]}
          >
            <Input placeholder="Ej: Avalian" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
