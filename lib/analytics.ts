import posthog from "posthog-js";

export const analytics = {
  capture: {
    sign_up: () => posthog.capture("sign_up"),

    onboarding_started: () => posthog.capture("onboarding_started"),

    salary_configured: (props: { mode: "dependiente" | "independiente" }) =>
      posthog.capture("salary_configured", props),

    distribution_completed: (props: { distribution_number: number }) =>
      posthog.capture("distribution_completed", props),

    modo_independiente_activated: () =>
      posthog.capture("modo_independiente_activated"),

    rescue_mode_triggered: (props: { reason: "manual" | "auto" }) =>
      posthog.capture("rescue_mode_triggered", props),

    rescue_mode_resolved: () => posthog.capture("rescue_mode_resolved"),

    app_opened: () => posthog.capture("app_opened"),
  },
};
