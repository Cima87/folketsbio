import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Fallback/Demo Data when Gemini key is missing, unauthorized, or rate-limited.
// Using realistic 2025-2026 Indie/Festival film bulletins aligned to Zita Folkets Bio (Stockholm).
const FALLBACK_NEWS = [
  {
    id: "fb-news-1",
    title: "Stockholm Film Festival Announces Nordic Focus for 2026",
    summary: "The organizers of the Stockholm International Film Festival have confirmed that the upcoming program will highlight new director-led cinema from Sweden, Denmark, and Finland. Six debut feature films have been selected for competition.",
    source: "Dagens Nyheter",
    url: "https://www.stockholmfilmfestival.se",
    date: "May 20, 2026",
    importance: "This shifts focus toward regional low-budget filmmaking instead of international commercial blockbusters.",
    genres: ["Nordic", "Festival"]
  },
  {
    id: "fb-news-2",
    title: "Svenska Filminstitutet Allocates Production Support for Three Debut Features",
    summary: "The Swedish Film Institute has announced funding for three upcoming debut projects by Stockholm-based directors. The projects focus on realistic contemporary social issues in regional towns.",
    source: "Svenska Filminstitutet",
    url: "https://www.filminstitutet.se",
    date: "May 15, 2026",
    importance: "Provides early financial support for directors entering the industry.",
    genres: ["Funding", "Swedish"]
  },
  {
    id: "fb-news-3",
    title: "Cannes Jury Awards Grand Prize to Rural Italian Drama 'Terre Linee'",
    summary: "The Grand Prix at the Cannes Film Festival was awarded to 'Terre Linee', a family drama directed by newcomer Sofia Rossi. Set in dry farmland in southern Italy, the movie was noted for its use of local non-professional actors.",
    source: "Screen International",
    url: "https://www.screen daily.com",
    date: "May 21, 2026",
    importance: "Increases the likelihood of Scandinavian theatrical distribution for this title later this year.",
    genres: ["Drama", "Italian", "Festival"]
  },
  {
    id: "fb-news-4",
    title: "Regional Cinemas in Sweden Report Steady Arthouse Attendance",
    summary: "A new study by Folkets Bio shows stable attendance levels for non-English language independent films across metropolitan Sweden. Spanish and French language co-productions showed the highest growth margins in regional hubs.",
    source: "SVT Nyheter",
    url: "https://www.svt.se",
    date: "April 10, 2026",
    importance: "Shows that local cinema-going audiences continue to support physical screens for foreign-language films.",
    genres: ["Industry Report", "Distribution"]
  },
  {
    id: "fb-news-5",
    title: "French Independent Directors Protest Proposed Theater Exclusivity Reduction",
    summary: "A coalition of filmmakers in Paris has initiated a campaign against proposed changes to French media chronology laws, which would allow subscription streaming platforms to stream movies sooner after their theater release.",
    source: "Le Monde",
    url: "https://www.lemonde.fr",
    date: "May 18, 2026",
    importance: "Could impact the financial model of smaller, auteur-driven production studios.",
    genres: ["Policy", "France"]
  },
  {
    id: "fb-news-6",
    title: "New Gothenburg Production Facility Opens with Focus on Analog Labs",
    summary: "A non-profit association in western Sweden has opened a community-run darkroom and development lab for filmmakers using 16mm and 35mm film stock. The center will host workshops for local artists.",
    source: "Göteborgs-Posten",
    url: "https://www.gp.se",
    date: "May 12, 2026",
    importance: "Enables direct access to physical film processing without needing expensive labs abroad.",
    genres: ["Analog", "Swedish"]
  },
  {
    id: "fb-news-7",
    title: "Danish Social Realism Feature 'Vintervej' Acquired for Swedish Distribution",
    summary: "Stockholm-based distributor TriArt Film has purchased Swedish rights to the Danish family drama 'Vintervej'. The theatrical release is expected in late November.",
    source: "TriArt Release Wire",
    url: "https://www.triart.se",
    date: "May 08, 2026",
    importance: "Expands the availability of quiet, character-focused Scandinavian drama in public theaters.",
    genres: ["Acquisition", "Danish"]
  },
  {
    id: "fb-news-8",
    title: "Film Archive Restoration Team Recovers Lost 1970s Experimental Reels",
    summary: "The Swedish National Library has completed the digital restoration of four experimental shorts from the Stockholm underground scene, originally filmed on 16mm in 1974.",
    source: "Svenska Filminstitutet Archive",
    url: "https://www.filminstitutet.se",
    date: "April 29, 2026",
    importance: "Restores historical avant-garde work that was previously unavailable to the public.",
    genres: ["Archival", "Experimental"]
  },
  {
    id: "fb-news-9",
    title: "Spanish-Belgian Co-Production 'El Eco' Starts Principal Photography",
    summary: "Filming has commenced in northern Spain for a drama centering on isolated mountain shepherds. The project is co-funded by several European culture funds.",
    source: "Variety",
    url: "https://variety.com",
    date: "May 03, 2026",
    importance: "Demonstrates the ongoing reliance on cross-border European public funding models.",
    genres: ["Production News", "Co-production"]
  },
  {
    id: "fb-news-10",
    title: "Stockholm Arthouse Film Club Launches Youth Screening Initiative",
    summary: "A group of cinema halls in Stockholm, including Zita, has launched discounted ticket packages for viewers under 26, specifically for non-English language and documentary programs.",
    source: "Mitt i Stockholm",
    url: "https://www.mitti.se",
    date: "April 22, 2026",
    importance: "Aims to introduce younger demographics to international cinema and curation.",
    genres: ["Exhibition", "Stockholm"]
  }
];

