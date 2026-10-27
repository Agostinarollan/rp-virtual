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
  DatePicker,
  message,
  Popconfirm,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { api } from '../api/axios';
import type { Paciente, ObraSocial } from '../types';

interface FormValues {
  nombre: string;
  apellido: string;
  dni: string;
  fechaNacimiento?: dayjs.Dayjs;
  idObraSocial?: number;
  numeroAfiliado?: string;
  celular?: string;
}

export function PacientesPage() {
  const [data, setData] = useState<Paciente[]>([]);
  const [obrasSociales, setObrasSociales] = useState<ObraSocial[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Paciente | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const cargar = useCallback(async (search?: string) => {
    setCargando(true);
    try {
      const { data } = await api.get<Paciente[]>('/pacientes', {
        params: search ? { search } : undefined,
      });
      setData(data);
    } catch {
      message.error('No se pudieron cargar los pacientes.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    api.get<ObraSocial[]>('/obras-sociales').then(({ data }) => setObrasSociales(data));
  }, [cargar]);

  const abrirNuevo = () => {
    setEditando(null);
    form.resetFields();
    setModalAbierto(true);
  };

  const abrirEditar = (registro: Paciente) => {
    setEditando(registro);
    form.setFieldsValue({
      nombre: registro.nombre,
      apellido: registro.apellido,
      dni: registro.dni,
      idObraSocial: registro.obraSocial?.idObraSocial,
      numeroAfiliado: registro.numeroAfiliado ?? undefined,
      celular: registro.celular ?? undefined,
    });
    setModalAbierto(true);
  };

  const guardar = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      fechaNacimiento: values.fechaNacimiento?.format('YYYY-MM-DD'),
    };
    setGuardando(true);
    try {
      if (editando) {
        await api.patch(`/pacientes/${editando.idPaciente}`, payload);
        message.success('Paciente actualizado.');
      } else {
        await api.post('/pacientes', payload);
        message.success('Paciente creado.');
      }
      setModalAbierto(false);
      cargar(busqueda);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo guardar.';
      message.error(Array.isArray(msg) ? msg.join(' / ') : msg);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (registro: Paciente) => {
    try {
      await api.delete(`/pacientes/${registro.idPaciente}`);
      message.success('Paciente dado de baja.');
      cargar(busqueda);
    } catch {
      message.error('No se pudo dar de baja (necesitás rol Administrador).');
    }
  };

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Pacientes
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={abrirNuevo}>
          Nuevo paciente
        </Button>
      </Space>

      <Input.Search
        placeholder="Buscar por DNI, nombre o apellido..."
        allowClear
        enterButton={<SearchOutlined />}
        style={{ maxWidth: 360, marginBottom: 16 }}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        onSearch={(valor) => cargar(valor)}
      />

      <Table<Paciente>
        rowKey="idPaciente"
        loading={cargando}
        dataSource={data}
        columns={[
          { title: 'Apellido', dataIndex: 'apellido' },
          { title: 'Nombre', dataIndex: 'nombre' },
          { title: 'DNI', dataIndex: 'dni' },
          { title: 'Obra social', render: (_, r) => r.obraSocial?.nombre ?? '-' },
          { title: 'Celular', render: (_, r) => r.celular ?? '-' },
          {
            title: 'Acciones',
            width: 140,
            render: (_, r) => (
              <Space>
                <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(r)} />
                <Popconfirm title="¿Dar de baja este paciente?" onConfirm={() => eliminar(r)} okText="Sí" cancelText="No">
                  <Button size="small" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />

      <Modal
        title={editando ? 'Editar paciente' : 'Nuevo paciente'}
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        onOk={guardar}
        confirmLoading={guardando}
        okText="Guardar"
        cancelText="Cancelar"
        width={560}
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

          <Form.Item label="DNI" name="dni" rules={[{ required: true, message: 'Requerido.' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Fecha de nacimiento" name="fechaNacimiento">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Obra social" name="idObraSocial">
            <Select
              allowClear
              placeholder="Sin obra social"
              options={obrasSociales.map((o) => ({ value: o.idObraSocial, label: o.nombre }))}
            />
          </Form.Item>

          <Space.Compact block>
            <Form.Item label="N° de afiliado" name="numeroAfiliado" style={{ width: '50%' }}>
              <Input />
            </Form.Item>
            <Form.Item label="Celular" name="celular" style={{ width: '50%' }}>
              <Input />
            </Form.Item>
          </Space.Compact>
        </Form>
      </Modal>
    </div>
  );
}
