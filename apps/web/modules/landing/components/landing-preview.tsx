import { formatCents } from "@/shared/lib/money";
import {
  LANDING_PREVIEW_BODY,
  LANDING_PREVIEW_CAPTION,
  LANDING_PREVIEW_CURRENCY,
  LANDING_PREVIEW_DAILY_CENTS,
  LANDING_PREVIEW_DAYS_REMAINING,
  LANDING_PREVIEW_ENVELOPES,
  LANDING_PREVIEW_LABEL,
  LANDING_PREVIEW_STATUS,
} from "../constants";

const dailyAmount = formatCents(LANDING_PREVIEW_DAILY_CENTS, {
  currency: LANDING_PREVIEW_CURRENCY,
});

export function LandingPreview() {
  return (
    <figure
      aria-label={`${LANDING_PREVIEW_CAPTION} ${LANDING_PREVIEW_LABEL}: ${dailyAmount}.`}
      className="mx-auto w-full max-w-lg lg:max-w-none"
    >
      <div className="rounded-[18px] border border-line/80 bg-surface p-2.5 shadow-[0_26px_60px_-30px_rgba(35,32,28,0.42)] sm:p-3">
        <div className="rounded-xl border border-line/70 bg-linear-to-tr from-qp-gradient to-qp-gradient/10 p-4 sm:p-6">
          <div className="mb-1.5 flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-qp" aria-hidden />
            <p className="font-mono text-[10px] uppercase tracking-widest text-qp-deep sm:text-[11px]">
              {LANDING_PREVIEW_LABEL}
            </p>
          </div>
          <p className="font-serif text-[40px] font-medium leading-none tracking-[-0.02em] text-ink sm:text-[52px]">
            {dailyAmount}
          </p>
          <p className="mt-2.5 max-w-sm text-[13px] leading-snug text-ink-secondary sm:text-[14.5px]">
            {LANDING_PREVIEW_BODY}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-[12.5px] text-ink-secondary">
              {LANDING_PREVIEW_DAYS_REMAINING} días restantes
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-qp-border bg-qp-soft px-2.5 py-1 text-[12px] font-semibold text-qp-deep">
              <span className="size-1.5 rounded-full bg-qp" aria-hidden />
              {LANDING_PREVIEW_STATUS}
            </span>
          </div>
          <div
            className="mt-2.5 h-1.5 overflow-hidden rounded-[4px] bg-qp-track"
            aria-hidden
          >
            <div className="h-full w-[40%] rounded-[4px] bg-qp" />
          </div>
        </div>

        <div className="mt-2.5 grid gap-2 sm:grid-cols-3 sm:gap-2.5">
          {LANDING_PREVIEW_ENVELOPES.map((envelope) => (
            <article
              key={envelope.type}
              className="rounded-xl border border-line/70 bg-card p-3 sm:p-3.5"
            >
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${envelope.dotClass}`}
                  aria-hidden
                />
                <p className="text-[13px] font-semibold text-ink">
                  {envelope.label}
                </p>
              </div>
              <p className="font-serif text-[19px] text-ink sm:text-xl">
                {formatCents(envelope.remainingCents, {
                  currency: LANDING_PREVIEW_CURRENCY,
                })}
              </p>
              <p className="mt-1 text-[11.5px] text-mute">
                {envelope.subcopy} de{" "}
                {formatCents(envelope.allocatedCents, {
                  currency: LANDING_PREVIEW_CURRENCY,
                })}
              </p>
              <div
                className="mt-2.5 h-1.5 overflow-hidden rounded-[4px] bg-qp-track"
                aria-hidden
              >
                <div
                  className={`h-full rounded-[4px] ${envelope.barClass}`}
                  style={{ width: `${envelope.percent}%` }}
                />
              </div>
            </article>
          ))}
        </div>
      </div>
      <figcaption className="mt-3 text-center text-[12.5px] text-mute lg:text-left">
        {LANDING_PREVIEW_CAPTION}
      </figcaption>
    </figure>
  );
}
