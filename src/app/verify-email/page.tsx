'use client';

import { useEffect, useState, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(5);
  const hasVerified = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      // Prevent double verification in React Strict Mode
      if (hasVerified.current) return;
      hasVerified.current = true;

      if (!token) {
        setStatus('error');
        setMessage('No verification token provided');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email?token=${token}`);
        
        // Store the token to auto-login user
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          // Refresh user state in auth context
          await refreshUser();
        }
        
        setStatus('success');
        setMessage(response.data.message || 'Email verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.error || 'Verification failed. The link may be invalid or expired.');
      }
    };

    verifyEmail();
  }, [token, refreshUser]);

  // Countdown and redirect on success
  useEffect(() => {
    if (status === 'success') {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-bg dark:bg-warm-text p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-terracotta flex items-center justify-center shadow-terracotta">
              <Target className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-terracotta">VisionBoard Pro</span>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-warm-card dark:bg-warm-muted/20 rounded-2xl shadow-warm border border-warm-border dark:border-warm-muted p-8 text-center">
          {status === 'loading' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-terracotta/10 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-terracotta animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-warm-text dark:text-warm-bg mb-3">
                Verifying Your Email
              </h1>
              <p className="text-warm-muted dark:text-warm-border">
                Please wait while we verify your email address...
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-sage/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-sage" />
              </div>
              <h1 className="text-2xl font-bold text-warm-text dark:text-warm-bg mb-3">
                Email Verified! 🎉
              </h1>
              <p className="text-warm-muted dark:text-warm-border mb-6">
                {message}
              </p>
              <p className="text-sm text-warm-muted dark:text-warm-border mb-6">
                Redirecting to dashboard in{' '}
                <span className="font-bold text-terracotta">{countdown}</span> seconds...
              </p>
              <Link href="/dashboard">
                <Button className="w-full gradient-bg text-white">
                  Go to Dashboard Now
                </Button>
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                <XCircle className="w-10 h-10 text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-warm-text dark:text-warm-bg mb-3">
                Verification Failed
              </h1>
              <p className="text-warm-muted dark:text-warm-border mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <Link href="/login">
                  <Button className="w-full gradient-bg text-white">
                    Go to Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="w-full border-warm-border hover:bg-warm-hover">
                    Create New Account
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>

        <p className="text-center text-sm text-warm-muted dark:text-warm-border mt-6">
          Need help?{' '}
          <a href="mailto:support@visionboardpro.com" className="text-terracotta hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-warm-bg dark:bg-warm-text">
        <Loader2 className="w-10 h-10 text-terracotta animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
