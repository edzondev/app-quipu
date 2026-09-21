import Link from "next/link";
import { QuipuLogo } from "@/shared/components/quipu-logo";
import {
  LANDING_ALLOCATION,
  LANDING_BODY,
  LANDING_ENVELOPES_BODY,
  LANDING_ENVELOPES_EYEBROW,
  LANDING_ENVELOPES_NOTE,
  LANDING_ENVELOPES_TITLE,
  LANDING_EYEBROW,
  LANDING_FOOTER_NOTE,
  LANDING_HEADER_SIGN_IN,
  LANDING_PRIMARY_CTA,
  LANDING_QUESTION,
  LANDING_RULES,
  LANDING_SIGN_IN,
  LANDING_TITLE,
} from "../constants";
import { LandingPreview } from "./landing-preview";

const primaryCtaClass =
  "inline-flex min-h-12 items-center justify-center rounded-[11px] bg-ink px-6.5 py-3.5 text-[15px] font-semibold text-canvas transition-colors hover:bg-ink/90";
const secondaryCtaClass =
  "inline-flex min-h-12 items-center justify-center rounded-[11px] px-6.5 py-3.5 text-[15px] font-semibold text-ink transition-colors hover:bg-surface-warm";

export function LandingView() {
  return (
    <div className="flex min-h-dvh flex-col bg-[radial-gradient(120%_75%_at_50%_-10%,var(--qp-selected),var(--qp-surface)_62%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 pt-7 sm:px-10 sm:pt-9">
        <QuipuLogo />
        <Link
          href="/sign-in"
          className="inline-flex min-h-11 items-center rounded-[11px] px-3 text-[14px] font-semibold text-ink transition-colors hover:bg-surface-warm"
        >
          {LANDING_HEADER_SIGN_IN}
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 sm:px-10">
        <section className="grid items-center gap-10 py-10 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:gap-16 lg:py-16">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-qp">
              {LANDING_EYEBROW}
            </p>
            <h1 className="mt-5 max-w-[16ch] text-balance font-serif text-[34px] font-medium leading-[1.08] tracking-[-0.01em] text-ink sm:text-[47px]">
              {LANDING_TITLE}
            </h1>
            <p className="mt-5 max-w-md text-[15px] leading-[1.55] text-mute sm:text-[17px]">
              {LANDING_BODY}
            </p>
            <p className="mt-5 max-w-md text-[16px] font-medium leading-snug text-qp-deep sm:text-[18px]">
              {LANDING_QUESTION}
            </p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Link href="/sign-up" className={primaryCtaClass}>
                {LANDING_PRIMARY_CTA}
              </Link>
              <Link href="/sign-in" className={secondaryCtaClass}>
                {LANDING_SIGN_IN}
              </Link>
            </div>
          </div>

          <div>
            <LandingPreview />
            <ul className="mx-auto mt-5 max-w-lg space-y-2 lg:mx-0 lg:max-w-none">
              {LANDING_RULES.map((rule) => (
                <li
                  key={rule}
                  className="flex items-start gap-2.5 text-[13.5px] leading-snug text-body"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-qp"
                    aria-hidden
                  />
                  {rule}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          aria-labelledby="landing-envelopes-heading"
          className="border-t border-line-soft py-12 sm:py-16"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-qp">
            {LANDING_ENVELOPES_EYEBROW}
          </p>
          <h2
            id="landing-envelopes-heading"
            className="mt-3 max-w-xl text-balance font-serif text-[27px] font-medium leading-tight text-ink sm:text-[33px]"
          >
            {LANDING_ENVELOPES_TITLE}
          </h2>
          <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-mute">
            {LANDING_ENVELOPES_BODY}
          </p>

          <div
            className="mt-8 flex h-3.5 overflow-hidden rounded-lg ring-1 ring-inset ring-black/5"
            aria-hidden
          >
            {LANDING_ALLOCATION.map((envelope) => (
              <div
                key={envelope.label}
                className={envelope.barColor}
                style={{ width: `${envelope.width}%` }}
              />
            ))}
          </div>

          <ul className="mt-6 grid gap-4 sm:grid-cols-3 sm:gap-8">
            {LANDING_ALLOCATION.map((envelope) => (
              <li key={envelope.label}>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-ink">
                    <span
                      className={`size-2 rounded-full ${envelope.dotClass}`}
                      aria-hidden
                    />
                    {envelope.label}
                  </span>
                  <span className="font-mono text-[12.5px] text-mute">
                    {envelope.pct}
                  </span>
                </div>
                <p className="mt-1.5 pl-4 text-[13.5px] leading-snug text-mute">
                  {envelope.desc}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[12.5px] text-faint">
            {LANDING_ENVELOPES_NOTE}
          </p>

          <div className="mt-10 flex justify-center sm:justify-start">
            <Link href="/sign-up" className={primaryCtaClass}>
              {LANDING_PRIMARY_CTA}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-line-soft">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-6 py-6 sm:flex-row sm:justify-between sm:px-10">
          <p className="text-center text-[12.5px] text-mute-subtle">
            {LANDING_FOOTER_NOTE}
          </p>
          <nav
            aria-label="Legal"
            className="flex flex-wrap justify-center gap-5 text-[12.5px] text-mute-subtle"
          >
            <Link href="/terminos" className="hover:text-body">
              Términos
            </Link>
            <Link href="/privacidad" className="hover:text-body">
              Privacidad
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
