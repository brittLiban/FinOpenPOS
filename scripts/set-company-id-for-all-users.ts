// Script to set company_id for all users in Supabase
import { createAdminClient } from '../src/lib/supabase/service';
import { setCompanyIdForUser } from '../src/lib/supabase/setCompanyId';

const COMPANY_ID = '00000000-0000-0000-0000-000000000000'; // Replace with your actual company UUID

async function main() {
  const supabaseAdmin = createAdminClient();
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) throw error;
  for (const user of users) {
    if (!user.user_metadata?.company_id) {
      try {
        await setCompanyIdForUser(user.id, COMPANY_ID);
        console.log(`Set company_id for user ${user.email}`);
      } catch (err) {
        console.error(`Failed to set company_id for user ${user.email}:`, err);
      }
    } else {
      console.log(`User ${user.email} already has company_id: ${user.user_metadata.company_id}`);
    }
  }
  console.log('Done.');
}

main().catch(console.error);
