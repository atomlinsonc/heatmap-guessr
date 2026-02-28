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
]);

// Indian shows (made for Indian audiences, not widely known in US)
const INDIAN = new Set([
  'panchayat', 'the-family-man', 'mahabharat', 'ramayan', 'permanent-roommates',
  'yeh-meri-family', 'mumbai-diaries', 'delhi-crime', 'gullak', 'college-romance',
  'heeramandi-the-diamond-bazaar', 'the-great-indian-kapil-show', 'special-ops',
  'flames', 'ncr-days',
]);

// Turkish shows
const TURKISH = new Set([
  'love-is-in-the-air', 'another-self', 'another-love', 'halka', 'ethos',
  'the-protector', 'resurrection-ertugrul', 'ezel',
  'behzat-an-ankara-detective-story', 'rise-of-empires-ottoman',
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
  'house-of-guinness',// Irish (reality, not well-known)
  'workin-moms',      // Canadian (niche)
  'kim-s-convenience',// Canadian (limited US following)
  '3',                // Brazilian ("3%")
  'all-her-fault',    // Korean thriller
]);

// Anime not mainstream enough to be recognized by general US audiences
// (Keeping iconic ones: DBZ, Naruto, AOT, Death Note, One Piece, FMA:B,
//  Demon Slayer, Jujutsu Kaisen, HxH, My Hero Academia, Bleach, Steins;Gate,
//  Vinland Saga, Tokyo Ghoul, FMA original, SAO, Parasyte, Promised Neverland)
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
