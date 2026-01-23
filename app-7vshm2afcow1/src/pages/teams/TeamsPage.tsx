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
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto container px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* 2. Page Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-border/40 pb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight mb-2">Teams</h1>
          <p className="text-muted-foreground font-medium text-lg">Collaborate and manage your workforce units</p>
        </div>

        {/* Create Team Button */}
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="h-12 px-8 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
          >
            <Plus className="mr-2 h-5 w-5" />
            Create Team
          </Button>
        )}
      </header>

      {/* 3. Content Area (Grid System) */}
      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[400px] rounded-[32px] bg-muted/20 animate-pulse border border-border/50" />
          ))
        ) : teams.length === 0 ? (
          <div className="col-span-full py-32 text-center rounded-[32px] border-2 border-dashed border-border/60 bg-muted/5">
            <Users className="h-20 w-20 text-muted-foreground mx-auto mb-6 opacity-30" />
            <h3 className="text-2xl font-bold text-foreground">No Teams Found</h3>
            <p className="text-muted-foreground mt-2 text-lg">Get started by creating a new team.</p>
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
                  className="group relative border border-border/60 shadow-lg hover:shadow-2xl hover:border-blue-500/30 hover:-translate-y-1.5 transition-all duration-300 rounded-[32px] bg-card overflow-hidden flex flex-col h-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* A. Card Header */}
                  <div className="p-7 pb-4 flex items-start justify-between gap-5">
                    <div className="flex items-center gap-4 w-full overflow-hidden">
                      <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                        <UsersRound className="h-7 w-7" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl font-bold text-foreground leading-tight truncate pr-2" title={team.name}>
                          {team.name}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="flex h-2 w-2 rounded-full bg-green-500" />
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* B. Card Body */}
                  <CardContent className="p-7 pt-4 flex-1 flex flex-col gap-6">
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 min-h-[4.5em]">
                      {team.description || "No description provided for this team. Add a description to help members understand the team's purpose."}
                    </p>

                    <div className="space-y-5 mt-auto">
                      {/* Team Leader */}
                      <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/30 border border-border/40 group-hover:bg-blue-50/50 group-hover:border-blue-100/50 transition-colors">
                        <Avatar className="h-12 w-12 border-[3px] border-background shadow-md">
                          <AvatarImage src={leader?.profilePhoto} className="object-cover" />
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-black text-lg">
                            {leader?.username?.charAt(0).toUpperCase() || 'L'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="overflow-hidden">
                          <p className="text-[10px] font-black uppercase text-blue-600/80 tracking-widest mb-0.5">Team Leader</p>
                          <p className="text-sm font-bold text-foreground truncate w-full">
                            {leader?.username || "Not Assigned"}
                          </p>
                        </div>
                      </div>

                      {/* Member Stack */}
                      <div>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-3 ml-1">Team Members</p>
                        <div className="flex -space-x-3.5 pl-1">
                          {members.slice(0, 5).map((member) => (
                            <Avatar key={member.id} className="h-10 w-10 border-[3px] border-white dark:border-slate-900 shadow-sm transition-transform hover:z-20 hover:scale-110 cursor-help" title={member.username}>
                              <AvatarImage src={member.profilePhoto} className="object-cover" />
                              <AvatarFallback className="bg-slate-100 text-slate-600 text-[10px] font-bold">
                                {member.username?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {members.length > 5 && (
                            <div className="h-10 w-10 rounded-full bg-slate-100 border-[3px] border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-500 shadow-sm z-10">
                              +{members.length - 5}
                            </div>
                          )}
                          {members.length === 0 && (
                            <span className="text-sm text-muted-foreground italic h-10 flex items-center pl-2">No active members</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>

                  {/* C. Card Footer */}
                  <CardFooter className="p-6 bg-muted/5 border-t border-border/50">
                    <Button variant="outline" className="w-full rounded-2xl h-12 border-2 border-border/60 bg-transparent hover:bg-blue-600 hover:text-white hover:border-blue-600 font-bold transition-all shadow-sm group-hover:shadow-md" asChild>
                      <Link to={`/teams/${team.id}`}>View Team Details</Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden bg-card border border-border/50 shadow-2xl">
          <DialogHeader className="p-8 bg-muted/20 border-b border-border/50">
            <DialogTitle className="text-2xl font-black tracking-tight text-foreground">Create New Team</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Establish a new collaborative unit for your organization.
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Team Name</Label>
              <Input
                placeholder="e.g. Engineering Squad Alpha"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                className="h-12 rounded-2xl border-border bg-muted/30 focus:bg-background font-medium focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Description</Label>
              <Textarea
                placeholder="Briefly describe the team's purpose..."
                value={newTeamDescription}
                onChange={(e) => setNewTeamDescription(e.target.value)}
                rows={4}
                className="rounded-2xl border-border bg-muted/30 focus:bg-background resize-none focus:ring-2 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </div>
          <DialogFooter className="p-6 bg-muted/20 border-t border-border/50 gap-3">
            <Button variant="ghost" onClick={() => setCreateDialogOpen(false)} className="rounded-xl h-12 px-6 font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50">
              Cancel
            </Button>
            <Button onClick={handleCreateTeam} disabled={isSubmitting} className="rounded-xl h-12 px-8 bg-blue-600 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all">
              {isSubmitting ? 'Creating...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamsPage;
