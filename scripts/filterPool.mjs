#!/usr/bin/env node
/**
 * filterPool.mjs
 * --------------
 * Filters puzzle_pool.json to keep only shows well-known to US audiences.
 * - Removes foreign/regional content (Korean dramas, Indian shows, Turkish shows,
 *   non-mainstream anime, other non-English regional content)
 * - Removes shows with fewer than 25,000 IMDB votes
 * - Caps at exactly 1,000 shows (sorted by vote count, most popular first)
 * - Preserves all existing lead actor and tagline data
 *
 * Usage: node scripts/filterPool.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_PATH = join(ROOT, 'data', 'puzzle_pool.json');

// ── Shows to remove: foreign / regional / non-US-audience content ──────────────
// Korean dramas (not well-known to general US audiences)
const KOREAN = new Set([
  'all-of-us-are-dead', 'hellbound', 'extraordinary-attorney-woo', 'vincenzo',
  'crash-landing-on-you', 'kingdom', 'descendants-of-the-sun', 'hometown-cha-cha-cha',
  'alchemy-of-souls', 'racket-boys', 'the-silent-sea', 'the-glory', 'my-name',
  'business-proposal', 'when-life-gives-you-tangerines', 'queen-of-tears',
  'the-brothers-sun', 'ncr-days', 'guardian-the-lonely-and-great-god',
  'it-s-okay-to-not-be-okay', 'sweet-home', 'signal',
  'king-the-land', 'when-the-phone-rings', 'heated-rivalry',
  'all-her-fault',
]);

// Indian shows (made for Indian audiences, not widely known in US)
const INDIAN = new Set([
  'panchayat', 'the-family-man', 'mahabharat', 'ramayan', 'permanent-roommates',
  'yeh-meri-family', 'mumbai-diaries', 'delhi-crime', 'gullak', 'college-romance',
  'heeramandi-the-diamond-bazaar', 'the-great-indian-kapil-show', 'special-ops',
  'flames', 'ncr-days',
  // Additional Indian shows discovered in second pass
  'aspirants', 'dhindora', 'sacred-games', 'mirzapur', 'kota-factory',
  'sandeep-bhaiya', 'tvf-pitchers', 'paatal-lok', 'sapne-vs-everyone',
  'aashram', 'indian-police-force', 'tandav', 'farzi', 'four-more-shots-please',
  'asur-welcome-to-your-dark-side', 'taaza-khabar', 'chamak',
  'the-ba-ds-of-bollywood',
]);

// Turkish shows
const TURKISH = new Set([
  'love-is-in-the-air', 'another-self', 'another-love', 'halka', 'ethos',
  'the-protector', 'resurrection-ertugrul', 'ezel',
  'behzat-an-ankara-detective-story', 'rise-of-empires-ottoman',
  'love-doesn-t-understand-words', 'his-hers',
]);

// Other non-English regional content not widely known in US
const OTHER_FOREIGN = new Set([
  'borgen',           // Danish
  'babylon-berlin',   // German
  'barbarians',       // German
  'dear-child',       // German
  'skam',             // Norwegian
  'fauda',            // Israeli (Hebrew)
  'tehran',           // Israeli (Farsi/Hebrew)
  'gomorrah',         // Italian
  'zerozerozero',     // Italian
  'the-eternaut',     // Argentine (Spanish)
  'trapped',          // Icelandic
  'lilyhammer',       // Norwegian
  'into-the-night',   // Belgian (French)
  'dekalog',          // Polish
  'quicksand',        // Swedish
  'locked-up',        // Spanish ("Vis a Vis")
  'the-mechanism',    // Brazilian (Portuguese)
  'house-of-guinness',// Irish (reality)
  'workin-moms',      // Canadian (niche)
  'kim-s-convenience',// Canadian (limited US following)
  '3',                // Brazilian ("3%")
  // Additional foreign shows discovered in second pass
  'elite',            // Spanish Netflix teen drama
  'the-innocent',     // Spanish thriller
  'the-chestnut-man', // Danish crime
  'ragnarok',         // Norwegian Netflix
  'young-royals',     // Swedish Netflix
  'how-to-sell-drugs-online-fast', // German Netflix
  'berlin',           // German (Money Heist spin-off)
  'the-bridge',       // Swedish/Danish original (2011)
  'paranormal',       // Egyptian Netflix
  'untamed',          // Chinese drama ("The Untamed")
  'the-heroes',       // Unknown non-US animation (2008)
  'pluribus',         // Unknown/unverifiable 2025 show
  'heated-rivalry',   // Foreign drama (2025)
  'persona',          // Korean Netflix anthology (2018)
  'the-frog',         // Foreign crime (2020)
  'the-beast-in-me',  // Unverifiable foreign drama (2025)
  'task',             // Unverifiable foreign show (2025)
  'as-if',            // Foreign comedy (possibly Israeli/Turkish)
  'dept-q',           // Danish crime series (2025)
  'leyla-and-mecnun', // Turkish comedy-drama (2011)
  'the-rain',         // Danish post-apocalyptic (2018)
]);

// Anime not mainstream enough to be recognized by general US audiences
// (Keeping iconic ones: DBZ, Naruto, AOT, Death Note, One Piece, FMA:B,
//  Demon Slayer, Jujutsu Kaisen, HxH, My Hero Academia, Bleach, Steins;Gate,
//  Vinland Saga, Tokyo Ghoul, FMA original, SAO, Parasyte, Promised Neverland,
//  Code Geass, Neon Genesis Evangelion, Berserk, Samurai Champloo, Erased,
//  Mob Psycho 100, JoJo's, Spy x Family, Haikyu, Frieren, Chainsaw Man,
//  Dragon Ball Super, Bleach TYBW, Solo Leveling, Dandadan)
const NICHE_ANIME = new Set([
  'your-lie-in-april',
  'black-clover',
  'the-seven-deadly-sins',
  'dr-stone',
  'elfen-lied',
  're-zero-starting-life-in-another-world',
  'violet-evergarden',
  'boruto-naruto-next-generations',
  'tokyo-revengers',
  'blue-lock',
  'kaiju-no-8',
  'hellsing-ultimate',
  'fairy-tail',
  'dragon-ball-gt',
  'dragon-ball-z-kai',
  'mushoku-tensei-jobless-reincarnation',
  'devilman-crybaby',
  'akame-ga-kill',
  'dororo',
  'kaguya-sama-love-is-war',
  'assassination-classroom',
  'trigun',
]);

const EXCLUDE = new Set([
  ...KOREAN,
  ...INDIAN,
  ...TURKISH,
  ...OTHER_FOREIGN,
  ...NICHE_ANIME,
]);

// ── Main ──────────────────────────────────────────────────────────────────────
const pool = JSON.parse(readFileSync(OUT_PATH, 'utf-8'));
console.log(`Starting pool size: ${pool.length}`);

// Step 1: Remove excluded shows
const afterExclude = pool.filter(s => {
  if (EXCLUDE.has(s.id)) {
    console.log(`  Removing (excluded): ${s.title} [${s.id}]`);
    return false;
  }
  return true;
});
console.log(`After exclusions: ${afterExclude.length} (removed ${pool.length - afterExclude.length})`);

// Step 2: Remove shows with fewer than 25,000 votes
const afterVotes = afterExclude.filter(s => {
  if ((s.imdbVotes || 0) < 25000) {
    console.log(`  Removing (low votes ${s.imdbVotes?.toLocaleString()}): ${s.title}`);
    return false;
  }
  return true;
});
console.log(`After vote floor (25k): ${afterVotes.length} (removed ${afterExclude.length - afterVotes.length})`);

// Step 3: Sort by votes descending, cap at 1000
afterVotes.sort((a, b) => (b.imdbVotes || 0) - (a.imdbVotes || 0));
const final = afterVotes.slice(0, 1000);

console.log(`\nFinal pool: ${final.length} shows`);
console.log(`Top 10:    ${final.slice(0, 10).map(s => s.title).join(', ')}`);
console.log(`Bottom 10: ${final.slice(-10).map(s => `${s.title} (${s.imdbVotes?.toLocaleString()})`).join(', ')}`);

// Verify no excluded shows slipped through
const leaked = final.filter(s => EXCLUDE.has(s.id));
if (leaked.length) console.warn(`⚠️  Leaked excluded shows: ${leaked.map(s=>s.title).join(', ')}`);

writeFileSync(OUT_PATH, JSON.stringify(final, null, 2));
console.log(`\n✅ Wrote ${final.length} shows to puzzle_pool.json`);
