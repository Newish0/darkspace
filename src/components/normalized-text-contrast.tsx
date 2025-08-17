import { Component, createEffect, createSignal, onMount, ParentProps } from "solid-js";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from "~/components/ui/context-menu";
import { Button } from "./ui/button";
import { ContrastIcon } from "lucide-solid";

interface ContrastOptions {
    minContrastRatio?: number; // WCAG AA standard is 4.5, AAA is 7
    preserveHue?: boolean; // Whether to preserve original color hue
    debugMode?: boolean; // Log adjustments for debugging
}

/**
 * Normalizes text contrast in HTML content while preserving original styling intent
 * @param element - The HTML element containing user-generated content
 * @param options - Configuration options for contrast normalization
 */
function normalizeContentContrast(element: HTMLElement, options: ContrastOptions = {}): void {
    const { minContrastRatio = 4.5, preserveHue = true, debugMode = false } = options;

    // Get the effective background color by traversing up the DOM
    function getEffectiveBackgroundColor(el: HTMLElement): string {
        let currentEl: HTMLElement | null = el;

        while (currentEl) {
            const computed = getComputedStyle(currentEl);
            const bgColor = computed.backgroundColor;

            // If we find a non-transparent background, use it
            if (bgColor && bgColor !== "rgba(0, 0, 0, 0)" && bgColor !== "transparent") {
                return bgColor;
            }

            currentEl = currentEl.parentElement;
        }

        // Default to white if no background found (light theme assumption)
        // In practice, you might want to detect system theme
        return getComputedStyle(document.body).backgroundColor || "#ffffff";
    }

    // Convert any color format to RGB values
    function parseColor(color: string): [number, number, number] {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return [r, g, b];
    }

    // Calculate relative luminance according to WCAG guidelines
    function getLuminance(r: number, g: number, b: number): number {
        const [rs, gs, bs] = [r, g, b].map((c) => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    // Calculate contrast ratio between two colors
    function getContrastRatio(
        color1: [number, number, number],
        color2: [number, number, number]
    ): number {
        const lum1 = getLuminance(...color1);
        const lum2 = getLuminance(...color2);
        const lighter = Math.max(lum1, lum2);
        const darker = Math.min(lum1, lum2);
        return (lighter + 0.05) / (darker + 0.05);
    }

    // Convert RGB to HSL for hue preservation
    function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
        r /= 255;
        g /= 255;
        b /= 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h = 0,
            s = 0,
            l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r:
                    h = (g - b) / d + (g < b ? 6 : 0);
                    break;
                case g:
                    h = (b - r) / d + 2;
                    break;
                case b:
                    h = (r - g) / d + 4;
                    break;
            }
            h /= 6;
        }
        return [h * 360, s * 100, l * 100];
    }

    // Convert HSL back to RGB
    function hslToRgb(h: number, s: number, l: number): [number, number, number] {
        h /= 360;
        s /= 100;
        l /= 100;
        const hue2rgb = (p: number, q: number, t: number) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };

        if (s === 0) {
            const gray = Math.round(l * 255);
            return [gray, gray, gray];
        }

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        const r = hue2rgb(p, q, h + 1 / 3);
        const g = hue2rgb(p, q, h);
        const b = hue2rgb(p, q, h - 1 / 3);

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    // Adjust color to meet contrast requirements
    function adjustColorContrast(
        textColor: [number, number, number],
        bgColor: [number, number, number],
        targetRatio: number
    ): [number, number, number] {
        const currentRatio = getContrastRatio(textColor, bgColor);

        if (currentRatio >= targetRatio) {
            return textColor; // Already sufficient contrast
        }

        if (preserveHue) {
            // Preserve hue, adjust lightness
            const [h, s, l] = rgbToHsl(...textColor);
            const bgLuminance = getLuminance(...bgColor);

            // Determine if we should go lighter or darker
            const shouldBeLighter = bgLuminance < 0.5;

            // Binary search for the right lightness value
            let minL = shouldBeLighter ? l : 0;
            let maxL = shouldBeLighter ? 100 : l;
            let bestL = l;

            for (let i = 0; i < 20; i++) {
                // Max iterations to prevent infinite loop
                const testL = (minL + maxL) / 2;
                const testColor = hslToRgb(h, s, testL);
                const testRatio = getContrastRatio(testColor, bgColor);

                if (testRatio >= targetRatio) {
                    bestL = testL;
                    if (shouldBeLighter) {
                        maxL = testL;
                    } else {
                        minL = testL;
                    }
                } else {
                    if (shouldBeLighter) {
                        minL = testL;
                    } else {
                        maxL = testL;
                    }
                }
            }

            return hslToRgb(h, s, bestL);
        } else {
            // Simple approach: make it black or white based on background
            const bgLuminance = getLuminance(...bgColor);
            return bgLuminance > 0.5 ? [0, 0, 0] : [255, 255, 255];
        }
    }

    // Process all text-containing elements
    function processElement(el: HTMLElement): void {
        const tagName = el.tagName.toLowerCase();

        // Skip non-text elements as specified
        if (["svg", "img", "canvas", "video", "audio", "iframe"].includes(tagName)) {
            return;
        }

        // Get the background color for this element's context
        const effectiveBgColor = parseColor(getEffectiveBackgroundColor(el));

        // Process text color if element has text content
        const computed = getComputedStyle(el);
        const textColor = computed.color;

        if (textColor && textColor !== "inherit") {
            const currentTextColor = parseColor(textColor);
            const adjustedColor = adjustColorContrast(
                currentTextColor,
                effectiveBgColor,
                minContrastRatio
            );

            // Only modify if adjustment was needed
            if (
                adjustedColor[0] !== currentTextColor[0] ||
                adjustedColor[1] !== currentTextColor[1] ||
                adjustedColor[2] !== currentTextColor[2]
            ) {
                const newColor = `rgb(${adjustedColor.join(", ")})`;
                el.style.color = newColor;

                if (debugMode) {
                    console.log(`Adjusted ${tagName} color from ${textColor} to ${newColor}`);
                }
            }
        }

        // Process background color if present
        const bgColor = computed.backgroundColor;
        if (bgColor && bgColor !== "transparent" && bgColor !== "rgba(0, 0, 0, 0)") {
            // If element has its own background, it becomes the new context for children
            // We don't need to adjust it, but children will use it as reference
        }

        // Recursively process children
        Array.from(el.children).forEach((child) => {
            if (child instanceof HTMLElement) {
                processElement(child);
            }
        });
    }

    // Start processing from the root element
    processElement(element);

    if (debugMode) {
        console.log("Contrast normalization completed");
    }
}

const NormalizedTextContrast: Component<ParentProps> = (props) => {
    let container!: HTMLDivElement;

    createEffect(() => {
        normalizeContentContrast(container, {
            preserveHue: true,
            minContrastRatio: 5,
        });
    });

    return <div ref={container}>{props.children}</div>;
};

export default NormalizedTextContrast;
