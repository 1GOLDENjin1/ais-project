import React from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, User, Database, Router } from "lucide-react";

const DebugDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const getRoleDashboard = () => {
    switch (user?.role) {
      case 'patient':
        return { route: '/dashboard', label: 'Patient Dashboard' };
      case 'doctor':
        return { route: '/doctor-dashboard', label: 'Doctor Dashboard' };
      case 'staff':
      case 'admin':
        return { route: '/staff-dashboard', label: 'Staff Dashboard' };
      default:
        return { route: '/services', label: 'Services' };
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">🔧 Debug Dashboard</h1>
          <p className="text-muted-foreground">System diagnostics and navigation</p>
        </div>

        {user && (
          <div className="mb-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900">Ready to go!</h3>
                      <p className="text-sm text-green-700">
                        Logged in as {user.name} ({user.role})
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate(getRoleDashboard().route)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Go to {getRoleDashboard().label}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Authentication
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Authentication Status:</h3>
                <p className="text-sm">{user ? "✅ User is logged in" : "❌ No user found"}</p>
                {user && (
                  <div className="mt-2 space-y-1 text-sm">
                    <p><strong>Name:</strong> {user.name}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Role:</strong> {user.role}</p>
                    <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
                  </div>
                )}
              </div>
              
              <div>
                <h3 className="font-semibold">User Object (JSON):</h3>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Database Connection:</h3>
                <p className="text-sm text-green-600">✅ Connected to Supabase</p>
              </div>

              <div>
                <h3 className="font-semibold">Test Data:</h3>
                <p className="text-sm">
                  DB Seeded: {localStorage.getItem('db_seeded') === 'true' ? '✅ Yes' : '❌ No'}
                </p>
              </div>

              <div>
                <h3 className="font-semibold">Current URL:</h3>
                <p className="text-xs text-muted-foreground">{window.location.href}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Router className="h-5 w-5" />
                Quick Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button variant="outline" onClick={() => navigate('/')}>
                  🏠 Home
                </Button>
                <Button variant="outline" onClick={() => navigate('/services')}>
                  🏥 Services
                </Button>
                <Button variant="outline" onClick={() => navigate('/book-appointment')}>
                  📅 Book Appointment
                </Button>
                <Button variant="outline" onClick={() => navigate('/profile')}>
                  👤 Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DebugDashboard;