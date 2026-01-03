import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UsersRound, Plus, Users } from 'lucide-react';
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

  // Form State
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDescription, setNewTeamDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
            // Fallback if needed
            membersMap[team.id] = team.memberIds || [];
          }
        })
      );
      setTeamMembersMap(membersMap);
    } catch (error) {
      console.error('Failed to fetch teams data:', error);
      toast.error('Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

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

    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto container py-8 pb-20">
      {/* 2. Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">Teams</h1>
          <p className="text-muted-foreground font-medium">Collaborate with your team members</p>
        </div>

        {/* Create Team Button */}
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="h-12 px-6 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Team
          </Button>
        )}
      </header>

      {/* 3. Content Area (Grid System) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-[24px] bg-muted/40 animate-pulse border border-border/50" />
          ))
        ) : teams.length === 0 ? (
          <div className="col-span-full py-20 text-center rounded-[32px] border-2 border-dashed border-muted">
            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-bold text-foreground">No Teams Found</h3>
            <p className="text-muted-foreground mt-2">Get started by creating a new team.</p>
          </div>
        ) : (
          teams
            .filter(team => {
              if (user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') return true;
              return teamMembersMap[team.id]?.includes(user?.id || '');
            })
            .map((team) => {
              const leader = getTeamLeader(team);
              const members = getTeamMembers(team);
              const memberCount = members.length;

              return (
                /* 4. Team Card Structure */
                <Card
                  key={team.id}
                  className="group border border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 rounded-[24px] bg-card overflow-hidden flex flex-col h-full"
                >
                  {/* A. Card Header */}
                  <div className="p-6 pb-2 flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                        <UsersRound className="h-6 w-6 text-primary group-hover:text-current transition-colors" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-foreground leading-tight line-clamp-1" title={team.name}>
                          {team.name}
                        </CardTitle>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mt-1">
                          {memberCount} {memberCount === 1 ? 'member' : 'members'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* B. Card Body */}
                  <CardContent className="p-6 pt-4 flex-1 space-y-6">
                    <p className="text-sm text-muted-foreground line-clamp-3 min-h-[3em]">
                      {team.description || "No description provided for this team."}
                    </p>

                    <div className="space-y-4">
                      {/* Team Leader */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarImage src={leader?.profilePhoto} />
                          <AvatarFallback className="bg-primary/20 text-primary font-bold">
                            {leader?.username?.charAt(0).toUpperCase() || 'L'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-0.5">Team Leader</p>
                          <p className="text-sm font-bold text-foreground truncate">
                            {leader?.username || "Not Assigned"}
                          </p>
                        </div>
                      </div>

                      {/* Member Stack */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Members</p>
                        </div>
                        <div className="flex -space-x-3 pl-1 pb-1">
                          {members.slice(0, 5).map((member) => (
                            <Avatar key={member.id} className="h-9 w-9 border-[3px] border-card shadow-sm transition-transform hover:z-10 hover:scale-110">
                              <AvatarImage src={member.profilePhoto} />
                              <AvatarFallback className="bg-muted text-muted-foreground text-[10px] font-bold">
                                {member.username?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {members.length > 5 && (
                            <div className="h-9 w-9 rounded-full bg-muted border-[3px] border-card flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                              +{members.length - 5}
                            </div>
                          )}
                          {members.length === 0 && (
                            <span className="text-sm text-muted-foreground italic h-9 flex items-center">No active members</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* C. Card Footer */}
                  <CardFooter className="p-4 bg-muted/10 border-t border-border mt-auto">
                    <Button variant="outline" className="w-full rounded-xl h-11 border-border bg-background hover:bg-primary hover:text-primary-foreground hover:border-primary font-semibold transition-all shadow-sm" asChild>
                      <Link to={`/teams/${team.id}`}>View Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden bg-card border border-border shadow-2xl">
          <DialogHeader className="p-8 bg-muted/20 border-b border-border">
            <DialogTitle className="text-2xl font-black tracking-tight">Create New Team</DialogTitle>
            <DialogDescription className="text-base">
              Establish a new collaborative unit.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Team Name</Label>
              <Input
                placeholder="e.g. Engineering Squad Alpha"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="h-12 rounded-xl border-border bg-muted/30 focus:bg-background font-medium"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea
                placeholder="Briefly describe the team's purpose..."
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                rows={4}
                className="rounded-xl border-border bg-muted/30 focus:bg-background resize-none"
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t border-border gap-3">
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)} className="rounded-xl h-12 px-6 font-bold text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={isSubmitting} className="rounded-xl h-12 px-8 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsPage;