const FALLBACK_RELEASES = [
  {
    id: "fb-rel-1",
    title: "The Silent Projector (Director Jan Horák)",
    summary: "A Czech-Swedish production tracking a rare set of experimental prints through film archives.",
    source: "Swedish Arthouse Wire",
    url: "https://www.filminstitutet.se",
    date: "Upcoming Fall Release",
    importance: "Highlights historical archival work and cultural connections.",
    directors: "Jan Horák",
    genres: ["History", "European"],
    country: "Sweden / Czechia"
  },
  {
    id: "fb-rel-2",
    title: "Deep Sensory Landscapes",
    summary: "A documentary following sound artists recording signals beneath Arctic ice caps in Svalbard.",
    source: "Nordisk Film & TV Fond",
    url: "https://nordiskfilmogtvfond.com",
    date: "Scheduled Winter Release",
    importance: "Appeals to followers of experimental soundscapes.",
    directors: "Kristoffer Nyberg",
    genres: ["Documentary", "Experimental"],
    country: "Norway"
  },
  {
    id: "fb-rel-3",
    title: "Under the Concrete",
    summary: "A drama portraying young construction workers in Gothenburg during a hot summer.",
    source: "Svenska Filminstitutet",
    url: "https://www.filminstitutet.se",
    date: "Theatrical Release August 14",
    importance: "Focuses on modern urban Swedish working-class life.",
    directors: "Albin Lindqvist",
    genres: ["Drama", "Swedish"],
    country: "Sweden"
  },
  {
    id: "fb-rel-4",
    title: "Echoes in the Pine Barrens",
    summary: "A psychological thriller about a ranger investigating strange noises in a northern forest.",
    source: "TriArt Film",
    url: "https://www.triart.se",
    date: "Expected October 2026",
    importance: "Combines genre elements with atmospheric slow-burn pacing.",
    directors: "Marie Sjöberg",
    genres: ["Thriller", "Nordic"],
    country: "Sweden / Finland"
  },
  {
    id: "fb-rel-5",
    title: "The Last Ferry",
    summary: "A quiet, slow-cinema piece focusing on an elderly ferry captain on a remote archipelago.",
    source: "Cineuropa",
    url: "https://cineuropa.org",
    date: "Release Postponed to Late Year",
    importance: "Focuses on isolated livelihoods and scenic maritime environments.",
    directors: "Henrik Rosenberg",
    genres: ["Slow Cinema", "Drama"],
    country: "Finland / Estonia"
  },
  {
    id: "fb-rel-6",
    title: "A Cold Light",
    summary: "A minimalist black-and-white feature examining family property disputes in a rural village.",
    source: "MUBI Notebook",
    url: "https://mubi.com",
    date: "Theatrical Release September 10",
    importance: "Highly regarded for its contrast design and cinematic restraint.",
    directors: "Ewa Jansson",
    genres: ["Minimalist", "Drama"],
    country: "Sweden"
  },
  {
    id: "fb-rel-7",
    title: "The Weaver's House",
    summary: "A historical piece set in 19th-century textile mills in Borås, Sweden.",
    source: "Aftonbladet Kultur",
    url: "https://www.aftonbladet.se",
    date: "Release Expected December",
    importance: "Examines female labor history through a realistic period lens.",
    directors: "Nathalie Berg",
    genres: ["Historical", "Swedish"],
    country: "Sweden"
  },
  {
    id: "fb-rel-8",
    title: "Currents in the Sound",
    summary: "A Danish documentary exploring shipping lanes and marine conservation along Oresund.",
    source: "Danish Film Institute",
    url: "https://www.dfi.dk",
    date: "Festival Release Only",
    importance: "Brings awareness to regional maritime ecology.",
    directors: "Lars Thomsen",
    genres: ["Documentary", "Environment"],
    country: "Denmark"
  },
  {
    id: "fb-rel-9",
    title: "Scree",
    summary: "A French climbing drama set in the Alps, focusing on psychological tension on a steep wall.",
    source: "AlloCiné",
    url: "https://www.allocine.fr",
    date: "Sweden Release Winter",
    importance: "A gripping, tight scenario centering on trust and survival.",
    directors: "Pierre Laurent",
    genres: ["Drama", "French"],
    country: "France"
  },
  {
    id: "fb-rel-10",
    title: "The Glass Factory",
    summary: "An experimental work examining industrial work and heat in Sweden's traditional glass region, Glasriket.",
    source: "Sydsvenskan",
    url: "https://www.sydsvenskan.se",
    date: "Sundance Release Window",
    importance: "Combines industrial soundscapes with gorgeous close-up macro cinematography.",
    directors: "Olof Nilsson",
    genres: ["Experimental", "Swedish"],
    country: "Sweden"
  }
];

