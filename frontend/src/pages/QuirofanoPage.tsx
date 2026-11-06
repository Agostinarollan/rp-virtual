import { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Typography,
  Tag,
  Tabs,
  Select,
  DatePicker,
  Modal,
  Form,
  Popconfirm,
  message,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs, { type Dayjs } from 'dayjs';
import { api } from '../api/axios';
import { CODIGO_CIRUGIA, EstadoPrescripcion, type Prescripcion, type Quirofano } from '../types';
import { columnasPrescripcion } from '../components/columnasPrescripcion';

// Lo que se está eligiendo en cada fila antes de tocar "Programar".
interface Borrador {
  idQuirofano?: number;
  fechaHora?: Dayjs | null;
}

// Turnero de Quirófano (solo Administrador): solo prescripciones de cirugía.
// En cada una se elige el quirófano (desplegable) y la fecha y hora (calendario).
// Los turnos son por hora exacta y un quirófano no puede tener dos turnos a la misma hora.
export function QuirofanoPage() {
  const navigate = useNavigate();
  const [prescripciones, setPrescripciones] = useState<Prescripcion[]>([]);
  const [quirofanos, setQuirofanos] = useState<Quirofano[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [borradores, setBorradores] = useState<Record<number, Borrador>>({});
  const [guardandoId, setGuardandoId] = useState<number | null>(null);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Quirofano | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [form] = Form.useForm<{ nombre: string }>();

  const cargarPrescripciones = useCallback(async (search?: string) => {
    setCargando(true);
    try {
      const { data } = await api.get<Prescripcion[]>('/prescripciones', {
        params: { tipos: CODIGO_CIRUGIA, ...(search ? { search } : {}) },
      });
      setPrescripciones(data);
      setBorradores({});
    } catch {
      message.error('No se pudieron cargar las cirugías.');
    } finally {
      setCargando(false);
    }
  }, []);

  const cargarQuirofanos = useCallback(async () => {
    try {
      const { data } = await api.get<Quirofano[]>('/quirofanos');
      setQuirofanos(data);
    } catch {
      message.error('No se pudieron cargar los quirófanos.');
    }
  }, []);

  useEffect(() => {
    cargarPrescripciones();
    cargarQuirofanos();
  }, [cargarPrescripciones, cargarQuirofanos]);

  // Primero las que tienen turno (de la más próxima a la más lejana), después las pendientes.
  const ordenadas = useMemo(
    () =>
      [...prescripciones].sort((a, b) => {
        if (!a.turnoQuirofano) return b.turnoQuirofano ? 1 : 0;
        if (!b.turnoQuirofano) return -1;
        return dayjs(a.turnoQuirofano.fechaHora).diff(dayjs(b.turnoQuirofano.fechaHora));
      }),
    [prescripciones],
  );

  // Valor que se muestra en la fila: lo que se está editando, o el turno guardado.
  const valorFila = (r: Prescripcion): Borrador => ({
    idQuirofano: r.turnoQuirofano?.quirofano.idQuirofano,
    fechaHora: r.turnoQuirofano ? dayjs(r.turnoQuirofano.fechaHora) : null,
    ...borradores[r.idPrescripcion],
  });

  const cambiarBorrador = (idPrescripcion: number, cambios: Borrador) =>
    setBorradores((prev) => ({ ...prev, [idPrescripcion]: { ...prev[idPrescripcion], ...cambios } }));

  const actualizarFila = (actualizada: Prescripcion) => {
    setPrescripciones((prev) =>
      prev.map((p) => (p.idPrescripcion === actualizada.idPrescripcion ? actualizada : p)),
    );
    setBorradores(({ [actualizada.idPrescripcion]: _descartado, ...resto }) => resto);
  };

  const mostrarError = (err: unknown, porDefecto: string) => {
    const msg =
      (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? porDefecto;
    message.error(Array.isArray(msg) ? msg.join(' / ') : msg);
  };

  const programar = async (r: Prescripcion) => {
    const { idQuirofano, fechaHora } = valorFila(r);
    if (!idQuirofano || !fechaHora) {
      message.warning('Elegí el quirófano y la fecha y hora del turno.');
      return;
    }
    setGuardandoId(r.idPrescripcion);
    try {
      const { data } = await api.put<Prescripcion>(`/prescripciones/${r.idPrescripcion}/turno-quirofano`, {
        idQuirofano,
        fechaHora: fechaHora.minute(0).second(0).millisecond(0).toISOString(),
      });
      actualizarFila(data);
      message.success('Turno programado.');
    } catch (err) {
      mostrarError(err, 'No se pudo programar el turno.');
    } finally {
      setGuardandoId(null);
    }
  };

  const cancelarTurno = async (r: Prescripcion) => {
    setGuardandoId(r.idPrescripcion);
    try {
      const { data } = await api.delete<Prescripcion>(`/prescripciones/${r.idPrescripcion}/turno-quirofano`);
      actualizarFila(data);
      message.success('Turno cancelado.');
    } catch (err) {
      mostrarError(err, 'No se pudo cancelar el turno.');
    } finally {
      setGuardandoId(null);
    }
  };

  // --- ABM de quirófanos ---
  const abrirNuevo = () => {
    setEditando(null);
    form.resetFields();
    setModalAbierto(true);
  };

  const abrirEditar = (registro: Quirofano) => {
    setEditando(registro);
    form.setFieldsValue({ nombre: registro.nombre });
    setModalAbierto(true);
  };

  const guardar = async () => {
    const values = await form.validateFields();
    setGuardando(true);
    try {
      if (editando) {
        await api.patch(`/quirofanos/${editando.idQuirofano}`, values);
        message.success('Quirófano actualizado.');
      } else {
        await api.post('/quirofanos', values);
        message.success('Quirófano creado.');
      }
      setModalAbierto(false);
      cargarQuirofanos();
      cargarPrescripciones(busqueda); // por si se renombró uno con turnos
    } catch (err) {
      mostrarError(err, 'No se pudo guardar.');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (registro: Quirofano) => {
    try {
      await api.delete(`/quirofanos/${registro.idQuirofano}`);
      message.success('Quirófano dado de baja.');
      cargarQuirofanos();
    } catch {
      message.error('No se pudo dar de baja.');
    }
  };

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        Turnero de Quirófano
      </Typography.Title>

      <Tabs
        items={[
          {
            key: 'turnos',
            label: 'Turnos',
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
                  dataSource={ordenadas}
                  scroll={{ x: 'max-content' }}
                  columns={[
                    ...columnasPrescripcion,
                    {
                      title: 'Quirófano',
                      width: 170,
                      render: (_, r) => (
                        <Select
                          style={{ width: 160 }}
                          placeholder="Elegir quirófano"
                          disabled={r.estado === EstadoPrescripcion.ANULADA}
                          value={valorFila(r).idQuirofano}
                          onChange={(idQuirofano: number) => cambiarBorrador(r.idPrescripcion, { idQuirofano })}
                          options={quirofanos
                            .filter((q) => q.activo || q.idQuirofano === r.turnoQuirofano?.quirofano.idQuirofano)
                            .map((q) => ({ value: q.idQuirofano, label: q.nombre }))}
                        />
                      ),
                    },
                    {
                      title: 'Fecha y hora',
                      width: 200,
                      render: (_, r) => (
                        <DatePicker
                          style={{ width: 190 }}
                          placeholder="Elegir fecha y hora"
                          disabled={r.estado === EstadoPrescripcion.ANULADA}
                          showTime={{ format: 'HH' }} // solo horas: los turnos son por hora exacta
                          format="DD/MM/YYYY HH:00"
                          disabledDate={(fecha) => fecha.isBefore(dayjs(), 'day')}
                          value={valorFila(r).fechaHora}
                          onChange={(fechaHora) => cambiarBorrador(r.idPrescripcion, { fechaHora })}
                        />
                      ),
                    },
                    {
                      title: 'Turno',
                      render: (_, r) =>
                        r.turnoQuirofano ? <Tag color="blue">Programado</Tag> : <Tag>Sin programar</Tag>,
                    },
                    {
                      title: 'Acciones',
                      width: 190,
                      render: (_, r) => (
                        <Space>
                          <Button
                            size="small"
                            type="primary"
                            icon={<CalendarOutlined />}
                            loading={guardandoId === r.idPrescripcion}
                            disabled={r.estado === EstadoPrescripcion.ANULADA}
                            onClick={() => programar(r)}
                          >
                            Programar
                          </Button>
                          {r.turnoQuirofano && (
                            <Popconfirm
                              title="¿Cancelar este turno?"
                              onConfirm={() => cancelarTurno(r)}
                              okText="Sí"
                              cancelText="No"
                            >
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          )}
                          <Button
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate(`/prescripciones/${r.idPrescripcion}`)}
                          />
                        </Space>
                      ),
                    },
                  ]}
                />
              </>
            ),
          },
          {
            key: 'abm',
            label: 'Quirófanos',
            children: (
              <>
                <Button type="primary" icon={<PlusOutlined />} onClick={abrirNuevo} style={{ marginBottom: 16 }}>
                  Nuevo quirófano
                </Button>
                <Table<Quirofano>
                  rowKey="idQuirofano"
                  dataSource={quirofanos}
                  columns={[
                    { title: 'ID', dataIndex: 'idQuirofano', width: 70 },
                    { title: 'Nombre', dataIndex: 'nombre' },
                    {
                      title: 'Estado',
                      render: (_, r) => (
                        <Tag color={r.activo ? 'green' : 'default'}>{r.activo ? 'ACTIVO' : 'INACTIVO'}</Tag>
                      ),
                    },
                    {
                      title: 'Acciones',
                      width: 140,
                      render: (_, r) => (
                        <Space>
                          <Button size="small" icon={<EditOutlined />} onClick={() => abrirEditar(r)} />
                          <Popconfirm
                            title="¿Dar de baja este quirófano?"
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
        title={editando ? 'Editar quirófano' : 'Nuevo quirófano'}
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
            rules={[{ required: true, message: 'Ingresá el nombre del quirófano.' }]}
          >
            <Input placeholder="Ej: Quirófano 4" autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
