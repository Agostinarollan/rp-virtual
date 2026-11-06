import { useEffect, useState, useCallback, useMemo } from 'react';
import { Table, Input, Select, Space, Tag, Typography, Alert, Descriptions, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../api/axios';
import { useAuthStore } from '../store/auth.store';
import {
  ACCION_HISTORIAL_COLOR,
  ACCION_HISTORIAL_LABEL,
  AccionHistorial,
  ESTADO_AUDITORIA_LABEL,
  ESTADO_PRESCRIPCION_LABEL,
  EstadoAuditoria,
  EstadoPrescripcion,
  Rol,
  type CambioHistorial,
  type RegistroHistorial,
} from '../types';

const CAMPO_LABEL: Record<CambioHistorial['campo'], string> = {
  tipoPractica: 'Tipo',
  diagnostico: 'Diagnóstico',
  observaciones: 'Observaciones',
  estado: 'Estado',
  fecha: 'Fecha',
  estadoAuditoria: 'Auditoría OS',
  observacionesAuditoria: 'Observaciones de la OS',
};

// Registros anteriores a los cambios del docente guardaban el código del enum
// viejo (ej: "MEDICAMENTO", "ENTREGADA"): si no hay etiqueta, se muestra tal cual.
function etiquetaEstado(valor: string) {
  return ESTADO_PRESCRIPCION_LABEL[valor as EstadoPrescripcion] ?? valor;
}

// Muestra el valor de un cambio de forma legible (fechas y tipos de práctica).
function formatearValor(campo: CambioHistorial['campo'], valor: string | null) {
  if (!valor) return '-';
  if (campo === 'fecha') return dayjs(valor).format('DD/MM/YYYY');
  if (campo === 'estado') return etiquetaEstado(valor);
  if (campo === 'estadoAuditoria') return ESTADO_AUDITORIA_LABEL[valor as EstadoAuditoria] ?? valor;
  return valor;
}

export function HistorialPage() {
  const navigate = useNavigate();
  const esAdministrador = useAuthStore((s) => s.usuario?.rol === Rol.ADMINISTRADOR);
  const [data, setData] = useState<RegistroHistorial[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [accion, setAccion] = useState<AccionHistorial | undefined>();

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      const { data } = await api.get<RegistroHistorial[]>('/historial');
      setData(data);
    } catch {
      message.error('No se pudo cargar el historial.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (esAdministrador) cargar();
  }, [cargar, esAdministrador]);

  // El filtrado es local: el historial ya viene completo del backend.
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return data.filter((r) => {
      if (accion && r.accion !== accion) return false;
      if (!texto) return true;
      return [
        String(r.idPrescripcion),
        r.paciente.nombre,
        r.paciente.apellido,
        r.paciente.dni,
        r.profesional.nombre,
        r.profesional.apellido,
        r.usuario.nombreUsuario,
      ].some((valor) => valor.toLowerCase().includes(texto));
    });
  }, [data, busqueda, accion]);

  if (!esAdministrador) {
    return <Alert type="warning" showIcon message="Solo el Administrador puede ver el historial." />;
  }

  return (
    <div>
      <Typography.Title level={3} style={{ marginBottom: 16 }}>
        Historial de prescripciones
      </Typography.Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Input
          placeholder="Buscar por N°, paciente, DNI, profesional o usuario..."
          allowClear
          prefix={<SearchOutlined />}
          style={{ width: 360 }}
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <Select
          placeholder="Todas las acciones"
          allowClear
          style={{ width: 200 }}
          value={accion}
          onChange={setAccion}
          options={Object.values(AccionHistorial).map((a) => ({
            value: a,
            label: ACCION_HISTORIAL_LABEL[a],
          }))}
        />
      </Space>

      <Table<RegistroHistorial>
        rowKey="id"
        loading={cargando}
        dataSource={filtrados}
        expandable={{
          expandedRowRender: (r) => (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="Tipo">{r.tipoPractica}</Descriptions.Item>
                <Descriptions.Item label="Fecha de la prescripción">
                  {dayjs(r.fechaPrescripcion).format('DD/MM/YYYY')}
                </Descriptions.Item>
                <Descriptions.Item label="Diagnóstico" span={2}>{r.diagnostico}</Descriptions.Item>
                <Descriptions.Item label="Observaciones" span={2}>{r.observaciones || '-'}</Descriptions.Item>
              </Descriptions>
              {r.cambios.length > 0 && (
                <Table<CambioHistorial>
                  size="small"
                  rowKey="campo"
                  pagination={false}
                  dataSource={r.cambios}
                  columns={[
                    { title: 'Campo modificado', render: (_, c) => CAMPO_LABEL[c.campo] },
                    { title: 'Antes', render: (_, c) => formatearValor(c.campo, c.antes) },
                    { title: 'Después', render: (_, c) => formatearValor(c.campo, c.despues) },
                  ]}
                />
              )}
            </Space>
          ),
        }}
        columns={[
          {
            title: 'Fecha y hora',
            width: 160,
            render: (_, r) => dayjs(r.fecha).format('DD/MM/YYYY HH:mm'),
          },
          {
            title: 'Acción',
            render: (_, r) => (
              <Tag color={ACCION_HISTORIAL_COLOR[r.accion]}>{ACCION_HISTORIAL_LABEL[r.accion]}</Tag>
            ),
          },
          {
            title: 'Prescripción N°',
            render: (_, r) => (
              <Typography.Link onClick={() => navigate(`/prescripciones/${r.idPrescripcion}`)}>
                {r.idPrescripcion}
              </Typography.Link>
            ),
          },
          {
            title: 'Paciente',
            render: (_, r) => `${r.paciente.apellido}, ${r.paciente.nombre} (${r.paciente.dni})`,
          },
          {
            title: 'Profesional',
            render: (_, r) => `${r.profesional.apellido}, ${r.profesional.nombre}`,
          },
          { title: 'Usuario', render: (_, r) => r.usuario.nombreUsuario },
        ]}
      />
    </div>
  );
}
