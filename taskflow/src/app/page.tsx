"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";

/* ─── Animated demo conversation ─── */
const DEMO_SCRIPT: {
  direction: "out" | "in";
  text: string;
  delay: number;
}[] = [
  { direction: "out", text: "gym 6pm tomorrow", delay: 800 },
  {
    direction: "in",
    text: "✅ *gym* added!\nDue: Tomorrow 6:00 PM\nReminder: 30 min before\n\n3 tasks pending.",
    delay: 1200,
  },
  { direction: "out", text: "spent 200 swiggy", delay: 2000 },
  {
    direction: "in",
    text: "💰 ₹200 logged → food (swiggy)\nToday total: ₹450",
    delay: 1000,
  },
  { direction: "out", text: "summary", delay: 2200 },
  {
    direction: "in",
    text: "📊 *Weekly Summary*\n━━━━━━━━━━━━━━━\nTasks: 12 done · 3 pending\nSpent: ₹2,450\n\nTop spends:\n  🍔 food — ₹1,200\n  🚗 transport — ₹600\n  🛒 shopping — ₹650",
    delay: 1400,
  },
];

/* ─── Use case scenarios ─── */
const USE_CASES = [
  {
    label: "Task Management",
    icon: "📋",
    messages: [
      { dir: "out", text: "call mom after lunch" },
      { dir: "in", text: "✅ *call mom* added!\nDue: Today 1:00 PM" },
      { dir: "out", text: "pending tasks" },
      {
        dir: "in",
        text: "*Pending (3):*\n1. Call mom — 1:00 PM\n2. Buy groceries — 5:00 PM\n3. Submit report — Friday",
      },
    ],
  },
  {
    label: "Expense Tracking",
    icon: "💸",
    messages: [
      { dir: "out", text: "chai 50" },
      { dir: "in", text: "💰 ₹50 logged → food\nToday: ₹250" },
      { dir: "out", text: "aaj kitna kharcha hua?" },
      {
        dir: "in",
        text: "*Today's Expenses:*\n🍔 food — ₹250\n🚗 transport — ₹120\n\nTotal: ₹370",
      },
    ],
  },
  {
    label: "Smart Reminders",
    icon: "⏰",
    messages: [
      { dir: "in", text: "🌅 *Good morning!*\n\nToday's tasks:\n1. Team standup — 10 AM\n2. Dentist — 4 PM\n\nYesterday: ₹890 spent" },
      { dir: "out", text: "done standup" },
      { dir: "in", text: "✅ *Team standup* marked done!\n1 task remaining today." },
    ],
  },
];

/* ─── Stat counters ─── */
const STATS = [
  { value: "500M+", label: "WhatsApp users in India" },
  { value: "0", label: "Apps to download" },
  { value: "< 1s", label: "To log a task" },
  { value: "100+", label: "India merchant rules" },
];

