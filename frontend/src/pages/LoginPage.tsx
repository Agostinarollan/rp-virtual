import { useState } from 'react';
import { Button, Card, Form, Input, Typography, Alert, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/axios';
import { useAuthStore } from '../store/auth.store';
import type { LoginResponse } from '../types';

interface LoginFormValues {
  nombreUsuario: string;
  contrasena: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const onFinish = async (values: LoginFormValues) => {
    setError(null);
    setCargando(true);
    try {
      const { data } = await api.post<LoginResponse>('/auth/login', values);
      login(data.accessToken, data.usuario);
      navigate('/prescripciones');
    } catch {
      // RNF-01: mensaje genérico, no revela si falló el usuario o la contraseña.
      setError('Usuario o contraseña incorrectos.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <Card style={{ width: 360 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 4 }}>
          RP Virtual
        </Typography.Title>
        <Typography.Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Prescripciones médicas virtuales
        </Typography.Text>

        {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

        <Form layout="vertical" onFinish={onFinish} disabled={cargando}>
          <Form.Item
            label="Usuario"
            name="nombreUsuario"
            rules={[{ required: true, message: 'Ingresá tu usuario.' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Ingresá tu usuario" autoFocus />
          </Form.Item>

          <Form.Item
            label="Contraseña"
            name="contrasena"
            rules={[{ required: true, message: 'Ingresá tu contraseña.' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Ingresá tu contraseña" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit" block loading={cargando}>
              Iniciar sesión
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
}
