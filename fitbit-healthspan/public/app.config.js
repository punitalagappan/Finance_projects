// Single place for branding and release configuration.
// Change `name` before release if it collides with an existing App Store app or trademark.

export const APP = {
  name: 'Vitalspan',
  tagline: 'Recovery, Strain & Body Age for your Fitbit',
  bundleId: 'com.vitalspan.app',
  version: '1.0.0',

  // Google Cloud → Credentials → OAuth client ID → type "iOS" (bundle ID above).
  // Looks like "1234567890-abcdefg.apps.googleusercontent.com". Leave empty to ship demo/import only.
  googleIosClientId: '',

  supportEmail: 'support@example.com',
  privacyUrl: 'privacy.html',
  termsUrl: 'terms.html',
};

/** iOS OAuth redirect: the reversed client ID as a custom URL scheme (Google's installed-app flow). */
export function iosRedirect(clientId = APP.googleIosClientId) {
  if (!clientId) return null;
  const scheme = `com.googleusercontent.apps.${clientId.replace(/\.apps\.googleusercontent\.com$/, '')}`;
  return { scheme, uri: `${scheme}:/oauth2redirect` };
}
