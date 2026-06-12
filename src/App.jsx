import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Plus, Trash2, Download, X, BarChart3, Lightbulb, ChevronRight, ChevronLeft } from 'lucide-react';
import { supabase } from './supabase.js';

const ALL_CATEGORIES = [
  'Business & Investing',
  'History',
  'Military History',
  'Biography & Memoir',
  'Science & Ideas',
  'Narrative Non-Fiction',
  'Fiction',
  'Literature & Reference',
  'Self-Development',
  'Australia',
];

// 30 hand-curated suggestions based on gaps in the library
const SUGGESTED_READS = [
  { title: 'The Power Broker', author: 'Robert A. Caro', why: 'The defining work on how power actually accumulates and operates. The largest missing classic in your library.' },
  { title: 'Master of the Senate', author: 'Robert A. Caro', why: 'Volume 3 of the LBJ series. Caro at his peak. You inevitably read it after The Power Broker.' },
  { title: 'Berlin: The Downfall 1945', author: 'Antony Beevor', why: 'Completes the Beevor trilogy with Stalingrad and D-Day. You\'ve done the front-end, now finish it.' },
  { title: 'D-Day: The Battle for Normandy', author: 'Antony Beevor', why: 'The third Beevor in the WWII trilogy. Operational detail with a novelist\'s eye for character.' },
  { title: 'The Snowball', author: 'Alice Schroeder', why: 'The definitive Buffett biography. 800 pages but flies by. Investing wisdom embedded in life narrative.' },
  { title: 'Mastering the Market Cycle', author: 'Howard Marks', why: 'You have The Most Important Thing — this is the deeper dive on Marks\'s cycle framework.' },
  { title: 'Common Stocks and Uncommon Profits', author: 'Philip Fisher', why: 'The Rosetta Stone for quality-growth investing. Buffett cites it constantly.' },
  { title: 'The Joys of Compounding', author: 'Gautam Baid', why: 'Munger-influenced mental models, written by a practitioner. Slots next to Almanack.' },
  { title: 'Master and Commander', author: 'Patrick O\'Brian', why: 'Your gateway drug to a 20-novel obsession. Given your taste for age-of-sail material (Nelson, Endurance), this is overdue.' },
  { title: 'The Looming Tower', author: 'Lawrence Wright', why: 'The definitive 9/11 origin story. Sits naturally between Empire of Pain and An Impeccable Spy.' },
  { title: 'In the Heart of the Sea', author: 'Nathaniel Philbrick', why: 'The whaleship Essex disaster. Endurance-adjacent narrative non-fiction, beautifully done.' },
  { title: 'The Beginning of Infinity', author: 'David Deutsch', why: 'Audacious work on knowledge and explanation. Sits in the Pinker/Harari/Dawkins shelf but more ambitious.' },
  { title: 'Seeing Like a State', author: 'James C. Scott', why: 'Why grand top-down schemes fail. Quietly one of the most important books for any investor.' },
  { title: 'The Hard Thing About Hard Things', author: 'Ben Horowitz', why: 'CEO operating wisdom from someone who lived it. Fills the operator gap between your investing books.' },
  { title: 'Skin in the Game', author: 'Nassim Nicholas Taleb', why: 'You have Antifragile, Black Swan, Fooled by Randomness — completes the Incerto.' },
  { title: 'Wanting', author: 'Luke Burgis', why: 'Girardian mimetic desire applied to modern life. Quietly explanatory of markets and careers.' },
  { title: 'Tomorrow, and Tomorrow, and Tomorrow', author: 'Gabrielle Zevin', why: 'Recent fiction worth the hype. Friendship, creativity, video games — better than that sounds.' },
  { title: 'James', author: 'Percival Everett', why: '2024 Pulitzer winner. Huckleberry Finn retold from Jim\'s perspective. Genuinely brilliant.' },
  { title: 'The Bullet That Missed', author: 'Richard Osman', why: 'Light reading that\'s actually good. Counterweight to your heavy military history shelf.' },
  { title: 'Empire of the Summer Moon', author: 'S.C. Gwynne', why: 'Comanche history done with literary craft. Sits between Bury My Heart and Blood and Thunder.' },
  { title: 'The Splendid and the Vile', author: 'Erik Larson', why: 'Larson on Churchill during the Blitz. You have Devil in the White City — this is arguably better.' },
  { title: 'Number Go Up', author: 'Zeke Faux', why: 'Crypto fraud reporting in the Carreyrou/McCrum tradition. Best business book of 2023.' },
  { title: 'Lessons from the Edge', author: 'Marie Yovanovitch', why: 'Diplomat\'s memoir from inside the Trump-Ukraine fight. Sits next to Impeccable Spy.' },
  { title: 'The Anxious Generation', author: 'Jonathan Haidt', why: 'The smartphone/teen mental health argument. Whatever you think of it, it\'s the discourse-shaping book of the moment.' },
  { title: 'Determined', author: 'Robert Sapolsky', why: 'You have Behave. This is Sapolsky\'s argument against free will. Pugnacious follow-up.' },
  { title: 'Material World', author: 'Ed Conway', why: 'The six raw materials underlying modern civilisation. Investor-brain catnip.' },
  { title: 'Going Infinite', author: 'Michael Lewis', why: 'Lewis on SBF. You have Boomerang — pick this up.' },
  { title: 'King: A Life', author: 'Jonathan Eig', why: '2023 biography of MLK. Definitive and superbly researched. Pairs with Chernow\'s Grant.' },
  { title: 'Working', author: 'Robert A. Caro', why: 'Caro on Caro — short memoir about how he researches and writes. Worth it on its own.' },
  { title: 'The Coming Wave', author: 'Mustafa Suleyman', why: 'DeepMind co-founder on AI and biotech. Required reading for anyone investing through this decade.' },
];

