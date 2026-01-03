import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, Trash2, Download, Check, ChevronsUpDown } from 'lucide-react';
import type { Document, User } from '@/types';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

const DocumentsPage: React.FC = () => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newDoc, setNewDoc] = useState({ category: '', file: null as File | null });
  const [users, setUsers] = useState<User[]>([]);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [isUserComboOpen, setIsUserComboOpen] = useState(false);

  useEffect(() => {
    fetchDocuments();
    if (user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const data = await apiService.getAllUsers();
      setUsers(data.filter(u => u.role !== 'admin')); // Filter out admins if needed, or keep all
    } catch (error) {
      console.error('Failed to fetch users', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      let data: Document[] = [];
      const role = user?.role?.toLowerCase();

      if (role === 'admin' || role === 'hr' || role === 'manager') {
        data = await apiService.getAllDocuments();
      } else if (user?.id) {
        data = await apiService.getDocuments(user.id);
      }

      setDocuments(data);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      // Fallback if permission issue for "All"
      if (user?.id && (user.role === 'admin' || user.role === 'hr' || user.role === 'manager')) {
        try {
          // Maybe API endpoint for "All" failed, try getting own documents
          const data = await apiService.getDocuments(user.id);
          setDocuments(data);
        } catch (e) { }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      // Use filename from doc, fallback to ID
      const name = (doc as any).fileName || (doc as any).title || `document-${doc.id}`;
      await apiService.downloadDocument(doc.id, name);
      toast.success('Download started');
    } catch {
      toast.error('Failed to download');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('PROTOCOL ALERT: Are you sure you want to PERMANENTLY delete this document? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteDocument(documentId);
      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to delete document');
      // Admin/HR might delete anyone's, but backend restrictions apply.
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNewDoc({ ...newDoc, file: e.target.files[0] });
    }
  };

  const handleUpload = async () => {
    if (!newDoc.category || !newDoc.file) {
      toast.error('Please select a category and a file');
      return;
    }

    if ((user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && !targetUserId &&
      ['Payroll', 'Experience Letter', 'Relieving Letter'].includes(newDoc.category)) {
      toast.error('Please select a target user for this document type');
      return;
    }

    const MAX_SIZE = 20 * 1024 * 1024 * 1024;
    if (newDoc.file.size > MAX_SIZE) {
      toast.error("File is too large. Max 20GB.");
      return;
    }

    try {
      await apiService.uploadDocument(newDoc.file, newDoc.category, user?.id || '', targetUserId);
      toast.success('Document uploaded successfully');
      setIsDialogOpen(false);
      setNewDoc({ category: '', file: null });
      setTargetUserId('');
      fetchDocuments();
    } catch (error) {
      toast.error('Failed to upload document');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents & Payroll</h1>
          <p className="text-muted-foreground">Manage files, payrolls, and letters</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Upload className="h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Upload New Document</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">

              {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
                <div className="grid gap-2">
                  <Label htmlFor="targetUser">Select User (For Payroll/Letters)</Label>
                  <Popover open={isUserComboOpen} onOpenChange={setIsUserComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isUserComboOpen}
                        className="w-full justify-between h-12 px-4 shadow-sm hover:border-primary/50 transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate">
                          {targetUserId === 'self' ? (
                            "Myself (Personal Upload)"
                          ) : targetUserId ? (
                            <>
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={users.find((u) => u.id === targetUserId)?.profilePhoto} />
                                <AvatarFallback>{users.find((u) => u.id === targetUserId)?.username?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <span className="truncate">
                                {users.find((u) => u.id === targetUserId)?.username} ({users.find((u) => u.id === targetUserId)?.employeeId})
                              </span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Select Employee / Marketing Executive...</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[100]" align="start">
                      <Command className="w-full">
                        <CommandInput placeholder="Search by name, email, or employee ID..." className="h-10" />
                        <CommandList className="max-h-[400px]">
                          <CommandEmpty>No employee found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              value="self"
                              onSelect={() => {
                                setTargetUserId('self');
                                setIsUserComboOpen(false);
                              }}
                              className="flex items-center gap-3 py-3 px-4 cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 shrink-0",
                                  targetUserId === 'self' ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8 bg-primary/10">
                                  <AvatarFallback>ME</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm text-primary">Myself</span>
                                  <span className="text-xs text-muted-foreground">Personal Upload</span>
                                </div>
                              </div>
                            </CommandItem>

                            {users.map((u) => (
                              <CommandItem
                                key={u.id}
                                value={`${u.username} ${u.email} ${u.employeeId}`}
                                onSelect={() => {
                                  setTargetUserId(u.id);
                                  setIsUserComboOpen(false);
                                }}
                                className="flex items-center gap-3 py-3 px-4 cursor-pointer"
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4 shrink-0",
                                    targetUserId === u.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex items-center gap-3 w-full">
                                  <Avatar className="h-10 w-10 border border-border/50">
                                    <AvatarImage src={u.profilePhoto} />
                                    <AvatarFallback>{u.username?.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-bold text-sm truncate">{u.username}</span>
                                      <Badge variant="outline" className="text-[10px] h-4 px-1 shrink-0 uppercase">
                                        {u.role?.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                                      {u.employeeId && <span className="font-medium text-primary/80">{u.employeeId}</span>}
                                      {u.employeeId && <span>•</span>}
                                      <span className="truncate">{u.email}</span>
                                    </div>
                                  </div>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="category">Category / Type</Label>
                <Select
                  value={newDoc.category}
                  onValueChange={(value) => setNewDoc({ ...newDoc, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
                      <>
                        <SelectItem value="Payroll">Payroll</SelectItem>
                        <SelectItem value="Experience Letter">Experience Letter</SelectItem>
                        <SelectItem value="Relieving Letter">Relieving Letter</SelectItem>
                        <SelectItem value="Offer Letter">Offer Letter</SelectItem>
                      </>
                    )}
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="ID Proof">ID Proof</SelectItem>
                    <SelectItem value="Tax">Tax</SelectItem>
                    <SelectItem value="Resume">Resume</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-muted-foreground">Max size: 20GB</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={!newDoc.file || !newDoc.category}>Upload</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {documents.map((doc: any) => (
          <Card key={doc.id} className="glass-card shadow-elegant">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base truncate" title={doc.fileName || doc.title}>
                    {doc.fileName || doc.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">{doc.type || doc.category}</Badge>
                    {user?.role === 'admin' && doc.role && (
                      <Badge variant="outline" className="text-xs">{doc.role}</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>{new Date(doc.createdAt || doc.uploadedAt).toLocaleDateString()}</span>
                  <span>{doc.uploadedBy ? `by ${doc.uploadedBy}` : (doc.role ? `by ${doc.role}` : '')}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    className="hover:bg-primary/10"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>

                  {/* Delete: Owner or Admin/HR? Requirement doesn't explicitly restrict delete, assuming owner or Admin */}
                  {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {documents.length === 0 && (
          <div className="col-span-full text-center py-10 text-muted-foreground">
            No documents found.
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;
