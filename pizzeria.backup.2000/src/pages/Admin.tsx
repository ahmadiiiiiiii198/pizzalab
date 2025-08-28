import React from 'react';
import PizzeriaAdminPanel from '@/components/admin/PizzeriaAdminPanel';
import AdminErrorBoundary from '@/components/admin/AdminErrorBoundary';
import AuthenticatedAdminWrapper from '@/components/admin/AuthenticatedAdminWrapper';

const Admin = () => {
  return (
    <AuthenticatedAdminWrapper title="Pizzeria Regina 2000 - Admin Panel" showLogout={true}>
      <AdminErrorBoundary componentName="Admin Panel">
        <PizzeriaAdminPanel />
      </AdminErrorBoundary>
    </AuthenticatedAdminWrapper>
  );
};

export default Admin;
