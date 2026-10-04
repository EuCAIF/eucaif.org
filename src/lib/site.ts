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
  repo: string;
  conference: { upcoming: Conference | null; latest: Conference };
  hero: { style: 'photo' | 'animation'; image: string; image_credit?: string };
};
export const site = yaml.load(siteRaw) as Site;

/** GitHub web-editor URL for a repo-relative file path (opens a fork + PR flow for non-members). */
export const editUrl = (path: string) => `${site.repo}/edit/main/${path.replace(/^\/+/, '')}`;
/** GitHub tree URL for a repo-relative folder. */
export const treeUrl = (path: string) => `${site.repo}/tree/main/${path.replace(/^\/+/, '')}`;
