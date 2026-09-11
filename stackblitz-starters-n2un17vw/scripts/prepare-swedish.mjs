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
  ["Botanical rituals shaped by the Mediterranean, beginning with concentrated solid haircare.", "Botaniska ritualer med rötter i Medelhavet – med koncentrerad hårvård i fast form som första kapitel."],
  ["Discover the collection", "Upptäck kollektionen"],
  ["Explore the collection", "Utforska kollektionen"],
  ["Spotlight", "I fokus"],
  ["Fig & Cedar Nourishing Bar", "Närande schampokaka med fikon & cederträ"],
  ["A creamy nourishing shampoo bar where sun-ripened fig meets dry cedarwood, created for softer-feeling hair with a warm Mediterranean character.", "En krämigt vårdande schampokaka där solmoget fikon möter torrt cederträ – skapad för att ge håret en mjukare känsla och en varm, medelhavsinspirerad karaktär."],
  ["COSMOS-style formulation direction • Vegan-first • Concentrated format", "COSMOS-inspirerad formulering • Vegansk inriktning • Koncentrerat format"],
  ["The botanical palette", "Den botaniska paletten"],
  ["A Mediterranean vocabulary, distilled.", "Medelhavets botaniska språk, destillerat."],
  ["Herbal · aromatic", "Örtig · aromatisk"],
  ["Soft · sun-ripened", "Mjuk · solmogen"],
  ["Dry · grounding", "Torr · jordnära"],
  ["Bright · coastal", "Frisk · kustnära"],
  ["Solid by design", "Fast form, medvetet vald"],
  ["Less water to ship. Less packaging to leave behind.", "Mindre vatten att transportera. Mindre förpackning att lämna efter sig."],
  ["Solid haircare concentrates the ritual into a compact format. The product itself needs no plastic bottle, travels easily and avoids shipping the water that makes up much of a traditional liquid formula.", "Hårvård i fast form koncentrerar hårvårdsritualen till ett kompakt format. Ingen plastflaska behövs, produkten är enkel att ta med och du slipper transportera det vatten som utgör en stor del av traditionella flytande formulor."],
  ["Concentrated", "Koncentrerad"],
  ["A compact format designed around the active ritual.", "Ett kompakt format där själva hårvården står i centrum."],
  ["Bottle-free", "Utan plastflaska"],
  ["No plastic bottle for the product itself.", "Ingen plastflaska behövs för själva produkten."],
  ["Travel-ready", "Redo för resan"],
  ["Small, solid and easy to pack without liquid limits.", "Liten, fast och enkel att packa – utan begränsningar för vätskor."],
  ["Read our formulation philosophy", "Läs om vår formuleringsfilosofi"],
  ["The house", "The house"],
  ["Voskopulence is a Mediterranean house of botanical rituals. Our first chapter takes form in concentrated solid haircare, where considered formulation, lower-waste design and a distinctive botanical palette come together in a quieter kind of luxury.", "Voskopulence är ett medelhavsinspirerat varumärke där botaniska ritualer möter genomtänkt formgivning. Vårt första kapitel är koncentrerad hårvård i fast form, där noggrant utvecklade formuleringar, mindre förpackningsavfall och en distinkt botanisk palett förenas i en lågmäld form av lyx."],
  ["The first chapter", "Det första kapitlet"],
  ["The story begins with hair.", "Berättelsen börjar med håret."],
  ["Three solid formulas introduce the world of Voskopulence. Explore the collection and join the waitlist for first availability.", "Tre fasta formuleringar introducerar Voskopulences värld. Utforska kollektionen och anmäl ditt intresse för att få besked när produkterna blir tillgängliga."],
  ["Discover the first collection", "Upptäck den första kollektionen"],
  ["Our Bars", "Kollektionen"],
  ["The first chapter of Voskopulence: three concentrated formulas shaped around distinct hair rituals and one Mediterranean sensibility.", "Voskopulences första kapitel: tre koncentrerade formuleringar för olika hårbehov, förenade av en tydligt medelhavsinspirerad känsla."],
  ["Pre-launch collection", "Förhandsvisning av kollektionen"],
  ["No payment today · Join the waitlist for first availability", "Ingen betalning nu · Anmäl dig för att få besked vid lansering"],
  ["Planned price · Shipping additional", "Planerat pris · Frakt tillkommer"],
  ["per bar", "per produkt"],
  ["Key ingredients:", "Nyckelingredienser:"],
  ["JOIN WAITLIST", "ANMÄL INTRESSE"],
  ["Pre-launch · Join the waitlist", "Inför lansering · Anmäl intresse"],
  ["We&apos;re preparing our first small batch of Voskopulence bars. This product is not available to purchase yet. Leave your email below and we&apos;ll let you know as soon as it&apos;s in stock.", "Vi förbereder vår första mindre produktion av Voskopulence. Den här produkten går ännu inte att köpa. Lämna din e-postadress så hör vi av oss så snart den finns tillgänglig."],
  ["Email address", "E-postadress"],
  ["You won&apos;t be charged now. This only subscribes you to a one-time notification when this bar becomes available.", "Du debiteras ingenting. Du får endast ett engångsmejl när produkten blir tillgänglig."],
  ["Sending...", "Skickar…"],
  ["You’re on the list ✓", "Du är med på listan ✓"],
  ["Notify me at launch", "Meddela mig vid lansering"],
  ["Something went wrong. Please try again in a moment.", "Något gick fel. Försök igen om en stund."],
  ["Contact us", "Kontakta oss"],
  ["Questions about the bars, ingredients, or wholesale? Send us a message and we&apos;ll get back to you as soon as we can.", "Har du frågor om produkterna, ingredienserna eller återförsäljning? Skicka gärna ett meddelande, så återkommer vi så snart vi kan."],
  ["Your name", "Ditt namn"],
  ["Message", "Meddelande"],
  ["Write your message here...", "Skriv ditt meddelande här…"],
  ["Send message", "Skicka meddelande"],
  ["Thank you for contacting us. We&apos;ll get back to you as soon as possible.", "Tack för ditt meddelande. Vi återkommer så snart vi kan."],
  ["You can also write to us directly at", "Du kan också mejla oss direkt på"],
  ["Sustainability &amp; Formulation", "Hållbarhet & formulering"],
  ["A transparent look at our formulation direction, ingredient choices, lower-waste format and where official certification stands today.", "En öppen inblick i hur vi arbetar med formuleringar, ingrediensval, resurssnålare format och vägen mot officiell certifiering."],
  ["Principle 01", "Princip 01"], ["Principle 02", "Princip 02"], ["Principle 03", "Princip 03"],
  ["Transparency first", "Transparens först"], ["Concentrated format", "Koncentrerad form"], ["Botanical character", "Botanisk karaktär"],
  ["What does “COSMOS” mean?", "Vad innebär COSMOS?"],
  ["COSMOS is an independent European standard that defines how natural and organic cosmetics should be made. It covers:", "COSMOS är en internationell standard för naturlig och ekologisk kosmetika. Den ställer bland annat krav på:"],
  ["Which ingredients are allowed and in what form", "Vilka ingredienser som får användas och i vilken form"],
  ["Minimum levels of natural / organic content", "Miniminivåer för naturligt och ekologiskt innehåll"],
  ["Rules on animal testing, biodegradable ingredients &amp; GMOs", "Regler kring djurförsök, biologisk nedbrytbarhet och GMO"],
  ["Packaging, traceability and how formulas are checked by auditors", "Förpackningar, spårbarhet och hur formuleringarna granskas"],
  ["In short: COSMOS is about safe, well-documented formulas with a lower impact on people and the environment – not just marketing words like “green” or “clean”.", "Kort sagt ställer COSMOS krav på säkra, väldokumenterade formuleringar med hänsyn till både människor och miljö – inte bara marknadsföringsord som ”grön” eller ”clean”."],
  ["Our formulation philosophy", "Vår formuleringsfilosofi"],
  ["Our bars are developed with a European lab that works with COSMOS-compliant formulations. For Voskopulence, we focus on:", "Våra produkter utvecklas tillsammans med ett europeiskt laboratorium som arbetar med formuleringar anpassade till COSMOS-krav. För Voskopulence prioriterar vi:"],
  ["High share of naturally-derived ingredients", "Hög andel ingredienser av naturligt ursprung"],
  ["Vegan &amp; cruelty-free formulations", "Veganska formuleringar utan djurförsök"],
  ["No deliberately added palm oil in the bar base", "Ingen avsiktligt tillsatt palmolja i basformulan"],
  ["Botanical scents inspired by the Mediterranean", "Botaniska doftprofiler inspirerade av Medelhavet"],
  ["As we finalise each bar, we work with the lab to ensure it fits the requirements for COSMOS-style formulations and good scalp tolerance.", "När varje produkt färdigställs arbetar vi tillsammans med laboratoriet för att säkerställa att formuleringen ligger i linje med COSMOS-principerna och är framtagen med fokus på att vara skonsam mot hårbotten."],
  ["Solid bars, less waste", "Fast form, mindre avfall"],
  ["A solid bar means:", "Hårvård i fast form innebär:"],
  ["No plastic bottle for the product itself", "Ingen plastflaska för själva produkten"],
  ["Much less water shipped compared with liquid shampoo", "Mindre vatten behöver transporteras jämfört med flytande schampo"],
  ["Compact format that’s easier to ship and store", "Ett kompakt format som är enklare att transportera och förvara"],
  ["Packaging for Voskopulence bars is designed to be simple, protective and fully recyclable, with a focus on paper and cardboard rather than mixed materials.", "Förpackningarna till Voskopulence utformas för att vara enkla, skyddande och helt återvinningsbara, med fokus på papper och kartong framför blandade material."],
  ["A note on certifications &amp; honesty", "Om certifiering & transparens"],
  ["We believe sustainability also means being honest about where we are today:", "För oss handlar hållbarhet också om att vara tydliga med var vi står i dag:"],
  ["Our goal is to launch bars that are compatible with COSMOS-style requirements, using ingredients and bases that can be certified.", "Vårt mål är att lansera formuleringar som ligger i linje med COSMOS-kraven och bygger på ingredienser och baser som kan certifieras."],
  ["Official third-party certification (logos on pack, audited documents, etc.) is a separate step and will be clearly indicated when obtained.", "En officiell tredjepartscertifiering – med granskad dokumentation och rätt att använda certifieringsmärkning – är ett separat steg. När den finns på plats kommer vi att ange det tydligt."],
  ["Until then, we do not claim to be “certified COSMOS”; we simply share how and why the formulas are designed in that direction.", "Fram till dess beskriver vi inte produkterna som COSMOS-certifierade. I stället berättar vi öppet hur och varför formuleringarna utvecklas i den riktningen."],
  ["If you ever have questions about ingredients, allergens or how to recycle our packaging in your country, you can always reach us at", "Har du frågor om ingredienser, allergener eller hur våra förpackningar ska återvinnas där du bor är du alltid välkommen att kontakta oss på"],
  ["Are Voskopulence bars officially COSMOS certified?", "Är Voskopulences produkter officiellt COSMOS-certifierade?"],
  ["Not yet. Our current focus is on working with a lab that develops COSMOS-style formulas and on choosing ingredients that fit that philosophy. Once official certification is in place, it will be clearly visible on our packaging and on this page.", "Inte ännu. Just nu arbetar vi med ett laboratorium som utvecklar formuleringar i linje med COSMOS-principerna och väljer ingredienser utifrån samma inriktning. När en officiell certifiering finns på plats kommer det att framgå tydligt på både förpackningen och den här sidan."],
  ["Are the bars suitable for vegans and cruelty-free?", "Är produkterna veganska och inte testade på djur?"],
  ["Our intention for Voskopulence is to keep all bars vegan and not tested on animals. We confirm this with our manufacturing partner for each batch and will never knowingly work with animal testing.", "Vår ambition är att samtliga Voskopulence-produkter ska vara veganska och inte testas på djur. Detta bekräftar vi med vår tillverkningspartner för varje produktionsomgång, och vi kommer inte medvetet att samarbeta med aktörer som testar kosmetika på djur."],
  ["Do the formulas contain sulfates or harsh detergents?", "Innehåller formuleringarna sulfater eller starka rengörande tensider?"],
  ["The bars are formulated with gentler, modern surfactants that are compatible with COSMOS-style guidelines, rather than traditional SLS/SLES. They are designed to cleanse effectively while remaining respectful of the scalp when used as directed.", "Produkterna formuleras med mildare, moderna tensider i linje med COSMOS-principerna, i stället för traditionella SLS/SLES. De är utvecklade för att rengöra effektivt utan att vara onödigt hårda mot hårbotten vid normal användning."],
  ["A Mediterranean house · Pre-launch", "Medelhavsinspirerad hårvård · Inför lansering"],
  ["A world of Mediterranean rituals, beginning in solid form.", "En värld av medelhavsinspirerade ritualer – med hårvård i fast form som första kapitel."],
  ["Our first collection explores botanical solid haircare through considered formulation, a lower-waste format and a distinctly Mediterranean point of view.", "Vår första kollektion förenar botaniskt inspirerad hårvård i fast form med genomtänkta formuleringar, mindre förpackningsavfall och en tydlig känsla av Medelhavet."],
  ["Discover", "Upptäck"],
  ["Product questions, ingredients and wholesale enquiries are welcome.", "Har du frågor om produkterna, ingredienserna eller återförsäljning? Hör gärna av dig."],
  ["Designed around Mediterranean botanicals", "Inspirerad av Medelhavets botaniska råvaror"],
  ["You&apos;re on the list", "Du är med på listan"],
  ["Thank you for your interest in Voskopulence. We&apos;ll email you as soon as this bar is ready for its first batch.", "Tack för ditt intresse för Voskopulence. Vi mejlar dig så snart den här produkten är redo för vår första lansering."],
  ["If you think you made a typo in your email address, you can simply go back and submit the form again.", "Om du tror att du råkade skriva fel e-postadress kan du gå tillbaka och skicka formuläret igen."],
  ["Back to the collection", "Tillbaka till kollektionen"],
  ["Thank you for contacting us!", "Tack för ditt meddelande!"],
  ["We’ve received your message and will get back to you as soon as possible.", "Vi har tagit emot ditt meddelande och återkommer så snart vi kan."],
];

