import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POOL_PATH = join(__dirname, '../../data/puzzle_pool.json');

let _titles = null;

/**
 * Returns the frozen top-100 list of show titles for autocomplete.
 * Falls back to demo titles if puzzle_pool.json not yet generated.
 */
export function loadTitles() {
  if (_titles) return _titles;
  try {
    const raw = readFileSync(POOL_PATH, 'utf-8');
    const pool = JSON.parse(raw);
    _titles = pool.map((s) => ({ id: s.id, title: s.title, aliases: s.aliases ?? [] }));
    return _titles;
  } catch {
    _titles = getDemoTitles();
    return _titles;
  }
}

function getDemoTitles() {
  return [
    { id: 'breaking-bad', title: 'Breaking Bad', aliases: ['bb'] },
    { id: 'the-wire', title: 'The Wire', aliases: ['wire'] },
    { id: 'the-sopranos', title: 'The Sopranos', aliases: ['sopranos'] },
    { id: 'game-of-thrones', title: 'Game of Thrones', aliases: ['got'] },
    { id: 'the-office-us', title: 'The Office', aliases: ['the office us', 'office'] },
    { id: 'better-call-saul', title: 'Better Call Saul', aliases: ['bcs'] },
    { id: 'chernobyl', title: 'Chernobyl', aliases: [] },
    { id: 'band-of-brothers', title: 'Band of Brothers', aliases: ['bob'] },
    { id: 'true-detective', title: 'True Detective', aliases: ['td'] },
    { id: 'fargo', title: 'Fargo', aliases: [] },
    { id: 'the-boys', title: 'The Boys', aliases: ['boys'] },
    { id: 'succession', title: 'Succession', aliases: [] },
    { id: 'fleabag', title: 'Fleabag', aliases: [] },
    { id: 'sherlock', title: 'Sherlock', aliases: [] },
    { id: 'black-mirror', title: 'Black Mirror', aliases: ['bm'] },
    { id: 'the-mandalorian', title: 'The Mandalorian', aliases: ['mandalorian', 'mando'] },
    { id: 'stranger-things', title: 'Stranger Things', aliases: ['st'] },
    { id: 'the-crown', title: 'The Crown', aliases: ['crown'] },
    { id: 'ozark', title: 'Ozark', aliases: [] },
    { id: 'peaky-blinders', title: 'Peaky Blinders', aliases: ['pb'] },
    { id: 'westworld', title: 'Westworld', aliases: [] },
    { id: 'twin-peaks', title: 'Twin Peaks', aliases: [] },
    { id: 'the-americans', title: 'The Americans', aliases: ['americans'] },
    { id: 'mad-men', title: 'Mad Men', aliases: [] },
    { id: 'lost', title: 'Lost', aliases: [] },
    { id: 'the-shield', title: 'The Shield', aliases: ['shield'] },
    { id: 'house-md', title: 'House M.D.', aliases: ['house', 'house md'] },
    { id: 'dexter', title: 'Dexter', aliases: [] },
    { id: 'it-crowd', title: 'The IT Crowd', aliases: ['it crowd'] },
    { id: 'arrested-development', title: 'Arrested Development', aliases: ['ad'] },
    { id: 'bojack-horseman', title: 'BoJack Horseman', aliases: ['bojack'] },
    { id: 'rick-and-morty', title: 'Rick and Morty', aliases: ['ram'] },
    { id: 'atlanta', title: 'Atlanta', aliases: [] },
    { id: 'silicon-valley', title: 'Silicon Valley', aliases: ['sv'] },
    { id: 'veep', title: 'Veep', aliases: [] },
    { id: 'barry', title: 'Barry', aliases: [] },
    { id: 'ted-lasso', title: 'Ted Lasso', aliases: ['lasso'] },
    { id: 'the-last-of-us', title: 'The Last of Us', aliases: ['tlou', 'last of us'] },
    { id: 'andor', title: 'Andor', aliases: [] },
    { id: 'severance', title: 'Severance', aliases: [] },
    { id: 'white-lotus', title: 'The White Lotus', aliases: ['white lotus'] },
    { id: 'euphoria', title: 'Euphoria', aliases: [] },
    { id: 'station-eleven', title: 'Station Eleven', aliases: [] },
    { id: 'the-leftovers', title: 'The Leftovers', aliases: ['leftovers'] },
    { id: 'rome', title: 'Rome', aliases: [] },
    { id: 'deadwood', title: 'Deadwood', aliases: [] },
    { id: 'carnivale', title: 'Carnivàle', aliases: ['carnivale'] },
    { id: 'oz', title: 'Oz', aliases: [] },
    { id: 'six-feet-under', title: 'Six Feet Under', aliases: [] },
    { id: 'boardwalk-empire', title: 'Boardwalk Empire', aliases: [] },
    { id: 'treme', title: 'Treme', aliases: [] },
    { id: 'miniseries', title: 'Generation Kill', aliases: [] },
    { id: 'barry-hbo', title: 'Barry', aliases: [] },
    { id: 'hacks', title: 'Hacks', aliases: [] },
    { id: 'the-bear', title: 'The Bear', aliases: ['bear'] },
    { id: 'abbott-elementary', title: 'Abbott Elementary', aliases: ['abbott'] },
    { id: 'what-we-do-shadows', title: 'What We Do in the Shadows', aliases: ['wwdits'] },
    { id: 'only-murders', title: 'Only Murders in the Building', aliases: ['only murders'] },
    { id: 'yellowstone', title: 'Yellowstone', aliases: [] },
    { id: 'the-wire-s2', title: 'Mindhunter', aliases: [] },
    { id: 'dark', title: 'Dark', aliases: [] },
    { id: 'money-heist', title: 'Money Heist', aliases: ['la casa de papel', 'casa de papel'] },
    { id: 'squid-game', title: 'Squid Game', aliases: [] },
    { id: 'kingdom', title: 'Kingdom', aliases: [] },
    { id: 'the-haunting', title: 'The Haunting of Hill House', aliases: ['hill house'] },
    { id: 'midnight-mass', title: 'Midnight Mass', aliases: [] },
    { id: 'mindhunter', title: 'Mindhunter', aliases: [] },
    { id: 'narcos', title: 'Narcos', aliases: [] },
    { id: 'narcos-mexico', title: 'Narcos: Mexico', aliases: [] },
    { id: 'altered-carbon', title: 'Altered Carbon', aliases: ['ac'] },
    { id: 'sense8', title: 'Sense8', aliases: [] },
    { id: 'dark-netflix', title: 'Dark', aliases: [] },
    { id: 'the-english', title: 'The English', aliases: ['english'] },
    { id: 'slow-horses', title: 'Slow Horses', aliases: [] },
    { id: 'bad-sisters', title: 'Bad Sisters', aliases: [] },
    { id: 'silo', title: 'Silo', aliases: [] },
    { id: 'foundation', title: 'Foundation', aliases: [] },
    { id: 'for-all-mankind', title: 'For All Mankind', aliases: [] },
    { id: 'severance-atv', title: 'Severance', aliases: [] },
    { id: 'mythic-quest', title: 'Mythic Quest', aliases: [] },
    { id: 'shrinking', title: 'Shrinking', aliases: [] },
    { id: 'blue-eye-samurai', title: 'Blue Eye Samurai', aliases: [] },
    { id: 'arcane', title: 'Arcane', aliases: [] },
    { id: 'invincible', title: 'Invincible', aliases: [] },
    { id: 'the-penguin', title: 'The Penguin', aliases: ['penguin'] },
    { id: 'house-dragon', title: 'House of the Dragon', aliases: ['hotd', 'house of dragon'] },
    { id: 'rings-power', title: 'The Rings of Power', aliases: ['rings of power', 'rop'] },
    { id: 'andor-sw', title: 'Andor', aliases: [] },
    { id: 'the-acolyte', title: 'The Acolyte', aliases: ['acolyte'] },
    { id: 'shogun-fx', title: 'Shōgun', aliases: ['shogun'] },
    { id: 'fx-say-nothing', title: 'Say Nothing', aliases: [] },
    { id: 'the-diplomat', title: 'The Diplomat', aliases: ['diplomat'] },
    { id: 'beef', title: 'Beef', aliases: [] },
    { id: 'the-bear-fx', title: 'The Bear', aliases: [] },
    { id: 'fringe', title: 'Fringe', aliases: [] },
    { id: 'person-of-interest', title: 'Person of Interest', aliases: ['poi'] },
    { id: 'mr-robot', title: 'Mr. Robot', aliases: ['mr robot'] },
    { id: 'prison-break', title: 'Prison Break', aliases: ['pb'] },
  ];
}
