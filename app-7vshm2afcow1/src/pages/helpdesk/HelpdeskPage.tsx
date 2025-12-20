import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { SupportTicket } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LifeBuoy, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const HelpdeskPage: React.FC = () => {
    const { user } = useAuth();
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, OPEN, CLOSED
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const isHrOrAdmin = user?.role === 'admin' || user?.role === 'hr';

    useEffect(() => {
        if (!user) return;
        fetchTickets();
    }, [user]);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            // For now simplify: Everyone creates/views their own, HR/Admin views all via separate toggle or API?
            // Existing API: getMyTickets(userId) and getAllTickets().
            // Ideally Admin sees ALL.
            let data: SupportTicket[] = [];
            if (isHrOrAdmin) {
                data = await apiService.getAllTickets();
            } else {
                data = await apiService.getMyTickets(user!.id);
            }
            setTickets(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const ticketData = {
            category: formData.get('category') as any,
            priority: formData.get('priority') as any,
            subject: formData.get('subject') as string,
            description: formData.get('description') as string,
            status: 'OPEN' as any
        };

        try {
            await apiService.createTicket(ticketData);
            fetchTickets();
            setIsDialogOpen(false);
        } catch (e) {
            alert('Failed to create ticket');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-blue-500';
            case 'IN_PROGRESS': return 'bg-yellow-500';
            case 'RESOLVED': return 'bg-green-500';
            case 'REJECTED': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Helpdesk & Support</h1>
                    <p className="text-muted-foreground">Raise tickets and track resolution.</p>
                </div>

                {!isHrOrAdmin && (
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button><Plus className="mr-2 h-4 w-4" /> New Ticket</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Raise Support Ticket</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleCreateTicket} className="space-y-4">
                                <select name="category" className="w-full p-2 border rounded" required>
                                    <option value="IT_SUPPORT">IT Support</option>
                                    <option value="HR_QUERY">HR Query</option>
                                    <option value="PAYROLL_ISSUE">Payroll Issue</option>
                                    <option value="GENERAL">General</option>
                                </select>
                                <select name="priority" className="w-full p-2 border rounded" required>
                                    <option value="LOW">Low Priority</option>
                                    <option value="MEDIUM">Medium Priority</option>
                                    <option value="HIGH">High Priority</option>
                                </select>
                                <input name="subject" placeholder="Subject" className="w-full p-2 border rounded" required />
                                <textarea name="description" placeholder="Describe your issue..." className="w-full p-2 border rounded min-h-[100px]" required />
                                <Button type="submit" className="w-full">Submit Ticket</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="grid gap-4">
                {tickets.length === 0 ? (
                    <Card><CardContent className="p-10 text-center text-muted-foreground">No tickets found.</CardContent></Card>
                ) : tickets.map(ticket => (
                    <Card key={ticket.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Badge className={`${getStatusColor(ticket.status)} text-white`}>{ticket.status.replace('_', ' ')}</Badge>
                                    <span className="font-semibold text-lg">{ticket.subject}</span>
                                    <span className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">{ticket.category.replace('_', ' ')}</span>
                                </div>
                                <p className="text-muted-foreground text-sm line-clamp-1">{ticket.description}</p>
                                <div className="text-xs text-muted-foreground flex gap-4 pt-1 items-center">
                                    <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                                    {ticket.requester && isHrOrAdmin && (
                                        <span className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded">
                                            Requested by: <span className="font-semibold">{ticket.requester.username}</span>
                                            <span className="opacity-75">({ticket.requester.role})</span>
                                        </span>
                                    )}
                                    {ticket.assignedTo && <span>Assigned to: {ticket.assignedTo.username}</span>}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className={`text-sm font-bold ${ticket.priority === 'HIGH' ? 'text-red-500' : 'text-foreground'}`}>
                                    {ticket.priority}
                                </div>
                                {isHrOrAdmin && ticket.requester && (
                                    <div className="text-[10px] text-muted-foreground">
                                        ID: {ticket.requester.employeeId || ticket.requester.id.substring(0, 8)}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default HelpdeskPage;
