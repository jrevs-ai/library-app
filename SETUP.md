# The Library — Setup Guide

This gets your personal book catalogue live on the web, accessible from any device, with real cross-device sync, for $0/month. End-to-end time: **~20 minutes**.

You will do four things:
1. Create a free Supabase account (the database) — 5 min
2. Create a free GitHub account if you don't have one, and upload the project — 5 min
3. Create a free Vercel account (the hosting) and deploy — 5 min
4. Tell Vercel your Supabase credentials — 2 min

After that, your library lives at a URL like `the-library.vercel.app`. You can bookmark it on your phone and it works like any website.

---

## Part 1 — Supabase (the database)

1. Go to [supabase.com](https://supabase.com) and click **Start your project**.

2. Sign up with GitHub or email. Free tier is fine — it includes 500MB of database, which is about 10 million books. You'll use a fraction of a percent.

3. Click **New project**. Give it any name (e.g., "library"). Pick any region close to you (e.g., Sydney). Set a database password and **save it somewhere** — you won't need it for this setup, but you'll want it if you ever log into the database directly. Click **Create new project** and wait ~1-2 minutes while it provisions.

4. Once ready, click the **SQL Editor** icon in the left sidebar (looks like `</>`).

5. Click **New query**. Open the file `seed.sql` from the project folder, copy its entire contents, and paste into the SQL editor. Click **Run** (bottom right, or Cmd+Enter). You'll see "Success. No rows returned" or similar — that's good, it means 319 books were loaded.

6. Verify: click **Table Editor** in the sidebar → click the `books` table. You should see all your books listed.

7. Get your credentials: click the **gear/settings** icon at the bottom left → **API**. You'll see two things you need:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon / public key** (a long string starting with `eyJ...`)
   
   **Keep this tab open** — you'll paste these into Vercel in Part 3.

**✅ Database done.**

---

## Part 2 — GitHub (where your code lives)

1. Go to [github.com](https://github.com) and sign up if you haven't. Free.

2. Click the **+** icon top right → **New repository**. Name it `library-app`. Keep it Public or Private (either works). Don't add a README. Click **Create repository**.

3. You now need to upload the project folder. The easiest way if you're non-technical is:
   - On the repo page, click **uploading an existing file** (it's a link in the middle of the screen).
   - Drag and drop the **contents of the `library-app` folder** (all the files) into the browser. **Not the folder itself — open the folder and drag the files inside.**
   - Scroll down, click **Commit changes**.

**✅ Code is on GitHub.**

---

## Part 3 — Vercel (the hosting)

1. Go to [vercel.com](https://vercel.com) and sign up with your GitHub account (it makes the next step automatic).

2. On the dashboard, click **Add New** → **Project**.

3. You'll see your GitHub repos listed. Find `library-app` and click **Import**.

4. **Important: before you click Deploy**, scroll down to the **Environment Variables** section and add these two:
   
   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | (paste the Project URL from Supabase) |
   | `VITE_SUPABASE_ANON_KEY` | (paste the anon public key from Supabase) |

5. Click **Deploy**. Wait about 60 seconds.

6. When it's done, Vercel will show a preview screenshot and a URL. Click it. **Your library is live.**

**✅ Fully deployed.** Bookmark the URL on your phone.

---

## Using the app

- **Add a book**: click **Add Book**, fill it in, save. It syncs across every device immediately.
- **Delete a book**: hover (or long-press on mobile) over a row and click the trash icon.
- **Search, filter, sort**: all on the main screen.
- **Export**: downloads a CSV anytime.
- **Stats**: shows category breakdown and most-represented authors.

## Making changes later

If you want to change the design, add features, etc. — edit the files on GitHub (you can do this in the web browser, no need for a local dev setup), and Vercel will redeploy automatically within 30 seconds. Every change produces a new version.

## Costs

$0/month for your scale. All three services (Supabase, GitHub, Vercel) have generous free tiers that you won't come close to hitting with a personal book catalogue.

## If something goes wrong

The most common issue is forgetting the environment variables in Vercel. If the app loads but shows "Could not load library" — that's almost certainly what happened. Go to your Vercel project → Settings → Environment Variables → confirm both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set. Then go to the Deployments tab and click the three dots next to the latest deployment → **Redeploy**.
