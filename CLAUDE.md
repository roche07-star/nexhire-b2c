# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NexHire (adam)** — AI-powered resume analysis SaaS platform for Korean job seekers. Analyzes resumes against job descriptions, generates interview guides, and provides career insights using Claude API.

**Homepage**: https://jobizic.vercel.app

## Commands

```bash
# Development
npm run dev              # Start dev server (localhost:3000)
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint

# No test suite configured
```

## Architecture

### Background Job System (NEW - 2026-06-19)

**All analysis features now use background Jobs for better UX:**

1. **User Request** → API creates Job (0.5s)
2. **Job ID returned** → Frontend starts polling
3. **Backend processes** → Updates progress (60-120s)
4. **Completion** → Result auto-displayed

**Architecture:**
```
POST /api/analyze/[feature] → Job creation
POST /api/jobs/[id]/process → Actual processing
GET  /api/jobs/[id]         → Status polling (every 2s)
```

**Database:** `jobs` table in Supabase stores job state, progress, and results.

**Status:** 
- ✅ Interview Guide: 100% complete
- ⏸️ JD/Resume/Rewrite: Pattern set (process.ts needs completion)

**See**: `docs/BACKGROUND_JOB_SYSTEM.md` for implementation details

### Core Data Flow (Updated)

1. **Resume Upload** → `app/api/analyze/route.ts` (Job-based)
   - Creates Job → returns Job ID immediately
   - User uploads resume (PDF/DOCX/HWP) or pastes text
   - Extract text via `lib/extractText.ts` (mammoth for DOCX, Claude Vision for image PDFs)
   - **PII masking** via `lib/maskPII.ts` (emails, phones, names → placeholders)
   - Masked text sent to Claude API for analysis
   - Original PII + analysis result saved to Supabase `analyses` table

2. **JD Matching** → `app/api/analyze/jd/route.ts` (Job-based)
   - Creates Job → returns Job ID immediately
   - Takes analysis result + job description text
   - Claude compares and generates:
     - Fit score (0-100)
     - Company insights
     - Matching points / gaps
     - Recommendation (APPLY/CONSIDER/SKIP)
   - Saved to `jd_analyses` table

3. **Interview Guide** → `app/api/analyze/interview/route.ts` (✅ Job-based, fully working)
   - EXPERT plan only
   - Creates Job → returns Job ID immediately
   - Backend processes with real-time progress updates
   - Combines resume analysis + JD analysis
   - Claude generates structured interview prep guide
   - Saved to `interview_guides` table with 10-day expiry

### Key Modules

**`lib/maskPII.ts`**
- Masks Korean PII before sending to Claude API
- Patterns: emails, phone numbers, 주민등록번호, names
- CRITICAL: Always mask before external API calls

**`lib/extractText.ts`**
- Detects file type by magic bytes
- DOCX → mammoth parser
- PDF → unpdf (text-based) OR Claude Vision OCR (image-based)
- Falls back to Claude Vision when unpdf returns < 100 chars

**`lib/usageLimits.ts`**
- Plan-based monthly limits (FREE/PRO/EXPERT)
- Checked before each API operation
- Stored in Vercel KV (`@vercel/kv`)

**`lib/cache.ts`**
- Cache invalidation helper for Vercel KV
- Pattern-based key deletion

### Authentication

- **NextAuth 5** with Google OAuth (`auth.ts`)
- Managers auto-upgraded to EXPERT plan (via `MANAGER_EMAILS` env var)
- User data synced to Supabase `users` table on sign-in
- Session includes `role: 'MANAGER' | 'USER'` and `plan`

### Database (Supabase)

Main tables:
- `users` — email, plan (FREE/PRO/EXPERT), user_type, credits
- `analyses` — resume analysis results
- `jd_analyses` — JD matching results
- `interview_guides` — interview prep guides (expires_at)
- `coupons` — feature-based credits (resume/jd/interview)

Access via `lib/supabase.ts` using service role key (full access).

### AI Integration

All analysis uses **Anthropic Claude API** (`@anthropic-ai/sdk`):
- Model: `claude-haiku-4-5-20251001` (fast, cost-effective)
- Tool use (structured output) for resume/JD/interview analysis
- Prompt caching enabled (`cache_control: { type: 'ephemeral' }`)
- Base prompt: `lib/prompts/base-headhunter.ts`

**Token limits**: resume analysis ~10K tokens, JD ~5K tokens, interview ~26K tokens

### Prompt Architecture

**`lib/prompts/base-headhunter.ts`**
- `BASE_HEADHUNTER_ROLE`: 10-year headhunter persona
- `ANALYSIS_STEPS`: resume analysis methodology
- `OUTPUT_RULES`: Korean-specific formatting rules
- `B2C_PURPOSE`: job seeker perspective (vs B2B recruiter)

All prompts emphasize:
- Concrete numbers over vague descriptions
- Korean labor market context
- Direct, actionable insights

### Security

1. **PII masking**: All resume text masked before Claude API
2. **Service role key**: Supabase bypasses RLS (server-side only)
3. **Email filtering**: User can only access own analyses (enforced in API routes)
4. **Coupon validation**: Expires check, single-use enforcement

## Environment Variables

Required `.env.local`:
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
AUTH_SECRET=
MANAGER_EMAILS=admin@example.com,manager@example.com
VERCEL_KV_URL=
VERCEL_KV_REST_API_URL=
VERCEL_KV_REST_API_TOKEN=
```

## Special Considerations

- **Korean-first**: All prompts, UI text, error messages in Korean
- **File parsing**: HWP files detected but not parsed (return error → user converts to PDF)
- **Usage limits**: FREE plan severely restricted; PRO/EXPERT for real use
- **Coupons**: Alternative to plan upgrade; feature-specific (resume/jd/interview)
- **Manager role**: Bypasses all usage limits
- **Image PDFs**: Significantly slower (15-30s) due to Claude Vision OCR
- **No file storage**: Resume files converted to text immediately, original not saved
- **Resume anonymization**: Names extracted but masked in AI prompts

## API Route Patterns

All `/api/analyze/*` routes follow:
1. Auth check (`await auth()`)
2. Plan/usage limit check
3. Input validation
4. Claude API call
5. Supabase insert
6. Usage increment (if not manager)
7. Return result + ID

## Deployment

- Platform: Vercel
- Auto-deploy from main branch
- Caching: Vercel KV for usage limits
- CDN: Static assets cached by Vercel
