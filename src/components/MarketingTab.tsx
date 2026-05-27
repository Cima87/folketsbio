import React, { useState, useEffect, useRef } from 'react';
import { Send, Map, Landmark, Award, ShieldAlert, Sparkles } from 'lucide-react';

interface CampaignItem {
  event_title: string;
  some_campaign_explanation?: string;
  the_big_idea?: string;
  tactical_execution?: string;
  guerrilla_stunt?: string;
  partnership_brief?: string;
}

interface StrategyResponse {
  marketing_campaign?: CampaignItem[];
  strategy_reasoning?: string;
  agent_message?: string;
}

interface ChatHistoryItem {
  id: string;
  senderCode: 'user' | 'agent';
  text: string;
}

interface MarketingTabProps {
  approvedEvents: any[] | null;
  sessionId: string;
  onUnlockVisuals: () => void;
  onSwitchTab: (tabNum: number) => void;
  savedStrategy: StrategyResponse | null;
  savedChat: ChatHistoryItem[];
  onSaveData: (strategy: StrategyResponse | null, chat: ChatHistoryItem[]) => void;
  updateStatus: (text: string, state: 'ping' | 'online' | 'error') => void;
}

const mktWebhookUrl = 'https://cima87.app.n8n.cloud/webhook/zita-strategy-chat';

