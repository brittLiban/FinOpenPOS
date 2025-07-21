import { setCompanyIdForUser } from '../src/lib/supabase/setCompanyId';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });


async function main() {
  const userId = 'e6be7885-941d-4423-9f3b-24595409570d'; // The user's UUID
  const companyId = '00000000-0000-0000-0000-000000000000'; // Your company UUID

  await setCompanyIdForUser(userId, companyId);
  console.log('company_id set for user:', userId);
}

main().catch(console.error);
