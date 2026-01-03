import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/services/api';
import { Button } from '@/components/ui/button';

const AdminPageDebug: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [debugInfo, setDebugInfo] = useState<any>({});
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const runDiagnostics = async () => {
            const info: any = {
                timestamp: new Date().toISOString(),
                currentUser: currentUser,
                userRole: currentUser?.role,
                isAdmin: currentUser?.role?.toLowerCase() === 'admin',
                apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
                token: localStorage.getItem('token') ? 'exists' : 'missing',
            };

            try {
                console.log('🔍 Running diagnostics...');

                // Test 1: Check if we can fetch users
                try {
                    console.log('Test 1: Fetching users...');
                    const users = await apiService.getAllUsers();
                    info.usersTest = { success: true, count: users.length, users: users };
                } catch (e: any) {
                    info.usersTest = { success: false, error: e.message, response: e.response };
                }

                // Test 2: Check if we can fetch attendance
                try {
                    console.log('Test 2: Fetching attendance...');
                    const attendance = await apiService.getAllAttendance();
                    info.attendanceTest = { success: true, count: attendance.length };
                } catch (e: any) {
                    info.attendanceTest = { success: false, error: e.message };
                }

                // Test 3: Check route access
                info.routeAccess = {
                    path: window.location.pathname,
                    expectedPath: '/admin/employees',
                    matches: window.location.pathname === '/admin/employees'
                };

                setDebugInfo(info);
                console.log('✅ Diagnostics complete:', info);
            } catch (e: any) {
                setError(e.message || 'Unknown error');
                console.error('❌ Diagnostics failed:', e);
            }
        };

        runDiagnostics();
    }, [currentUser]);

    return (
        <div className="p-8 space-y-6 bg-white rounded-lg shadow-lg">
            <h1 className="text-3xl font-bold text-slate-900">Admin Page Diagnostics</h1>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-800 font-bold">Error: {error}</p>
                </div>
            )}

            <div className="space-y-4">
                <h2 className="text-xl font-bold">Current State</h2>
                <pre className="p-4 bg-slate-100 rounded overflow-auto max-h-96 text-xs">
                    {JSON.stringify(debugInfo, null, 2)}
                </pre>
            </div>

            <div className="space-y-4">
                <h2 className="text-xl font-bold">Test Results</h2>

                {debugInfo.usersTest && (
                    <div className={`p-4 rounded ${debugInfo.usersTest.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className="font-bold">Users API Test: {debugInfo.usersTest.success ? '✅ Success' : '❌ Failed'}</p>
                        {debugInfo.usersTest.error && <p className="text-sm">Error: {debugInfo.usersTest.error}</p>}
                        {debugInfo.usersTest.users && (
                            <p className="text-sm mt-2">Found {debugInfo.usersTest.count} users</p>
                        )}
                    </div>
                )}

                {debugInfo.attendanceTest && (
                    <div className={`p-4 rounded ${debugInfo.attendanceTest.success ? 'bg-green-50' : 'bg-red-50'}`}>
                        <p className="font-bold">Attendance API Test: {debugInfo.attendanceTest.success ? '✅ Success' : '❌ Failed'}</p>
                        {debugInfo.attendanceTest.error && <p className="text-sm">Error: {debugInfo.attendanceTest.error}</p>}
                    </div>
                )}
            </div>

            <Button
                onClick={() => window.location.reload()}
                className="mt-4"
            >
                Reload Page
            </Button>
        </div>
    );
};

export default AdminPageDebug;
