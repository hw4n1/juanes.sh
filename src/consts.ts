export const SITE_TITLE = 'juanes.sh';
export const SITE_DESCRIPTION =
  'Networking, infrastructure, BGP/ASN, privacy, and homelab — by Juan Esteban Muñoz Díaz (Juanes).';
export const AUTHOR_NAME = 'Juan Esteban Muñoz Díaz';
export const AUTHOR_HANDLE = 'Juanes';
export const AUTHOR_EMAIL = 'me@juanes.sh';

export const CV_URL = '/cv-juan-esteban-munoz-diaz.pdf';

// TODO: add GitHub once you have a public profile to link.
export const SOCIAL_LINKS = [
  { label: 'LinkedIn', url: 'https://www.linkedin.com/in/juaesm' },
  { label: 'Medium', url: 'https://juaesm.medium.com' },
  { label: 'Email', url: `mailto:${AUTHOR_EMAIL}` },
] as const;

// TODO: if you enable self-hosted analytics (see README), set via env:
// PUBLIC_UMAMI_URL and PUBLIC_UMAMI_WEBSITE_ID.
