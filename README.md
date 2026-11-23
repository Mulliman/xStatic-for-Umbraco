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

Everything is in the **[xStatic wiki](https://github.com/Mulliman/xStatic-for-Umbraco/wiki)**: installation, a first-site tutorial, every backoffice screen,
the deployers, troubleshooting and how to extend xStatic. Good places to start:

- [Installation](https://github.com/Mulliman/xStatic-for-Umbraco/wiki/Installation) and [Your first static site](https://github.com/Mulliman/xStatic-for-Umbraco/wiki/Your-First-Static-Site)
- [Deploying to Netlify](https://github.com/Mulliman/xStatic-for-Umbraco/wiki/Deploying-to-Netlify), [with Git](https://github.com/Mulliman/xStatic-for-Umbraco/wiki/Deploying-with-Git) or [to FTP](https://github.com/Mulliman/xStatic-for-Umbraco/wiki/Deploying-to-FTP)
- [Extending xStatic](https://github.com/Mulliman/xStatic-for-Umbraco/wiki/Extending-xStatic)
- [Troubleshooting](https://github.com/Mulliman/xStatic-for-Umbraco/wiki/Troubleshooting)

The wiki is written in the [`Wiki/`](Wiki) folder of this repository and published automatically, so fixes are welcome as pull requests.
- [xStatic MCP Server (`xstatic-mcp`)](Source/xstatic-mcp/README.md) — official Model Context Protocol server for xStatic
- [xStatic Agent Skill (`SKILL.md`)](.agents/skills/xstatic-umbraco/SKILL.md) — guidance for coding agents building xStatic extensions

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for instructions on setting up test instances and running automated tests.

For AI contributions and development context, see our [AGENTS.md](AGENTS.md) file.

---

## 📄 License & Support

xStatic is an open-source project. For more information on why it could be of use to you, see [What is xStatic?](https://github.com/Mulliman/xStatic-for-Umbraco/wiki/What-is-xStatic) in the wiki.
