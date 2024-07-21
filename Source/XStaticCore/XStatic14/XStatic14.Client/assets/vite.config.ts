import { defineConfig } from "vite";

export default defineConfig({
    build: {
        lib: {
            entry: "src/index.ts", // your web component source file
            formats: ["es"],
        },
        outDir: "../wwwroot/App_Plugins/XStatic14", 
        emptyOutDir: true,
        sourcemap: true,
        rollupOptions: {
            external: [/^@umbraco/],
        },
    },
});