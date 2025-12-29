# Supabase Issues Found - morgus-agent Project

## Summary
- **Total Issues:** 267
- **Security Issues:** 86
- **Performance Issues:** 181

## Security Issues

### Tables Without RLS Enabled (31 tables)
1. `public.usage_quotas`
2. `public.user_usage`
3. `public.rate_limits`
4. `public.morgy_knowledge`
5. `public.marketplace_listings`
6. `public.creator_payouts`
7. `public.morgy_analytics`
8. `public.morgy_reviews`
9. `public.morgy_purchases`
10. `public.answer_cache`
11. `public.dppm_reflections`
12. `public.model_performance`
13. `public.model_competition_results`
14. `public.mcp_server_usage`
15. `public.mcp_server_reviews`
16. `public.mcp_server_installs`
17. `public.mcp_servers`
18. `public.referrals`
19. `public.model_stats`
20. `public.promo_codes`
21. `public.promo_redemptions`
22. `public.subscription_plans`
23. `public.training_data`
24. `public.webhook_alerts`
25. `public.subscription_history`
26. `public.stripe_webhook_events`
27. `public.mcp_server_categories`
28. `public.thought_messages`
29. `public.thoughts`
30. `public.subscriptions`
31. `public.tasks`

### Tables with RLS Policies but RLS Not Enabled (10 tables)
1. `public.tasks`
2. `public.subscriptions`
3. `public.model_performance`
4. `public.mcp_servers`
5. `public.mcp_server_usage`
6. `public.mcp_server_reviews`
7. `public.mcp_server_installs`
8. `public.mcp_server_categories`
9. `public.dppm_reflections`

### View with Security Issue
1. `public.model_leaderboard` - SECURITY DEFINER property

### Functions with Mutable search_path (Security Risk)
1. `public.update_morgy_rating`
2. `public.increment_server_install_count`
3. `public.update_server_review_stats`
4. `public.get_failed_webhook_events`
5. `public.search_knowledge`
6. `public.add_credits`
7. `public.update_platform_learnings_updated_at`
8. `public.archive_low_performing_learnings`
9. `public.update_model_performance_from_reflection`
10. `public.get_webhook_health_stats`
11. `public.update_conversation_on_message`
12. `public.can_use_feature`
13. `public.use_credits`
14. `public.get_top_platform_learnings`
15. `public.get_user_learning_stats`
16. `public.update_research_session_progress`
17. `public.handle_new_user`
18. `public.decrement_server_install_count`
19. `public.check_credits`
20. `public.initialize_user_credits`
21. `public.update_updated_at`
22. `public.increment_morgy_stats`
23. `public.reject_morgy_learning`
24. `public.record_learning_application`
25. `public.get_user_plan`
26. `public.get_morgy_learning_stats`
27. `public.get_recommended_models`
28. `public.reject_platform_learning`
29. `public.increment_usage`
30. `public.log_webhook_failure_alert`
31. `public.get_active_alerts`
32. `public.search_morgy_learnings`
33. `public.acknowledge_alert`
34. `public.search_platform_learnings`
35. `public.update_model_stats`
36. `public.get_system_health`

## Performance Issues (181)
- Slow queries detected
- Query optimization opportunities
- Index recommendations

