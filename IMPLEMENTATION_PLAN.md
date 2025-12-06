# 🚀 Morgus MVP Implementation Plan
## Budget: ~15,000 credits | Focus: Core functionality + UX polish

---

## 📊 Analysis Summary

### What We Have (Working):
✅ MOE system with 3 OpenRouter models (Mistral 7B, KAT-Coder-Pro, Tongyi DeepResearch)
✅ Nash Equilibrium scoring algorithm
✅ Beautiful MOE header UI with medals and winner highlighting
✅ Backend deployed on Cloudflare Workers
✅ Frontend deployed on Cloudflare Pages
✅ Pexels API integration code exists
✅ Code execution tool exists
✅ Gemini agent with tool support exists

### What's Broken:
❌ MOE → Gemini handoff (tools not being called)
❌ Images not displaying (Pexels not being invoked)
❌ Charts not generating (execute_code not being invoked)
❌ UI text wrapping issue (colons pushed to next line)
❌ Mobile responsiveness (broken on iPhone/Android)
❌ No dark mode

### What User Wants (Long-term Vision):
- Full MoE + Gemini architecture (MoE plans, Gemini executes)
- Morgys (companion mini-agents)
- TikTok/social generation (Seedance/Seed3D)
- GitHub integration (user repos + self-development mode)
- Screenshot/PDF ingestion
- Monetization ($3/day, $21/week, $75/month)
- Referral system
- 3D Morgy renders

---

## 🎯 MVP Scope (This Session - ~15k credits)

### Phase 1: Analysis ✅
- Read requirements
- Create prioritized plan
- Set realistic scope

### Phase 2: Core Functionality (HIGH PRIORITY)
**Goal**: Make tools work again (images, charts)
**Tasks**:
1. Add PEXELS_API_KEY to Cloudflare Worker secrets
2. Modify `/moe-chat` endpoint to route through Gemini agent
3. Ensure MOE winner's answer is passed as context to Gemini
4. Test image search with "show me pictures of cats"
5. Test chart generation with "create a bar chart of sales data"

**Estimated**: 3,000 credits

### Phase 3: UI Text Wrapping Fix (QUICK WIN)
**Goal**: Fix colon wrapping issue in MOE header
**Tasks**:
1. Inspect MOEHeader.tsx rendering logic
2. Fix CSS/text formatting to prevent orphaned colons
3. Test on various screen sizes

**Estimated**: 1,000 credits

### Phase 4: Dark Mode (MEDIUM PRIORITY)
**Goal**: Add vibrant dark mode with neon accents
**Tasks**:
1. Create dark color palette (keep vibrant neon feel)
2. Add theme toggle to UI
3. Update all components with dark mode support
4. Store preference in localStorage

**Estimated**: 3,000 credits

### Phase 5: Mobile Responsiveness (HIGH PRIORITY)
**Goal**: Make UI work on iPhone/Android
**Tasks**:
1. Add responsive breakpoints
2. Fix MOE header for mobile
3. Fix chat interface for mobile
4. Test on various screen sizes
5. Ensure touch interactions work

**Estimated**: 4,000 credits

### Phase 6: Code Review & Optimization (CRITICAL)
**Goal**: Clean, production-ready codebase
**Tasks**:
1. Review architecture for scalability
2. Remove dead code
3. Add error handling
4. Optimize API calls
5. Document key functions
6. Ensure security best practices

**Estimated**: 2,000 credits

### Phase 7: Deploy & Test
**Goal**: Ship working MVP
**Tasks**:
1. Deploy backend to Cloudflare Workers
2. Deploy frontend to Cloudflare Pages
3. Test all features end-to-end
4. Document remaining work for future sessions

**Estimated**: 2,000 credits

---

## 🚫 Out of Scope (Future Sessions)

These are AMAZING ideas but require more budget:
- Morgys system (companion agents)
- TikTok/video generation (Seedance integration)
- 3D generation (Seed3D integration)
- GitHub integration (user repos + self-dev mode)
- Screenshot/PDF ingestion
- Monetization backend (Stripe, subscriptions)
- Referral system
- Promo codes
- Admin dashboard

**Recommendation**: Get MVP working perfectly first, then tackle these in dedicated sessions with proper budget allocation.

---

## 💡 Key Insights from Your Documents

### From pasted_content_2.txt (Architecture Vision):
- **MoE Brain**: Plans and reasons, outputs JSON execution plan
- **Gemini Executor**: Only model allowed to use tools
- **Separation of concerns**: Brain thinks, hands execute
- **Media tools**: Google Image Gen, Seedance, Seed3D
- **GitHub modes**: User repos (public) vs self-dev (internal only)
- **Safety boundaries**: Never push to main, always PR workflow

### From pasted_content_3.txt (Monetization):
- **Simple pricing**: $3/day, $21/week (best value), $75/month
- **Morgys included**: 1 (daily), 3 (weekly), 5 (monthly)
- **TikTok limits**: 2 (daily), 10 (weekly), unlimited (monthly)
- **Viral loop**: Referrals → free Morgys/skins/weeks
- **Day pass wallet**: Hold up to 3 passes
- **Free users**: Demo mode only, no tools

---

## 🎨 Design Notes

### Current Issues:
1. **Text wrapping**: Colons getting orphaned makes answers look longer
2. **Mobile**: Completely broken on phones
3. **No dark mode**: Users expect this in 2025

### Design Goals:
- **Dark mode**: Vibrant neon colors (think cyberpunk aesthetic)
- **Mobile-first**: Most users will access on phones
- **Clean typography**: No orphaned punctuation
- **Compact MOE header**: Show competition without cluttering chat

---

## 🔒 Security & Best Practices

### Current Stack:
- **Backend**: Cloudflare Workers (TypeScript)
- **Frontend**: React + Vite + TypeScript
- **AI**: OpenRouter (MOE) + Gemini (tools)
- **APIs**: Pexels, ElevenLabs, E2B

### Must Ensure:
- API keys stored as secrets (not in code)
- Error handling for all API calls
- Rate limiting considerations
- CORS properly configured
- TypeScript strict mode
- No console.log in production
- Proper loading states
- User feedback for errors

---

## ✅ Success Criteria

By end of this session, we should have:
1. ✅ Images working (Pexels integration functional)
2. ✅ Charts working (code execution functional)
3. ✅ MOE → Gemini handoff working
4. ✅ UI text wrapping fixed
5. ✅ Dark mode implemented
6. ✅ Mobile responsiveness working
7. ✅ Clean, documented codebase
8. ✅ Deployed and tested

---

## 🚀 Next Steps

1. Add Pexels API key to Cloudflare secrets
2. Modify /moe-chat endpoint for Gemini handoff
3. Fix UI issues
4. Add dark mode
5. Fix mobile
6. Review and optimize
7. Deploy and celebrate! 🎉

---

## 📝 Notes for Future Sessions

**Big Vision Items** (require dedicated sessions):
- Morgys system architecture
- Video generation pipeline
- GitHub integration with PR workflows
- Monetization backend (Stripe)
- Admin dashboard
- Referral tracking
- Screenshot/PDF ingestion

**Budget Recommendation**:
- Morgys: 10,000 credits
- Video gen: 5,000 credits
- GitHub integration: 8,000 credits
- Monetization: 12,000 credits
- Admin dashboard: 6,000 credits

Total for full vision: ~41,000 additional credits

---

*Let's build something amazing! 🚀*
