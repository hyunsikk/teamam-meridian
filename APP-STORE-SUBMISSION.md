# Meridian: Health Insights — App Store Submission Guide

## Pre-Requisites Checklist
- [x] Apple Developer Account ($99/yr) — https://developer.apple.com
- [x] Expo account — https://expo.dev
- [x] EAS CLI installed (`eas-cli/18.0.5`)
- [x] GitHub repo pushed (private: `hyunsikk/teamam-meridian`)
- [x] Bundle identifier: `com.teamam.meridian`
- [x] App version: 1.0.0
- [ ] EAS project initialized (Step 1 below)
- [ ] App Store Connect listing created (Step 3 below)

---

## Step 1: Initialize EAS Project (one-time setup)

```bash
cd /Users/hsik/.openclaw/workspace/teamam/apps/meridian/meridian-app

# Link to your Expo account — this will prompt interactively
eas init

# When prompted:
# - "Would you like to create a project for @hsikk/meridian?" → Yes
# - This adds a projectId to app.json
```

## Step 2: Build the iOS App

```bash
cd /Users/hsik/.openclaw/workspace/teamam/apps/meridian/meridian-app

# Production build for App Store
eas build --platform ios --profile production

# When prompted:
# - "Log in to your Apple Developer account" → Enter Apple ID + password
# - "Would you like EAS to manage your Apple credentials?" → Yes (recommended)
# - "Generate a new Apple Distribution Certificate?" → Yes (first time)
# - "Generate a new Apple Provisioning Profile?" → Yes (first time)
#
# Build runs on EAS cloud servers (~10-15 minutes)
# You'll get a URL to download the .ipa file when done
```

After build completes:
```bash
# Check build status
eas build:list --platform ios --limit 1

# Download the .ipa (or use the URL from build output)
```

## Step 3: Create App Store Connect Listing

Go to **https://appstoreconnect.apple.com**

### 3a. Create New App
1. Click **My Apps** → **+** → **New App**
2. Fill in:
   - **Platform:** iOS
   - **Name:** `Meridian: Health Insights`
   - **Primary Language:** English (U.S.)
   - **Bundle ID:** `com.teamam.meridian` (select from dropdown — generated during build)
   - **SKU:** `com.teamam.meridian` (or `meridian-health-insights`)
   - **User Access:** Full Access

### 3b. App Information Tab
1. **Subtitle:** `Find Your Body's Connections` (30 chars)
2. **Category:** Health & Fitness (Primary), Medical (Secondary)
3. **Content Rights:** Does not contain third-party content (our knowledge base is paraphrased, not copied)
4. **Age Rating:** Click "Edit" → answer the questionnaire:
   - Medical/Treatment Information: **Yes** (we show health insights)
   - All others: **No**
   - Expected rating: **4+** or **12+**

