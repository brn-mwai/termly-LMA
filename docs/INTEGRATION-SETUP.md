# Termly Integration Setup Guide

Complete setup instructions for all required integrations.

---

## Table of Contents

1. [Supabase (Database)](#1-supabase-database)
2. [Clerk (Authentication)](#2-clerk-authentication)
3. [Anthropic Claude (AI)](#3-anthropic-claude-ai)
4. [Tableau (Analytics)](#4-tableau-analytics)
5. [Environment Variables Summary](#5-environment-variables-summary)
6. [Verification Checklist](#6-verification-checklist)

---

## 1. Supabase (Database)

Supabase provides the PostgreSQL database and file storage for Termly.

### Step 1.1: Create Supabase Account & Project

1. Go to **[supabase.com](https://supabase.com)**
2. Click **"Start your project"** and sign up (GitHub recommended)
3. Click **"New Project"**
4. Fill in:
   - **Name**: `termly` (or your preference)
   - **Database Password**: Generate a strong password (save this!)
   - **Region**: Choose closest to your users
5. Click **"Create new project"**
6. Wait 2-3 minutes for provisioning

### Step 1.2: Run Database Migration

1. In Supabase Dashboard, go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open `supabase/migrations/001_initial_schema.sql` from the Termly codebase
4. Copy the entire contents and paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. Verify: You should see "Success" and 11 tables created:
   - organizations, users, borrowers, loans, documents
   - covenants, financial_periods, covenant_tests
   - alerts, memos, audit_logs

### Step 1.3: Configure Storage Bucket

1. Go to **Storage** (left sidebar)
2. Click **"New Bucket"**
3. Name: `documents`
4. **Public bucket**: OFF (keep private)
5. Click **"Create bucket"**

### Step 1.4: Get API Credentials

1. Go to **Project Settings** (gear icon, bottom left)
2. Click **API** in the sidebar
3. Copy these values:

| Setting | Where to Find | Environment Variable |
|---------|---------------|---------------------|
| Project URL | Under "Project URL" | `NEXT_PUBLIC_SUPABASE_URL` |
| anon public | Under "Project API keys" | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| service_role | Under "Project API keys" (click reveal) | `SUPABASE_SERVICE_ROLE_KEY` |

> **Security**: Never expose `service_role` key in client-side code!

### Step 1.5: Enable Row Level Security (RLS)

The migration already enables RLS. Verify by:
1. Go to **Table Editor**
2. Click any table
3. Check that "RLS Enabled" badge appears

---

## 2. Clerk (Authentication)

Clerk handles user authentication, sessions, and user management.

### Step 2.1: Create Clerk Account & Application

1. Go to **[dashboard.clerk.com](https://dashboard.clerk.com)**
2. Sign up with email or GitHub
3. Click **"Create application"**
4. Fill in:
   - **Application name**: `Termly`
   - **Sign-in options**: Enable Email, Google (recommended)
5. Click **"Create application"**

### Step 2.2: Get API Keys

1. In your Clerk app dashboard, go to **Configure** → **API Keys**
2. Copy these values:

| Key | Environment Variable |
|-----|---------------------|
| Publishable key (starts with `pk_`) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` |
| Secret key (starts with `sk_`) | `CLERK_SECRET_KEY` |

### Step 2.3: Configure Webhook (Critical for User Sync)

The webhook syncs Clerk users to Supabase when they sign up.

**For Local Development:**

1. Install ngrok: `npm install -g ngrok` or download from [ngrok.com](https://ngrok.com)
2. Start ngrok tunnel: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

**Create Webhook in Clerk:**

1. In Clerk dashboard, go to **Configure** → **Webhooks**
2. Click **"Add Endpoint"**
3. Fill in:
   - **Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`
     - Local: `https://abc123.ngrok.io/api/webhooks/clerk`
   - **Subscribe to events**:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
4. Click **"Create"**
5. Copy the **Signing Secret** (starts with `whsec_`)

| Key | Environment Variable |
|-----|---------------------|
| Signing Secret | `CLERK_WEBHOOK_SECRET` |

### Step 2.4: Configure Redirect URLs

In Clerk dashboard, go to **Configure** → **Paths**:

| Setting | Value |
|---------|-------|
| Sign-in URL | `/sign-in` |
| Sign-up URL | `/sign-up` |
| After sign-in URL | `/dashboard` |
| After sign-up URL | `/dashboard` |

---

## 3. Anthropic Claude (AI)

Claude powers document extraction, AI chat, and memo generation.

### Step 3.1: Create Anthropic Account

1. Go to **[console.anthropic.com](https://console.anthropic.com)**
2. Click **"Sign up"** and create account
3. Verify your email

### Step 3.2: Add Payment Method

1. In Console, go to **Settings** → **Billing**
2. Click **"Add payment method"**
3. Add credit card (required for API access)
4. Optionally set usage limits

### Step 3.3: Generate API Key

1. Go to **Settings** → **API Keys**
2. Click **"Create Key"**
3. Name: `Termly Production` (or your preference)
4. Copy the key (starts with `sk-ant-api03-`)

| Key | Environment Variable |
|-----|---------------------|
| API Key | `ANTHROPIC_API_KEY` |

> **Security**: API keys are shown only once. Store securely!

### Step 3.4: Verify API Access

Test your key with curl:

```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}'
```

### Models Used by Termly

| Feature | Model | Purpose |
|---------|-------|---------|
| Document Extraction | `claude-sonnet-4-20250514` | Extract covenants, financials from documents |
| AI Chat | `claude-sonnet-4-20250514` | Answer user questions about loans |
| Memo Generation | `claude-sonnet-4-20250514` | Generate analysis memos |

---

## 4. Tableau (Analytics)

Tableau provides embedded analytics dashboards.

### Step 4.1: Tableau Cloud Setup

If you don't have Tableau Cloud:
1. Go to **[tableau.com/trial](https://www.tableau.com/products/trial)**
2. Start a free trial
3. Complete account setup

### Step 4.2: Find Your Server URL & Site ID

1. Log into Tableau Cloud at **[online.tableau.com](https://online.tableau.com)**
2. Look at your browser URL:
   ```
   https://us-west-2b.online.tableau.com/#/site/yoursite/home
   ```
   - **Server URL**: `https://us-west-2b.online.tableau.com` (the part before `/#/`)
   - **Site ID**: `yoursite` (the part after `/site/`)

3. Or go to **Settings** → **Site**:
   - Find **Site Content URL** = your Site ID

### Step 4.3: Create Connected App

1. In Tableau Cloud, go to **Settings** (gear icon)
2. Click **Connected Apps** (left sidebar)
3. Click **New Connected App** → **Direct Trust**
4. Fill in:
   - **Name**: `Termly Integration`
   - **Applies to**: `All projects` (or specific project)
   - **Domain allowlist**: Add your domains:
     - `localhost:3000` (development)
     - `your-production-domain.com`
5. Click **Create**

### Step 4.4: Enable and Get Credentials

1. On the Connected Apps list, find your new app
2. Click the **⋯** menu → **Enable**
3. Click on your app name to open details
4. Copy the **Client ID** (displayed at top)

### Step 4.5: Generate Secret

1. On the app details page, click **Generate New Secret**
2. Copy both values:
   - **Secret ID**: UUID format
   - **Secret Value**: Long string (shown only once!)

| Setting | Environment Variable |
|---------|---------------------|
| Server URL | `TABLEAU_SERVER_URL` |
| Site Content URL | `TABLEAU_SITE_ID` |
| Client ID | `TABLEAU_TOKEN_NAME` |
| Secret Value | `TABLEAU_TOKEN_SECRET` |

### Step 4.6: Create Dashboards in Tableau

Create workbooks with these view paths (or update `src/lib/tableau/config.ts`):

| Dashboard | Path in Tableau |
|-----------|-----------------|
| Portfolio Overview | `TermlyDashboards/PortfolioOverview` |
| Covenant Monitor | `TermlyDashboards/CovenantMonitor` |
| Loan Detail | `TermlyDashboards/LoanDetail` |
| Risk Heatmap | `TermlyDashboards/RiskHeatmap` |

**To create a workbook:**
1. In Tableau Cloud, click **New** → **Workbook**
2. Connect to your data source
3. Build your visualization
4. **Save** with the correct path

---

## 5. Environment Variables Summary

Create/update `.env.local` in the project root:

```env
# ============================================================
# SUPABASE
# ============================================================
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================================
# CLERK
# ============================================================
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx

# Redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# ============================================================
# ANTHROPIC
# ============================================================
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# ============================================================
# TABLEAU
# ============================================================
TABLEAU_SERVER_URL=https://us-west-2b.online.tableau.com
TABLEAU_SITE_ID=your-site-content-url
TABLEAU_TOKEN_NAME=your-connected-app-client-id
TABLEAU_TOKEN_SECRET=your-connected-app-secret
```

---

## 6. Verification Checklist

After setting up all integrations, verify each one:

### Supabase
- [ ] Project created at supabase.com
- [ ] Migration SQL executed successfully
- [ ] 11 tables visible in Table Editor
- [ ] `documents` storage bucket created
- [ ] Environment variables added

### Clerk
- [ ] Application created at dashboard.clerk.com
- [ ] API keys copied to `.env.local`
- [ ] Webhook endpoint created with correct URL
- [ ] Subscribed to user.created, user.updated, user.deleted
- [ ] Webhook signing secret copied

### Anthropic
- [ ] Account created at console.anthropic.com
- [ ] Payment method added
- [ ] API key generated and copied
- [ ] Test API call successful

### Tableau
- [ ] Connected App created with Direct Trust
- [ ] App enabled (not disabled)
- [ ] Client ID copied
- [ ] Secret generated and copied
- [ ] Dashboards created in Tableau

### Final Steps
- [ ] All environment variables in `.env.local`
- [ ] Restart dev server: `npm run dev`
- [ ] Test sign-up flow
- [ ] Verify user created in Supabase `users` table
- [ ] Test dashboard navigation

---

## Troubleshooting

### Clerk: "Publishable key not valid"
- Ensure key starts with `pk_test_` or `pk_live_`
- Check for extra spaces or characters
- Verify key matches your Clerk application

### Supabase: "Invalid API key"
- Ensure URL matches your project (check for typos)
- Verify anon key is the "anon public" key, not service_role
- Check project hasn't been paused (free tier pauses after inactivity)

### Anthropic: "Authentication error"
- Verify API key starts with `sk-ant-api03-`
- Check payment method is valid
- Ensure account isn't rate-limited

### Tableau: "Failed to load dashboard"
- Verify Connected App is enabled (not disabled)
- Check Server URL format (no trailing slash)
- Confirm Site ID is the content URL, not full URL
- Ensure dashboard paths match exactly

---

## Support Links

- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Clerk**: [clerk.com/docs](https://clerk.com/docs)
- **Anthropic**: [docs.anthropic.com](https://docs.anthropic.com)
- **Tableau**: [help.tableau.com](https://help.tableau.com/current/api/embedding_api/en-us/index.html)
