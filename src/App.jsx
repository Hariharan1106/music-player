
import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Volume2,
  VolumeX,
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Bell,
  Music2,
} from "lucide-react";

import tracksData from "./Tracks.json";

const DEFAULT_COLORS = ["#7C5CFF", "#FF8E72"];

const TRACKS = tracksData.map((t) => ({
  colors: DEFAULT_COLORS,
  ...t,
}));

const fmt = (s) =>
  Number.isFinite(s)
    ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`
    : "0:00";

const grad = ([a, b]) =>
  `linear-gradient(135deg, ${a}, ${b})`;

const Cover = ({ t, className = "" }) => (
  <div
    className={`grid place-items-center overflow-hidden ${className}`}
    style={{ background: grad(t.colors) }}
  >
    {t.image ? (
      <img
        src={t.image}
        alt={`${t.title} cover`}
        className="h-full w-full object-cover"
      />
    ) : (
      <Music2 className="h-1/3 w-1/3 text-black/30" />
    )}
  </div>
);

const PlayBtn = ({ on, onClick, className = "" }) => (
  <button
    type="button"
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    aria-label={on ? "Pause" : "Play"}
    className={`grid h-12 w-12 place-items-center rounded-full bg-[#1ed760] text-black shadow-xl transition hover:scale-105 hover:bg-[#3be477] ${className}`}
  >
    {on ? (
      <Pause size={22} fill="currentColor" />
    ) : (
      <Play size={22} fill="currentColor" className="ml-0.5" />
    )}
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
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [showLiked, setShowLiked] = useState(false);

  // Restore liked songs when the application starts.
  const [liked, setLiked] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("music-player-liked") || "{}"
      );
    } catch {
      return {};
    }
  });

  const track = TRACKS[index];

  // Save likes whenever the collection changes.
  useEffect(() => {
    localStorage.setItem(
      "music-player-liked",
      JSON.stringify(liked)
    );
  }, [liked]);

  // Handle playback when the selected track or playing state changes.
  useEffect(() => {
    const el = audio.current;

    if (!el) return;

    if (playing) {
      el.play().catch(() => setPlaying(false));
    } else {
      el.pause();
    }
  }, [playing, index]);

  // Keep the audio volume synchronized with the slider.
  useEffect(() => {
    if (audio.current) {
      audio.current.volume = volume;
    }
  }, [volume]);

  // Use the song source as its stable identifier.
  const toggleLike = (song) => {
    setLiked((prev) => ({
      ...prev,
      [song.src]: !prev[song.src],
    }));
  };

  const isLiked = (song) => Boolean(liked[song.src]);

  const pick = (i) => {
    if (i === index) {
      setPlaying((p) => !p);
    } else {
      setIndex(i);
      setPlaying(true);
    }
  };

  const go = (direction) => {
    if (TRACKS.length <= 1) {
      setPlaying(true);
      return;
    }

    setIndex((current) => {
      if (shuffle) {
        let next;

        do {
          next = Math.floor(Math.random() * TRACKS.length);
        } while (next === current);

        return next;
      }

      return (
        current + direction + TRACKS.length
      ) % TRACKS.length;
    });

    setPlaying(true);
  };

  const onEnd = () => {
    if (repeat && audio.current) {
      audio.current.currentTime = 0;
      audio.current.play().catch(() => setPlaying(false));
    } else {
      go(1);
    }
  };

  const seek = (e) => {
    const nextTime = Number(e.target.value);

    if (audio.current) {
      audio.current.currentTime = nextTime;
      setTime(nextTime);
    }
  };

  const visible = TRACKS.map((t, i) => ({ t, i })).filter(
    ({ t }) => {
      const matchesSearch = `${t.title} ${t.artist}`
        .toLowerCase()
        .includes(query.toLowerCase());

      const matchesLiked = !showLiked || isLiked(t);

      return matchesSearch && matchesLiked;
    }
  );

  const likedCount = TRACKS.filter(isLiked).length;
  const pct = duration ? (time / duration) * 100 : 0;

  const iconBtn = (active) =>
    `p-2 transition ${
      active
        ? "text-[#1ed760]"
        : "text-[#b3b3b3] hover:text-white"
    }`;

  return (
    <div className="flex h-screen flex-col bg-black font-['Inter',sans-serif] text-white">

    <audio
        ref={audio}
        src={track?.src}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
          setTime(0);
        }}
        onEnded={onEnd}
      />

      {/* Top bar */}
        <header className="grid h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-3 sm:h-16 sm:gap-4 sm:px-4">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1ed760] text-black">
          <Music2 size={20} />
        </div>

        <div className="mx-auto flex w-full max-w-xl items-center gap-2">
          <button
            type="button"
            aria-label="Home"
            onClick={() => {
              setShowLiked(false);
              setQuery("");
            }}
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#1f1f1f] hover:scale-105"
          >
            <Home size={22} />
          </button>

          <label className="flex h-12 flex-1 items-center gap-3 rounded-full bg-[#1f1f1f] px-4 hover:bg-[#2a2a2a] focus-within:ring-2 focus-within:ring-white/80">
            <Search size={20} className="text-[#b3b3b3]" />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What do you want to play?"
              className="w-full bg-transparent outline-none placeholder:text-[#b3b3b3]"
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Notifications"
            className="hidden text-[#b3b3b3] hover:text-white sm:block"
          >
            <Bell size={20} />
          </button>

          <div className="grid h-9 w-9 place-items-center rounded-full bg-orange-500 font-bold text-black">
            H
          </div>
        </div>
      </header>

      {/* Main panels */}
      <div className="grid min-h-0 flex-1 gap-2 px-2 lg:grid-cols-[300px_1fr] xl:grid-cols-[300px_1fr_340px]">
        {/* Library sidebar */}
        <aside className="hidden flex-col overflow-hidden rounded-lg bg-[#121212] lg:flex">
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <h2 className="flex items-center gap-2 font-bold text-[#b3b3b3]">
              <Library size={22} />
              <span className="text-white">Your Library</span>
            </h2>

            <button
              type="button"
              aria-label="Create"
              className="rounded-full bg-[#1f1f1f] p-2 hover:bg-[#2a2a2a]"
            >
              <Plus size={18} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowLiked((prev) => !prev)}
            aria-pressed={showLiked}
            className={`mx-3 mb-2 flex items-center gap-3 rounded-lg p-3 text-left transition ${
              showLiked
                ? "bg-[#2a2a2a]"
                : "hover:bg-[#1f1f1f]"
            }`}
          >
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-md bg-gradient-to-br from-indigo-600 to-purple-400">
              <Heart size={23} fill="white" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">Liked Songs</p>
              <p className="text-sm text-[#b3b3b3]">
                Playlist · {likedCount} songs
              </p>
            </div>
          </button>

          <div className="flex gap-2 px-4 py-2 text-sm">
            {["Playlists", "Artists", "Albums"].map((c) => (
              <span
                key={c}
                className="rounded-full bg-[#2a2a2a] px-3 py-1.5"
              >
                {c}
              </span>
            ))}
          </div>

          <ul className="flex-1 overflow-y-auto px-2 pb-2">
            {TRACKS.map((t, i) => (
              <li key={t.src}>
                <button
                  type="button"
                  onClick={() => pick(i)}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-[#1f1f1f]"
                >
                  <Cover
                    t={t}
                    className="h-12 w-12 shrink-0 rounded-md"
                  />

                  <span className="min-w-0 flex-1">
                    <span
                      className={`block truncate ${
                        i === index ? "text-[#1ed760]" : ""
                      }`}
                    >
                      {t.title}
                    </span>

                    <span className="block truncate text-sm text-[#b3b3b3]">
                      {t.artist}
                    </span>
                  </span>

                  {isLiked(t) && (
                    <Heart
                      size={15}
                      fill="#1ed760"
                      className="shrink-0 text-[#1ed760]"
                    />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Main content */}
        <main className="relative min-w-0 overflow-y-auto rounded-lg bg-[#121212]">
          <div
            className="absolute inset-x-0 top-0 h-80 transition-colors duration-700"
            style={{
              background: `linear-gradient(${track.colors[0]}88, #121212)`,
            }}
          />

          <div className="relative p-3 sm:p-5 lg:p-6">
            <div className="flex flex-wrap gap-2">
              {["All", "Music", "Podcasts"].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setFilter(c);
                    setShowLiked(false);
                  }}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                    filter === c
                      ? "bg-white text-black"
                      : "bg-white/10 hover:bg-white/20"
                  }`}
                >
                  {c}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setShowLiked((prev) => !prev)}
                aria-pressed={showLiked}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  showLiked
                    ? "bg-[#1ed760] text-black"
                    : "bg-white/10 hover:bg-white/20"
                }`}
              >
                <Heart
                  size={16}
                  fill={showLiked ? "currentColor" : "none"}
                />
                Liked Songs
              </button>
            </div>

            {showLiked && (
              <div className="mt-8 flex items-end gap-5">
                <div className="grid h-28 w-28 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-400 shadow-lg sm:h-40 sm:w-40">
                  <Heart
                    size={64}
                    fill="white"
                    className="text-white"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium">Playlist</p>
                  <h1 className="mt-2 text-3xl font-bold sm:text-5xl">
                    Liked Songs
                  </h1>
                  <p className="mt-2 text-sm text-[#b3b3b3]">
                    {likedCount} {likedCount === 1 ? "song" : "songs"}
                  </p>
                </div>
              </div>
            )}

            {/* Quick picks */}
            {!showLiked && (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {visible.slice(0, 6).map(({ t, i }) => (
                  <div
                    key={t.src}
                    onClick={() => pick(i)}
                    className="group relative flex cursor-pointer items-center gap-3 overflow-hidden rounded-md bg-white/10 pr-3 transition hover:bg-white/20"
                  >
                    <Cover
                      t={t}
                      className="h-14 w-14 shrink-0"
                    />

                    <span className="min-w-0 flex-1 truncate font-bold">
                      {t.title}
                    </span>

                    <button
                      type="button"
                      aria-label={
                        isLiked(t)
                          ? `Unlike ${t.title}`
                          : `Like ${t.title}`
                      }
                      aria-pressed={isLiked(t)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLike(t);
                      }}
                      className={`p-2 ${
                        isLiked(t)
                          ? "text-[#1ed760]"
                          : "text-white opacity-0 group-hover:opacity-100"
                      }`}
                    >
                      <Heart
                        size={18}
                        fill={isLiked(t) ? "currentColor" : "none"}
                      />
                    </button>

                    <PlayBtn
                      on={i === index && playing}
                      onClick={() => pick(i)}
                      className="!h-10 !w-10 opacity-0 group-hover:opacity-100"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Song cards */}
            <h2 className="mb-4 mt-10 text-2xl font-bold">
              {showLiked ? "Your liked tracks" : "Your top mixes"}
            </h2>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 2xl:grid-cols-5">
              {visible.map(({ t, i }) => (
                <div
                  key={t.src}
                  onClick={() => pick(i)}
                  className="group cursor-pointer rounded-lg p-3 transition hover:bg-white/10"
                >
                  <div className="relative">
                    <Cover
                      t={t}
                      className="aspect-square w-full rounded-md shadow-lg"
                    />

                    <PlayBtn
                      on={i === index && playing}
                      onClick={() => pick(i)}
                      className="absolute bottom-2 right-2 translate-y-2 opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100"
                    />

   
<button
  type="button"
  aria-label={isLiked(t) ? `Unlike ${t.title}` : `Like ${t.title}`}
  aria-pressed={isLiked(t)}
  onClick={(e) => {
    e.stopPropagation();
    toggleLike(t);
  }}
  className={`absolute left-2 top-2 rounded-full bg-black/70 p-2 transition ${
    isLiked(t)
      ? "text-[#1ed760] opacity-100"
      : "text-white opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
  }`}
>
  <Heart
    size={18}
    fill={isLiked(t) ? "currentColor" : "none"}
  />
</button>

                  </div>

                  <p className="mt-3 truncate font-bold">{t.title}</p>
                  <p className="truncate text-sm text-[#b3b3b3]">
                    {t.artist}
                  </p>
                </div>
              ))}
            </div>

            {visible.length === 0 && (
              <div className="mt-10 rounded-lg bg-white/5 p-6 text-center">
                <Heart
                  size={36}
                  className="mx-auto mb-3 text-[#b3b3b3]"
                />

                <p className="font-medium">
                  {showLiked
                    ? "Your Liked Songs collection is empty"
                    : "No matching songs found"}
                </p>

                <p className="mt-2 text-sm text-[#b3b3b3]">
                  {showLiked
                    ? "Click the heart on any song to add it to your collection."
                    : "Try searching for a different song or artist."}
                </p>

                {showLiked && (
                  <button
                    type="button"
                    onClick={() => setShowLiked(false)}
                    className="mt-4 rounded-full bg-white px-5 py-2 font-medium text-black hover:scale-105"
                  >
                    Explore songs
                  </button>
                )}
              </div>
            )}
          </div>
        </main>

        {/* Now playing sidebar */}
        <aside className="hidden overflow-y-auto rounded-lg bg-[#121212] p-4 xl:block">
          <h2 className="mb-4 font-bold">Now playing</h2>

          <Cover
            t={track}
            className="aspect-square w-full rounded-lg shadow-2xl"
          />

          <div className="mt-5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-2xl font-bold">
                {track.title}
              </p>
              <p className="truncate text-[#b3b3b3]">
                {track.artist}
              </p>
            </div>

            <button
              type="button"
              onClick={() => toggleLike(track)}
              aria-label={
                isLiked(track) ? "Unlike song" : "Like song"
              }
              aria-pressed={isLiked(track)}
              className={iconBtn(isLiked(track))}
            >
              <Heart
                fill={isLiked(track) ? "currentColor" : "none"}
              />
            </button>
          </div>

          <div
            className="mt-6 rounded-lg p-4"
            style={{ background: grad(track.colors) }}
          >
            <p className="font-bold text-black/80">About the artist</p>
            <p className="mt-1 text-sm text-black/70">
              {track.artist} makes slow, warm music for late evenings.
              Placeholder bio for your project.
            </p>
          </div>
        </aside>
      </div>

      {/* Player bar */}
     
        <footer className="grid shrink-0 grid-cols-1 items-center gap-2 px-3 py-3 md:h-20 md:grid-cols-[minmax(0,1fr)_minmax(0,600px)_minmax(0,1fr)] md:gap-4 md:px-4 md:py-0">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Cover
            t={track}
            className="h-14 w-14 shrink-0 rounded-md"
          />

          <div className="min-w-0">
            <p className="truncate font-medium">{track.title}</p>
            <p className="truncate text-sm text-[#b3b3b3]">
              {track.artist}
            </p>
          </div>

          <button
            type="button"
            onClick={() => toggleLike(track)}
            aria-label={
              isLiked(track) ? "Unlike song" : "Like song"
            }
            aria-pressed={isLiked(track)}
            className={`shrink-0 ${iconBtn(isLiked(track))}`}
          >
            <Heart
              size={18}
              fill={isLiked(track) ? "currentColor" : "none"}
            />
          </button>
        </div>

          <div className="group flex w-full min-w-0 flex-col items-center gap-1">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShuffle((prev) => !prev)}
              aria-label="Shuffle"
              aria-pressed={shuffle}
              className={iconBtn(shuffle)}
            >
              <Shuffle size={18} />
            </button>

            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous"
              className={iconBtn(false)}
            >
              <SkipBack size={20} fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={() => setPlaying((prev) => !prev)}
              aria-label={playing ? "Pause" : "Play"}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-black hover:scale-105"
            >
              {playing ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play
                  size={18}
                  fill="currentColor"
                  className="ml-0.5"
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next"
              className={iconBtn(false)}
            >
              <SkipForward size={20} fill="currentColor" />
            </button>

            <button
              type="button"
              onClick={() => setRepeat((prev) => !prev)}
              aria-label="Repeat"
              aria-pressed={repeat}
              className={iconBtn(repeat)}
            >
              <Repeat size={18} />
            </button>
          </div>

          <div className="flex w-full items-center gap-2 text-xs text-[#b3b3b3]">
            <span className="w-9 text-right tabular-nums">
              {fmt(time)}
            </span>

            <input
              type="range"
              min="0"
              max={duration || 0}
              step="0.1"
              value={time}
              onChange={seek}
              aria-label="Seek"
              className="range min-w-0 flex-1"
              style={{ "--fill": `${pct}%` }}
            />

            <span className="w-9 tabular-nums">
              {fmt(duration)}
            </span>
          </div>
        </div>

        <div className="group hidden items-center justify-end gap-2 md:flex">
          <button
            type="button"
            onClick={() => setVolume((v) => (v > 0 ? 0 : 0.7))}
            aria-label={volume > 0 ? "Mute" : "Unmute"}
            className={iconBtn(false)}
          >
            {volume > 0 ? (
              <Volume2 size={20} />
            ) : (
              <VolumeX size={20} />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Volume"
            className="range w-28"
            style={{ "--fill": `${volume * 100}%` }}
          />
        </div>
      </footer>
    </div>
  );
}
