"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// --- Hymn data: lyrics + timestamps (seconds) ---
// Replace the "start" values with timings captured below
const hymn = {
  number: 178,
  title: "Simanekeni Karunga",
  audio: "/hymn_178.mp3", // put your recording in public/
  lines: [
    { text: "Simanekeni Karunga, Tate hetu homeguru,", start: 0.0 },
    { text: "kareni omohokwe he, Uhareni mombiri.", start: 4.2 },
    { text: "Ngwee omunamwenyo ngu wa pwa tatu ku inyongamene,", start: 9.5 },
    { text: "atu ku amberere wo morwehadhimo ryoye.", start: 14.8 },
    { text: "Onzigona haKarunga t'umbata eendjo dhuuyuni,", start: 20.1 },
    { text: "nondjerera siroshenda Jesus edhina ryohe.", start: 25.4 },
    { text: "Mwene gwetu Karunga omupopiri gwaantu ngwee,", start: 30.7 },
    { text: "Mona gwaKarunga She one yaari mOmbepo.", start: 36.0 },
    { text: "Omukuriri Jesus Ngwee, omiindiro ga uva", start: 41.3 },
    { text: "twega tuma okungwee Mwene Jesus ira ngaa.", start: 46.6 },
  ],
};

export default function HymnPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // --- Timestamp capture state ---
  const [captureMode, setCaptureMode] = useState(false);
  const [captured, setCaptured] = useState<number[] | null>(null);
  const [captureIndex, setCaptureIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Sync loop: every frame, find which line is active
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const tick = () => {
      setCurrentTime(audio.currentTime);
      if (!audio.paused) requestAnimationFrame(tick);
    };

    const onPlay = () => {
      setIsPlaying(true);
      requestAnimationFrame(tick);
    };
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  // Apply playback speed (beginner mode: 0.5x)
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  // Keyboard handler: press Space to mark a line start in capture mode
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!captureMode || !audioRef.current) return;
      if (e.code === "Space") {
        e.preventDefault();
        const t = audioRef.current.currentTime;
        setCaptured((prev) => {
          const next = [...(prev ?? [])];
          next[captureIndex] = Math.round(t * 10) / 10;
          return next;
        });
        setCaptureIndex((i) => Math.min(i + 1, hymn.lines.length - 1));
      }
      if (e.code === "ArrowRight" && audioRef.current) {
        audioRef.current.currentTime += 2;
      }
      if (e.code === "ArrowLeft" && audioRef.current) {
        audioRef.current.currentTime -= 2;
      }
    },
    [captureMode, captureIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const startCapture = () => {
    setCaptureMode(true);
    setCaptured(new Array(hymn.lines.length).fill(null));
    setCaptureIndex(0);
    audioRef.current?.play();
  };

  const finishCapture = () => {
    setCaptureMode(false);
    audioRef.current?.pause();
  };

  const copyTimestamps = () => {
    if (!captured) return;
    const json = hymn.lines
      .map((line, i) => `    { text: "${line.text}", start: ${captured[i] ?? 0} },`)
      .join("\n");
    navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeIndex = hymn.lines.findLastIndex(
    (line) => line.start <= currentTime
  );

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-1">
          {hymn.number}. {hymn.title}
        </h1>
        <p className="text-zinc-400 mb-8">Simanekeni Kalunga — interactive demo (private MVP)</p>

        <audio ref={audioRef} src={hymn.audio} preload="metadata" />

        <div className="space-y-3 mb-8">
          {hymn.lines.map((line, i) => (
            <p
              key={i}
              className={
                "text-xl leading-relaxed transition-colors " +
                (i === activeIndex
                  ? "text-amber-400 font-semibold scale-105"
                  : i < activeIndex
                  ? "text-zinc-500"
                  : "text-zinc-300")
              }
            >
              {line.text}
            </p>
          ))}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() =>
              isPlaying ? audioRef.current?.pause() : audioRef.current?.play()
            }
            className="px-6 py-3 bg-amber-500 text-black rounded-full font-bold"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>

          <button
            onClick={() => setPlaybackRate(playbackRate === 1 ? 0.5 : 1)}
            className="px-4 py-3 bg-zinc-800 rounded-full text-sm"
          >
            {playbackRate === 1 ? "Slow (0.5x)" : "Normal (1x)"}
          </button>

          <span className="text-zinc-500 text-sm ml-auto">
            {currentTime.toFixed(1)}s
          </span>
        </div>

        <hr className="border-zinc-800 my-8" />

        <div className="bg-zinc-900 rounded-xl p-6">
          <h2 className="text-lg font-bold mb-2">Timestamp Capture Tool</h2>
          <p className="text-zinc-400 text-sm mb-4">
            Play the recording, then press{" "}
            <kbd className="bg-zinc-700 px-2 py-0.5 rounded">Space</kbd> each
            time a line starts. Use arrow keys to skip 2 seconds.
          </p>

          {captureMode ? (
            <div>
              <p className="text-amber-400 font-semibold mb-2">
                Capturing line {captureIndex + 1} of {hymn.lines.length}
                {captured && captured[captureIndex] != null
                  ? ` — marked at ${captured[captureIndex]}s`
                  : ""}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={finishCapture}
                  className="px-4 py-2 bg-red-600 rounded-full text-sm font-bold"
                >
                  Stop & Review
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={startCapture}
                className="px-4 py-2 bg-amber-500 text-black rounded-full text-sm font-bold"
              >
                Start Capture
              </button>
              {captured && (
                <button
                  onClick={copyTimestamps}
                  className="px-4 py-2 bg-zinc-700 rounded-full text-sm"
                >
                  {copied ? "Copied!" : "Copy Timestamps as JSON"}
                </button>
              )}
            </div>
          )}

          {captured && !captureMode && (
            <pre className="mt-4 text-xs text-zinc-400 overflow-x-auto bg-zinc-950 p-4 rounded-lg">
{hymn.lines.map((line, i) =>
  `    { text: "${line.text}", start: ${captured[i] ?? 0} },`
).join("\n")}
            </pre>
          )}
        </div>

        <p className="text-zinc-500 text-xs mt-8">
          Private demo only. Full permission from the Archdiocese of Windhoek is required before any public use or distribution of hymn lyrics/audio.
        </p>
      </div>
    </main>
  );
}
