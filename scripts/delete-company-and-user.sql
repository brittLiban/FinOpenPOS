-- COMPLETE COMPANY AND USER DELETION SCRIPT
-- This script safely deletes a user and optionally the entire company if it's the last user
-- 
-- USAGE:
-- 1. Replace 'USER_ID_HERE' with the actual user UUID from Supabase Auth
-- 2. Run in Supabase SQL Editor
--
-- BEHAVIOR:
-- - If user is the LAST user in company: Deletes EVERYTHING (user, company, all data)
-- - If multiple users in company: Deletes only the user, preserves company and transfers data
--
-- ⚠️  WARNING: This is IRREVERSIBLE! Make backups if needed.

DO $$
DECLARE 
    target_user_id UUID := 'USER_ID_HERE'; -- Replace with actual user ID
    target_company_id UUID;
    user_count INTEGER;
BEGIN
    -- Get the user's company
    SELECT company_id INTO target_company_id 
    FROM profiles 
    WHERE id = target_user_id;
    
    IF target_company_id IS NULL THEN
        RAISE EXCEPTION 'User % not found or has no company', target_user_id;
    END IF;
    
    -- Count users in this company
    SELECT COUNT(*) INTO user_count 
    FROM profiles 
    WHERE company_id = target_company_id;
    
    RAISE NOTICE 'Found % users in company %', user_count, target_company_id;
    
    IF user_count = 1 THEN
        RAISE NOTICE 'Deleting EVERYTHING for company %', target_company_id;
        
        -- DELETE ALL COMPANY DATA IN DEPENDENCY ORDER
        
        -- 1. Delete user permissions and roles first (references users and roles)
        DELETE FROM sidebar_permissions WHERE user_id = target_user_id;
        DELETE FROM user_roles WHERE user_id = target_user_id OR company_id = target_company_id;
        RAISE NOTICE 'Deleted user permissions and roles';
        
        -- 2. Delete order_items (references orders and products)
        DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE company_id = target_company_id);
        RAISE NOTICE 'Deleted order items';
        
        -- 3. Delete returns (references orders and products)
        DELETE FROM returns WHERE user_uid = target_user_id;
        RAISE NOTICE 'Deleted returns';
        
        -- 4. Delete processed_sessions (if references company)
        DELETE FROM processed_sessions WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted processed sessions';
        
        -- 5. Delete transactions
        DELETE FROM transactions WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted transactions';
        
        -- 6. Delete orders
        DELETE FROM orders WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted orders';
        
        -- 7. Delete products
        DELETE FROM products WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted products';
        
        -- 8. Delete customers
        DELETE FROM customers WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted customers';
        
        -- 9. Delete employees
        DELETE FROM employees WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted employees';
        
        -- 10. Delete payment methods
        DELETE FROM payment_methods WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted payment methods';
        
        -- 11. Delete company settings
        DELETE FROM settings WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted settings';
        
        -- 12. Delete audit logs
        DELETE FROM audit_log WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted audit logs';
        
        -- 13. Delete company_users
        DELETE FROM company_users WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted company users';
        
        -- 14. Delete roles (prevents foreign key constraint error)
        DELETE FROM roles WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted company roles';
        
        -- 15. Delete all profiles for this company
        DELETE FROM profiles WHERE company_id = target_company_id;
        RAISE NOTICE 'Deleted all profiles';
        
        -- 16. Finally, delete the company itself
        DELETE FROM companies WHERE id = target_company_id;
        RAISE NOTICE 'Deleted company %', target_company_id;
        
        RAISE NOTICE 'SUCCESS: Completely deleted company % and all related data', target_company_id;
        
    ELSE
        RAISE NOTICE 'Multiple users in company. Deleting only user %', target_user_id;
        
        -- Single user deletion (preserve company)
        DECLARE
            transfer_to_user_id UUID;
        BEGIN
            SELECT p.id INTO transfer_to_user_id
            FROM profiles p 
            WHERE p.company_id = target_company_id
            AND p.id != target_user_id 
            LIMIT 1;
            
            -- Transfer ownership of products to another user
            UPDATE products SET user_uid = transfer_to_user_id WHERE user_uid = target_user_id;
            RAISE NOTICE 'Transferred products to user %', transfer_to_user_id;
            
            -- Clean up user-specific data only
            DELETE FROM sidebar_permissions WHERE user_id = target_user_id;
            DELETE FROM user_roles WHERE user_id = target_user_id;
            DELETE FROM company_users WHERE user_id = target_user_id;
            
            -- Update references to preserve data but remove user association
            UPDATE employees SET user_uid = NULL WHERE user_uid = target_user_id;
            UPDATE orders SET user_uid = NULL WHERE user_uid = target_user_id;
            UPDATE returns SET user_uid = NULL WHERE user_uid = target_user_id;
            UPDATE transactions SET user_uid = NULL WHERE user_uid = target_user_id;
            
            -- Delete the user profile
            DELETE FROM profiles WHERE id = target_user_id;
            
            RAISE NOTICE 'Successfully deleted user % (company preserved)', target_user_id;
        END;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during deletion: %', SQLERRM;
        RAISE;
END $$;

-- EXAMPLE USAGE:
-- 1. Get user ID from Supabase Dashboard → Authentication → Users
-- 2. Replace 'USER_ID_HERE' with actual UUID like: '380db0bd-fa7f-48aa-8427-3d77ffa5eedd'
-- 3. Run this script in Supabase SQL Editor
--
-- WHAT GETS DELETED:
-- Last user in company: Everything (company, all data, all users)
-- Multiple users: Only target user (company preserved, data transferred)
--
-- SAFETY FEATURES:
-- ✅ Respects foreign key constraints
-- ✅ Preserves business data when possible
-- ✅ Detailed logging of each step
-- ✅ Error handling with rollback
-- ✅ Automatic data transfer to remaining users
