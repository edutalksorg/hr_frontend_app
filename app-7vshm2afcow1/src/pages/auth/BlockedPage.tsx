import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

const BlockedPage: React.FC = () => {
    const { logout, user } = useAuth();

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full space-y-6 text-center p-8 border rounded-lg shadow-lg bg-card">
                <div className="flex justify-center">
                    <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 dark:text-red-400">
                        <Lock className="h-12 w-12" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-foreground">Account Blocked</h1>

                <div className="text-muted-foreground space-y-2">
                    <p>
                        Dear <span className="font-semibold text-foreground">{user?.username || 'User'}</span>,
                    </p>
                    <p>
                        Your account has been temporarily suspended by the administrator.
                    </p>
                    <p className="font-medium text-foreground py-2 border-y border-border/50 my-4">
                        "Please contact your Admin or Manager to restore access."
                    </p>
                </div>

                <div className="pt-4">
                    <Button variant="outline" onClick={logout} className="w-full">
                        Logout
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BlockedPage;
