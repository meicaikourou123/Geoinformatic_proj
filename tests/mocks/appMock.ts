import { vi } from "vitest";

export const useRouter = () => ({
    push: vi.fn(),
});

export const useState = (key, init) => ({
    value: init ? init() : null,
});

export const useRuntimeConfig = () => ({});