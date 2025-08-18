import React, { useMemo, useState, useEffect } from "react";
import { Copy, Check, WandSparkles, Shuffle } from "lucide-react";

// --- Minimal UI helpers (no external UI libs required) ---
const Label = ({ children, htmlFor }) => (
  <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">{children}</label>
);
const Input = (props) => (
  <input {...props} className={`w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm ${props.className||""}`} />
);
const Textarea = (props) => (
  <textarea {...props} className={`w-full rounded-2xl border px-3 py-2 text-sm min-h-[84px] focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm ${props.className||""}`} />
);
const Select = ({ options, value, onChange, id }) => (
  <select id={id} value={value} onChange={(e)=>onChange(e.target.value)} className="w-full rounded-2xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm">
    {options.map(o=> <option key={o.value} value={o.value}>{o.label}</option>)}
  </select>
);
const Button = ({ children, className, ...props }) => (
  <button {...props} className={`rounded-2xl px-4 py-2 text-sm font-medium shadow-sm hover:shadow transition inline-flex items-center gap-2 ${className||"bg-indigo-600 text-white"}`} />
);

// --- Simple router without dependencies (hash-based) ---
function useHashRoute(defaultPath = "#/") {
  const [path, setPath] = useState(window.location.hash || defaultPath);
  useEffect(() => {
    const onHash = () => setPath(window.location.hash || defaultPath);
    window.addEventListener("hashchange", onHash);
    if (!window.location.hash) window.location.hash = defaultPath;
    return () => window.removeEventListener("hashchange", onHash);
  }, [defaultPath]);
  return [path, (p)=>{ window.location.hash = p; }];
}

// --- Prompt builder logic (image mode) ---
const STYLE_PRESETS = [
  { label: "Photorealistic", value: "photorealistic, ultra-detailed" },
  { label: "Cinematic", value: "cinematic lighting, shallow depth of field" },
  { label: "Studio Portrait", value: "studio lighting, softbox, HDR" },
  { label: "Watercolor", value: "delicate watercolor, soft washes" },
  { label: "Anime", value: "anime style, crisp lineart, vibrant palette" },
  { label: "Isometric", value: "isometric view, clean vector shapes" },
];
const LIGHTING = ["golden hour", "softbox", "rim light", "volumetric", "neon", "overcast", "moonlit"];
const COMPOSITIONS = ["rule of thirds", "centered", "leading lines", "top-down", "close-up", "wide shot"]; 
const MOODS = ["serene", "dramatic", "mysterious", "playful", "melancholic", "epic"];

function buildPrompt({subject, action, environment, stylePreset, mood, details, lens, lighting, composition, extras, negative, ar, quality, seed}){
  const parts = [
    subject && subject.trim(),
    action && action.trim(),
    environment && environment.trim(),
    details && details.trim(),
    mood && `mood: ${mood}`,
    stylePreset && `style: ${stylePreset}`,
    lens && `lens: ${lens}`,
    lighting && `lighting: ${lighting}`,
    composition && `composition: ${composition}`,
    extras && extras.trim(),
  ].filter(Boolean);

  const main = parts.join(", ");
  const suffix = [
    ar && `--ar ${ar}`,
    quality && `--quality ${quality}`,
    typeof seed === 'number' && !Number.isNaN(seed) ? `--seed ${seed}` : null,
  ].filter(Boolean).join(" ");

  return suffix ? `${main} ${suffix}` : main;
}

// --- Reviews content (human, positive) ---
const REVIEWS = [
  {
    name: "Sofia R.",
    role: "Creative Director",
    quote: "This finally fixed our prompt chaos. The output is consistent and our artists love it.",
    stars: 5
  },
  {
    name: "Daniel K.",
    role: "Solo Maker",
    quote: "I went from random results to reliable looks in a day. The presets are spot on.",
    stars: 5
  },
  {
    name: "Priya M.",
    role: "Marketing Lead",
    quote: "Our team ships assets faster and with fewer revisions. Huge time saver.",
    stars: 5
  }
];

// --- Pricing data ---
const PLANS = [
  {
    name: "Free",
    price: "$0",
    tagline: "Great for getting started",
    features: [
      "Prompt builder (image mode)",
      "Copy to clipboard",
      "3 quick-starter templates",
      "Email support (community)"
    ],
    cta: { label: "Start Free", href: "#/" }
  },
  {
    name: "Pro",
    price: "$9/mo",
    tagline: "For creators who want more",
    features: [
      "Advanced presets & saved templates",
      "One-click optimize button",
      "Pricing & Reviews sections built-in",
      "Early access to video mode"
    ],
    cta: { label: "Go Pro", href: "#/pricing" }
  }
];

