import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

const UserSyncTool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [status, setStatus] = useState('');

  const createTestUsers = async () => {
    setIsLoading(true);
    setStatus('Creating test users...');
    setResults([]);

    const testUsers = [
      {
        email: 'patient.test@example.com',
        password: 'Password123!',
        name: 'Test Patient',
        role: 'patient'
      },
      {
        email: 'doctor.test@example.com',
        password: 'Password123!',
        name: 'Dr. Test Doctor',
        role: 'doctor'
      },
      {
        email: 'staff.test@example.com',
        password: 'Password123!',
        name: 'Test Staff',
        role: 'staff'
      }
    ];

    const newResults = [];

    for (const user of testUsers) {
      setStatus(`Creating ${user.email}...`);
      
      try {
        // Create Supabase Auth user
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: user.email,
          password: user.password,
          options: {
            data: {
              name: user.name,
              role: user.role
            }
          }
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            newResults.push({
              email: user.email,
              status: '✅ Already exists',
              success: true
            });
          } else {
            newResults.push({
              email: user.email,
              status: `❌ ${authError.message}`,
              success: false
            });
          }
          continue;
        }

        if (authData.user) {
          // Create database profile
          const { error: dbError } = await supabase
            .from('users')
            .insert({
              id: authData.user.id,
              name: user.name,
              email: user.email,
              password: '', // Handled by Supabase Auth
              role: user.role
            });

          if (dbError && !dbError.message.includes('duplicate key')) {
            newResults.push({
              email: user.email,
              status: `⚠️ Auth OK, DB Error: ${dbError.message}`,
              success: true
            });
            continue;
          }

          // Create role-specific records
          try {
            if (user.role === 'patient') {
              await supabase.from('patients').insert({
                user_id: authData.user.id,
                date_of_birth: null,
                gender: null,
                address: null
              });
            } else if (user.role === 'doctor') {
              await supabase.from('doctors').insert({
                user_id: authData.user.id,
                specialty: 'General Medicine',
                consultation_fee: 1500.00,
                rating: 0.0
              });
            } else if (user.role === 'staff') {
              await supabase.from('staff').insert({
                user_id: authData.user.id,
                position: 'Staff Member'
              });
            }

            newResults.push({
              email: user.email,
              status: '✅ Created successfully',
              success: true
            });

          } catch (roleError) {
            newResults.push({
              email: user.email,
              status: `✅ Created (role record warning)`,
              success: true
            });
          }
        }

      } catch (error) {
        newResults.push({
          email: user.email,
          status: `❌ ${error.message}`,
          success: false
        });
      }

      setResults([...newResults]);
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    setStatus('Complete!');
    setIsLoading(false);
  };

  const testLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert(`Login failed: ${error.message}`);
        return;
      }

      if (data.user) {
        alert(`Login successful! User ID: ${data.user.id}`);
        // Sign out after test
        await supabase.auth.signOut();
      }
    } catch (error) {
      alert(`Login error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 User Sync Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              This tool creates test users that you can login with. Click the button below to create working test accounts.
            </AlertDescription>
          </Alert>

          <Button 
            onClick={createTestUsers} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Creating Users...' : 'Create Test Users'}
          </Button>

          {status && (
            <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
              Status: {status}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Results:</h3>
              {results.map((result, index) => (
                <div key={index} className="p-2 border rounded text-sm">
                  <div className="font-mono">{result.email}</div>
                  <div className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.status}
                  </div>
                  {result.success && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-1"
                      onClick={() => testLogin(result.email, 'Password123!')}
                    >
                      Test Login
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {results.some(r => r.success) && (
            <Alert>
              <AlertDescription>
                <strong>✅ Ready to login!</strong><br/>
                Use these credentials in the login form:<br/>
                📧 <code>patient.test@example.com</code><br/>
                🔐 <code>Password123!</code>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSyncTool;