import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { PerformanceGoal, PerformanceReview, User, Team } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Target, Star, Users, Trash2, Check, ChevronDown, Filter } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';


const PerformancePage: React.FC = () => {
    const { user } = useAuth();
    const [goals, setGoals] = useState<PerformanceGoal[]>([]);
    const [reviews, setReviews] = useState<PerformanceReview[]>([]);
    const [activeTab, setActiveTab] = useState('goals');
    const [editingGoal, setEditingGoal] = useState<PerformanceGoal | null>(null);

    // Admin view state
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);

    // Filter State
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'MY' | 'ALL' | 'FILTER'>('MY'); // MY, ALL, FILTER

    const dropdownRef = useRef<HTMLDivElement>(null);
    const isHrOrAdmin = user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager';

    // Derived target for single-user operations (Create Goal/Review)
    const getSingleTargetUser = () => {
        if (selectedEmployeeIds.length === 1 && !selectedTeamId) return selectedEmployeeIds[0];
        if (viewMode === 'MY') return user?.id;
        return null;
    };

    const targetUserId = getSingleTargetUser();

    useEffect(() => {
        if (user && isHrOrAdmin) {
            setViewMode('ALL');
        } else {
            setViewMode('MY');
        }
    }, [user, isHrOrAdmin]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchData();
    }, [viewMode, selectedTeamId, selectedEmployeeIds, user]);

    useEffect(() => {
        if (isHrOrAdmin) {
            const fetchResources = async () => {
                try {
                    const [usersData, teamsData] = await Promise.all([
                        apiService.getAllUsers(),
                        apiService.getTeams()
                    ]);
                    setAllUsers(usersData);
                    setTeams(teamsData);
                } catch (e) {
                    console.error("Failed to fetch resources", e);
                }
            };
            fetchResources();
        }
    }, [isHrOrAdmin]);

    const fetchData = async () => {
        try {
            if (viewMode === 'ALL') {
                const reviewsData = await apiService.getAllReviews();
                setReviews(reviewsData);
                setGoals([]);
                setActiveTab('reviews');
            } else if (viewMode === 'MY') {
                if (user?.id) {
                    const [goalsData, reviewsData] = await Promise.all([
                        apiService.getUserGoals(user.id),
                        apiService.getUserReviews(user.id)
                    ]);
                    setGoals(goalsData);
                    setReviews(reviewsData);
                }
            } else if (viewMode === 'FILTER') {
                const reviewData = await apiService.getFilteredReviews(
                    selectedTeamId || undefined,
                    selectedEmployeeIds.length > 0 ? selectedEmployeeIds : undefined
                );
                setReviews(reviewData);

                if (selectedEmployeeIds.length === 1 && !selectedTeamId) {
                    const goalsData = await apiService.getUserGoals(selectedEmployeeIds[0]);
                    setGoals(goalsData);
                } else {
                    setGoals([]);
                }
                setActiveTab('reviews');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const toggleEmployeeSelection = (id: string) => {
        if (selectedEmployeeIds.includes(id)) {
            setSelectedEmployeeIds(prev => prev.filter(uid => uid !== id));
        } else {
            setSelectedEmployeeIds(prev => [...prev, id]);
        }
        setViewMode('FILTER');
    };

    const selectTeam = (id: string) => {
        if (selectedTeamId === id) setSelectedTeamId(null);
        else setSelectedTeamId(id);
        setViewMode('FILTER');
    };

    const handleMyPerformance = () => {
        setViewMode('MY');
        setSelectedTeamId(null);
        setSelectedEmployeeIds([]);
        setIsDropdownOpen(false);
    };

    const handleViewAll = () => {
        setViewMode('ALL');
        setSelectedTeamId(null);
        setSelectedEmployeeIds([]);
        setIsDropdownOpen(false);
    };

    const getFilterLabel = () => {
        if (viewMode === 'MY') return 'My Performance';
        if (viewMode === 'ALL') return 'View All Reviews';
        const parts = [];
        if (selectedTeamId) {
            const team = teams.find(t => t.id === selectedTeamId);
            if (team) parts.push(`Team: ${team.name}`);
        }
        if (selectedEmployeeIds.length > 0) {
            parts.push(`${selectedEmployeeIds.length} Employee(s)`);
        }
        return parts.length > 0 ? parts.join(' & ') : 'Filter';
    };

    const handleCreateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const target = getSingleTargetUser();
        if (!target) {
            alert("Please select a single user to assign a goal.");
            return;
        }
        const formData = new FormData(e.currentTarget);
        const goalData = {
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            type: formData.get('type') as any,
            startDate: formData.get('startDate') as string,
            endDate: formData.get('endDate') as string,
            status: 'PENDING' as any,
            progressPercentage: 0
        };

        try {
            await apiService.createGoal(target, goalData);
            fetchData();
        } catch (e) {
            alert('Failed to create goal');
        }
    };

    const handleUpdateGoal = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingGoal) return;
        const formData = new FormData(e.currentTarget);

        // Base updates (everyone can do this)
        let updates: any = {
            progressPercentage: parseInt(formData.get('progress') as string),
            status: formData.get('status')
        };

        // Admin/HR Extended Updates
        if (isHrOrAdmin) {
            updates = {
                ...updates,
                title: formData.get('title'),
                description: formData.get('description'),
                type: formData.get('type'),
                startDate: formData.get('startDate'),
                endDate: formData.get('endDate'),
                adminFeedback: formData.get('adminFeedback')
            };
        }

        try {
            await apiService.updateGoal(editingGoal.id, updates);
            setEditingGoal(null);
            fetchData();
        } catch (e) {
            alert('Failed to update goal');
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        if (!confirm('Are you sure you want to delete this goal?')) return;
        try {
            await apiService.deleteGoal(goalId);
            setGoals(goals.filter(g => g.id !== goalId));
        } catch (e) {
            alert('Failed to delete goal');
        }
    };

    const handleAddReview = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const target = getSingleTargetUser();
        if (!target) {
            alert("Please select a single user to add a review.");
            return;
        }
        const formData = new FormData(e.currentTarget);
        const reviewData = {
            rating: parseFloat(formData.get('rating') as string),
            feedback: formData.get('feedback') as string,
            improvementAreas: formData.get('improvementAreas') as string,
            cycle: formData.get('cycle') as string
        };

        try {
            await apiService.addReview(target, reviewData);
            fetchData();
        } catch (e) {
            alert('Failed to add review');
        }
    };

    const handleDeleteReview = async (reviewId: string) => {
        if (!confirm('Are you sure you want to delete this review?')) return;
        try {
            await apiService.deleteReview(reviewId);
            setReviews(reviews.filter(r => r.id !== reviewId));
        } catch (e) {
            alert('Failed to delete review');
        }
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Project Goals</h1>
                    <p className="text-muted-foreground">Track goals, achievement and growth.</p>
                </div>
                {/* Admin User Selector */}
                {isHrOrAdmin && (
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            variant="outline"
                            className="min-w-[250px] justify-between"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <span className="truncate max-w-[200px]">{getFilterLabel()}</span>
                            <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>

                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-80 bg-popover text-popover-foreground rounded-md border shadow-md z-50 max-h-[500px] overflow-y-auto">
                                <div className="p-1">
                                    <div
                                        className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer rounded-sm"
                                        onClick={handleMyPerformance}
                                    >
                                        <Users className="h-4 w-4" /> My Performance
                                        {viewMode === 'MY' && <Check className="h-4 w-4 ml-auto" />}
                                    </div>
                                    <div
                                        className="flex items-center gap-2 p-2 hover:bg-muted cursor-pointer rounded-sm font-semibold text-primary"
                                        onClick={handleViewAll}
                                    >
                                        <Filter className="h-4 w-4" /> View All Reviews
                                        {viewMode === 'ALL' && <Check className="h-4 w-4 ml-auto" />}
                                    </div>
                                </div>
                                <div className="border-t my-1" />

                                <div className="p-2">
                                    <div className="text-xs font-semibold text-muted-foreground mb-2">Teams</div>
                                    {teams.length === 0 ? <div className="text-sm text-muted-foreground pl-2">No teams found</div> :
                                        teams.map(team => (
                                            <div
                                                key={team.id}
                                                className="flex items-center gap-2 p-1.5 hover:bg-muted cursor-pointer rounded-sm pl-4"
                                                onClick={() => selectTeam(team.id)}
                                            >
                                                <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedTeamId === team.id ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                                    {selectedTeamId === team.id && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <span className="text-sm">{team.name}</span>
                                            </div>
                                        ))
                                    }
                                </div>

                                <div className="border-t my-1" />

                                <div className="p-2">
                                    <div className="text-xs font-semibold text-muted-foreground mb-2">Employees</div>
                                    {allUsers
                                        .filter(u => u.id !== user?.id)
                                        .map(u => (
                                            <div
                                                key={u.id}
                                                className="flex items-center gap-2 p-1.5 hover:bg-muted cursor-pointer rounded-sm pl-4"
                                                onClick={() => toggleEmployeeSelection(u.id)}
                                            >
                                                <div className={`w-4 h-4 border rounded flex items-center justify-center ${selectedEmployeeIds.includes(u.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                                    {selectedEmployeeIds.includes(u.id) && <Check className="h-3 w-3 text-white" />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm">{u.username || u.email}</span>
                                                    <span className="text-xs text-muted-foreground capitalize">{u.role}</span>
                                                </div>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger
                        value="goals"
                        disabled={viewMode === 'ALL' || (viewMode === 'FILTER' && (!!selectedTeamId || selectedEmployeeIds.length > 1))}
                    >
                        Goals
                    </TabsTrigger>
                    <TabsTrigger value="reviews">Reviews & Feedback</TabsTrigger>
                </TabsList>

                <TabsContent value="goals" className="space-y-4">
                    <div className="flex justify-between">
                        <Button variant="outline" onClick={() => window.print()}>Export Report</Button>

                        {/* Create Goal Dialog - Only for HR/Admin */}
                        {isHrOrAdmin && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button><Plus className="mr-2 h-4 w-4" /> Set New Goal</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Set Performance Goal</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleCreateGoal} className="space-y-4">
                                        <input name="title" placeholder="Goal Title" className="w-full p-2 border rounded" required />
                                        <textarea name="description" placeholder="Description" className="w-full p-2 border rounded" required />
                                        <select name="type" className="w-full p-2 border rounded">
                                            <option value="MONTHLY">Monthly</option>
                                            <option value="QUARTERLY">Quarterly</option>
                                            <option value="YEARLY">Yearly</option>
                                        </select>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="date" name="startDate" className="p-2 border rounded" required />
                                            <input type="date" name="endDate" className="p-2 border rounded" required />
                                        </div>
                                        <Button type="submit" className="w-full">Create Goal</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {goals.length === 0 ? (
                            <p className="text-muted-foreground col-span-3 text-center py-10">No goals set yet.</p>
                        ) : goals.map(goal => (
                            <Card key={goal.id} className="relative">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">
                                        {goal.type}
                                    </CardTitle>
                                    <Target className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{goal.title}</div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {goal.description}
                                    </p>
                                    <div className="mt-4 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span>Progress</span>
                                            <span>{goal.progressPercentage}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-primary"
                                                style={{ width: `${goal.progressPercentage}%` }}
                                            />
                                        </div>
                                        <div className="flex justify-between text-xs text-muted-foreground pt-2">
                                            <span>Status: <span className={goal.status === 'COMPLETED' ? 'text-green-500' : 'text-blue-500'}>{goal.status}</span></span>
                                            <span className="flex gap-2 items-center">
                                                <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={() => setEditingGoal(goal)}>Update</Button>
                                                {isHrOrAdmin && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => handleDeleteGoal(goal.id)}
                                                        title="Delete Goal"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {goal.endDate}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                    {/* Edit Goal Dialog */}
                    <Dialog open={!!editingGoal} onOpenChange={() => setEditingGoal(null)}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{isHrOrAdmin ? 'Edit Goal Details' : 'Update Goal Progress'}</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleUpdateGoal} className="space-y-4">
                                {isHrOrAdmin && (
                                    <>
                                        <div>
                                            <label className="text-sm font-medium">Title</label>
                                            <input name="title" defaultValue={editingGoal?.title} className="w-full p-2 border rounded" required />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Description</label>
                                            <textarea name="description" defaultValue={editingGoal?.description} className="w-full p-2 border rounded" required />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-sm font-medium">Type</label>
                                                <select name="type" defaultValue={editingGoal?.type} className="w-full p-2 border rounded">
                                                    <option value="MONTHLY">Monthly</option>
                                                    <option value="QUARTERLY">Quarterly</option>
                                                    <option value="YEARLY">Yearly</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="text-sm font-medium">Start Date</label>
                                                <input type="date" name="startDate" defaultValue={editingGoal?.startDate} className="p-2 border rounded w-full" required />
                                            </div>
                                            <div>
                                                <label className="text-sm font-medium">End Date</label>
                                                <input type="date" name="endDate" defaultValue={editingGoal?.endDate} className="p-2 border rounded w-full" required />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Admin Feedback</label>
                                            <textarea name="adminFeedback" defaultValue={editingGoal?.adminFeedback} placeholder="Feedback from Admin..." className="w-full p-2 border rounded" />
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="text-sm font-medium">Progress (%)</label>
                                    <input
                                        type="number"
                                        name="progress"
                                        defaultValue={editingGoal?.progressPercentage}
                                        min="0" max="100"
                                        className="w-full p-2 border rounded"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <select
                                        name="status"
                                        defaultValue={editingGoal?.status}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="PENDING">Pending</option>
                                        <option value="IN_PROGRESS">In Progress</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="MISSED">Missed</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full">Update Goal</Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                <TabsContent value="reviews">
                    <div className="flex justify-end">
                        {targetUserId !== 'ALL' && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button><Plus className="mr-2 h-4 w-4" /> {isHrOrAdmin ? 'Add Review' : 'Add Self-Review'}</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>{isHrOrAdmin ? 'Add Performance Review' : 'Add Self-Review'}</DialogTitle>
                                    </DialogHeader>
                                    <form onSubmit={handleAddReview} className="space-y-4">
                                        <input name="cycle" placeholder="Cycle (e.g. 2024-Q1)" className="w-full p-2 border rounded" required />
                                        <div>
                                            <label className="text-sm">Rating (1-5)</label>
                                            <input type="number" step="0.1" min="1" max="5" name="rating" className="w-full p-2 border rounded" required />
                                        </div>
                                        <textarea name="feedback" placeholder="Feedback / Comments" className="w-full p-2 border rounded min-h-[100px]" required />
                                        <textarea name="improvementAreas" placeholder="Areas for Improvement / Goals" className="w-full p-2 border rounded min-h-[80px]" required />
                                        <Button type="submit" className="w-full">Submit Review</Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>
                    <div className="space-y-4">
                        {reviews.length === 0 ? (
                            <p className="text-muted-foreground text-center py-10">No reviews found.</p>
                        ) : reviews.map(review => (
                            <Card key={review.id} className="overflow-hidden relative group">
                                <div className={`h-2 w-full ${review.rating >= 4 ? 'bg-green-500' : review.rating >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} />
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            {targetUserId === 'ALL' && review.user && (
                                                <div className="text-lg font-bold text-primary mb-1">
                                                    Employee: {review.user.username}
                                                </div>
                                            )}
                                            <CardTitle className="text-base font-medium text-muted-foreground">Performance Review - {review.cycle}</CardTitle>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-2 bg-secondary/30 px-3 py-1 rounded-full">
                                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                                <span className="text-xl font-bold">{review.rating}</span>
                                                <span className="text-xs text-muted-foreground">/ 5.0</span>
                                            </div>
                                            {isHrOrAdmin && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-2"
                                                    onClick={() => handleDeleteReview(review.id)}
                                                    title="Delete Review"
                                                >
                                                    <Trash2 className="h-5 w-5" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground mt-2">
                                        Reviewed on {new Date(review.reviewDate).toLocaleDateString()}
                                        {review.reviewer && <span> by <span className="font-semibold">{review.reviewer.username}</span></span>}
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-4 mt-2">
                                        <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-green-500">
                                            <h4 className="font-semibold mb-2 text-green-700 text-sm">Feedback & Strengths</h4>
                                            <p className="text-sm leading-relaxed whitespace-pre-line">{review.feedback}</p>
                                        </div>
                                        <div className="p-4 bg-muted/30 rounded-lg border-l-4 border-amber-500">
                                            <h4 className="font-semibold mb-2 text-amber-700 text-sm">Areas for Improvement</h4>
                                            <p className="text-sm leading-relaxed whitespace-pre-line">{review.improvementAreas}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default PerformancePage;
