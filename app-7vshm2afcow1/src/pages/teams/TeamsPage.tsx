import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UsersRound, Plus } from 'lucide-react';
import type { Team, User } from '@/types';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

const TeamsPage: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teamMembersMap, setTeamMembersMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsData, usersData] = await Promise.all([
          apiService.getTeams(),
          apiService.getAllUsers()
        ]);
        setTeams(teamsData);
        setUsers(usersData);

        // Fetch members for each team
        const membersMap: Record<string, string[]> = {};
        await Promise.all(
          teamsData.map(async (team) => {
            try {
              const membersData = await apiService.getTeamMembers(team.id);
              membersMap[team.id] = membersData.map((m: any) => m.userId);
            } catch (err) {
              console.error(`Failed to fetch members for team ${team.id}:`, err);
              membersMap[team.id] = team.memberIds || [];
            }
          })
        );
        setTeamMembersMap(membersMap);

        console.log('Teams fetched:', teamsData);
        console.log('Team members map:', membersMap);
      } catch (error) {
        console.error('Failed to fetch teams data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getTeamMembers = (team: Team) => {
    const memberIds = teamMembersMap[team.id] || team.memberIds || [];
    return users.filter(u => memberIds.includes(u.id));
  };

  const getTeamLeader = (team: Team) => {
    return users.find(u => u.id === team.leaderId);
  };

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      toast.error('Team name is required');
      return;
    }

    try {
      const newTeam = await apiService.createTeam({
        name: newTeamName,
        description: newTeamDescription,
        leaderId: user?.id || '',
        memberIds: []
      });
      setTeams([...teams, newTeam]);
      setNewTeamName('');
      setNewTeamDescription('');
      setCreateDialogOpen(false);
      toast.success('Team created successfully');
    } catch (error) {
      toast.error('Failed to create team');
    }
  };

  if (loading) {
    return <div className="space-y-6"><h1 className="text-3xl font-bold">Teams</h1><p>Loading...</p></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Teams</h1>
          <p className="text-muted-foreground">Collaborate with your team members</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Create Team
          </Button>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {teams
          .filter(team => {
            // Admin and HR see all teams
            if (user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') {
              return true;
            }
            // Employees see only teams they belong to
            return teamMembersMap[team.id]?.includes(user?.id || '');
          })
          .map((team) => {
            const leader = getTeamLeader(team);
            const members = getTeamMembers(team);

            return (
              <Card key={team.id} className="glass-card shadow-elegant hover:shadow-glow transition-smooth">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <UsersRound className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{team.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{members.length} members</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {team.description && (
                    <p className="text-sm text-muted-foreground">{team.description}</p>
                  )}

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Team Leader</p>
                    {leader && (
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={leader.profilePhoto} />
                          <AvatarFallback>{leader.username?.charAt(0) || 'L'}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{leader.username || 'Unknown'}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Members</p>
                    <div className="flex -space-x-2">
                      {members.slice(0, 5).map((member) => (
                        <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                          <AvatarImage src={member.profilePhoto} />
                          <AvatarFallback>{member.username?.charAt(0) || 'M'}</AvatarFallback>
                        </Avatar>
                      ))}
                      {members.length > 5 && (
                        <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                          <span className="text-xs font-medium">+{members.length - 5}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full" asChild>
                    <Link to={`/teams/${team.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Create Team Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team to collaborate with your colleagues.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="team-name">Team Name *</Label>
              <Input
                id="team-name"
                placeholder="Enter team name"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="team-description">Description</Label>
              <Textarea
                id="team-description"
                placeholder="Enter team description (optional)"
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam}>
              Create Team
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsPage;
