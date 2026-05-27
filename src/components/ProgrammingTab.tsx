import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Send, Zap, Film, CornerDownRight } from 'lucide-react';

interface FilmRec {
  title: string;
  director?: string;
  year?: string;
  why_it_fits?: string;
}

interface IdeaItem {
  event_title: string;
  marketing_hook: string;
  concept_summary: string;
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
  
  const bottomRef = useRef<HTMLDivElement>(null);

  // Sync back history when load/updates occur using static ref tracking to eliminate re-rerender hooks loop
  const saveHistoryRef = useRef(onSaveHistory);
  useEffect(() => {
    saveHistoryRef.current = onSaveHistory;
  }, [onSaveHistory]);

  useEffect(() => {
    saveHistoryRef.current(history);
  }, [history]);

  const callProgAgent = async (promptText = "Generate 3 initial programming ideas.") => {
    const isFirstTime = !isInitialized;
    
    if (isFirstTime) {
      updateStatus("SYNTHESIZING PROGRAM...", "ping");
    } else {
      updateStatus("REFINING PATHWAYS...", "ping");
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch(progWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: promptText, sessionId })
      });

      if (!response.ok) throw new Error('HTTP Error during brainstorming');
      const data = await response.json();

      let processedIdeas: IdeaItem[] = [];
      let processedMessage = "";

      if (data) {
        if (Array.isArray(data)) {
          if (data.length > 0) {
            if (data[0].ideas && Array.isArray(data[0].ideas)) {
              processedIdeas = data[0].ideas;
              processedMessage = data[0].agent_message || data[0].agentMessage || "";
            } else if (data[0].event_title || data[0].concept_summary) {
              processedIdeas = data as unknown as IdeaItem[];
            }
          }
        } else {
          if (data.ideas && Array.isArray(data.ideas)) {
            processedIdeas = data.ideas;
          } else if (Array.isArray(data.data)) {
            processedIdeas = data.data;
          }
          processedMessage = data.agent_message || data.agentMessage || "";
        }
      }

      if (processedIdeas && processedIdeas.length > 0) {
        onUnlockMarketing(processedIdeas);
        
        const newHistoryItem: ChatElement = {
          id: 'element-' + Date.now(),
          type: 'ideas',
          ideas: processedIdeas,
          agentMessage: processedMessage || ""
        };

        setHistory(prev => [...prev, newHistoryItem]);
        setIsInitialized(true);
        updateStatus("PROGRAM READY", "online");
      } else {
        console.warn("No programming ideas returned from the agent. Double-check n8n or inputs.");
        updateStatus("SYSTEM ERROR", "error");
        
        if (isInitialized) {
          const newHistoryItem: ChatElement = {
            id: 'element-' + Date.now(),
            type: 'ideas',
            ideas: [],
            agentMessage: processedMessage || "No programming ideas were returned by the workflow. Please check your n8n webhook setup or trigger again with a revision."
          };
          setHistory(prev => [...prev, newHistoryItem]);
        } else {
          setErrorMessage("No programming ideas were returned. Please check that your n8n workflow finished successfully and returns the structured data containing ideas.");
        }
      }
    } catch (error) {
      console.error(error);
      updateStatus("SYSTEM ERROR", "error");
      if (!isInitialized) {
        setErrorMessage("Connection or server failure communicating with your n8n workflow. Please ensure your n8n workflow is active, functional, and that CORS is allowed.");
      } else {
        const newHistoryItem: ChatElement = {
          id: 'element-error-' + Date.now(),
          type: 'ideas',
          ideas: [],
          agentMessage: "Communication error: Failed to connect to the programming agent. Please retry."
        };
        setHistory(prev => [...prev, newHistoryItem]);
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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
          
          {isLoading ? (
            <div className="flex justify-center items-center gap-8 h-32 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-zita-primary shadow-[0_0_40px_rgba(229,9,20,0.8)] bouncing-sphere relative after:absolute after:inset-0 after:rounded-full after:bg-white/20 after:blur-sm"></div>
              <div className="w-12 h-12 rounded-full bg-zita-primary shadow-[0_0_40px_rgba(229,9,20,0.8)] bouncing-sphere relative after:absolute after:inset-0 after:rounded-full after:bg-white/20 after:blur-sm [animation-delay:0.15s]"></div>
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
            <div className="w-full flex justify-center mt-12 mb-24 anim-fade-in">
              <button
                onClick={() => onSwitchTab(2)}
                className="bg-white text-black hover:bg-neutral-200 font-mono font-bold py-5 px-8 text-xs uppercase tracking-[0.3em] transition-all duration-300 flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.2)] cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-black animate-pulse" />
                GENERATE / RE-ROLL MARKETING STRATEGY
              </button>
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
