import React from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import AdminLogin from './AdminLogin';
import { Loader2, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AuthenticatedAdminWrapperProps {
  children: React.ReactNode;
  title?: string;
  showLogout?: boolean;
}

const AuthenticatedAdminWrapper: React.FC<AuthenticatedAdminWrapperProps> = ({ 
  children, 
  title = "Admin Panel",
  showLogout = true 
}) => {
  const { isAuthenticated, isLoading, handleLogin, handleLogout } = useAdminAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Checking Authentication...</h2>
          <p className="text-gray-500 mt-2">Please wait while we verify your credentials</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 rounded-full w-20 h-20 mx-auto mb-4 shadow-lg">
                <Shield className="h-12 w-12 text-white mx-auto" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {title}
              </h1>
              <p className="text-gray-600">
                Please authenticate to access the admin panel
              </p>
            </div>
            <AdminLogin onLogin={handleLogin} />
          </div>
        </div>
      </div>
    );
  }

  // Show authenticated content with optional logout button
  return (
    <div className="min-h-screen">
      {showLogout && (
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-3">
              <div className="flex items-center space-x-3">
                <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 rounded-lg">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
                  <p className="text-sm text-gray-500">Authenticated Session Active</p>
                </div>
              </div>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center gap-2 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export default AuthenticatedAdminWrapper;
