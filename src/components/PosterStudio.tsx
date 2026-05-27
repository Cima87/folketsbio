import React, { useState, useEffect } from 'react';
import { ImageTask } from '../types';
import { Image, Wand2, RefreshCw, Film, Sparkles, CheckCircle, Clock } from 'lucide-react';

interface PosterStudioProps {
  tasks: ImageTask[];
  onAddTask: (task: ImageTask) => void;
  onUpdateTask: (id: string, updates: Partial<ImageTask>) => void;
  cinemaName: string;
}

const PRESET_PROMPTS = [
  "A stark vertical Swedish cinema poster of deep shadow silhouettes across a Stockholm street, glowing red neon accents and vintage grain",
  "An artistic Nordic film flyer showing film strip cells transitioning into tree rings in an ancient forest, warm ambient glow",
  "A gorgeous retro French Nouvelle Vague poster featuring high-contrast geometric blocks and a 16mm camera blueprint logo",
  "An atmospheric midnight screening flyer of a single illuminated booth at Zita under dramatic spotlight rays, quiet mood"
];

// Helper to generate a procedural geometric SVG path based on prompt to make the fallback poster beautiful
const getProceduralSvgContent = (prompt: string, titleShort: string) => {
  const hash = prompt.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Choose visual archetype based on hash
  const choice = hash % 4;
  
  if (choice === 0) {
    // Film noir stairs / light beam (Zita customized)
    return (
      <svg viewBox="0 0 300 400" className="w-full h-full bg-[#111111]">
        <defs>
          <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e50914" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points="50,0 200,0 300,400 0,400" fill="url(#beam)" opacity="0.4" />
        <rect x="0" y="380" width="300" height="4" fill="#e50914" />
        <line x1="100" y1="100" x2="100" y2="300" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="5,5" opacity="0.4" />
        <circle cx="150" cy="200" r="45" fill="none" stroke="#e50914" strokeWidth="1" opacity="0.4" />
        <circle cx="150" cy="200" r="5" fill="#e50914" />
      </svg>
    );
  } else if (choice === 1) {
    // Concentric orbits (Stockholm Cinematheque style)
    return (
      <svg viewBox="0 0 300 400" className="w-full h-full bg-[#000000]">
        <circle cx="150" cy="180" r="90" fill="none" stroke="#222222" strokeWidth="1" />
        <circle cx="150" cy="180" r="70" fill="none" stroke="#333333" strokeWidth="0.5" />
        <circle cx="150" cy="180" r="50" fill="none" stroke="#e50914" strokeWidth="3" />
        <circle cx="150" cy="180" r="25" fill="#e50914" />
        <path d="M 60,180 L 240,180" stroke="#333" strokeWidth="0.5" />
        <path d="M 150,90 L 150,270" stroke="#e50914" strokeWidth="0.5" />
      </svg>
    );
  } else if (choice === 2) {
    // Minimalist Scandinavian geometric lines
    return (
      <svg viewBox="0 0 300 400" className="w-full h-full bg-[#111111]">
        <path d="M 40,240 Q 150,80 260,240" fill="none" stroke="#ffffff" strokeWidth="1.5" />
        <path d="M 40,260 Q 150,110 260,260" fill="none" stroke="#d5913e" strokeWidth="1" />
        <path d="M 40,280 Q 150,140 260,280" fill="none" stroke="#e50914" strokeWidth="1.5" />
        <line x1="150" y1="40" x2="150" y2="360" stroke="#222" strokeWidth="0.5" strokeDasharray="4,4" />
        <circle cx="150" cy="95" r="12" fill="#e50914" opacity="0.8" />
      </svg>
    );
  } else {
    // Screenprint crosshair focus
    return (
      <svg viewBox="0 0 300 400" className="w-full h-full bg-[#000000]">
        <rect x="40" y="40" width="220" height="320" fill="none" stroke="#e50914" strokeWidth="1" opacity="0.3" />
        <path d="M 130,200 L 170,200 M 150,180 L 150,220" stroke="#e50914" strokeWidth="2" />
        <circle cx="150" cy="200" r="60" fill="none" stroke="#ffffff" strokeWidth="0.5" opacity="0.2" />
        <text x="50" y="65" fill="#e50914" fontSize="8" fontFamily="monospace" letterSpacing="1" opacity="0.8">ZITA 35MM</text>
        <text x="210" y="65" fill="#ffffff" fontSize="8" fontFamily="monospace" letterSpacing="1" opacity="0.8">● 24 FPS</text>
      </svg>
    );
  }
};

export default function PosterStudio({
  tasks,
  onAddTask,
  onUpdateTask,
  cinemaName
}: PosterStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [activeWaitNote, setActiveWaitNote] = useState<string>("");

  const waitReminders = [
    "Perfect time to scan Zita's Art House Wire down below for the latest trade bulletins.",
    "Synthesizing your screening asset... Our backend is fusing custom film motifs on-the-fly.",
    "Grab a Swedish espresso at Birger Jarlsgatan. Rendering is active around your screens."
  ];

  useEffect(() => {
    if (tasks.some(t => t.status === 'processing')) {
      const idx = Math.floor(Math.random() * waitReminders.length);
      setActiveWaitNote(waitReminders[idx]);
      
      const interval = setInterval(() => {
        const nextIdx = Math.floor(Math.random() * waitReminders.length);
        setActiveWaitNote(waitReminders[nextIdx]);
      }, 7000);
      return () => clearInterval(interval);
    } else {
      setActiveWaitNote("");
    }
  }, [tasks]);

  const triggerGeneration = () => {
    if (!prompt.trim()) return;

    const newId = `task-${Date.now()}`;
    const newTask: ImageTask = {
      id: newId,
      prompt: prompt,
      status: 'processing',
      progress: 0,
      createdAt: new Date().toLocaleTimeString(),
      stage: "Connecting film-model..."
    };

    onAddTask(newTask);
    setPrompt("");

    let currentProgress = 0;
    const stages = [
      "Contacting Cine-Grid Model...",
      "Extracting Swedish aesthetic coeffs...",
      "Fusing stark noir lighting patterns...",
      "Applying premium 35mm grain emulsion...",
      "Setting retro typography matrices..."
    ];

    const intervalId = setInterval(async () => {
      currentProgress += 20;
      if (currentProgress >= 100) {
        clearInterval(intervalId);
        onUpdateTask(newId, { progress: 100, stage: "Structuring vectors..." });
        
        try {
          const res = await fetch("/api/generate-poster", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: newTask.prompt })
          });
          const data = await res.json();
          
          if (data.url) {
            onUpdateTask(newId, { status: "completed", resultUrl: data.url, stage: "Completed" });
          } else {
            onUpdateTask(newId, { status: "completed", resultUrl: undefined, stage: "Rendered Vector" });
          }
        } catch (err: any) {
          console.error("Poster generation error - using vector fallback", err);
          onUpdateTask(newId, { status: "completed", resultUrl: undefined, stage: "Rendered Vector" });
        }
      } else {
        const stageIndex = Math.min(Math.floor(currentProgress / 20), stages.length - 1);
        onUpdateTask(newId, {
          progress: Math.min(Math.round(currentProgress), 95),
          stage: stages[stageIndex]
        });
      }
    }, 2000);
  };

  const getCleanTitle = (txt: string) => {
    const clean = txt.replace(/^(a|an|the|minimalist|artistic|gorgeous|cool|stark|atmospheric)\s+/i, "");
    return clean.split(",")[0].split(" ").slice(0, 3).join(" ");
  };

  return (
    <div id="poster-studio-card" className="glass rounded-xl p-6 shadow-lg border border-white/10 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-2">
        <Image className="w-5 h-5 text-zita-primary" />
        <h2 className="font-serif text-2xl tracking-wide uppercase text-white font-bold">Key-Art Designer</h2>
      </div>
      <p className="text-xs text-zita-onbg/70 mb-4 leading-relaxed font-sans">
        Design striking film-club promotional graphics or temporary slide previews for upcoming seasons. Synthesize art-house motifs in the background.
      </p>

      {/* Manual Prompt Input */}
      <div className="space-y-4 mb-5">
        <div className="relative">
          <textarea
            id="poster-prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe your film graphic idea (e.g. 'Stark social satire about Stockholm stock options, solid blood red layout, minimal bold typography')..."
            className="w-full text-xs font-sans px-3 py-2.5 pr-10 border border-white/10 rounded-md bg-black/40 text-white outline-none focus:border-zita-primary transition-all resize-none h-24"
          />
          <button
            id="submit-prompt-btn"
            onClick={() => {
              if (prompt.trim()) triggerGeneration();
            }}
            disabled={!prompt.trim() || tasks.some(t => t.status === 'processing')}
            className="absolute right-2 bottom-3 p-1.5 rounded-md bg-white/5 hover:bg-zita-primary text-white disabled:bg-white/2 disabled:text-white/25 cursor-pointer transition-colors duration-200"
            title="Generate artwork concept"
          >
            <Wand2 className="w-4 h-4" />
          </button>
        </div>

        {/* Curation Prompts */}
        <div>
          <span className="text-[10px] uppercase font-mono text-white/50 font-bold tracking-wider block mb-2">
            Click to load seasonal patterns:
          </span>
          <div className="flex flex-col gap-1.5">
            {PRESET_PROMPTS.map((pre, i) => (
              <button
                key={i}
                onClick={() => setPrompt(pre)}
                className="text-left px-3 py-2 rounded-md bg-white/2 hover:bg-white/10 border border-white/5 text-[11px] truncate text-zita-onbg/80 transition-all cursor-pointer font-serif italic"
              >
                "{pre}"
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 my-3"></div>

      {/* Gimmick Waiting Notification */}
      {activeWaitNote && (
        <div className="bg-zita-primary/10 border border-zita-primary/30 rounded-md p-3 mb-4 animate-pulse">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-zita-primary shrink-0 mt-0.5" />
            <div className="text-[11px] text-zita-primary font-medium leading-relaxed font-sans">
              {activeWaitNote}
            </div>
          </div>
        </div>
      )}

      {/* Task List Queue */}
      <div className="flex-1 overflow-y-auto max-h-[400px] space-y-4 pr-1">
        {tasks.length === 0 ? (
          <div className="h-40 border border-dashed border-white/5 rounded-lg flex flex-col items-center justify-center text-center p-4">
            <Film className="w-8 h-8 text-white/10 mb-2 animate-pulse" />
            <span className="text-xs text-zita-onbg/50 font-mono">No synthesized graphics yet.</span>
            <span className="text-[10px] text-white/30">Submit a description above to queue synthesis channels.</span>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="border border-white/5 rounded-lg bg-black/40 overflow-hidden"
            >
              <div className="p-2.5 bg-white/2 border-b border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
                <span>Task ID: {task.id.replace('task-', '')}</span>
                <span>{task.createdAt}</span>
              </div>

              <div className="p-3 flex gap-3">
                {/* Visual Canvas Block */}
                <div className="w-24 h-32 bg-black rounded border border-white/5 overflow-hidden shrink-0 relative flex items-center justify-center">
                  {task.status === 'processing' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 text-center p-1 text-[10px]">
                      <RefreshCw className="w-4 h-4 text-zita-amber animate-spin mb-1.5" />
                      <span className="font-mono text-white/80 text-[8px] truncate w-full">{task.stage}</span>
                      <span className="font-mono text-zita-primary font-semibold mt-1">{task.progress}%</span>
                    </div>
                  ) : task.resultUrl ? (
                    <img
                      src={task.resultUrl}
                      alt={task.prompt}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    /* High fidelity vector fallback */
                    <div className="w-full h-full relative font-serif text-center flex flex-col justify-between">
                      {getProceduralSvgContent(task.prompt, getCleanTitle(task.prompt))}
                      <div className="absolute inset-0 p-1.5 flex flex-col justify-between items-center text-white text-[8px]">
                        <div className="bg-zita-primary text-white px-1.5 py-0.5 rounded text-[7px] tracking-wider uppercase font-serif font-black mt-1">
                          {cinemaName || "ZITA"}
                        </div>
                        <div className="bg-black/90 p-1 rounded-xs max-w-[95%] font-serif leading-tight border border-white/10 uppercase tracking-wide text-center">
                          {getCleanTitle(task.prompt)}
                        </div>
                        <div className="bg-[#111] border border-white/5 px-1 rounded text-[5px] font-mono tracking-tighter opacity-85 mb-1 text-zita-amber">
                          STHLM 16MM
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h4 className="text-sm font-serif font-bold text-white uppercase tracking-wider truncate mb-1">
                      “{getCleanTitle(task.prompt)}”
                    </h4>
                    <p className="text-[10px] text-zita-onbg/60 font-sans line-clamp-3 leading-relaxed">
                      {task.prompt}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center gap-1.5">
                    {task.status === 'processing' ? (
                      <div className="flex items-center gap-1 font-mono text-[9px] text-zita-amber">
                        <Clock className="w-3 h-3 text-zita-amber animate-pulse" />
                        <span>Processing pixels...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 font-mono text-[9px] text-emerald-400">
                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                        <span>Print preview ready</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
