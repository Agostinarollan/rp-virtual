import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../api/axios';
import { Rol } from '../types';

interface Usuario {
  idUsuario: number;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  rol: Rol;
  activo: boolean;
}

interface FormValues {
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  contrasena?: string;
  rol: Rol;
}

const ROL_LABEL: Record<Rol, string> = {
  [Rol.ADMINISTRADOR]: 'Administrador',
  [Rol.PROFESIONAL]: 'Profesional',
};

export function UsuariosPage() {
  const [data, setData] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Usuario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get<Usuario[]>('/usuarios');
      setData(data);
    } catch {
      message.error('No se pudieron cargar los usuarios.');
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

  const abrirEditar = (registro: Usuario) => {
    setEditando(registro);
    form.setFieldsValue({
      nombre: registro.nombre,
      apellido: registro.apellido,
      nombreUsuario: registro.nombreUsuario,
      rol: registro.rol,
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    const values = await form.validateFields();
    setGuardando(true);
    try {
      if (editando) {
        // La contraseña no se edita por acá (el backend ni la acepta en este endpoint).
        const { contrasena: _contrasena, ...payload } = values;
        await api.patch(`/usuarios/${editando.idUsuario}`, payload);
        message.success('Usuario actualizado.');
      } else {
        await api.post('/usuarios', values);
        message.success('Usuario creado.');
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

  const eliminar = async (registro: Usuario) => {
    try {
      await api.delete(`/usuarios/${registro.idUsuario}`);
      message.success('Usuario dado de baja.');
      cargar();
    } catch {
      message.error('No se pudo dar de baja.');
    }
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Usuarios
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirNuevo}>
          Nuevo usuario
        </Button>
      </Space>

      <Table<Usuario>
        rowKey="idUsuario"
        loading={cargando}
        dataSource={data}
        columns={[
          { title: 'Apellido', dataIndex: 'apellido' },
          { title: 'Nombre', dataIndex: 'nombre' },
          { title: 'Usuario', dataIndex: 'nombreUsuario' },
          {
            title: 'Rol',
            render: (_, r) => (
              <Tag color={r.rol === Rol.ADMINISTRADOR ? 'purple' : 'blue'}>{ROL_LABEL[r.rol]}</Tag>
            ),
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
                <Popconfirm title="¿Dar de baja este usuario?" onConfirm={() => eliminar(r)} okText="Sí" cancelText="No">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editando ? 'Editar usuario' : 'Nuevo usuario'}
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        onOk={guardar}
        confirmLoading={guardando}
        okText="Guardar"
        cancelText="Cancelar"
        width={480}
      >
        <Form form={form} layout="vertical">
          <Space.Compact block>
            <Form.Item
              label="Nombre"
              name="nombre"
              style={{ width: '50%' }}
              rules={[{ required: true, message: 'Requerido.' }]}
            >
              <Input autoFocus />
            </Form.Item>
            <Form.Item
              label="Apellido"
              name="apellido"
              style={{ width: '50%' }}
              rules={[{ required: true, message: 'Requerido.' }]}
            >
              <Input />
            </Form.Item>
          </Space.Compact>

          <Form.Item
            label="Nombre de usuario"
            name="nombreUsuario"
            rules={[{ required: true, message: 'Requerido.' }]}
          >
            <Input disabled={!!editando} />
          </Form.Item>

          {!editando && (
            <Form.Item
              label="Contraseña"
              name="contrasena"
              rules={[
                { required: true, message: 'Requerido.' },
                { min: 6, message: 'Mínimo 6 caracteres.' },
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}

          <Form.Item label="Rol" name="rol" rules={[{ required: true, message: 'Requerido.' }]}>
            <Select
              options={[
                { value: Rol.ADMINISTRADOR, label: 'Administrador' },
                { value: Rol.PROFESIONAL, label: 'Profesional' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
