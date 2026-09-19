#!/bin/bash
# launch_automation.sh
# Prerequisites: supabase CLI installed, logged in, and linked to project

set -e # Exit on error

echo "🚀 Starting Platform Launch Automation Sequence..."

# 1. Pre-Migration Backup
echo "📦 Step 1: Creating Pre-Migration Snapshot..."
if [ -f "supabase/verification/pre_ad_launch_snapshot.sql" ]; then
    supabase query --file supabase/verification/pre_ad_launch_snapshot.sql > logs/pre_migration_snapshot_$(date +%Y%m%d_%H%M%S).txt
    echo "✅ Pre-migration snapshot saved."
else
    echo "⚠️ Warning: Snapshot SQL file not found. Skipping backup."
fi

# 2. Apply Migration 0015
echo "🔧 Step 2: Applying Migration 0015 (Pre-Ad-Launch Hardening)..."
# Ensure we are pushing all pending migrations
supabase db push

# Verify specific migration exists
if supabase db diff --schema public | grep -q "0015"; then
    echo "⚠️ Warning: Migration 0015 might not have applied cleanly or schema differs."
else
    echo "✅ Migration push completed."
fi

# 3. Post-Migration Verification
echo "🔍 Step 3: Running Post-Migration Verification..."
if [ -f "supabase/verification/pre_ad_launch_snapshot.sql" ]; then
    supabase query --file supabase/verification/pre_ad_launch_snapshot.sql > logs/post_migration_snapshot_$(date +%Y%m%d_%H%M%S).txt
    echo "✅ Post-migration snapshot saved."
fi

echo "🎉 Database Migration Phase Complete."
echo ""
echo "👉 NEXT STEPS (Manual Intervention Required):"
echo "1. Update your Vercel/Production Environment Variables:"
echo "   - PLATFORM_BKASH_NUMBER"
echo "   - PLATFORM_NAGAD_NUMBER"
echo "   - PLATFORM_ROCKET_NUMBER"
echo "   - COMMERCE_ENABLED=true"
echo "   - STORE_PUBLIC_ENABLED=false (Keep false for Canary)"
echo "   - COMMERCE_CANARY_EMAILS=<your-email>"
echo ""
echo "2. Run the Canary Test Script (canary_tests.sh) after env vars are set."
