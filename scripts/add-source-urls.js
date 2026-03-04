#!/usr/bin/env node
// Script to add sourceUrl fields to all knowledge-base.json entries

const fs = require('fs');
const path = require('path');

const kbPath = path.join(__dirname, '..', 'src', 'content', 'knowledge-base.json');
const kb = JSON.parse(fs.readFileSync(kbPath, 'utf-8'));

// Mapping of citation keys to URLs
const sourceUrls = {
  'Walker 2017': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6281147/',
  'Why We Sleep': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6281147/',
  'CDC Sleep Guidelines': 'https://www.cdc.gov/sleep/about/how-much-sleep-do-i-need.html',
  'CDC Sleep': 'https://www.cdc.gov/sleep/about/index.html',
  'CDC Sleep Hygiene': 'https://www.cdc.gov/sleep/about/sleep-hygiene.html',
  'CDC': 'https://www.cdc.gov/sleep/about/index.html',
  'Van Dongen et al. 2003': 'https://pubmed.ncbi.nlm.nih.gov/12683469/',
  'NIH': 'https://www.nih.gov/',
  'Lim & Dinges 2010': 'https://pubmed.ncbi.nlm.nih.gov/20070986/',
  'Phillips et al. 2017': 'https://pubmed.ncbi.nlm.nih.gov/28515464/',
  'Milner & Cote 2009': 'https://pubmed.ncbi.nlm.nih.gov/19645971/',
  'Yoo et al. 2007': 'https://pubmed.ncbi.nlm.nih.gov/17942740/',
  'Nature Reviews Neuroscience': 'https://www.nature.com/nrn/',
  'Walker & van der Helm 2009': 'https://pubmed.ncbi.nlm.nih.gov/19758400/',
  'Harvard Health': 'https://www.health.harvard.edu/',
  'Basner & Dinges 2011': 'https://pubmed.ncbi.nlm.nih.gov/21300732/',
  'Ratey 2008': 'https://pubmed.ncbi.nlm.nih.gov/18000087/',
  'Rains & Poceta 2006': 'https://pubmed.ncbi.nlm.nih.gov/16796714/',
  'American Migraine Foundation': 'https://americanmigrainefoundation.org/',
  'JCSM': 'https://jcsm.aasm.org/',
  'Blau & Thavapalan 1988': 'https://pubmed.ncbi.nlm.nih.gov/3209487/',
  'Benedict et al. 2016': 'https://pubmed.ncbi.nlm.nih.gov/27568340/',
  'de Oliveira & Burini 2009': 'https://pubmed.ncbi.nlm.nih.gov/19661687/',
  'Leproult et al. 1997': 'https://pubmed.ncbi.nlm.nih.gov/9415946/',
  'Psychosomatic Medicine': 'https://journals.lww.com/psychosomaticmedicine/',
  'Scullin et al. 2018': 'https://pubmed.ncbi.nlm.nih.gov/29058942/',
  'Åkerstedt 2006': 'https://pubmed.ncbi.nlm.nih.gov/16585055/',
  'Puetz et al. 2006': 'https://pubmed.ncbi.nlm.nih.gov/17148741/',
  'WHO': 'https://www.who.int/',
  'WHO Physical Activity Guidelines': 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
  'Kredlow et al. 2015': 'https://pubmed.ncbi.nlm.nih.gov/25596964/',
  'Chekroud et al. 2018': 'https://pubmed.ncbi.nlm.nih.gov/30099000/',
  'Frontiers in Psychology': 'https://www.frontiersin.org/journals/psychology',
  'Barton & Pretty 2010': 'https://pubmed.ncbi.nlm.nih.gov/20337470/',
  'Annual Review of Psychology': 'https://www.annualreviews.org/journal/psych',
  'Varkey et al. 2011': 'https://pubmed.ncbi.nlm.nih.gov/21824900/',
  'Salmon 2001': 'https://pubmed.ncbi.nlm.nih.gov/11148895/',
  'McEwen 1998': 'https://pubmed.ncbi.nlm.nih.gov/9744247/',
  'Hammen 2005': 'https://pubmed.ncbi.nlm.nih.gov/15796786/',
  'Lancet Psychiatry': 'https://www.thelancet.com/journals/lanpsy/',
  'Fredrickson 2001': 'https://pubmed.ncbi.nlm.nih.gov/11253302/',
  'Arnsten 2009': 'https://pubmed.ncbi.nlm.nih.gov/19401723/',
  'Sauro & Becker 2009': 'https://pubmed.ncbi.nlm.nih.gov/18823363/',
  'Mayer et al. 2015': 'https://pubmed.ncbi.nlm.nih.gov/25592656/',
  'Thayer 1989': 'https://pubmed.ncbi.nlm.nih.gov/2928166/',
  'NIH Circadian Rhythms': 'https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx',
  'Cryan & Dinan 2012': 'https://pubmed.ncbi.nlm.nih.gov/22968153/',
  'Wastyk et al. 2021': 'https://pubmed.ncbi.nlm.nih.gov/34256014/',
  'Moore et al. 2013': 'https://pubmed.ncbi.nlm.nih.gov/23497166/',
  'Dantzer et al. 2008': 'https://pubmed.ncbi.nlm.nih.gov/18073775/',
  'WHO Nutrition Guidelines': 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
  'Cámara-Lemarroy et al. 2016': 'https://pubmed.ncbi.nlm.nih.gov/27324385/',
  'Hirshkowitz et al. 2015': 'https://pubmed.ncbi.nlm.nih.gov/29073412/',
  'Yerkes & Dodson 1908': 'https://psychclassics.yorku.ca/Yerkes/Law/',
  'The Lancet Psychiatry': 'https://www.thelancet.com/journals/lanpsy/',
  'Hirotsu et al. 2015': 'https://pubmed.ncbi.nlm.nih.gov/26198746/',
  'Sleep Medicine Reviews': 'https://www.sciencedirect.com/journal/sleep-medicine-reviews',
  'Sleep Journal': 'https://academic.oup.com/sleep',
  'Belenky et al. 2003': 'https://pubmed.ncbi.nlm.nih.gov/12683476/',
  'Psychological Bulletin': 'https://www.apa.org/pubs/journals/bul',
  'Ødegård et al. 2011': 'https://pubmed.ncbi.nlm.nih.gov/20695689/',
  'Cephalalgia': 'https://journals.sagepub.com/home/cep',
  'American Headache Society': 'https://americanheadachesociety.org/',
  'Mark et al. 2008': 'https://dl.acm.org/doi/10.1145/1357054.1357072',
  'APA': 'https://www.apa.org/topics/stress',
  'National Sleep Foundation': 'https://www.thensf.org/',
  'Monk 2005': 'https://pubmed.ncbi.nlm.nih.gov/16259539/',
  'Circadian Rhythm Research': 'https://www.nigms.nih.gov/education/fact-sheets/Pages/circadian-rhythms.aspx',
  'Lv & Liu 2017': 'https://pubmed.ncbi.nlm.nih.gov/28889100/',
  'Neuroscience & Biobehavioral Reviews': 'https://www.sciencedirect.com/journal/neuroscience-and-biobehavioral-reviews',
  'Posner & Petersen 1990': 'https://pubmed.ncbi.nlm.nih.gov/2183676/',
  'McEwen 2008': 'https://pubmed.ncbi.nlm.nih.gov/18309361/',
  'Neuropsychopharmacology': 'https://www.nature.com/npp/',
  'Cotman & Berchtold 2002': 'https://pubmed.ncbi.nlm.nih.gov/12086747/',
  'Buse et al. 2019': 'https://pubmed.ncbi.nlm.nih.gov/30684292/',
  'Mayer 2011': 'https://pubmed.ncbi.nlm.nih.gov/21206488/',
  'Carabotti et al. 2015': 'https://pubmed.ncbi.nlm.nih.gov/25830558/',
  'Gut Journal': 'https://gut.bmj.com/',
  'Blanchflower & Oswald 2008': 'https://pubmed.ncbi.nlm.nih.gov/18461175/',
  'WHO Nutrition': 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
  'NIH NIDDK': 'https://www.niddk.nih.gov/',
  'APA Stress in America': 'https://www.apa.org/news/press/releases/stress',
  'WHO 2020': 'https://www.who.int/news-room/fact-sheets/detail/physical-activity',
  'Wittmann et al. 2006': 'https://pubmed.ncbi.nlm.nih.gov/16687322/',
  'Emmons & McCullough 2003': 'https://pubmed.ncbi.nlm.nih.gov/12585811/',
  'Shevchuk 2008': 'https://pubmed.ncbi.nlm.nih.gov/17993252/',
  'Kaplan 1995': 'https://pubmed.ncbi.nlm.nih.gov/11990157/',
  'Bratman et al. 2015': 'https://pubmed.ncbi.nlm.nih.gov/26150589/',
  'Ward et al. 2017': 'https://pubmed.ncbi.nlm.nih.gov/28655066/',
  'Lally et al. 2010': 'https://pubmed.ncbi.nlm.nih.gov/20435614/',
  'Nagoski & Nagoski 2019': 'https://www.penguinrandomhouse.com/books/592377/burnout-by-emily-nagoski-phd-and-amelia-nagoski-dma/',
  'NIH NCCIH': 'https://www.nccih.nih.gov/',
  'Khanna et al. 2014': 'https://pubmed.ncbi.nlm.nih.gov/25141280/',
  'Mauskop & Varughese 2012': 'https://pubmed.ncbi.nlm.nih.gov/22426836/',
  'Wood et al. 2009': 'https://pubmed.ncbi.nlm.nih.gov/19403882/',
  'Jacobson 1938': 'https://psycnet.apa.org/record/1938-04698-000',
  'Huberman 2021': 'https://hubermanlab.com/toolkit-for-sleep/',
  'Wirz-Justice et al. 2020': 'https://pubmed.ncbi.nlm.nih.gov/31816414/',
  'Spigt et al. 2012': 'https://pubmed.ncbi.nlm.nih.gov/21774805/',
  'European Journal of Neurology': 'https://onlinelibrary.wiley.com/journal/14681331',
  'Irish et al. 2015': 'https://pubmed.ncbi.nlm.nih.gov/25454674/',
  'Sleep Health journal': 'https://www.sleephealthjournal.org/',
  'Reynolds et al. 2022': 'https://pubmed.ncbi.nlm.nih.gov/35488371/',
  'Sports Medicine': 'https://link.springer.com/journal/40279',
  'Cirillo 2006': 'https://francescocirillo.com/products/the-pomodoro-technique',
  'Wieth & Zacks 2011': 'https://pubmed.ncbi.nlm.nih.gov/22127760/',
  'Statistical significance threshold': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5187603/',
  'Statistical methodology': 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5187603/',
  'attention restoration research': 'https://pubmed.ncbi.nlm.nih.gov/11990157/',
};

