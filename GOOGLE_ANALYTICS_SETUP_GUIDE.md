# Google Analytics Setup Guide for Course Websites

This guide provides step-by-step instructions for setting up Google Analytics on any course website (ECON 101, ECON 510, or any future course).

## Prerequisites

- A Google account
- A course website hosted on GitHub Pages (or any web hosting)
- Access to edit HTML files in your repository

---

## Part 1: Create Google Analytics Property

### Step 1: Access Google Analytics

1. Go to https://analytics.google.com/
2. Sign in with your Google account

### Step 2: Create or Select Account

**If you already have an account (like for ECON 510):**
- Click on the account name in the bottom left corner
- You can add a new property to the existing account

**If this is your first time:**
- Click "Start measuring"
- Enter an **Account name** (e.g., "UNC Course Websites" or "Teaching Analytics")
- Configure data sharing settings (optional, can leave defaults)
- Click "Next"

### Step 3: Create Property

1. Enter a **Property name** (e.g., "ECON 101 Spring 2026" or "ECON 405 Website")
2. Select your **Time zone** (e.g., "United States - Eastern Time")
3. Select your **Currency** (e.g., "United States Dollar")
4. Click "Next"

### Step 4: Business Information

1. Select **Industry category**: "Education"
2. Select **Business size**: "Small" (1-10 employees)
3. Choose how you intend to use Google Analytics:
   - Check "Examine user behavior"
   - Check "Measure customer engagement"
4. Click "Create"

### Step 5: Accept Terms of Service

1. Select your country
2. Check the boxes to accept the Google Analytics Terms of Service
3. Check the box to accept the Data Processing Terms (if applicable)
4. Click "I Accept"

### Step 6: Choose Platform and Get Tracking Code

1. Select **"Web"** as your platform
2. Enter your **website URL**:
   - For GitHub Pages: `https://yourusername.github.io/ECON101` (or whatever your repo name is)
   - Example: `https://sergio0p.github.io/ECON101`
3. Enter a **Stream name** (e.g., "ECON 101 Website")
4. Click "Create stream"

### Step 7: Copy Tracking Code

You'll now see your tracking information:
- **Measurement ID**: Looks like `G-XXXXXXXXXX` (e.g., `G-G880EMEL39`)
- **Google tag code**: A JavaScript snippet

**Copy the entire code snippet** that looks like this:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-XXXXXXXXXX');
</script>
```

**Important:** Save this code somewhere safe. You'll need it in the next section.

---

## Part 2: Add Tracking Code to Your Website

### Step 8: Identify HTML Files to Track

List all HTML files in your course website that you want to track. Common files include:

- `index.html` (main page)
- `syllabus.html` or `syllabus_001.html`, `syllabus_002.html`
- Any app pages in an `Apps/` folder
- Schedule pages
- Resource pages
- Any other HTML pages students will visit

**Tip:** Use the command line to find all HTML files:

```bash
cd /path/to/your/course/repository
find . -name "*.html" -type f | grep -v "node_modules" | grep -v "Tikz2HTML"
```

### Step 9: Add Tracking Code to Each HTML File

For **each HTML file** you want to track:

1. Open the file in your code editor
2. Find the `<head>` section
3. Locate the `<title>` tag
4. **Paste the tracking code immediately after the `</title>` closing tag**

**Example:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ECON 101 - Spring 2026</title>

    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
    <script>
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());

      gtag('config', 'G-XXXXXXXXXX');
    </script>

    <!-- Bootstrap CSS or other stylesheets -->
    <link href="...">
</head>
<body>
    ...
</body>
</html>
```

**Important Notes:**
- Add the code to **every HTML page** you want to track
- Use the **same tracking code** (same Measurement ID) for all pages in the same course
- The code should go in the `<head>` section, ideally right after `<title>`
- Don't add tracking to library files or third-party components

### Step 10: Create Documentation File

Create a file called `GOOGLE_ANALYTICS_SETUP.md` in your repository root with your setup details:

```markdown
# Google Analytics Setup for [COURSE NAME]

## Stream Details

- **Stream Name:** [Your stream name]
- **Stream URL:** [Your website URL]
- **Stream ID:** [Your stream ID number]
- **Measurement ID:** [Your G-XXXXXXXXXX ID]

## Tracking Code Installed

List of HTML files with tracking enabled:
1. `index.html` - Main course page
2. `syllabus.html` - Course syllabus
3. [Add all your tracked files here]

## Date Installed

[Current date]

## Access

Google Analytics Dashboard: https://analytics.google.com/
```

