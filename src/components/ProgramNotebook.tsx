import React, { useState } from 'react';
import { BookOpen, Calendar, Trash2, Layers, Printer, Sparkles, Check } from 'lucide-react';

interface BookmarkedFilm {
  id: string;
  title: string;
  summary: string;
  genres?: string[];
  dateSchedule?: string;
  format?: 'DCP Digital 4K' | '35mm Analog Print' | '16mm Celluloid' | 'DCP Digital 2K';
  lobbyCampaign?: string;
}

interface ProgramNotebookProps {
  bookmarkedFilms: BookmarkedFilm[];
  onRemoveBookmark: (id: string) => void;
  onUpdateBookmark: (id: string, updates: Partial<BookmarkedFilm>) => void;
  cinemaName: string;
}

export default function ProgramNotebook({
  bookmarkedFilms,
  onRemoveBookmark,
  onUpdateBookmark,
  cinemaName
}: ProgramNotebookProps) {
  const [showFlyerModal, setShowFlyerModal] = useState(false);

  const formats = ['DCP Digital 4K', '35mm Analog Print', '16mm Celluloid', 'DCP Digital 2K'] as const;

  return (
    <div id="prog-notebook-panel" className="glass rounded-xl p-6 shadow-xl border border-white/10">
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-zita-primary" />
          <h2 className="font-serif text-2xl tracking-wide uppercase text-white font-bold">
            Drafting Notebook ({bookmarkedFilms.length})
          </h2>
        </div>

        {bookmarkedFilms.length > 0 && (
          <button
            id="compile-flyer-btn"
            onClick={() => setShowFlyerModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-serif tracking-wider bg-zita-primary text-white hover:bg-red-700 cursor-pointer transition-all duration-300 shadow-lg uppercase zita-btn"
          >
            <Printer className="w-3.5 h-3.5" />
            Compile Bulletin Flyer
          </button>
        )}
      </div>
      
      <p className="text-xs text-zita-onbg/70 mb-5 leading-relaxed font-sans">
        Collect tracked cinema bulletins and trade breakthroughs from CineRadar scans. Document scheduled show times, analog projection formats, and panel contexts to prepare local Swedish handouts.
      </p>

      {bookmarkedFilms.length === 0 ? (
        <div className="h-28 border border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center p-4">
          <Calendar className="w-6 h-6 text-white/20 mb-1.5 animate-pulse" />
          <span className="text-xs text-zita-onbg/50 font-mono">Your Notebook is empty.</span>
          <span className="text-[10px] text-white/30">Select "Schedule" on CineRadar news cards to queue updates.</span>
        </div>
      ) : (
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 select-none">
          {bookmarkedFilms.map((film) => (
            <div
              key={film.id}
              className="border border-white/5 rounded-lg bg-black/40 p-4 transition-all hover:border-white/10"
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <h4 className="font-serif text-lg tracking-wider text-white uppercase font-bold">
                    {film.title}
                  </h4>
                  {film.genres && film.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {film.genres.slice(0, 3).map(g => (
                        <span key={g} className="px-1.5 py-0.5 rounded text-[8px] uppercase font-mono bg-zita-primary/10 text-zita-primary font-bold">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onRemoveBookmark(film.id)}
                  className="text-white/40 hover:text-zita-primary p-1 rounded hover:bg-white/5 transition cursor-pointer"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Controls */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-xs font-sans">
                {/* Time Schedule */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-mono font-bold text-white/50 mb-1">
                    Exhibition Window / Slot
                  </label>
                  <input
                    type="text"
                    value={film.dateSchedule || ""}
                    placeholder="e.g. Sept 12-18, 19:30"
                    onChange={(e) => onUpdateBookmark(film.id, { dateSchedule: e.target.value })}
                    className="w-full text-xs font-sans px-2.5 py-1.5 border border-white/10 rounded bg-black/20 text-white outline-none focus:border-zita-primary"
                  />
                </div>

                {/* Projection Format */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-mono font-bold text-white/50 mb-1">
                    Exhibition Format
                  </label>
                  <select
                    value={film.format || "DCP Digital 4K"}
                    onChange={(e) => onUpdateBookmark(film.id, { format: e.target.value as any })}
                    className="w-full text-xs font-sans px-2 py-1.5 border border-white/10 rounded bg-black/20 text-white outline-none focus:border-zita-primary cursor-pointer"
                  >
                    {formats.map(f => (
                      <option key={f} value={f} className="bg-zita-surface text-white">{f}</option>
                    ))}
                  </select>
                </div>

                {/* Campaign Action item */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-mono font-bold text-white/50 mb-1">
                    Cine-Club / Panel Context
                  </label>
                  <input
                    type="text"
                    value={film.lobbyCampaign || ""}
                    placeholder="e.g. Intro by film scholar"
                    onChange={(e) => onUpdateBookmark(film.id, { lobbyCampaign: e.target.value })}
                    className="w-full text-xs font-sans px-2.5 py-1.5 border border-white/10 rounded bg-black/20 text-white outline-none focus:border-zita-primary"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FLYER COMPILATION POPUP MODAL */}
      {showFlyerModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-zita-surface max-w-xl w-full rounded-xl overflow-hidden border border-white/10 p-6 md:p-8 relative shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col justify-between">
            {/* Vintage ticket / flyer header */}
            <div className="border border-white/10 p-5 text-center select-none bg-black/40 rounded">
              <span className="text-[10px] font-mono tracking-widest text-zita-primary uppercase block font-bold">
                ZITA INK SYSTEM PRINT READY BULLETIN
              </span>
              <h2 className="font-serif text-4xl tracking-wider text-white uppercase mt-2">
                {cinemaName || "ZITA FOLKETS BIO"} JOURNAL
              </h2>
              <div className="border-t border-b border-dashed border-white/10 py-1.5 mb-2 mt-4 text-[10px] font-mono flex justify-between uppercase text-zita-onbg/60">
                <span>Date: {new Date().toLocaleDateString()}</span>
                <span>Dispatch: Stockholm Art House Wire</span>
                <span>System: Grounded AI</span>
              </div>
              
              <p className="text-xs text-zita-onbg/70 font-sans italic py-2 mt-1 leading-relaxed border-b border-white/5">
                "Curation over algorithms." This bulletin iscompiled from verified trade search signals and is formatted to output on Zita's seasonal foyer handouts.
              </p>

              {/* The film list */}
              <div className="space-y-6 text-left my-6">
                {bookmarkedFilms.map((film, index) => (
                  <div key={film.id} className="relative pb-5 border-b border-dashed border-white/5 last:border-0 last:pb-0">
                    <div className="flex items-start gap-4">
                      {/* Ticket Index badge */}
                      <span className="text-xs font-mono font-bold text-zita-primary mt-1">
                        [{index + 1}]
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-3 font-serif flex-wrap">
                          <h4 className="text-xl font-bold text-white uppercase tracking-wider">
                            {film.title}
                          </h4>
                          <span className="text-xs font-bold font-mono text-zita-amber uppercase tracking-wider">
                            {film.format || "DCP 4K"}
                          </span>
                        </div>

                        {film.dateSchedule && (
                          <div className="text-[10px] font-mono text-white/50 font-semibold mt-1 uppercase tracking-wide">
                            TARGET PROJECTION: {film.dateSchedule}
                          </div>
                        )}

                        <p className="text-xs text-zita-onbg/70 font-sans mt-2 leading-relaxed">
                          "{film.summary}"
                        </p>

                        {film.lobbyCampaign && (
                          <div className="mt-2 text-[10px] font-mono text-zita-primary flex items-center gap-1.5 uppercase font-medium">
                            <Sparkles className="w-3 h-3 text-zita-primary shrink-0" />
                            <span>Club Campaign: <strong>{film.lobbyCampaign}</strong></span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[9px] font-mono text-white/30 uppercase tracking-widest mt-6">
                PREPARED AND CERTIFIED EXCLUSIVELY VIA CINERADAR STOCKHOLM
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end mt-6">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-4 py-2 border border-white/10 rounded-lg text-xs font-mono tracking-wider hover:bg-white/5 text-white transition-all cursor-pointer uppercase font-bold"
              >
                <Printer className="w-4 h-4 text-zita-primary" />
                Trigger print
              </button>
              <button
                onClick={() => setShowFlyerModal(false)}
                className="px-4 py-2 rounded-lg text-xs font-mono tracking-wider bg-zita-primary text-white hover:bg-red-700 transition-all cursor-pointer uppercase font-bold"
              >
                Close Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