### 3c. Pricing and Availability
1. **Price:** Free (we'll add IAP subscription later)
2. **Availability:** All territories (or select specific countries)

### 3d. App Privacy
This is CRITICAL — Apple reviews this carefully.

1. Click **App Privacy** → **Get Started**
2. **Does your app collect data?** → **Yes**
3. Data types collected:

   **Health & Fitness:**
   - **Health** → Used for: App Functionality
   - **Fitness** → Used for: App Functionality
   - Linked to user: **No**
   - Used for tracking: **No**

   **Diagnostics:**
   - **Crash Data** → Used for: App Functionality
   - Linked to user: **No**
   - Used for tracking: **No**

4. **Data NOT collected:**
   - No contact info, no identifiers, no location, no financial, no browsing, no search history, no purchases
   - Stress this: ALL data stays on-device. Zero server communication.

### 3e. Version Information (iOS App → 1.0 tab)

**Screenshots** (REQUIRED — prepare these from the running app):

You need screenshots for:
- **iPhone 6.7" display** (iPhone 15 Pro Max) — REQUIRED for featuring
- **iPhone 6.5" display** (iPhone 11 Pro Max) — REQUIRED
- **iPad Pro 12.9" (6th gen)** — if `supportsTablet: true`

Screenshot dimensions:
- 6.7": 1290 × 2796 px
- 6.5": 1284 × 2778 px  
- iPad: 2048 × 2732 px

**5 screenshots to capture (in order):**
1. **Network graph** with constellation edges lit up (hero shot)
2. **Personalized insight card** showing a correlation with personal data
3. **Quick-log sheet** showing the 15-second logging flow
4. **Insights screen** with weekly digest + recommendations
5. **History screen** with calendar heatmap + trend timeline

Tip: Use Xcode Simulator to capture exact dimensions, or use a screenshot framing tool like Rotato/Screenshots Pro to add context text overlays.

**Promotional Text** (170 chars, can update without review):
```
your body is a network. track sleep, energy, mood & more — meridian reveals the hidden connections between them, backed by research from 35+ peer-reviewed sources.
```

**Description:**
```
your body is a network of connected signals. meridian tracks sleep, energy, mood, and more — then reveals the hidden patterns between them. discover that your headaches always follow two nights of poor sleep, or that exercise boosts your focus the next day.

what makes meridian different:

◆ constellation network — a unique visual map showing how your body signals connect. watch new edges light up as patterns emerge from your data.

◆ real intelligence, not just logging — pearson correlation analysis with lag detection finds connections other apps miss. "when your sleep drops below 6.5h, your energy averages 2.1 the next day (vs 3.8 normally)."

◆ 221 research-backed insights — every connection is explained with science from 35+ peer-reviewed sources (walker, van dongen, chekroud, mcewan, and more).

◆ predictions — after 14 days, get tomorrow's energy and mood forecasts based on your personal patterns.

◆ proactive coaching — daily focus actions, day-specific warnings ("tuesdays are harder for your energy — try this"), and personalized recommendations.

◆ under 15 seconds to log — start with 3-4 signals, unlock more as you build the habit. quick, satisfying, designed for daily use.

◆ fully offline — your health data never leaves your device. no accounts, no cloud, no tracking. your body, your data, your privacy.

◆ weekly digest — see your trends, strongest connections, and next steps in one card.

◆ streaks & milestones — build consistency with streak tracking and milestone celebrations.

free to try. premium unlocks correlations, predictions, recommendations, and the full constellation network.
```

**Keywords** (100 chars, comma-separated, NO spaces):
```
health,correlations,patterns,symptom,diary,signals,quantified,self,wellness,insights,sleep,energy,mood,track,journal
```

**Support URL:** (required)
```
https://github.com/hyunsikk/teamam-meridian/issues
```
(Or create a simple support page)

**Marketing URL:** (optional but recommended)
```
https://github.com/hyunsikk/teamam-meridian
```
(Replace with landing page URL when ready)

**What's New in This Version:**
```
initial release. welcome to meridian.
```

### 3f. Build Upload

**Option A: Via EAS Submit (recommended)**
```bash
# After build completes, submit directly:
eas submit --platform ios --latest

# When prompted:
# - Apple ID email
# - App-specific password (generate at https://appleid.apple.com → Sign-In & Security → App-Specific Passwords)
# - Select the app from App Store Connect
```

**Option B: Via Transporter app**
1. Download "Transporter" from Mac App Store
2. Download the .ipa from EAS build output URL
3. Drag .ipa into Transporter → click "Deliver"

**Option C: Via Xcode**
1. Download .ipa from EAS
2. Open Xcode → Window → Organizer → Upload (drag .ipa)

### 3g. Select Build
1. After upload, go back to App Store Connect → your app → iOS 1.0
2. Under "Build", click **+** → select the uploaded build
3. It may take 5-30 minutes for the build to appear after upload

### 3h. Review Information

**Contact Information:**
- First Name, Last Name, Email, Phone — your info

**Notes for Review:**
```
Meridian is a health pattern intelligence app that tracks body signals (sleep, energy, mood, etc.) and finds statistical correlations between them using Pearson correlation analysis with lag detection.

All data processing happens on-device. The app makes zero network calls — it is fully offline. Health data is stored locally via AsyncStorage and never transmitted.

The knowledge base (221 entries) is bundled with the app and sourced from peer-reviewed research (documented in our source code).

No account creation is required. The app works immediately upon download.
```

**Demo Account:** Not applicable (no login required)

### 3i. Submit for Review
1. Review everything one more time
2. Click **"Add for Review"**
3. Click **"Submit to App Review"**
4. Expected review time: 24-48 hours (sometimes faster)

---

## Step 4: After Submission

### If Approved ✅
- App goes live (or on the date you scheduled)
- Execute the distribution strategy (see `distribution-strategy.md`)
- Post to Product Hunt, Reddit, HN
- Monitor reviews daily for the first 2 weeks

### If Rejected ❌
Common reasons and fixes:
- **Privacy policy missing** → Add a simple privacy policy page (we can generate one)
- **Health claims too strong** → Add disclaimer: "not medical advice"
- **Incomplete metadata** → Fill in all required fields
- **Crashes during review** → Check crash logs in App Store Connect
- **Data collection not declared properly** → Review App Privacy section

---

## Quick Commands Reference

```bash
# Navigate to project
cd /Users/hsik/.openclaw/workspace/teamam/apps/meridian/meridian-app

# Initialize EAS (one-time)
eas init

# Build for App Store
eas build --platform ios --profile production

# Check build status
eas build:list --platform ios --limit 1

# Submit to App Store
eas submit --platform ios --latest

# Build for simulator testing
eas build --platform ios --profile development

# Local web preview
npx expo export --platform web && cd dist && python3 -m http.server 8087
```
