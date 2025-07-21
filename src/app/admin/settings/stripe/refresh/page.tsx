"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function StripeOnboardingRefresh() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🔄</div>
        <h1 className="text-3xl font-bold text-blue-600 mb-4">Setup Refreshed</h1>
        <p className="text-lg text-gray-700 mb-6">
          Something went wrong with the onboarding process. Let's try again.
        </p>
        <div className="space-y-3">
          <Button 
            onClick={() => router.push('/admin/settings/stripe')}
            className="w-full"
          >
            Try Again
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/admin')}
            className="w-full"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