const stringTranslations = [
  ["Herbal Mint & Rosemary Shampoo Bar", "Schampokaka med mynta & rosmarin"],
  ["A refreshing herbal cleanse with rosemary, wild mint and nettle for a light, revitalised finish.", "En fräsch, örtig rengöring med rosmarin, vild mynta och nässla som lämnar håret lätt och uppfriskat."],
  ["Normal to oily hair · Scalps prone to excess oil or buildup", "Normalt till fett hår · Hårbotten som lätt blir fet eller får produktrester"],
  ["Gently cleanses without leaving hair feeling stripped", "Rengör skonsamt utan att håret känns strävt eller uttorkat"],
  ["Helps roots feel fresh, light and balanced", "Hjälper hårrötterna att kännas fräscha, lätta och i balans"],
  ["Rich, creamy lather with an invigorating herbal scent", "Rikt, krämigt lödder med en uppiggande örtig doft"],
  ["Coconut oil, olive oil, castor oil, shea butter, wild mint essential oil, rosemary essential oil & nettle leaf powder", "Kokosolja, olivolja, ricinolja, sheasmör, eterisk olja av vild mynta, eterisk rosmarinolja och nässelpulver"],
  ["Fig & Cedar Nourishing Shampoo Bar", "Närande schampokaka med fikon & cederträ"],
  ["A creamy, comforting cleanse with a warm fig-and-cedar character for hair that benefits from extra softness.", "En krämig, vårdande rengöring med varm doftkaraktär av fikon och cederträ, för hår som mår bra av extra mjukhet."],
  ["Normal to dry hair · Frizz-prone lengths or dry-feeling ends", "Normalt till torrt hår · Längder som lätt blir frissiga eller toppar som känns torra"],
  ["Gently cleanses while helping preserve a soft, conditioned feel", "Rengör skonsamt och hjälper håret att behålla en mjuk, vårdad känsla"],
  ["Helps smooth frizz and improve manageability", "Hjälper till att dämpa friss och gör håret lättare att hantera"],
  ["Leaves hair supple with a warm, woody-fruity scent", "Lämnar håret mjukt och följsamt med en varm, träig och fruktig doft"],
  ["Fig extract, cedarwood, lavender, coconut oil, olive oil, castor oil & shea butter", "Fikonextrakt, cederträ, lavendel, kokosolja, olivolja, ricinolja och sheasmör"],
  ["Lemon Sea Breeze Conditioner Bar", "Balsamkaka med citron & havsbris"],
  ["A lightweight solid conditioner with bright citrus and coastal freshness, created to soften and detangle after washing.", "Ett lätt balsam i fast form med frisk citrus och en känsla av havsbris, utvecklat för att mjukgöra och reda ut håret efter tvätt."],
  ["All hair types · Especially hair that tangles easily or needs lightweight softness", "Alla hårtyper · Särskilt för hår som lätt trasslar sig eller behöver mjukhet utan tyngd"],
  ["Helps detangle and improve combability", "Hjälper till att reda ut håret och gör det enklare att kamma igenom"],
  ["Leaves hair smoother, softer and more manageable", "Lämnar håret slätare, mjukare och lättare att hantera"],
  ["Adds light shine without a heavy finish", "Ger lätt glans utan att tynga ner"],
  ["Lemon peel oil, jojoba oil, coconut oil, olive oil, sea minerals & conditioning esters", "Citronolja, jojobaolja, kokosolja, olivolja, havsmineraler och vårdande estrar"],
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
  description: "Medelhavsinspirerade schampo- och balsamkakor med ingredienser av naturligt ursprung, genomtänkta formuleringar och ett koncentrerat format.",
  alternates: { canonical: "/sv", languages: { "en": "/", "sv-SE": "/sv" } },
};

