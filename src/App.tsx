import { useState, useMemo } from 'react';
import { Search, User, UserCheck, Copy, Check, RotateCcw, ExternalLink, Sparkles, Loader2 } from 'lucide-react';
import { firstNames as initialFirstNames, lastNames as initialLastNames } from './data/names';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function App() {
  const [query, setQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [extraFirstNames, setExtraFirstNames] = useState<string[]>([]);
  const [extraLastNames, setExtraLastNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const allFirstNames = useMemo(() => Array.from(new Set([...initialFirstNames, ...extraFirstNames])), [extraFirstNames]);
  const allLastNames = useMemo(() => Array.from(new Set([...initialLastNames, ...extraLastNames])), [extraLastNames]);

  // Check if current query is likely a first or last name
  const detection = useMemo(() => {
    if (!query || query.length < 2) return null;
    const q = query.trim().toLowerCase();
    
    const isKnownFirst = allFirstNames.some(n => n.toLowerCase() === q);
    const isKnownLast = allLastNames.some(n => n.toLowerCase() === q);

    if (isKnownFirst && !isKnownLast) return 'first';
    if (isKnownLast && !isKnownFirst) return 'last';
    if (isKnownFirst && isKnownLast) return 'both';
    
    return null;
  }, [query, allFirstNames, allLastNames]);

  const filteredFirstNames = useMemo(() => {
    if (!query) return allFirstNames.slice(0, 10);
    const q = query.toLowerCase();
    const startingWith = allFirstNames.filter(name => name.toLowerCase().startsWith(q));
    const containing = allFirstNames.filter(name => name.toLowerCase().includes(q) && !name.toLowerCase().startsWith(q));
    return Array.from(new Set([...startingWith, ...containing])).slice(0, 10);
  }, [query, allFirstNames]);

  const filteredLastNames = useMemo(() => {
    if (!query) return allLastNames.slice(0, 10);
    const q = query.toLowerCase();
    const startingWith = allLastNames.filter(name => name.toLowerCase().startsWith(q));
    const containing = allLastNames.filter(name => name.toLowerCase().includes(q) && !name.toLowerCase().startsWith(q));
    return Array.from(new Set([...startingWith, ...containing])).slice(0, 10);
  }, [query, allLastNames]);

  const fetchExtraNames = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('https://randomuser.me/api/?results=20&nat=us&inc=name');
      const data = await response.json();
      const newFirsts = data.results.map((r: any) => r.name.first);
      const newLasts = data.results.map((r: any) => r.name.last);
      
      setExtraFirstNames(prev => [...prev, ...newFirsts]);
      setExtraLastNames(prev => [...prev, ...newLasts]);
    } catch (error) {
      console.error("Failed to fetch names:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleClear = () => {
    setQuery('');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center p-4 rounded-3xl bg-white shadow-xl shadow-indigo-100/50 mb-6 border border-indigo-50"
          >
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-600 p-3 rounded-2xl text-white">
              <UserCheck size={32} />
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-black text-slate-900 mb-3 tracking-tight"
          >
            US Name Finder
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 text-lg max-w-lg mx-auto"
          >
            Generate and complete common US names. Type a letter or a sequence to start matching.
          </motion.p>
        </header>

        <div className="flex flex-col md:flex-row gap-4 mb-12 max-w-2xl mx-auto">
          <div className="relative flex-grow group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
              <Search size={22} />
            </div>
            <input
              type="text"
              className="block w-full pl-14 pr-12 py-5 bg-white border-0 rounded-[2rem] shadow-2xl shadow-slate-200/50 focus:ring-4 focus:ring-indigo-500/10 text-xl transition-all placeholder:text-slate-300 font-medium"
              placeholder="Search, complete, or auto-detect..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                <AnimatePresence>
                  {detection && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md",
                        detection === 'first' ? "bg-indigo-100 text-indigo-600" : 
                        detection === 'last' ? "bg-violet-100 text-violet-600" :
                        "bg-amber-100 text-amber-600"
                      )}
                    >
                      Detected: {detection}
                    </motion.span>
                  )}
                </AnimatePresence>
                <button
                  onClick={handleClear}
                  className="p-1 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  <RotateCcw size={20} />
                </button>
              </div>
            )}
          </div>
          <button
            onClick={fetchExtraNames}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-8 py-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-[2rem] shadow-xl shadow-indigo-200 transition-all active:scale-95 min-w-[180px]"
          >
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
            {isLoading ? "Fetching..." : "Fetch More"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-12">
          {/* First Names Section */}
          <section className="bg-white/50 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                <User size={18} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">First Names</h2>
              <span className="ml-auto text-xs font-bold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full uppercase tracking-wider">
                {filteredFirstNames.length} Matches
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredFirstNames.length > 0 ? (
                  filteredFirstNames.map((name, idx) => (
                    <NameCard
                      key={`first-${name}-${idx}`}
                      name={name}
                      onCopy={() => copyToClipboard(name)}
                      isCopied={copiedText === name}
                    />
                  ))
                ) : (
                  <EmptyState />
                )}
              </AnimatePresence>
            </div>
          </section>

          {/* Last Names Section */}
          <section className="bg-white/50 backdrop-blur-sm p-6 rounded-[2.5rem] border border-white shadow-sm">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="bg-violet-100 p-2 rounded-xl text-violet-600">
                <UserCheck size={18} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Last Names</h2>
              <span className="ml-auto text-xs font-bold text-violet-500 bg-violet-50 px-3 py-1 rounded-full uppercase tracking-wider">
                {filteredLastNames.length} Matches
              </span>
            </div>
            <div className="space-y-2">
              <AnimatePresence mode="popLayout" initial={false}>
                {filteredLastNames.length > 0 ? (
                  filteredLastNames.map((name, idx) => (
                    <NameCard
                      key={`last-${name}-${idx}`}
                      name={name}
                      onCopy={() => copyToClipboard(name)}
                      isCopied={copiedText === name}
                    />
                  ))
                ) : (
                  <EmptyState />
                )}
              </AnimatePresence>
            </div>
          </section>
        </div>

        {/* Combined Full Name Suggestion / Auto-Complete */}
        <AnimatePresence mode="wait">
          {query && (
            <motion.div
              key={detection || 'general'}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="mt-12 p-10 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[3rem] text-white text-center shadow-2xl shadow-indigo-900/20 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-indigo-500/10 blur-3xl rounded-full"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-violet-500/10 blur-3xl rounded-full"></div>
              
              <h3 className="text-indigo-400 font-bold mb-4 uppercase tracking-[0.2em] text-xs">
                {detection === 'first' ? 'Matches found for First Name - Generating Surnames' :
                 detection === 'last' ? 'Matches found for Surname - Generating First Names' :
                 detection === 'both' ? 'Matches found for both - Generating Combinations' :
                 'Suggested Full Name'}
              </h3>

              <div className="text-4xl md:text-6xl font-black mb-8 tracking-tight">
                {(() => {
                  const qLower = query.toLowerCase().trim();
                  
                  // Handle "Both" case or cases where first/last matches the query exactly
                  if (detection === 'both' || (detection === 'first' && filteredLastNames[0]?.toLowerCase() === qLower) || (detection === 'last' && filteredFirstNames[0]?.toLowerCase() === qLower)) {
                    const altFirst = allFirstNames.find(n => n.toLowerCase() !== qLower) || allFirstNames[0];
                    const altLast = allLastNames.find(n => n.toLowerCase() !== qLower) || allLastNames[0];
                    
                    return (
                      <div className="flex flex-col gap-6">
                        <div className="text-3xl md:text-5xl">
                          {query} <span className="text-violet-400">{altLast}</span>
                        </div>
                        <div className="h-px bg-white/10 w-24 mx-auto" />
                        <div className="text-3xl md:text-5xl">
                          <span className="text-indigo-400">{altFirst}</span> {query}
                        </div>
                      </div>
                    );
                  }

                  // Handle First Name Detection
                  if (detection === 'first') {
                    return <>{query} <span className="text-violet-400">{filteredLastNames[0]}</span></>;
                  }

                  // Handle Last Name Detection
                  if (detection === 'last') {
                    return <><span className="text-indigo-400">{filteredFirstNames[0]}</span> {query}</>;
                  }

                  // General suggestion (searching)
                  // Ensure we don't suggest same first and last
                  const sugFirst = filteredFirstNames[0];
                  let sugLast = filteredLastNames[0];
                  if (sugFirst?.toLowerCase() === sugLast?.toLowerCase()) {
                    sugLast = filteredLastNames[1] || allLastNames.find(n => n !== sugFirst) || sugLast;
                  }

                  return <>{sugFirst} <span className="text-violet-400">{sugLast}</span></>;
                })()}
              </div>

              <button
                onClick={() => {
                  const qLower = query.toLowerCase().trim();
                  let fullName = "";
                  
                  if (detection === 'both' || (detection === 'first' && filteredLastNames[0]?.toLowerCase() === qLower) || (detection === 'last' && filteredFirstNames[0]?.toLowerCase() === qLower)) {
                    // Default to first as query + unique last for the primary copy button
                    const altLast = allLastNames.find(n => n.toLowerCase() !== qLower) || allLastNames[0];
                    fullName = `${query} ${altLast}`;
                  } else if (detection === 'last') {
                    fullName = `${filteredFirstNames[0]} ${query}`;
                  } else if (detection === 'first') {
                    fullName = `${query} ${filteredLastNames[0]}`;
                  } else {
                    const sugFirst = filteredFirstNames[0];
                    let sugLast = filteredLastNames[0];
                    if (sugFirst?.toLowerCase() === sugLast?.toLowerCase()) {
                      sugLast = filteredLastNames[1] || allLastNames.find(n => n !== sugFirst) || sugLast;
                    }
                    fullName = `${sugFirst} ${sugLast}`;
                  }
                  copyToClipboard(fullName);
                }}
                className={cn(
                  "px-8 py-4 rounded-2xl font-bold transition-all flex items-center gap-3 mx-auto shadow-lg",
                  copiedText && (copiedText.toLowerCase().includes(query.toLowerCase()) || copiedText === `${filteredFirstNames[0]} ${filteredLastNames[0]}`)
                    ? "bg-emerald-500 text-white shadow-emerald-500/20"
                    : "bg-white text-slate-900 hover:bg-slate-50 active:scale-95 shadow-white/10"
                )}
              >
                {copiedText?.includes(query) ? (
                  <>
                    <Check size={20} /> Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy size={20} /> Copy Full Name
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* External Tools Section */}
        <section className="mt-24 mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Want even more names?</h2>
            <p className="text-slate-500">Explore these professional databases and APIs for expansive lists.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ExternalToolCard 
              title="SSA Data"
              description="Official Social Security baby name records by year."
              url="https://www.ssa.gov/oact/babynames/"
            />
            <ExternalToolCard 
              title="US Census"
              description="Massive database of surnames from US Census records."
              url="https://www.census.gov/topics/population/genealogy/data.html"
            />
            <ExternalToolCard 
              title="RandomUser API"
              description="A free, open-source API for generating random user data."
              url="https://randomuser.me/"
            />
          </div>
        </section>

        <footer className="mt-20 border-t border-slate-200 pt-10 text-center text-slate-400 text-sm">
          <p>© 2024 US Name Finder • Built with React & Tailwind</p>
        </footer>
      </div>
    </div>
  );
}

function ExternalToolCard({ title, description, url }: { title: string; description: string; url: string }) {
  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="group block p-6 bg-white rounded-3xl border border-slate-100 hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-800">{title}</h4>
        <ExternalLink size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
      </div>
      <p className="text-sm text-slate-500 leading-relaxed">{description}</p>
    </a>
  );
}


function NameCard({ name, onCopy, isCopied }: { name: string; onCopy: () => void; isCopied: boolean }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="group flex items-center justify-between p-1 pl-5 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100"
    >
      <span className="text-slate-700 font-semibold">{name}</span>
      <button
        onClick={onCopy}
        className={cn(
          "p-3 rounded-xl transition-all",
          isCopied 
            ? "bg-emerald-50 text-emerald-600 scale-100" 
            : "text-slate-300 group-hover:text-indigo-500 group-hover:bg-indigo-50 opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100"
        )}
      >
        {isCopied ? <Check size={18} /> : <Copy size={18} />}
      </button>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-12"
    >
      <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
        <Search className="text-slate-300" size={20} />
      </div>
      <p className="text-slate-400 font-medium">No matches found</p>
    </motion.div>
  );
}

export default App;
