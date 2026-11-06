import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Space, Typography, Tag, Modal, Form, Input, message, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../api/axios';
import type { TipoPractica } from '../types';

// ABM de tipos de práctica (antes era un enum fijo: pedido del docente).
export function TiposPracticaPage() {
  const [data, setData] = useState<TipoPractica[]>([]);
  const [cargando, setCargando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<TipoPractica | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ nombre: string }>();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get<TipoPractica[]>('/tipos-practica');
      setData(data);
    } catch {
      message.error('No se pudieron cargar los tipos de práctica.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirNuevo = () => {
    setEditando(null);
    form.resetFields();
    setModalAbierto(true);
  };

  const abrirEditar = (registro: TipoPractica) => {
    setEditando(registro);
    form.setFieldsValue({ nombre: registro.nombre });
    setModalAbierto(true);
  };

  const guardar = async () => {
    const values = await form.validateFields();
    setGuardando(true);
    try {
      if (editando) {
        await api.patch(`/tipos-practica/${editando.idTipoPractica}`, values);
        message.success('Tipo de práctica actualizado.');
      } else {
        await api.post('/tipos-practica', values);
        message.success('Tipo de práctica creado.');
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

  const eliminar = async (registro: TipoPractica) => {
    try {
      await api.delete(`/tipos-practica/${registro.idTipoPractica}`);
      message.success('Tipo de práctica dado de baja.');
      cargar();
    } catch {
      message.error('No se pudo dar de baja.');
    }
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Tipos de práctica
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirNuevo}>
          Nuevo tipo de práctica
        </Button>
      </Space>

      <Table<TipoPractica>
        rowKey="idTipoPractica"
        loading={cargando}
        dataSource={data}
        columns={[
          { title: 'ID', dataIndex: 'idTipoPractica', width: 70 },
          { title: 'Nombre', dataIndex: 'nombre' },
          {
            // El código se genera al crear y no cambia: CIRUGIA e INTERNACION
            // son los que usan las vistas de Habitaciones y Turnero de Quirófano.
            title: 'Código',
            render: (_, r) => <Typography.Text code>{r.codigo}</Typography.Text>,
          },
          {
            title: 'Estado',
            render: (_, r) => <Tag color={r.activo ? 'green' : 'default'}>{r.activo ? 'ACTIVO' : 'INACTIVO'}</Tag>,
          },
          {
            title: 'Acciones',
            width: 140,
            render: (_, r) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(r)} />
                <Popconfirm
                  title="¿Dar de baja este tipo de práctica?"
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
        title={editando ? 'Editar tipo de práctica' : 'Nuevo tipo de práctica'}
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
            rules={[{ required: true, message: 'Ingresá el nombre del tipo de práctica.' }]}
          >
            <Input placeholder="Ej: Estudio por imágenes" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