---

## Part 3: Deploy and Test

### Step 11: Commit and Push Changes

```bash
# Navigate to your repository
cd /path/to/your/course/repository

# Check what files were modified
git status

# Stage all modified HTML files and the documentation
git add *.html Apps/*.html GOOGLE_ANALYTICS_SETUP.md
# Or add specific files:
# git add index.html syllabus.html GOOGLE_ANALYTICS_SETUP.md

# Commit with descriptive message
git commit -m "Add Google Analytics tracking to course website

- Added GA4 tracking code (G-XXXXXXXXXX) to all HTML pages
- Tracking enabled for all course materials
- Created documentation file

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

# Push to GitHub
git push
```

### Step 12: Wait for GitHub Pages to Deploy

- GitHub Pages usually updates within 1-5 minutes
- You can check the deployment status:
  - Go to your repository on GitHub
  - Click "Actions" tab to see deployment progress
  - Or go to Settings > Pages to see the published URL

### Step 13: Test Real-Time Tracking

1. Go to https://analytics.google.com/
2. Select your account and the new property
3. Click **"Realtime"** in the left sidebar (under Reports)
4. Open a new browser tab/window
5. Visit your course website (e.g., `https://yourusername.github.io/ECON101`)
6. Navigate to a few different pages
7. Go back to the Google Analytics tab
8. You should see yourself as an active user in the Realtime report

**If you don't see yourself:**
- Wait 1-2 minutes and refresh the Analytics page
- Make sure GitHub Pages has finished deploying
- Check browser console (F12) for any errors
- Verify the Measurement ID in your HTML matches the one in Analytics

---

## Part 4: Understanding Your Analytics

### What Data You'll See

Once data starts collecting (24-48 hours for full reports), you'll have access to:

**Visitor Metrics:**
- Total visitors and page views
- Unique visitors vs. returning visitors
- Session duration
- Real-time active users

**Page Performance:**
- Most viewed pages (which syllabus sections, which apps)
- Entry and exit pages
- Page view counts
- Time spent on each page

**Traffic Sources:**
- Direct links (students typing URL or using bookmarks)
- Referrals (Canvas, email links, other websites)
- Search engines (if indexed by Google)

**Geographic Data:**
- Countries and cities (where students are accessing from)
- Language preferences
- Time zones

**Technology:**
- Desktop vs. mobile vs. tablet usage
- Operating systems (Windows, Mac, iOS, Android)
- Browsers (Chrome, Safari, Firefox)
- Screen resolutions

**User Behavior:**
- Which pages students visit in sequence
- How they navigate through your site
- Scroll depth (how far down they read)

### Key Reports to Check

**1. Realtime Report** (Reports > Realtime)
- See who's on your site right now
- Useful during class time or before exams

**2. Engagement Overview** (Reports > Engagement > Overview)
- Most popular pages
- Average engagement time
- Events (if configured)

**3. Pages and Screens** (Reports > Engagement > Pages and screens)
- Detailed breakdown of page views
- Which pages are most/least visited

**4. User Attributes** (Reports > User > User attributes)
- Demographics
- Technology (devices, browsers)
- Geographic location

**5. Traffic Acquisition** (Reports > Acquisition > Traffic acquisition)
- How users find your site
- Which sources drive the most traffic

---

## Part 5: Tips and Best Practices

### Organizing Multiple Courses

**Option 1: One Account, Multiple Properties (Recommended)**
- Use one Google Analytics account for all your courses
- Create a separate property for each course
- Example:
  - Account: "Teaching Analytics"
    - Property: "ECON 101 Spring 2026"
    - Property: "ECON 510 Spring 2026"
    - Property: "ECON 405 Fall 2026"

**Option 2: One Property, Multiple Data Streams**
- One property for all teaching
- Separate data streams for each course
- Less organized but simpler setup

### Naming Conventions

Use clear, consistent names:
- **Property names:** "[COURSE CODE] [TERM] [YEAR]"
  - Example: "ECON 101 Spring 2026"
- **Stream names:** "[COURSE CODE] Website"
  - Example: "ECON 101 Website"

### Privacy Considerations