// --- Pages ---
function Navbar({ path, navigate }){
  return (
    <div className="flex items-center justify-between py-4">
      <div className="text-xl font-semibold">Prompt Workshop</div>
      <nav className="flex items-center gap-3 text-sm">
        <a href="#/" onClick={(e)=>{e.preventDefault();navigate('#/')}} className={`px-3 py-2 rounded-2xl ${path==="#/"?"bg-indigo-600 text-white":"hover:bg-gray-100"}`}>Home</a>
        <a href="#/pricing" onClick={(e)=>{e.preventDefault();navigate('#/pricing')}} className={`px-3 py-2 rounded-2xl ${path==="#/pricing"?"bg-indigo-600 text-white":"hover:bg-gray-100"}`}>Pricing</a>
      </nav>
    </div>
  );
}

function HomePage(){
  // Input fields
  const [subject, setSubject] = useState("");
  const [action, setAction] = useState("");
  const [environment, setEnvironment] = useState("");
  const [stylePreset, setStylePreset] = useState(STYLE_PRESETS[0].value);
  const [mood, setMood] = useState("");
  const [details, setDetails] = useState("");
  const [lens, setLens] = useState("");
  const [lighting, setLighting] = useState("");
  const [composition, setComposition] = useState("");
  const [extras, setExtras] = useState("");
  const [negative, setNegative] = useState("blurry, low-resolution, watermark, extra fingers, deformed hands");
  const [ar, setAr] = useState("16:9");
  const [quality, setQuality] = useState("high");
  const [seed, setSeed] = useState("");

  // Output box (only fills when user clicks Send)
  const [optimized, setOptimized] = useState("");
  const [copied, setCopied] = useState(false);

  const randomize = () => {
    const r = (arr)=>arr[Math.floor(Math.random()*arr.length)];
    setStylePreset(r(STYLE_PRESETS).value);
    setMood(r(MOODS));
    setLens(["24mm","35mm","50mm","85mm"][Math.floor(Math.random()*4)]);
    setLighting(r(LIGHTING));
    setComposition(r(COMPOSITIONS));
    setAr(["1:1","3:2","4:5","16:9","21:9","9:16"][Math.floor(Math.random()*6)]);
  };

const handleSend = async () => {
  try {
    // Build a minimal idea from current inputs
    const pieces = [subject, action, environment].filter(Boolean).join(", ");
    const idea = pieces || subject || "";

    // Ask the serverless optimizer (OpenAI) to expand the prompt
    const resp = await fetch('/api/optimize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idea,
        fields: { style: stylePreset, mood, lens, lighting, composition, ar }
      })
    });

    // If the API fails, fall back to the local builder
    if (!resp.ok) {
      const fallback = buildPrompt({
        subject, action, environment, stylePreset, mood, details, lens, lighting,
        composition, extras, negative, ar, quality, seed: seed === "" ? undefined : Number(seed)
      });
      setOptimized(fallback);
      return;
    }

    const data = await resp.json();
    const ai = (data && data.prompt) ? String(data.prompt) : '';
    if (ai.trim()) {
      setOptimized(ai.trim());
    } else {
      const fallback = buildPrompt({
        subject, action, environment, stylePreset, mood, details, lens, lighting,
        composition, extras, negative, ar, quality, seed: seed === "" ? undefined : Number(seed)
      });
      setOptimized(fallback);
    }
  } catch (e) {
    const fallback = buildPrompt({
      subject, action, environment, stylePreset, mood, details, lens, lighting,
      composition, extras, negative, ar, quality, seed: seed === "" ? undefined : Number(seed)
    });
    setOptimized(fallback);
  }
};

  const copy = async () => {
    try { await navigator.clipboard.writeText(optimized); setCopied(true); setTimeout(()=>setCopied(false), 1200); } catch {}
  };

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="bg-white rounded-3xl p-6 shadow-sm">
        <div className="grid md:grid-cols-2 gap-6 items-start">
          {/* INPUT (left) */}
          <div className="space-y-4">
            <h1 className="text-2xl font-semibold mb-1">Build your prompt</h1>
            <p className="text-sm text-gray-600 mb-3">Pure input → output. Fill the fields, hit Send, then copy your optimized prompt.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject (who/what)</Label>
                <Input id="subject" placeholder="transparent dental aligner on a reflective surface" value={subject} onChange={(e)=>setSubject(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="action">Action</Label>
                <Input id="action" placeholder="close-up on the front edge" value={action} onChange={(e)=>setAction(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="environment">Environment</Label>
                <Input id="environment" placeholder="studio cyclorama, clean background" value={environment} onChange={(e)=>setEnvironment(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="style">Style preset</Label>
                <Select id="style" value={stylePreset} onChange={setStylePreset} options={STYLE_PRESETS.map(p=>({label:p.label, value:p.value}))} />
              </div>
              <div>
                <Label htmlFor="mood">Mood</Label>
                <Select id="mood" value={mood} onChange={setMood} options={[{label:"—", value:""}, ...MOODS.map(m=>({label:m, value:m}))]} />
              </div>
              <div>
                <Label htmlFor="details">Extra details</Label>
                <Input id="details" placeholder="caustics, subsurface scattering, specular highlights" value={details} onChange={(e)=>setDetails(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lens">Lens</Label>
                <Input id="lens" placeholder="50mm" value={lens} onChange={(e)=>setLens(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="lighting">Lighting</Label>
                <Select id="lighting" value={lighting} onChange={setLighting} options={[{label:"—", value:""}, ...LIGHTING.map(l=>({label:l, value:l}))]} />
              </div>
              <div>
                <Label htmlFor="composition">Composition</Label>
                <Select id="composition" value={composition} onChange={setComposition} options={[{label:"—", value:""}, ...COMPOSITIONS.map(c=>({label:c, value:c}))]} />
              </div>
              <div>
                <Label htmlFor="ar">Aspect ratio</Label>
                <Select id="ar" value={ar} onChange={setAr} options={["1:1","3:2","4:5","16:9","21:9","9:16"].map(v=>({label:v, value:v}))} />
              </div>
              <div>
                <Label htmlFor="seed">Seed (optional)</Label>
                <Input id="seed" placeholder="e.g. 12345" value={seed} onChange={(e)=>setSeed(e.target.value.replace(/[^0-9-]/g, ''))} />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="negative">Negative prompt</Label>
                <Textarea id="negative" value={negative} onChange={(e)=>setNegative(e.target.value)} />
              </div>
              <div className="md:col-span-2 flex gap-2">
                <Button onClick={randomize} className="bg-white text-gray-800 border"><Shuffle size={16}/> Surprise</Button>
                <Button onClick={handleSend}><WandSparkles size={16}/> Send</Button>
              </div>
            </div>
          </div>

          {/* OUTPUT (right) */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Optimized Prompt</h2>
            <Textarea readOnly value={optimized} className="min-h-[220px] font-mono" placeholder="Your prompt will appear here after you click Send." />
            <div className="flex gap-2">
              <Button onClick={copy} className="bg-white text-gray-800 border"><Copy size={16}/> {copied? "Copied" : "Copy"}</Button>
            </div>
            <p className="text-xs text-gray-500">Tip: paste the negative prompt into models that support it (e.g., Stable Diffusion variants).</p>
          </div>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="bg-white rounded-3xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">What creators say</h3>
        <div className="grid md:grid-cols-3 gap-4">
          {REVIEWS.map((r, i)=> (
            <div key={i} className="rounded-2xl border p-4">
              <div className="text-yellow-500 mb-1" aria-label={`${r.stars} stars`}>
                {Array.from({length:r.stars}).map((_,i)=> <span key={i}>★</span>)}
              </div>
              <p className="text-sm text-gray-800">“{r.quote}”</p>
              <div className="text-xs text-gray-500 mt-3">{r.name} · {r.role}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PricingPage(){
  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Choose your plan</h1>
        <p className="text-sm text-gray-600 mb-4">Start free. Upgrade when you’re ready.</p>
        <div className="grid md:grid-cols-2 gap-6">
          {PLANS.map((p)=> (
            <div key={p.name} className="rounded-3xl border p-6">
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-semibold">{p.name}</div>
                  <div className="text-sm text-gray-500">{p.tagline}</div>
                </div>
                <div className="text-2xl font-bold">{p.price}</div>
              </div>
              <ul className="mt-4 space-y-2 text-sm text-gray-700 list-disc ml-5">
                {p.features.map((f,i)=>(<li key={i}>{f}</li>))}
              </ul>
              <a href={p.cta.href} className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 text-white px-4 py-2 text-sm hover:shadow">
                {p.cta.label}
              </a>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function App(){
  const [path, navigate] = useHashRoute("#/");
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Navbar path={path} navigate={navigate} />
        {path === "#/pricing" ? <PricingPage/> : <HomePage/>}
        <footer className="text-xs text-gray-500 mt-10 text-center">© {new Date().getFullYear()} Prompt Workshop</footer>
      </div>
    </div>
  );
}