const FALLBACK_FESTIVALS = [
  {
    id: "fb-fest-1",
    title: "La Chimera d'Oro",
    festival: "Venice (Critics Week)",
    awardWon: "Critics Week Grand Prize",
    director: "Mattheo Rossi",
    summary: "A documentary of illegal archeological excavations beneath the historical canals of Venice.",
    importance: "Acknowledges a newcomer director utilizing low-light photography to capture ancient ruins and active decay."
  },
  {
    id: "fb-fest-2",
    title: "Whispers of the Spruce",
    festival: "Sundance",
    awardWon: "Alfred P. Sloan Science Award",
    director: "Elin Lindqvist",
    summary: "A researcher maps ancient forest signals using pre-war acoustic signal processors.",
    importance: "Presents a unique crossover between scientific research and acoustic cinema storytelling."
  },
  {
    id: "fb-fest-3",
    title: "The Clay Path",
    festival: "Berlin International Film Festival",
    awardWon: "Silver Bear for Outstanding Contribution",
    director: "Min-jae Park",
    summary: "A slow-paced Korean drama centered on a country potter trying to preserve traditional clay kilns.",
    importance: "Recognized for its composition, focusing on the tactile aspect of art."
  },
  {
    id: "fb-fest-4",
    title: "Onyx",
    festival: "Stockholm International Film Festival",
    awardWon: "Best Screenplay",
    director: "Sara Dahl",
    summary: "A witty, fast-paced dialogue-driven mystery set inside a Stockholm literary agency.",
    importance: "Highlights sharp Swedish screenwriting in a saturated genre."
  },
  {
    id: "fb-fest-5",
    title: "Morning Harvest",
    festival: "Cannes Film Festival",
    awardWon: "Camera d'Or (Best Debut)",
    director: "Ismail Al-Mansour",
    summary: "A debut feature depicting daily life and community relations on an olive farm in Lebanon.",
    importance: "Provides international attention to a new director working with regional themes."
  },
  {
    id: "fb-fest-6",
    title: "Salt and Stone",
    festival: "Locarno Film Festival",
    awardWon: "Special Jury Prize",
    director: "Helena Vazquez",
    summary: "A quiet, moody look at wind turbine installations on a remote, windy Spanish island.",
    importance: "Recognized for its sound design and ambient atmosphere."
  },
  {
    id: "fb-fest-7",
    title: "The Iron Foundry",
    festival: "Göteborg Film Festival",
    awardWon: "Dragon Award for Best Nordic Film",
    director: "Jonas Ekdahl",
    summary: "A family saga examining industrial decline and structural transition in a northern mining town.",
    importance: "Captures local socio-economic history with high accuracy."
  },
  {
    id: "fb-fest-8",
    title: "A Darker Shade",
    festival: "San Sebastián Film Festival",
    awardWon: "FIPRESCI Critics Award",
    director: "Ana Silva",
    summary: "An atmospheric thriller capturing local smuggling routes in northwestern Spain.",
    importance: "Noted for its realism and direct camerawork."
  },
  {
    id: "fb-fest-9",
    title: "Night Shift",
    festival: "Rotterdam Film Festival",
    awardWon: "Tiger Award",
    director: "Yusuf Demir",
    summary: "A minimalist drama tracking toll booth workers on a highway during night shifts.",
    importance: "A highly focused, chamber-like scenario set in a single, well-defined location."
  },
  {
    id: "fb-fest-10",
    title: "The Birch Forest",
    festival: "Cannes Film Festival",
    awardWon: "Queer Palm",
    director: "Lukas Johansson",
    summary: "A romantic drama set in northern Sweden during the midsummer night sun.",
    importance: "Pragmatic, beautiful portrayal of rural life of marginalized characters."
  }
];

// Initialize Gemini SDK lazily to prevent server crashes if GEMINI_API_KEY is not defined
let genAIClient: any = null;

// Circuit breaker state to handle 429 Quota exhaustion gracefully
let isGeminiCooldownActive = false;
let geminiCooldownEndTime = 0;
const COOLDOWN_DURATION_MS = 3 * 60 * 1000; // 3 minutes cooldown

function checkCooldown() {
  if (isGeminiCooldownActive && Date.now() > geminiCooldownEndTime) {
    isGeminiCooldownActive = false;
    console.log("[Circuit Breaker] Cooldown window expired. Attempting live Gemini calls.");
  }
  return isGeminiCooldownActive;
}

function activateCooldown() {
  isGeminiCooldownActive = true;
  geminiCooldownEndTime = Date.now() + COOLDOWN_DURATION_MS;
}

function isQuotaError(error: any): boolean {
  try {
    const errorStr = [
      error?.message,
      error?.status,
      error?.statusText,
      error?.code,
      error?.toString?.(),
      error ? JSON.stringify(error) : ""
    ].filter(Boolean).join(" ");
    
    const isRateLimitCode = error?.status === 429 || error?.code === 429 || error?.error?.code === 429;
    return (
      isRateLimitCode ||
      errorStr.includes("429") ||
      errorStr.includes("RESOURCE_EXHAUSTED") ||
      errorStr.includes("quota") ||
      errorStr.includes("limit") ||
      errorStr.includes("Exceeded")
    );
  } catch (e) {
    return false;
  }
}

function getGeminiClient() {
  if (!genAIClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY" && apiKey.trim() !== "") {
      genAIClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini SDK Initialized successfully.");
    }
  }
  return genAIClient;
}

