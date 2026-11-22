"use client";
import * as React from "react";

/** Pick the best available French voice (fr-FR preferred, natural/neural voices first). */
function pickVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const fr = voices.filter((v) => v.lang?.toLowerCase().startsWith("fr"));
  if (!fr.length) return null;
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase() === "fr-fr" ? 4 : 0) + (/natural|neural|premium|enhanced|google/i.test(v.name) ? 2 : 0) + (v.localService ? 1 : 0);
  return [...fr].sort((a, b) => score(b) - score(a))[0];
}

export function useSpeech(defaultRate = 0.9) {
  const [supported, setSupported] = React.useState(false);
  const [voice, setVoice] = React.useState<SpeechSynthesisVoice | null>(null);
  const [speaking, setSpeaking] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    setSupported(true);
    const load = () => setVoice(pickVoice(window.speechSynthesis.getVoices()));
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", load);
      window.speechSynthesis.cancel();
    };
  }, []);

  const speak = React.useCallback((text: string, rate = defaultRate) => {
    if (!supported || !text) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/___/g, "…"));
    u.lang = "fr-FR";
    if (voice) u.voice = voice;
    u.rate = rate;
    u.onstart = () => setSpeaking(true);
    u.onend = u.onerror = () => setSpeaking(false);
    synth.speak(u);
  }, [supported, voice, defaultRate]);

  const stop = React.useCallback(() => { if (supported) window.speechSynthesis.cancel(); setSpeaking(false); }, [supported]);

  return { supported, hasFrenchVoice: !!voice, speak, stop, speaking };
}

/** Browser speech recognition (Chrome/Edge/Safari) for optional spoken answers. */
export function useSpeechInput(onResult: (text: string) => void) {
  const [supported, setSupported] = React.useState(false);
  const [listening, setListening] = React.useState(false);
  const recRef = React.useRef<{ start(): void; stop(): void; abort(): void } | null>(null);
  const cb = React.useRef(onResult);
  cb.current = onResult;

  React.useEffect(() => {
    const w = window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    setSupported(true);
    const rec = new Ctor() as {
      lang: string; interimResults: boolean; maxAlternatives: number;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void; onerror: () => void; start(): void; stop(): void; abort(): void;
    };
    rec.lang = "fr-FR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => cb.current(e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => rec.abort();
  }, []);

  const toggle = React.useCallback(() => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); setListening(false); }
    else { try { recRef.current.start(); setListening(true); } catch { setListening(false); } }
  }, [listening]);

  return { supported, listening, toggle };
}
