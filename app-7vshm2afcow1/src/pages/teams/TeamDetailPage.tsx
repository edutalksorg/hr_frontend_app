import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, UserPlus, X, Check, ChevronsUpDown, UserCog } from 'lucide-react';
import type { Team, User } from '@/types';
import { toast } from 'sonner';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const TeamDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();
    const [team, setTeam] = useState<Team | null>(null);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    const [leader, setLeader] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchTeamData();
    }, [id]);

    const fetchTeamData = async () => {
        if (!id) return;

        try {
            const [teamData, usersData] = await Promise.all([
                apiService.getTeam(id),
                apiService.getAllUsers()
            ]);

            setTeam(teamData);
            setAllUsers(usersData);

            // Fetch team members from the members endpoint
            try {
                const membersData = await apiService.getTeamMembers(id);
                const memberIds = membersData.map((m: any) => m.userId);

                // Get full user objects for members
                const members = usersData.filter(u => memberIds.includes(u.id));
                setTeamMembers(members);
            } catch (err) {
                console.error('Failed to fetch team members:', err);
                // Fallback to using memberIds from team object
                const members = usersData.filter(u => teamData.memberIds?.includes(u.id));
                setTeamMembers(members);
            }

            // Get team leader
            const teamLeader = usersData.find(u => u.id === teamData.leaderId);
            setLeader(teamLeader || null);
        } catch (error) {
            console.error('Failed to fetch team data:', error);
            toast.error('Failed to load team details');
        } finally {
            setLoading(false);
        }
    };

    const handleAssignLeader = async (userId: string) => {
        if (!id) return;
        try {
            await apiService.assignTeamLeader(id, userId);
            toast.success('Team leader updated successfully');
            fetchTeamData();
        } catch (error) {
            toast.error('Failed to update team leader');
        }
    };

    const handleAddMember = async () => {
        if (!selectedUserId || !id) return;

        try {
            await apiService.addTeamMember(id, selectedUserId);
            toast.success('Member added successfully');
            setSelectedUserId('');
            fetchTeamData();
        } catch (error) {
            toast.error('Failed to add member');
        }
    };

    const handleRemoveMember = async (userId: string) => {
        if (!id) return;

        try {
            await apiService.removeTeamMember(id, userId);
            toast.success('Member removed successfully');
            fetchTeamData();
        } catch (error) {
            toast.error('Failed to remove member');
        }
    };

    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr' || currentUser?.role === 'manager';

    // Get users not in team
    const availableUsers = allUsers.filter(u =>
        !teamMembers.some(m => m.id === u.id) && u.id !== team?.leaderId
    );

    if (loading) {
        return <div className="space-y-6"><h1 className="text-3xl font-bold">Team Details</h1><p>Loading...</p></div>;
    }

    if (!team) {
        return <div className="space-y-6"><h1 className="text-3xl font-bold">Team Not Found</h1></div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/teams')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{team.name}</h1>
                    <p className="text-muted-foreground">{team.description || 'No description'}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Team Leader Card */}
                <Card className="glass-card shadow-elegant">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Team Leader</CardTitle>
                        {isAdminOrHR && (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <UserCog className="h-4 w-4" />
                                        {leader ? 'Change' : 'Assign'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0" align="end">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>
                                            <CommandGroup>
                                                {allUsers.map((u) => (
                                                    <CommandItem
                                                        key={u.id}
                                                        value={`${u.username} ${u.employeeId || ''} ${u.role}`}
                                                        onSelect={() => handleAssignLeader(u.id)}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                leader?.id === u.id ? "opacity-100" : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={u.profilePhoto} />
                                                                <AvatarFallback>{u.username?.charAt(0) || 'U'}</AvatarFallback>
                                                            </Avatar>
                                                            <span>{u.username}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        )}
                    </CardHeader>
                    <CardContent>
                        {leader ? (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={leader.profilePhoto} />
                                    <AvatarFallback>{leader.username?.charAt(0) || 'L'}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{leader.username}</p>
                                    <p className="text-sm text-muted-foreground">{leader.email}</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">No leader assigned</p>
                        )}
                    </CardContent>
                </Card>

                {/* Add Member Card (Admin/HR only) */}
                {isAdminOrHR && (
                    <Card className="glass-card shadow-elegant">
                        <CardHeader>
                            <CardTitle>Add Member</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 w-full">
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className="w-full justify-between"
                                        >
                                            {selectedUserId
                                                ? availableUsers.find((u) => u.id === selectedUserId)?.username
                                                : "Select employee..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="p-0" align="start">
                                        <Command>
                                            <CommandInput placeholder="Search employee..." />
                                            <CommandList>
                                                <CommandEmpty>No employee found.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableUsers.map((u) => (
                                                        <CommandItem
                                                            key={u.id}
                                                            value={`${u.username} ${u.employeeId || ''} ${u.role}`}
                                                            onSelect={() => {
                                                                setSelectedUserId(u.id === selectedUserId ? "" : u.id);
                                                                setOpen(false);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedUserId === u.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex items-center gap-3 w-full">
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={u.profilePhoto} />
                                                                    <AvatarFallback>{u.username?.charAt(0) || 'U'}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{u.username}</span>
                                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                        <span>ID: {u.employeeId || 'N/A'}</span>
                                                                        <span className="capitalize px-1.5 py-0.5 rounded bg-secondary text-secondary-foreground">
                                                                            {u.role}
                                                                        </span>
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
                                <Button onClick={handleAddMember} disabled={!selectedUserId} className="gap-2 shrink-0">
                                    <UserPlus className="h-4 w-4" />
                                    Add
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Team Members */}
            <Card className="glass-card shadow-elegant">
                <CardHeader>
                    <CardTitle>Team Members ({teamMembers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {teamMembers.length === 0 ? (
                            <p className="text-muted-foreground">No members yet</p>
                        ) : (
                            teamMembers.map(member => (
                                <div key={member.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={member.profilePhoto} />
                                            <AvatarFallback>{member.username?.charAt(0) || 'M'}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium">{member.username}</p>
                                            <p className="text-sm text-muted-foreground">{member.email}</p>
                                            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                                                {member.role}
                                            </span>
                                        </div>
                                    </div>
                                    {isAdminOrHR && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleRemoveMember(member.id)}
                                            className="text-destructive hover:text-destructive"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default TeamDetailPage;
