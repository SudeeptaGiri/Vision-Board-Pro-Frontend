'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Loader2, Mail, Lock, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, resendVerification } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setRequiresVerification(false);
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: any) {
      const errorData = err.response?.data;
      if (errorData?.requiresVerification) {
        setRequiresVerification(true);
        setError(errorData.error || 'Please verify your email before logging in');
      } else {
        setError(errorData?.error || 'Login failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerification(email);
      router.push(`/verify-email-pending?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend verification email');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-warm-bg dark:bg-warm-text">
      {/* Mobile Header */}
      <div className="lg:hidden gradient-bg p-6 text-white text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold">VisionBoard Pro</span>
        </div>
        <p className="text-sm opacity-90">Turn dreams into reality</p>
      </div>

      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8">
          {/* Logo - Hidden on mobile (shown in header) */}
          <div className="text-center hidden lg:block">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="w-12 h-12 rounded-xl bg-terracotta flex items-center justify-center shadow-terracotta">
                <Target className="w-7 h-7 text-white" />
              </div>
              <span className="text-2xl font-bold text-terracotta">VisionBoard Pro</span>
            </Link>
          </div>

          {/* Form */}
          <div className="space-y-4 sm:space-y-6">
            <div className="text-center">
              <h1 className="text-2xl sm:text-3xl font-bold text-warm-text dark:text-warm-bg">Welcome back</h1>
              <p className="text-sm sm:text-base text-warm-muted dark:text-warm-border mt-2">Sign in to continue your journey</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className={`p-4 rounded-xl text-sm ${requiresVerification ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p>{error}</p>
                      {requiresVerification && (
                        <button
                          type="button"
                          onClick={handleResendVerification}
                          className="mt-2 text-terracotta hover:underline font-medium"
                        >
                          Resend verification email →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-terracotta dark:text-terracotta-light hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full gradient-bg hover:opacity-90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-warm-muted dark:text-warm-border">
              Don't have an account?{' '}
              <Link href="/register" className="text-terracotta dark:text-terracotta-light hover:underline font-medium">
                Sign up for free
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image/Gradient */}
      <div className="hidden lg:flex flex-1 gradient-bg items-center justify-center p-12">
        <div className="text-white text-center max-w-md">
          <h2 className="text-4xl font-bold mb-4">Turn Dreams Into Reality</h2>
          <p className="text-xl opacity-90">
            AI-powered goal planning that breaks down your biggest dreams into achievable daily actions.
          </p>
        </div>
      </div>
    </div>
  );
}