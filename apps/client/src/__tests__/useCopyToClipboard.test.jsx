/**
 * Tests for useCopyToClipboard hook
 */

import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

// Mock toast
vi.mock("../lib/toast", () => ({
    showToast: vi.fn(),
}));

import { showToast } from "../lib/toast";

describe("useCopyToClipboard", () => {
    const originalNavigator = { ...navigator };
    const originalLocation = { ...window.location };

    beforeEach(() => {
        vi.clearAllMocks();

        // Mock location
        delete window.location;
        window.location = { origin: "https://example.com" };

        // Mock clipboard API
        Object.defineProperty(navigator, "clipboard", {
            value: {
                writeText: vi.fn().mockResolvedValue(undefined),
            },
            writable: true,
            configurable: true,
        });

        // Mock isSecureContext
        Object.defineProperty(window, "isSecureContext", {
            value: true,
            writable: true,
            configurable: true,
        });

        // Default: desktop user agent (no share API)
        Object.defineProperty(navigator, "userAgent", {
            value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            writable: true,
            configurable: true,
        });

        // No share API by default
        Object.defineProperty(navigator, "share", {
            value: undefined,
            writable: true,
            configurable: true,
        });
    });

    afterEach(() => {
        Object.defineProperty(navigator, "userAgent", {
            value: originalNavigator.userAgent,
            writable: true,
            configurable: true,
        });
        window.location = originalLocation;
    });

    describe("isMobile detection", () => {
        test("should detect desktop correctly", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
                writable: true,
                configurable: true,
            });

            const { result } = renderHook(() => useCopyToClipboard());
            expect(result.current.isMobile).toBe(false);
        });

        test("should detect iPhone as mobile", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0)",
                writable: true,
                configurable: true,
            });

            const { result } = renderHook(() => useCopyToClipboard());
            expect(result.current.isMobile).toBe(true);
        });

        test("should detect Android as mobile", () => {
            Object.defineProperty(navigator, "userAgent", {
                value: "Mozilla/5.0 (Linux; Android 10)",
                writable: true,
                configurable: true,
            });

            const { result } = renderHook(() => useCopyToClipboard());
            expect(result.current.isMobile).toBe(true);
        });
    });

    describe("copyLink", () => {
        test("should return copyLink function", () => {
            const { result } = renderHook(() => useCopyToClipboard());
            expect(typeof result.current.copyLink).toBe("function");
        });

        test("should copy link to clipboard on desktop", async () => {
            const { result } = renderHook(() => useCopyToClipboard());

            await act(async () => {
                await result.current.copyLink("ABC12");
            });

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
                "https://example.com?gameId=ABC12"
            );
            expect(showToast).toHaveBeenCalledWith("Enlace copiado");
        });

        test("should do nothing if gameId is empty", async () => {
            const { result } = renderHook(() => useCopyToClipboard());

            await act(async () => {
                await result.current.copyLink("");
            });

            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
        });

        test("should do nothing if gameId is null", async () => {
            const { result } = renderHook(() => useCopyToClipboard());

            await act(async () => {
                await result.current.copyLink(null);
            });

            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
        });
    });

    describe("copyGameCode", () => {
        test("should return copyGameCode function", () => {
            const { result } = renderHook(() => useCopyToClipboard());
            expect(typeof result.current.copyGameCode).toBe("function");
        });

        test("should copy game code to clipboard on desktop", async () => {
            const { result } = renderHook(() => useCopyToClipboard());

            await act(async () => {
                await result.current.copyGameCode("ABC12");
            });

            expect(navigator.clipboard.writeText).toHaveBeenCalledWith("ABC12");
            expect(showToast).toHaveBeenCalledWith("Código copiado");
        });

        test("should do nothing if gameId is empty", async () => {
            const { result } = renderHook(() => useCopyToClipboard());

            await act(async () => {
                await result.current.copyGameCode("");
            });

            expect(navigator.clipboard.writeText).not.toHaveBeenCalled();
        });
    });
});
