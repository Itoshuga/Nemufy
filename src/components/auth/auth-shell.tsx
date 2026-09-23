import Link from "next/link";
import {
  AudioLines,
  Headphones,
  LockKeyhole,
  MoonStar,
  Play,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";

const waveformBars = Array.from({ length: 24 }, (_, index) => index);

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main id="main-content" className="auth-shell">
      <div className="auth-atmosphere" aria-hidden="true" />
      <section className="auth-story">
        <header className="auth-story-header">
          <Link href="/login" className="auth-brand" aria-label="Nemufy login">
            <span className="auth-brand-mark">
              <MoonStar className="size-4" />
            </span>
            <span className="font-display text-xl font-semibold tracking-[-.045em]">
              nemufy
            </span>
          </Link>
          <span className="auth-private-badge">
            <LockKeyhole className="size-3" /> Private by design
          </span>
        </header>

        <div className="auth-editorial">
          <p className="auth-kicker">
            <Sparkles className="size-3.5" /> A softer place to listen
          </p>
          <h1 className="auth-headline">
            Tune out.
            <br />
            <span>Tune inward.</span>
          </h1>
          <p className="auth-intro">
            Slow voices, delicate textures and quiet rituals—curated for the
            moments when the world can wait.
          </p>

          <article className="auth-listening-card" aria-hidden="true">
            <div className="auth-cover-art">
              <span className="auth-cover-orbit" />
              <MoonStar className="size-7" />
            </div>
            <div className="auth-track-copy">
              <span>Now drifting</span>
              <strong>Rain Against the Window</strong>
              <small>Mira Vale · 42 min</small>
            </div>
            <div className="auth-waveform">
              {waveformBars.map((bar) => (
                <span key={bar} />
              ))}
            </div>
            <span className="auth-preview-play">
              <Play className="size-3.5 fill-current" />
            </span>
          </article>
        </div>

        <footer className="auth-story-footer">
          <span>
            <MoonStar className="size-5" />
          </span>
          <p>
            <strong>Made for your late hours</strong>
            <small>
              <Headphones className="size-3.5" /> Headphones recommended
            </small>
          </p>
        </footer>
      </section>
      <section className="auth-form-panel">
        {children}
        <p className="auth-panel-note">
          <AudioLines className="size-3.5" /> Your listening space, always in
          sync.
        </p>
      </section>
    </main>
  );
}

export function AuthCard({
  eyebrow,
  title,
  description,
  mode,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  mode?: "login" | "register";
  children: ReactNode;
}) {
  return (
    <div className="auth-card">
      {mode ? (
        <nav className="auth-mode-switch" aria-label="Authentication options">
          <Link
            href="/login"
            aria-current={mode === "login" ? "page" : undefined}
          >
            Sign in
          </Link>
          <Link
            href="/register"
            aria-current={mode === "register" ? "page" : undefined}
          >
            Create account
          </Link>
        </nav>
      ) : null}
      <div className="auth-card-heading">
        <p className="auth-card-eyebrow">{eyebrow}</p>
        <h2 className="auth-card-title">{title}</h2>
        <p className="auth-card-description">{description}</p>
      </div>
      <div className="auth-card-content">{children}</div>
    </div>
  );
}
