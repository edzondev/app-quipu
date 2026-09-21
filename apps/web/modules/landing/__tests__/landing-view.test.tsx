import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LandingView } from "../components/landing-view";
import {
  LANDING_ALLOCATION,
  LANDING_BODY,
  LANDING_ENVELOPES_TITLE,
  LANDING_FOOTER_NOTE,
  LANDING_PREVIEW_CAPTION,
  LANDING_PREVIEW_LABEL,
  LANDING_PRIMARY_CTA,
  LANDING_QUESTION,
  LANDING_RULES,
  LANDING_TITLE,
} from "../constants";

afterEach(() => {
  cleanup();
});

describe("LandingView", () => {
  it("explica qué es Quipu antes de pedir una cuenta", () => {
    render(<LandingView />);

    expect(
      screen.getByRole("heading", { level: 1, name: LANDING_TITLE }),
    ).toBeTruthy();
    expect(screen.getByText(LANDING_BODY)).toBeTruthy();
    expect(screen.getByText(LANDING_QUESTION)).toBeTruthy();
    expect(screen.getByText(LANDING_PREVIEW_LABEL)).toBeTruthy();
    expect(screen.getByText(/42\.30/)).toBeTruthy();
    expect(screen.getByText(LANDING_PREVIEW_CAPTION)).toBeTruthy();
  });

  it("muestra los tres sobres y las reglas del día", () => {
    render(<LandingView />);

    expect(
      screen.getByRole("heading", { level: 2, name: LANDING_ENVELOPES_TITLE }),
    ).toBeTruthy();

    for (const envelope of LANDING_ALLOCATION) {
      expect(screen.getAllByText(envelope.label).length).toBeGreaterThan(0);
      expect(screen.getByText(envelope.desc)).toBeTruthy();
      expect(screen.getByText(envelope.pct)).toBeTruthy();
    }

    for (const rule of LANDING_RULES) {
      expect(screen.getByText(rule)).toBeTruthy();
    }
  });

  it("lleva a registro, sesión y páginas legales", () => {
    render(<LandingView />);

    const signUpLinks = screen.getAllByRole("link", {
      name: LANDING_PRIMARY_CTA,
    });
    expect(signUpLinks).toHaveLength(2);
    expect(
      signUpLinks.every((link) => link.getAttribute("href") === "/sign-up"),
    ).toBe(true);

    const signInLinks = screen.getAllByRole("link", {
      name: /iniciar sesión|ya tengo cuenta/i,
    });
    expect(signInLinks.length).toBeGreaterThan(0);
    expect(
      signInLinks.every((link) => link.getAttribute("href") === "/sign-in"),
    ).toBe(true);

    expect(
      screen.getByRole("link", { name: "Términos" }).getAttribute("href"),
    ).toBe("/terminos");
    expect(
      screen.getByRole("link", { name: "Privacidad" }).getAttribute("href"),
    ).toBe("/privacidad");
    expect(screen.getByText(LANDING_FOOTER_NOTE)).toBeTruthy();
    expect(screen.queryByText("Tranquilidad")).toBeNull();
  });
});
