import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import type { Payroll } from '@/types';

const PayrollPage: React.FC = () => {
  const { user } = useAuth();
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayroll = async () => {
      try {
        const data = await apiService.getPayroll(user?.id || '');
        setPayroll(data);
      } catch (error) {
        console.error('Failed to fetch payroll:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayroll();
  }, [user]);

  const latestPayroll = payroll[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payroll</h1>
        <p className="text-muted-foreground">View your salary and payment details</p>
      </div>

      {latestPayroll && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <Card className="glass-card shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
              <DollarSign className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${latestPayroll.netSalary.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">{latestPayroll.month} {latestPayroll.year}</p>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Base Salary</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${latestPayroll.baseSalary.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Deductions</CardTitle>
              <TrendingDown className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${latestPayroll.deductions.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="glass-card shadow-elegant">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Attendance Days</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestPayroll.attendanceDays}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="glass-card shadow-elegant">
        <CardHeader>
          <CardTitle>Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payroll.map((record) => (
              <div key={record.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div>
                  <p className="font-medium">{record.month} {record.year}</p>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollPage;
