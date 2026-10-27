"use client";

import { useState } from "react";

type Props = {
  text: string;
};

export default function SpeakButton({ text }: Props) {
  const [speaking, setSpeaking] = useState(false);

  function speak() {
    if (typeof window === "undefined") return;
    if (!("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    utterance.lang = "de-DE";
    utterance.rate = 0.85;
    utterance.pitch = 1;

    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }

  return (
    <button
      type="button"
      onClick={speak}
      className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-3 py-2 text-sm text-violet-300 transition hover:bg-violet-500/20"
    >
      {speaking ? "🔊 Playing..." : "🔊 Listen"}
    </button>
  );
}