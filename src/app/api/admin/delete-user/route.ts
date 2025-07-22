import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/service';
import { logAudit } from '@/lib/log-audit';

// This API route uses authentication and must be dynamic
export const dynamic = 'force-dynamic';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Check authentication
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user's profile and company (using correct schema)
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('company_id, email')
      .eq('id', currentUser.id)
      .single();

    console.log('Current user profile from profiles table:', currentProfile);
    console.log('Profile error:', profileError);

    // Also check company_users table for role info
    const { data: currentCompanyUser, error: currentCompanyUserError } = await supabase
      .from('company_users')
      .select('company_id, role')
      .eq('user_id', currentUser.id)
      .single();

    console.log('Current user from company_users table:', currentCompanyUser);
    console.log('Company user error:', currentCompanyUserError);

    // Use either profiles.company_id or company_users.company_id
    const userCompanyId = currentProfile?.company_id || currentCompanyUser?.company_id;
    console.log('User company ID:', userCompanyId);
    console.log('User ID to delete:', userId);
    console.log('Current user ID:', currentUser.id);

    if (!userCompanyId) {
      console.log('Access denied: No company_id found for current user');
      return NextResponse.json({ error: 'Access denied - no company found' }, { status: 403 });
    }

    // Check if trying to delete self
    if (userId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // Get target user details using correct schema
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from('profiles')
      .select('email, company_id')
      .eq('id', userId)
      .single();

    console.log('Target user profile:', targetProfile);
    console.log('Target profile error:', targetProfileError);

    if (targetProfileError || !targetProfile) {
      console.log('User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Verify user belongs to same company
    if (targetProfile.company_id !== userCompanyId) {
      console.log('Company mismatch - Current:', userCompanyId, 'Target:', targetProfile.company_id);
      return NextResponse.json({ error: 'Access denied - different company' }, { status: 403 });
    }

    // Create admin client for operations requiring service role
    const admin = createAdminClient();

    console.log('Starting user deletion for:', targetProfile.email);

    // Step 1: Clean up related data that might prevent deletion
    console.log('Cleaning up user-related data...');

    // Remove from sidebar_permissions (use regular client for RLS-protected tables)
    const { error: sidebarError } = await supabase
      .from('sidebar_permissions')
      .delete()
      .eq('user_id', userId);
    
    if (sidebarError) {
      console.warn('Error removing sidebar permissions:', sidebarError);
    }

    // Remove from user_roles if exists (use admin for tables without RLS)
    const { error: userRoleError } = await admin
      .from('user_roles')
      .delete()
      .eq('user_id', userId);
    
    if (userRoleError) {
      console.warn('Error removing user roles:', userRoleError);
    }

    // Remove from company_users if exists
    const { error: deleteCompanyUserError } = await admin
      .from('company_users')
      .delete()
      .eq('user_id', userId);
    
    if (deleteCompanyUserError) {
      console.warn('Error removing company users:', deleteCompanyUserError);
    }

    // Update any records that reference this user to NULL instead of deleting them
    // This preserves business data while removing the user association

    // Update audit_log entries (set user_id to NULL to preserve audit trail)
    const { error: auditError } = await admin
      .from('audit_log')
      .update({ user_id: null })
      .eq('user_id', userId);
    
    if (auditError) {
      console.warn('Error updating audit log:', auditError);
    }

    // Update employees table (set user_uid to NULL if it references this user)
    const { error: employeeError } = await admin
      .from('employees')
      .update({ user_uid: null })
      .eq('user_uid', userId);
    
    if (employeeError) {
      console.warn('Error updating employees:', employeeError);
    }

    // Update transactions (preserve transaction data but remove user association)
    const { error: transactionError } = await admin
      .from('transactions')
      .update({ user_id: null })
      .eq('user_id', userId);
    
    if (transactionError) {
      console.warn('Error updating transactions:', transactionError);
    }

    // Update orders (preserve order data but remove user association) 
    const { error: orderError } = await admin
      .from('orders')
      .update({ user_id: null })
      .eq('user_id', userId);
    
    if (orderError) {
      console.warn('Error updating orders:', orderError);
    }

    // Step 2: Delete the user profile
    console.log('Deleting user profile...');
    const { error: deleteProfileError } = await admin
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (deleteProfileError) {
      console.error('Error deleting profile:', deleteProfileError);
      return NextResponse.json({ 
        error: `Failed to delete user profile: ${deleteProfileError.message}` 
      }, { status: 500 });
    }

    // Step 3: Delete from Supabase Auth
    console.log('Deleting from Supabase Auth...');
    try {
      const { error: authDeleteError } = await admin.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        console.warn('Auth deletion error:', authDeleteError);
      } else {
        console.log('Successfully deleted from auth');
      }
    } catch (authError: any) {
      console.warn('Could not delete from auth:', authError?.message);
      // This is often expected - the profile deletion is the main thing
    }

    // Audit log for user deletion
    await logAudit({
      userId: currentUser.id,
      actionType: 'delete',
      entityType: 'user',
      entityId: userId,
      companyId: currentProfile?.company_id,
      details: { 
        deletedUser: targetProfile,
        message: 'User and associated data removed'
      }
    });

    console.log('User deletion completed successfully');

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });

  } catch (error: any) {
    console.error('Error in delete user API:', error);
    return NextResponse.json({ 
      error: `Failed to delete user: ${error.message}` 
    }, { status: 500 });
  }
}
