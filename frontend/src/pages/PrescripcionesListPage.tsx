import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Input, Space, Tag, Typography, message } from 'antd';
import { PlusOutlined, SearchOutlined, FilePdfOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { api } from '../api/axios';
import {
  ESTADO_PRESCRIPCION_COLOR,
  TIPO_PRACTICA_LABEL,
  type Prescripcion,
} from '../types';
import { generarPdfPrescripcion } from '../utils/generarPdfPrescripcion';

export function PrescripcionesListPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Prescripcion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const cargar = useCallback(async (search?: string) => {
    setCargando(true);
    try {
      const { data } = await api.get<Prescripcion[]>('/prescripciones', {
        params: search ? { search } : undefined,
      });
      setData(data);
    } catch {
      message.error('No se pudieron cargar las prescripciones.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div>
      <Space style={{ width: '100%', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          Prescripciones
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/prescripciones/nueva')}>
          Nuevo
        </Button>
      </Space>

      <Input.Search
        placeholder="Buscar por paciente o DNI..."
        allowClear
        enterButton={<SearchOutlined />}
        style={{ maxWidth: 360, marginBottom: 16 }}
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        onSearch={(valor) => cargar(valor)}
      />

      <Table<Prescripcion>
        rowKey="idPrescripcion"
        loading={cargando}
        dataSource={data}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => navigate(`/prescripciones/${record.idPrescripcion}`),
        })}
        columns={[
          { title: 'ID', dataIndex: 'idPrescripcion', width: 70 },
          {
            title: 'Paciente',
            render: (_, r) => `${r.paciente.apellido}, ${r.paciente.nombre}`,
          },
          { title: 'DNI', render: (_, r) => r.paciente.dni },
          {
            title: 'Obra social',
            render: (_, r) => r.paciente.obraSocial?.nombre ?? '-',
          },
          {
            title: 'Profesional',
            render: (_, r) => `${r.profesional.apellido}, ${r.profesional.nombre}`,
          },
          {
            title: 'Tipo',
            render: (_, r) => TIPO_PRACTICA_LABEL[r.tipoPractica],
          },
          {
            title: 'Fecha',
            render: (_, r) => dayjs(r.fecha).format('DD/MM/YYYY'),
          },
          {
            title: 'Estado',
            render: (_, r) => (
              <Tag color={ESTADO_PRESCRIPCION_COLOR[r.estado]}>{r.estado}</Tag>
            ),
          },
          {
            title: 'Acciones',
            width: 120,
            render: (_, r) => (
              <Space onClick={(e) => e.stopPropagation()}>
                <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/prescripciones/${r.idPrescripcion}`)} />
                <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/prescripciones/${r.idPrescripcion}/editar`)} />
                <Button size="small" icon={<FilePdfOutlined />} onClick={() => void generarPdfPrescripcion(r)} />
              </Space>
            ),
          },
        ]}
      />
    </div>
  );
}