export default function SwedishLayout({ children }: { children: React.ReactNode }) { return children; }
`,
  "sv/shop/layout.tsx": `import type { Metadata } from "next";
export const metadata: Metadata = { title: "Kollektionen", description: "Upptäck Voskopulences första schampo- och balsamkakor, inspirerade av Medelhavets botaniska ingredienser.", alternates: { canonical: "/sv/shop", languages: { "en": "/shop", "sv-SE": "/sv/shop" } } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
`,
  "sv/contact/layout.tsx": `import type { Metadata } from "next";
export const metadata: Metadata = { title: "Kontakt", description: "Kontakta Voskopulence om produkter, ingredienser, formuleringar eller återförsäljning.", alternates: { canonical: "/sv/contact", languages: { "en": "/contact", "sv-SE": "/sv/contact" } } };
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
`,
  "sv/sustainability/layout.tsx": `import type { Metadata } from "next";
export const metadata: Metadata = { title: "Hållbarhet & formulering", description: "Så arbetar Voskopulence med ingredienser av naturligt ursprung, hårvård i fast form, förpackningar och COSMOS-inspirerade formuleringsprinciper.", alternates: { canonical: "/sv/sustainability", languages: { "en": "/sustainability", "sv-SE": "/sv/sustainability" } } };
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
