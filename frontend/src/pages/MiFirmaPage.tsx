import { Card, Typography, Alert } from 'antd';
import { useAuthStore } from '../store/auth.store';
import { FirmaUploader } from '../components/FirmaUploader';

export function MiFirmaPage() {
  const usuario = useAuthStore((s) => s.usuario);

  if (!usuario?.idProfesional) {
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
      <FirmaUploader idProfesional={usuario.idProfesional} />
    </Card>
  );
}
