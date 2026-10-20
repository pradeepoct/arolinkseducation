/**
 * Module for tracing standard HTTP 3xx redirect chains using protocol headers.
 * Safe, read-only network inspection without browser rendering or bypass automation.
 */
export async function traceRedirectChain(initialUrl, maxHops = 10) {
  let currentUrl = initialUrl.startsWith('http') ? initialUrl : `https://${initialUrl}`;
  const hops = [];

  for (let step = 1; step <= maxHops; step++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual', // Intercept each hop explicitly
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) URLInspector/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const status = response.status;
      const location = response.headers.get('location');
      const contentType = response.headers.get('content-type') || 'unknown';

      hops.push({
        hop: step,
        url: currentUrl,
        statusCode: status,
        statusText: response.statusText,
        contentType,
        location: location || null,
      });

      // Check if this hop is an HTTP 3xx redirect
      if ([301, 302, 303, 307, 308].includes(status) && location) {
        currentUrl = new URL(location, currentUrl).href;
        continue;
      }

      // Final terminal hop reached
      break;
    } catch (error) {
      clearTimeout(timeout);
      hops.push({
        hop: step,
        url: currentUrl,
        error: error.message,
      });
      break;
    }
  }

  const isClientRenderedPortal =
    hops.length === 1 &&
    hops[0].statusCode === 200 &&
    (currentUrl.includes('arolinks.com') ||
      hops[0].contentType.includes('text/html'));

  return {
    initialUrl,
    finalUrl: currentUrl,
    totalHops: hops.length,
    isClientRenderedPortal,
    note: isClientRenderedPortal
      ? 'This URL returned HTTP 200 without protocol redirects. Destination is rendered or gated client-side via JavaScript.'
      : 'Redirect chain completed via HTTP protocol headers.',
    hops,
  };
}
