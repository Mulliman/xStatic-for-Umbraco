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
- **📦 Headless Support**: Generate static sites from Umbraco Content API / Headless sources.

---

## 🛠️ Getting Started

For **Umbraco 13+**, getting started is as simple as installing the NuGet package:

```bash
dotnet add package xstatic
```

Once installed, restart your Umbraco site. You will find a new **xStatic** section in the Umbraco backoffice where you can configure your first static site.

---

## 📖 Documentation

Detailed documentation for xStatic can be found in the `/Docs` folder of this repository, or online:

- [Main Documentation](https://www.sammullins.co.uk/software/xstatic-for-umbraco/)
- [Extending xStatic](https://www.sammullins.co.uk/software/xstatic-for-umbraco/extending-xstatic/)
- [Post-Generation Actions](Docs/Actions.md)
- [How Deployment Works](Docs/Deployers.md)

---

## 🤝 Contributing

Contributions are welcome! Please see our [Contributing Guidelines](CONTRIBUTING.md) for instructions on setting up test instances and running automated tests.

For AI contributions and development context, see our [Agents.md](Agents.md) file.

---

## 📄 License & Support

xStatic is an open-source project. For more information on why it could be of use to you, please visit [sammullins.co.uk](https://www.sammullins.co.uk/software/xstatic-for-umbraco/).