// Debounce hook
function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [sortBy, setSortBy] = useState('title');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [newBook, setNewBook] = useState({ title: '', author: '', category: 'Business & Investing' });
  const [error, setError] = useState(null);

  // Suggested reads carousel state
  const [suggestionIdx, setSuggestionIdx] = useState(() => Math.floor(Math.random() * SUGGESTED_READS.length));
  const [suggestionsHidden, setSuggestionsHidden] = useState(false);
  const [suggestionsHovered, setSuggestionsHovered] = useState(false);
  const [slideDirection, setSlideDirection] = useState('right');

  // Autocomplete state
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debouncedTitle = useDebounced(newBook.title, 350);
  const lastSelectedTitle = useRef('');

  useEffect(() => {
    (async () => {
      try {
        const { data, error: fetchErr } = await supabase
          .from('books')
          .select('*')
          .order('created_at', { ascending: false });
        if (fetchErr) throw fetchErr;
        setBooks(data || []);
      } catch (e) {
        setError('Could not load library: ' + (e?.message || 'unknown error'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Auto-rotate suggested reads every 8s (pauses on hover)
  useEffect(() => {
    if (suggestionsHidden || suggestionsHovered) return;
    const interval = setInterval(() => {
      setSlideDirection('right');
      setSuggestionIdx((i) => (i + 1) % SUGGESTED_READS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [suggestionsHidden, suggestionsHovered]);

  const goToSuggestion = (newIdx) => {
    setSlideDirection(newIdx > suggestionIdx || (suggestionIdx === SUGGESTED_READS.length - 1 && newIdx === 0) ? 'right' : 'left');
    setSuggestionIdx(newIdx);
  };

  const nextSuggestion = () => goToSuggestion((suggestionIdx + 1) % SUGGESTED_READS.length);
  const prevSuggestion = () => goToSuggestion((suggestionIdx - 1 + SUGGESTED_READS.length) % SUGGESTED_READS.length);

  // Open Library autocomplete
  useEffect(() => {
    const q = debouncedTitle.trim();
    if (q.length < 3 || q === lastSelectedTitle.current) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    setSuggestionsLoading(true);
    fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=5&fields=title,author_name,first_publish_year`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const results = (data?.docs || [])
          .filter((d) => d.title && d.author_name && d.author_name.length > 0)
          .slice(0, 5)
          .map((d) => ({
            title: d.title,
            author: d.author_name[0],
            year: d.first_publish_year,
          }));
        setSuggestions(results);
        setShowSuggestions(true);
      })
      .catch(() => {
        if (!cancelled) setSuggestions([]);
      })
      .finally(() => {
        if (!cancelled) setSuggestionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedTitle]);

  const selectSuggestion = (s) => {
    lastSelectedTitle.current = s.title;
    setNewBook({ ...newBook, title: s.title, author: s.author });
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const addBook = async () => {
    if (!newBook.title.trim() || !newBook.author.trim()) return;
    try {
      const { data, error: insertErr } = await supabase
        .from('books')
        .insert([
          {
            title: newBook.title.trim(),
            author: newBook.author.trim(),
            category: newBook.category,
          },
        ])
        .select()
        .single();
      if (insertErr) throw insertErr;
      setBooks([data, ...books]);
      setNewBook({ title: '', author: '', category: newBook.category });
      setSuggestions([]);
      setShowSuggestions(false);
      lastSelectedTitle.current = '';
      setShowAddModal(false);
    } catch (e) {
      setError('Failed to add book: ' + (e?.message || ''));
    }
  };

  const openAddModal = () => {
    setNewBook({ title: '', author: '', category: 'Business & Investing' });
    setSuggestions([]);
    setShowSuggestions(false);
    lastSelectedTitle.current = '';
    setShowAddModal(true);
  };

  const deleteBook = async (id) => {
    try {
      const { error: delErr } = await supabase.from('books').delete().eq('id', id);
      if (delErr) throw delErr;
      setBooks(books.filter((b) => b.id !== id));
    } catch (e) {
      setError('Failed to delete: ' + (e?.message || ''));
    }
  };

  const exportCSV = () => {
    const rows = [['Title', 'Author', 'Category']];
    books.forEach((b) => rows.push([b.title, b.author, b.category]));
    const csv = rows
      .map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'library.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = useMemo(() => {
    let list = books;
    if (activeCategory !== 'All') {
      list = list.filter((b) => b.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q)
      );
    }
    const sorted = [...list].sort((a, b) => {
      if (sortBy === 'author') {
        const la = a.author.split(/\s+/).pop().toLowerCase();
        const lb = b.author.split(/\s+/).pop().toLowerCase();
        return la.localeCompare(lb);
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category) || a.title.localeCompare(b.title);
      }
      return a.title
        .replace(/^(The|A|An)\s+/i, '')
        .localeCompare(b.title.replace(/^(The|A|An)\s+/i, ''));
    });
    return sorted;
  }, [books, activeCategory, search, sortBy]);

  const categoryCounts = useMemo(() => {
    const counts = {};
    books.forEach((b) => {
      counts[b.category] = (counts[b.category] || 0) + 1;
    });
    return counts;
  }, [books]);

  const authorCounts = useMemo(() => {
    const counts = {};
    books.forEach((b) => {
      counts[b.author] = (counts[b.author] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, n]) => n > 1)
      .sort((a, b) => b[1] - a[1]);
  }, [books]);

  const totalCount = books.length;
  const currentSuggestion = SUGGESTED_READS[suggestionIdx];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f4ede0' }}>
        <div className="text-stone-700 italic">Opening the library…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#f4ede0' }}>
      <style>{`
        .display-font { font-family: 'Playfair Display', Georgia, serif; }
        .mono-font { font-family: 'JetBrains Mono', ui-monospace, monospace; }
        .deckled { border-bottom: 1px solid rgba(74, 56, 37, 0.15); }
        .book-row:hover { background: rgba(74, 56, 37, 0.04); }
        .pill { transition: all 0.15s ease; }
        .pill:hover { transform: translateY(-1px); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.25s ease-out; }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .slide-in-right { animation: slideInRight 0.35s ease-out; }
        .slide-in-left { animation: slideInLeft 0.35s ease-out; }
        .suggestion-card { background: linear-gradient(180deg, #efe4cd 0%, #ebe0cb 100%); }
        .nav-btn { 
          transition: all 0.15s ease;
        }
        .nav-btn:hover { 
          background: #2a1f14 !important; 
          color: #f4ede0 !important; 
          border-color: #2a1f14 !important;
        }
        .nav-btn:hover svg { color: #f4ede0 !important; }
        .dot { 
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .dot:hover { transform: scale(1.4); }
      `}</style>

      <header className="border-b-2" style={{ borderColor: '#4a3825', background: '#ebe0cb' }}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="mono-font text-xs uppercase tracking-[0.3em] text-stone-600 mb-2">
                Private Collection · Est. 2025
              </div>
              <h1 className="display-font text-5xl md:text-6xl font-black tracking-tight" style={{ color: '#2a1f14' }}>
                The Library
              </h1>
              <div className="mt-2 text-stone-700 italic text-lg">
                A catalogue of {totalCount} books
              </div>
            </div>
            <div className="hidden md:block text-right">
              <div className="mono-font text-xs uppercase tracking-widest text-stone-500">No.</div>
              <div className="display-font text-6xl font-black" style={{ color: '#8b3a2b' }}>
                {String(totalCount).padStart(3, '0')}
              </div>
            </div>
          </div>
        </div>
      </header>

      {!suggestionsHidden && (
        <div className="max-w-6xl mx-auto px-6 pt-5">
          <div
            className="suggestion-card border rounded-sm relative"
            style={{ borderColor: 'rgba(74, 56, 37, 0.25)' }}
            onMouseEnter={() => setSuggestionsHovered(true)}
            onMouseLeave={() => setSuggestionsHovered(false)}
          >
            {/* Dismiss button */}
            <button
              onClick={() => setSuggestionsHidden(true)}
              className="absolute top-2 right-2 z-10 text-stone-400 hover:text-stone-700 p-1.5 rounded-sm hover:bg-stone-100/50"
              aria-label="Hide suggestions"
              title="Hide suggestions"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Main content row */}
            <div className="flex items-stretch">
              {/* Previous button */}
              <button
                onClick={prevSuggestion}
                className="nav-btn flex-shrink-0 flex items-center justify-center w-10 md:w-12 border-r"
                style={{ borderColor: 'rgba(74, 56, 37, 0.15)', background: 'rgba(255,255,255,0.2)' }}
                aria-label="Previous suggestion"
              >
                <ChevronLeft className="w-5 h-5 text-stone-600" />
              </button>

              {/* Suggestion content */}
              <div className="flex-1 min-w-0 px-4 md:px-6 py-5 pr-10">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 flex-shrink-0" style={{ color: '#8b3a2b' }} />
                  <div className="mono-font text-[10px] uppercase tracking-widest text-stone-600">
                    Recommended for your shelf
                  </div>
                </div>
                <div
                  key={suggestionIdx}
                  className={slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}
                >
                  <div className="display-font text-xl md:text-2xl font-bold text-stone-900 leading-tight">
                    {currentSuggestion.title}
                  </div>
                  <div className="italic text-stone-700 mb-2">{currentSuggestion.author}</div>
                  <div className="text-sm text-stone-700 leading-snug">{currentSuggestion.why}</div>
                </div>
              </div>

              {/* Next button */}
              <button
                onClick={nextSuggestion}
                className="nav-btn flex-shrink-0 flex items-center justify-center w-10 md:w-12 border-l"
                style={{ borderColor: 'rgba(74, 56, 37, 0.15)', background: 'rgba(255,255,255,0.2)' }}
                aria-label="Next suggestion"
              >
                <ChevronRight className="w-5 h-5 text-stone-600" />
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-1.5 pb-3 pt-1">
              {SUGGESTED_READS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goToSuggestion(i)}
                  className="dot"
                  aria-label={`Go to suggestion ${i + 1}`}
                  style={{
                    width: i === suggestionIdx ? '20px' : '6px',
                    height: '6px',
                    borderRadius: '3px',
                    background: i === suggestionIdx ? '#8b3a2b' : 'rgba(74, 56, 37, 0.25)',
                    border: 'none',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-20 border-b" style={{ background: '#f4ede0', borderColor: 'rgba(74, 56, 37, 0.2)' }}>
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
              <input
                type="text"
                placeholder="Search title, author, or category…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border rounded-sm text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-700"
                style={{ borderColor: 'rgba(74, 56, 37, 0.25)', fontFamily: "'EB Garamond', serif", fontSize: '17px' }}
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="mono-font text-xs uppercase tracking-widest py-2.5 px-3 bg-white border rounded-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-700"
              style={{ borderColor: 'rgba(74, 56, 37, 0.25)' }}
            >
              <option value="title">Sort: Title</option>
              <option value="author">Sort: Author</option>
              <option value="category">Sort: Category</option>
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setShowStatsModal(true)}
                className="mono-font text-xs uppercase tracking-widest py-2.5 px-4 border rounded-sm text-stone-700 hover:bg-stone-100 flex items-center gap-2"
                style={{ borderColor: 'rgba(74, 56, 37, 0.25)', background: 'white' }}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Stats
              </button>
              <button
                onClick={exportCSV}
                className="mono-font text-xs uppercase tracking-widest py-2.5 px-4 border rounded-sm text-stone-700 hover:bg-stone-100 flex items-center gap-2"
                style={{ borderColor: 'rgba(74, 56, 37, 0.25)', background: 'white' }}
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
              <button
                onClick={openAddModal}
                className="mono-font text-xs uppercase tracking-widest py-2.5 px-4 rounded-sm text-amber-50 hover:opacity-90 flex items-center gap-2"
                style={{ background: '#2a1f14' }}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Book
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <CategoryPill
              label="All"
              count={totalCount}
              active={activeCategory === 'All'}
              onClick={() => setActiveCategory('All')}
            />
            {ALL_CATEGORIES.map((cat) => (
              <CategoryPill
                key={cat}
                label={cat}
                count={categoryCounts[cat] || 0}
                active={activeCategory === cat}
                onClick={() => setActiveCategory(cat)}
              />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-6xl mx-auto px-6 mt-4">
          <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-sm rounded-sm flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-baseline justify-between mb-6">
          <h2 className="display-font text-2xl italic text-stone-700">
            {activeCategory === 'All' ? 'Complete Catalogue' : activeCategory}
          </h2>
          <div className="mono-font text-xs uppercase tracking-widest text-stone-500">
            {filtered.length} {filtered.length === 1 ? 'book' : 'books'}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20 text-stone-500 italic">No books match your query.</div>
        ) : (
          <div className="fade-in">
            {filtered.map((book, idx) => (
              <div key={book.id} className="book-row deckled py-4 px-2 flex items-center gap-4 group">
                <div className="mono-font text-xs text-stone-400 w-10 flex-shrink-0">
                  {String(idx + 1).padStart(3, '0')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="display-font text-lg font-semibold text-stone-900 leading-snug">
                    {book.title}
                  </div>
                  <div className="flex items-baseline gap-3 mt-0.5 flex-wrap">
                    <span className="italic text-stone-700">{book.author}</span>
                    <span className="mono-font text-[10px] uppercase tracking-widest text-stone-500">
                      · {book.category}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (confirm(`Remove "${book.title}" from the library?`)) deleteBook(book.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-2 text-stone-400 hover:text-red-700"
                  aria-label="Remove book"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="border-t mt-16 py-8" style={{ borderColor: 'rgba(74, 56, 37, 0.2)' }}>
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center text-sm text-stone-600">
          <span className="italic">Catalogued with care.</span>
          <span className="mono-font text-xs uppercase tracking-widest">
            {totalCount} books · {Object.keys(categoryCounts).length} categories
          </span>
        </div>
      </footer>

      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} title="Add a Book">
          <div className="space-y-4">
            <div className="relative">
              <Field label="Title">
                <input
                  type="text"
                  value={newBook.title}
                  onChange={(e) => {
                    setNewBook({ ...newBook, title: e.target.value });
                    lastSelectedTitle.current = '';
                  }}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full px-3 py-2 bg-white border rounded-sm focus:outline-none focus:ring-2 focus:ring-stone-700"
                  style={{ borderColor: 'rgba(74, 56, 37, 0.25)', fontFamily: "'EB Garamond', serif", fontSize: '17px' }}
                  autoFocus
                  autoComplete="off"
                />
              </Field>
              {showSuggestions && suggestions.length > 0 && (
                <div
                  className="absolute z-10 mt-1 w-full bg-white border rounded-sm shadow-lg max-h-72 overflow-auto"
                  style={{ borderColor: 'rgba(74, 56, 37, 0.25)' }}
                >
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => selectSuggestion(s)}
                      className="w-full text-left px-3 py-2 hover:bg-stone-100 border-b last:border-b-0 transition-colors"
                      style={{ borderColor: 'rgba(74, 56, 37, 0.1)' }}
                    >
                      <div className="font-semibold text-stone-900 leading-snug">{s.title}</div>
                      <div className="text-sm italic text-stone-600">
                        {s.author}
                        {s.year && <span className="mono-font text-xs text-stone-500 not-italic ml-2">({s.year})</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {suggestionsLoading && (
                <div className="mono-font text-[10px] uppercase tracking-widest text-stone-400 mt-1 italic">
                  searching…
                </div>
              )}
            </div>
            <Field label="Author">
              <input
                type="text"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="w-full px-3 py-2 bg-white border rounded-sm focus:outline-none focus:ring-2 focus:ring-stone-700"
                style={{ borderColor: 'rgba(74, 56, 37, 0.25)', fontFamily: "'EB Garamond', serif", fontSize: '17px' }}
                autoComplete="off"
              />
            </Field>
            <Field label="Category">
              <select
                value={newBook.category}
                onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                className="w-full px-3 py-2 bg-white border rounded-sm focus:outline-none focus:ring-2 focus:ring-stone-700"
                style={{ borderColor: 'rgba(74, 56, 37, 0.25)', fontFamily: "'EB Garamond', serif", fontSize: '17px' }}
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="mono-font text-xs uppercase tracking-widest py-2 px-4 border rounded-sm text-stone-700 hover:bg-stone-100"
                style={{ borderColor: 'rgba(74, 56, 37, 0.25)' }}
              >
                Cancel
              </button>
              <button
                onClick={addBook}
                disabled={!newBook.title.trim() || !newBook.author.trim()}
                className="mono-font text-xs uppercase tracking-widest py-2 px-4 rounded-sm text-amber-50 hover:opacity-90 disabled:opacity-40"
                style={{ background: '#2a1f14' }}
              >
                Add to Library
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showStatsModal && (
        <Modal onClose={() => setShowStatsModal(false)} title="Library Statistics">
          <div className="space-y-6">
            <div>
              <div className="mono-font text-xs uppercase tracking-widest text-stone-500 mb-3">By Category</div>
              <div className="space-y-2">
                {Object.entries(categoryCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, n]) => {
                    const pct = Math.round((n / totalCount) * 100);
                    return (
                      <div key={cat}>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="text-stone-800">{cat}</span>
                          <span className="mono-font text-xs text-stone-600">
                            {n} · {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#8b3a2b' }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {authorCounts.length > 0 && (
              <div>
                <div className="mono-font text-xs uppercase tracking-widest text-stone-500 mb-3">
                  Most-Represented Authors
                </div>
                <div className="space-y-1.5">
                  {authorCounts.slice(0, 10).map(([author, n]) => (
                    <div key={author} className="flex justify-between text-sm">
                      <span className="italic text-stone-800">{author}</span>
                      <span className="mono-font text-xs text-stone-600">{n} books</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t flex justify-between text-sm" style={{ borderColor: 'rgba(74, 56, 37, 0.2)' }}>
              <span className="italic text-stone-700">Total books catalogued</span>
              <span className="display-font font-bold text-xl" style={{ color: '#8b3a2b' }}>
                {totalCount}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CategoryPill({ label, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`pill mono-font text-[11px] uppercase tracking-widest px-3 py-1.5 rounded-sm border transition-all ${
        active ? 'text-amber-50' : 'text-stone-700 hover:bg-stone-100'
      }`}
      style={{
        borderColor: active ? '#2a1f14' : 'rgba(74, 56, 37, 0.25)',
        background: active ? '#2a1f14' : 'white',
      }}
    >
      {label}
      <span className={`ml-2 ${active ? 'text-amber-200' : 'text-stone-500'}`}>{count}</span>
    </button>
  );
}

function Modal({ title, children, onClose }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(42, 31, 20, 0.5)' }}
      onClick={onClose}
    >
      <div
        className="fade-in bg-white rounded-sm shadow-2xl max-w-lg w-full max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-5 border-b-2" style={{ borderColor: '#2a1f14' }}>
          <h3 className="display-font text-xl font-bold text-stone-900">{title}</h3>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5" style={{ fontFamily: "'EB Garamond', serif", fontSize: '16px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <div className="mono-font text-xs uppercase tracking-widest text-stone-600 mb-1.5">{label}</div>
      {children}
    </label>
  );
}
