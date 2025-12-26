# 📌 Pinned TODO Items

> Items we're deferring to come back to later. Each item includes context so we can pick up where we left off.

---

## 🔴 HIGH PRIORITY - Frontend Fixes Required

### 1. Fix Mobile UI Breakage in Source Code
**Status:** Pinned  
**Issue:** The source code in the repo builds a broken mobile version. The working mobile is only available in deployment `a645c17a`.  
**Impact:** Cannot deploy any frontend changes without breaking mobile.  
**Solution Needed:** Compare `a645c17a` build artifacts with current source to identify what's different. May need to extract the working code from the deployment.  
**Working Deployment:** `a645c17a-1ccd-46d4-ab06-164c087fff6f` (Dec 25, 2025)

### 2. Add Quick Actions Grid to Desktop New Chat
**Status:** Pinned  
**Request:** Add the mobile quick actions to desktop version  
**Features to Add:**
- "✨ What would you like to create?" header
- "Tap to get started instantly" subheader
- 8 quick action buttons in 2x4 grid:
  - Landing Page (pink, laptop icon)
  - Website (cyan, globe icon)
  - App (green, phone icon)
  - Spreadsheet (orange/yellow, pencil/doc icon)
  - Presentation (purple, clapperboard icon)
  - Email (light blue, envelope icon)
  - Research (peach, magnifying glass icon)
  - Analyze (blue, bar chart icon)
- Tip: "🐷 Tap Morgys to summon AI specialists"
- Tip: "🎙️ Use voice input for hands-free chatting"
**Reference:** Screenshot saved at `/home/ubuntu/upload/IMG_3304.png`

### 3. Add Model Insights Dashboard to Admin Page
**Status:** Pinned (code ready, can't deploy)  
**Files Created:**
- `console/src/components/ModelInsights.tsx`
- `console/src/components/ModelInsights.css`
- `console/src/pages/Admin.tsx` (modified to add tab)
**Backend API:** Already deployed at `/api/admin/model-insights`  
**Blocked By:** Item #1 (mobile breakage)

---

## 🟡 MEDIUM PRIORITY - Backend Enhancements

### 4. Morgy Images Not Loading
**Status:** Pinned  
**Issue:** Morgy images (bill.png, sally.png, professor.png) show as broken in `a645c17a` deployment  
**Root Cause:** The images in that deployment are only 32 bytes (corrupted/placeholder)  
**Solution:** Need to deploy with full-size images (4-5MB each) from `/public/morgys/`  
**Blocked By:** Item #1 (can't deploy without breaking mobile)

### 5. Notebooks "Loading..." Forever
**Status:** Partially Fixed  
**Backend:** Notebooks API endpoints added and deployed  
**Frontend:** Still shows "Loading..." because frontend code in `a645c17a` doesn't have the API integration  
**Blocked By:** Item #1

---

## 🟢 LOW PRIORITY - Future Enhancements

### 6. Usage Limits Upgrade Modal
**Status:** Code exists in repo  
**Issue:** Can't deploy to production due to mobile breakage  
**Files:** Changes in `App.tsx` and `App.css`

### 7. OpenRouter Model ID Fix
**Status:** Not started  
**Issue:** Some model IDs may be invalid  
**From:** Dec 21 deployment doc

---

## ✅ COMPLETED (Reference)

- ✅ Safety & Content Filtering - Deployed
- ✅ Model Stats Tracking - Deployed with category tracking
- ✅ Admin Insights API - Deployed at `/api/admin/model-insights`
- ✅ Billing System - Tables exist, Stripe working
- ✅ Sandbox Hardening - Deployed with monitoring
- ✅ Pre-commit Security Hook - Active
- ✅ Secrets Management Guide - Created

---

## 📋 How to Use This Document

1. When deferring work, add it here with full context
2. When picking up work, check this list first
3. Mark items as ✅ when completed
4. Update "Blocked By" relationships as blockers are resolved

---

*Last Updated: Dec 25, 2025*
