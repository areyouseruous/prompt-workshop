import React, { useMemo, useState } from "react";
import { Copy, Download, Shuffle, WandSparkles, Plus, Trash2 } from "lucide-react";

// Minimal in-file UI primitives (so it runs without external deps)
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
const Button = ({ children, icon:Icon, className, ...props }) => (
  <button {...props} className={`rounded-2xl px-3 py-2 text-sm font-medium shadow-sm hover:shadow transition inline-flex items-center gap-2 ${className||"bg-indigo-600 text-white"}`}>
    {Icon && <Icon size={16} />} {children}
  </button>
);
const Chip = ({ children, onRemove }) => (
  <span className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs mr-2 mb-2">
    {children}
    {onRemove && <button onClick={onRemove} className="text-gray-500 hover:text-gray-700"><Trash2 size={12} /></button>}
  </span>
);

// Presets
const STYLE_PRESETS = [
  { label: "Photorealistic", value: "photorealistic, ultra-detailed, 35mm film" },
  { label: "Cinematic", value: "cinematic lighting, shallow depth of field, anamorphic bokeh" },
  { label: "Studio Portrait", value: "studio lighting, softbox, high dynamic range, 85mm lens" },
  { label: "Watercolor", value: "delicate watercolor, soft washes, paper texture" },
  { label: "Oil Painting", value: "impasto oil painting, rich brushwork, baroque lighting" },
  { label: "Anime", value: "anime style, crisp lineart, vibrant palette" },
  { label: "Isometric", value: "isometric view, clean vector shapes" },
];

const ARTISTS = [
  "Annie Leibovitz", "Greg Rutkowski", "Claude Monet", "Studio Ghibli", "Beeple", "H.R. Giger",
];

const CAMERA_LENSES = ["24mm", "35mm", "50mm", "85mm", "135mm", "macro", "tilt-shift"];
const LIGHTING = ["golden hour", "softbox", "rim light", "volumetric", "neon", "overcast", "moonlit"];
const COMPOSITIONS = ["rule of thirds", "centered", "leading lines", "top-down", "close-up", "wide shot"]; 
const MATERIALS = ["glass", "chrome", "wood", "marble", "fabric", "smoke", "water"];
const MOODS = ["serene", "dramatic", "mysterious", "playful", "melancholic", "epic"];

