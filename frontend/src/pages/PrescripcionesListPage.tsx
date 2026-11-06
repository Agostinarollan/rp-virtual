import { useEffect, useState, useCallback } from 'react';
import { Table, Button, Input, Space, Typography, message } from 'antd';
import { PlusOutlined, SearchOutlined, FilePdfOutlined, EyeOutlined, EditOutlined, AuditOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuthStore } from '../store/auth.store';
import { Rol, type Prescripcion } from '../types';
import { generarPdfPrescripcion } from '../utils/generarPdfPrescripcion';
import { columnasPrescripcion, columnaAuditoria } from '../components/columnasPrescripcion';
import { AuditoriaModal } from '../components/AuditoriaModal';

export function PrescripcionesListPage() {
  const navigate = useNavigate();
  // La Obra Social solo consulta y audita: no crea ni edita prescripciones.
  const esObraSocial = useAuthStore((s) => s.usuario?.rol === Rol.OBRA_SOCIAL);
  const [data, setData] = useState<Prescripcion[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [auditando, setAuditando] = useState<Prescripcion | null>(null);

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
          {esObraSocial ? 'Prescripciones de afiliados' : 'Prescripciones'}
        </Typography.Title>
        {!esObraSocial && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/prescripciones/nueva')}>
            Nuevo
          </Button>
        )}
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
          ...columnasPrescripcion,
          columnaAuditoria,
          {
            title: 'Acciones',
            width: esObraSocial ? 150 : 120,
            render: (_, r) => (
              <Space onClick={(e) => e.stopPropagation()}>
                <Button size="small" icon={<EyeOutlined />} onClick={() => navigate(`/prescripciones/${r.idPrescripcion}`)} />
                {esObraSocial ? (
                  <Button size="small" type="primary" icon={<AuditOutlined />} onClick={() => setAuditando(r)}>
                    Auditar
                  </Button>
                ) : (
                  <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/prescripciones/${r.idPrescripcion}/editar`)} />
                )}
                <Button size="small" icon={<FilePdfOutlined />} onClick={() => void generarPdfPrescripcion(r)} />
              </Space>
            ),
          },
        ]}
      />

      <AuditoriaModal
        prescripcion={auditando}
        onCerrar={() => setAuditando(null)}
        onAuditada={(actualizada) => {
          setData((prev) => prev.map((p) => (p.idPrescripcion === actualizada.idPrescripcion ? actualizada : p)));
          setAuditando(null);
        }}
      />
    </div>
  );
}
