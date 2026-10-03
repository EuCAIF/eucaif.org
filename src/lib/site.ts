// Site-wide helpers. `base` comes from astro.config.mjs, so moving the site to
// another path (for example the root of a custom domain) is a one-line change.
import yaml from 'js-yaml';
import siteRaw from '../data/site.yml?raw';

export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const url = (path: string) => `${base}${path}`;

export type Conference = { name: string; venue: string; dates: string; url?: string | null };
export type Site = {
  name: string;
  full_name: string;
  email: string;
  mailing_list: string;
  conference: { upcoming: Conference | null; latest: Conference };
};
export const site = yaml.load(siteRaw) as Site;