// 1. CineRadar Endpoint: Scans Google Search Grounding for real-time indie film news and trade alerts
app.get("/api/cine-radar", async (req, res) => {
  const category = (req.query.category as string) || "news";
  const cinemaName = (req.query.cinemaName as string) || "Zita Folkets Bio";
  const focusArea = (req.query.focusArea as string) || "Independent, Swedish, European & Art House films";
  const isLoadMore = req.query.loadMore === "true";

  console.log(`CineRadar scanning Zita news channels. Category: ${category}, Target: ${cinemaName}, Focus: ${focusArea}, loadMore: ${isLoadMore}`);

  const ai = getGeminiClient();
  const cooldownActive = checkCooldown();

  const offset = parseInt(req.query.offset as string) || 0;

  if (!ai || cooldownActive) {
    if (cooldownActive) {
      console.log(`[Circuit Breaker Active] Serving fast local fallback due to recent 429 quota exhaustion.`);
    } else {
      console.log("Gemini key is undefined or placeholders are active - serving curated fallback news bulletins.");
    }
    
    const isExceeded = cooldownActive || !ai;
    if (category === "news") {
      let sliced = [];
      if (isLoadMore) {
        const start = offset % FALLBACK_NEWS.length;
        const count = 3;
        for (let i = 0; i < count; i++) {
          const item = FALLBACK_NEWS[(start + i) % FALLBACK_NEWS.length];
          sliced.push({
            ...item,
            id: `fb-news-extra-${offset}-${i}-${Math.floor(Math.random() * 10000)}`
          });
        }
      } else {
        sliced = FALLBACK_NEWS.slice(0, 5);
      }
      return res.json({ source: "local-wire-curated", isQuotaExceeded: isExceeded, isApiKeyMissing: !ai, data: sliced, timestamp: new Date() });
    }
    if (category === "releases") {
      let sliced = [];
      if (isLoadMore) {
        const start = offset % FALLBACK_RELEASES.length;
        const count = 3;
        for (let i = 0; i < count; i++) {
          const item = FALLBACK_RELEASES[(start + i) % FALLBACK_RELEASES.length];
          sliced.push({
            ...item,
            id: `fb-rel-extra-${offset}-${i}-${Math.floor(Math.random() * 10000)}`
          });
        }
      } else {
        sliced = FALLBACK_RELEASES.slice(0, 5);
      }
      return res.json({ source: "local-wire-curated", isQuotaExceeded: isExceeded, isApiKeyMissing: !ai, data: sliced, timestamp: new Date() });
    }
    if (category === "festivals") {
      let sliced = [];
      if (isLoadMore) {
        const start = offset % FALLBACK_FESTIVALS.length;
        const count = 3;
        for (let i = 0; i < count; i++) {
          const item = FALLBACK_FESTIVALS[(start + i) % FALLBACK_FESTIVALS.length];
          sliced.push({
            ...item,
            id: `fb-fest-extra-${offset}-${i}-${Math.floor(Math.random() * 10000)}`
          });
        }
      } else {
        sliced = FALLBACK_FESTIVALS.slice(0, 5);
      }
      return res.json({ source: "local-wire-curated", isQuotaExceeded: isExceeded, isApiKeyMissing: !ai, data: sliced, timestamp: new Date() });
    }
    
    // Curated Pitch integration rewritten as an industry intelligence brief (Zita focus) with Stockholm competitor scouting
    return res.json({
      source: "local-wire-curated",
      isQuotaExceeded: isExceeded,
      isApiKeyMissing: !ai,
      summaryPitch: `ZITA CINEMATEK INTELLIGENCE DISPATCH\n\nStockholm's independent film landscape currently reflects high curiosity surrounding analog celluloid projection (16mm, 35mm), micro-budget social realism in Sweden, and French-Belgian new wave titles. The industry is backing risk-taking cinema hubs that exhibit provocative, boundary-pushing cinema.`,
      recommendations: [
        {
          title: "The Silent Projector (Czech/Swedish Co-production)",
          strategy: "Industry developments show strong critical momentum for director Jan Horák after a preview screening at Göteborg. The film addresses the romance of manual celluloid, which appeals heavily to classic Stockholm arthouse attendees.",
          targetAudience: "Swedish Cinephiles, Analog Devotees, and Arthouse Historians"
        },
        {
          title: "Senza Tempo (Cannes Italian Sci-Fi)",
          strategy: "Italian magical-realism news: critics are predicting French and Swedish acquisitions by regional boutique distributors. Focus on Director Alice Rohrwacher's latest film festival sweep.",
          targetAudience: "Stockholm Film Society, Swedish Film Critics, European Cinema Enthusiasts"
        }
      ],
      competitorScout: [
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
      ],
      timestamp: new Date()
    });
  }

  try {
    let promptSubject = "";
    let systemInstructions = "";

    if (category === "news") {
      if (isLoadMore) {
        promptSubject = `Scan current Google Search indices for real-time news in independent films, art house movies, European filmmaker hubs, and Swedish filmmaker movements. Retrieve between 3 and 10 additional, non-duplicate, unique news bulletins that are different. Focus purely on informative reports, funding, and developments. DO NOT recommend films. Make sure wording is completely natural, humble, and factual. Avoid AI phrases like "tapestry", "sparking", "beacon", "groundbreaking", "provocative", "captures", "stuns", "renaissance".`;
      } else {
        promptSubject = `Scan current Google Search indices for real-time news in independent films, art house movies, European filmmaker hubs, film festivals, and Swedish debut filmmaker movements for ${new Date().getFullYear()}. Focus purely on informative reports, funding, and developments. DO NOT recommend films. Include EXACTLY 5 items. Make sure wording is completely natural, humble, and factual. Avoid AI phrases like "tapestry", "sparking", "beacon", "groundbreaking", "provocative", "captures", "stuns", "renaissance".`;
      }
      systemInstructions = `You are a professional film trade reporter writing in a simple, factual, human-sounding style. DO NOT use hype, high-flown adjectives, or typical AI marketing words. Keep all summaries dry, sober, and objective. Provide a JSON array conforming to this schema:
      
[{
  "id": "radar-news-1",
  "title": "Title of the actual independent/art-house film news",
  "summary": "Detailed 2-3 sentence report of the update, director debut, trade deal, or award",
  "source": "E.g., ScreenDaily, SFI, Variety",
  "url": "Direct web search source URL",
  "date": "Date of release/announcement",
  "importance": "A dry explanation outlining the practical context or industry importance of this news.",
  "genres": ["Drama", "European", "etc"]
}]`;
    } else if (category === "releases") {
      if (isLoadMore) {
        promptSubject = `Search Google for real-time release window schedules, theatrical acquisitions, and independent distributor news for art-house, European, or Swedish films in late ${new Date().getFullYear()} or ${new Date().getFullYear() + 1}. Find between 3 and 10 additional unique titles. Keep the tone factual and completely natural, avoiding AI superlatives and dramatic marketing jargon.`;
      } else {
        promptSubject = `Search Google for real-time release window schedules, theatrical acquisitions, and independent distributor news for art-house, European, or Swedish films in late ${new Date().getFullYear()} or ${new Date().getFullYear() + 1}. Find and include EXACTLY 5 items. Keep the tone factual and completely natural, avoiding AI superlatives and dramatic marketing jargon.`;
      }
      systemInstructions = `You are an international trade news scanner. Provide a JSON array of real film development bulletins in this schema. Write in simple, sober, realistic language:
[{
  "id": "radar-rel-1",
  "title": "Film name in trade news",
  "summary": "Details surrounding acquisition, film plot, or production progress from high-quality sources",
  "source": "E.g., Box office news or film distributor brief",
  "url": "Search URL source",
  "date": "Announced release or festival premiere window",
  "importance": "Brief analysis of the film schedule, filmmaker track record, or critical reception.",
  "directors": "Director name(s)",
  "genres": ["Genre1", "Genre2"],
  "country": "Country of origin"
}]`;
    } else if (category === "festivals") {
      if (isLoadMore) {
        promptSubject = `Find the latest awarded films, winners, and critical notes from major recent film festivals. Retrieve between 3 and 10 additional unique award wins and directors. Keep wording natural and real, avoiding clichés like 'tapestry' or 'beacon'.`;
      } else {
        promptSubject = `Find the latest awarded films, winners, and critical notes from major recent film festivals. Include EXACTLY 5 items. Keep wording natural and real, avoiding clichés like 'tapestry' or 'beacon'.`;
      }
      systemInstructions = `You are a film festival trade correspondent writing in a sober, informative news agency style. Provide a JSON array matching this structure:
[{
  "id": "radar-fest-1",
  "title": "Film name",
  "festival": "The Film Festival (e.g., Stockholm Film Festival, Cannes)",
  "awardWon": "Specific prize awarded (e.g., Golden Bear, Palme d'Or)",
  "director": "Director of the film",
  "summary": "Key details of the film's festival screening details and reception.",
  "importance": "Practical or trade significance of this award for film exhibition and future screenings."
}]`;
    } else {
      // Industry Monitor report overview with Stockholm competitor scouting
      promptSubject = `Perform an industry tracking and competitor analysis for independent and mainstream cinemas in Stockholm, Sweden, comparing them with Zita Folkets Bio (${cinemaName}, focusing on ${focusArea}).
      Specifically, search Google for current programming/repertoire lists and social media buzz/commentary for:
      1. Bio Aspen (Aspen in Hägerstensåsen, Stockholm)
      2. Bio Rio (Hornstull, Stockholm)
      3. Bio Capitol (Sankt Eriksgatan, Stockholm)
      4. SF Bio (Filmstaden multiplexes in Stockholm, like Sergel, Saga, etc.)

      Write a specialized professional intelligence brief summarizing Swedish indie trends, and compile the competitor monitoring details. Avoid generic movie reviews or consumer recommendations; keep the tone strategic, sober, and factual. Avoid AI superlatives.`;

      systemInstructions = `You are an expert Swedish cinema business analyst compiling a trade intelligence dispatch for Stockholm's Zita Folkets Bio. Conduct web searches for active competitor programming and social media chatter. Return a JSON object matching this schema EXACTLY:
{
  "summaryPitch": "Strategic 3-4 sentence overview of the Stockholm art-house/indie landscape today, noting macro trends, coordinate shifts, or audience movements.",
  "recommendations": [
    {
      "title": "Real film currently driving Swedish trade news or active indie distribution debate",
      "strategy": "Critical analysis outlining what this film's local footprint means for Zita's curation vs. other venues.",
      "targetAudience": "Specific film club, group of cinephiles, or demographic targeted."
    }
  ],
  "competitorScout": [
    {
      "cinema": "Bio Aspen",
      "programming": "Specific current program, upcoming highlights, retro cycles, or suburb cinema screenings running there.",
      "socialBuzz": "Summary of active social media posts, neighbourhood buzz, Instagram comments, or community hype.",
      "threatLevel": "Low / Medium / High / Collaboration Opportunity",
      "strategicCounter": "Strategic advice on how Zita should respond or complement their schedule."
    },
    {
      "cinema": "Bio Rio",
      "programming": "Specific titles, festival collaborations, or café/bistro cinema programs they are hosting.",
      "socialBuzz": "Social media reception, community events, or hornstull neighbourhood feedback.",
      "threatLevel": "Low / Medium / High / Collaboration Opportunity",
      "strategicCounter": "How Zita can leverage counter-programming or coordinate."
    },
    {
      "cinema": "Bio Capitol",
      "programming": "Bistro cinema highlights, premium sound previews, or upscale European auteur titles.",
      "socialBuzz": "Instagram/FB buzz on food pairing, premium seat booking feedback, or luxury experience feedback.",
      "threatLevel": "Low / Medium / High / Collaboration Opportunity",
      "strategicCounter": "How Zita can differentiate via pure curation depth or historic format showcases."
    },
    {
      "cinema": "SF Bio / Filmstaden",
      "programming": "Mainstream blockbuster dominance, major Hollywood releases, or local popcorn comedies.",
      "socialBuzz": "Broad public comments or sentiments on ticket inflation or generic multiplex experiences versus boutique spaces.",
      "threatLevel": "Low / Medium / High / Collaboration Opportunity",
      "strategicCounter": "Zita's pure organic art-house branding and anti-commercial appeal."
    }
  ]
}`;
    }

    let modelName = process.env.NEWS_ROOM_MODEL || "gemini-3.5-flash";
    if (modelName === "3.5-flash") {
      modelName = "gemini-3.5-flash";
    } else if (modelName === "3.1-pro-preview") {
      modelName = "gemini-3.1-pro-preview";
    } else if (!modelName.startsWith("gemini-") && !modelName.startsWith("models/")) {
      modelName = `gemini-${modelName}`;
    }
    console.log(`Using model: ${modelName} for CineRadar newsroom generation.`);

    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptSubject,
      config: {
        systemInstruction: systemInstructions,
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json"
      }
    });

    const rawText = response.text || "";
    console.log("Raw Gemini Response received with Grounding.");

    // Parse the JSON safely
    let parsedData;
    try {
      parsedData = JSON.parse(rawText.trim());
    } catch (parseErr) {
      console.warn("Failed to parse Gemini output directly as JSON, trying extraction patterns...", parseErr);
      const jsonMatch = rawText.match(/```json?\s*([\s\S]*?)\s*```/) || rawText.match(/\[\s*\{[\s\S]*?\}\s*\]/) || rawText.match(/\{\s*"[\s\S]*?\}\s*/);
      if (jsonMatch) {
         parsedData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
         throw new Error("No parseable JSON structure found in Gemini output.");
      }
    }

    // Capture grounding metadata chunks if available to enrich URLs
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks && Array.isArray(parsedData)) {
      parsedData = parsedData.map((item: any, idx: number) => {
        const matchingChunk = chunks[idx % chunks.length];
        if (matchingChunk?.web?.uri && (!item.url || item.url.includes("google.com/search"))) {
          item.url = matchingChunk.web.uri;
        }
        return item;
      });
    }

    return res.json({
      source: "gemini-search-radar",
      data: parsedData,
      recommendations: parsedData.recommendations || undefined,
      summaryPitch: parsedData.summaryPitch || undefined,
      competitorScout: parsedData.competitorScout || undefined,
      timestamp: new Date()
    });

  } catch (error: any) {
    let isQuota = false;
    
    if (isQuotaError(error)) {
      console.warn("[Circuit Breaker Activated] 429 Quota Exceeded/RESOURCE_EXHAUSTED detected during scanning. Gracefully entering 3-minute cooldown fallback.");
      activateCooldown();
      isQuota = true;
    } else {
      console.error("Gemini Scan Error:", error);
    }

    if (category === "news") {
      let sliced = [];
      if (isLoadMore) {
        const start = offset % FALLBACK_NEWS.length;
        const count = 3;
        for (let i = 0; i < count; i++) {
          const item = FALLBACK_NEWS[(start + i) % FALLBACK_NEWS.length];
          sliced.push({
            ...item,
            id: `fb-news-extra-safety-${offset}-${i}-${Math.floor(Math.random() * 10000)}`
          });
        }
      } else {
        sliced = FALLBACK_NEWS.slice(0, 5);
      }
      return res.json({ source: "local-wire-fallback-safety", isQuotaExceeded: isQuota, isApiKeyMissing: !ai, data: sliced, timestamp: new Date() });
    }
    if (category === "releases") {
      let sliced = [];
      if (isLoadMore) {
        const start = offset % FALLBACK_RELEASES.length;
        const count = 3;
        for (let i = 0; i < count; i++) {
          const item = FALLBACK_RELEASES[(start + i) % FALLBACK_RELEASES.length];
          sliced.push({
            ...item,
            id: `fb-rel-extra-safety-${offset}-${i}-${Math.floor(Math.random() * 10000)}`
          });
        }
      } else {
        sliced = FALLBACK_RELEASES.slice(0, 5);
      }
      return res.json({ source: "local-wire-fallback-safety", isQuotaExceeded: isQuota, isApiKeyMissing: !ai, data: sliced, timestamp: new Date() });
    }
    if (category === "festivals") {
      let sliced = [];
      if (isLoadMore) {
        const start = offset % FALLBACK_FESTIVALS.length;
        const count = 3;
        for (let i = 0; i < count; i++) {
          const item = FALLBACK_FESTIVALS[(start + i) % FALLBACK_FESTIVALS.length];
          sliced.push({
            ...item,
            id: `fb-fest-extra-safety-${offset}-${i}-${Math.floor(Math.random() * 10000)}`
          });
        }
      } else {
        sliced = FALLBACK_FESTIVALS.slice(0, 5);
      }
      return res.json({ source: "local-wire-fallback-safety", isQuotaExceeded: isQuota, isApiKeyMissing: !ai, data: sliced, timestamp: new Date() });
    }
    return res.json({
      source: "local-wire-fallback-safety",
      isQuotaExceeded: isQuota,
      isApiKeyMissing: !ai,
      summaryPitch: `ZITA CINEMATEK INTELLIGENCE DISPATCH\n\nWhile our real-time trade scanners are refreshing coordinates, we have compiled our expert Swedish and European curation matrix. Focus heavily on contemporary micro-budgets and Swedish newcomer soundscapes to navigate the upcoming awards season.`,
      recommendations: [
        {
          title: "The Silent Projector (Director Jan Horák)",
          strategy: "Our industry scouts report supreme interest in French-Belgian distribution channels grabbing this Czech-Swedish collaboration.",
          targetAudience: "Nostalgic film preservationists and foreign cinema societies."
        }
      ],
      competitorScout: [
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
      ],
      timestamp: new Date()
    });
  }
});

