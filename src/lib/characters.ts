export type Character = {
  id: string;
  name: string;
  series: string;
  pool: "f" | "m";
  spirit: string;
  accent: string;
};

export type ThankYouContent = {
  headline: string;
  message: string;
  wishes: [string, string, string];
  signoff: string;
};

export type GuideCharacter = { id: string; name: string; series: string; accent: string };

/** What is stored in profiles.thankyou_content (server side). */
export type StoredGuide = ThankYouContent & {
  character?: GuideCharacter & { spirit?: string };
  welcome?: { line: string };
  meta?: { fingerprint: string; checkedAt: string; basis: string };
};

export const CHARACTERS: Character[] = [
  { id: "mikasa", name: "Mikasa Ackerman", series: "Attack on Titan", pool: "f", spirit: "fierce loyalty and quiet strength", accent: "#8C2F39" },
  { id: "nami", name: "Nami", series: "One Piece", pool: "f", spirit: "ambition, a sharp mind and knowing her worth", accent: "#C8641E" },
  { id: "erza", name: "Erza Scarlet", series: "Fairy Tail", pool: "f", spirit: "discipline and leadership", accent: "#A12A2A" },
  { id: "usagi", name: "Usagi Tsukino", series: "Sailor Moon", pool: "f", spirit: "believing in yourself", accent: "#B76BA3" },
  { id: "ochaco", name: "Ochaco Uraraka", series: "My Hero Academia", pool: "f", spirit: "determination with a purpose", accent: "#C4577A" },
  { id: "hinata", name: "Hinata Hyuga", series: "Naruto", pool: "f", spirit: "quiet courage and growing bolder", accent: "#5B5FA8" },
  { id: "violet", name: "Violet Evergarden", series: "Violet Evergarden", pool: "f", spirit: "growth and finding purpose", accent: "#2F5D8C" },
  { id: "asuna", name: "Asuna Yuuki", series: "Sword Art Online", pool: "f", spirit: "skill and leadership", accent: "#B5472C" },
  { id: "kiki", name: "Kiki", series: "Kiki's Delivery Service", pool: "f", spirit: "starting out in a new city on her own", accent: "#3F4C8C" },
  { id: "chihiro", name: "Chihiro Ogino", series: "Spirited Away", pool: "f", spirit: "courage in a brand-new workplace", accent: "#3E7A6B" },
  { id: "naruto", name: "Naruto Uzumaki", series: "Naruto", pool: "m", spirit: "never giving up", accent: "#D9731A" },
  { id: "luffy", name: "Monkey D. Luffy", series: "One Piece", pool: "m", spirit: "bold dreams", accent: "#B8332B" },
  { id: "deku", name: "Izuku Midoriya", series: "My Hero Academia", pool: "m", spirit: "relentless effort", accent: "#2F7A4D" },
  { id: "tanjiro", name: "Tanjiro Kamado", series: "Demon Slayer", pool: "m", spirit: "kindness paired with grit", accent: "#2E6B5A" },
  { id: "edward", name: "Edward Elric", series: "Fullmetal Alchemist", pool: "m", spirit: "resilience and honest effort", accent: "#A8801F" },
  { id: "lee", name: "Rock Lee", series: "Naruto", pool: "m", spirit: "hard work that outpaces talent", accent: "#2C7A3F" },
  { id: "goku", name: "Son Goku", series: "Dragon Ball", pool: "m", spirit: "constant self-improvement", accent: "#D1701B" },
  { id: "zoro", name: "Roronoa Zoro", series: "One Piece", pool: "m", spirit: "discipline and loyalty to the goal", accent: "#3B6E3B" },
  { id: "gon", name: "Gon Freecss", series: "Hunter x Hunter", pool: "m", spirit: "curiosity and fearless pursuit", accent: "#3F7F3F" },
];

export const characterById = (id?: string | null) => CHARACTERS.find((c) => c.id === id);

export function poolFor(gender?: string | null): Character[] {
  const g = (gender ?? "").toLowerCase();
  if (g === "female") return CHARACTERS.filter((c) => c.pool === "f");
  if (g === "male") return CHARACTERS.filter((c) => c.pool === "m");
  return CHARACTERS;
}

/** Stable fallback pick based on the person's id. */
export function stablePick(pool: Character[], candidateId: string) {
  let h = 0;
  for (const ch of candidateId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}

export function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

/** Built-in note used whenever the live writer is unavailable. Gender-neutral on purpose. */
export function fallbackNote(c: Character, firstName: string): ThankYouContent {
  return {
    headline: "Your next chapter starts here",
    message:
      `${firstName}, your profile is submitted and saved, and you can reopen it any time to update it. ` +
      `For this stretch of the journey, ${c.name} from ${c.series} feels like a fitting guide. ` +
      `The spirit this character stands for is ${c.spirit}, and that is just what a job search asks of anyone: ` +
      `showing up with care for your work, learning from every conversation, and trusting that steady effort adds up. ` +
      `You have taken a thoughtful step by laying out your background, your goals and what you are looking for. ` +
      `Recruiters will see a clear picture, and you now have a clear picture of it too. ` +
      `Keep your focus on the roles that truly fit you, stay patient with the process, and let your experience speak for itself. ` +
      `Whatever comes next, you are far better prepared than when you started this form, and that is worth being proud of.`,
    wishes: [
      "May every interview feel like a good conversation.",
      "May the right offer find you at the right time.",
      "May this new chapter be everything you hoped for.",
    ],
    signoff: "Go well, and go boldly.",
  };
}

export const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "guide";

/** Accept a model-suggested colour only if it is a hex value; darken it so white text stays readable. */
export function safeAccent(hex: string | undefined, fallback = "#C2540F") {
  const m = /^#?([0-9a-f]{6})$/i.exec(String(hex ?? "").trim());
  if (!m) return fallback;
  let r = parseInt(m[1].slice(0, 2), 16), g = parseInt(m[1].slice(2, 4), 16), b = parseInt(m[1].slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum > 0.55) {
    const k = 0.55 / lum;
    r = Math.round(r * k); g = Math.round(g * k); b = Math.round(b * k);
  }
  return "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
}

/** The guide character for a profile: the AI-chosen one stored with the note, else a built-in one. */
export function resolveCharacter(idCol: string | null | undefined, content: StoredGuide | null | undefined): GuideCharacter | null {
  if (content?.character?.name) {
    const c = content.character;
    return { id: c.id || slugify(c.name), name: c.name, series: c.series, accent: safeAccent(c.accent) };
  }
  const b = characterById(idCol);
  return b ? { id: b.id, name: b.name, series: b.series, accent: b.accent } : null;
}
