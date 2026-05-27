import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, Download, ChevronDown, Check, ShieldAlert, ImageIcon } from 'lucide-react';

interface VisualCampaignItem {
  event_title: string;
  creative_intent: string;
  image_prompt: string;
}

interface VisualResponse {
  visual_campaign?: VisualCampaignItem[];
}

interface VisualsTabProps {
  approvedEvents: any[] | null;
  sessionId: string;
  savedVisuals: VisualResponse | null;
  onSaveVisuals: (visuals: VisualResponse | null) => void;
  updateStatus: (text: string, state: 'ping' | 'online' | 'error') => void;
}

const visualWebhookUrl = 'https://cima87.app.n8n.cloud/webhook/zita-execute-visuals';
const renderStartUrl = 'https://cima87.app.n8n.cloud/webhook/render-start';
const renderCheckUrl = 'https://cima87.app.n8n.cloud/webhook/render-check';

// Standalone component for managing individual poster render lifecycle and polling
function PosterRenderer({ item, sessionId }: { item: VisualCampaignItem; sessionId: string; key?: React.Key }) {
  const [status, setStatus] = useState<'pending' | 'rendering' | 'complete' | 'error'>('pending');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpenPrompt, setIsOpenPrompt] = useState(false);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const startImageRender = async () => {
      setStatus('rendering');
      try {
        // 1. Kick off background render
        const res = await fetch(renderStartUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            event_title: item.event_title,
            image_prompt: item.image_prompt
          })
        });

        if (!res.ok) throw new Error('Start render network connection failed');

        // 2. Poll progress every 15 seconds (reduced from 30s for snappier feedback)
        checkInterval = setInterval(async () => {
          if (!isMounted) return;
          try {
            const checkUrl = `${renderCheckUrl}?sessionId=${sessionId}&title=${encodeURIComponent(item.event_title)}`;
            const pingRes = await fetch(checkUrl);
            const pingData = await pingRes.json();

            if (pingData.status === 'complete' && pingData.image_url) {
              if (checkInterval) clearInterval(checkInterval);
              if (isMounted) {
                setImageUrl(pingData.image_url);
                setStatus('complete');
              }
            }
          } catch (pollingErr) {
            console.warn("Polling status tick failure, retrying on next tick...", pollingErr);
          }
        }, 15000);

      } catch (err: any) {
        console.error("Unable to start poster render sequence", err);
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err?.message || "Render trigger failure");
        }
      }
    };

    startImageRender();

    // Lifetime cleanup to prevent memory leaks or running duplicate ticks
    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
    };
  }, [item, sessionId]);

  const safeTitle = item.event_title.replace(/[^a-z0-9]/gi, '_').toLowerCase();

  return (
    <div className="bg-[#0b0b0b] border border-white/10 rounded overflow-hidden flex flex-col min-h-[480px] hover:border-white/20 transition-all duration-300">
      
      {/* Banner / Poster Asset Viewport */}
      <div className="relative w-full aspect-[2/3] bg-black border-b border-white/5 flex items-center justify-center">
        {status === 'complete' && imageUrl ? (
          <img
            src={imageUrl}
            alt={item.event_title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover animate-fade-in"
          />
        ) : status === 'rendering' ? (
          <div className="flex flex-col items-center justify-center p-6 text-center select-none font-sans">
            <div className="w-12 h-12 rounded-full bg-zita-primary shadow-[0_0_30px_rgba(229,9,20,0.7)] bouncing-sphere mb-5 relative after:absolute after:inset-0 after:rounded-full after:bg-white/20 after:blur-xs"></div>
            <span className="text-[10px] tracking-[0.25em] uppercase text-zita-primary font-mono font-bold animate-pulse block mb-2">
              Rendering Poster Asset
            </span>
            <span className="text-[9px] text-white/40 tracking-wider">
              Autonomous background flow active...
            </span>
          </div>
        ) : status === 'error' ? (
          <div className="p-4 text-center text-xs text-red-400 font-mono select-none font-light">
            <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
            Failed to process asset.<br />
            <span className="text-[10px] opacity-60">{errorMessage}</span>
          </div>
        ) : (
          <div className="text-white/30 text-xs font-mono font-light uppercase animate-pulse select-none">
            Queueing generation...
          </div>
        )}
      </div>

      {/* Campaign Visual details block */}
      <div className="p-6 flex-grow flex flex-col justify-between font-sans">
        <div>
          <h3 className="font-serif text-2xl md:text-3xl text-white uppercase tracking-wide mb-3 select-text">
            {item.event_title}
          </h3>
          <p className="text-xs md:text-sm text-zita-onbg/85 font-light leading-relaxed mb-6 italic border-l-2 border-zita-primary pl-4 select-text">
            "{item.creative_intent}"
          </p>
        </div>

        <div className="mt-auto space-y-4">
          
          {/* Collapsible raw image prompt logs */}
          <details className="group" open={isOpenPrompt} onToggle={(e) => setIsOpenPrompt(e.currentTarget.open)}>
            <summary className="text-[9px] text-white/40 uppercase tracking-widest font-bold cursor-pointer select-none flex items-center gap-1.5 hover:text-white transition-colors font-mono">
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpenPrompt ? 'rotate-180' : ''}`} />
              View Art Direction Prompts
            </summary>
            <div className="bg-black/80 p-3 rounded text-[10px] font-mono text-white/40 mt-3 border border-white/5 leading-relaxed break-words select-text">
              &gt; {item.image_prompt}
            </div>
          </details>

          {/* Download button */}
          {status === 'complete' && imageUrl && (
            <a
              href={imageUrl}
              download={`${safeTitle}_poster.png`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full text-center py-4 text-[10px] font-mono uppercase font-bold tracking-[0.2em] bg-white text-black hover:bg-neutral-200 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Download className="w-3.5 h-3.5 text-black" />
              DOWNLOAD ASSET
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VisualsTab({
  approvedEvents,
  sessionId,
  savedVisuals,
  onSaveVisuals,
  updateStatus
}: VisualsTabProps) {
  const [visuals, setVisuals] = useState<VisualResponse | null>(savedVisuals);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state upward when visuals are received using stable ref tracking to eliminate re-renders loop
  const saveVisualsRef = useRef(onSaveVisuals);
  useEffect(() => {
    saveVisualsRef.current = onSaveVisuals;
  }, [onSaveVisuals]);

  useEffect(() => {
    saveVisualsRef.current(visuals);
  }, [visuals]);

  const generateCampaignVisuals = async () => {
    if (!approvedEvents) return;

    setVisuals(null);
    setIsLoading(true);
    updateStatus("GENERATING VISUALS...", "ping");

    try {
      const response = await fetch(visualWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          approved_events: approvedEvents
        })
      });

      if (!response.ok) throw new Error('Failed to generate visual campaigns');
      const data: VisualResponse = await response.json();

      setVisuals(data);
      updateStatus("VISUALS DEPLOYED", "online");
    } catch (err) {
      console.error(err);
      updateStatus("VISUAL ERROR", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger campaign visuals on initial enter if empty
  useEffect(() => {
    if (!visuals && approvedEvents) {
      generateCampaignVisuals();
    }
  }, [approvedEvents]);

  if (!approvedEvents) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-20 text-center font-sans">
        <ShieldAlert className="w-12 h-12 text-zita-primary mb-4 animate-bounce" />
        <h3 className="font-serif text-2xl uppercase text-white">Visuals Lock Active</h3>
        <p className="text-xs text-zita-onbg/60 max-w-sm mt-1">
          Please brainstorm and secure ideas on the <strong>Programming</strong> tab first.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col space-y-8 select-none animate-fade-in font-sans">
      
      {/* Visual Header Toolbar */}
      <div className="flex justify-between items-end border-b border-white/10 pb-4">
        <div>
          <h2 className="font-serif text-4xl text-zita-primary tracking-wide uppercase flex items-center gap-3">
            <ImageIcon className="w-8 h-8 text-zita-primary" />
            Campaign Visuals
          </h2>
          <p className="text-white/50 text-xs mt-2 font-sans font-light">
            AI-generated artwork ideas and download directives optimized for Zita Folkets Bio galleries.
          </p>
        </div>
        
        <button
          onClick={generateCampaignVisuals}
          disabled={isLoading}
          className="bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-6 text-[10px] font-mono uppercase tracking-[0.2em] transition-all flex items-center gap-2 rounded cursor-pointer disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          RE-GENERATE
        </button>
      </div>

      <div className="glass rounded-xl p-8 min-h-[500px] relative border-t-2 border-zita-primary shadow-2xl">
        
        {/* Loading overlay */}
        {isLoading && (
          <div id="visuals-loading" className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-20 rounded-xl animate-fade-in select-none">
            <div className="w-12 h-12 rounded-full bg-zita-primary shadow-[0_0_40px_rgba(229,9,20,0.8)] bouncing-sphere mb-6"></div>
            <p className="text-[10px] tracking-[0.4em] uppercase text-zita-primary font-bold font-mono">
              Drafting Art Direction...
            </p>
          </div>
        )}

        {/* Poster Gallery */}
        {visuals && visuals.visual_campaign && visuals.visual_campaign.length > 0 ? (
          <div id="visuals-content" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {visuals.visual_campaign.map((item, index) => (
              <PosterRenderer key={index} item={item} sessionId={sessionId} />
            ))}
          </div>
        ) : !isLoading ? (
          <p className="text-neutral-500 italic text-xs text-center py-24 select-none">
            No graphics folder rendered. Press re-generate or review approvals in tab 1.
          </p>
        ) : null}
      </div>
    </div>
  );
}
