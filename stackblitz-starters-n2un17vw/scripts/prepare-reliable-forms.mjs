import { readFile, writeFile } from "node:fs/promises";

const shopUrl = new URL("../app/shop/page.tsx", import.meta.url);
const contactUrl = new URL("../app/contact/page.tsx", import.meta.url);

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return source;
  if (!source.includes(from)) {
    throw new Error(`RELIABLE_FORMS: ${label} not found`);
  }
  return source.replace(from, to);
}

function replaceRegexRequired(source, pattern, to, label) {
  if (source.includes(to)) return source;
  if (!pattern.test(source)) {
    throw new Error(`RELIABLE_FORMS: ${label} not found`);
  }
  return source.replace(pattern, to);
}

let shop = await readFile(shopUrl, "utf8");
let contact = await readFile(contactUrl, "utf8");

shop = replaceRequired(
  shop,
  `// Google Apps Script endpoint (clicks + waitlist)\nconst ANALYTICS_ENDPOINT =\n  "https://script.google.com/macros/s/AKfycbxu9MZaTjNjJQJ6NrRoow1HMEkFoUwPGe3uB1VR1ltF-YZZSU6WBkkRGq_bOxBCqKaO/exec";`,
  `// Same-origin Vercel proxy. It verifies the Google Apps Script response server-side.\nconst ANALYTICS_ENDPOINT = "/api/interest";`,
  "shop same-origin endpoint"
);

// Browser-side no-cors hides HTTP failures. The same-origin proxy makes it unnecessary.
shop = shop.replace(/^[ \t]*mode:\s*"no-cors",\s*$/gm, "");

shop = replaceRequired(
  shop,
  `      await fetch(ANALYTICS_ENDPOINT, {\n        method: "POST",\n        body: JSON.stringify({`,
  `      const response = await fetch(ANALYTICS_ENDPOINT, {\n        method: "POST",\n        body: JSON.stringify({`,
  "waitlist response capture"
);

shop = replaceRegexRequired(
  shop,
  /headers:\s*\{\s*"Content-Type":\s*"application\/json"\s*\},\s*\n\s*\}\);\s*\n\s*setWaitlistStatus\("sent"\);/,
  `headers: { "Content-Type": "application/json" },\n      });\n\n      if (!response.ok) {\n        throw new Error("Waitlist submission was not accepted");\n      }\n\n      setWaitlistStatus("sent");`,
  "waitlist status verification"
);

contact = replaceRequired(
  contact,
  `const FORMS_ENDPOINT =\n  "https://script.google.com/macros/s/AKfycbyY-t0Mwa_LxylYoVhsIFxz1FzkPQo7OWFXDdLz5-7W64NMZIO3hgQFO3MpDFd8TOfY/exec";`,
  `const FORMS_ENDPOINT = "/api/contact";`,
  "contact same-origin endpoint"
);

contact = replaceRequired(
  contact,
  `      await fetch(FORMS_ENDPOINT, {`,
  `      const response = await fetch(FORMS_ENDPOINT, {`,
  "contact response capture"
);
contact = contact.replace(/^[ \t]*mode:\s*"no-cors",\s*$/gm, "");
contact = replaceRegexRequired(
  contact,
  /\}\);\s*\n\s*setStatus\("sent"\);\s*\n\s*form\.reset\(\);/,
  `});\n\n      if (!response.ok) {\n        throw new Error("Contact submission was not accepted");\n      }\n\n      setStatus("sent");\n      form.reset();`,
  "contact status verification"
);

await writeFile(shopUrl, shop, "utf8");
await writeFile(contactUrl, contact, "utf8");

console.log("RELIABLE_FORMS_PREPARED", {
  sameOriginProxy: true,
  waitlistSuccessVerified: true,
  contactSuccessVerified: true,
  directBrowserNoCorsRemoved: true,
});
