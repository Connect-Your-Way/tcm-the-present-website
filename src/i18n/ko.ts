/**
 * KO locale bundle re-export index.
 * Merges all per-page namespace JSON files into a single object.
 * Used by src/lib/i18n.ts as the import source for the Korean bundle.
 * Each namespace maps to a sub-object; getString() navigates as "namespace.key.subkey".
 */

import common from "./ko/common.json" assert { type: "json" };
import placeholder from "./ko/placeholder.json" assert { type: "json" };
import images from "./ko/images.json" assert { type: "json" };
import home from "./ko/home.json" assert { type: "json" };
import clinic from "./ko/clinic.json" assert { type: "json" };
import about from "./ko/about.json" assert { type: "json" };
import contact from "./ko/contact.json" assert { type: "json" };

const koBundle = { common, placeholder, images, home, clinic, about, contact } as const;

export type KoBundle = typeof koBundle;
export default koBundle;
