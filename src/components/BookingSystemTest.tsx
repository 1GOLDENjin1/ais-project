import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const BookingSystemTest = () => {
  const { toast } = useToast();
  const [testResults, setTestResults] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  const runTest = async (testName: string, testFn: () => Promise<boolean>) => {
    setIsLoading(true);
    try {
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [testName]: result }));
      
      if (result) {
        toast({ title: `✅ ${testName} passed` });
      } else {
        toast({ title: `❌ ${testName} failed`, variant: "destructive" });
      }
    } catch (error) {
      console.error(`Test ${testName} failed:`, error);
      setTestResults(prev => ({ ...prev, [testName]: false }));
      toast({ 
        title: `❌ ${testName} error`, 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive" 
      });
    }
    setIsLoading(false);
  };

  const testPayMongoServer = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8787/health');
      const data = await response.json();
      return response.ok && data.ok === true;
    } catch {
      return false;
    }
  };

  const testPayMongoAPI = async (): Promise<boolean> => {
    try {
      const response = await fetch('http://localhost:8787/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          description: 'Test payment',
          email: 'test@example.com',
          reference: 'test-ref'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return !!(data.url || data.checkout_url);
      }
      return false;
    } catch {
      return false;
    }
  };

  const testDatabaseConnection = async (): Promise<boolean> => {
    try {
      // Test basic supabase connection
      const { supabase } = await import('@/lib/supabase');
      const { data, error } = await supabase.from('doctors').select('count').limit(1);
      return !error && data !== null;
    } catch {
      return false;
    }
  };

  const runAllTests = async () => {
    await runTest('PayMongo Server Health', testPayMongoServer);
    await runTest('PayMongo API Endpoint', testPayMongoAPI);
    await runTest('Database Connection', testDatabaseConnection);
  };

  const getStatusIcon = (testName: string) => {
    if (!(testName in testResults)) return '⏳';
    return testResults[testName] ? '✅' : '❌';
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Booking System Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runAllTests} 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? 'Running Tests...' : 'Run All Tests'}
        </Button>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>PayMongo Server Health</span>
            <span>{getStatusIcon('PayMongo Server Health')}</span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>PayMongo API Endpoint</span>
            <span>{getStatusIcon('PayMongo API Endpoint')}</span>
          </div>
          
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Database Connection</span>
            <span>{getStatusIcon('Database Connection')}</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded">
          <h4 className="font-medium text-blue-900">Quick Fixes:</h4>
          <ul className="text-sm text-blue-800 mt-2 space-y-1">
            <li>• Ensure PayMongo server is running: <code>npm run server</code></li>
            <li>• Check environment variables in .env file</li>
            <li>• Verify Supabase configuration</li>
            <li>• Check network connectivity to localhost:8787</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default BookingSystemTest;