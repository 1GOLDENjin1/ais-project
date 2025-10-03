"use client";

import Navigation from "@/components/Navigation";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShieldCheck, Users, Eye, Edit, Power, Save, Search, FileText, Printer, Download, TrendingUp, DollarSign, Calendar, Activity, AlertCircle } from "lucide-react";
import { AdminDataService } from "@/services/adminDataService";
import PaymentManagement from "@/components/PaymentManagement";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { rlsDataService } from "@/lib/rls-data-service";
import { supabase } from "@/lib/supabase";

// Types mirrored from attachment

type DbRole = "patient" | "doctor" | "staff" | "admin";
type Status = "active" | "inactive";

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: DbRole;
  status: Status;             // from users.is_active
  password?: string | null;   // from DB (should be a hash)
  authorization?: string;
};

const roleToAuthorization: Record<DbRole, string> = {
  admin: "Manage users, settings, and all records",
  doctor: "View/create medical records & sign results",
  staff: "Manage appointments, lab tests, & records",
  patient: "View personal results & appointments",
};

// Helper: format role display name
const formatRoleDisplay = (role: DbRole): string => {
  if (role === 'staff') return 'Practitioner';
  return role.charAt(0).toUpperCase() + role.slice(1);
};

// Helper: show hash in Profile if it looks like a hash
const isHash = (value?: string | null) => {
  if (!value) return false;
  return (
    /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(value) || // bcrypt
    /^\$argon2(id|i|d)\$/.test(value) ||                  // argon2
    /^[a-f0-9]{32,}$/i.test(value)                        // long hex
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState("users");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [editor, setEditor] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState<AdminUser | null>(null);
  const [confirmUser, setConfirmUser] = useState<AdminUser | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      setError("Access denied. Admins only.");
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        setIsLoading(true);
        const rows = await rlsDataService.getAllUsersWithPassword();
        setUsers(
          rows.map((r: any) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role as DbRole,
            status: r.is_active ? "active" : "inactive",
            password: r.password ?? null,
            authorization: roleToAuthorization[r.role as DbRole],
          }))
        );
      } catch (e) {
        console.error(e);
        setError("Failed to load users.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user]);

  const generateReport = async () => {
    setLoadingReport(true);
    try {
      // Fetch data with error handling for each query
      const [appointmentsRes, patientsRes, doctorsRes, paymentsRes] = await Promise.allSettled([
        supabase.from('appointments').select('*'),
        supabase.from('patients').select('*, users:user_id(name,email)'),
        supabase.from('doctors').select('*, users:user_id(name,email), specialty, is_available'),
        supabase.from('payments').select('*')
      ]);

      // Extract data or use empty arrays if failed
      const appointments = appointmentsRes.status === 'fulfilled' && appointmentsRes.value.data ? appointmentsRes.value.data : [];
      const patients = patientsRes.status === 'fulfilled' && patientsRes.value.data ? patientsRes.value.data : [];
      const doctors = doctorsRes.status === 'fulfilled' && doctorsRes.value.data ? doctorsRes.value.data : [];
      const payments = paymentsRes.status === 'fulfilled' && paymentsRes.value.data ? paymentsRes.value.data : [];

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Calculate metrics with safe fallbacks
      const totalRevenue = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const monthlyRevenue = payments
        .filter(p => new Date(p.created_at) >= startOfMonth)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      const yearlyRevenue = payments
        .filter(p => new Date(p.created_at) >= startOfYear)
        .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const completedAppointments = appointments.filter(a => a.status === 'completed').length;
      const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
      const cancelledAppointments = appointments.filter(a => a.status === 'cancelled').length;

      const activePatients = patients.filter(p => p.users?.name).length;
      const activeDoctors = doctors.filter(d => d.is_available).length;

      // Top performing doctors
      const doctorStats = doctors.map(d => {
        const doctorAppointments = appointments.filter(a => a.doctor_id === d.id);
        const doctorRevenue = payments
          .filter(p => doctorAppointments.some(a => a.id === p.appointment_id))
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        
        return {
          name: d.users?.name || 'Unknown',
          specialty: d.specialty || 'N/A',
          appointments: doctorAppointments.length,
          revenue: doctorRevenue
        };
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      // Monthly trend
      const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
        const date = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);
        
        const monthAppointments = appointments.filter(a => {
          const aDate = new Date(a.created_at);
          return aDate >= date && aDate < nextMonth;
        });
        
        const monthRevenue = payments
          .filter(p => {
            const pDate = new Date(p.created_at);
            return pDate >= date && pDate < nextMonth;
          })
          .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        
        return {
          month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          appointments: monthAppointments.length,
          revenue: monthRevenue
        };
      });

      // Most used service this month
      const monthlyAppointments = appointments.filter(a => {
        const aDate = new Date(a.created_at);
        return aDate >= startOfMonth;
      });

      const serviceCount: Record<string, number> = {};
      monthlyAppointments.forEach(a => {
        if (a.service_type) {
          serviceCount[a.service_type] = (serviceCount[a.service_type] || 0) + 1;
        }
      });

      const mostUsedService = Object.entries(serviceCount).length > 0
        ? Object.entries(serviceCount).sort((a, b) => b[1] - a[1])[0]
        : null;

      const mostUsedServiceData = mostUsedService
        ? { name: mostUsedService[0], count: mostUsedService[1] }
        : { name: 'N/A', count: 0 };

      setReportData({
        generatedAt: now.toISOString(),
        summary: {
          totalRevenue,
          monthlyRevenue,
          yearlyRevenue,
          totalAppointments: appointments.length,
          completedAppointments,
          pendingAppointments,
          cancelledAppointments,
          activePatients,
          activeDoctors,
          totalDoctors: doctors.length,
          totalPatients: patients.length,
          mostUsedService: mostUsedServiceData
        },
        doctorStats,
        monthlyTrend,
        recentAppointments: appointments.slice(0, 10)
      });
      setShowReport(true);
      toast({ title: 'Report generated successfully!' });
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast({ 
        title: 'Error generating report', 
        description: error?.message || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filtered = useMemo(() => {
    // First filter out admin users from the directory
    const nonAdminUsers = users.filter(u => u.role !== 'admin');
    
    const q = query.trim().toLowerCase();
    if (!q) return nonAdminUsers;
    return nonAdminUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, query]);

  const statusBadge = (s: Status) =>
    s === "active" ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>;

  const handleSaveEdit = async () => {
    if (!draft) return;
    try {
      await rlsDataService.updateUser(draft.id, {
        role: draft.role,
      });
      setUsers((prev) => prev.map((u) => (u.id === draft.id ? { ...draft } : u)));
      toast({ title: "Saved", description: "User updated successfully." });
      setEditor(null);
      setDraft(null);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to update user.", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (u: AdminUser) => {
    try {
      const next = u.status === "active" ? false : true;
      await rlsDataService.setUserActive(u.id, next);
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, status: next ? "active" : "inactive" } : x))
      );
      toast({
        title: next ? "Activated" : "Deactivated",
        description: `${u.name} is now ${next ? "active" : "inactive"}.`,
      });
      setConfirmUser(null);
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Could not change user status.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-16">
          <p className="text-muted-foreground">Loading admin dashboard…</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 py-16">
          <Card><CardContent className="p-6 text-destructive">{error}</CardContent></Card>
        </main>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @media print {
          /* Hide everything except report */
          body * {
            visibility: hidden !important;
          }
          
          /* Show only report content and children */
          #report-content,
          #report-content * {
            visibility: visible !important;
          }
          
          /* Position report at top of page */
          #report-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 15mm !important;
            margin: 0 !important;
          }
          
          /* Remove dialog restrictions */
          [role="dialog"],
          [data-radix-dialog-content],
          [data-radix-dialog-overlay] {
            position: static !important;
            max-height: none !important;
            max-width: none !important;
            height: auto !important;
            overflow: visible !important;
            transform: none !important;
          }
          
          /* Remove all overflow and height restrictions */
          .overflow-y-auto,
          .overflow-hidden,
          .overflow-auto,
          .max-h-\\[90vh\\] {
            overflow: visible !important;
            max-height: none !important;
            height: auto !important;
          }
          
          /* Hide buttons and navigation */
          .print\\:hidden,
          button {
            display: none !important;
            visibility: hidden !important;
          }
          
          /* Ensure proper display of content */
          #report-content > * {
            display: block !important;
          }
          
          #report-content .grid {
            display: grid !important;
          }
          
          #report-content .flex {
            display: flex !important;
          }
          
          /* Page breaks */
          .page-break-before {
            page-break-before: always !important;
            break-before: always !important;
          }
          
          .page-break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          
          /* Page setup */
          @page {
            margin: 15mm;
            size: A4 portrait;
          }
          
          /* Preserve colors and backgrounds */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          
          /* Table printing */
          table {
            page-break-inside: auto !important;
          }
          
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
        }
      `}</style>
      <div className="min-h-screen bg-background">
        <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">Admin · User Controls</h1>
            <p className="text-muted-foreground">Welcome, {user?.name}. Manage users, roles, and access.</p>
          </div>
          <Button onClick={generateReport} disabled={loadingReport} className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {loadingReport ? 'Generating...' : 'Generate Report'}
          </Button>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="payments" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Management
            </TabsTrigger>
          </TabsList>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Total Users</CardTitle>
                <CardDescription>All registered accounts</CardDescription>
              </div>
              <Users className="h-5 w-5 text-muted-foreground" />
            </CardContent>
            <CardContent className="pt-0 px-6 pb-6">
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Active</CardTitle>
                <CardDescription>Enabled accounts</CardDescription>
              </div>
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            </CardContent>
            <CardContent className="pt-0 px-6 pb-6">
              <div className="text-2xl font-bold">
                {users.filter((u) => u.status === "active").length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Inactive</CardTitle>
                <CardDescription>Disabled accounts</CardDescription>
              </div>
              <Power className="h-5 w-5 text-muted-foreground" />
            </CardContent>
            <CardContent className="pt-0 px-6 pb-6">
              <div className="text-2xl font-bold">
                {users.filter((u) => u.status === "inactive").length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Directory */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> User Directory
            </CardTitle>
            <CardDescription>Search, view, edit, or deactivate users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <div className="relative w-full max-w-md">
                <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search by name, email, or role…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => setQuery("")}>Clear</Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left">User</th>
                    <th className="py-2 px-3 text-left">Role</th>
                    <th className="py-2 px-3 text-left">Email</th>
                    <th className="py-2 px-3 text-left">Password</th>
                    <th className="py-2 px-3 text-left">Status</th>
                    <th className="py-2 px-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    return (
                      <tr key={u.id} className="border-b hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium">{u.name}</td>
                        <td className="py-2 px-3">{formatRoleDisplay(u.role)}</td>
                        <td className="py-2 px-3">{u.email}</td>
                        <td className="py-2 px-3">
                          <span className="font-mono text-xs break-all">••••••••••</span>
                          {/* Show button removed by request */}
                        </td>
                        <td className="py-2 px-3">{statusBadge(u.status)}</td>
                        <td className="py-2 px-3">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setSelected(u)}>
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                            <Button size="sm" onClick={() => { setEditor(u); setDraft({ ...u }); }}>
                              <Edit className="h-4 w-4 mr-1" /> Edit
                            </Button>
                            <Button
                              size="sm"
                              variant={u.status === "active" ? "destructive" : "default"}
                              onClick={() => setConfirmUser(u)}
                            >
                              <Power className="h-4 w-4 mr-1" />
                              {u.status === "active" ? "Deactivate" : "Activate"}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted-foreground">
                        No users match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* View Profile */}
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>User Profile</DialogTitle></DialogHeader>
            {selected && (
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs">Name</Label><div className="mt-1 font-medium">{selected.name}</div></div>
                <div><Label className="text-xs">Role</Label><div className="mt-1">{formatRoleDisplay(selected.role)}</div></div>
                <div className="col-span-2"><Label className="text-xs">Email</Label><div className="mt-1">{selected.email}</div></div>
                <div>
                  <Label className="text-xs">Password</Label>
                  <div className="mt-1 font-mono text-xs">
                    ••••••••••
                  </div>
                </div>
                <div><Label className="text-xs">Status</Label><div className="mt-1">{statusBadge(selected.status)}</div></div>
                <div className="col-span-2"><Label className="text-xs">Authorization</Label><div className="mt-1 text-sm">{selected.authorization}</div></div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Edit User */}
        <Dialog open={!!editor} onOpenChange={() => { setEditor(null); setDraft(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
            {draft && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label className="text-gray-500">Full name (not editable)</Label>
                    <Input 
                      value={draft.name} 
                      disabled 
                      className="bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label className="text-gray-500">Email (not editable)</Label>
                    <Input 
                      type="email" 
                      value={draft.email} 
                      disabled 
                      className="bg-gray-50 text-gray-600 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <Label>Role</Label>
                    <Select value={draft.role} onValueChange={(v: DbRole) => setDraft({ ...draft, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                        <SelectItem value="staff">Practitioner</SelectItem>
                        <SelectItem value="patient">Patient</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={draft.status}
                      onValueChange={(v: Status) => setDraft({ ...draft, status: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label>Authorization</Label>
                    <Textarea
                      rows={3}
                      value={draft.authorization || ""}
                      onChange={(e) => setDraft({ ...draft, authorization: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => { setEditor(null); setDraft(null); }}>Cancel</Button>
                  <Button onClick={handleSaveEdit}><Save className="h-4 w-4 mr-2" />Save changes</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Activate / Deactivate */}
        <Dialog open={!!confirmUser} onOpenChange={() => setConfirmUser(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Confirm action</DialogTitle></DialogHeader>
            {confirmUser && (
              <div className="space-y-4">
                <p>
                  Are you sure you want to{" "}
                  <span className="font-medium">
                    {confirmUser.status === "active" ? "deactivate" : "activate"}
                  </span>{" "}
                  <span className="font-medium">{confirmUser.name}</span>?
                </p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setConfirmUser(null)}>Cancel</Button>
                  <Button
                    variant={confirmUser.status === "active" ? "destructive" : "default"}
                    onClick={() => handleToggleStatus(confirmUser)}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    {confirmUser.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Report Generation Dialog */}
        <Dialog open={showReport} onOpenChange={setShowReport}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto print:max-w-full print:max-h-full">
            <DialogHeader className="print:hidden">
              <DialogTitle className="flex items-center justify-between">
                <span>System Performance Report</span>
                <div className="flex gap-2">
                  <Button onClick={handlePrint} variant="outline" size="sm">
                    <Printer className="h-4 w-4 mr-2" />
                    Print
                  </Button>
                  <Button onClick={() => setShowReport(false)} variant="outline" size="sm">
                    Close
                  </Button>
                </div>
              </DialogTitle>
            </DialogHeader>

            {reportData && (
              <div id="report-content" className="space-y-6 print:p-8">
                {/* Report Header */}
                <div className="text-center border-b pb-6">
                  <img 
                    src="/lovable-uploads/95acf376-10b9-4fad-927e-89c2971dd7be.png" 
                    alt="Mendoza Diagnostic Center Logo" 
                    className="h-16 w-16 mx-auto mb-4"
                  />
                  <h1 className="text-3xl font-bold text-gray-900">Mendoza Diagnostic Center</h1>
                  <p className="text-lg text-gray-600 mt-2">System Performance Report</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Generated on: {new Date(reportData.generatedAt).toLocaleString('en-US', { 
                      dateStyle: 'full', 
                      timeStyle: 'short' 
                    })}
                  </p>
                </div>

                {/* Executive Summary */}
                <div className="page-break-inside-avoid">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                    Executive Summary
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                          ₱{reportData.summary.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">All time</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                          ₱{reportData.summary.monthlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Current month</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Total Appointments</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-purple-600">
                          {reportData.summary.totalAppointments}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {reportData.summary.completedAppointments} completed
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-gray-600">Active Users</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                          {reportData.summary.activePatients + reportData.summary.activeDoctors}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {reportData.summary.activePatients} patients, {reportData.summary.activeDoctors} doctors
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Most Used Service This Month */}
                  <Card className="mt-4 bg-gradient-to-br from-blue-50 to-indigo-50">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-5 w-5 text-blue-600" />
                        Most Popular Service This Month
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {reportData.summary.mostUsedService?.name || 'N/A'}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Most requested service in {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-indigo-600">
                            {reportData.summary.mostUsedService?.count || 0}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">bookings</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Metrics */}
                <div className="page-break-inside-avoid">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-600" />
                    Performance Metrics
                  </h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Appointment Status */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Appointment Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Completed</span>
                            <Badge className="bg-green-500">{reportData.summary.completedAppointments}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Pending</span>
                            <Badge className="bg-yellow-500">{reportData.summary.pendingAppointments}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Cancelled</span>
                            <Badge className="bg-red-500">{reportData.summary.cancelledAppointments}</Badge>
                          </div>
                          <div className="pt-2 border-t">
                            <div className="flex justify-between items-center font-semibold">
                              <span>Total</span>
                              <span>{reportData.summary.totalAppointments}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* User Statistics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>User Statistics</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Total Patients</span>
                            <Badge variant="outline">{reportData.summary.totalPatients}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Active Patients</span>
                            <Badge className="bg-blue-500">{reportData.summary.activePatients}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Total Doctors</span>
                            <Badge variant="outline">{reportData.summary.totalDoctors}</Badge>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Available Doctors</span>
                            <Badge className="bg-green-500">{reportData.summary.activeDoctors}</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Top Performing Doctors */}
                <div className="page-break-inside-avoid">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600" />
                    Top Performing Doctors
                  </h2>
                  <Card>
                    <CardContent className="pt-6">
                      {reportData.doctorStats.length > 0 ? (
                        <div className="space-y-4">
                          {reportData.doctorStats.map((doctor: any, index: number) => (
                            <div key={index} className="flex items-center justify-between pb-4 border-b last:border-b-0">
                              <div className="flex items-center gap-3">
                                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-semibold">{doctor.name}</div>
                                  <div className="text-sm text-gray-500">{doctor.specialty}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-semibold text-green-600">
                                  ₱{doctor.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <div className="text-sm text-gray-500">{doctor.appointments} appointments</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No doctor performance data available</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Trend */}
                <div className="page-break-before">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    6-Month Trend Analysis
                  </h2>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        {reportData.monthlyTrend.map((month: any, index: number) => (
                          <div key={index} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{month.month}</span>
                              <div className="flex gap-4 text-sm">
                                <span className="text-gray-600">
                                  {month.appointments} appointments
                                </span>
                                <span className="text-green-600 font-semibold">
                                  ₱{month.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ 
                                  width: `${Math.min((month.revenue / Math.max(...reportData.monthlyTrend.map((m: any) => m.revenue))) * 100, 100)}%` 
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Detailed Appointments List - New Page */}
                <div className="page-break-before">
                  <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-600" />
                    Recent Appointments Details
                  </h2>
                  <Card>
                    <CardContent className="pt-6">
                      {reportData.recentAppointments && reportData.recentAppointments.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-3 px-2 font-semibold">Date</th>
                                <th className="text-left py-3 px-2 font-semibold">Time</th>
                                <th className="text-left py-3 px-2 font-semibold">Service</th>
                                <th className="text-left py-3 px-2 font-semibold">Status</th>
                                <th className="text-left py-3 px-2 font-semibold">Patient ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportData.recentAppointments.map((apt: any, index: number) => (
                                <tr key={index} className="border-b hover:bg-gray-50">
                                  <td className="py-3 px-2">
                                    {new Date(apt.appointment_date).toLocaleDateString('en-US', { 
                                      month: 'short', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}
                                  </td>
                                  <td className="py-3 px-2">{apt.appointment_time || 'N/A'}</td>
                                  <td className="py-3 px-2">{apt.service_type || 'General'}</td>
                                  <td className="py-3 px-2">
                                    <Badge 
                                      className={
                                        apt.status === 'completed' ? 'bg-green-500' :
                                        apt.status === 'pending' ? 'bg-yellow-500' :
                                        apt.status === 'cancelled' ? 'bg-red-500' :
                                        'bg-gray-500'
                                      }
                                    >
                                      {apt.status}
                                    </Badge>
                                  </td>
                                  <td className="py-3 px-2 text-gray-600">{apt.patient_id?.substring(0, 8) || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No recent appointments to display</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {/* Additional Statistics */}
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Yearly Revenue</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-purple-600">
                          ₱{reportData.summary.yearlyRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Total for {new Date().getFullYear()}</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Average Revenue/Appointment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-teal-600">
                          ₱{reportData.summary.completedAppointments > 0 
                            ? (reportData.summary.totalRevenue / reportData.summary.completedAppointments).toLocaleString('en-US', { minimumFractionDigits: 2 })
                            : '0.00'
                          }
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Per completed appointment</p>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Success Rate</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-green-600">
                          {reportData.summary.totalAppointments > 0
                            ? Math.round((reportData.summary.completedAppointments / reportData.summary.totalAppointments) * 100)
                            : 0
                          }%
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Completion rate</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Report Footer */}
                <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
                  <p className="font-semibold">Mendoza Diagnostic Center</p>
                  <p>950 MENZ NAT'L RD, PULAN, BULACAN</p>
                  <p>mendozadiagnostic@example.com | +063-123-4568</p>
                  <p className="mt-2 text-xs">This is a confidential report generated for internal use only.</p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

          </TabsContent>

          {/* Payment Management Tab */}
          <TabsContent value="payments" className="space-y-6">
            <PaymentManagement />
          </TabsContent>
        </Tabs>

        {/* Footer strip */}
        <div className="mt-8 grid gap-2 text-center text-xs text-muted-foreground md:grid-cols-3">
          <div>950 MENZ NAT'L RD, PULAN, BULACAN</div>
          <div>mendozadiagnostic@example.com</div>
          <div>+063-123-4568</div>
        </div>
      </main>
    </div>
    </>
  );
};

export default AdminDashboard;
