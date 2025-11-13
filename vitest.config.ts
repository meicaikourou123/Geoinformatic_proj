import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";
import path from "path";

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            "~": path.resolve(__dirname, "./"),
            "@": path.resolve(__dirname, "./"),
            "#app": path.resolve(__dirname, "tests/mocks/appMock.ts"),
        },
    },
    test: {
        globals: true,
        environment: "jsdom",
        setupFiles: ["./tests/setup.ts"],
    },
});