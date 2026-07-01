/**
 * EN locale bundle re-export index.
 * Merges all per-page namespace JSON files into a single object.
 * Used by src/lib/i18n.ts as the import source for the English bundle.
 * Each namespace maps to a sub-object; getString() navigates as "namespace.key.subkey".
 */

import common from "./en/common.json" assert { type: "json" };
import placeholder from "./en/placeholder.json" assert { type: "json" };
import images from "./en/images.json" assert { type: "json" };
import home from "./en/home.json" assert { type: "json" };
import clinic from "./en/clinic.json" assert { type: "json" };
import about from "./en/about.json" assert { type: "json" };
import contact from "./en/contact.json" assert { type: "json" };

const enBundle = { common, placeholder, images, home, clinic, about, contact } as const;

export type EnBundle = typeof enBundle;
export default enBundle;