- Google Analytics is FERPA compliant when used properly
- Don't track personally identifiable information (PII)
- Don't use tracking on pages with student grades or personal data
- Consider adding a privacy policy link to your site
- Be transparent with students that you're tracking site usage for course improvement

### When to Check Analytics

Good times to review your analytics:
- **Weekly:** Check which pages students are viewing
- **Before exams:** See if students are reviewing materials
- **After posting new content:** Verify students are accessing it
- **End of semester:** Review overall usage patterns for course improvement

### Filtering Your Own Traffic (Optional)

To exclude your own visits from analytics:

1. In Google Analytics, go to Admin
2. Under "Property" column, click "Data Streams"
3. Click on your data stream
4. Scroll down to "Configure tag settings"
5. Click "Show all" under "Settings"
6. Click "Define internal traffic"
7. Add your IP address or IP range

### Troubleshooting

**Problem:** Not seeing any data after 48 hours

**Solutions:**
- Verify Measurement ID is correct in HTML files
- Check that GitHub Pages deployment succeeded
- Verify site is publicly accessible
- Look for JavaScript errors in browser console (F12)
- Make sure tracking code is in `<head>`, not `<body>`

**Problem:** Seeing only your own traffic

**Solutions:**
- Share course URL with students
- Verify URL is posted in Canvas or LMS
- Wait for semester to start (if in planning phase)
- Check that site URL is correct in Canvas

**Problem:** Real-time works but reports are empty

**Solutions:**
- Wait 24-48 hours for data processing
- Check if you're looking at the correct date range
- Verify that traffic actually happened (check Realtime during active hours)

---

## Quick Reference: Summary Checklist

Use this checklist when setting up Google Analytics for a new course:

- [ ] Create Google Analytics account (or use existing)
- [ ] Create new property for the course
- [ ] Set up web data stream
- [ ] Copy tracking code with Measurement ID
- [ ] Identify all HTML files to track
- [ ] Add tracking code to each HTML file (in `<head>` after `<title>`)
- [ ] Create GOOGLE_ANALYTICS_SETUP.md documentation
- [ ] Commit changes to git
- [ ] Push to GitHub
- [ ] Wait for GitHub Pages deployment (1-5 minutes)
- [ ] Test with Realtime report
- [ ] Bookmark Google Analytics dashboard
- [ ] Add website URL to Canvas/LMS
- [ ] Wait 24-48 hours for full data

---

## Additional Resources

- **Google Analytics Help Center:** https://support.google.com/analytics
- **Google Analytics Academy (Free Courses):** https://analytics.google.com/analytics/academy/
- **GA4 Documentation:** https://developers.google.com/analytics/devguides/collection/ga4

---

## Example: Complete Setup for ECON 101

Here's a complete example of setting up analytics for a new ECON 101 course:

### 1. Google Analytics Setup
- Property name: "ECON 101 Spring 2026"
- Stream name: "ECON 101 Website"
- Website URL: `https://sergio0p.github.io/ECON101`
- Measurement ID: `G-ABC123XYZ` (yours will be different)

### 2. Files to Track
```
/ECON101/
  ├── index.html
  ├── syllabus.html
  ├── schedule.html
  ├── resources.html
  └── Apps/
      ├── index.html
      ├── supply-demand-app.html
      └── elasticity-calculator.html
```

### 3. Tracking Code (Use Your Own ID!)
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-ABC123XYZ"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-ABC123XYZ');
</script>
```

### 4. Where to Insert (in each HTML file)
```html
<head>
    <meta charset="UTF-8">
    <title>ECON 101 - Introduction to Economics</title>

    <!-- INSERT TRACKING CODE HERE -->

    <link rel="stylesheet" href="styles.css">
</head>
```

### 5. Git Commands
```bash
cd ~/Dropbox/Teaching/Projects/ECON101
git add *.html Apps/*.html GOOGLE_ANALYTICS_SETUP.md
git commit -m "Add Google Analytics tracking"
git push
```

### 6. Test
- Visit https://analytics.google.com/
- Select "ECON 101 Spring 2026" property
- Click "Realtime"
- Visit https://sergio0p.github.io/ECON101
- Confirm you appear in Realtime report

---

**Last Updated:** January 31, 2026

**Questions?** Refer to the Google Analytics Help Center or create a new issue in your repository to document any problems and solutions.
