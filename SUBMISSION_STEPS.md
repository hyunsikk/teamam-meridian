# Meridian v1.2.0 - Step-by-Step App Store Submission Guide

## Before You Start
- You need: Mac with Safari/Chrome, Apple ID (paul483@naver.com), 2FA device
- Build v1.2.0 (build 6) has been submitted to App Store Connect via EAS
- Screenshots are at: `~/workspace/teamam/apps/meridian/screenshots/appstore/`
- All metadata text is in this guide — just copy/paste each field

---

## STEP 1: Log Into App Store Connect

1. Open https://appstoreconnect.apple.com
2. Sign in with **paul483@naver.com**
3. Complete 2FA on your device
4. Click **"My Apps"** on the main dashboard

---

## STEP 2: Select the App

1. Find **"Meridian: Health Insights"** in your app list
2. Click on it to open the app page
3. If you don't see a v1.2.0 version yet:
   - The EAS submission (ID: `b736663f-995a-46de-9054-800b4dc4504f`) should have created it
   - If not, click the **"+"** next to "iOS App" in the left sidebar
   - Enter version **1.2.0**
   - Click **Create**

---

## STEP 3: Select the Build

1. In the v1.2.0 version page, scroll down to **"Build"**
2. Click the **"+"** button next to Build
3. You should see build **6** (1.2.0) in the list
   - If it's not there yet, wait 5-15 minutes — EAS is still uploading
   - You can check EAS submission status at: https://expo.dev/accounts/hsikk/projects/meridian/submissions/b736663f-995a-46de-9054-800b4dc4504f
4. Select build **6** and click **Done**

---

## STEP 4: Upload Screenshots

### iPhone 6.7" Display (REQUIRED)
1. Click the **"6.7 Display"** tab (or "iPhone 6.7-inch Display")
2. Drag and drop ALL 7 files from:
   `~/workspace/teamam/apps/meridian/screenshots/appstore/iphone-6.7/`
3. Files to upload (in this order):
   - `01-network.png` — Hero shot: constellation graph
   - `02-insights.png` — Research-backed insights
   - `03-history.png` — Calendar heatmap + trends
   - `04-quicklog.png` — Quick log sheet
   - `05-signals.png` — Signal selection
   - `06-settings.png` — Settings & dark mode
   - `07-onboarding.png` — Welcome screen

### iPhone 6.5" Display (REQUIRED)
1. Click the **"6.5 Display"** tab
2. Drag and drop ALL 7 files from:
   `~/workspace/teamam/apps/meridian/screenshots/appstore/iphone-6.5/`
3. Same 7 files, same order

### iPad Pro 12.9" Display (REQUIRED — app supports tablet)
1. Click the **"12.9 Display"** tab (or "iPad Pro (6th Gen) 12.9-inch Display")
2. Drag and drop ALL 7 files from:
   `~/workspace/teamam/apps/meridian/screenshots/appstore/ipad-12.9/`
3. Same 7 files, same order

**Important:** Upload them in numerical order (01 first, 07 last). The first screenshot (01-network) is what users see in search results.

---

## STEP 5: Fill In Metadata

### Promotional Text (top of the page)
Copy and paste exactly:
```
Track daily health signals in 15 seconds. Discover hidden connections between sleep, mood, energy, and stress. All data stays on your device.
```

### Description
Copy and paste exactly (the entire block below):
```
Your body sends signals every day. Meridian helps you read them.

Track sleep, energy, mood, focus, stress, and more with a quick daily log that takes under 15 seconds. Meridian runs statistical analysis on your data to reveal hidden connections between your health signals.

HOW IT WORKS

Log a few signals daily using quick-tap emoji scales and simple toggles. Meridian does the rest.

After 7 days, the app starts mapping correlations. Does poor sleep tank your focus two days later? Does exercise boost your mood more than you realized? Meridian finds these patterns in your personal data.

WHAT MAKES MERIDIAN DIFFERENT

- Correlation Network: A visual map showing how your health signals connect to each other. No other app shows you the relationships between your daily metrics.

- Research-Backed Insights: Every recommendation includes citations from peer-reviewed studies. 214 research references power the insight engine. This is science, not guesswork.

- Predictive Forecasts: After 14 days, Meridian forecasts how you might feel tomorrow based on today's patterns.

- Under 15 Seconds: The quick-log sheet uses emoji scales and yes/no toggles. Fast enough to do every day without thinking about it.

SIGNALS YOU CAN TRACK

- Sleep (hours)
- Energy level
- Mood
- Focus
- Stress
- Headache
- Exercise
- Digestion

PRIVACY FIRST

All data stays on your device. No accounts. No cloud servers. No analytics or tracking. Export your data as JSON anytime. Your health data belongs to you.

FEATURES

- Interactive constellation graph showing signal connections
- Calendar heatmap with logging history
- 60-day sparkline trends per signal
- Weekly digest summaries
- Daily focus actions and streak tracking
- Dark and light mode
- Daily reminder notifications
- Data export and import

Meridian is not a medical device and does not provide medical advice, diagnosis, or treatment. All insights are for informational purposes only and are based on statistical analysis of user-entered data combined with published research. Consult a healthcare professional for medical decisions.
```

### Keywords
Copy and paste exactly (no spaces after commas):
```
health,tracker,mood,sleep,energy,stress,focus,correlation,pattern,wellness,journal,daily,log,habit
```