function buildPrompt({subject, action, environment, stylePreset, mood, details, lens, lighting, composition, artists, materials, extras, negative, ar, quality, seed}){
  const parts = [
    subject && subject.trim(),
    action && action.trim(),
    environment && environment.trim(),
    details && details.trim(),
    materials.length ? `materials: ${materials.join(", ")}` : null,
    mood && `mood: ${mood}`,
    stylePreset && `style: ${stylePreset}`,
    lens && `lens: ${lens}`,
    lighting && `lighting: ${lighting}`,
    composition && `composition: ${composition}`,
    artists.length ? `by ${artists.join(", ")}` : null,
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

export default function App(){
  const [subject, setSubject] = useState("");
  const [action, setAction] = useState("");
  const [environment, setEnvironment] = useState("");
  const [stylePreset, setStylePreset] = useState(STYLE_PRESETS[0].value);
  const [mood, setMood] = useState("");
  const [details, setDetails] = useState("");
  const [lens, setLens] = useState("");
  const [lighting, setLighting] = useState("");
  const [composition, setComposition] = useState("");
  const [artists, setArtists] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [extras, setExtras] = useState("");
  const [negative, setNegative] = useState("blurry, low-resolution, watermark, extra fingers, deformed hands");
  const [ar, setAr] = useState("16:9");
  const [quality, setQuality] = useState("high");
  const [seed, setSeed] = useState("");

  const [customTags, setCustomTags] = useState([]);
  const [tagInput, setTagInput] = useState("");

  const prompt = useMemo(()=>buildPrompt({subject, action, environment, stylePreset, mood, details, lens, lighting, composition, artists, materials:[...materials, ...customTags], extras, negative, ar, quality, seed: seed === "" ? undefined : Number(seed)}), [subject, action, environment, stylePreset, mood, details, lens, lighting, composition, artists, materials, extras, negative, ar, quality, seed, customTags]);

  const jsonSchema = useMemo(()=>({
    subject, action, environment, details, mood,
    style: stylePreset, lens, lighting, composition,
    artists, materials: [...materials, ...customTags], extras,
    negative, params: { aspect_ratio: ar, quality, seed: seed === "" ? null : Number(seed) }
  }), [subject, action, environment, details, mood, stylePreset, lens, lighting, composition, artists, materials, extras, negative, ar, quality, seed, customTags]);

  const addArtist = (name) => setArtists(prev => Array.from(new Set([...prev, name])));
  const removeArtist = (name) => setArtists(prev => prev.filter(a => a !== name));
  const toggleList = (value, list, setList) => setList(list.includes(value) ? list.filter(v=>v!==value) : [...list, value]);

  const randomize = () => {
    const r = (arr)=>arr[Math.floor(Math.random()*arr.length)];
    setStylePreset(r(STYLE_PRESETS).value);
    setMood(r(MOODS));
    setLens(r(CAMERA_LENSES));
    setLighting(r(LIGHTING));
    setComposition(r(COMPOSITIONS));
    setAr(["1:1","3:2","4:5","16:9","21:9"][Math.floor(Math.random()*5)]);
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); alert("Copied to clipboard"); } catch {}
  }

  const download = (filename, data) => {
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Prompt Workshop</h1>
            <div className="flex gap-2">
              <Button onClick={randomize} className="bg-white text-gray-800 border" icon={Shuffle}>Surprise me</Button>
              <Button onClick={()=>copy(prompt)} icon={WandSparkles}>Copy Prompt</Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white rounded-2xl p-4 shadow-sm">
            <div>
              <Label htmlFor="subject">Subject (who/what)</Label>
              <Input id="subject" placeholder="A silver fox sitting on a vintage Vespa" value={subject} onChange={(e)=>setSubject(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="action">Action</Label>
              <Input id="action" placeholder="drinking espresso and reading a map" value={action} onChange={(e)=>setAction(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="environment">Environment</Label>
              <Input id="environment" placeholder="on a cobblestone street in Rome, early morning" value={environment} onChange={(e)=>setEnvironment(e.target.value)} />
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
              <Input id="details" placeholder="high detail, realistic textures, subtle film grain" value={details} onChange={(e)=>setDetails(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="lens">Lens</Label>
              <Select id="lens" value={lens} onChange={setLens} options={[{label:"—", value:""}, ...CAMERA_LENSES.map(l=>({label:l, value:l}))]} />
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
              <Label>Artists</Label>
              <div className="flex gap-2 mb-2">
                {ARTISTS.map(a => (
                  <Button key={a} className={`bg-white border text-gray-800 ${artists.includes(a)?"ring-2 ring-indigo-400":""}`} onClick={()=>addArtist(a)}>{a}</Button>
                ))}
              </div>
              <div className="flex flex-wrap">
                {artists.map(a => <Chip key={a} onRemove={()=>removeArtist(a)}>{a}</Chip>)}
              </div>
            </div>
            <div className="md:col-span-2">
              <Label>Materials & custom tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {MATERIALS.map(m => (
                  <Button key={m} className={`bg-white border text-gray-800 ${materials.includes(m)?"ring-2 ring-indigo-400":""}`} onClick={()=>toggleList(m, materials, setMaterials)}>{m}</Button>
                ))}
              </div>
              <div className="flex gap-2">
                <Input placeholder="Add custom tag e.g. subsurface scattering" value={tagInput} onChange={(e)=>setTagInput(e.target.value)} />
                <Button icon={Plus} className="bg-white border text-gray-800" onClick={()=>{ if(tagInput.trim()){ setCustomTags(prev=>Array.from(new Set([...prev, tagInput.trim()]))); setTagInput("");}}}>Add</Button>
              </div>
              <div className="mt-2 flex flex-wrap">
                {customTags.map(t => <Chip key={t} onRemove={()=>setCustomTags(prev=>prev.filter(x=>x!==t))}>{t}</Chip>)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-2xl p-4 shadow-sm">
            <div>
              <Label htmlFor="ar">Aspect ratio</Label>
              <Select id="ar" value={ar} onChange={setAr} options={["1:1","3:2","4:5","16:9","21:9"].map(v=>({label:v, value:v}))} />
            </div>
            <div>
              <Label htmlFor="quality">Quality</Label>
              <Select id="quality" value={quality} onChange={setQuality} options={["draft","standard","high"].map(v=>({label:v, value:v}))} />
            </div>
            <div>
              <Label htmlFor="seed">Seed (optional)</Label>
              <Input id="seed" placeholder="e.g. 12345" value={seed} onChange={(e)=>setSeed(e.target.value.replace(/[^0-9-]/g, ''))} />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="negative">Negative prompt</Label>
              <Textarea id="negative" value={negative} onChange={(e)=>setNegative(e.target.value)} />
            </div>
            <div className="md:col-span-3">
              <Label htmlFor="extras">Model-specific flags</Label>
              <Input id="extras" placeholder="e.g. --stylize 300 --cfg 6.5" value={extras} onChange={(e)=>setExtras(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Generated Prompt</h2>
              <div className="flex gap-2">
                <Button icon={Copy} className="bg-white border text-gray-800" onClick={()=>copy(prompt)}>Copy</Button>
                <Button icon={Download} className="bg-white border text-gray-800" onClick={()=>download("prompt.json", JSON.stringify(jsonSchema, null, 2))}>Export JSON</Button>
              </div>
            </div>
            <Textarea readOnly value={prompt} className="min-h-[160px] font-mono" />
            <p className="text-xs text-gray-500 mt-2">Tip: paste the "negative" field below into models that support it (e.g., Stable Diffusion variants).</p>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">Negative Prompt</h3>
            <Textarea readOnly value={negative} className="min-h-[80px] font-mono" />
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3">Quick Starters</h3>
            <div className="grid grid-cols-1 gap-2">
              {[{
                title: "Logo-in-a-circle (great for avatars)",
                fill: {
                  subject: "a clean, minimal line-art tooth logo inside a circle, centered",
                  action: "",
                  environment: "plain background, high contrast",
                  details: "vector style, crisp edges, smooth curves",
                  mood: "serene",
                  stylePreset: STYLE_PRESETS[6].value,
                  lens: "",
                  lighting: "overcast",
                  composition: "centered",
                }
              },{
                title: "Cinematic character portrait",
                fill: {
                  subject: "young woman astronaut in slightly worn suit",
                  action: "gazing toward distant nebula",
                  environment: "inside a dim spacecraft window with stars",
                  details: "subtle film grain, pores, freckles, realistic skin",
                  mood: "dramatic",
                  stylePreset: STYLE_PRESETS[1].value,
                  lens: "85mm",
                  lighting: "rim light",
                  composition: "rule of thirds",
                }
              },{
                title: "Scientific product render",
                fill: {
                  subject: "transparent dental aligner on a reflective surface",
                  action: "",
                  environment: "studio cyclorama",
                  details: "caustics, subsurface scattering, specular highlights",
                  mood: "serene",
                  stylePreset: STYLE_PRESETS[0].value,
                  lens: "50mm",
                  lighting: "softbox",
                  composition: "close-up",
                }
              }].map((q,i)=> (
                <Button key={i} className="bg-white border text-gray-800 justify-between" onClick={()=>{
                  setSubject(q.fill.subject||"");
                  setAction(q.fill.action||"");
                  setEnvironment(q.fill.environment||"");
                  setDetails(q.fill.details||"");
                  setMood(q.fill.mood||"");
                  setStylePreset(q.fill.stylePreset||STYLE_PRESETS[0].value);
                  setLens(q.fill.lens||"");
                  setLighting(q.fill.lighting||"");
                  setComposition(q.fill.composition||"");
                }}>
                  <span>{q.title}</span>
                  <WandSparkles size={16} />
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-2">How to use with common models</h3>
            <ul className="list-disc ml-5 text-sm text-gray-700 space-y-1">
              <li><strong>Stable Diffusion (WebUIs):</strong> Paste <em>Generated Prompt</em> into "Prompt" and <em>Negative Prompt</em> into its field. Map <code>--ar</code> to width/height, <code>--seed</code> to Seed.</li>
              <li><strong>Midjourney-style:</strong> Use the suffix flags as-is if your runner supports them, or remove if not.</li>
              <li><strong>DALL·E / Firefly:</strong> Use <em>Generated Prompt</em> only; ignore negative/flags.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
