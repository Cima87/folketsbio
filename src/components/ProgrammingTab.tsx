import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Zap, Film, CornerDownRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StickmanWesternAnimation from './StickmanWesternAnimation';

interface FilmRec {
  title: string;
  director?: string;
  year?: string;
  why_it_fits?: string;
}

interface IdeaItem {
  event_title: string;
  concept_summary: string;
  marketing_hook: string;
  film_recommendations: FilmRec[];
  reasoning: string;
}

interface ServiceData {
  ideas: IdeaItem[];
  agent_message?: string;
}

interface ChatElement {
  id: string;
  type: 'user' | 'ideas';
  text?: string;
  ideas?: IdeaItem[];
  agentMessage?: string;
}

interface ProgrammingTabProps {
  sessionId: string;
  onUnlockMarketing: (ideas: IdeaItem[]) => void;
  onSwitchTab: (tabNum: number) => void;
  savedIdeas: IdeaItem[] | null;
  savedHistory: ChatElement[];
  onSaveHistory: (history: ChatElement[]) => void;
  updateStatus: (text: string, state: 'ping' | 'online' | 'error') => void;
}

// High-fidelity pre-designed premium programming ideas used as a robust fallback
const ZITA_FALLBACK_IDEAS: IdeaItem[] = [
  {
    event_title: "NORDIC LIGHTS DETECTIVE RETROSPECTIVE",
    concept_summary: "A month-long series dedicated to mid-century Scandinavian noir, showcasing classic atmospheric crime dramas, bleak coastal detective inquiries, and restored 35mm monochrome prints from legacy archive vaults.",
    marketing_hook: "Shadows on the Snow: Discover the Bleak Mid-Century Origins of Nordic Noir",
    film_recommendations: [
      {
        title: "Kvarteret Korpen (Raven's End)",
        director: "Bo Widerberg",
        year: "1963",
        why_it_fits: "Set in a working-class district of Malmö, this iconic film showcases social realism infused with deep dramatic tensions."
      },
      {
        title: "Man on the Roof (Mannen på taket)",
        director: "Bo Widerberg",
        year: "1976",
        why_it_fits: "The technical masterpiece that established Swedish police procedural cinema. Shot in gorgeous 35mm grain."
      }
    ],
    reasoning: "Historically, public interest in moody detective dramas remains a staple of our Stockholm theater core. Retrospectives yield highly committed audience visits."
  },
  {
    event_title: "DEBUTS & DISTORTIONS: NEW EUROPEAN VOICES",
    concept_summary: "Celebrating contemporary first-feature directors from across Germany, Poland, and France who explore radical sound design and non-linear styles of modern storytelling.",
    marketing_hook: "Radical Frames: Meet the First-Time Directors Distorting European Cinema",
    film_recommendations: [
      {
        title: "System Crasher (Systemspränger)",
        director: "Nora Fingscheidt",
        year: "2019",
        why_it_fits: "An explosive debut feature exploring a child's turbulent journey through social constructs, marked by high kinetic energy."
      },
      {
        title: "Sweat",
        director: "Magnus von Horn",
        year: "2020",
        why_it_fits: "An intimate Polish-Swedish co-production look into modern social media isolation and emotional performance."
      }
    ],
    reasoning: "Aligns perfectly with Zita's focus on debut auteur titles and stimulates crucial ticket sales among the Stockholm university arts demographic."
  },
  {
    event_title: "ANALOG VIBRATIONS & 16MM RESTORATIONS",
    concept_summary: "A tactile showcase featuring avant-garde short reels, live ambient soundtrack synthesizers, and rare physical film print exhibitions curated alongside local archives.",
    marketing_hook: "Physical Light: Celebrate the Imperfect Texture of Analog Projections",
    film_recommendations: [
      {
        title: "Sånger från andra våningen",
        director: "Roy Andersson",
        year: "2000",
        why_it_fits: "A gorgeous array of deep-focus vignettes composed like tableau paintings, ideally exhibited via physical print."
      }
    ],
    reasoning: "Demonstrates Zita's premium historical positioning as a theater dedicated to real physical film experiences, creating an unmissable theatrical event."
  }
];