// 2. Poster Generation Endpoint: Creates a cinematic poster from a text prompt
app.post("/api/generate-poster", async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt specification in request body" });
  }

  console.log(`Poster image generation requested. Prompt: "${prompt}"`);

  const ai = getGeminiClient();
  const cooldownActive = checkCooldown();

  if (!ai || cooldownActive) {
    console.log("Gemini API key is unavailable or cooldown active. Generating detailed SVG mock poster.");
    return res.json({
      url: null,
      fallbackSvg: true,
      isQuotaExceeded: cooldownActive || !ai,
      message: cooldownActive 
        ? "Creative AI synthesis engine is in cooldown due to rate limits. Direct vector visualizers are active."
        : "Active Gemini key not detected. Cinema posters are generated as stylized high-fidelity vector placeholders of cinematic compositions.",
      timestamp: new Date()
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: {
        parts: [
          {
            text: `High-quality cinematic film promotional poster graphic with rich details. Concept: ${prompt}. Do not include photo frame, tablet, laptop, or camera rigs surrounds, just the direct high-contrast cinema key-art graphic.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4", // Movie poster proportions (close to 3:4)
        },
      },
    });

    let base64Image = null;
    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content.parts;
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          base64Image = part.inlineData.data;
          break;
        }
      }
    }

    if (base64Image) {
      return res.json({
        url: `data:image/png;base64,${base64Image}`,
        prompt: prompt,
        timestamp: new Date()
      });
    } else {
       throw new Error("No inline image data found in candidate parts.");
     }

  } catch (error: any) {
    let isQuota = false;
    
    if (isQuotaError(error)) {
      console.warn("[Circuit Breaker Activated] 429 Quota Exceeded/RESOURCE_EXHAUSTED detected during poster generation. Gracefully entering cooldown fallback.");
      activateCooldown();
      isQuota = true;
    } else {
      console.error("Gemini Poster Generation failed, dropping to elegant fallback SVG:", error);
    }
    return res.json({
      url: null,
      fallbackSvg: true,
      isQuotaExceeded: isQuota,
      error: error.message || "Model offline / unauthorized",
      timestamp: new Date()
    });
  }
});

// Screendaily headlines scraper endpoint
app.get("/api/screendaily-headlines", async (req, res) => {
  try {
    const response = await fetch("https://www.screendaily.com/news/territories/europe", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch Screendaily: ${response.statusText}`);
    }
    const html = await response.text();
    const articles: { title: string; url: string; summary: string }[] = [];
    const seenUrls = new Set<string>();

    const linkRegex = /<a\s+[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(html)) !== null) {
      let url = match[1].trim();
      let title = match[2].replace(/<[^>]+>/g, "").trim();

      // We only care about article links (ending in .article, often the news/features sections)
      if (url.includes(".article") && title.length > 15) {
        if (url.startsWith("/")) {
          url = `https://www.screendaily.com${url}`;
        }
        
        // Clean up common entities
        title = title
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lsquo;/g, "‘")
          .replace(/&rsquo;/g, "’")
          .replace(/&ldquo;/g, "“")
          .replace(/&rdquo;/g, "”")
          .replace(/\s+/g, " ")
          .trim();

        // Deduce a professional cinema newsroom subtext from the headline if not scrape-able
        let summary = "The latest production changes, funding breakthroughs, and festival developments across Europe's independent film landscape.";
        if (title.toLowerCase().includes("cannes")) {
          summary = "Analyzing distribution deals, critical feedback, and official selection market sales at the 2026 Cannes Film Festival.";
        } else if (title.toLowerCase().includes("venice")) {
          summary = "Unpacking potential world premieres, arthouse lineups, and Golden Lion contenders in Italy.";
        } else if (title.toLowerCase().includes("pitch Stop") || title.toLowerCase().includes("projects")) {
          summary = "Co-production forums unveil highly anticipated creative projects seeking backing and distribution matches.";
        } else if (title.toLowerCase().includes("burnout") || title.toLowerCase().includes("producer")) {
          summary = "New industry reports shed light on systemic challenges, working hours, and physical fatigue among indie filmmakers.";
        } else if (title.toLowerCase().includes("netflix") || title.toLowerCase().includes("sales")) {
          summary = "Streaming giants and international sales teams coordinate fresh packages to secure theatrical exhibition options.";
        }

        if (!seenUrls.has(url)) {
          seenUrls.add(url);
          articles.push({ title, url, summary });
        }
      }
    }

    // Limit to top 15 parsed articles
    if (articles.length > 0) {
      return res.json(articles.slice(0, 15));
    }
    
    throw new Error("Plausible articles not parsed from HTML structure");

  } catch (error: any) {
    console.warn("Screendaily scraper fallback active (External domain request blocked or rate-limited). Serving elegant cinema bulletin fallbacks.");
    const fallbackArticles = [
      {
        title: "Transilvania Pitch Stop unveils 10 projects for 2026 edition",
        url: "https://www.screendaily.com/news/transilvania-pitch-stop-unveils-10-projects-for-2026-edition/5217209.article",
        summary: "The co-production forum has selected ten highly promising projects from Eastern Europe to pitch to international co-producers, distributors, and sales agents."
      },
      {
        title: "Buyers and sellers give their verdict on Cannes 2026",
        url: "https://www.screendaily.com/news/buyers-and-sellers-give-their-verdict-on-cannes-2026/5217184.article",
        summary: "Industry professionals report cautious optimism, strong mid-tier sales, and a return of physical theatrical buying confidence on the Croisette."
      },
      {
        title: "Sarah Arnold’s Cannes Directors’ Fortnight premiere ‘Too Many Beasts’ wins Europa Cinemas prize",
        url: "https://www.screendaily.com/news/sarah-arnolds-cannes-directors-fortnight-premiere-too-many-beasts-wins-europa-cinemas-prize/5217092.article",
        summary: "The compelling drama has clinched the prestigious exhibitor network accolade, guaranteeing extensive theater distribution backing across Europe."
      },
      {
        title: "Which films are in the running for the 2026 Venice Film Festival?",
        url: "https://www.screendaily.com/news/which-films-are-in-the-running-for-the-2026-venice-film-festival/5216932.article",
        summary: "Early rumors and production schedules suggest radical new features from veteran Italian, French, and Scandinavian auteur filmmakers."
      },
      {
        title: "Anonymous Content pledges to double number of European productions",
        url: "https://www.screendaily.com/news/anonymous-content-pledges-to-double-number-of-european-productions/5216845.article",
        summary: "The global management and production outfit is expanding its footprint in Paris, London, and Munich, committing to ambitious local-language stories."
      },
      {
        title: "Europa Cinemas unveils nine projects for 2026 Collaborate to Innovate scheme",
        url: "https://www.screendaily.com/europa-cinemas-unveils-nine-projects-for-2026-collaborate-to-innovate-scheme/5216832.article",
        summary: "Funding initiatives targeting creative audience-building strategies, ecological transitions, and custom archival projection tech in local theaters."
      },
      {
        title: "‘Twilight Of The Warriors’ sequel lands key Europe, Asia sales as Daniel Wu joins cast",
        url: "https://www.screendaily.com/news/twilight-of-the-warriors-sequel-lands-key-europe-asia-sales-as-daniel-wu-joins-cast/5216803.article",
        summary: "The martial arts action epic establishes sweeping European distribution commitments from leading arthouse distributors."
      },
      {
        title: "Producer burnout cases are rising fast, says EAVE report",
        url: "https://www.screendaily.com/news/producer-burnout-cases-are-rising-fast-says-eave-report/5216745.article",
        summary: "The European Audiovisual Entrepreneurs organization highlights systemic financing hurdles and post-production strain as major stress indicators."
      }
    ];
    return res.json(fallbackArticles);
  }
});