### What's New in This Version
Copy and paste exactly:
```
- Completely redesigned quick-log: log all signals in under 15 seconds
- Light and dark mode with one-tap toggle
- New dedicated Settings tab
- Improved constellation graph with clearer connections
- Calendar heatmap with 2-letter day labels
- 60-day trend sparklines with scale indicators
- Better text contrast and accessibility
- Explore the app with sample data before committing
- Performance and stability improvements
```

---

## STEP 6: Fill In URLs

Scroll to the **"App Information"** section (left sidebar > "App Information"):

1. **Privacy Policy URL:**
   ```
   https://hyunsikk.github.io/teamam-meridian/privacy.html
   ```

2. **Support URL** (under "General Information"):
   ```
   https://hyunsikk.github.io/teamam-meridian/support.html
   ```

3. **Marketing URL** (optional but recommended):
   ```
   https://hyunsikk.github.io/teamam-meridian/
   ```

---

## STEP 7: App Information (Left Sidebar)

Click **"App Information"** in the left sidebar:

1. **Name:** `Meridian - Body Pattern Tracker`
   - If the name was previously "Meridian: Health Insights", you can update it here
   - The colon (:) version is also fine if you prefer to keep it
2. **Subtitle:** `Sleep, Mood & Health Insights`
3. **Primary Category:** Health & Fitness
4. **Secondary Category:** Medical (or leave blank)
5. **Content Rights:** "Does this app contain, show, or access third-party content?" → **No**

---

## STEP 8: Pricing and Availability

Click **"Pricing and Availability"** in the left sidebar:

1. **Price:** Free
2. **Availability:** All territories (default)

---

## STEP 9: App Privacy

Click **"App Privacy"** in the left sidebar:

1. Click **"Get Started"** or **"Edit"**
2. **Do you collect data?** → **No**
   - Meridian stores everything locally. No data is collected, transmitted, or stored externally.
3. Click **Save** / **Publish**

---

## STEP 10: Age Rating

If prompted to fill in the age rating questionnaire:

1. All content questions → **No** / **None** / **Infrequent or Mild** (whatever is lowest)
2. **Medical/Treatment Information** → **No** (the app is informational only, with medical disclaimers)
3. **Unrestricted Web Access** → **No**
4. The result should be **4+**

---

## STEP 11: App Review Information

Go back to the version page (v1.2.0), scroll to **"App Review Information"**:

### Contact Information
- **First Name:** Hyun Sik
- **Last Name:** Kim
- **Email:** paul483@naver.com
- **Phone:** (your phone number)

### Notes for Review
Copy and paste exactly:
```
Meridian is a personal health signal tracker that helps users identify correlations between daily metrics like sleep, mood, energy, and stress. All analysis runs locally on the device using statistical correlation methods.

To test the full experience quickly:
1. On the welcome screen, tap "or explore with sample data" to load 30 days of realistic data
2. Browse all 5 tabs: Network, Insights, History, Signals, Settings
3. Tap "update today" on the Network tab to see the quick-log sheet
4. Toggle between dark and light mode in Settings

The app includes a medical disclaimer on the Insights screen and in the About section of Settings. All health recommendations include citations from peer-reviewed research (214 total references). The app explicitly states it is not a medical device and does not provide medical advice.

No backend services, APIs, or user accounts are used. All data is stored locally via AsyncStorage.
```

### Sign-In Required?
- **No** (no sign-in required)

### Demo Account
- Leave blank — reviewer can use "explore with sample data" button

---

## STEP 12: Version Release

Scroll to **"Version Release"** at the bottom of the version page:

1. Select: **"Manually release this version"**
   - This lets you control exactly when the app goes live after approval

---

## STEP 13: Final Review & Submit

1. Scroll to the top of the v1.2.0 page
2. Click **"Save"** to save all changes
3. Review everything one more time:
   - ✅ Build 6 selected
   - ✅ Screenshots uploaded (6.7", 6.5", iPad 12.9")
   - ✅ Description filled
   - ✅ Keywords filled
   - ✅ What's New filled
   - ✅ Promotional text filled
   - ✅ Privacy URL set
   - ✅ Support URL set
   - ✅ App Privacy: "No data collected"
   - ✅ Version release: Manual
   - ✅ Review notes filled
4. Click **"Add for Review"** (blue button at top right)
5. A confirmation dialog will appear — click **"Submit to App Review"**

---

## STEP 14: After Submission

- **Review time:** Usually 24-48 hours (sometimes same day)
- **Status will change to:** "Waiting for Review" → "In Review" → "Ready for Sale" (or "Rejected")
- **When approved:** You'll get an email. Then go to ASC and click **"Release This Version"** (since we chose manual release)
- **If rejected:** Tell Sam — we'll fix whatever they flag and resubmit

---

## Quick Reference

| Field | Value |
|-------|-------|
| Version | 1.2.0 |
| Build | 6 |
| Price | Free |
| Category | Health & Fitness |
| Age Rating | 4+ |
| Privacy | No data collected |
| Release | Manual |
| Privacy URL | https://hyunsikk.github.io/teamam-meridian/privacy.html |
| Support URL | https://hyunsikk.github.io/teamam-meridian/support.html |
| Marketing URL | https://hyunsikk.github.io/teamam-meridian/ |

## Screenshot Folders
```
~/workspace/teamam/apps/meridian/screenshots/appstore/iphone-6.7/  (7 files)
~/workspace/teamam/apps/meridian/screenshots/appstore/iphone-6.5/  (7 files)
~/workspace/teamam/apps/meridian/screenshots/appstore/ipad-12.9/   (7 files)
```