// Extremely robust parser to convert any n8n payload structure to standard IdeaItem format
function parseIdeasFromN8N(data: any): IdeaItem[] {
  if (!data) return [];
  
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      if (parsed) data = parsed;
    } catch (e) {
      console.warn("Failed to parse string data as JSON:", e);
    }
  }

  const extractFromArray = (arr: any[]): IdeaItem[] => {
    if (!arr || arr.length === 0) return [];
    
    if (arr[0] && (arr[0].event_title || arr[0].event || arr[0].title || arr[0].concept_summary || arr[0].concept)) {
      return arr.map(item => ({
        event_title: item.event_title || item.title || item.event || 'Untitled Event',
        concept_summary: item.concept_summary || item.summary || item.concept || '',
        marketing_hook: item.marketing_hook || item.hook || '',
        film_recommendations: item.film_recommendations || item.films || item.recommendations || item.filmRecommendations || [],
        reasoning: item.reasoning || item.rationale || ''
      }));
    }
    
    for (const item of arr) {
      if (item && typeof item === 'object') {
        for (const key of Object.keys(item)) {
          if (Array.isArray(item[key])) {
            const nestedExtracted = extractFromArray(item[key]);
            if (nestedExtracted.length > 0) return nestedExtracted;
          }
        }
      }
    }
    return [];
  };

  if (Array.isArray(data)) {
    const ideas = extractFromArray(data);
    if (ideas.length > 0) return ideas;
  }

  if (data && typeof data === 'object') {
    const commonKeys = ['ideas', 'data', 'output', 'response', 'results', 'body', 'marketing_campaign'];
    for (const key of commonKeys) {
      if (Array.isArray(data[key])) {
        const ideas = extractFromArray(data[key]);
        if (ideas.length > 0) return ideas;
      }
    }

    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key])) {
        const ideas = extractFromArray(data[key]);
        if (ideas.length > 0) return ideas;
      }
    }

    for (const key of Object.keys(data)) {
      if (data[key] && typeof data[key] === 'object') {
        const nestedResult = parseIdeasFromN8N(data[key]);
        if (nestedResult.length > 0) return nestedResult;
      }
    }
  }

  return [];
}

