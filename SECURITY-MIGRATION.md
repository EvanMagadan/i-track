# I-Track security migration checklist

The code changes are prepared, but do not deploy the new build until these steps are complete.

## 1. Protect credentials

- In Supabase Dashboard, rotate the service-role key if it was ever deployed, committed, or shared.
- Remove `VITE_SUPABASE_SERVICE_ROLE_KEY`, `VITE_ADMIN_USERNAME`, and `VITE_ADMIN_PASSWORD` from every deployment environment.
- Configure only:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` (server-side deployment only)

## 2. Back up and prepare data

- Export the `clients` table before changing policies.
- Add a real, unique email address to every existing client row.
- Do not put passwords into the `clients` table anymore.

## 3. Create the administrator

In Supabase Dashboard → Authentication → Users, create the administrator’s email/password account.

Copy the user UUID, then run this in the SQL Editor:

```sql
insert into public.app_admins (user_id)
values ('PASTE_ADMIN_AUTH_USER_UUID_HERE')
on conflict (user_id) do nothing;
```

## 4. Apply the database migration

Run [supabase-security-migration.sql](C:\projects\i-track\supabase-security-migration.sql) in the Supabase SQL Editor.

This removes the public client policies and enables authenticated, admin-scoped access. Do not skip this step.

## 5. Configure email behavior

- Decide whether Supabase email confirmation is required.
- Configure the production site URL and redirect URLs in Supabase Auth → URL Configuration.
- Add the deployed site URL and local development URL if needed.

## 6. Deploy and test

Test in this order:

1. Anonymous visitor cannot read `clients`.
2. Admin can sign in with Supabase Auth.
3. Admin can create a client with an email address.
4. Admin can edit and delete a client.
5. A client can register only with the matching name, email, and phone.
6. A client can sign in only after Supabase Auth registration/confirmation.
7. A client can read only their own record.
8. A client cannot update or delete any record.
9. Signing out removes access after refresh.

## 7. Supabase inactivity

The Free Plan may pause low-activity projects. A few genuine application requests may count as activity, but there is no guaranteed keepalive workaround. Upgrade to Pro if the project must remain continuously available.

