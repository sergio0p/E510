/* Google Analytics loader — ECON 510
 * Referenced from every page as: <script async src="/E510/js/ga.js"></script>
 * Edit the measurement ID or tracking behaviour HERE ONLY; pages carry no GA code.
 *
 * Self-exclusion (works on campus, where an IP filter cannot distinguish you
 * from your students): visit any course page once with ?noga=1 appended, e.g.
 *     https://soparreiras.org/E510/?noga=1
 * That device stops being tracked, permanently, until you visit with ?noga=0.
 * Do it on each device/browser you use. Local previews are skipped automatically.
 */
(function () {
  var ID = 'G-G880EMEL39';
  var COURSE = 'ECON 510';

  // 1. Never track local previews (localhost:8510) or file:// opens.
  var host = location.hostname;
  if (location.protocol === 'file:' || !host ||
      host === 'localhost' || host === '127.0.0.1' || host === '[::1]') return;

  // 2. Device-level opt-out flag, toggled by ?noga=1 / ?noga=0.
  try {
    var flag = new URLSearchParams(location.search).get('noga');
    if (flag !== null) localStorage.setItem('ga-optout', flag === '0' ? '0' : '1');
    if (localStorage.getItem('ga-optout') === '1') return;
  } catch (e) { /* private mode: fall through and track normally */ }

  // 3. Standard gtag.js bootstrap.
  var s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  function gtag() { dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', ID, { course: COURSE });
})();
