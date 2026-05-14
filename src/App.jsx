import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Trash2, Download, X, BarChart3 } from 'lucide-react';
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

  // Load all books from Supabase
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
      setShowAddModal(false);
    } catch (e) {
      setError('Failed to add book: ' + (e?.message || ''));
    }
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
      `}</style>

      {/* Masthead */}
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

      {/* Controls bar */}
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
                onClick={() => setShowAddModal(true)}
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
            <Field label="Title">
              <input
                type="text"
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                className="w-full px-3 py-2 bg-white border rounded-sm focus:outline-none focus:ring-2 focus:ring-stone-700"
                style={{ borderColor: 'rgba(74, 56, 37, 0.25)', fontFamily: "'EB Garamond', serif", fontSize: '17px' }}
                autoFocus
              />
            </Field>
            <Field label="Author">
              <input
                type="text"
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                className="w-full px-3 py-2 bg-white border rounded-sm focus:outline-none focus:ring-2 focus:ring-stone-700"
                style={{ borderColor: 'rgba(74, 56, 37, 0.25)', fontFamily: "'EB Garamond', serif", fontSize: '17px' }}
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
