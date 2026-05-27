import React, { useState } from 'react';
import { Category } from '../types';
import { Newspaper, Calendar, Award, Compass, ExternalLink, Bookmark, Check, Star, MessageSquare, Zap, Radio } from 'lucide-react';

interface CineRadarWireProps {
  category: Category;
  onChangeCategory: (category: Category) => void;
  isLoading: boolean;
  newsItems: any[];
  summaryPitch?: string;
  recommendations?: any[];
  onBookmarkFilm: (film: any) => void;
  bookmarkedIds: string[];
  isQuotaExceeded?: boolean;
  isApiKeyMissing?: boolean;
  onLoadMore: () => void;
  isSearchingMore: boolean;
  hasLoadedMore: boolean;
  onToggleStarNewsItem: (item: any) => void;
  starredNewsItemIds: string[];
  competitorScout?: any[];
}

export default function CineRadarWire({
  category,
  onChangeCategory,
  isLoading,
  newsItems,
  summaryPitch,
  recommendations,
  onBookmarkFilm,
  bookmarkedIds,
  isQuotaExceeded = false,
  isApiKeyMissing = false,
  onLoadMore,
  isSearchingMore,
  hasLoadedMore,
  onToggleStarNewsItem,
  starredNewsItemIds,
  competitorScout
}: CineRadarWireProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = newsItems.filter(item => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.summary && item.summary.toLowerCase().includes(term)) ||
      (item.director && item.director.toLowerCase().includes(term)) ||
      (item.directors && item.directors.toLowerCase().includes(term)) ||
      (item.festival && item.festival.toLowerCase().includes(term))
    );
  });

  return (
    <div id="cine-radar-wire-panel" className="glass rounded-xl p-6 shadow-xl border border-white/10 flex flex-col h-full min-h-[500px]">
      {/* Category selector */}
      <div className="flex flex-col sm:flex-row border-b border-white/5 pb-3 mb-6 gap-3 sm:gap-4 select-none -mx-6 px-6">
        {[
          { id: 'news', label: 'Art House Press Wire', icon: Newspaper },
          { id: 'releases', label: 'Auteur & Debut Spotlights', icon: Calendar },
          { id: 'festivals', label: 'Festival Bulletins', icon: Award },
          { id: 'curated', label: 'Zita Intel Dispatch', icon: Compass }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = category === tab.id;
          return (
            <button
              id={`tab-btn-${tab.id}`}
              key={tab.id}
              onClick={() => onChangeCategory(tab.id as Category)}
              className={`flex-1 flex items-center justify-center gap-2 pb-2.5 border-b-2 text-[10px] md:text-xs uppercase font-mono font-bold tracking-wider transition-all duration-300 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'border-zita-primary text-zita-primary font-bold drop-shadow-[0_0_8px_rgba(229,9,20,0.4)]'
                  : 'border-transparent text-white/40 hover:text-white/90 hover:border-white/10'
              }`}
            >
              <IconComp className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Info & Filtering */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-5">
        <div>
          <h3 className="font-serif text-3xl tracking-wide uppercase text-white">
            {category === 'news' && 'Independent Press Wire'}
            {category === 'releases' && 'Auteur & Newcomer Bulletins'}
            {category === 'festivals' && 'Festival Laurels & Critics Notes'}
            {category === 'curated' && 'Trade Intelligence Terminal'}
          </h3>
          <p className="text-[11px] text-zita-onbg/60 font-mono uppercase tracking-wider">
            {category === 'news' && 'Real-time journalism tracking global indie studios and boutique operations.'}
            {category === 'releases' && 'Tracking production cycles and theatrical release paths of debut filmmakers.'}
            {category === 'festivals' && 'Award results, jury verdicts, and critical ratings from A-list festival circuits.'}
            {category === 'curated' && 'Swedish art-house macro trends and localized Stockholm distribution monitors.'}
          </p>
        </div>

        {category !== 'curated' && (
          <input
            id="wire-search-field"
            type="text"
            placeholder="Search news, directors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-xs px-3 py-1.5 border border-white/10 rounded bg-black/40 text-white placeholder-white/30 outline-none w-full md:w-56 focus:border-zita-primary transition-all"
          />
        )}
      </div>

      {isApiKeyMissing ? (
        <div id="api-key-warning-banner" className="mb-6 bg-amber-950/40 border border-amber-500/30 rounded-lg p-4 select-none animate-fade-in">
          <div className="flex items-start gap-3">
            <Radio className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs text-zita-onbg/85 leading-relaxed font-sans">
              <span className="font-mono text-amber-500 font-bold uppercase block tracking-wider mb-1">
                ✦ GEMINI API KEY UNRESOLVED ✦
              </span>
              The server could not verify an active <span className="text-amber-400 font-mono font-bold">GEMINI_API_KEY</span>. Real-time Google Search Grounding is temporarily suspended, and high-fidelity curated fallback data is serving instead. If you already connected billing on your Google AI Studio dashboard, please verify that you successfully added the key as <span className="text-amber-400 font-mono font-bold">GEMINI_API_KEY</span> on Render.com and that the web service rebuild completed.
            </div>
          </div>
        </div>
      ) : isQuotaExceeded ? (
        <div id="quota-warning-banner" className="mb-6 bg-red-950/40 border border-red-500/30 rounded-lg p-4 select-none animate-fade-in">
          <div className="flex items-start gap-3">
            <Compass className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="text-xs text-zita-onbg/85 leading-relaxed font-sans">
              <span className="font-mono text-zita-primary font-bold uppercase block tracking-wider mb-1">
                ✦ REGULATORY LOCAL WIRE FEED ACTIVE (COOLDOWN MODE) ✦
              </span>
              The platform's Gemini API quota limit is temporarily exhausted. An automatic intelligent fallback has activated local caching. Re-scanning filters, custom curations, trade recommendations, and Stockholm competitor monitors (Bio Aspen, Bio Rio, Capitol, and SF Bio) remain fully accessible and responsive.
            </div>
          </div>
        </div>
      ) : null}

      {/* Intelligence Stream List */}
      <div className="flex-1 overflow-y-auto max-h-[600px] space-y-4 pr-1">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-9 h-9 border-2 border-zita-primary border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-xs text-zita-onbg/60 font-mono uppercase tracking-widest">Interrogating Cinema Search Grounding...</p>
            <p className="text-[10px] text-white/30 mt-1">Gleaning the latest independent filmmaker bulletins and reviews.</p>
          </div>
        ) : category === 'curated' ? (
          <div className="space-y-6">
            {/* The Intelligence Briefing */}
            <div className="bg-white/2 border border-white/10 rounded-lg p-5">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-zita-primary">
                STOCKHOLM TRADE REPORT
              </span>
              <div className="mt-3 text-sm font-sans leading-relaxed text-zita-onbg font-medium whitespace-pre-line border-l border-zita-primary/30 pl-3">
                {summaryPitch || "The intelligence dispatch engine parses global film news networks to compile Sweden-specific trade briefings. Run a radar scan and align above to refresh."}
              </div>
            </div>

            {/* Critical spot monitoring and analysis */}
            {recommendations && recommendations.length > 0 && (
              <div className="space-y-4">
                <span className="text-[10px] uppercase font-mono font-bold text-white/40 tracking-wider">
                  Spotlighted Industry Movements
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.map((rec: any, i: number) => (
                    <div
                      key={i}
                      className="border border-white/10 rounded-lg bg-white/2 p-4 hover:border-zita-primary/30 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <span className="px-2 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase bg-zita-primary/15 text-zita-primary font-semibold">
                          Critical Alert
                        </span>
                        <h4 className="font-serif text-xl font-bold text-white mt-2 mb-1 uppercase tracking-wide">
                          {rec.title}
                        </h4>
                        <p className="text-xs text-zita-onbg/80 font-sans mt-2 leading-relaxed">
                          <strong>Analysis:</strong> {rec.strategy}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-zita-onbg/50">Tracking demographic: <strong className="text-white">{rec.targetAudience}</strong></span>
                        <button
                          onClick={() => onBookmarkFilm({
                            title: rec.title,
                            importance: rec.strategy,
                            genres: [],
                            summary: `Trade Intelligence Bulletin: ${rec.strategy}`
                          })}
                          className={`flex items-center gap-1 cursor-pointer transition-colors ${
                            bookmarkedIds.includes(rec.title) ? 'text-emerald-400' : 'text-zita-primary hover:text-white'
                          }`}
                        >
                          {bookmarkedIds.includes(rec.title) ? (
                            <><Check className="w-3.5 h-3.5" /> Logged</>
                          ) : (
                            <><Bookmark className="w-3.5 h-3.5" /> Log to Notebook</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stockholm Competitor Programming & Social Monitor */}
            <div className="space-y-4 pt-6 border-t border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span className="text-[10px] uppercase font-mono font-bold text-white/40 tracking-wider flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-zita-primary animate-pulse" />
                  Stockholm Competitor Programming & Social Monitor
                </span>
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">
                  Status: Live Repertoire Scan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {(competitorScout && competitorScout.length > 0 ? competitorScout : [
                  {
                    cinema: "Bio Aspen",
                    programming: "Curating independent Nordic retrospectives, local Hägersten filmmaker spotlights, and micro-budget documentaries.",
                    socialBuzz: "High neighborhood engagement on Instagram; strong focus on local bistro menu collaborations and Sunday brunch cinema.",
                    threatLevel: "Collaboration Opportunity",
                    strategicCounter: "Zita can partner on Sweden-wide independent touring prints or co-promote Stockholm suburb syndicates."
                  },
                  {
                    cinema: "Bio Rio",
                    programming: "Running mainstream-adjacent art-house premieres, Swedish documentary festivals, and premium breakfast screenings.",
                    socialBuzz: "Vibrant Hornstull community feedback, active Twitter/X discussions on local art installations, high social media footprint.",
                    threatLevel: "Medium",
                    strategicCounter: "Leverage Zita's historical repertory cinema archive to capture purist cinephiles looking for rare physical print exhibitions."
                  },
                  {
                    cinema: "Bio Capitol",
                    programming: "Gourmet bistro-paired screenings of premium Cannes acquisitions, high-profile preview nights, and stylish classic re-runs.",
                    socialBuzz: "Extremely popular social media buzz focusing on high-end comfort food, luxury seating, and premium sound systems.",
                    threatLevel: "High",
                    strategicCounter: "Differentiate Zita through high-concept filmmaker discussions, post-screening debates, and ultra-rare curation focus."
                  },
                  {
                    cinema: "SF Bio / Filmstaden",
                    programming: "Massive Hollywood blockbusters, commercial Swedish comedies, and heavy reliance on franchise titles.",
                    socialBuzz: "Broad digital crowd chatter on TikTok surrounding major franchises; occasional consumer critique on uniform commercial experiences and pricing.",
                    threatLevel: "Low",
                    strategicCounter: "Double-down on Zita's strict anti-commercial, commercial-free artistic sanctuary ethos and hand-painted/vintage film aesthetic."
                  }
                ]).map((comp: any, idx: number) => {
                  const getThreatColor = (lvl: string) => {
                    const l = lvl ? lvl.toLowerCase() : "";
                    if (l.includes("high")) return "bg-red-500/10 border-red-500/20 text-red-400";
                    if (l.includes("medium")) return "bg-amber-500/10 border-amber-500/20 text-amber-500";
                    if (l.includes("opportunity") || l.includes("collab")) return "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                    return "bg-zinc-500/15 border-zinc-500/20 text-white/60";
                  };

                  return (
                    <div
                      key={comp.cinema || idx}
                      className="border border-white/5 rounded-lg bg-black/40 p-5 hover:border-white/10 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Box */}
                        <div className="flex items-center justify-between gap-2 overflow-hidden mb-3">
                          <h4 className="font-serif text-2xl tracking-wider text-white uppercase truncate">
                            {comp.cinema}
                          </h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-widest uppercase border shrink-0 font-bold ${getThreatColor(comp.threatLevel)}`}>
                            {comp.threatLevel || "Normal"}
                          </span>
                        </div>

                        {/* Programming Detail */}
                        <div className="mb-3.5 space-y-1">
                          <span className="text-[9px] font-mono uppercase text-zita-primary/70 block tracking-wider font-semibold">
                            ✦ Programming & Repertoire
                          </span>
                          <p className="text-xs text-zita-onbg/80 leading-relaxed font-sans pl-2 border-l border-white/10">
                            {comp.programming}
                          </p>
                        </div>

                        {/* Social Media Activity */}
                        <div className="mb-4 space-y-1">
                          <span className="text-[9px] font-mono uppercase text-sky-400 block tracking-wider font-semibold flex items-center gap-1.5">
                            <MessageSquare className="w-3 h-3 text-sky-400" />
                            Social Media & Audience Buzz
                          </span>
                          <p className="text-xs text-zita-onbg/75 italic leading-relaxed font-sans pl-2 border-l border-sky-400/20">
                            {comp.socialBuzz}
                          </p>
                        </div>
                      </div>

                      {/* Strategic Response */}
                      <div className="mt-2 pt-3 border-t border-white/5 bg-white/2 rounded p-3">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-1 flex items-center gap-1">
                          <Zap className="w-3 h-3 text-emerald-400" />
                          Zita Counteractive Leverage
                        </span>
                        <p className="text-xs font-sans text-zita-onbg leading-relaxed">
                          {comp.strategicCounter}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="h-48 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <Compass className="w-8 h-8 text-white/20 mb-2 animate-pulse" />
            <span className="text-xs text-zita-onbg/60 font-mono">No matching independent report items.</span>
            <span className="text-[10px] text-white/30 mt-1">Adjust search filter or run a live satellite scan above.</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {filteredItems.map((item: any, i: number) => {
                const isBookmarked = bookmarkedIds.includes(item.id || item.title);
                const isStarred = starredNewsItemIds.includes(item.id || item.title);
                return (
                  <div
                    key={item.id || i}
                    className="border border-white/5 rounded-lg bg-white/2 p-5 hover:border-white/20 transition-all duration-300 relative group"
                  >
                    {/* Meta Row */}
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

                      {/* Actions / Date */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zita-onbg/50 font-mono font-medium mr-2">
                          {item.date || item.awardWon || "Live Bulletin"}
                        </span>
                        
                        <button
                          onClick={() => onToggleStarNewsItem(item)}
                          className={`p-1.5 rounded-full border flex items-center justify-center transition cursor-pointer ${
                            isStarred 
                              ? 'bg-amber-400/10 border-amber-400/30 text-amber-400'
                              : 'bg-black/40 border-white/10 hover:border-amber-400/40 text-white/50 hover:text-amber-400'
                          }`}
                          title={isStarred ? "Starred" : "Star article"}
                        >
                          <Star className={`w-3.5 h-3.5 ${isStarred ? "fill-amber-400 text-amber-500" : ""}`} />
                        </button>

                        <button
                          onClick={() => onBookmarkFilm(item)}
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

                    {/* Article/Bulletin Title */}
                    <h4 className="font-serif text-2xl tracking-wide uppercase text-white mt-3 group-hover:text-zita-primary transition-colors duration-300">
                      {item.title}
                    </h4>
                    {(item.directors || item.director) && (
                      <p className="text-xs font-sans italic text-zita-onbg/60 mt-0.5">
                        Spotlight: {item.directors || item.director}
                      </p>
                    )}

                    {/* Main journalistic report content */}
                    <p className="text-xs text-zita-onbg leading-relaxed mt-3 border-l border-white/10 pl-3">
                      {item.summary}
                    </p>

                    {/* Strategic/Critical Merit Commentary */}
                    {item.importance && (
                      <div className="mt-3 bg-black/40 rounded border border-white/5 p-3 text-[11px] leading-relaxed font-sans text-zita-onbg/80">
                        <span className="font-mono text-[9px] font-bold text-zita-primary uppercase tracking-wider block mb-1">
                          Critical Impact Analysis
                        </span>
                        {item.importance}
                      </div>
                    )}

                    {/* Source Credits & Reading URL Link */}
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

            {/* Load More News Action Button - always interactive */}
            <div className="mt-6 pt-5 border-t border-white/5 flex justify-center">
              {isSearchingMore ? (
                <div className="text-xs font-mono tracking-widest text-[#ff3b30] uppercase animate-pulse select-none py-2 text-center">
                   looking up more news
                </div>
              ) : (
                <button
                  id="btn-headline-loader"
                  onClick={onLoadMore}
                  className="px-6 py-2.5 border border-white/25 hover:border-zita-primary text-xs uppercase font-mono tracking-wider font-semibold text-white/85 hover:text-white transition-all bg-white/2 hover:bg-white/5 cursor-pointer rounded active:scale-95 animate-fade-in"
                >
                  load more news
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
