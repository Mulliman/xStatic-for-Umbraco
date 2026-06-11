import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts", // your web component source file
            name: "assets",
            fileName: "assets",
            formats: ["es"],
        },
        outDir: "../wwwroot/App_Plugins/xstatic14", 
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            external: [/^@umbraco/],
            output: {
                entryFileNames: `assets.js`,
                chunkFileNames: `[name].js`,
                assetFileNames: `[name].[ext]`,
            },
        },
    },
});