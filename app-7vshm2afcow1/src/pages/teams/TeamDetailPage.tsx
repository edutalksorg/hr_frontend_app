import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UserPlus, X } from 'lucide-react';
import type { Team, User } from '@/types';
import { toast } from 'sonner';

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
                const membersResponse = await apiService.client.get(`/api/teams/${id}/members`);
                const memberIds = membersResponse.data.map((m: any) => m.userId);

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

    const isAdminOrHR = currentUser?.role === 'admin' || currentUser?.role === 'hr';

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
                    <CardHeader>
                        <CardTitle>Team Leader</CardTitle>
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
                            <div className="flex gap-2">
                                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableUsers.map(u => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {u.username} ({u.email})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button onClick={handleAddMember} disabled={!selectedUserId} className="gap-2">
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
