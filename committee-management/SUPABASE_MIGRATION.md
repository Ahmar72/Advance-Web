# Supabase Migration Steps

Use this when your Supabase database already has the base tables and you only need the newer committee workflow changes.

## Option 1: Existing database
1. Open the Supabase dashboard.
2. Go to **SQL Editor**.
3. Run `supabase/migrations/20260510_committee_workflow_updates.sql`.
4. Verify these changes are present:
   - `committee_members.approval_status`
   - `notifications.type` accepts `join_request` and `join_request_response`
   - creator delete policy uses `creator_id = auth.uid()`
   - updated views count only approved members

## Option 2: Fresh database
1. Open the Supabase dashboard.
2. Go to **SQL Editor**.
3. Run `DATABASE_SCHEMA.sql` from top to bottom.
4. If you already have old tables and only want the updates, run the migration file above instead.

## After running SQL
1. Refresh the app.
2. Create a committee.
3. Check **My Committees** and **Discover**.
4. Open a committee detail page and test:
   - add member
   - request join
   - approve/reject request
   - delete as creator only
