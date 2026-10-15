const FAN_PATH_PATTERN = /^\/live\/[^/?#]+\/?$/;

export default function handler(request, response) {
  const requestedStartUrl = request.query.start_url;
  const startUrl =
    typeof requestedStartUrl === 'string' &&
    (requestedStartUrl === '/' || FAN_PATH_PATTERN.test(requestedStartUrl))
      ? requestedStartUrl
      : '/';

  response.setHeader('Content-Type', 'application/manifest+json');
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({
    id: startUrl,
    name: 'LaxTrack',
    short_name: 'LaxTrack',
    description: 'Live lacrosse stat tracker',
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0b2e16',
    theme_color: '#0b2e16',
    icons: [
      {
        src: '/favicon.jpg',
        sizes: '1024x1024',
        type: 'image/jpeg',
        purpose: 'any',
      },
    ],
  });
}
