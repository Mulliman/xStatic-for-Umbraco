# ⚡ xStatic for Umbraco

[![Umbraco](https://img.shields.io/badge/Umbraco-13%2B-blue.svg)](https://umbraco.com)
[![NuGet](https://img.shields.io/nuget/v/xstatic.svg)](https://www.nuget.org/packages/xstatic/)

**xStatic** is the ultimate static site generator for Umbraco. It allows you to transform your dynamic Umbraco site into a blazing-fast, ultra-secure static website that can be hosted anywhere for pennies.

---

## ✨ Key Features

- **🚀 Instant Generation**: High-performance crawling and generation of your Umbraco content.
- **🌐 Multi-Platform Deployment**: Direct deployment to **Netlify**, **GitHub**, **GitLab**, **Azure DevOps**, **FTP**, and more.
- **🖼️ Image Optimization**: Built-in support for optimizing images as part of the generation process.
- **🔄 Flexible Transformers**: Automatically handle URL rewriting and content adjustments for static environments.
- **🛠️ Extensible Architecture**: Easily build your own custom Generators, Deployers, and Post-generation Actions.
- **📦 Headless Support**: Export your content as static JSON with the built-in JSON generator.

---

## 🛠️ Getting Started

For **Umbraco 13+**, getting started is as simple as installing the NuGet package:

```bash
dotnet add package xstatic
```

Once installed, restart your Umbraco site. You will find a new **xStatic** section in the Umbraco backoffice where you can configure your first static site.

---

## 📖 Documentation

The full documentation is at **[mulliman.github.io/xStatic-for-Umbraco](https://mulliman.github.io/xStatic-for-Umbraco/)**.
It is built from the [`Wiki/`](Wiki) folder of this repository, so corrections are welcome as pull requests.

- [Extending xStatic](https://mulliman.github.io/xStatic-for-Umbraco/Extending-xStatic)
- [Post-generation actions](https://mulliman.github.io/xStatic-for-Umbraco/Post-Generation-Actions)
- [Deployment targets](https://mulliman.github.io/xStatic-for-Umbraco/Deployment-Targets)
- [xStatic MCP Server (`xstatic-mcp`)](Source/xstatic-mcp/README.md) — Official Model Context Protocol server for Umbraco 17+
- [xStatic Agent Skill (`SKILL.md`)](.agents/skills/xstatic-umbraco/SKILL.md) — Guidance for coding agents building xStatic v17+ extensions

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for instructions on setting up test instances and running automated tests.

For AI contributions and development context, see our [Agents.md](Agents.md) file.

---

## 🔒 Security

Found a security problem? Please don't open a public issue. Report it privately through [Report a vulnerability](https://github.com/Mulliman/xStatic-for-Umbraco/security/advisories/new). [SECURITY.md](SECURITY.md) lists the supported versions and what happens after you report.

## 📄 License & Support

xStatic is open source under the [MIT licence](LICENSE).

xStatic is an open-source project. For more information on why it could be of use to you, please visit [sammullins.co.uk](https://www.sammullins.co.uk/software/xstatic-for-umbraco/).
