# Google Analytics Setup for ECON 510 Website

## Stream Details

- **Stream Name:** E510 Website
- **Stream URL:** https://sergio0p.github.io/E510/
- **Stream ID:** 13393386232
- **Measurement ID:** G-G880EMEL39

## Tracking Code Installed

The following HTML files now have Google Analytics tracking enabled:

1. `index.html` - Main course page
2. `Apps/index.html` - Apps listing page
3. `syllabus_001.html` - Section 001 syllabus
4. `syllabus_002.html` - Section 002 syllabus
5. `Apps/510-arbitrage-app-bootstrap.html` - Arbitrage app
6. `Apps/510discounting-app-dynamic-consistency-bootstrap.html` - Discounting app
7. `Apps/510recursive-utility-app-bootstrap.html` - Recursive utility app
8. `GameTreeApp/backward-induction/index.html` - Backward induction app

## Tracking Code

The following code snippet was added to the `<head>` section of each file:

```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-G880EMEL39"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-G880EMEL39');
</script>
```

## What Data You Can Track

Once deployed and active, you'll be able to see:

### Visitor Metrics
- Total visitors (unique and returning)
- Real-time active users
- Session duration
- New vs. returning visitors

### Traffic Sources
- Direct links
- Search engines
- Referrals from other sites
- Social media traffic

### Page Performance
- Most viewed pages
- Most popular apps
- Page view counts
- Entry and exit pages

### Geographic Data
- Countries and cities
- Language preferences
- Time zones

### Technology
- Desktop vs. mobile vs. tablet
- Operating systems
- Browsers
- Screen resolutions

### User Behavior
- Navigation paths
- Time spent on each page
- Scroll depth

## Next Steps

1. **Commit and push** the changes to GitHub:
   ```bash
   git add .
   git commit -m "Add Google Analytics tracking to all HTML pages"
   git push
   ```

2. **Wait 24-48 hours** for data to start appearing in your dashboard

3. **Verify tracking** is working:
   - Visit https://analytics.google.com/
   - Go to your E510 property
   - Check the "Realtime" report
   - Visit your website (https://sergio0p.github.io/E510/)
   - You should see yourself as an active user in the Realtime report

## Accessing Your Analytics Dashboard

- **Google Analytics URL:** https://analytics.google.com/
- Navigate to your account and select the "E510 Website" property
- Use the left sidebar to explore different reports:
  - **Home** - Overview dashboard
  - **Realtime** - See who's on your site right now
  - **Reports** - Detailed analytics
  - **Explore** - Custom analysis

## Notes

- Data typically starts appearing within 24-48 hours of deployment
- Real-time data may show up immediately for testing
- The Measurement ID (G-G880EMEL39) is used across all pages for unified tracking
- Analytics will track page views, user engagement, and navigation patterns
- No personally identifiable information (PII) is collected

## Date Installed

January 31, 2026
