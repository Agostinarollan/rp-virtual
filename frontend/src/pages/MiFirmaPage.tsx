import { useEffect, useState } from 'react';
import { Card, Typography, Alert, Spin } from 'antd';
import { useAuthStore } from '../store/auth.store';
import { FirmaUploader } from '../components/FirmaUploader';
import { obtenerFirma } from '../api/firma';

export function MiFirmaPage() {
  const usuario = useAuthStore((s) => s.usuario);
  const idProfesional = usuario?.idProfesional;
  const [firmaActual, setFirmaActual] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // Trae la firma ya cargada para mostrarla (antes siempre aparecía vacío).
  useEffect(() => {
    if (!idProfesional) return;
    obtenerFirma(idProfesional)
      .then(setFirmaActual)
      .finally(() => setCargando(false));
  }, [idProfesional]);

  if (!idProfesional) {
    return (
      <Alert
        type="warning"
        showIcon
        message="Tu usuario no tiene un perfil de profesional asociado."
      />
    );
  }

  return (
    <Card style={{ maxWidth: 480, margin: '0 auto' }}>
      <Typography.Title level={3}>Mi firma digital</Typography.Title>
      <Typography.Paragraph type="secondary">
        Esta imagen se usa para firmar las prescripciones que emitas.
      </Typography.Paragraph>
      {cargando ? (
        <Spin />
      ) : (
        <FirmaUploader idProfesional={idProfesional} firmaActual={firmaActual} />
      )}
    </Card>
  );
}
