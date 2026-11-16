import React from 'react';
import SidebarMenu from './SidebarMenu';
import SidebarVendedor from './SidebarVendedor';

export default function RoleBasedSidebar({ user, ...props }) {
  const Sidebar = user?.rol === 'vendedor' ? SidebarVendedor : SidebarMenu;
  return <Sidebar user={user} {...props} />;
}
