import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AnimatedView } from "../animated-view";

function getRegion(container: HTMLElement) {
	return container.querySelector('[role="region"]');
}

function hasClass(element: Element | null, className: string) {
	return element?.className.split(/\s+/).includes(className) ?? false;
}

afterEach(() => {
	cleanup();
});

describe("AnimatedView", () => {
	it("renders children", () => {
		render(
			<AnimatedView viewKey="step-1">
				<p>Hello</p>
			</AnimatedView>,
		);
		expect(screen.getByText("Hello")).toBeTruthy();
	});

	it("applies forward direction animation classes by default", () => {
		const { container } = render(
			<AnimatedView viewKey="a">
				<span>Content</span>
			</AnimatedView>,
		);
		const region = getRegion(container);
		expect(hasClass(region, "animate-in")).toBe(true);
		expect(hasClass(region, "fade-in-0")).toBe(true);
		expect(hasClass(region, "slide-in-from-bottom-1.5")).toBe(true);
		expect(hasClass(region, "duration-200")).toBe(true);
		expect(hasClass(region, "motion-reduce:animate-none")).toBe(true);
	});

	it("applies back direction slide-from-top", () => {
		const { container } = render(
			<AnimatedView viewKey="a" direction="back">
				<span>Content</span>
			</AnimatedView>,
		);
		const region = getRegion(container);
		expect(hasClass(region, "slide-in-from-top-1.5")).toBe(true);
		expect(hasClass(region, "slide-in-from-bottom-1.5")).toBe(false);
	});

	it("remounts when viewKey changes", () => {
		const { rerender, container } = render(
			<AnimatedView viewKey="step-1">
				<span>One</span>
			</AnimatedView>,
		);
		const first = getRegion(container);
		rerender(
			<AnimatedView viewKey="step-2">
				<span>Two</span>
			</AnimatedView>,
		);
		const second = getRegion(container);
		expect(first).not.toBe(second);
		expect(screen.getByText("Two")).toBeTruthy();
	});

	it("sets aria-live when provided", () => {
		const { container } = render(
			<AnimatedView viewKey="a" aria-live="polite">
				<span>Content</span>
			</AnimatedView>,
		);
		expect(getRegion(container)?.getAttribute("aria-live")).toBe("polite");
	});

	it("focuses container on mount when focusOnMount is true", async () => {
		const { rerender } = render(
			<AnimatedView viewKey="step-1" focusOnMount>
				<span>One</span>
			</AnimatedView>,
		);

		await waitFor(() => {
			const region = document.querySelector('[role="region"]') as HTMLElement;
			expect(document.activeElement).toBe(region);
		});

		rerender(
			<AnimatedView viewKey="step-2" focusOnMount>
				<span>Two</span>
			</AnimatedView>,
		);

		await waitFor(() => {
			const region = document.querySelector('[role="region"]') as HTMLElement;
			expect(document.activeElement).toBe(region);
		});
	});

	it("includes motion-reduce class for prefers-reduced-motion CSS handling", () => {
		vi.stubGlobal(
			"matchMedia",
			vi.fn().mockImplementation((query: string) => ({
				matches: query.includes("prefers-reduced-motion"),
				media: query,
				onchange: null,
				addListener: vi.fn(),
				removeListener: vi.fn(),
				addEventListener: vi.fn(),
				removeEventListener: vi.fn(),
				dispatchEvent: vi.fn(),
			})),
		);

		const { container } = render(
			<AnimatedView viewKey="reduced">
				<span>Reduced motion</span>
			</AnimatedView>,
		);

		expect(hasClass(getRegion(container), "motion-reduce:animate-none")).toBe(true);

		vi.unstubAllGlobals();
	});
});
