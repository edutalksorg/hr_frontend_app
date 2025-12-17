import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, TrendingDown, Calendar, FileText, Download, Upload, User as UserIcon, Loader2 } from 'lucide-react';
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

  const isAdminOrHr = user?.role === 'admin' || user?.role === 'hr';

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
        <h2 className="text-2xl font-bold tracking-tight">My Payroll</h2>
        <p className="text-muted-foreground">View your salary and payment details</p>
      </div>

      {latestPayroll && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="glass-card shadow-elegant hover:shadow-lg transition-all transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Salary</CardTitle>
              <div className="p-2 bg-primary/10 rounded-full">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">${latestPayroll.netSalary.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">{latestPayroll.month} {latestPayroll.year}</p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant hover:shadow-lg transition-all transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Base Salary</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-full">
                <TrendingUp className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${latestPayroll.baseSalary.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant hover:shadow-lg transition-all transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Deductions</CardTitle>
              <div className="p-2 bg-red-500/10 rounded-full">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${latestPayroll.deductions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant hover:shadow-lg transition-all transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Days</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-full">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestPayroll.attendanceDays}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payroll Documents Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Payslips & Documents</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {payrollDocs.map((doc: any) => (
            <Card key={doc.id} className="glass-card shadow-sm hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/50">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-2 bg-primary/10 rounded-full">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <CardTitle className="text-sm truncate font-medium" title={doc.fileName}>
                    {doc.fileName}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(doc.createdAt || doc.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs hover:bg-primary/5 group"
                  onClick={() => handleDownload(doc)}
                >
                  <Download className="h-3 w-3 mr-1 group-hover:scale-110 transition-transform" />
                  Download
                </Button>
              </CardContent>
            </Card>
          ))}
          {payrollDocs.length === 0 && (
            <div className="col-span-full text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground bg-muted/20">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No payroll documents available.</p>
            </div>
          )}
        </div>
      </div>

      <Card className="glass-card shadow-elegant">
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payroll.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-primary">{record.month} {record.year}</p>
                  <p className="text-sm text-muted-foreground">
                    {record.attendanceDays} days worked
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">${record.netSalary.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    Base: ${record.baseSalary} | Bonus: ${record.bonuses}
                  </p>
                </div>
              </div>
            ))}
            {payroll.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p>No payroll history records.</p>
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
        <Card className="glass-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Upload Document
            </CardTitle>
            <CardDescription>Send payslips or documents to employees</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employee-select">Select Employee</Label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger id="employee-select" className="w-full">
                    <SelectValue placeholder="Select an employee..." />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-[200px] z-[200]">
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
                <Label htmlFor="doc-type">Document Type</Label>
                <Select value={uploadType} onValueChange={setUploadType}>
                  <SelectTrigger id="doc-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[200]">
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
                <Label htmlFor="file-upload">File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file-upload"
                    type="file"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
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
        <Card className="glass-card shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-primary" />
              Employee Documents
            </CardTitle>
            <CardDescription>
              {selectedUserId
                ? `Viewing documents for ${users.find(u => u.id === selectedUserId)?.username || 'Selected User'}`
                : "Select an employee to view their documents"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedUserId ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground opacity-50">
                <UserIcon className="h-12 w-12 mb-2" />
                <p>No employee selected</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {selectedUserDocs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    No documents found for this user.
                  </div>
                ) : (
                  selectedUserDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-lg border border-border/50 hover:bg-secondary/40 transition-colors">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="p-2 bg-background rounded-full shrink-0">
                          <FileText className="h-4 w-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{doc.fileName}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-2">
                            <span>{doc.type}</span>
                            <span>•</span>
                            <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => handleDownload(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
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
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
      {isAdminOrHr ? (
        <Tabs defaultValue="management" className="w-full space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Payroll Management
              </h1>
              <p className="text-muted-foreground mt-1">Manage employee payrolls and documents</p>
            </div>
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="management">Management Area</TabsTrigger>
              <TabsTrigger value="personal">My Payroll</TabsTrigger>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-6">
            Payroll
          </h1>
          {personalPayrollContent}
        </>
      )}
    </div>
  );
};

export default PayrollPage;
