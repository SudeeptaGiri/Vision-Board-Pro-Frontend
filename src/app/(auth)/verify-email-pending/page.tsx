'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Target, Mail, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

// Loading fallback for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-bg dark:bg-warm-text p-4">
      <div className="w-full max-w-md text-center">
        <Loader2 className="w-10 h-10 animate-spin text-terracotta mx-auto" />
        <p className="mt-4 text-warm-muted dark:text-warm-border">Loading...</p>
      </div>
    </div>
  );
}

// Wrapped component that uses useSearchParams
function VerifyEmailPendingContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResendVerification = async () => {
    if (!email) {
      setError('Email address not found. Please try registering again.');
      return;
    }

    setIsResending(true);
    setError('');
    setResendSuccess(false);

    try {
      await api.post('/auth/resend-verification', { email });
      setResendSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

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
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-terracotta/10 flex items-center justify-center">
            <Mail className="w-10 h-10 text-terracotta" />
          </div>

          <h1 className="text-2xl font-bold text-warm-text dark:text-warm-bg mb-3">
            Check Your Email
          </h1>
          
          <p className="text-warm-muted dark:text-warm-border mb-2">
            We&apos;ve sent a verification link to:
          </p>
          
          {email && (
            <p className="font-medium text-warm-text dark:text-warm-bg mb-6">
              {email}
            </p>
          )}

          <div className="bg-warm-bg dark:bg-warm-text/10 rounded-xl p-4 mb-6">
            <p className="text-sm text-warm-muted dark:text-warm-border">
              <span className="font-semibold">📧 Can&apos;t find the email?</span>
              <br />
              Check your <span className="font-medium text-terracotta">spam</span> or{' '}
              <span className="font-medium text-terracotta">junk</span> folder.
            </p>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm mb-4">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="p-4 rounded-xl bg-sage/10 text-sage dark:text-sage-light text-sm mb-4 flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Verification email resent successfully!
            </div>
          )}

          <Button
            onClick={handleResendVerification}
            disabled={isResending || !email}
            variant="outline"
            className="w-full mb-4 border-warm-border hover:bg-warm-hover"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Resend Verification Email
              </>
            )}
          </Button>

          <Link href="/login">
            <Button variant="ghost" className="w-full text-terracotta hover:text-terracotta/80">
              Back to Login
            </Button>
          </Link>
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

// Default export with Suspense boundary
export default function VerifyEmailPendingPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VerifyEmailPendingContent />
    </Suspense>
  );
}
