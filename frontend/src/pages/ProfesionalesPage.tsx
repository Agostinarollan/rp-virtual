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
  message,
  Popconfirm,
  Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../api/axios';
import { Rol, type Profesional } from '../types';
import { FirmaUploader } from '../components/FirmaUploader';

interface UsuarioOpcion {
  idUsuario: number;
  nombre: string;
  apellido: string;
  nombreUsuario: string;
  rol: Rol;
}

interface FormValues {
  nombre: string;
  apellido: string;
  especialidad: string;
  matricula: string;
  idUsuario?: number;
}

export function ProfesionalesPage() {
  const [data, setData] = useState<Profesional[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioOpcion[]>([]);
  const [cargando, setCargando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Profesional | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const [{ data: profesionales }, { data: usuariosData }] = await Promise.all([
        api.get<Profesional[]>('/profesionales'),
        api.get<UsuarioOpcion[]>('/usuarios'),
      ]);
      setData(profesionales);
      setUsuarios(usuariosData);
    } catch {
      message.error('No se pudieron cargar los profesionales.');
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

  const abrirEditar = (registro: Profesional) => {
    setEditando(registro);
    form.setFieldsValue({
      nombre: registro.nombre,
      apellido: registro.apellido,
      especialidad: registro.especialidad,
      matricula: registro.matricula,
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    const values = await form.validateFields();
    setGuardando(true);
    try {
      if (editando) {
        const { idUsuario: _idUsuario, ...payload } = values;
        await api.patch(`/profesionales/${editando.idProfesional}`, payload);
        message.success('Profesional actualizado.');
      } else {
        await api.post('/profesionales', values);
        message.success('Profesional creado.');
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

  const eliminar = async (registro: Profesional) => {
    try {
      await api.delete(`/profesionales/${registro.idProfesional}`);
      message.success('Profesional dado de baja.');
      cargar();
    } catch {
      message.error('No se pudo dar de baja.');
    }
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Profesionales
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirNuevo}>
          Nuevo profesional
        </Button>
      </Space>

      <Table<Profesional>
        rowKey="idProfesional"
        loading={cargando}
        dataSource={data}
        columns={[
          { title: 'Apellido', dataIndex: 'apellido' },
          { title: 'Nombre', dataIndex: 'nombre' },
          { title: 'Especialidad', dataIndex: 'especialidad' },
          { title: 'Matrícula', dataIndex: 'matricula' },
          {
            title: 'Acciones',
            width: 140,
            render: (_, r) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(r)} />
                <Popconfirm title="¿Dar de baja este profesional?" onConfirm={() => eliminar(r)} okText="Sí" cancelText="No">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editando ? 'Editar profesional' : 'Nuevo profesional'}
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        onOk={guardar}
        confirmLoading={guardando}
        okText="Guardar"
        cancelText="Cancelar"
        width={560}
      >
        <Form form={form} layout="vertical">
          {!editando && (
            <Form.Item
              label="Usuario (con rol Profesional)"
              name="idUsuario"
              rules={[{ required: true, message: 'Seleccioná el usuario a vincular.' }]}
              extra={
                usuarios.filter((u) => u.rol === Rol.PROFESIONAL).length === 0 && (
                  <Alert
                    style={{ marginTop: 8 }}
                    type="warning"
                    showIcon
                    message="No hay usuarios con rol Profesional todavía. Creá uno primero en la sección Usuarios."
                  />
                )
              }
            >
              <Select
                placeholder="Elegí el usuario"
                options={usuarios
                  .filter((u) => u.rol === Rol.PROFESIONAL)
                  .map((u) => ({
                    value: u.idUsuario,
                    label: `${u.apellido}, ${u.nombre} (@${u.nombreUsuario})`,
                  }))}
              />
            </Form.Item>
          )}

          <Space.Compact block>
            <Form.Item
              label="Nombre"
              name="nombre"
              style={{ width: '50%' }}
              rules={[{ required: true, message: 'Requerido.' }]}
            >
              <Input />
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
            label="Especialidad"
            name="especialidad"
            rules={[{ required: true, message: 'Requerido.' }]}
          >
            <Input placeholder="Ej: Clínica Médica" />
          </Form.Item>

          <Form.Item
            label="Matrícula (M.P.)"
            name="matricula"
            rules={[{ required: true, message: 'Requerido.' }]}
          >
            <Input placeholder="Ej: 12345" />
          </Form.Item>
        </Form>

        {/* La firma se sube aparte (no es un campo del formulario): necesita
            que el profesional ya exista, porque se guarda en /profesionales/:id/firma */}
        {editando && (
          <>
            <Typography.Text strong>Firma digital</Typography.Text>
            <div style={{ marginTop: 8 }}>
              {/* onSubida recarga la tabla: si no, al reabrir el modal se veía la firma vieja */}
              <FirmaUploader
                idProfesional={editando.idProfesional}
                firmaActual={editando.firma}
                onSubida={cargar}
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
