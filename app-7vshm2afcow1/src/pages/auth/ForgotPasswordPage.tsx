import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from 'sonner';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await apiService.forgotPassword(email);
            setSuccess(true);
            toast.success('Password reset link sent to your email');
        } catch (error) {
            console.error('Failed to send reset email:', error);
            toast.error('Failed to send reset email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md glass-card shadow-elegant">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex items-center text-4xl font-bold tracking-tight">
                            <span className="text-red-600">Edu</span>
                            <span className="text-black">Talks</span>
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold">Forgot Password</CardTitle>
                    <CardDescription>Enter your email to receive a reset link</CardDescription>
                </CardHeader>
                <CardContent>
                    {success ? (
                        <div className="text-center space-y-4">
                            <div className="flex justify-center">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            </div>
                            <p className="text-muted-foreground">
                                If an account exists for <strong>{email}</strong>, you will receive an email with instructions to reset your password.
                            </p>
                            <Button asChild className="w-full mt-4">
                                <Link to="/login">Back to Login</Link>
                            </Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="your.email@company.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="pl-10"
                                        required
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Sending Link...' : 'Send Reset Link'}
                            </Button>
                            <div className="text-center mt-4">
                                <Link to="/login" className="text-sm text-primary hover:underline flex items-center justify-center gap-1">
                                    <ArrowLeft className="h-4 w-4" /> Back to Login
                                </Link>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ForgotPasswordPage;
