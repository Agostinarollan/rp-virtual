import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Typography,
  Tag,
  Tabs,
  Select,
  Modal,
  Form,
  Popconfirm,
  message,
} from 'antd';
import { SearchOutlined, EyeOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import {
  CODIGO_CIRUGIA,
  CODIGO_INTERNACION,
  EstadoPrescripcion,
  type Habitacion,
  type Prescripcion,
} from '../types';
import { columnasPrescripcion } from '../components/columnasPrescripcion';

interface HabitacionFormValues {
  numero: string;
  piso?: string;
}

// Vista Habitaciones (solo Administrador): la misma vista de Prescripciones,
// pero solo con las de internación y cirugía, y con un desplegable para
// asignarle una habitación a cada una. En la otra pestaña, el ABM de habitaciones.
export function HabitacionesPage() {
  const navigate = useNavigate();
  const [prescripciones, setPrescripciones] = useState<Prescripcion[]>([]);
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [asignando, setAsignando] = useState<number | null>(null); // idPrescripcion en curso

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Habitacion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<HabitacionFormValues>();

  const cargarPrescripciones = useCallback(async (search?: string) => {
    setCargando(true);
    try {
      const { data } = await api.get<Prescripcion[]>('/prescripciones', {
        params: { tipos: `${CODIGO_INTERNACION},${CODIGO_CIRUGIA}`, ...(search ? { search } : {}) },
      });
      setPrescripciones(data);
    } catch {
      message.error('No se pudieron cargar las prescripciones.');
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarHabitaciones = useCallback(async () => {
    try {
      const { data } = await api.get<Habitacion[]>('/habitaciones');
      setHabitaciones(data);
    } catch {
      message.error('No se pudieron cargar las habitaciones.');
    }
  }, []);

  useEffect(() => {
    cargarPrescripciones();
    cargarHabitaciones();
  }, [cargarPrescripciones, cargarHabitaciones]);

  const asignarHabitacion = async (prescripcion: Prescripcion, idHabitacion: number | null) => {
    setAsignando(prescripcion.idPrescripcion);
    try {
      const { data } = await api.patch<Prescripcion>(
        `/prescripciones/${prescripcion.idPrescripcion}/habitacion`,
        { idHabitacion },
      );
      setPrescripciones((prev) => prev.map((p) => (p.idPrescripcion === data.idPrescripcion ? data : p)));
      message.success(idHabitacion ? 'Habitación asignada.' : 'Habitación liberada.');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo asignar la habitación.';
      message.error(Array.isArray(msg) ? msg.join(' / ') : msg);
    } finally {
      setAsignando(null);
    }
  };

  // --- ABM de habitaciones ---
  const abrirNueva = () => {
    setEditando(null);
    form.resetFields();
    setModalAbierto(true);
  };

  const abrirEditar = (registro: Habitacion) => {
    setEditando(registro);
    form.setFieldsValue({ numero: registro.numero, piso: registro.piso ?? undefined });
    setModalAbierto(true);
  };

  const guardar = async () => {
    const values = await form.validateFields();
    setGuardando(true);
    try {
      if (editando) {
        await api.patch(`/habitaciones/${editando.idHabitacion}`, values);
        message.success('Habitación actualizada.');
      } else {
        await api.post('/habitaciones', values);
        message.success('Habitación creada.');
      }
      setModalAbierto(false);
      cargarHabitaciones();
      cargarPrescripciones(busqueda); // por si cambió el número de una asignada
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo guardar.';
      message.error(Array.isArray(msg) ? msg.join(' / ') : msg);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (registro: Habitacion) => {
    try {
      await api.delete(`/habitaciones/${registro.idHabitacion}`);
      message.success('Habitación dada de baja.');
      cargarHabitaciones();
    } catch {
      message.error('No se pudo dar de baja.');
    }
  };

  const etiquetaHabitacion = (h: Habitacion) => `${h.numero}${h.piso ? ` (piso ${h.piso})` : ''}`;

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        Habitaciones
      </Typography.Title>

      <Tabs
        items={[
          {
            key: 'prescripciones',
            label: 'Internación y cirugía',
            children: (
              <>
                <Input.Search
                  placeholder="Buscar por paciente o DNI..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  style={{ maxWidth: 360, marginBottom: 16 }}
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onSearch={(valor) => cargarPrescripciones(valor)}
                />
                <Table<Prescripcion>
                  rowKey="idPrescripcion"
                  loading={cargando}
                  dataSource={prescripciones}
                  columns={[
                    ...columnasPrescripcion,
                    {
                      title: 'Habitación',
                      width: 200,
                      render: (_, r) => (
                        <Select
                          style={{ width: '100%' }}
                          placeholder="Sin asignar"
                          allowClear
                          loading={asignando === r.idPrescripcion}
                          disabled={asignando === r.idPrescripcion || r.estado === EstadoPrescripcion.ANULADA}
                          value={r.habitacion?.idHabitacion}
                          onChange={(idHabitacion?: number) => asignarHabitacion(r, idHabitacion ?? null)}
                          // Activas + la que ya tiene asignada (aunque se haya dado de baja).
                          options={habitaciones
                            .filter((h) => h.activo || h.idHabitacion === r.habitacion?.idHabitacion)
                            .map((h) => ({ value: h.idHabitacion, label: etiquetaHabitacion(h) }))}
                        />
                      ),
                    },
                    {
                      title: '',
                      width: 50,
                      render: (_, r) => (
                        <Button
                          size="small"
                          icon={<EyeOutlined />}
                          onClick={() => navigate(`/prescripciones/${r.idPrescripcion}`)}
                        />
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'abm',
            label: 'Gestión de habitaciones',
            children: (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={abrirNueva} style={{ marginBottom: 16 }}>
                  Nueva habitación
                </Button>
                <Table<Habitacion>
                  rowKey="idHabitacion"
                  dataSource={habitaciones}
                  columns={[
                    { title: 'Número', dataIndex: 'numero' },
                    { title: 'Piso', render: (_, r) => r.piso ?? '-' },
                    {
                      title: 'Estado',
                      render: (_, r) => (
                        <Tag color={r.activo ? 'green' : 'default'}>{r.activo ? 'ACTIVA' : 'INACTIVA'}</Tag>
                      ),
                    },
                    {
                      title: 'Acciones',
                      width: 140,
                      render: (_, r) => (
                        <Space>
                          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(r)} />
                          <Popconfirm
                            title="¿Dar de baja esta habitación?"
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
              </>
            ),
          },
        ]}
      />

      <Modal
        title={editando ? 'Editar habitación' : 'Nueva habitación'}
        open={modalAbierto}
        onCancel={() => setModalAbierto(false)}
        onOk={guardar}
        confirmLoading={guardando}
        okText="Guardar"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Número"
            name="numero"
            rules={[{ required: true, message: 'Ingresá el número de habitación.' }]}
          >
            <Input placeholder="Ej: 101" autoFocus />
          </Form.Item>
          <Form.Item label="Piso" name="piso">
            <Input placeholder="Ej: 1" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
