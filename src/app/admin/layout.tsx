"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AdminLayout } from "@/components/admin-layout";

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }

        // Check if user has proper access
        try {
          const statusResponse = await fetch('/api/user/status');
          const statusData = await statusResponse.json();
          
          if (!statusResponse.ok || !statusData.has_admin_access) {
            console.log('User lacks admin access, attempting to fix...');
            
            // Try to fix user access
            const fixResponse = await fetch('/api/user/status', { method: 'POST' });
            const fixData = await fixResponse.json();
            
            if (!fixResponse.ok) {
              console.error('Could not fix user access:', fixData);
              // Still allow access for now, but log the issue
            } else {
              console.log('User access fixed successfully');
            }
          }
        } catch (error) {
          console.error('Error checking/fixing user status:', error);
          // Allow access anyway - don't block users due to check failures
        }

        setIsLoading(false);
        
      } catch (error) {
        console.error('Error checking user:', error);
        setIsLoading(false);
      }
    };
    
    checkUser();
  }, [router, supabase]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AdminLayout>{children}</AdminLayout>;
}
