import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { defineConfig, type Plugin } from "vite";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../../../..");
const wikiDir = resolve(repoRoot, "Wiki");
const compilerPath = resolve(repoRoot, "Tools/Wiki/compile-client-docs.mjs");

function xstaticWikiDocsPlugin(): Plugin {
    let outDir = resolve(here, "../wwwroot/App_Plugins/xstatic14");

    async function buildBundleJson(): Promise<string | null> {
        if (!existsSync(wikiDir) || !existsSync(compilerPath)) {
            return null;
        }
        const [{ Marked }, { renderMermaidSVG }, compilerMod] = await Promise.all([
            import("marked"),
            import("beautiful-mermaid"),
            import(pathToFileURL(compilerPath).href),
        ]);
        const { bundle } = await compilerMod.compileClientDocs({ Marked, renderMermaidSVG });
        return JSON.stringify(bundle);
    }

    return {
        name: "xstatic-wiki-docs",
        configResolved(config) {
            outDir = resolve(config.root, config.build.outDir);
        },
        async closeBundle() {
            const json = await buildBundleJson();
            if (!json) return;
            const target = resolve(outDir, "docs", "docs-bundle.json");
            mkdirSync(dirname(target), { recursive: true });
            writeFileSync(target, json, "utf8");
        },
        configureServer(server) {
            server.middlewares.use("/App_Plugins/xstatic14/docs/docs-bundle.json", async (_req, res, next) => {
                try {
                    const json = await buildBundleJson();
                    if (!json) {
                        res.statusCode = 404;
                        res.end("{}");
                        return;
                    }
                    res.setHeader("Content-Type", "application/json; charset=utf-8");
                    res.end(json);
                } catch (err) {
                    next(err);
                }
            });
        },
    };
}

export default defineConfig({
    plugins: [xstaticWikiDocsPlugin()],
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
