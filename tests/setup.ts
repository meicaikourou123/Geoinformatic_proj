// ----------------------
// 1. Fix TextEncoder / TextDecoder
// ----------------------
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from "util";
import { vi } from "vitest";
vi.mock("naive-ui", () => {
    return {
        NButton: {
            name: "NButton",
            template: `<button><slot /></button>`
        },
        NTooltip: {
            name: "NTooltip",
            template: `<div><slot /></div>`
        }
    };
});
// Mock Nuxt composables (global)
globalThis.useState = (key, init) => ({
    value: init ? init() : null,
});

globalThis.useRouter = () => ({
    push: vi.fn(),
});

// 可选：防止 runtimeConfig 报错
globalThis.useRuntimeConfig = () => ({});
globalThis.TextEncoder = NodeTextEncoder;
globalThis.TextDecoder = NodeTextDecoder;

// ----------------------
// 2. Fix Buffer
// ----------------------
import { Buffer } from "buffer";
globalThis.Buffer = Buffer;

// ----------------------
// 3. Prevent <style> injection crash
// ----------------------
if (typeof window !== "undefined") {
    const originalAppendChild = window.HTMLElement.prototype.appendChild;
    window.HTMLElement.prototype.appendChild = function (child) {
        if (child.tagName === "STYLE") return child;
        return originalAppendChild.call(this, child);
    };
}

// ----------------------
// 4. Mock ResizeObserver
// ----------------------
global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
};

// ----------------------
// 5. Mock Nuxt internal (#app) globally
//    NOTE: This works together with alias "#app"
// ----------------------
import { vi } from "vitest";
vi.mock("#app", () => ({
    useRouter: () => ({ push: vi.fn() }),
    useState: (key, init) => ({ value: init ? init() : null }),
    useRuntimeConfig: () => ({}),
}));