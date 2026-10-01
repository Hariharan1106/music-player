import { useEffect, useRef, useState } from "react";
import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, VolumeX,
  Home, Search, Library, Plus, Heart, Bell, Music2,
} from "lucide-react";

import tracksData from "./Tracks.json";

// Songs live in src/tracks.json. `colors` is optional and falls back to a default.
const DEFAULT_COLORS = ["#7C5CFF", "#FF8E72"];
const TRACKS = tracksData.map((t) => ({ colors: DEFAULT_COLORS, ...t }));

const fmt = (s) => (isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}` : "0:00");
const grad = ([a, b]) => `linear-gradient(135deg, ${a}, ${b})`;

const Cover = ({ t, className = "" }) => (
  <div className={`grid place-items-center overflow-hidden ${className}`} style={{ background: grad(t.colors) }}>
    {t.image ? (
      <img src={t.image} alt={`${t.title} cover`} className="h-full w-full object-cover" />
    ) : (
      <Music2 className="h-1/3 w-1/3 text-black/30" />
    )}
  </div>
);

const PlayBtn = ({ on, onClick, className = "" }) => (
  <button
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    aria-label={on ? "Pause" : "Play"}
    className={`grid h-12 w-12 place-items-center rounded-full bg-[#1ed760] text-black shadow-xl transition hover:scale-105 hover:bg-[#3be477] ${className}`}
  >
    {on ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
  </button>
);

export default function App() {
  const audio = useRef(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState({});
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const track = TRACKS[index];

  useEffect(() => {
    const el = audio.current;
    if (playing) el.play().catch(() => setPlaying(false));
    else el.pause();
  }, [playing, index]);
  useEffect(() => { audio.current.volume = volume; }, [volume]);

  const pick = (i) => {
    if (i === index) setPlaying((p) => !p);
    else { setIndex(i); setPlaying(true); }
  };
  const go = (d) => {
    setIndex((i) => shuffle ? (i + 1 + Math.floor(Math.random() * (TRACKS.length - 1))) % TRACKS.length : (i + d + TRACKS.length) % TRACKS.length);
    setPlaying(true);
  };
  const onEnd = () => (repeat ? ((audio.current.currentTime = 0), audio.current.play()) : go(1));
  const seek = (e) => { audio.current.currentTime = +e.target.value; setTime(+e.target.value); };

  const visible = TRACKS.map((t, i) => ({ t, i })).filter(({ t }) =>
    (t.title + t.artist).toLowerCase().includes(query.toLowerCase()));
  const pct = duration ? (time / duration) * 100 : 0;
  const iconBtn = (on) => `p-2 transition ${on ? "text-[#1ed760]" : "text-[#b3b3b3] hover:text-white"}`;

  return (
    <div className="flex h-screen flex-col bg-black text-white font-['Inter',sans-serif]">
      <audio ref={audio} src={track.src} onTimeUpdate={(e) => setTime(e.target.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.target.duration)} onEnded={onEnd} />

      {/* Top bar */}
      <header className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4 px-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1ed760] text-black"><Music2 size={20} /></div>
        <div className="mx-auto flex w-full max-w-xl items-center gap-2">
          <button aria-label="Home" className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1f1f1f] hover:scale-105"><Home size={22} /></button>
          <label className="flex h-12 flex-1 items-center gap-3 rounded-full bg-[#1f1f1f] px-4 ring-white/80 focus-within:ring-2 hover:bg-[#2a2a2a]">
            <Search size={20} className="text-[#b3b3b3]" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you want to play?"
              className="w-full bg-transparent outline-none placeholder:text-[#b3b3b3]" />
          </label>
        </div>
        <div className="flex items-center gap-3">
          <button aria-label="Notifications" className="hidden text-[#b3b3b3] hover:text-white sm:block"><Bell size={20} /></button>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-orange-500 font-bold text-black">H</div>
        </div>
      </header>

      {/* Three panels */}
      <div className="grid min-h-0 flex-1 gap-2 px-2 lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_340px]">
        {/* Library */}
        <aside className="hidden flex-col overflow-hidden rounded-lg bg-[#121212] lg:flex">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h2 className="flex items-center gap-2 font-bold text-[#b3b3b3]"><Library size={22} /> <span className="text-white">Your Library</span></h2>
            <button aria-label="Create" className="rounded-full bg-[#1f1f1f] p-2 hover:bg-[#2a2a2a]"><Plus size={18} /></button>
          </div>
          <div className="flex gap-2 px-4 py-2 text-sm">
            {["Playlists", "Artists", "Albums"].map((c) => <span key={c} className="rounded-full bg-[#2a2a2a] px-3 py-1.5">{c}</span>)}
          </div>
          <ul className="flex-1 overflow-y-auto px-2 pb-2">
            {TRACKS.map((t, i) => (
              <li key={t.title}>
                <button onClick={() => pick(i)} className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-[#1f1f1f]">
                  <Cover t={t} className="h-12 w-12 shrink-0 rounded-md" />
                  <span className="min-w-0">
                    <span className={`block truncate ${i === index ? "text-[#1ed760]" : ""}`}>{t.title}</span>
                    <span className="block truncate text-sm text-[#b3b3b3]">Playlist • {t.artist}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main */}
        <main className="relative min-w-0 overflow-y-auto rounded-lg bg-[#121212]">
          <div className="absolute inset-x-0 top-0 h-80 transition-colors duration-700"
            style={{ background: `linear-gradient(${track.colors[0]}88, #121212)` }} />
          <div className="relative p-6">
            <div className="flex gap-2">
              {["All", "Music", "Podcasts"].map((c) => (
                <button key={c} onClick={() => setFilter(c)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${filter === c ? "bg-white text-black" : "bg-white/10 hover:bg-white/20"}`}>{c}</button>
              ))}
            </div>

            {/* Quick picks */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
              {visible.slice(0, 6).map(({ t, i }) => (
                <div key={t.title} onClick={() => pick(i)}
                  className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-md bg-white/10 pr-3 transition hover:bg-white/20">
                  <Cover t={t} className="h-14 w-14 shrink-0" />
                  <span className="min-w-0 flex-1 truncate font-bold">{t.title}</span>
                  {i === index && playing && <span className="flex h-4 items-end gap-[2px]">{[0, 1, 2].map((b) => <span key={b} className="bar w-[3px] rounded-full bg-[#1ed760]" style={{ animationDelay: `${b * 0.15}s` }} />)}</span>}
                  <PlayBtn on={i === index && playing} onClick={() => pick(i)} className="!h-10 !w-10 opacity-0 group-hover:opacity-100" />
                </div>
              ))}
            </div>
            {visible.length === 0 && <p className="mt-10 text-[#b3b3b3]">No results for “{query}”. Try a different song or artist.</p>}

            {/* Cards */}
            <h2 className="mb-4 mt-10 text-2xl font-bold">Your top mixes</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 2xl:grid-cols-5">
              {visible.map(({ t, i }) => (
                <div key={t.title} onClick={() => pick(i)} className="group cursor-pointer rounded-lg p-3 transition hover:bg-white/10">
                  <div className="relative">
                    <Cover t={t} className="aspect-square w-full rounded-md shadow-lg" />
                    <PlayBtn on={i === index && playing} onClick={() => pick(i)}
                      className="absolute bottom-2 right-2 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100" />
                  </div>
                  <p className="mt-3 truncate font-bold">{t.title}</p>
                  <p className="truncate text-sm text-[#b3b3b3]">{t.artist}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Now playing */}
        <aside className="hidden overflow-y-auto rounded-lg bg-[#121212] p-4 xl:block">
          <h2 className="mb-4 font-bold">Now playing</h2>
          <Cover t={track} className="aspect-square w-full rounded-lg shadow-2xl" />
          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold">{track.title}</p>
              <p className="truncate text-[#b3b3b3]">{track.artist}</p>
            </div>
            <button onClick={() => setLiked({ ...liked, [index]: !liked[index] })} aria-label="Like" aria-pressed={!!liked[index]}
              className={iconBtn(liked[index])}><Heart fill={liked[index] ? "currentColor" : "none"} /></button>
          </div>
          <div className="mt-6 rounded-lg p-4" style={{ background: grad(track.colors) }}>
            <p className="font-bold text-black/80">About the artist</p>
            <p className="mt-1 text-sm text-black/70">{track.artist} makes slow, warm music for late evenings. Placeholder bio for your project.</p>
          </div>
        </aside>
      </div>

      {/* Player bar */}
      <footer className="grid h-20 grid-cols-[1fr_auto] items-center gap-4 px-4 md:grid-cols-[1fr_minmax(0,600px)_1fr]">
        <div className="flex min-w-0 items-center gap-3">
          <Cover t={track} className="h-14 w-14 shrink-0 rounded-md" />
          <div className="min-w-0">
            <p className="truncate font-medium">{track.title}</p>
            <p className="truncate text-sm text-[#b3b3b3]">{track.artist}</p>
          </div>
          <button onClick={() => setLiked({ ...liked, [index]: !liked[index] })} aria-label="Like" className={`hidden sm:block ${iconBtn(liked[index])}`}>
            <Heart size={18} fill={liked[index] ? "currentColor" : "none"} />
          </button>
        </div>

        <div className="group flex flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <button onClick={() => setShuffle(!shuffle)} aria-label="Shuffle" aria-pressed={shuffle} className={iconBtn(shuffle)}><Shuffle size={18} /></button>
            <button onClick={() => go(-1)} aria-label="Previous" className={iconBtn(false)}><SkipBack size={20} fill="currentColor" /></button>
            <button onClick={() => setPlaying(!playing)} aria-label={playing ? "Pause" : "Play"}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-black hover:scale-105">
              {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={() => go(1)} aria-label="Next" className={iconBtn(false)}><SkipForward size={20} fill="currentColor" /></button>
            <button onClick={() => setRepeat(!repeat)} aria-label="Repeat" aria-pressed={repeat} className={iconBtn(repeat)}><Repeat size={18} /></button>
          </div>
          <div className="flex w-full items-center gap-2 text-xs text-[#b3b3b3]">
            <span className="w-9 text-right tabular-nums">{fmt(time)}</span>
            <input type="range" min="0" max={duration || 0} step="0.1" value={time} onChange={seek} aria-label="Seek"
              className="range flex-1" style={{ "--fill": `${pct}%` }} />
            <span className="w-9 tabular-nums">{fmt(duration)}</span>
          </div>
        </div>

        <div className="group hidden items-center justify-end gap-2 md:flex">
          <button onClick={() => setVolume(volume ? 0 : 0.7)} aria-label="Mute" className={iconBtn(false)}>
            {volume ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(+e.target.value)}
            aria-label="Volume" className="range w-28" style={{ "--fill": `${volume * 100}%` }} />
        </div>
      </footer>
    </div>
  );
}