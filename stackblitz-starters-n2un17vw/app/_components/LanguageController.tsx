"use client";

import { useEffect, useState } from "react";

type Lang = "sv" | "en";

const translations: Record<string, string> = {
  "Shop": "Butik",
  "Home": "Hem",
  "About": "Om oss",
  "About us": "Om oss",
  "Sustainability": "Hållbarhet",
  "Contact": "Kontakt",
  "Contact us": "Kontakta oss",
  "Menu": "Meny",
  "Welcome to Voskopulence": "Välkommen till Voskopulence",
  "Solid shampoo & conditioner bars crafted to COSMOS standards with botanicals inspired by sunlit coasts — rosemary, lemon, cedar & fig.": "Fasta schampo- och balsamkakor framtagna enligt COSMOS-standarder, med botaniska ingredienser inspirerade av soliga Medelhavskuster — rosmarin, citron, ceder och fikon.",
  "Spotlight": "I fokus",
  "Mediterranean Rosemary Bar": "Medelhavsbar med rosmarin",
  "Solid shampoo crafted to COSMOS standards with rosemary and mint. Clean, concentrated, travel-ready.": "Fast schampo framtaget enligt COSMOS-standarder med rosmarin och mynta. Rent, koncentrerat och perfekt för resan.",
  "Discover the bar": "Upptäck baren",
  "Learn about the formula": "Läs om formulan",
  "COSMOS-standard • Vegan & Cruelty-Free • 40+ washes": "COSMOS-standard • Vegansk & cruelty-free • 40+ tvättar",
  "Founded in 2024, Voskopulence emerged from a deep passion for creating organic, eco-conscious, and luxurious hair care solutions. Our exclusive shampoo and conditioner bars are thoughtfully crafted with naturally-derived ingredients inspired by the rich, natural bounty of the Mediterranean. Each formula is palm-oil-free, vegan, and cruelty-free, bringing you closer to nature while honoring ethical beauty. Each bar echoes the timeless beauty and serenity of the Mediterranean Sea. At Voskopulence, we are committed to offering a sophisticated hair-care experience that nurtures your hair while embracing the essence of sustainable living.": "Voskopulence grundades 2024 ur en stark passion för att skapa ekologiskt medveten och lyxig hårvård. Våra exklusiva schampo- och balsamkakor är omsorgsfullt framtagna med naturligt härledda ingredienser, inspirerade av Medelhavets rika växtvärld. Varje formula är fri från tillsatt palmolja, vegansk och cruelty-free, för en närmare koppling till naturen och en mer etisk skönhetsrutin. Varje bar speglar Medelhavets tidlösa skönhet och stillhet. På Voskopulence vill vi erbjuda en sofistikerad hårvårdsupplevelse som vårdar håret och samtidigt omfamnar ett mer hållbart sätt att leva.",

  "Our Bars": "Våra bars",
  "Solid shampoo and conditioner bars crafted to COSMOS standards, designed for different hair needs but all with the same Mediterranean, eco-conscious spirit.": "Fasta schampo- och balsamkakor framtagna enligt COSMOS-standarder, utvecklade för olika hårbehov men med samma medelhavsinspirerade och miljömedvetna själ.",
  "Mediterranean Thyme & Rosemary Bar": "Medelhavsbar med timjan & rosmarin",
  "A fresh herbal cleanse that keeps roots light and awake.": "En fräsch örtbaserad rengöring som håller hårrötterna lätta och uppfriskade.",
  "Normal to oily hair · Scalps that feel heavy or quickly greasy": "Normalt till fett hår · Hårbotten som snabbt känns tung eller fet",
  "Gently clarifies without stripping": "Rengör skonsamt utan att torka ut",
  "Helps reduce excess sebum at the roots": "Hjälper till att minska överskott av talg vid rötterna",
  "Leaves hair light and refreshed": "Lämnar håret lätt och uppfriskat",
  "Rosemary, thyme & mint essential oils, coconut & olive oils, castor oil, shea butter, nettle leaf powder": "Eteriska oljor av rosmarin, timjan och mynta, kokos- och olivolja, ricinolja, sheasmör och nässelpulver",
  "Fig & Cedar Nourishing Bar": "Närande bar med fikon & ceder",
  "Creamy comfort for hair that likes extra softness and care.": "Krämig vård för hår som behöver extra mjukhet och omsorg.",
  "Normal to dry hair · Frizz or sensitised ends": "Normalt till torrt hår · Friss eller känsliga toppar",
  "Softens and smooths the hair fibre": "Mjukgör och slätar ut hårstrået",
  "Adds light nourishment without heaviness": "Ger lätt näring utan att tynga ner",
  "Leaves a warm, fruity Mediterranean scent": "Lämnar en varm, fruktig doft av Medelhavet",
  "Fig extract, cedarwood & lavender, coconut & olive oils, castor oil, shea butter.": "Fikonextrakt, cederträ och lavendel, kokos- och olivolja, ricinolja och sheasmör.",
  "Lemon Sea Breeze Conditioner Bar": "Balsambar med citron & havsbris",
  "Detangling solid conditioner with coastal freshness.": "Utredande fast balsam med kustnära fräschör.",
  "All hair types · ideal after every wash": "Alla hårtyper · idealisk efter varje tvätt",
  "Instantly eases tangles after washing": "Gör håret lättare att reda ut direkt efter tvätt",
  "Adds softness and shine": "Ger mjukhet och glans",
  "Light, fresh citrus–marine scent": "Lätt och fräsch citrusdoft med marina toner",
  "Lemon peel oil, sea minerals, jojoba oil, coconut & olive oils, conditioning esters.": "Citronolja, havsmineraler, jojobaolja, kokos- och olivolja samt vårdande estrar.",
  "Key ingredients:": "Nyckelingredienser:",
  "BUY NOW": "KÖP NU",
  "Pre-launch · Out of stock": "Inför lansering · Ej i lager",
  "We're preparing our first small batch of Voskopulence bars. This product is not available to purchase yet, but you can leave your email below and we'll let you know as soon as it's in stock.": "Vi förbereder vår första mindre batch av Voskopulence-bars. Produkten går ännu inte att köpa, men lämna gärna din e-postadress så meddelar vi dig så snart den finns i lager.",
  "Email address": "E-postadress",
  "You won't be charged now. This only subscribes you to a one-time notification when this bar becomes available.": "Du debiteras ingenting nu. Detta registrerar dig endast för en engångsnotis när baren blir tillgänglig.",
  "Sending...": "Skickar...",
  "You’re on the list ✓": "Du är med på listan ✓",
  "Notify me at launch": "Meddela mig vid lansering",
  "Something went wrong. Please try again in a moment.": "Något gick fel. Försök igen om en stund.",

  "Sustainability & Formulation": "Hållbarhet & formulering",
  "A transparent look at how Voskopulence bars are crafted: ingredients, COSMOS-style standards, sustainability choices and our formulation philosophy.": "En transparent inblick i hur Voskopulence-bars utvecklas: ingredienser, COSMOS-inspirerade standarder, hållbarhetsval och vår formuleringsfilosofi.",
  "What does “COSMOS” mean?": "Vad betyder ”COSMOS”?",
  "COSMOS is an independent European standard that defines how natural and organic cosmetics should be made. It covers:": "COSMOS är en oberoende europeisk standard som definierar hur naturlig och ekologisk kosmetik ska framställas. Den omfattar:",
  "Which ingredients are allowed and in what form": "Vilka ingredienser som är tillåtna och i vilken form",
  "Minimum levels of natural / organic content": "Miniminivåer för naturligt / ekologiskt innehåll",
  "Rules on animal testing, biodegradable ingredients & GMOs": "Regler om djurförsök, biologiskt nedbrytbara ingredienser och GMO",
  "Packaging, traceability and how formulas are checked by auditors": "Förpackning, spårbarhet och hur formuleringar granskas av revisorer",
  "In short: COSMOS is about safe, well-documented formulas with a lower impact on people and the environment – not just marketing words like “green” or “clean”.": "Kort sagt handlar COSMOS om säkra och väldokumenterade formuleringar med lägre påverkan på människor och miljö – inte bara marknadsföringsord som ”grön” eller ”clean”.",
  "Our formulation philosophy": "Vår formuleringsfilosofi",
  "Our bars are developed with a European lab that works with COSMOS-compliant formulations. For Voskopulence, we focus on:": "Våra bars utvecklas tillsammans med ett europeiskt laboratorium som arbetar med COSMOS-kompatibla formuleringar. För Voskopulence fokuserar vi på:",
  "High share of naturally-derived ingredients": "Hög andel naturligt härledda ingredienser",
  "Vegan & cruelty-free formulations": "Veganska och cruelty-free formuleringar",
  "No deliberately added palm oil in the bar base": "Ingen avsiktligt tillsatt palmolja i barens bas",
  "Botanical scents inspired by the Mediterranean": "Botaniska dofter inspirerade av Medelhavet",
  "Solid bars, less waste": "Fasta bars, mindre avfall",
  "A solid bar means:": "En fast bar innebär:",
  "No plastic bottle for the product itself": "Ingen plastflaska för själva produkten",
  "Much less water shipped compared with liquid shampoo": "Betydligt mindre vatten transporteras jämfört med flytande schampo",
  "Compact format that’s easier to ship and store": "Kompakt format som är enklare att transportera och förvara",
  "A note on certifications & honesty": "Om certifieringar & transparens",
  "We believe sustainability also means being honest about where we are today:": "Vi anser att hållbarhet också innebär att vara tydliga med var vi befinner oss idag:",
  "Are Voskopulence bars officially COSMOS certified?": "Är Voskopulence-bars officiellt COSMOS-certifierade?",
  "Not yet. Our current focus is on working with a lab that develops COSMOS-style formulas and on choosing ingredients that fit that philosophy. Once official certification is in place, it will be clearly visible on our packaging and on this page.": "Inte ännu. Just nu fokuserar vi på att arbeta med ett laboratorium som utvecklar COSMOS-inspirerade formuleringar och välja ingredienser som passar den filosofin. När en officiell certifiering finns på plats kommer den att framgå tydligt på våra förpackningar och på denna sida.",
  "Are the bars suitable for vegans and cruelty-free?": "Är barsen veganska och cruelty-free?",
  "Do the formulas contain sulfates or harsh detergents?": "Innehåller formuleringarna sulfater eller starka tensider?",

  "Questions about the bars, ingredients, or wholesale? Send us a message and we'll get back to you as soon as we can.": "Frågor om våra bars, ingredienser eller återförsäljning? Skicka ett meddelande så återkommer vi så snart vi kan.",
  "Your name": "Ditt namn",
  "Message": "Meddelande",
  "Write your message here...": "Skriv ditt meddelande här...",
  "Send message": "Skicka meddelande",
  "Thank you for contacting us. We'll get back to you as soon as possible.": "Tack för att du kontaktade oss. Vi återkommer så snart som möjligt.",
  "You can also write to us directly at": "Du kan också skriva direkt till oss på"
};

