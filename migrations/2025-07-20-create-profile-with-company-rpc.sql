-- Migration: Create RPC to insert into profiles with company_id check
create or replace function create_profile_with_company(
  p_id uuid,
  p_email text,
  p_company_id uuid
)
returns TABLE(id uuid, email text, company_id uuid) as $$
begin
  if p_company_id is null then
    raise exception 'company_id cannot be null';
  end if;
  insert into profiles(id, email, company_id)
    values (p_id, p_email, p_company_id)
    returning id, email, company_id into id, email, company_id;
  return next;
end;
$$ language plpgsql;
