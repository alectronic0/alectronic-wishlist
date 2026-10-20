/**
 * Title and author normalisation shared by the content build and the book merge.
 */

const TITLE_STOPWORDS = new Set(['the', 'a', 'an', 'of', 'and', 'to', 'in', 'for', 'with', 'by', 'vol']);
const TITLE_MATCH = 0.75;

function titleWords(text) {
  const words = text.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(word => word && !TITLE_STOPWORDS.has(word));
  return new Set(words);
}

// Share of the shorter title's words that the longer one also has
function titleOverlap(left, right) {
  const smaller = left.size <= right.size ? left : right;
  const larger = smaller === left ? right : left;
  if (smaller.size === 0) {
    return 0;
  }
  let shared = 0;
  for (const word of smaller) {
    if (larger.has(word)) {
      shared++;
    }
  }
  return shared / smaller.size;
}

// Share of `of`'s words found in `within` (titleOverlap always measures the smaller title)
function coverage(of, within) {
  if (of.size === 0) {
    return 0;
  }
  return [...of].filter(word => within.has(word)).length / of.size;
}

// Goodreads titles carry series suffixes, seller noise in brackets and, for Japanese editions,
// the romanised title in trailing brackets
function goodreadsTitle(book) {
  const romanised = book.title.match(/^[^\x00-\x7F].*\[([^\]]+)\]\s*$/);
  if (romanised) {
    return romanised[1];
  }
  return book.title.replace(/^\[+\(?/, '').replace(/^By [^-]+ - /i, '').split(/\]|\s*\([^)]*#\d+\)/)[0].trim();
}

function goodreadsAuthor(book) {
  const [last, first] = book.author.split(', ');
  return first ? `${first} ${last}` : last;
}

module.exports = { TITLE_MATCH, titleWords, titleOverlap, coverage, goodreadsTitle, goodreadsAuthor };