export default function MarketingTab({
  approvedEvents,
  sessionId,
  onUnlockVisuals,
  onSwitchTab,
  savedStrategy,
  savedChat,
  onSaveData,
  updateStatus
}: MarketingTabProps) {
  const [strategy, setStrategy] = useState<StrategyResponse | null>(savedStrategy);
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>(savedChat);
  const [isLoading, setIsLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom on changes
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Sync state upward whenever strategy or chat updates using static ref tracking to eliminate re-renders loop
  const saveDataRef = useRef(onSaveData);
  useEffect(() => {
    saveDataRef.current = onSaveData;
  }, [onSaveData]);

  useEffect(() => {
    saveDataRef.current(strategy, chatHistory);
  }, [strategy, chatHistory]);

  // Auto trigger the strategy build on initial mount if not run yet
  useEffect(() => {
    if (!strategy && approvedEvents) {
      callMktAgent("Develop comprehensive marketing strategy based on approved films.", false);
    }
  }, [approvedEvents]);

  const callMktAgent = async (promptText: string, isChat = false) => {
    if (!approvedEvents) return;
    
    updateStatus(isChat ? "REFINING STRATEGY..." : "BUILDING CAMPAIGN...", "ping");
    setIsLoading(true);

    try {
      const payload: Record<string, any> = {
        input: promptText,
        sessionId,
        is_chat_request: isChat
      };
      
      if (!isChat) {
        payload.approved_events = approvedEvents;
      }

      const response = await fetch(mktWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Marketing response error');
      const data: StrategyResponse = await response.json();

      if (data.marketing_campaign) {
        setStrategy(data);
        onUnlockVisuals(); // Strategy loaded, enable phase 3!
      }

      if (data.agent_message) {
        setChatHistory(prev => [
          ...prev,
          {
            id: 'mkt-msg-' + Date.now(),
            senderCode: 'agent',
            text: data.agent_message || ""
          }
        ]);
      }

      updateStatus("STRATEGY LOCKED", "online");
    } catch (err) {
      console.error(err);
      updateStatus("MARKETING ERROR", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChatMkt = () => {
    const val = chatInput.trim();
    if (!val || isLoading) return;

    setChatHistory(prev => [
      ...prev,
      { id: 'mkt-user-' + Date.now(), senderCode: 'user', text: val }
    ]);
    setChatInput('');

    callMktAgent(val, true);
  };

  if (!approvedEvents) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-center font-sans">
        <ShieldAlert className="w-12 h-12 text-zita-primary mb-4 animate-bounce" />
        <h3 className="font-serif text-2xl uppercase text-white">Strategy Lock Active</h3>
        <p className="text-xs text-zita-onbg/60 max-w-sm mt-1">
          Please brainstorm and confirm film ideas on the <strong>Programming</strong> tab first to generate a marketing strategy.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-8 select-text animate-fade-in font-sans">
      
      {/* Dynamic Content Sidebar and campaign items */}
      <div className="lg:col-span-2 space-y-6 flex flex-col min-h-[500px] relative">
        <div className="glass rounded-xl p-8 flex-grow border-t-2 border-zita-primary relative">
          
          {/* Internal loader layer matching n8n logic */}
          {isLoading && !strategy && (
            <div id="marketing-loading" className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20 rounded-xl animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-zita-primary shadow-[0_0_40px_rgba(229,9,20,0.8)] bouncing-sphere mb-6"></div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-zita-primary font-bold font-mono">
                Agents drafting campaign...
              </p>
            </div>
          )}

          {/* Strategy rendering block */}
          {strategy && (
            <div id="strategy-content" className="space-y-8 animate-fade-in">
              <section className="mb-8 pb-8 border-b border-white/10 select-text">
                <h3 className="text-zita-outline text-[10px] font-bold tracking-widest mb-2 uppercase font-mono">
                  Core Strategic Reasoning
                </h3>
                <p className="text-base md:text-lg font-light leading-relaxed text-white">
                  {strategy.strategy_reasoning || 'Aligning with Zita Folkets Bio guidelines...'}
                </p>
              </section>

              {strategy.marketing_campaign?.map((camp, idx) => {
                const description = camp.some_campaign_explanation || [
                  camp.the_big_idea ? `**THE BIG IDEA / HOOK:**\n${camp.the_big_idea}\n` : null,
                  camp.tactical_execution ? `**TACTICAL ROADMAP:**\n${camp.tactical_execution}\n` : null,
                  camp.guerrilla_stunt ? `**GUERRILLA STUNT:**\n${camp.guerrilla_stunt}\n` : null,
                  camp.partnership_brief ? `**PARTNERSHIP BRIEF:**\n${camp.partnership_brief}` : null
                ].filter(Boolean).join('\n');

                return (
                  <div key={idx} className="mb-10 last:mb-0 border-l-2 border-zita-primary pl-6 hover:bg-white/[0.01] py-2">
                    <h2 className="font-serif text-2xl md:text-3xl text-white tracking-wide uppercase mb-1 flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-zita-primary" />
                      {camp.event_title}
                    </h2>
                    <h3 className="text-zita-primary text-[9px] font-bold tracking-widest mb-4 uppercase font-mono">
                      Marketing Strategy & Execution Briefing
                    </h3>
                    
                    <p className="text-xs md:text-sm font-light leading-relaxed text-zita-onbg/95 whitespace-pre-wrap select-text">
                      {description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}

          {!strategy && !isLoading && (
            <div className="text-center py-20 text-neutral-500 text-xs">
              Waiting for automated campaign briefing generation...
            </div>
          )}
        </div>

        {strategy && (
          <button
            id="generate-visuals-btn"
            onClick={() => onSwitchTab(3)}
            disabled={isLoading}
            className="w-full bg-zita-primary hover:bg-red-700 text-white font-mono text-xs uppercase tracking-[0.3em] py-5 px-8 transition-all duration-300 shadow-[0_0_20px_rgba(229,9,20,0.15)] flex items-center justify-center gap-3 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-white animate-pulse" />
            GENERATE VISUAL CAMPAIGN
          </button>
        )}
      </div>

      {/* Right Column: Refined strategy chat workspace */}
      <div className="space-y-6 flex flex-col">
        <div id="chat-container-mkt" className="glass rounded-xl p-6 flex flex-col h-[525px] border border-white/5 select-text shadow-2xl">
          <label className="font-serif text-2xl text-zita-primary tracking-wider mb-4 block uppercase flex items-center gap-2">
            <Award className="w-5 h-5 text-zita-primary shrink-0" />
            REFINE STRATEGY
          </label>
          
          {/* Chat log wrapper */}
          <div id="chat-history-mkt" className="flex-grow overflow-y-auto text-xs md:text-sm space-y-4 mb-4 pr-2 font-light select-text">
            {chatHistory.length === 0 ? (
              <p className="text-neutral-500 italic text-[11px] p-2 text-center mt-10">
                Ask Zita questions or request alterations to refine the generated pitch folders.
              </p>
            ) : (
              chatHistory.map(item => (
                <div
                  key={item.id}
                  className={`p-4 rounded-lg chat-msg ${
                    item.senderCode === 'agent'
                      ? 'glass border-l-2 border-zita-primary text-zita-onbg'
                      : 'bg-white/5 text-white/80 text-right ml-8'
                  }`}
                >
                  {item.senderCode === 'agent' && (
                    <span className="text-zita-primary font-mono font-bold text-[9px] uppercase block mb-1">
                      Zita
                    </span>
                  )}
                  <p className="whitespace-pre-line leading-relaxed font-sans">{item.text}</p>
                </div>
              ))
            )}

            {isLoading && chatHistory.length > 0 && (
              <div className="flex gap-2 items-center opacity-40 p-2 font-mono text-[9px]">
                <span className="w-1.5 h-1.5 bg-zita-primary rounded-full animate-ping"></span>
                <span>Zita thinking...</span>
              </div>
            )}
            
            <div ref={chatBottomRef} />
          </div>

          {/* Prompt sender */}
          <div className="relative mt-auto border-t border-white/10 pt-4 select-text">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendChatMkt(); }}
              disabled={isLoading}
              className="w-full bg-black/40 border border-white/10 p-3.5 pr-12 text-xs focus:border-zita-primary outline-none text-white font-sans select-text"
              placeholder="Suggest an angle or revision..."
            />
            <button
              onClick={handleSendChatMkt}
              disabled={isLoading || !chatInput.trim()}
              className="absolute right-3 top-8 p-1 text-zita-primary hover:scale-115 transition-transform disabled:opacity-35 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
    </div>
  );
}
