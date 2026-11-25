# Wiki style guide

How to write pages for the xStatic wiki (`Wiki/`). It is for people and for agents. The voice follows the
original docs on sammullins.co.uk: practical, friendly and plain, with honest limitations.

## Voice

- Talk to the reader as **"you"**. Use "I" only where Sam is speaking personally (for example the history page).
  Don't use "we".
- Keep it friendly and practical. Reassure where it's true ("this only takes a few minutes"), and don't oversell.
  Say plainly what doesn't work yet, under a **Limitations** heading where there are several.
- British English: customise, organise, behaviour, colour, licence (noun), "whilst" is fine but "while" is better.
- Sentences are short to medium. One idea per sentence. Explain any term the first time you use it, or link to
  the [Glossary](../../Wiki/Glossary.md).
- Name things exactly as they appear: backoffice labels in **bold** as shown on screen, code in `backticks`.
- Don't hedge with "simply", "just", "easily" when something takes steps. Don't use emoji.

## Page shape

1. **No `#` title.** GitHub shows the file name as the page title. Start with a one or two sentence intro that
   says what the page covers and who it's for.
2. Optionally a short "At a glance" list or table for reference pages.
3. `##` sections. Procedures are numbered lists, starting each step with a verb ("Open **Sites**").
   Options, features and limitations are bullet lists.
4. End with **Next steps** or **See also** linking to related pages.

Keep each page focused. If a page passes about 400 lines, split it.

## Technical rules

- **Every fact must be true for the current code** (Umbraco 17 on `lts/17`; `master` is Umbraco 18 and `feature/19` is
  Umbraco 19, in pre-release). When behaviour differs on older versions, say which version.
- Link code with repository links such as `[RebuildProcess.cs](../Source/XStaticCore/XStatic.Core/Generator/Processes/RebuildProcess.cs)`.
  Paths start with `../` from the `Wiki/` folder; the build turns them into GitHub links.
- Link other pages as `Page-Name.md` or `Page-Name.md#anchor`. Never link without `.md`.
- Every code fence has a language (`csharp`, `json`, `powershell`, `bash`, `text`, ...).
- C# samples must compile against the current public API. Show the `using` lines when the namespace isn't obvious.
- Images go in `Wiki/images/` and are referenced as `images/name.png` with useful alt text.
- Don't copy secrets, tokens or real credentials into examples. Use obvious placeholders like `YOUR-TOKEN`.

## Checking

```powershell
node Tools/Wiki/wiki.mjs check
```

The check fails on broken page links, missing anchors, missing images, repository links to files that don't
exist, pages missing from `_Sidebar.md` and code fences without a language. CI runs it on every PR, and the docs site
(https://mulliman.github.io/xStatic-for-Umbraco/) is published from `master`.
