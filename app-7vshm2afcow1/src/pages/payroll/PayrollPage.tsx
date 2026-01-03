import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, Calendar, FileText, Download, Upload, User as UserIcon, Loader2, Trash2 } from 'lucide-react';
import type { Payroll, Document, User } from '@/types';
import { toast } from 'sonner';

const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  // Personal Payroll State
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [payrollDocs, setPayrollDocs] = useState<Document[]>([]);

  // Admin/HR State
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedUserDocs, setSelectedUserDocs] = useState<Document[]>([]);
  const [uploadType, setUploadType] = useState<string>('Payroll');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [loading, setLoading] = useState(true);

  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

  // Fetch Personal Data
  useEffect(() => {
    const fetchPersonalData = async () => {
      if (!user?.id) return;
      try {
        const [payrollData, docsData] = await Promise.all([
          apiService.getPayroll(user.id),
          apiService.getDocuments(user.id)
        ]);
        setPayroll(payrollData);
        setPayrollDocs(docsData);
      } catch (error) {
        console.error('Failed to fetch personal data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPersonalData();
  }, [user]);

  // Fetch Admin Data (All Users)
  useEffect(() => {
    if (isAdminOrHr) {
      const fetchUsers = async () => {
        try {
          const allUsers = await apiService.getAllUsers();
          // Filter out blocked users if necessary, or keep all
          setUsers(allUsers.filter(u => !u.isBlocked));
        } catch (error) {
          console.error('Failed to fetch users:', error);
          toast.error('Failed to load employees list');
        }
      };
      fetchUsers();
    }
  }, [isAdminOrHr]);

  // Fetch Selected User Documents
  useEffect(() => {
    if (selectedUserId && isAdminOrHr) {
      const fetchUserDocs = async () => {
        try {
          const docs = await apiService.getDocuments(selectedUserId);
          setSelectedUserDocs(docs);
        } catch (error) {
          console.error('Failed to fetch user documents:', error);
          toast.error('Failed to load user documents');
        }
      };
      fetchUserDocs();
    } else {
      setSelectedUserDocs([]);
    }
  }, [selectedUserId, isAdminOrHr]);

  const handleDownload = async (doc: Document) => {
    try {
      const name = (doc as any).fileName || (doc as any).title || `document-${doc.id}`;
      await apiService.downloadDocument(doc.id, name);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !selectedUserId) {
      toast.error('Please select a user and a file');
      return;
    }

    setIsUploading(true);
    try {
      // Admin uploading for another user
      await apiService.uploadDocument(uploadFile, uploadType, user!.id, selectedUserId);
      toast.success('Document uploaded successfully');
      setUploadFile(null);
      // Reset file input value manually if needed, usually controlled by key or ref

      // Refresh list
      const docs = await apiService.getDocuments(selectedUserId);
      setSelectedUserDocs(docs);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('PROTOCOL ALERT: Are you sure you want to PERMANENTLY delete this document? This action cannot be undone.')) return;
    try {
      await apiService.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      // Refresh list
      if (selectedUserId) {
        const docs = await apiService.getDocuments(selectedUserId);
        setSelectedUserDocs(docs);
      }
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  const latestPayroll = payroll[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const personalPayrollContent = (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-white mb-1">My Payroll</h2>
        <p className="text-slate-400">View your salary and payment details</p>
      </div>

      {latestPayroll && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="glass-card shadow-lg bg-card/40 border border-white/10 hover:border-white/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-wider">Net Salary</CardTitle>
              <div className="p-2 bg-blue-500/20 rounded-full border border-blue-500/20">
                <DollarSign className="h-4 w-4 text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">${latestPayroll.netSalary.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1 font-bold uppercase">{latestPayroll.month} {latestPayroll.year}</p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-lg bg-card/40 border border-white/10 hover:border-white/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-wider">Base Salary</CardTitle>
              <div className="p-2 bg-emerald-500/20 rounded-full border border-emerald-500/20">
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">${latestPayroll.baseSalary.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-lg bg-card/40 border border-white/10 hover:border-white/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-wider">Deductions</CardTitle>
              <div className="p-2 bg-rose-500/20 rounded-full border border-rose-500/20">
                <TrendingDown className="h-4 w-4 text-rose-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">${latestPayroll.deductions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-lg bg-card/40 border border-white/10 hover:border-white/20 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold text-slate-400 uppercase tracking-wider">Attendance Days</CardTitle>
              <div className="p-2 bg-indigo-500/20 rounded-full border border-indigo-500/20">
                <Calendar className="h-4 w-4 text-indigo-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-white">{latestPayroll.attendanceDays}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Documents Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white mb-4">Payslips & Documents</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {payrollDocs.map((doc: any) => (
            <Card key={doc.id} className="bg-card/30 border border-white/5 shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-white/10">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                  <FileText className="h-5 w-5 text-blue-400" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-sm truncate font-bold text-white" title={doc.fileName}>
                    {doc.fileName}
                  </CardTitle>
                  <p className="text-[10px] uppercase font-bold text-slate-500 mt-1">
                    {new Date(doc.createdAt || doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs font-bold text-blue-300 hover:text-white hover:bg-white/10 group"
                  onClick={() => handleDownload(doc)}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                {isAdminOrHr && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                    onClick={() => handleDeleteDocument(doc.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
          {payrollDocs.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed border-white/10 rounded-xl bg-white/5">
              <FileText className="h-10 w-10 mx-auto mb-3 text-slate-600" />
              <p className="text-slate-500 font-bold uppercase text-sm">No payroll documents available.</p>
            </div>
          )}
        </div>
      </div>

      <Card className="bg-card/40 border border-white/10 shadow-lg">
        <CardHeader>
          <CardTitle className="text-white font-bold">Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payroll.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors">
                <div>
                  <p className="font-bold text-slate-200">{record.month} {record.year}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">
                    {record.attendanceDays} days worked
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-black text-white">${record.netSalary.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase">
                    Base: ${record.baseSalary} | Bonus: ${record.bonuses}
                  </p>
                </div>
              </div>
            ))}
            {payroll.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="font-bold uppercase text-xs">No payroll history records.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const adminManagementContent = (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card className="bg-card/40 border border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white font-bold">
              <Upload className="h-5 w-5 text-blue-400" />
              Upload Document
            </CardTitle>
            <CardDescription className="text-slate-400">Send payslips or documents to employees</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-select" className="text-slate-300 font-bold text-xs uppercase">Select Employee</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="employee-select" className="w-full bg-black/20 border-white/10 text-white h-12">
                    <SelectValue placeholder="Select an employee..." />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[200px] z-[200] bg-slate-900 border-white/10 text-slate-300">
                    {users.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.username || u.email} ({u.role})
                        {u.employeeId ? ` - ${u.employeeId}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-type" className="text-slate-300 font-bold text-xs uppercase">Document Type</Label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger id="doc-type" className="bg-black/20 border-white/10 text-white h-12">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200] bg-slate-900 border-white/10 text-slate-300">
                    <SelectItem value="Payroll">Payslip / Payroll</SelectItem>
                    <SelectItem value="Experience Letter">Experience Letter</SelectItem>
                    <SelectItem value="Relieving Letter">Relieving Letter</SelectItem>
                    <SelectItem value="Offer Letter">Offer Letter</SelectItem>
                    <SelectItem value="Formatted Salary Slip">Formatted Salary Slip</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file-upload" className="text-slate-300 font-bold text-xs uppercase">File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="cursor-pointer bg-black/20 border-white/10 text-white h-12 pt-2.5 file:text-blue-400 file:bg-blue-900/20 file:border-0 file:rounded-md file:mr-4 file:font-bold file:px-2"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 h-12 font-bold uppercase tracking-widest text-xs"
                disabled={isUploading || !selectedUserId || !uploadFile}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Document
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Selected User Info & Recent Docs */}
        <Card className="bg-card/40 border border-white/10 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white font-bold">
              <UserIcon className="h-5 w-5 text-blue-400" />
              Employee Documents
            </CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              {selectedUserId
                ? `Viewing documents for ${users.find(u => u.id === selectedUserId)?.username || 'Selected User'}`
                : "Select an employee to view their documents"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedUserId ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-600 opacity-50">
                <UserIcon className="h-12 w-12 mb-2" />
                <p className="font-bold text-xs uppercase tracking-widest">No employee selected</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {selectedUserDocs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border-2 border-dashed border-white/5 rounded-lg">
                    No documents found for this user.
                  </div>
                ) : (
                  selectedUserDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors group">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-blue-500/10 rounded-full shrink-0 group-hover:bg-blue-500/20 transition-colors">
                          <FileText className="h-4 w-4 text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate text-white">{doc.fileName}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-2 uppercase font-bold mt-0.5">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-slate-400 hover:text-white" onClick={() => handleDownload(doc)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-in fade-in duration-700">
      {isAdminOrHr ? (
        <Tabs defaultValue="management" className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase drop-shadow-sm">
                Payroll Management
              </h1>
              <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">Manage employee payrolls and documents</p>
            </div>
            <TabsList className="bg-slate-900 border border-white/10 p-1 rounded-xl h-auto">
              <TabsTrigger
                value="management"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 font-bold uppercase text-xs tracking-wider px-4 py-2"
              >
                Management Area
              </TabsTrigger>
              <TabsTrigger
                value="personal"
                className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400 font-bold uppercase text-xs tracking-wider px-4 py-2"
              >
                My Payroll
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="management" className="mt-0">
            {adminManagementContent}
          </TabsContent>

          <TabsContent value="personal" className="mt-0">
            {personalPayrollContent}
          </TabsContent>
        </Tabs>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight uppercase drop-shadow-sm mb-2">
              Payroll
            </h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">View your salary and payment details</p>
          </div>
          {personalPayrollContent}
        </>
      )}
    </div>
  );
};

export default PayrollPage;
