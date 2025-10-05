import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { getSetting } from "@/lib/supabase";
import { Eye, EyeOff, Shield, Save, Lock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminCredentials {
  username: string;
  password: string;
}

const AdminCredentialsManager: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentCredentials, setCurrentCredentials] = useState<AdminCredentials | null>(null);

  const { updateCredentials } = useAdminAuth();
  const { toast } = useToast();

  // Load current credentials on component mount
  useEffect(() => {
    const loadCurrentCredentials = async () => {
      try {
        const credentials = await getSetting<AdminCredentials>("adminCredentials");
        if (credentials) {
          setCurrentCredentials(credentials);
          setNewUsername(credentials.username); // Pre-fill current username
        }
      } catch (error) {
        console.error("Error loading current credentials:", error);
      }
    };

    loadCurrentCredentials();
  }, []);

  const validateForm = (): string | null => {
    if (!currentPassword) {
      return "Current password is required for verification";
    }

    if (!newUsername.trim()) {
      return "New username cannot be empty";
    }

    if (newUsername.length < 3) {
      return "Username must be at least 3 characters long";
    }

    if (!newPassword) {
      return "New password is required";
    }

    if (newPassword.length < 6) {
      return "Password must be at least 6 characters long";
    }

    if (newPassword !== confirmPassword) {
      return "Password confirmation does not match";
    }

    // Verify current password
    if (currentCredentials && currentPassword !== currentCredentials.password) {
      return "Current password is incorrect";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "Validation Error",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const success = await updateCredentials(newUsername.trim(), newPassword);
      
      if (success) {
        // Update local state
        setCurrentCredentials({ username: newUsername.trim(), password: newPassword });
        
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        toast({
          title: "Success",
          description: "Admin credentials updated successfully. Please use the new credentials for future logins.",
        });
      }
    } catch (error) {
      console.error("Error updating credentials:", error);
      toast({
        title: "Error",
        description: "Failed to update credentials. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white rounded-2xl shadow-xl border border-gray-200">
      <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 rounded-t-2xl border-b border-red-200">
        <CardTitle className="flex items-center text-red-800">
          <div className="bg-red-500 p-2 rounded-lg mr-3">
            <Shield className="h-6 w-6 text-white" />
          </div>
          Admin Security Settings
        </CardTitle>
        <p className="text-red-600 text-sm">
          Change your admin panel username and password
        </p>
      </CardHeader>
      <CardContent className="p-6">
        <Alert className="mb-6 border-amber-200 bg-amber-50">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>Security Notice:</strong> Changing these credentials will affect all admin panel access. 
            Make sure to remember your new credentials as they will be required for future logins.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Credentials Display */}
          {currentCredentials && (
            <div className="bg-gray-50 p-4 rounded-lg border">
              <h4 className="font-semibold text-gray-700 mb-2">Current Credentials</h4>
              <p className="text-sm text-gray-600">
                <strong>Username:</strong> {currentCredentials.username}
              </p>
            </div>
          )}

          {/* Current Password Verification */}
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-sm font-medium text-gray-700">
              Current Password *
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* New Username */}
          <div className="space-y-2">
            <Label htmlFor="newUsername" className="text-sm font-medium text-gray-700">
              New Username *
            </Label>
            <Input
              id="newUsername"
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="Enter new username"
              minLength={3}
              required
            />
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium text-gray-700">
              New Password *
            </Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="pr-10"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
              Confirm New Password *
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? "Updating..." : "Update Credentials"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AdminCredentialsManager;