// Proxy routes for n8n webhooks to bypass browser CORS constraints safely
app.post("/api/n8n-trigger-agents", async (req, res) => {
  try {
    const response = await fetch("https://cima87.app.n8n.cloud/webhook/trigger-zita-agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`n8n trigger-agents returned status ${response.status}: ${errorText}`);
      throw new Error(`n8n agents trigger failed with status ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("n8n-trigger-agents proxy failed:", error);
    return res.status(500).json({ error: error.message || "Proxy connection failure" });
  }
});

app.post("/api/n8n-strategy-chat", async (req, res) => {
  try {
    const response = await fetch("https://cima87.app.n8n.cloud/webhook/zita-strategy-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`n8n strategy-chat returned status ${response.status}: ${errorText}`);
      throw new Error(`n8n strategy chat failed with status ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("n8n-strategy-chat proxy failed:", error);
    return res.status(500).json({ error: error.message || "Proxy connection failure" });
  }
});

app.post("/api/n8n-execute-visuals", async (req, res) => {
  try {
    const response = await fetch("https://cima87.app.n8n.cloud/webhook/zita-execute-visuals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`n8n execute-visuals returned status ${response.status}: ${errorText}`);
      throw new Error(`n8n execute visuals failed with status ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("n8n-execute-visuals proxy failed:", error);
    return res.status(500).json({ error: error.message || "Proxy connection failure" });
  }
});

app.post("/api/n8n-render-start", async (req, res) => {
  try {
    const response = await fetch("https://cima87.app.n8n.cloud/webhook/render-start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`n8n render-start returned status ${response.status}: ${errorText}`);
      throw new Error(`n8n render start failed with status ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("n8n-render-start proxy failed:", error);
    return res.status(500).json({ error: error.message || "Proxy connection failure" });
  }
});

app.get("/api/n8n-render-check", async (req, res) => {
  try {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === "string") {
        query.set(key, value);
      }
    }
    const checkUrl = `https://cima87.app.n8n.cloud/webhook/render-check?${query.toString()}`;
    const response = await fetch(checkUrl);
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`n8n render-check returned status ${response.status}: ${errorText}`);
      throw new Error(`n8n render check failed with status ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("n8n-render-check proxy failed:", error);
    return res.status(500).json({ error: error.message || "Proxy connection failure" });
  }
});

// Vite middleware development / static production setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`CineRadar full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