function normalise(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export default function LanguageController() {
  const [lang, setLang] = useState<Lang>("sv");

  useEffect(() => {
    const saved = window.localStorage.getItem("voskopulence-language") as Lang | null;
    const initial: Lang = saved === "en" || saved === "sv" ? saved : "sv";
    setLang(initial);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("voskopulence-language", lang);
    document.documentElement.lang = lang;

    const translateNode = (node: Node) => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const raw = node.textContent || "";
      const key = normalise(raw);
      if (!key) return;

      const original = (node as any).__voskoOriginal || key;
      (node as any).__voskoOriginal = original;
      const replacement = lang === "sv" ? translations[original] : original;
      if (!replacement) return;

      const leading = raw.match(/^\s*/)?.[0] || "";
      const trailing = raw.match(/\s*$/)?.[0] || "";
      node.textContent = `${leading}${replacement}${trailing}`;
    };

    const translateElement = (el: Element) => {
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        const current = el.getAttribute("placeholder");
        if (current) {
          const original = el.dataset.voskoPlaceholder || current;
          el.dataset.voskoPlaceholder = original;
          el.setAttribute("placeholder", lang === "sv" ? translations[original] || original : original);
        }
      }
      for (const child of Array.from(el.childNodes)) translateNode(child);
    };

    const apply = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n: Node | null;
      while ((n = walker.nextNode())) translateNode(n);
      document.querySelectorAll("input[placeholder], textarea[placeholder]").forEach(translateElement);
    };

    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [lang]);

  return (
    <div
      className="fixed right-3 sm:right-5 top-[calc(env(safe-area-inset-top,0px)+14px)] z-[13050] flex items-center rounded-full border border-white/25 bg-[#004642]/88 p-1 text-[11px] sm:text-xs text-white shadow-lg backdrop-blur-md"
      aria-label="Language selector"
    >
      <button
        type="button"
        onClick={() => setLang("sv")}
        className={`rounded-full px-2.5 py-1.5 transition ${lang === "sv" ? "bg-white text-[#004642]" : "text-white/90 hover:bg-white/10"}`}
        aria-pressed={lang === "sv"}
      >
        Svenska
      </button>
      <button
        type="button"
        onClick={() => setLang("en")}
        className={`rounded-full px-2.5 py-1.5 transition ${lang === "en" ? "bg-white text-[#004642]" : "text-white/90 hover:bg-white/10"}`}
        aria-pressed={lang === "en"}
      >
        English
      </button>
    </div>
  );
}
