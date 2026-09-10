import { mkdir, readFile, writeFile } from "node:fs/promises";

const appRoot = new URL("../app/", import.meta.url);

const pageDefinitions = [
  { source: "page.tsx", target: "sv/page.tsx", english: "/", swedish: "/sv", depth: 1 },
  { source: "shop/page.tsx", target: "sv/shop/page.tsx", english: "/shop", swedish: "/sv/shop", depth: 2 },
  { source: "contact/page.tsx", target: "sv/contact/page.tsx", english: "/contact", swedish: "/sv/contact", depth: 2 },
  { source: "sustainability/page.tsx", target: "sv/sustainability/page.tsx", english: "/sustainability", swedish: "/sv/sustainability", depth: 2 },
];

const textTranslations = [
  ["Welcome to Voskopulence", "Välkommen till Voskopulence"],
  ["Botanical rituals shaped by the Mediterranean, beginning with concentrated solid haircare.", "Botaniska ritualer formade av Medelhavet, med början i koncentrerad hårvård i fast form."],
  ["Discover the collection", "Upptäck kollektionen"],
  ["Explore the collection", "Utforska kollektionen"],
  ["Spotlight", "I fokus"],
  ["Fig & Cedar Nourishing Bar", "Närande schampokaka med fikon och cederträ"],
  ["A creamy nourishing shampoo bar where sun-ripened fig meets dry cedarwood, created for softer-feeling hair with a warm Mediterranean character.", "En krämigt vårdande schampokaka där solmoget fikon möter torrt cederträ, framtagen för en mjukare hårkänsla med varm medelhavskaraktär."],
  ["COSMOS-style formulation direction • Vegan-first • Concentrated format", "Formuleringsinriktning i COSMOS-stil • Vegansk utgångspunkt • Koncentrerat format"],
  ["The botanical palette", "Den botaniska paletten"],
  ["A Mediterranean vocabulary, distilled.", "Medelhavets uttryck, destillerat."],
  ["Herbal · aromatic", "Örtig · aromatisk"],
  ["Soft · sun-ripened", "Mjuk · solmogen"],
  ["Dry · grounding", "Torr · jordnära"],
  ["Bright · coastal", "Frisk · kustnära"],
  ["Solid by design", "Fast form, medveten design"],
  ["Less water to ship. Less packaging to leave behind.", "Mindre vatten att transportera. Mindre förpackning som blir kvar."],
  ["Solid haircare concentrates the ritual into a compact format. The product itself needs no plastic bottle, travels easily and avoids shipping the water that makes up much of a traditional liquid formula.", "Hårvård i fast form koncentrerar ritualen till ett kompakt format. Produkten behöver ingen plastflaska, är enkel att ta med och undviker transport av det vatten som utgör en stor del av traditionella flytande formuleringar."],
  ["Concentrated", "Koncentrerad"],
  ["A compact format designed around the active ritual.", "Ett kompakt format utformat kring den verksamma ritualen."],
  ["Bottle-free", "Utan flaska"],
  ["No plastic bottle for the product itself.", "Ingen plastflaska behövs för själva produkten."],
  ["Travel-ready", "Reseklar"],
  ["Small, solid and easy to pack without liquid limits.", "Liten, fast och enkel att packa utan begränsningar för vätskor."],
  ["Read our formulation philosophy", "Läs om vår formuleringsfilosofi"],
  ["The house", "Huset"],
  ["Voskopulence is a Mediterranean house of botanical rituals. Our first chapter takes form in concentrated solid haircare, where considered formulation, lower-waste design and a distinctive botanical palette come together in a quieter kind of luxury.", "Voskopulence är ett medelhavsinspirerat hus för botaniska ritualer. Vårt första kapitel tar form i koncentrerad hårvård i fast form, där genomtänkt formulering, resurssnål design och en distinkt botanisk palett möts i en mer lågmäld sorts lyx."],
  ["The first chapter", "Det första kapitlet"],
  ["The story begins with hair.", "Berättelsen börjar med håret."],
  ["Three solid formulas introduce the world of Voskopulence. Explore the collection and join the waitlist for first availability.", "Tre fasta formuleringar introducerar Voskopulences värld. Utforska kollektionen och anmäl dig till väntelistan för att få veta när produkterna blir tillgängliga."],
  ["Discover the first collection", "Upptäck den första kollektionen"],
  ["Our Bars", "Våra fasta hårvårdsprodukter"],
  ["The first chapter of Voskopulence: three concentrated formulas shaped around distinct hair rituals and one Mediterranean sensibility.", "Voskopulences första kapitel: tre koncentrerade formuleringar skapade för olika hårvårdsritualer och förenade av en medelhavsinspirerad känsla."],
  ["Pre-launch collection", "Kollektion inför lansering"],
  ["No payment today · Join the waitlist for first availability", "Ingen betalning i dag · Anmäl dig till väntelistan för att få veta när produkterna blir tillgängliga"],
  ["Planned price · Shipping additional", "Planerat pris · Frakt tillkommer"],
  ["per bar", "per styck"],
  ["Key ingredients:", "Nyckelingredienser:"],
  ["JOIN WAITLIST", "ANMÄL INTRESSE"],
  ["Pre-launch · Join the waitlist", "Inför lansering · Anmäl dig till väntelistan"],
  ["We&apos;re preparing our first small batch of Voskopulence bars. This product is not available to purchase yet. Leave your email below and we&apos;ll let you know as soon as it&apos;s in stock.", "Vi förbereder vår första mindre batch av Voskopulences fasta hårvårdsprodukter. Produkten går ännu inte att köpa. Lämna din e-postadress nedan så meddelar vi dig så snart den finns i lager."],
  ["Email address", "E-postadress"],
  ["You won&apos;t be charged now. This only subscribes you to a one-time notification when this bar becomes available.", "Du debiteras inte nu. Du anmäler dig endast till ett meddelande när produkten blir tillgänglig."],
  ["Sending...", "Skickar ..."],
  ["You’re on the list ✓", "Du står på listan ✓"],
  ["Notify me at launch", "Meddela mig vid lansering"],
  ["Something went wrong. Please try again in a moment.", "Något gick fel. Försök igen om en liten stund."],
  ["Contact us", "Kontakta oss"],
  ["Questions about the bars, ingredients, or wholesale? Send us a message and we&apos;ll get back to you as soon as we can.", "Har du frågor om produkterna, ingredienserna eller återförsäljning? Skicka ett meddelande så återkommer vi så snart vi kan."],
  ["Your name", "Ditt namn"],
  ["Message", "Meddelande"],
  ["Write your message here...", "Skriv ditt meddelande här ..."],
  ["Send message", "Skicka meddelande"],
  ["Thank you for contacting us. We&apos;ll get back to you as soon as possible.", "Tack för att du kontaktar oss. Vi återkommer så snart som möjligt."],
  ["You can also write to us directly at", "Du kan också skriva direkt till oss på"],
  ["Sustainability &amp; Formulation", "Hållbarhet och formulering"],
  ["A transparent look at our formulation direction, ingredient choices, lower-waste format and where official certification stands today.", "En transparent inblick i vår formuleringsinriktning, våra ingrediensval, det resurssnåla formatet och var vi står i fråga om officiell certifiering i dag."],
  ["Principle 01", "Princip 01"], ["Principle 02", "Princip 02"], ["Principle 03", "Princip 03"],
  ["Transparency first", "Transparens först"], ["Concentrated format", "Koncentrerat format"], ["Botanical character", "Botanisk karaktär"],
  ["What does “COSMOS” mean?", "Vad betyder ”COSMOS”?"],
  ["COSMOS is an independent European standard that defines how natural and organic cosmetics should be made. It covers:", "COSMOS är en oberoende europeisk standard som anger hur naturlig och ekologisk kosmetik ska tillverkas. Den omfattar:"],
  ["Which ingredients are allowed and in what form", "Vilka ingredienser som är tillåtna och i vilken form"],
  ["Minimum levels of natural / organic content", "Miniminivåer för naturligt och ekologiskt innehåll"],
  ["Rules on animal testing, biodegradable ingredients &amp; GMOs", "Regler om djurförsök, biologiskt nedbrytbara ingredienser och GMO"],
  ["Packaging, traceability and how formulas are checked by auditors", "Förpackningar, spårbarhet och hur formuleringar granskas av revisorer"],
  ["In short: COSMOS is about safe, well-documented formulas with a lower impact on people and the environment – not just marketing words like “green” or “clean”.", "Kort sagt handlar COSMOS om säkra, väldokumenterade formuleringar med mindre påverkan på människor och miljö – inte bara marknadsföringsord som ”grön” eller ”ren”."],
  ["Our formulation philosophy", "Vår formuleringsfilosofi"],
  ["Our bars are developed with a European lab that works with COSMOS-compliant formulations. For Voskopulence, we focus on:", "Våra fasta produkter utvecklas tillsammans med ett europeiskt laboratorium som arbetar med formuleringar i linje med COSMOS. För Voskopulence fokuserar vi på:"],
  ["High share of naturally-derived ingredients", "En hög andel ingredienser av naturligt ursprung"],
  ["Vegan &amp; cruelty-free formulations", "Veganska formuleringar utan djurförsök"],
  ["No deliberately added palm oil in the bar base", "Ingen avsiktligt tillsatt palmolja i produktbasen"],
  ["Botanical scents inspired by the Mediterranean", "Botaniska dofter inspirerade av Medelhavet"],
  ["As we finalise each bar, we work with the lab to ensure it fits the requirements for COSMOS-style formulations and good scalp tolerance.", "När vi färdigställer varje produkt arbetar vi med laboratoriet för att säkerställa att den följer kraven för formuleringar i COSMOS-stil och har god tolerans för hårbotten."],
  ["Solid bars, less waste", "Fast form, mindre avfall"],
  ["A solid bar means:", "En produkt i fast form innebär:"],
  ["No plastic bottle for the product itself", "Ingen plastflaska för själva produkten"],
  ["Much less water shipped compared with liquid shampoo", "Betydligt mindre vatten att transportera jämfört med flytande schampo"],
  ["Compact format that’s easier to ship and store", "Ett kompakt format som är enklare att transportera och förvara"],
  ["Packaging for Voskopulence bars is designed to be simple, protective and fully recyclable, with a focus on paper and cardboard rather than mixed materials.", "Förpackningarna till Voskopulences fasta produkter utformas för att vara enkla, skyddande och helt återvinningsbara, med fokus på papper och kartong i stället för blandmaterial."],
  ["A note on certifications &amp; honesty", "Om certifieringar och transparens"],
  ["We believe sustainability also means being honest about where we are today:", "För oss innebär hållbarhet också att vara ärliga om var vi står i dag:"],
  ["Our goal is to launch bars that are compatible with COSMOS-style requirements, using ingredients and bases that can be certified.", "Vårt mål är att lansera fasta produkter som är förenliga med krav i COSMOS-stil och använder ingredienser och baser som kan certifieras."],
  ["Official third-party certification (logos on pack, audited documents, etc.) is a separate step and will be clearly indicated when obtained.", "Officiell tredjepartscertifiering – exempelvis logotyper på förpackningen och granskad dokumentation – är ett separat steg och kommer att anges tydligt när den har erhållits."],
  ["Until then, we do not claim to be “certified COSMOS”; we simply share how and why the formulas are designed in that direction.", "Fram till dess påstår vi inte att produkterna är ”COSMOS-certifierade”; vi berättar i stället öppet hur och varför formuleringarna utvecklas i den riktningen."],
  ["If you ever have questions about ingredients, allergens or how to recycle our packaging in your country, you can always reach us at", "Om du har frågor om ingredienser, allergener eller hur våra förpackningar återvinns där du bor är du alltid välkommen att kontakta oss på"],
  ["Are Voskopulence bars officially COSMOS certified?", "Är Voskopulences fasta produkter officiellt COSMOS-certifierade?"],
  ["Not yet. Our current focus is on working with a lab that develops COSMOS-style formulas and on choosing ingredients that fit that philosophy. Once official certification is in place, it will be clearly visible on our packaging and on this page.", "Inte ännu. Just nu fokuserar vi på att arbeta med ett laboratorium som utvecklar formuleringar i COSMOS-stil och på att välja ingredienser som ligger i linje med den filosofin. När en officiell certifiering finns på plats kommer det att framgå tydligt på våra förpackningar och på den här sidan."],
  ["Are the bars suitable for vegans and cruelty-free?", "Är produkterna veganska och framtagna utan djurförsök?"],
  ["Our intention for Voskopulence is to keep all bars vegan and not tested on animals. We confirm this with our manufacturing partner for each batch and will never knowingly work with animal testing.", "Vår ambition är att alla Voskopulence-produkter ska vara veganska och inte testade på djur. Vi bekräftar detta med vår tillverkningspartner för varje batch och kommer aldrig medvetet att medverka till djurförsök."],
  ["Do the formulas contain sulfates or harsh detergents?", "Innehåller formuleringarna sulfater eller starka rengörande ämnen?"],
  ["The bars are formulated with gentler, modern surfactants that are compatible with COSMOS-style guidelines, rather than traditional SLS/SLES. They are designed to cleanse effectively while remaining respectful of the scalp when used as directed.", "Produkterna formuleras med mildare, moderna tensider som är förenliga med riktlinjer i COSMOS-stil, i stället för traditionell SLS/SLES. De är utformade för att rengöra effektivt och samtidigt vara skonsamma mot hårbotten när de används enligt anvisningarna."],
  ["A Mediterranean house · Pre-launch", "Ett medelhavsinspirerat hus · Inför lansering"],
  ["A world of Mediterranean rituals, beginning in solid form.", "En värld av medelhavsinspirerade ritualer, med början i fast form."],
  ["Our first collection explores botanical solid haircare through considered formulation, a lower-waste format and a distinctly Mediterranean point of view.", "Vår första kollektion utforskar botanisk hårvård i fast form genom genomtänkt formulering, ett resurssnålt format och ett tydligt medelhavsperspektiv."],
  ["Discover", "Upptäck"],
  ["Product questions, ingredients and wholesale enquiries are welcome.", "Frågor om produkter, ingredienser och återförsäljning är välkomna."],
  ["Designed around Mediterranean botanicals", "Utformad kring Medelhavets botaniska råvaror"],
  ["You&apos;re on the list", "Du står på listan"],
  ["Thank you for your interest in Voskopulence. We&apos;ll email you as soon as this bar is ready for its first batch.", "Tack för ditt intresse för Voskopulence. Vi skickar ett mejl så snart produkten är klar för sin första produktionsomgång."],
  ["If you think you made a typo in your email address, you can simply go back and submit the form again.", "Om du tror att du skrev fel e-postadress kan du gå tillbaka och skicka formuläret igen."],
  ["Back to the collection", "Tillbaka till kollektionen"],
  ["Thank you for contacting us!", "Tack för att du kontaktar oss!"],
  ["We’ve received your message and will get back to you as soon as possible.", "Vi har tagit emot ditt meddelande och återkommer så snart som möjligt."],
];

