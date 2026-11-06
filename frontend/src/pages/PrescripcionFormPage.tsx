import { useEffect, useState } from 'react';
import {
  Card,
  Form,
  Select,
  Input,
  Button,
  Typography,
  Descriptions,
  Tag,
  message,
  Spin,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuthStore } from '../store/auth.store';
import {
  Rol,
  type TipoPractica,
  type Paciente,
  type Profesional,
  type CreatePrescripcionPayload,
} from '../types';

const { TextArea } = Input;

interface FormValues {
  idPaciente: number;
  idProfesional?: number;
  idTipoPractica: number;
  diagnostico: string;
  observaciones?: string;
}

export function PrescripcionFormPage() {
  const navigate = useNavigate();
  const [form] = Form.useForm<FormValues>();
  const usuario = useAuthStore((s) => s.usuario);
  const esAdministrador = usuario?.rol === Rol.ADMINISTRADOR;

  const [guardando, setGuardando] = useState(false);

  // Tipos de práctica: ahora es una entidad, se traen de la API (solo activos).
  const [tiposPractica, setTiposPractica] = useState<TipoPractica[]>([]);
  useEffect(() => {
    api
      .get<TipoPractica[]>('/tipos-practica')
      .then(({ data }) => setTiposPractica(data.filter((t) => t.activo)))
      .catch(() => message.error('No se pudieron cargar los tipos de práctica.'));
  }, []);

  // --- Búsqueda de paciente (por DNI o nombre/apellido) ---
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [buscandoPaciente, setBuscandoPaciente] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);

  const buscarPacientes = async (texto: string) => {
    if (!texto || texto.length < 2) {
      setPacientes([]);
      return;
    }
    setBuscandoPaciente(true);
    try {
      const { data } = await api.get<Paciente[]>('/pacientes', { params: { search: texto } });
      setPacientes(data);
    } finally {
      setBuscandoPaciente(false);
    }
  };

  // --- Búsqueda de profesional (solo para Administrador - RB-04) ---
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [buscandoProfesional, setBuscandoProfesional] = useState(false);

  const buscarProfesionales = async (texto: string) => {
    setBuscandoProfesional(true);
    try {
      const { data } = await api.get<Profesional[]>('/profesionales');
      const filtro = texto.toLowerCase();
      setProfesionales(
        texto
          ? data.filter(
              (p) =>
                `${p.nombre} ${p.apellido}`.toLowerCase().includes(filtro) ||
                p.matricula.toLowerCase().includes(filtro),
            )
          : data,
      );
    } finally {
      setBuscandoProfesional(false);
    }
  };

  const onFinish = async (values: FormValues) => {
    setGuardando(true);
    try {
      const payload: CreatePrescripcionPayload = {
        idPaciente: values.idPaciente,
        idTipoPractica: values.idTipoPractica,
        diagnostico: values.diagnostico,
        observaciones: values.observaciones,
        // Si es Profesional, el backend ignora/fuerza esto con su propio
        // idProfesional igual (RB-04); si es Administrador, es obligatorio.
        ...(esAdministrador ? { idProfesional: values.idProfesional } : {}),
      };
      await api.post('/prescripciones', payload);
      message.success('Prescripción creada correctamente.');
      navigate('/prescripciones');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'No se pudo guardar la prescripción.';
      message.error(Array.isArray(msg) ? msg.join(' / ') : msg);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Card style={{ maxWidth: 720, margin: '0 auto' }}>
      <Typography.Title level={3}>Formulario de Prescripción</Typography.Title>

      <Form form={form} layout="vertical" onFinish={onFinish} disabled={guardando}>
        {/* --- Profesional --- */}
        {esAdministrador ? (
          <Form.Item
            label="Profesional"
            name="idProfesional"
            rules={[{ required: true, message: 'Seleccioná un profesional.' }]}
          >
            <Select
              showSearch
              placeholder="Buscar profesional por nombre o matrícula..."
              filterOption={false}
              notFoundContent={buscandoProfesional ? <Spin size="small" /> : 'Sin resultados'}
              onSearch={buscarProfesionales}
              onFocus={() => buscarProfesionales('')}
              options={profesionales.map((p) => ({
                value: p.idProfesional,
                label: `${p.apellido}, ${p.nombre} (M.P. ${p.matricula})`,
              }))}
            />
          </Form.Item>
        ) : (
          <Form.Item label="Profesional">
            <Tag color="green">
              {usuario?.nombre} {usuario?.apellido} — autocompletado
            </Tag>
          </Form.Item>
        )}

        {/* --- Paciente --- */}
        <Form.Item
          label="Buscar paciente por DNI o nombre"
          name="idPaciente"
          rules={[{ required: true, message: 'Seleccioná un paciente.' }]}
        >
          <Select
            showSearch
            placeholder="Buscar por DNI o nombre y apellido..."
            filterOption={false}
            notFoundContent={buscandoPaciente ? <Spin size="small" /> : 'Sin resultados'}
            onSearch={buscarPacientes}
            onChange={(idPaciente) =>
              setPacienteSeleccionado(pacientes.find((p) => p.idPaciente === idPaciente) ?? null)
            }
            options={pacientes.map((p) => ({
              value: p.idPaciente,
              label: `${p.apellido}, ${p.nombre} — DNI ${p.dni}`,
            }))}
          />
        </Form.Item>

        {/* Al seleccionar el paciente se completan nombre, apellido, DNI y obra social */}
        {pacienteSeleccionado && (
          <Descriptions size="small" bordered column={2} style={{ marginBottom: 24 }}>
            <Descriptions.Item label="Nombre">{pacienteSeleccionado.nombre}</Descriptions.Item>
            <Descriptions.Item label="Apellido">{pacienteSeleccionado.apellido}</Descriptions.Item>
            <Descriptions.Item label="DNI">{pacienteSeleccionado.dni}</Descriptions.Item>
            <Descriptions.Item label="Obra social">
              {pacienteSeleccionado.obraSocial?.nombre ?? 'Sin obra social'}
            </Descriptions.Item>
          </Descriptions>
        )}

        {/* --- Tipo de práctica: entidad TipoPractica (ABM en "Tipos de práctica") --- */}
        <Form.Item
          label="Tipo de prescripción"
          name="idTipoPractica"
          rules={[{ required: true, message: 'Seleccioná el tipo de práctica.' }]}
        >
          <Select
            placeholder="Seleccioná un tipo"
            options={tiposPractica.map((tp) => ({
              value: tp.idTipoPractica,
              label: tp.nombre,
            }))}
          />
        </Form.Item>

        {/* --- Diagnóstico: texto libre obligatorio --- */}
        <Form.Item
          label="Diagnóstico"
          name="diagnostico"
          rules={[{ required: true, message: 'Ingresá el diagnóstico.' }]}
        >
          <TextArea rows={3} placeholder="Ej: Nevus, faringitis, fractura de radio..." />
        </Form.Item>

        {/* --- Observaciones: texto libre opcional (acá va, por ej., la cantidad) --- */}
        <Form.Item label="Observaciones" name="observaciones">
          <TextArea
            rows={3}
            placeholder="Ej: 1 x Amoxicilina 500mg cada 8hs por 7 días..."
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Button onClick={() => navigate('/prescripciones')} style={{ marginRight: 8 }}>
            Cancelar
          </Button>
          <Button type="primary" htmlType="submit" loading={guardando}>
            Guardar
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