// Helper: find the best URL for a source string
function findSourceUrl(sourceStr) {
  if (!sourceStr) return null;
  
  // Try each key, longest match first
  const keys = Object.keys(sourceUrls).sort((a, b) => b.length - a.length);
  
  for (const key of keys) {
    if (sourceStr.includes(key)) {
      return sourceUrls[key];
    }
  }
  
  // Fallback based on common patterns
  if (sourceStr.includes('CDC')) return 'https://www.cdc.gov/';
  if (sourceStr.includes('NIH')) return 'https://www.nih.gov/';
  if (sourceStr.includes('WHO')) return 'https://www.who.int/';
  if (sourceStr.includes('Harvard')) return 'https://www.health.harvard.edu/';
  if (sourceStr.includes('American Migraine')) return 'https://americanmigrainefoundation.org/';
  
  return null;
}

// Process all sections
let updated = 0;

function processEntries(entries) {
  if (!Array.isArray(entries)) return;
  for (const entry of entries) {
    if (entry.source && !entry.sourceUrl) {
      const url = findSourceUrl(entry.source);
      if (url) {
        entry.sourceUrl = url;
        updated++;
      }
    }
  }
}

processEntries(kb.correlations);
processEntries(kb.recommendations);
processEntries(kb.baselines);
processEntries(kb.education);
processEntries(kb.coldStart);
if (kb.generalInsights) processEntries(kb.generalInsights);

fs.writeFileSync(kbPath, JSON.stringify(kb, null, 2) + '\n');
console.log(`Updated ${updated} entries with sourceUrl`);

// Verify
let missing = 0;
function checkMissing(entries, section) {
  if (!Array.isArray(entries)) return;
  for (const e of entries) {
    if (e.source && !e.sourceUrl) {
      missing++;
      console.log(`  MISSING in ${section}: "${e.source}"`);
    }
  }
}
checkMissing(kb.correlations, 'correlations');
checkMissing(kb.recommendations, 'recommendations');
checkMissing(kb.baselines, 'baselines');
checkMissing(kb.education, 'education');
checkMissing(kb.coldStart, 'coldStart');
console.log(`Missing sourceUrl: ${missing}`);
