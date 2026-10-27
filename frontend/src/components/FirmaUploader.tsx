import { useState } from 'react';
import { Upload, Button, message, Image, Space, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { RcFile } from 'antd/es/upload';
import { subirFirma } from '../api/firma';

interface FirmaUploaderProps {
  idProfesional: number;
  firmaActual?: string | null;
  onSubida?: (nuevaUrl: string) => void;
}

const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp'];

export function FirmaUploader({ idProfesional, firmaActual, onSubida }: FirmaUploaderProps) {
  const [subiendo, setSubiendo] = useState(false);
  const [firma, setFirma] = useState(firmaActual);

  const subir = async (file: RcFile) => {
    if (!TIPOS_PERMITIDOS.includes(file.type)) {
      message.error('La firma debe ser una imagen (PNG, JPG o WEBP).');
      return Upload.LIST_IGNORE;
    }
    if (file.size > 2 * 1024 * 1024) {
      message.error('La imagen no puede superar los 2 MB.');
      return Upload.LIST_IGNORE;
    }

    setSubiendo(true);
    try {
      const profesional = await subirFirma(idProfesional, file);
      setFirma(profesional.firma);
      onSubida?.(profesional.firma ?? '');
      message.success('Firma subida correctamente.');
    } catch {
      message.error('No se pudo subir la firma.');
    } finally {
      setSubiendo(false);
    }
    return false; // evita que AntD intente subir el archivo por su cuenta
  };

  return (
    <Space direction="vertical">
      {firma && (
        <Image
          src={firma}
          alt="Firma del profesional"
          height={80}
          style={{ border: '1px solid #f0f0f0', borderRadius: 4, padding: 8 }}
        />
      )}
      <Upload accept="image/png,image/jpeg,image/webp" showUploadList={false} beforeUpload={subir}>
        <Button icon={<UploadOutlined />} loading={subiendo}>
          {firma ? 'Reemplazar firma' : 'Subir firma'}
        </Button>
      </Upload>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        PNG, JPG o WEBP, hasta 2 MB.
      </Typography.Text>
    </Space>
  );
}
