import React, { useState, useEffect } from 'react';
import PosterStudio from './components/PosterStudio';
import CineRadarWire from './components/CineRadarWire';
import ProgramNotebook from './components/ProgramNotebook';
import ProgrammingTab from './components/ProgrammingTab';
import MarketingTab from './components/MarketingTab';
import VisualsTab from './components/VisualsTab';
import { ImageTask, Category } from './types';
import { Sparkles, Star, Bookmark, Check, ExternalLink } from 'lucide-react';

export default function App() {
  // --- ZITA INTEGRATED WORKSPACE STATES ---
  const [activeMainTab, setActiveMainTab] = useState<number>(1);
  const [sessionId] = useState(() => 'zita-session-' + Math.random().toString(36).substring(2, 11));
  const [statusText, setStatusText] = useState("System Ready");
  const [statusState, setStatusState] = useState<'ping' | 'online' | 'error'>('online');

  // Multi-tab transition persistence states
  const [approvedIdeas, setApprovedIdeas] = useState<any[] | null>(() => {
    const saved = localStorage.getItem('zita_approved_ideas');
    return saved ? JSON.parse(saved) : null;
  });
  const [programmingHistory, setProgrammingHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('zita_programming_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [isVisualsUnlocked, setIsVisualsUnlocked] = useState(() => {
    return localStorage.getItem('zita_visuals_unlocked') === 'true';
  });
  const [marketingStrategy, setMarketingStrategy] = useState<any | null>(() => {
    const saved = localStorage.getItem('zita_marketing_strategy');
    return saved ? JSON.parse(saved) : null;
  });
  const [marketingChat, setMarketingChat] = useState<any[]>(() => {
    const saved = localStorage.getItem('zita_marketing_chat');
    return saved ? JSON.parse(saved) : [];
  });
  const [visualsCampaign, setVisualsCampaign] = useState<any | null>(() => {
    const saved = localStorage.getItem('zita_visuals_campaign');
    return saved ? JSON.parse(saved) : null;
  });

  // --- CINERADAR ORIGINAL STATES ---
  const [tasks, setTasks] = useState<ImageTask[]>(() => {
    const saved = localStorage.getItem('cineradar_tasks');
    return saved ? JSON.parse(saved) : [];
  });

  const [bookmarkedFilms, setBookmarkedFilms] = useState<any[]>(() => {
    const saved = localStorage.getItem('cineradar_bookmarks');
    return saved ? JSON.parse(saved) : [];
  });

  const [starredNewsItems, setStarredNewsItems] = useState<any[]>(() => {
    const saved = localStorage.getItem('cineradar_starred');
    return saved ? JSON.parse(saved) : [];
  });

  const [category, setCategory] = useState<Category>('news');
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);
  const [isApiKeyMissing, setIsApiKeyMissing] = useState(false);

  // Category-specific store for seamless instant transitions without losing content
  const [radarData, setRadarData] = useState<Record<Category, {
    newsItems: any[];
    summaryPitch: string;
    recommendations: any[];
    competitorScout: any[];
    isLoaded: boolean;
    isLoading: boolean;
  }>>({
    news: { newsItems: [], summaryPitch: "", recommendations: [], competitorScout: [], isLoaded: false, isLoading: false },
    releases: { newsItems: [], summaryPitch: "", recommendations: [], competitorScout: [], isLoaded: false, isLoading: false },
    festivals: { newsItems: [], summaryPitch: "", recommendations: [], competitorScout: [], isLoaded: false, isLoading: false },
    curated: { newsItems: [], summaryPitch: "", recommendations: [], competitorScout: [], isLoaded: false, isLoading: false },
  });

  const [tickerTime, setTickerTime] = useState("");
  const [activeSection, setActiveSection] = useState<'newsroom' | 'starred' | 'poster' | 'notebook'>('newsroom');

  // Load more pagination states mapping categories
  const [isSearchingMore, setIsSearchingMore] = useState(false);
  const [hasLoadedMore, setHasLoadedMore] = useState<Record<Category, boolean>>({
    news: false,
    releases: false,
    festivals: false,
    curated: false
  });

  const staticCinemaName = "Zita Folkets Bio";
  const staticFocusArea = "Swedish Auteurs, European Art-House, 16mm/35mm Analog retrospectives, and debut indie features";

  // --- LOCAL PERSISTENCE SYNC EFFECTS ---
  useEffect(() => {
    localStorage.setItem('cineradar_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('cineradar_bookmarks', JSON.stringify(bookmarkedFilms));
  }, [bookmarkedFilms]);

  useEffect(() => {
    if (approvedIdeas) {
      localStorage.setItem('zita_approved_ideas', JSON.stringify(approvedIdeas));
    } else {
      localStorage.removeItem('zita_approved_ideas');
    }
  }, [approvedIdeas]);

  useEffect(() => {
    localStorage.setItem('zita_programming_history', JSON.stringify(programmingHistory));
  }, [programmingHistory]);

  useEffect(() => {
    localStorage.setItem('zita_visuals_unlocked', String(isVisualsUnlocked));
  }, [isVisualsUnlocked]);

  useEffect(() => {
    if (marketingStrategy) {
      localStorage.setItem('zita_marketing_strategy', JSON.stringify(marketingStrategy));
    } else {
      localStorage.removeItem('zita_marketing_strategy');
    }
  }, [marketingStrategy]);

  useEffect(() => {
    localStorage.setItem('zita_marketing_chat', JSON.stringify(marketingChat));
  }, [marketingChat]);

  useEffect(() => {
    if (visualsCampaign) {
      localStorage.setItem('zita_visuals_campaign', JSON.stringify(visualsCampaign));
    } else {
      localStorage.removeItem('zita_visuals_campaign');
    }
  }, [visualsCampaign]);

  // Real-time server-synced time tick
  useEffect(() => {
    const updateTick = () => {
      const d = new Date();
      setTickerTime(d.toUTCString().replace("GMT", "UTC"));
    };
    updateTick();
    const interval = setInterval(updateTick, 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch News/Scan coordinates for a specific category
  const triggerRadarScan = async (cat: Category = category, force = false) => {
    // If not a force-refresh and this category's feed has already loaded, skip redundant fetching
    if (!force && radarData[cat].isLoaded) {
      return;
    }

    setRadarData(prev => ({
      ...prev,
      [cat]: { ...prev[cat], isLoading: true }
    }));

    // Reset pagination state when hard refresh or category change occurs
    setHasLoadedMore(prev => ({ ...prev, [cat]: false }));
    try {
      const url = `/api/cine-radar?category=${cat}&cinemaName=${encodeURIComponent(staticCinemaName)}&focusArea=${encodeURIComponent(staticFocusArea)}`;
      const res = await fetch(url);
      const output = await res.json();
      
      setIsQuotaExceeded(!!output.isQuotaExceeded);
      setIsApiKeyMissing(!!output.isApiKeyMissing);
      
      setRadarData(prev => ({
        ...prev,
        [cat]: {
          newsItems: cat === 'curated' ? [] : (output.data || []),
          summaryPitch: cat === 'curated' ? (output.summaryPitch || "") : "",
          recommendations: cat === 'curated' ? (output.recommendations || []) : [],
          competitorScout: cat === 'curated' ? (output.competitorScout || []) : [],
          isLoaded: true,
          isLoading: false
        }
      }));
    } catch (err) {
      console.error(`Scanning malfunction for ${cat}:`, err);
      setRadarData(prev => ({
        ...prev,
        [cat]: { ...prev[cat], isLoading: false }
      }));
    }
  };

  // Trigger dynamic load more items and concatenate
  const handleLoadMore = async () => {
    if (isSearchingMore) return;
    setIsSearchingMore(true);
    const cat = category;
    const currentLength = radarData[cat].newsItems.length;
    try {
      const url = `/api/cine-radar?category=${cat}&loadMore=true&offset=${currentLength}&cinemaName=${encodeURIComponent(staticCinemaName)}&focusArea=${encodeURIComponent(staticFocusArea)}`;
      const res = await fetch(url);
      const output = await res.json();
      
      setIsQuotaExceeded(!!output.isQuotaExceeded);
      setIsApiKeyMissing(!!output.isApiKeyMissing);
      
      if (output.data && Array.isArray(output.data)) {
        setRadarData(prev => ({
          ...prev,
          [cat]: {
            ...prev[cat],
            newsItems: [...prev[cat].newsItems, ...output.data]
          }
        }));
      }
      setHasLoadedMore(prev => ({ ...prev, [cat]: true }));
    } catch (err) {
      console.error("Load more searching malfunction:", err);
    } finally {
      setIsSearchingMore(false);
    }
  };

  // Pre-fetch all News Room categories in the background sequentially on landing page mount
  useEffect(() => {
    const prefetch = async () => {
      const categories: Category[] = ['news', 'releases', 'festivals', 'curated'];
      for (const cat of categories) {
        // Run sequentially to spread server request traffic nicely in the background
        await triggerRadarScan(cat, false);
      }
    };
    prefetch();
  }, []);

  // Sync current section tab state shifts
  useEffect(() => {
    if (activeMainTab === 4) {
      triggerRadarScan(category);
    }
  }, [category, activeMainTab]);

  const handleAddTask = (task: ImageTask) => {
    setTasks(prev => [task, ...prev]);
  };

  const handleUpdateTask = (id: string, updates: Partial<ImageTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const handleBookmarkFilm = (film: any) => {
    if (!film) return;
    const filmId = film.id || film.title;
    if (!filmId) return;
    const exists = (bookmarkedFilms || []).filter(Boolean).some(f => f.id === filmId);
    
    if (exists) {
      setBookmarkedFilms(prev => (prev || []).filter(f => f && f.id !== filmId));
    } else {
      setBookmarkedFilms(prev => [...(prev || []).filter(Boolean), {
        id: filmId,
        title: film.title || "",
        summary: film.summary || film.importance || "Added trade intelligence notice.",
        genres: Array.isArray(film.genres) ? film.genres : typeof film.genres === 'string' ? [film.genres] : [],
        dateSchedule: film.date || "Upcoming Autumn",
        format: '35mm Analog Print'
      }]);
    }
  };

  const handleToggleStarNewsItem = (item: any) => {
    if (!item) return;
    const itemId = item.id || item.title;
    if (!itemId) return;
    const exists = (starredNewsItems || []).filter(Boolean).some(x => x.id === itemId || x.title === item.title);
    let updated;
    if (exists) {
      updated = (starredNewsItems || []).filter(x => x && x.id !== itemId && x.title !== item.title);
    } else {
      updated = [...(starredNewsItems || []).filter(Boolean), {
        id: itemId,
        title: item.title || "",
        summary: item.summary || "",
        source: item.source || "System Grounded Scanner",
        url: item.url || "",
        date: item.date || item.awardWon || "Live Bulletin",
        festival: item.festival || "",
        country: item.country || "",
        genres: item.genres || [],
        importance: item.importance || "",
        directors: item.directors || item.director || ""
      }];
    }
    setStarredNewsItems(updated);
    localStorage.setItem('cineradar_starred', JSON.stringify(updated));
  };

  const handleRemoveBookmark = (id: string) => {
    setBookmarkedFilms(prev => prev.filter(f => f.id !== id));
  };

  const handleClearSession = () => {
    if (window.confirm("Are you sure you want to reset the current session? This will clear all programming boards, generated strategies, and chats.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleToggleStarFromBookmark = (id: string) => {
    const film = bookmarkedFilms.find(f => f.id === id);
    if (film) {
      handleToggleStarNewsItem(film);
    }
  };

  const handleUpdateBookmark = (id: string, updates: any) => {
    setBookmarkedFilms(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  // --- STATUS UPDATER AND STATE INVOCATIONS (STABILIZED) ---
  const updateStatus = React.useCallback((text: string, state: 'ping' | 'online' | 'error') => {
    setStatusText(text);
    setStatusState(state);
  }, []);

  const handleUnlockMarketing = React.useCallback((ideas: any[] | null) => {
    setApprovedIdeas(ideas);
  }, []);

  const handleUnlockVisuals = React.useCallback(() => {
    setIsVisualsUnlocked(true);
  }, []);

  const handleSwitchTab = React.useCallback((tabNum: number) => {
    setActiveMainTab(tabNum);
  }, []);

  const handleSaveMarketingData = React.useCallback((strategy: any, chat: any[]) => {
    setMarketingStrategy(strategy);
    setMarketingChat(chat);
  }, []);

  const handleSaveVisuals = React.useCallback((visuals: any) => {
    setVisualsCampaign(visuals);
  }, []);

  const handleSaveHistory = React.useCallback((history: any[]) => {
    setProgrammingHistory(history);
  }, []);

  return (
    <div className="min-h-screen bg-black text-zita-onbg flex flex-col justify-between selection:bg-zita-primary selection:text-white pb-12 zita-grid">
      
      {/* Dynamic Header mimicking the aesthetic structure of the user template */}
      <header className="bg-black/85 backdrop-blur-md w-full sticky top-0 z-50 border-b border-white/10 select-none">
        <div className="flex flex-col lg:flex-row justify-between items-center w-full px-6 md:px-16 py-4 gap-4">
          <div className="font-serif text-2xl tracking-widest text-zita-primary font-bold">
            ZITA STUDIO
          </div>
          
          {/* Centered navigation menu holding both original layout components and new modular pipelines */}
          <div className="flex flex-wrap gap-4 md:gap-8 justify-center items-center lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2 font-serif text-base md:text-lg tracking-widest font-semibold">
            <button
              onClick={() => setActiveMainTab(1)}
              className={`pb-1 transition-all uppercase cursor-pointer border-b-2 tracking-widest ${
                activeMainTab === 1
                  ? 'text-white border-zita-primary'
                  : 'text-white/30 border-transparent hover:text-white/70'
              }`}
            >
              1. Programming
            </button>
            <button
              onClick={() => { if (approvedIdeas) setActiveMainTab(2); }}
              disabled={!approvedIdeas}
              className={`pb-1 transition-all uppercase border-b-2 tracking-widest ${
                !approvedIdeas
                  ? 'text-white/10 border-transparent cursor-not-allowed pointer-events-none'
                  : activeMainTab === 2
                  ? 'text-white border-zita-primary cursor-pointer'
                  : 'text-white/30 border-transparent hover:text-white/70 cursor-pointer'
              }`}
            >
              2. Marketing Strategy
            </button>
            <button
              onClick={() => { if (isVisualsUnlocked) setActiveMainTab(3); }}
              disabled={!isVisualsUnlocked}
              className={`pb-1 transition-all uppercase border-b-2 tracking-widest ${
                !isVisualsUnlocked
                  ? 'text-white/10 border-transparent cursor-not-allowed pointer-events-none'
                  : activeMainTab === 3
                  ? 'text-white border-zita-primary cursor-pointer'
                  : 'text-white/30 border-transparent hover:text-white/70 cursor-pointer'
              }`}
            >
              3. Visuals
            </button>
            <button
              onClick={() => setActiveMainTab(4)}
              className={`pb-1 transition-all uppercase cursor-pointer border-b-2 tracking-widest ${
                activeMainTab === 4
                  ? 'text-white border-zita-primary'
                  : 'text-white/30 border-transparent hover:text-white/70'
              }`}
            >
              4. News Room
            </button>
          </div>

          {/* Status logs */}
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              statusState === 'ping'
                ? 'bg-zita-primary animate-ping'
                : statusState === 'online'
                ? 'bg-green-500 shadow-[0_0_10px_#22c55e]'
                : 'bg-red-600'
            }`}></span>
            <span className="text-[10px] tracking-[0.4em] uppercase opacity-70 font-mono font-semibold">
              {statusText}
            </span>
          </div>
        </div>
      </header>

      {/* Main Workspace Stage */}
      <div className="px-6 py-12 md:px-16 md:py-16 space-y-12 flex-1 flex flex-col justify-between">
        
        {activeMainTab === 1 && (
          <ProgrammingTab 
            sessionId={sessionId}
            onUnlockMarketing={handleUnlockMarketing}
            onSwitchTab={handleSwitchTab}
            savedIdeas={approvedIdeas}
            savedHistory={programmingHistory}
            onSaveHistory={handleSaveHistory}
            updateStatus={updateStatus}
          />
        )}

        {activeMainTab === 2 && (
          <MarketingTab 
            approvedEvents={approvedIdeas}
            sessionId={sessionId}
            onUnlockVisuals={handleUnlockVisuals}
            onSwitchTab={handleSwitchTab}
            savedStrategy={marketingStrategy}
            savedChat={marketingChat}
            onSaveData={handleSaveMarketingData}
            updateStatus={updateStatus}
          />
        )}

        {activeMainTab === 3 && (
          <VisualsTab 
            approvedEvents={approvedIdeas}
            sessionId={sessionId}
            savedVisuals={visualsCampaign}
            onSaveVisuals={handleSaveVisuals}
            updateStatus={updateStatus}
          />
        )}

        {activeMainTab === 4 && (
          <div className="w-full flex-1 flex flex-col">
            
            {/* Newsroom Editorial header */}
            <header className="border-b border-white/10 select-none mb-12 pb-8">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <div className="text-zita-primary font-mono font-bold tracking-widest text-[9px] uppercase">
                    ZITA CINEMATEK CORE • INTEL STREAM
                  </div>
                  <h1 className="font-serif text-5xl md:text-7xl font-bold text-white tracking-widest leading-none mt-2">
                    ZITA NEWSROOM
                  </h1>
                  <p className="font-sans text-xs text-zita-onbg/60 tracking-widest uppercase font-semibold mt-1">
                    DESIGNATED INDEPENDENT & ART HOUSE FILM NEWS
                  </p>
                </div>
                <div className="text-[10px] text-white/40 font-mono">
                  STHLM TIME: <strong className="text-white/60">{tickerTime}</strong>
                </div>
              </div>
            </header>

            {/* Inner Sub-tab navigation */}
            <div className="flex border-b border-white/10 gap-4 mb-12 select-none">
              <button
                onClick={() => setActiveSection('newsroom')}
                className={`flex-1 py-3 text-center text-xs tracking-widest font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
                  activeSection === 'newsroom'
                    ? 'border-zita-primary text-white bg-white/5 font-extrabold'
                    : 'border-transparent text-white/40 hover:text-white/80'
                }`}
              >
                NEWSROOM
              </button>
              <button
                onClick={() => setActiveSection('starred')}
                className={`flex-1 py-3 text-center text-xs tracking-widest font-mono font-bold uppercase border-b-2 transition-all cursor-pointer relative ${
                  activeSection === 'starred'
                    ? 'border-zita-primary text-white bg-white/5 font-extrabold'
                    : 'border-transparent text-white/40 hover:text-white/80'
                }`}
              >
                STARRED ARTICLES
                {starredNewsItems.length > 0 && (
                  <span className="absolute top-2 right-2 md:right-4 font-mono font-bold text-[9px] bg-amber-500 text-black px-1.5 py-0.5 rounded-full min-w-4 leading-none text-center">
                    {starredNewsItems.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveSection('poster')}
                className={`flex-1 py-3 text-center text-xs tracking-widest font-mono font-bold uppercase border-b-2 transition-all cursor-pointer ${
                  activeSection === 'poster'
                    ? 'border-zita-primary text-white bg-white/5 font-extrabold'
                    : 'border-transparent text-white/40 hover:text-white/80'
                }`}
              >
                POSTER STUDIO
              </button>
              <button
                onClick={() => setActiveSection('notebook')}
                className={`flex-1 py-3 text-center text-xs tracking-widest font-mono font-bold uppercase border-b-2 transition-all cursor-pointer relative ${
                  activeSection === 'notebook'
                    ? 'border-zita-primary text-white bg-white/5 font-extrabold'
                    : 'border-transparent text-white/40 hover:text-white/80'
                }`}
              >
                NOTEBOOK
                {bookmarkedFilms.length > 0 && (
                  <span className="absolute top-2 right-2 md:right-4 font-mono font-bold text-[9px] bg-zita-primary text-white px-1.5 py-0.5 rounded-full min-w-4 leading-none text-center">
                    {bookmarkedFilms.length}
                  </span>
                )}
              </button>
            </div>

            {/* CineRadar Views rendering container */}
            <main className="flex-1 mb-[50px]">
              {activeSection === 'newsroom' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="col-span-1 lg:col-span-12 flex flex-col h-full gap-8">
                    <CineRadarWire
                      category={category}
                      onChangeCategory={setCategory}
                      isLoading={radarData[category].isLoading}
                      newsItems={radarData[category].newsItems}
                      summaryPitch={radarData[category].summaryPitch}
                      recommendations={radarData[category].recommendations}
                      competitorScout={radarData[category].competitorScout}
                      onBookmarkFilm={handleBookmarkFilm}
                      bookmarkedIds={bookmarkedFilms.map(f => f.id)}
                      isQuotaExceeded={isQuotaExceeded}
                      isApiKeyMissing={isApiKeyMissing}
                      onLoadMore={handleLoadMore}
                      isSearchingMore={isSearchingMore}
                      hasLoadedMore={hasLoadedMore[category]}
                      onToggleStarNewsItem={handleToggleStarNewsItem}
                      starredNewsItemIds={starredNewsItems.map(item => item.id || item.title)}
                    />

                    {/* Satellite manual search alignment bar */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-xl border border-white/10 bg-white/2 select-none font-sans">
                      <div className="flex items-center gap-2 mt-1">
                        <Sparkles className="text-zita-primary w-4 h-4 shrink-0" />
                        <span className="text-xs text-zita-onbg/70 text-left">
                          Request dynamic live system intelligence search scanning for global art-house journals.
                        </span>
                      </div>
                      <button
                        onClick={() => triggerRadarScan(category, true)}
                        disabled={radarData[category].isLoading}
                        className="text-xs px-5 py-2 font-serif uppercase tracking-wider text-white bg-zita-primary hover:bg-red-700 disabled:bg-zita-primary/50 transition cursor-pointer zita-btn rounded whitespace-nowrap"
                      >
                        {radarData[category].isLoading ? "Querying networks..." : "Re-Scan Arthouse Feed"}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'starred' && (
                <div className="max-w-4xl mx-auto space-y-8 font-sans">
                  <div className="border-b border-white/5 pb-4">
                    <h3 className="font-serif text-3xl tracking-wide uppercase text-white">
                      Starred Articles
                    </h3>
                    <p className="text-[11px] text-zita-onbg/60 font-mono uppercase tracking-wider mt-1">
                      Your curated compilation of independent film news headlines and critical reviews.
                    </p>
                  </div>

                  {starredNewsItems.length === 0 ? (
                    <div className="h-64 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center p-6 select-none font-mono">
                      <Star className="w-8 h-8 text-white/25 mb-3 animate-pulse" />
                      <span className="text-xs text-zita-onbg/60">No starred articles yet.</span>
                      <span className="text-[10px] text-white/30 mt-1">Star reports in the Newsroom tab to compile them here.</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {starredNewsItems.map((item: any, i: number) => {
                        const isBookmarked = bookmarkedFilms.some(f => f.id === (item.id || item.title));
                        return (
                          <div
                            key={item.id || i}
                            className="border border-white/5 rounded-lg bg-white/2 p-6 hover:border-white/20 transition-all duration-300 relative group select-text"
                          >
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <div className="flex flex-wrap gap-1.5 items-center">
                                {item.festival && (
                                  <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono bg-zita-amber/10 text-zita-amber font-semibold block w-fit">
                                    LAUREL: {item.festival}
                                  </span>
                                )}
                                {item.country && (
                                  <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono bg-white/5 text-white/70 max-w-fit font-semibold inline-block">
                                    REGION: {item.country}
                                  </span>
                                )}
                                {item.genres && Array.isArray(item.genres) && item.genres.map((g: string) => (
                                  <span key={g} className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono bg-zita-primary/10 text-zita-primary font-semibold inline-block">
                                    {g}
                                  </span>
                                ))}
                                {item.genres && typeof item.genres === 'string' && (
                                  <span className="px-2 py-0.5 rounded text-[8px] uppercase tracking-wider font-mono bg-zita-primary/10 text-zita-primary font-semibold inline-block">
                                    {item.genres}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zita-onbg/50 font-mono font-medium mr-2">
                                  {item.date || "Live Bulletin"}
                                </span>

                                <button
                                  onClick={() => handleToggleStarNewsItem(item)}
                                  className="p-1.5 rounded-full border flex items-center justify-center transition cursor-pointer bg-amber-400/10 border-amber-400/30 text-amber-400"
                                  title="Unstar article"
                                >
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                </button>

                                <button
                                  onClick={() => handleBookmarkFilm(item)}
                                  className={`p-1.5 rounded-full border flex items-center justify-center transition cursor-pointer ${
                                    isBookmarked 
                                      ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                                      : 'bg-black/40 border-white/10 hover:border-zita-primary/40 text-white/50 hover:text-zita-primary'
                                  }`}
                                  title={isBookmarked ? "Bulletin highlighted in notebook" : "Highlight bulletin in notebook"}
                                >
                                  {isBookmarked ? <Check className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            <h4 className="font-serif text-2xl tracking-wide uppercase text-white mt-3 group-hover:text-zita-primary transition-colors duration-300">
                              {item.title}
                            </h4>
                            {item.directors && (
                              <p className="text-xs font-sans italic text-zita-onbg/60 mt-0.5">
                                Spotlight: {item.directors}
                              </p>
                            )}

                            <p className="text-xs text-zita-onbg leading-relaxed mt-3 border-l border-white/10 pl-3">
                              {item.summary}
                            </p>

                            {item.importance && (
                              <div className="mt-3 bg-black/40 rounded border border-white/5 p-3 text-[11px] leading-relaxed font-sans text-zita-onbg/80">
                                <span className="font-mono text-[9px] font-bold text-zita-primary uppercase tracking-wider block mb-1">
                                  Critical Impact Analysis
                                </span>
                                {item.importance}
                              </div>
                            )}

                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
                              <span>Press Agency: <strong className="text-white/60">{item.source || "System Grounded Scanner"}</strong></span>
                              {item.url && (
                                <a
                                  href={item.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-zita-primary hover:text-white hover:underline transition-all font-sans"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Read Report File
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'poster' && (
                <div className="max-w-4xl mx-auto">
                  <PosterStudio
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    cinemaName={staticCinemaName}
                  />
                </div>
              )}

              {activeSection === 'notebook' && (
                <div className="max-w-4xl mx-auto">
                  <ProgramNotebook
                    bookmarkedFilms={bookmarkedFilms}
                    onRemoveBookmark={handleRemoveBookmark}
                    onUpdateBookmark={handleUpdateBookmark}
                    cinemaName={staticCinemaName}
                  />
                </div>
              )}
            </main>

          </div>
        )}

        {/* Footer */}
        <footer className="border-t border-white/5 pt-8 text-center text-[10px] font-mono text-white/30 uppercase tracking-widest leading-none flex flex-col md:flex-row justify-between items-center gap-4">
          <p>
            © {new Date().getFullYear()} Zita Folkets Bio • Stockholm, Sweden
          </p>
          <button
            onClick={handleClearSession}
            className="text-[9px] text-zita-primary/60 hover:text-zita-primary font-bold transition-colors cursor-pointer border border-zita-primary/30 hover:border-zita-primary/60 px-3 py-1.5 rounded uppercase tracking-wider"
          >
            Reset Session Data
          </button>
        </footer>

      </div>
    </div>
  );
}
