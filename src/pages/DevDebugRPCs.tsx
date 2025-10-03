import React, { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import { rlsDataService } from '@/lib/rls-data-service';

const DevDebugRPCs = () => {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => setLogs((s) => [new Date().toISOString() + ' - ' + msg, ...s]);

  useEffect(() => {
    (async () => {
      addLog('Starting RPC/select checks');

      try {
        addLog('Calling rlsDataService.getPublicDoctors()');
        const d = await rlsDataService.getPublicDoctors();
        addLog(`getPublicDoctors returned ${Array.isArray(d) ? d.length : 0} rows`);
        setDoctors(d || []);
      } catch (err) {
        console.error(err);
        addLog('Error calling getPublicDoctors: ' + String(err));
      }

      try {
        addLog('Calling rlsDataService.getAvailableServices()');
        const s = await rlsDataService.getAvailableServices();
        addLog(`getPublicServices returned ${Array.isArray(s) ? s.length : 0} rows`);
        setServices(s || []);
      } catch (err) {
        console.error(err);
        addLog('Error calling getPublicServices: ' + String(err));
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">Dev Debug - RPCs and SELECTs</h1>

        <section className="mb-8">
          <h2 className="text-lg font-semibold">Logs</h2>
          <div className="bg-gray-100 p-4 rounded max-h-48 overflow-auto">
            {logs.map((l, i) => (
              <div key={i} className="text-xs text-gray-700">{l}</div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold">Doctors</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {doctors.length === 0 && <div className="text-sm text-muted-foreground">No doctors returned</div>}
            {doctors.map((d, idx) => (
              <div key={idx} className="p-3 border rounded">
                <div className="font-medium">{d.name || d.display_name || d.doctor_name || 'Unknown'}</div>
                <div className="text-sm text-muted-foreground">Specialty: {d.specialty || d.doctor_specialty || '—'}</div>
                <div className="text-sm">Fee: {d.consultation_fee ?? d.fee ?? '—'}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {services.length === 0 && <div className="text-sm text-muted-foreground">No services returned</div>}
            {services.map((s, idx) => (
              <div key={idx} className="p-3 border rounded">
                <div className="font-medium">{s.name || s.service_name}</div>
                <div className="text-sm text-muted-foreground">Category: {s.category}</div>
                <div className="text-sm">Price: {s.price}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DevDebugRPCs;
