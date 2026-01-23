import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Palmtree, Plus, Trash2 } from 'lucide-react';
import type { Holiday } from '@/types';

const HolidaysPage: React.FC = () => {
  const { user } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const data = await apiService.getHolidays();
        setHolidays(data);
      } catch (error) {
        console.error('Failed to fetch holidays:', error);
      }
    };

    fetchHolidays();
  }, []);

  const holidayDates = holidays.map(h => new Date(h.date));

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newHoliday, setNewHoliday] = useState({ name: '', date: '', description: '' });

  const handleCreateHoliday = async () => {
    try {
      await apiService.createHoliday(newHoliday as any);
      const data = await apiService.getHolidays();
      setHolidays(data);
      setIsAddDialogOpen(false);
      setNewHoliday({ name: '', date: '', description: '' });
    } catch (error) {
      console.error('Failed to create holiday:', error);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Are you sure you want to delete this holiday?')) return;
    try {
      await apiService.deleteHoliday(id);
      setHolidays(holidays.filter(h => h.id !== id));
    } catch (error) {
      console.error('Failed to delete holiday:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Holidays</h1>
          <p className="text-muted-foreground">Company holidays and observances</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Holiday
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Holiday</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Holiday Name</Label>
                  <Input
                    id="name"
                    value={newHoliday.name}
                    onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                    placeholder="e.g., New Year's Day"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newHoliday.date}
                    onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    value={newHoliday.description}
                    onChange={(e) => setNewHoliday({ ...newHoliday, description: e.target.value })}
                    placeholder="Brief description"
                  />
                </div>
                <Button onClick={handleCreateHoliday} className="w-full">Create Holiday</Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="glass-card shadow-elegant">
          <CardHeader>
            <CardTitle>Holiday Calendar</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="rounded-md border w-full p-4"
              classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 w-full",
                month: "space-y-4 w-full",
                table: "w-full border-collapse space-y-1",
                head_row: "grid grid-cols-7 w-full",
                head_cell: "text-muted-foreground font-normal text-[0.8rem]",
                row: "grid grid-cols-7 w-full mt-2",
                cell: "relative p-1 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-accent",
                day: "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-9 w-full p-0 font-normal aria-selected:opacity-100",
              }}
              modifiers={{
                holiday: holidayDates
              }}
              modifiersStyles={{
                holiday: {
                  background: 'linear-gradient(180deg, #FEF9C3 0%, #F59E0B 100%)', // Soft Gold to Rich Amber
                  color: '#451A03', // Deepest Brown for maximum readability
                  fontWeight: 'bold',
                  borderRadius: '6px',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.8)', // Gold Glow + Strong Shine
                  border: '1px solid #D97706' // Dark Amber Border
                }
              }}
            />
          </CardContent>
        </Card>

        <Card className="glass-card shadow-elegant">
          <CardHeader>
            <CardTitle>Upcoming Holidays</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holidays.map((holiday) => (
                <div key={holiday.id} className="flex items-center gap-4 p-3 border border-border rounded-lg group">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Palmtree className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{holiday.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(holiday.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    {holiday.description && (
                      <p className="text-xs text-muted-foreground mt-1">{holiday.description}</p>
                    )}
                  </div>
                  {(user?.role === 'admin' || user?.role === 'hr' || user?.role === 'manager') && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteHoliday(holiday.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HolidaysPage;