const stringTranslations = [
  ["Herbal Mint & Rosemary Shampoo Bar", "Schampokaka med mynta och rosmarin"],
  ["A refreshing herbal cleanse with rosemary, wild mint and nettle for a light, revitalised finish.", "En uppfriskande örtig rengöring med rosmarin, vild mynta och nässla för en lätt och vitaliserad känsla."],
  ["Normal to oily hair · Scalps prone to excess oil or buildup", "Normalt till fett hår · Hårbotten med tendens till överskott av talg eller produktrester"],
  ["Gently cleanses without leaving hair feeling stripped", "Rengör skonsamt utan att håret känns uttorkat"],
  ["Helps roots feel fresh, light and balanced", "Hjälper hårrötterna att kännas fräscha, lätta och balanserade"],
  ["Rich, creamy lather with an invigorating herbal scent", "Rikt, krämigt lödder med en uppiggande örtig doft"],
  ["Coconut oil, olive oil, castor oil, shea butter, wild mint essential oil, rosemary essential oil & nettle leaf powder", "Kokosolja, olivolja, ricinolja, sheasmör, eterisk olja av vild mynta, eterisk rosmarinolja och nässelpulver"],
  ["Fig & Cedar Nourishing Shampoo Bar", "Närande schampokaka med fikon och cederträ"],
  ["A creamy, comforting cleanse with a warm fig-and-cedar character for hair that benefits from extra softness.", "En krämig och vårdande rengöring med varm karaktär av fikon och cederträ för hår som behöver extra mjukhet."],
  ["Normal to dry hair · Frizz-prone lengths or dry-feeling ends", "Normalt till torrt hår · Frissiga längder eller toppar som känns torra"],
  ["Gently cleanses while helping preserve a soft, conditioned feel", "Rengör skonsamt och hjälper håret att behålla en mjuk, vårdad känsla"],
  ["Helps smooth frizz and improve manageability", "Hjälper till att släta ut frissighet och göra håret mer lätthanterligt"],
  ["Leaves hair supple with a warm, woody-fruity scent", "Lämnar håret följsamt med en varm, träig och fruktig doft"],
  ["Fig extract, cedarwood, lavender, coconut oil, olive oil, castor oil & shea butter", "Fikonextrakt, cederträ, lavendel, kokosolja, olivolja, ricinolja och sheasmör"],
  ["Lemon Sea Breeze Conditioner Bar", "Balsamkaka med citron och havsbris"],
  ["A lightweight solid conditioner with bright citrus and coastal freshness, created to soften and detangle after washing.", "Ett lätt balsam i fast form med frisk citrus och kustnära karaktär, utvecklat för att mjukgöra och reda ut håret efter tvätt."],
  ["All hair types · Especially hair that tangles easily or needs lightweight softness", "Alla hårtyper · Särskilt hår som lätt trasslar sig eller behöver lätt mjukhet"],
  ["Helps detangle and improve combability", "Hjälper till att reda ut håret och gör det lättare att kamma"],
  ["Leaves hair smoother, softer and more manageable", "Lämnar håret slätare, mjukare och mer lätthanterligt"],
  ["Adds light shine without a heavy finish", "Ger lätt glans utan att tynga ned"],
  ["Lemon peel oil, jojoba oil, coconut oil, olive oil, sea minerals & conditioning esters", "Citronolja, jojobaolja, kokosolja, olivolja, havsmineraler och konditionerande estrar"],
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceFlexible(source, from, to) {
  const pattern = escapeRegex(from).replace(/\s+/g, "\\s+");
  return source.replace(new RegExp(pattern, "g"), to);
}

function translate(source) {
  for (const [from, to] of stringTranslations) source = source.split(from).join(to);
  for (const [from, to] of [...textTranslations].sort((a, b) => b[0].length - a[0].length)) source = replaceFlexible(source, from, to);
  source = source
    .replace(/>\s*Home\s*</g, ">Hem<")
    .replace(/>\s*Shop\s*</g, ">Butik<")
    .replace(/>\s*About\s*</g, ">Om oss<")
    .replace(/>\s*Sustainability\s*</g, ">Hållbarhet<")
    .replace(/>\s*Contact\s*</g, ">Kontakt<")
    .replace(/>\s*Menu\s*</g, ">Meny<")
    .replace(/aria-label="Open menu"/g, 'aria-label="Öppna meny"')
    .replace(/aria-label="Close menu"/g, 'aria-label="Stäng meny"')
    .replace(/aria-label="Footer navigation"/g, 'aria-label="Sidfotsnavigering"')
    .replace(/aria-label="Language"/g, 'aria-label="Språk"')
    .replace(/aria-label="Discover the collection"/g, 'aria-label="Upptäck kollektionen"')
    .replace(/aria-label="Close"/g, 'aria-label="Stäng"')
    .replace(/aria-label="Go to home"/g, 'aria-label="Gå till startsidan"')
    .replace(/placeholder="John Doe"/g, 'placeholder="Förnamn Efternamn"')
    .replace(/alt="Mediterranean terrace"/g, 'alt="Terrass vid Medelhavet"')
    .replaceAll('{ name: "Rosemary",', '{ name: "Rosmarin",')
    .replaceAll('{ name: "Fig",', '{ name: "Fikon",')
    .replaceAll('{ name: "Cedar",', '{ name: "Ceder",')
    .replaceAll('{ name: "Lemon",', '{ name: "Citron",');
  return source;
}

function localiseRoutes(source) {
  const routes = [
    ["/#about", "/sv#about"],
    ["/sustainability", "/sv/sustainability"],
    ["/contact", "/sv/contact"],
    ["/shop", "/sv/shop"],
    ["/thank-you", "/sv/thank-you"],
    ["/", "/sv"],
  ];
  for (const [from, to] of routes) {
    source = source
      .replaceAll(`href="${from}"`, `href="${to}"`)
      .replaceAll(`router.push("${from}")`, `router.push("${to}")`);
  }
  return source;
}

function addLanguageControls(source, englishHref, swedishHref, locale) {
  const currentEnglish = locale === "en";
  const desktop = `
            <div className="ml-1 flex items-center gap-2 border-l border-white/30 pl-5 text-[0.68rem] font-semibold uppercase tracking-[0.12em]" aria-label="Language">
              <a href="${swedishHref}" lang="sv" className="hover:text-white ${currentEnglish ? "text-white/70" : "text-white"}"${currentEnglish ? "" : ' aria-current="page"'}>Svenska</a>
              <span className="text-white/35" aria-hidden="true">/</span>
              <a href="${englishHref}" lang="en" className="hover:text-white ${currentEnglish ? "text-white" : "text-white/70"}"${currentEnglish ? ' aria-current="page"' : ""}>English</a>
            </div>`;
  const desktopStart = source.indexOf('<nav className="grow basis-0 hidden xl:flex');
  if (desktopStart < 0) throw new Error("SWEDISH: desktop navigation not found");
  const desktopEnd = source.indexOf("</nav>", desktopStart);
  source = source.slice(0, desktopEnd) + desktop + "\n          " + source.slice(desktopEnd);

  const mobileStart = source.indexOf('<ul className="flex flex-col items-center gap-8');
  if (mobileStart < 0) throw new Error("SWEDISH: mobile navigation not found");
  const mobileEnd = source.indexOf("</ul>", mobileStart);
  const mobile = `
                  <li className="mt-1 flex items-center gap-3 border-t border-white/25 pt-6 text-sm font-semibold uppercase tracking-[0.14em]" aria-label="Language">
                    <a href="${swedishHref}" lang="sv" className="hover:text-white ${currentEnglish ? "text-white/70" : "text-white"}"${currentEnglish ? "" : ' aria-current="page"'}>Svenska</a>
                    <span className="text-white/35" aria-hidden="true">/</span>
                    <a href="${englishHref}" lang="en" className="hover:text-white ${currentEnglish ? "text-white" : "text-white/70"}"${currentEnglish ? ' aria-current="page"' : ""}>English</a>
                  </li>`;
  source = source.slice(0, mobileEnd) + mobile + "\n                " + source.slice(mobileEnd);
  return source;
}

function fixComponentImports(source, depth) {
  const prefix = depth === 1 ? "../_components/" : "../../_components/";
  return source
    .replace(/from "\.\.?\/_components\//g, `from "${prefix}`)
    .replace(/import SiteFooter from "[^"]+";/, `import SwedishSiteFooter from "${prefix}SwedishSiteFooter";`)
    .replaceAll("<SiteFooter />", "<SwedishSiteFooter />");
}

for (const page of pageDefinitions) {
  const sourceUrl = new URL(page.source, appRoot);
  let englishSource = await readFile(sourceUrl, "utf8");
  englishSource = addLanguageControls(englishSource, page.english, page.swedish, "en");
  await writeFile(sourceUrl, englishSource, "utf8");

  let swedishSource = localiseRoutes(englishSource);
  swedishSource = translate(swedishSource);
  swedishSource = fixComponentImports(swedishSource, page.depth);
  // Keep each language name linked to the matching page and mark Swedish as current.
  swedishSource = swedishSource
    .replaceAll(`href="/sv${page.english === "/" ? "" : page.english}" lang="en"`, `href="${page.english}" lang="en"`)
    .replaceAll(`href="${page.swedish}" lang="sv" className="hover:text-white text-white/70">Svenska</a>`, `href="${page.swedish}" lang="sv" className="hover:text-white text-white" aria-current="page">Svenska</a>`)
    .replaceAll(`href="${page.english}" lang="en" className="hover:text-white text-white" aria-current="page">English</a>`, `href="${page.english}" lang="en" className="hover:text-white text-white/70">English</a>`);
  const targetUrl = new URL(page.target, appRoot);
  await mkdir(new URL("./", targetUrl), { recursive: true });
  await writeFile(targetUrl, swedishSource, "utf8");
}

let footer = await readFile(new URL("_components/SiteFooter.tsx", appRoot), "utf8");
let swedishFooter = translate(localiseRoutes(footer)).replace("function SiteFooter", "function SwedishSiteFooter");
await writeFile(new URL("_components/SwedishSiteFooter.tsx", appRoot), swedishFooter, "utf8");

const thankYouPages = [
  { source: "thank-you/page.tsx", target: "sv/thank-you/page.tsx" },
  { source: "contact/thank-you/page.tsx", target: "sv/contact/thank-you/page.tsx" },
];
for (const page of thankYouPages) {
  let source = await readFile(new URL(page.source, appRoot), "utf8");
  source = translate(localiseRoutes(source));
  const targetUrl = new URL(page.target, appRoot);
  await mkdir(new URL("./", targetUrl), { recursive: true });
  await writeFile(targetUrl, source, "utf8");
}

const metadataLayouts = {
  "sv/layout.tsx": `import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Voskopulence — Medelhavsinspirerad hårvård i fast form", template: "%s | Voskopulence" },
  description: "Medelhavsinspirerade schampo- och balsamkakor utvecklade med ingredienser av naturligt ursprung och genomtänkta formuleringsprinciper.",
  alternates: { canonical: "/sv", languages: { "en": "/", "sv-SE": "/sv" } },
};

export default function SwedishLayout({ children }: { children: React.ReactNode }) { return children; }
`,
  "sv/shop/layout.tsx": `import type { Metadata } from "next";
export const metadata: Metadata = { title: "Kollektionen", description: "Utforska Voskopulences första schampo- och balsamkakor inspirerade av Medelhavets botaniska råvaror.", alternates: { canonical: "/sv/shop", languages: { "en": "/shop", "sv-SE": "/sv/shop" } } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
`,
  "sv/contact/layout.tsx": `import type { Metadata } from "next";
export const metadata: Metadata = { title: "Kontakt", description: "Kontakta Voskopulence om produkter, ingredienser, formulering eller återförsäljning.", alternates: { canonical: "/sv/contact", languages: { "en": "/contact", "sv-SE": "/sv/contact" } } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
`,
  "sv/sustainability/layout.tsx": `import type { Metadata } from "next";
export const metadata: Metadata = { title: "Hållbarhet och formulering", description: "Så arbetar Voskopulence med ingredienser av naturligt ursprung, fast format, förpackningar och formuleringsprinciper i COSMOS-stil.", alternates: { canonical: "/sv/sustainability", languages: { "en": "/sustainability", "sv-SE": "/sv/sustainability" } } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
`,
};
for (const [path, content] of Object.entries(metadataLayouts)) {
  const url = new URL(path, appRoot);
  await mkdir(new URL("./", url), { recursive: true });
  await writeFile(url, content, "utf8");
}

let rootLayout = await readFile(new URL("layout.tsx", appRoot), "utf8");
rootLayout = rootLayout
  .replace('import { Suspense } from "react";', 'import { Suspense } from "react";\nimport Script from "next/script";')
  .replace("export const metadata: Metadata = {", 'export const metadata: Metadata = {\n  metadataBase: new URL("https://www.voskopulence.com"),\n  alternates: { canonical: "/", languages: { "en": "/", "sv-SE": "/sv" } },')
  .replace('lang="en"', 'lang="en" suppressHydrationWarning')
  .replace("      <head>", `      <head>\n        <Script id="document-language" strategy="beforeInteractive">{\`document.documentElement.lang=location.pathname.startsWith('/sv')?'sv':'en'\`}</Script>`);
await writeFile(new URL("layout.tsx", appRoot), rootLayout, "utf8");

for (const [path, canonical, swedish] of [
  ["shop/layout.tsx", "/shop", "/sv/shop"],
  ["contact/layout.tsx", "/contact", "/sv/contact"],
  ["sustainability/layout.tsx", "/sustainability", "/sv/sustainability"],
]) {
  const url = new URL(path, appRoot);
  let source = await readFile(url, "utf8");
  source = source.replace("};", `  alternates: { canonical: "${canonical}", languages: { "en": "${canonical}", "sv-SE": "${swedish}" } },\n};`);
  await writeFile(url, source, "utf8");
}

console.log("SWEDISH_SITE_PREPARED", {
  routes: pageDefinitions.map((page) => page.swedish),
  desktopLanguageNames: true,
  mobileLanguageNames: true,
  translatedForms: true,
  localisedMetadata: true,
  alternateLanguages: true,
});
