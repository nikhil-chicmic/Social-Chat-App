# Supabase Fixes for SocialHub

This doc explains how to fix the two errors you may see: **Signup RLS error** and **Google Login "Unacceptable audience"**.

---

## 1. Signup Error: "new row violates row-level security policy for table 'users'"

**Cause:** Row Level Security (RLS) is enabled on the `users` table but there is no policy allowing inserts when a new user signs up.

**Fix:** Add RLS policies so authenticated users can insert/update their own row and read profiles.

### Steps

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor**.
3. Run the migration script:

**Option A – Run the migration file**

- Open `supabase/migrations/20250305000000_rls_users.sql` in this repo.
- Copy its contents into the SQL Editor and run it.

**Option B – Run this SQL directly**

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own row"
ON public.users FOR INSERT TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read all profiles"
ON public.users FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users can update own row"
ON public.users FOR UPDATE TO authenticated
USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
```

If you see "policy already exists", delete the old policy in **Table Editor → users → RLS** and run again, or change the policy name in the script.

After this, signup and the first insert into `users` should work.

---

## 2. Google Login: "Unacceptable audience in id_token"

**Cause:** Supabase expects the Google id_token to be for a specific **Client ID**. The audience in the token (from your app) does not match the Client ID configured in Supabase.

Your app uses the **Web client ID** for `signInWithIdToken` (from `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`). Supabase must use the same Web client ID.

**Fix:** Set the Google provider in Supabase to use your **Web application** client ID and secret from Google Cloud Console.

### Steps

1. **Google Cloud Console**
   - Go to [Google Cloud Console](https://console.cloud.google.com/) → your project → **APIs & Services** → **Credentials**.
   - Open the **Web application** OAuth 2.0 client (the one whose Client ID matches `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, e.g. `...-slt7uvrr1j5g13ru965a80hk1irfg7be.apps.googleusercontent.com`).
   - Copy the **Client ID** and **Client secret**.

2. **Supabase Dashboard**
   - Go to **Authentication** → **Providers** → **Google**.
   - Enable Google.
   - Paste the **Web application** Client ID into **Client ID**.
   - Paste the **Web application** Client secret into **Client Secret**.
   - Save.

3. **App**
   - Keep using the Web client ID in the app (e.g. `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` for `webClientId` in `GoogleSignin.configure`). Do **not** use the Android or iOS client ID here for the token you send to Supabase.

After this, the id_token audience will match Supabase and Google sign-in should work.

---

## Summary

| Issue | Fix |
|-------|-----|
| Signup RLS on `users` | Run the RLS migration in SQL Editor (policies for INSERT/SELECT/UPDATE on `users`). |
| Google "Unacceptable audience" | In Supabase → Auth → Google, set Client ID and Secret to the **Web application** credentials from Google Cloud. |
