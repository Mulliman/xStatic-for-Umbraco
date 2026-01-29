# Agent Context: xStatic for Umbraco

This file provides critical context for AI agents working on the xStatic project.

## 🚀 Project Overview
**xStatic** is a powerful Static Site Generator (SSG) extension for the [Umbraco CMS](https://umbraco.com/). It enables users to bridge the gap between dynamic content management and the performance, security, and cost benefits of static hosting.

### Key Value Proposition
- **Performance**: Static files are served instantly via CDN.
- **Security**: No database or backend exposed to the public internet.
- **Cost**: Hosting static sites is often free or extremely cheap (Netlify, GitHub Pages, Vercel).
- **Simplicity**: Users continue to use the familiar Umbraco backoffice.

---

## 🛠️ Technology Stack
- **Backend**: .NET 8.0+ / Umbraco 13/14/15+
- **Frontend**: TypeScript, Vite, Lit (for Umbraco 14+ UI)
- **Database**: Uses Umbraco's underlying database (SQL Server/SQLite) for settings storage.

---

## 📂 Codebase Map

### Core Logic (`Source/XStaticCore/`)
- `XStatic.Core`: The engine of the project. Contains `IStaticSiteGenerator`, site configuration models, and base classes for deployers.
- `XStatic.Netlify`, `XStatic.Git`, `XStatic.Ftp`: Plugin-based deployment providers.
- `XStatic.UmbracoContentApi`: Specialized generator for headless-to-static workflows.

### Umbraco Integration
- `XStatic14`: The main entry point for Umbraco 14+ support.
- `XStatic14.Client`: The modern backoffice dashboard and management UI.

### Documentation (`Docs/`)
- Refer to `Docs/*.md` for specific implementation details on Generators, Deployers, and Transformers.

---

## 🧠 Core Concepts for Agents

### 1. The Generation Pipeline
1. **Crawl/Generate**: Visit Umbraco nodes and save as static files.
2. **Transform**: Run `ITransformer` logic (e.g., path replacement, image optimization).
3. **Store**: Temporarily save files to a local staging area.
4. **Deploy**: Push files to the target `IDeployer`.
5. **Post-Action**: Execute `IAction` (e.g., clear Cloudflare cache).

### 2. Frontend Modernization
The project is transitioning to the Umbraco 14+ "Bellissima" UI. Most new UI work happens in `Source/XStaticCore/XStatic14/XStatic14.Client` using TypeScript and Web Components.

---

## 📝 Guidelines for Future Prompts
- **Backward Compatibility**: Ensure changes respect previous Umbraco versions where shared code is used.
- **Extensibility**: Follow the `IPlugin`-style architecture for new deployers or generators.
- **UI Consistency**: Use Umbraco's UI Library (`uui`) components for backoffice work.