/* ─── Markdown renderer (bold) ─── */
function renderText(text: string) {
  const parts = text.split(/(\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <strong key={i} className="font-semibold">
          {part.slice(1, -1)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
/*  LANDING PAGE                                             */
/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <Hero />
      <WhatsAppBanner />
      <StatsStrip />
      <InteractiveDemo />
      <HowItWorks />
      <Features />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ─── Navbar ─── */
function Navbar() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-surface/70 backdrop-blur-2xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white text-sm font-bold shadow-lg shadow-primary/20">
            TF
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success ring-2 ring-surface" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-tight text-foreground leading-none">
              TaskFlow
            </span>
            <span className="text-[10px] text-muted font-medium tracking-wide">
              PERSONAL ASSISTANT
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:inline-flex text-sm font-medium text-muted hover:text-foreground transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/chat"
            className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-primary-dark px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" />
            Try Live Demo
          </Link>
        </div>
      </div>
    </nav>
  );
}

/* ─── Hero with animated chat ─── */
function Hero() {
  const [visibleMessages, setVisibleMessages] = useState<number>(0);
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleMessages >= DEMO_SCRIPT.length) return;

    const next = DEMO_SCRIPT[visibleMessages];

    // Show typing for incoming messages
    if (next.direction === "in") {
      setIsTyping(true);
      const typingTimer = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages((v) => v + 1);
      }, next.delay);
      return () => clearTimeout(typingTimer);
    }

    const timer = setTimeout(() => {
      setVisibleMessages((v) => v + 1);
    }, next.delay);
    return () => clearTimeout(timer);
  }, [visibleMessages]);

  useEffect(() => {
    chatRef.current?.scrollTo({
      top: chatRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [visibleMessages, isTyping]);

  return (
    <section className="relative overflow-hidden">
      {/* Gradient mesh background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-20 lg:pt-24 lg:pb-28">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          {/* Left — Copy */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent">
              <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              ZERO SETUP · ZERO DOWNLOADS · ZERO COST
            </div>

            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
              Your entire life,
              <br />
              <span className="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
                organized in
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
                one chat.
              </span>
            </h1>

            <p className="mt-6 text-lg text-muted leading-relaxed max-w-md">
              Tasks, expenses, reminders — just text like you normally do.
              TaskFlow understands natural language, Hinglish included.
              No app. No forms. No learning curve.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                href="/chat"
                className="group inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-primary-dark px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
              >
                <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Try the Live Demo
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-semibold text-foreground hover:bg-surface-alt hover:border-primary/30 transition-all"
              >
                <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                View Dashboard
              </Link>
            </div>

            <p className="mt-5 text-xs text-muted/70">
              Free forever for personal use · No sign-up required
            </p>
          </div>

          {/* Right — Animated Chat Phone */}
          <div className="relative mx-auto w-full max-w-[340px] lg:max-w-[360px]">
            {/* Phone frame */}
            <div className="relative rounded-[2rem] border-2 border-border/80 bg-surface shadow-2xl shadow-black/10 overflow-hidden">
              {/* Notch */}
              <div className="flex justify-center pt-2 pb-0 bg-primary">
                <div className="h-1.5 w-20 rounded-full bg-white/20" />
              </div>

              {/* Chat header */}
              <div className="flex items-center gap-3 bg-primary px-4 py-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white text-sm font-bold">
                  TF
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">TaskFlow</div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-[10px] text-white/60">online</span>
                  </div>
                </div>
              </div>

              {/* Chat body */}
              <div
                ref={chatRef}
                className="flex flex-col gap-2 px-3 py-3 bg-gradient-to-b from-surface-alt/30 to-surface-alt/60 overflow-y-auto"
                style={{ height: "380px" }}
              >
                {/* Date chip */}
                <div className="flex justify-center mb-1">
                  <span className="rounded-full bg-surface-alt px-3 py-0.5 text-[10px] text-muted/70 shadow-sm">
                    Today
                  </span>
                </div>

                {DEMO_SCRIPT.slice(0, visibleMessages).map((msg, i) => (
                  <div
                    key={i}
                    className={`max-w-[82%] px-3 py-2 text-[12.5px] leading-relaxed whitespace-pre-line animate-[slideUp_0.3s_ease-out] ${
                      msg.direction === "out"
                        ? "chat-bubble-out self-end"
                        : "chat-bubble-in self-start"
                    }`}
                  >
                    {renderText(msg.text)}
                  </div>
                ))}

                {/* Typing indicator */}
                {isTyping && (
                  <div className="self-start chat-bubble-in px-4 py-2.5 animate-[slideUp_0.2s_ease-out]">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-muted/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-muted/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                )}

                {/* Replay button */}
                {visibleMessages >= DEMO_SCRIPT.length && !isTyping && (
                  <div className="flex justify-center mt-2">
                    <button
                      onClick={() => setVisibleMessages(0)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Replay demo
                    </button>
                  </div>
                )}
              </div>

              {/* Input bar (decorative) */}
              <div className="flex items-center gap-2 border-t border-border/60 bg-surface px-3 py-2.5">
                <div className="flex-1 rounded-full bg-surface-alt px-3.5 py-2 text-[11px] text-muted/50">
                  Type a message...
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </div>
              </div>

              {/* Home indicator */}
              <div className="flex justify-center py-1.5 bg-surface">
                <div className="h-1 w-24 rounded-full bg-border" />
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/15 via-primary/5 to-accent/15 blur-3xl" />

            {/* Floating badges */}
            <div className="absolute -left-8 top-16 rounded-xl border border-border bg-surface/90 backdrop-blur-sm px-3 py-2 shadow-lg animate-[float_3s_ease-in-out_infinite]">
              <div className="text-[10px] text-muted font-medium">Tasks Done</div>
              <div className="text-lg font-bold text-foreground">12<span className="text-success text-xs ml-1">↑</span></div>
            </div>
            <div className="absolute -right-6 bottom-32 rounded-xl border border-border bg-surface/90 backdrop-blur-sm px-3 py-2 shadow-lg animate-[float_3s_ease-in-out_infinite_1.5s]">
              <div className="text-[10px] text-muted font-medium">This Week</div>
              <div className="text-lg font-bold text-foreground">₹2.4k</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── WhatsApp Coming Soon Banner ─── */
function WhatsAppBanner() {
  return (
    <section className="border-y border-border bg-gradient-to-r from-[#25D366]/5 via-[#25D366]/10 to-[#25D366]/5">
      <div className="mx-auto max-w-5xl px-4 py-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366]/15">
            <svg className="h-5 w-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              WhatsApp integration coming soon
            </p>
            <p className="text-xs text-muted">
              This entire experience is being built for WhatsApp — text your tasks and expenses directly. Try the web demo now.
            </p>
          </div>
        </div>
        <Link
          href="/chat"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-4 py-2 text-xs font-semibold text-white hover:bg-[#22bf5b] transition-all shadow-sm"
        >
          Preview Demo
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

/* ─── Stats Strip ─── */
function StatsStrip() {
  return (
    <section className="border-b border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-3xl font-extrabold bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
                {s.value}
              </div>
              <div className="mt-1 text-xs text-muted font-medium uppercase tracking-wider">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Interactive Demo Section ─── */
function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-surface-alt/30 via-transparent to-surface-alt/30" />
      <div className="relative mx-auto max-w-6xl px-4 py-20 lg:py-24">
        <div className="text-center mb-12">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-bold text-primary tracking-widest uppercase">
            See it in action
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            One chat. Three superpowers.
          </h2>
          <p className="mt-3 text-muted max-w-lg mx-auto">
            No menus, no dropdowns, no learning curve. Just type what you want — TaskFlow figures out the rest.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-full border border-border bg-surface p-1 shadow-sm">
            {USE_CASES.map((uc, i) => (
              <button
                key={uc.label}
                onClick={() => setActiveTab(i)}
                className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  activeTab === i
                    ? "bg-primary text-white shadow-md shadow-primary/20"
                    : "text-muted hover:text-foreground hover:bg-surface-alt"
                }`}
              >
                <span>{uc.icon}</span>
                <span className="hidden sm:inline">{uc.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo card */}
        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-border bg-surface shadow-xl shadow-black/5 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-primary to-primary-dark px-5 py-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
                  TF
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">TaskFlow</div>
                  <div className="text-[10px] text-white/60">
                    {USE_CASES[activeTab].label} Demo
                  </div>
                </div>
              </div>
              <span className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] text-white/80 font-medium">
                Live Preview
              </span>
            </div>

            {/* Messages */}
            <div className="px-4 py-5 bg-gradient-to-b from-surface-alt/20 to-surface-alt/50 space-y-3 min-h-[260px]">
              {USE_CASES[activeTab].messages.map((msg, i) => (
                <div
                  key={`${activeTab}-${i}`}
                  className={`max-w-[80%] px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-line animate-[slideUp_0.3s_ease-out] ${
                    msg.dir === "out"
                      ? "chat-bubble-out ml-auto"
                      : "chat-bubble-in"
                  }`}
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  {renderText(msg.text)}
                </div>
              ))}
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between border-t border-border/60 bg-surface px-4 py-3">
              <p className="text-[11px] text-muted">
                ← Real responses from the TaskFlow engine
              </p>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                Try it yourself
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Just text.",
      desc: "Type naturally — \"gym 6pm\", \"spent 200 swiggy\", \"pending tasks\". No commands to memorize.",
      color: "from-primary to-teal-400",
      icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z",
    },
    {
      num: "02",
      title: "TaskFlow understands.",
      desc: "AI-powered intent parsing categorizes your message, extracts dates, amounts, merchants — instantly.",
      color: "from-accent to-orange-400",
      icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
    },
    {
      num: "03",
      title: "See the big picture.",
      desc: "Dashboard shows your tasks, spending trends, category breakdowns — all synced from your chat.",
      color: "from-violet-500 to-purple-400",
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
    },
  ];

  return (
    <section className="border-t border-border bg-surface">
      <div className="mx-auto max-w-5xl px-4 py-20 lg:py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Three steps. Thirty seconds.
          </h2>
          <p className="mt-3 text-muted">
            That&apos;s literally it. No onboarding, no tutorial, no 47-field form.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {steps.map((s) => (
            <div
              key={s.num}
              className="group relative rounded-2xl border border-border bg-background p-7 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
            >
              {/* Step number */}
              <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${s.color} text-white text-lg font-bold shadow-lg`}>
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              <div className="text-[10px] font-bold text-muted/50 tracking-widest mb-2">
                STEP {s.num}
              </div>
              <h3 className="text-xl font-bold text-foreground">{s.title}</h3>
              <p className="mt-2.5 text-sm text-muted leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Features Grid ─── */
function Features() {
  const features = [
    {
      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
      title: "Natural Language Tasks",
      desc: "\"call mom\", \"buy groceries 5pm\" — just type. No forms, no buttons, no syntax.",
      tag: "Core",
    },
    {
      icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      title: "Smart Expense Tracking",
      desc: "100+ India-specific merchant rules. Auto-categorizes swiggy, uber, bigbasket, and more.",
      tag: "Core",
    },
    {
      icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
      title: "Proactive Reminders",
      desc: "Morning briefs, upcoming task alerts, overdue nudges. TaskFlow pushes — you don't pull.",
      tag: "Smart",
    },
    {
      icon: "M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129",
      title: "Hinglish Support",
      desc: "\"kal meeting hai 3 baje\" works. Built for how 500M+ Indians actually text.",
      tag: "India",
    },
    {
      icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
      title: "Visual Dashboard",
      desc: "Charts, category breakdowns, spending trends. Chat captures — dashboard analyzes.",
      tag: "Analytics",
    },
    {
      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
      title: "Private & Secure",
      desc: "Your data stays yours. No sharing, no ads, no selling spend patterns. Ever.",
      tag: "Privacy",
    },
  ];

  const tagColors: Record<string, string> = {
    Core: "bg-primary/10 text-primary",
    Smart: "bg-accent/10 text-accent",
    India: "bg-orange-500/10 text-orange-600",
    Analytics: "bg-violet-500/10 text-violet-600",
    Privacy: "bg-emerald-500/10 text-emerald-600",
  };

  return (
    <section className="border-t border-border">
      <div className="mx-auto max-w-6xl px-4 py-20 lg:py-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
            Everything you need.
            <br />
            <span className="text-muted font-medium text-2xl sm:text-3xl">
              Nothing you don&apos;t.
            </span>
          </h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="group relative rounded-2xl border border-border bg-surface p-6 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-gradient-to-br group-hover:from-primary group-hover:to-primary-dark group-hover:text-white transition-all duration-300 shadow-sm">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                  </svg>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase ${tagColors[f.tag]}`}>
                  {f.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground">{f.title}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */
function FinalCTA() {
  return (
    <section className="relative border-t border-border overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5" />
      <div className="absolute top-0 left-1/3 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/3 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-3xl px-4 py-20 lg:py-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-primary shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          Free forever for personal use
        </div>

        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
          Stop managing.
          <br />
          <span className="bg-gradient-to-r from-primary to-teal-400 bg-clip-text text-transparent">
            Start texting.
          </span>
        </h2>

        <p className="mt-5 text-lg text-muted max-w-md mx-auto leading-relaxed">
          Your tasks, your money, your time — all managed from one conversation.
          No app fatigue. No context switching.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/chat"
            className="group inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-primary-dark px-8 py-4 text-base font-bold text-white shadow-xl shadow-primary/25 hover:shadow-2xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all duration-200"
          >
            <svg className="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Try the Live Demo
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/80 backdrop-blur-sm px-6 py-4 text-sm font-semibold text-foreground hover:bg-surface hover:border-primary/30 transition-all"
          >
            View Dashboard
          </Link>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted/60">
          <svg className="h-3.5 w-3.5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp version coming soon — same magic, right in your chats
        </div>
      </div>
    </section>
  );
}

/* ─── Footer ─── */
function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-dark text-white text-xs font-bold">
              TF
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-foreground leading-none">
                TaskFlow
              </span>
              <span className="text-[9px] text-muted">Personal Assistant</span>
            </div>
          </div>
          <p className="text-[11px] text-muted/60 text-center sm:text-right">
            Built with care in Hyderabad · Not financial advice · Illustrative
            projections only
          </p>
        </div>
      </div>
    </footer>
  );
}