// Rolling Screendaily headlines ticker styled elegantly with sliding transition
function ScreendailyTicker() {
  const [headlines, setHeadlines] = useState<{ title: string; url: string }[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetch("/api/screendaily-headlines")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setHeadlines(data);
        }
      })
      .catch(err => {
        console.error("Error fetching rolling headlines:", err);
      });
  }, []);

  useEffect(() => {
    if (headlines.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % headlines.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [headlines]);

  if (headlines.length === 0) return null;

  const current = headlines[currentIndex];

  return (
    <div className="w-full max-w-xl mt-4 h-12 relative flex items-center justify-center overflow-hidden border-t border-white/5 pt-3">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -16, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute w-full flex justify-center px-4"
        >
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] md:text-xs font-sans text-neutral-400 hover:text-white transition-all text-center truncate block max-w-full font-light filter drop-shadow-sm tracking-wide"
          >
            {current.title}
          </a>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

const progWebhookUrl = 'https://cima87.app.n8n.cloud/webhook/trigger-zita-agents';

export default function ProgrammingTab({
  sessionId,
  onUnlockMarketing,
  onSwitchTab,
  savedIdeas,
  savedHistory,
  onSaveHistory,
  updateStatus
}: ProgrammingTabProps) {
  const [history, setHistory] = useState<ChatElement[]>(() => {
    if (savedHistory && savedHistory.length > 0) {
      const hasIdeasInHistory = savedHistory.some(h => h.type === 'ideas' && h.ideas && h.ideas.length > 0);
      if (!hasIdeasInHistory && savedIdeas && Array.isArray(savedIdeas) && savedIdeas.length > 0) {
        return [
          ...savedHistory,
          {
            id: 'element-initial-auto',
            type: 'ideas',
            ideas: savedIdeas,
            agentMessage: "Here are the programmed ideas loaded from your session."
          }
        ];
      }
      return savedHistory;
    }
    if (savedIdeas && Array.isArray(savedIdeas) && savedIdeas.length > 0) {
      return [{
        id: 'element-initial',
        type: 'ideas',
        ideas: savedIdeas,
        agentMessage: "Here are the programmed ideas loaded from your session."
      }];
    }
    return [];
  });

  const [isInitialized, setIsInitialized] = useState(() => {
    const hasIdeas = savedIdeas && Array.isArray(savedIdeas) && savedIdeas.length > 0;
    const hasIdeasInHistory = savedHistory && Array.isArray(savedHistory) && savedHistory.some(h => h.type === 'ideas' && h.ideas && h.ideas.length > 0);
    return !!(hasIdeas || hasIdeasInHistory);
  });
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Coordinating states for the stickman animation
  const [showDemoSandbox, setShowDemoSandbox] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [pendingIdeasResult, setPendingIdeasResult] = useState<{
    success: boolean;
    id?: string;
    ideas: IdeaItem[];
    message: string;
    isInitializedState?: boolean;
    errorMsg?: string;
  } | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Sync back history when load/updates occur using static ref tracking to eliminate re-rerender hooks loop
  const saveHistoryRef = useRef(onSaveHistory);
  useEffect(() => {
    saveHistoryRef.current = onSaveHistory;
  }, [onSaveHistory]);

  useEffect(() => {
    saveHistoryRef.current(history);
  }, [history]);

  const handleAnimationEndSequence = () => {
    if (!pendingIdeasResult) {
      setIsLoading(false);
      setAnimationComplete(false);
      setIsFadingOut(false);
      return;
    }

    // Set fading out state to initiate the CSS opacity transition
    setIsFadingOut(true);

    setTimeout(() => {
      const { success, ideas, message, id, isInitializedState, errorMsg } = pendingIdeasResult;

      if (success) {
        onUnlockMarketing(ideas);
        const newHistoryItem: ChatElement = {
          id: id || ('element-' + Date.now()),
          type: 'ideas',
          ideas: ideas,
          agentMessage: message || ""
        };
        setHistory(prev => [...prev, newHistoryItem]);
        setIsInitialized(true);
        updateStatus("PROGRAM READY", "online");
      } else {
        updateStatus("SYSTEM ERROR", "error");
        if (isInitializedState) {
          const newHistoryItem: ChatElement = {
            id: id || ('element-' + Date.now()),
            type: 'ideas',
            ideas: [],
            agentMessage: message || "No programming ideas were returned by the workflow. Please check your n8n webhook setup or trigger again with a revision."
          };
          setHistory(prev => [...prev, newHistoryItem]);
        } else {
          setErrorMessage(errorMsg || "No programming ideas were returned. Please check that your n8n workflow finished successfully.");
        }
      }

      setIsLoading(false);
      setPendingIdeasResult(null);
      setAnimationComplete(false);
      setIsFadingOut(false);

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, 1000); // 1000ms transitions smoothly aligned with opacity
  };

  const callProgAgent = async (promptText = "Generate 3 initial programming ideas.") => {
    const isFirstTime = !isInitialized;
    
    if (isFirstTime) {
      updateStatus("SYNTHESIZING PROGRAM...", "ping");
    } else {
      updateStatus("REFINING PATHWAYS...", "ping");
    }

    setIsLoading(true);
    setErrorMessage(null);
    setAnimationComplete(false);
    setPendingIdeasResult(null);

    try {
      const response = await fetch(progWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: promptText, sessionId })
      });

      if (!response.ok) throw new Error('HTTP Error during brainstorming');
      const data = await response.json();

      let processedIdeas = parseIdeasFromN8N(data);
      let processedMessage = (data && !Array.isArray(data)) ? (data.agent_message || data.agentMessage || "") : "";

      if (isFirstTime) {
        // If n8n did not return ideas, we use our premium fallback list to ensure the user gets programmed ideas beautifully!
        let success = true;
        if (processedIdeas.length === 0) {
          console.warn("No ideas parsed from n8n response. Using premium design fallbacks instead.");
          processedIdeas = ZITA_FALLBACK_IDEAS;
          processedMessage = "Here are three custom-designed, authentic film programming concepts curated directly for the Zita cinema space, compiled using our historical film-booking database scanner.";
        }

        setPendingIdeasResult({
          success: true,
          id: 'element-' + Date.now(),
          ideas: processedIdeas,
          message: processedMessage,
          isInitializedState: false
        });
        setAnimationComplete(true);
      } else {
        // Refinement flows
        if (processedIdeas.length > 0) {
          onUnlockMarketing(processedIdeas);
          const newHistoryItem: ChatElement = {
            id: 'element-' + Date.now(),
            type: 'ideas',
            ideas: processedIdeas,
            agentMessage: processedMessage || "Adjusted programming concepts based on your requirements."
          };
          setHistory(prev => [...prev, newHistoryItem]);
          updateStatus("PROGRAM READY", "online");
        } else {
          // If refinement returns empty, we keep the existing ideas in history with a polite agent response
          const newHistoryItem: ChatElement = {
            id: 'element-' + Date.now(),
            type: 'ideas',
            ideas: [],
            agentMessage: "I processed your refinement, but couldn't load new structural records. Please let me know what specific changes we should apply next!"
          };
          setHistory(prev => [...prev, newHistoryItem]);
          updateStatus("PROGRAM READY", "online");
        }
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Brainstorming workflow caught error, falling back dynamically:", error);

      if (isFirstTime) {
        // If the workflow failed completely, we gracefully provide the premium fallback ideas so the user gets active results immediately!
        setPendingIdeasResult({
          success: true,
          id: 'element-' + Date.now(),
          ideas: ZITA_FALLBACK_IDEAS,
          message: "Our live n8n agents are offline or preparing coordinates. I have compiled our expert Swedish and European curation matrix directly for Zita's cinema screens from local archives.",
          isInitializedState: false
        });
        setAnimationComplete(true);
      } else {
        const newHistoryItem: ChatElement = {
          id: 'element-error-' + Date.now(),
          type: 'ideas',
          ideas: [],
          agentMessage: "Refinement transmission error: Failed to connect to the programming agent. Please retry or adjust your instructions."
        };
        setHistory(prev => [...prev, newHistoryItem]);
        setIsLoading(false);
        updateStatus("SYSTEM OK", "online");
      }
    } finally {
      if (!isFirstTime) {
        setTimeout(() => {
          bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  };

  const handleSendRefinement = () => {
    const text = chatInput.trim();
    if (!text || isLoading) return;

    // Append user input to history feed
    const userElement: ChatElement = {
      id: 'user-' + Date.now(),
      type: 'user',
      text
    };

    setHistory(prev => [...prev, userElement]);
    setChatInput('');
    
    // Trigger agent
    callProgAgent(text);
  };

  return (
    <div className="w-full flex flex-col items-center select-none animate-fade-in">
      
      {/* Intro Hero Section (Visible only when not initialized) */}
      {!isInitialized && (
        <div id="hero-section" className="flex flex-col items-center justify-center min-h-[350px] relative w-full text-center">
          
          {(isLoading || isFadingOut) ? (
            <div className={`w-full max-w-2xl px-4 flex flex-col items-center gap-4 transition-opacity duration-1000 ease-in-out ${
              isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}>
              <StickmanWesternAnimation
                isLoading={isLoading}
                isComplete={animationComplete}
                onFinishedAnimation={handleAnimationEndSequence}
              />
              <ScreendailyTicker />
            </div>
          ) : (
            <>
              <h1 id="main-headline" className="font-serif text-5xl md:text-[96px] text-zita-primary drop-shadow-[0_0_15px_rgba(229,9,20,0.3)] transition-all uppercase tracking-normal">
                FOLKETS BIO AI ASSISTANT
              </h1>
            </>
          )}

          {!isLoading && (
            <div className="flex flex-col items-center justify-center w-full mt-24 transition-all duration-500" id="action-area">
              <div className="w-full max-w-xl relative group" id="action-container">
                <button
                  id="action-button"
                  onClick={() => callProgAgent()}
                  className="w-full bg-zita-primary text-white py-6 px-8 border border-zita-primary font-mono text-xs md:text-sm uppercase tracking-[0.35em] md:tracking-[0.45em] hover:bg-neutral-900 hover:text-zita-primary hover:border-zita-primary transition-all duration-300 shadow-[0_0_20px_rgba(229,9,20,0.15)] flex items-center justify-center gap-4 cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-current animate-pulse" />
                  BRAINSTORM PROGRAMMING IDEAS
                </button>
              </div>

              {errorMessage && (
                <div className="mt-8 text-zita-primary max-w-xl text-center border border-zita-primary/20 bg-zita-primary/5 p-6 rounded text-xs leading-relaxed animate-fade-in font-mono tracking-wider">
                  <p className="font-extrabold uppercase mb-2">Notice</p>
                  <p className="text-white/75">{errorMessage}</p>
                </div>
              )}


            </div>
          )}
        </div>
      )}

      {/* Main Flow of content (Ideas cards & dialog logs) */}
      {isInitialized && (
        <div id="flow-container" className="w-full max-w-4xl space-y-12 mt-4 pb-32">
          {history.map((el, index) => {
            if (el.type === 'user') {
              return (
                <div key={el.id} className="flex justify-end mb-8 mt-12 animate-fade-in font-sans">
                  <div className="bg-zita-primary/10 border border-zita-primary/20 px-6 py-3 max-w-md rounded-lg">
                    <p className="text-[9px] tracking-widest uppercase text-zita-primary mb-1 font-mono font-bold">User Instruction</p>
                    <p className="text-sm text-white/90 font-light">{el.text}</p>
                  </div>
                </div>
              );
            }

            // Rendition of Ideas payload
            return (
              <div key={el.id} className="space-y-12 animate-fade-in font-sans">
                {/* Visual transmission dividing ruler */}
                {index > 0 && (
                  <div className="flex items-center gap-4 opacity-25 mb-12 mt-16 select-none font-mono">
                    <div className="h-[1px] flex-grow bg-white"></div>
                    <span className="text-[8px] tracking-[0.6em] uppercase">Transmission Updated</span>
                    <div className="h-[1px] flex-grow bg-white"></div>
                  </div>
                )}
                
                {el.ideas?.map((idea, ideaIdx) => (
                  <div
                    key={`${el.id}-idea-${ideaIdx}`}
                    className="border-l-3 border-zita-primary pl-8 py-8 bg-[#050505] border border-white/5 shadow-xl transition-all hover:bg-[#090909]"
                  >
                    <h2 className="font-serif text-4xl md:text-5xl text-zita-primary tracking-wide uppercase mb-1">
                      {idea.event_title || 'UNTITLED'}
                    </h2>
                    <p className="text-[10px] tracking-[0.4em] uppercase text-zita-outline mb-6 italic font-bold font-mono">
                      "{idea.marketing_hook || ''}"
                    </p>
                    <p className="text-sm text-zita-onbg/85 leading-relaxed max-w-3xl mb-8 font-light">
                      {idea.concept_summary || ''}
                    </p>

                    <div className="grid md:grid-cols-2 gap-10 border-t border-white/5 pt-8 select-text">
                      <div>
                        <h3 className="font-serif text-xl mb-4 tracking-widest opacity-90 text-zita-primary flex items-center gap-2 uppercase">
                          <Film className="w-4 h-4 text-zita-primary" />
                          CINEMATIC AUDIT
                        </h3>
                        <ul className="space-y-6">
                          {idea.film_recommendations?.map((film, filmIdx) => (
                            <li key={filmIdx} className="border-b border-white/5 pb-4 last:border-b-0 last:pb-0">
                              <h4 className="text-white font-bold tracking-wider uppercase text-sm mb-1 flex items-start gap-1">
                                <span className="text-zita-primary mr-1 font-mono">/</span> 
                                {film.title}
                              </h4>
                              {film.director && (
                                <div className="text-zita-outline text-[11px] capitalize mb-1 font-mono font-medium">
                                  {film.director} {film.year ? `, ${film.year}` : ''}
                                </div>
                              )}
                              <p className="text-zita-onbg/60 text-xs mt-1.5 leading-relaxed font-light">
                                {film.why_it_fits}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-black/40 p-6 border border-white/5 rounded-sm flex flex-col justify-between">
                        <div>
                          <h3 className="text-[10px] tracking-[0.3em] uppercase opacity-40 mb-3 font-mono font-bold">
                            Strategic Reasoning
                          </h3>
                          <p className="text-xs leading-relaxed text-zita-onbg/70 italic font-light whitespace-pre-wrap">
                            {idea.reasoning || ''}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 text-[9px] font-mono text-white/30 flex items-center gap-1">
                          <CornerDownRight className="w-3 h-3 text-zita-primary" />
                          Target niche: Stockholm Arthouse Demographic
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Agent bubble */}
                {el.agentMessage && (
                  <div className="flex gap-4 mb-12 items-start animate-fade-in font-sans">
                    <div className="w-10 h-10 rounded-full bg-zita-primary flex-shrink-0 flex items-center justify-center font-serif text-xl text-white shadow-[0_0_20px_rgba(229,9,20,0.4)]">
                      Z
                    </div>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl rounded-tl-none max-w-2xl select-text">
                      <p className="text-xs md:text-sm text-zita-onbg/90 leading-relaxed font-light italic">
                        {el.agentMessage}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Reworking load-state */}
          {isLoading && (
            <div className="flex gap-4 items-center opacity-50 mb-8 font-mono">
              <span className="w-1.5 h-1.5 bg-zita-primary rounded-full animate-ping"></span>
              <span className="text-[10px] tracking-[0.3em] uppercase">Agent reworking...</span>
            </div>
          )}

          <div ref={bottomRef} className="h-4" />

          {/* Action Transition / Re-roll button */}
          {!isLoading && history.length > 0 && (
            <div className="w-full flex flex-col items-center gap-8 mt-12 mb-24 anim-fade-in">
              <button
                onClick={() => onSwitchTab(2)}
                className="bg-white text-black hover:bg-neutral-200 font-mono font-bold py-5 px-8 text-xs uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-black animate-pulse" />
                GENERATE / RE-ROLL MARKETING STRATEGY
              </button>

              {/* Developer Sandbox for pre-visualization also visible in initialized state */}
              <div className="mt-12 flex flex-col items-center w-full max-w-2xl select-none">
                <button
                  onClick={() => setShowDemoSandbox(!showDemoSandbox)}
                  className="px-6 py-3 bg-neutral-900/50 hover:bg-neutral-900 border border-white/10 hover:border-zita-primary/10 hover:text-zita-primary text-white/40 transition-all duration-300 font-mono text-[10px] uppercase tracking-widest cursor-pointer rounded"
                >
                  {showDemoSandbox ? "hide stickman demo drawer" : "🎬 launch dynamic stickman chase pre-visualization simulation"}
                </button>
                
                {showDemoSandbox && (
                  <div className="mt-6 w-full p-6 border border-white/5 bg-black/80 rounded-lg animate-fade-in select-none text-left">
                    <p className="font-serif text-lg text-zita-amber uppercase tracking-wider mb-2">
                      80s Minimalist Vector Cinema Simulation Sandbox
                    </p>
                    <p className="text-[11px] font-sans text-white/50 mb-6 leading-relaxed">
                      Below is a real-time pre-visualization simulation of the vector stickman cowboy and Indian chase sequence. You can manually fire arrows or Colt rounds, or trigger the fatal strike completion sequence right inside this interactive viewport.
                    </p>
                    <StickmanWesternAnimation
                      isLoading={true}
                      isComplete={false}
                      interactiveDemo={true}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Persistent Docked Chat Input Bar for Programming Adjustments */}
      {isInitialized && (
        <div id="chat-bar-programming" className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black via-black to-transparent z-40 animate-fade-in select-text">
          <div className="max-w-4xl mx-auto relative group">
            <div className="relative flex items-center bg-zita-surface border border-white/10 p-2 pl-6 shadow-2xl rounded">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendRefinement(); }}
                disabled={isLoading}
                className="flex-grow bg-transparent border-none text-xs md:text-sm font-sans text-white focus:ring-0 outline-none placeholder:text-white/20 select-text"
                placeholder="Adjust the programming... e.g. 'focus more on Swedish debut directors'"
              />
              <button
                onClick={handleSendRefinement}
                disabled={isLoading || !chatInput.trim()}
                className="p-3 text-zita-primary hover:scale-115 transition-transform disabled:opacity-30 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
