import { Layout, Menu, Typography, Avatar, Dropdown, Space } from 'antd';
import { UserOutlined, MedicineBoxOutlined, TeamOutlined, LogoutOutlined, EditOutlined, HistoryOutlined } from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { Rol } from '../types';

const { Header, Content } = Layout;

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const usuario = useAuthStore((s) => s.usuario);
  const logout = useAuthStore((s) => s.logout);

  const esAdministrador = usuario?.rol === Rol.ADMINISTRADOR;

  const items = [
    { key: '/prescripciones', icon: <MedicineBoxOutlined />, label: 'Prescripciones' },
    ...(!esAdministrador
      ? [{ key: '/mi-firma', icon: <EditOutlined />, label: 'Mi firma' }]
      : []),
    ...(esAdministrador
      ? [
          { key: '/pacientes', icon: <TeamOutlined />, label: 'Pacientes' },
          { key: '/profesionales', icon: <TeamOutlined />, label: 'Profesionales' },
          { key: '/obras-sociales', icon: <TeamOutlined />, label: 'Obras sociales' },
          { key: '/usuarios', icon: <UserOutlined />, label: 'Usuarios' },
          { key: '/historial', icon: <HistoryOutlined />, label: 'Historial' },
        ]
      : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <Typography.Title level={4} style={{ color: '#fff', margin: 0, whiteSpace: 'nowrap' }}>
          RP Virtual
        </Typography.Title>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
          style={{ flex: 1, minWidth: 0 }}
        />
        <Dropdown
          menu={{
            items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión' }],
            onClick: () => {
              logout();
              navigate('/login');
            },
          }}
        >
          <Space style={{ color: '#fff', cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} size="small" />
            {usuario?.nombre} {usuario?.apellido}
          </Space>
        </Dropdown>
      </Header>
      <Content style={{ padding: 24 }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
