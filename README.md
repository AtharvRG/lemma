<div align="center">

<!-- LOGO AREA -->
<img src="./Lemma-logo.jpeg" alt="Lemma Logo" width="180" />

### Lemma
<strong>Step through your code like a movie — a time-travel debugger that lives in a link.</strong>

[Live Site](https://lemma-anchor.vercel.app/) · [How It Works](#-inside-the-browser-how-it-works) · [FAQ](#-faq) · MIT

<br/>

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![Client-Side Only](https://img.shields.io/badge/Data-Stays%20Local-success)


</div>

## ✨ Overview
Lemma is a zero-installation time-travel debugger for JavaScript, Python, Go, Rust, and C++ that runs entirely in your browser. Write or paste code, click "Record," and get a scrubbable timeline of your program's execution. Inspect variable states, explore syntax trees, and then share the entire interactive session as a single, self-contained URL.

Why? To make debugging, teaching, and understanding code visual, intuitive, and instantly shareable.

## 🧭 Core User Flow
1. Open the [Lab](https://lemma-anchor.vercel.app/lab) and select a language.
2. Write or paste your code into the Monaco-powered editor.
3. Click **Record**.
   - For JavaScript, the code executes, and a timeline is generated from every `console.log()` snapshot.
   - For other languages, the code is parsed, and an AST is generated with linting feedback.
4. Drag the timeline scrubber to travel through time, watching variables change in the side panel.
5. Click **Share** → a compressed hash (`#h:...`) appears in the URL bar.
6. Copy the URL and send it to someone. When they open it, the exact debugging session is reconstructed in their browser.
7. (Optional) Shorten the link using the Supabase-powered shortener.

## 🪄 What Makes It Different
- **True Time-Travel (for JS):** It's not a simulation. Scrubbing the timeline shows the actual state of all global variables at that specific point in execution.
- **WASM-Powered Core:** The JS VM (`quickjs-emscripten`), the multi-language parser (`web-tree-sitter`), and the linter all run as WebAssembly, making analysis fast and entirely client-side.
- **Privacy by Default:** Your code is never sent to a server. Execution, parsing, and sharing via URL hash all happen locally. Nothing leaves your device unless you explicitly create a short link.
- **Frictionless Sharing:** No sign-ups, no accounts, no backends. Just copy the URL.

## 🔗 URL Anatomy
```
https://lemma-anchor.vercel.app/lab#h:<base64-gzipped-project-state>
                                     │
                                     └─ starts with h: (hash).

https://lemma-anchor.vercel.app/s/<nanoid>
                                 │
                                 └─ starts with s: (short link).
```

Short link flow:
```
/s/XYZ123  --(Next.js Middleware)-->  [Fetches from Supabase]  --(302 Redirect)-->  /lab#h:<veryLongPayload>
```

## 🧪 Inside the Browser (How It Works)
1. The project state (code, language) is serialized to a JSON string.
2. The string is compressed using `pako` (Gzip).
3. The compressed bytes are Base64 encoded and placed in the URL fragment after `#h:`.
4. On page load, the process is reversed: the hash is read, decoded, decompressed, and used to hydrate the application's state.
5. **JS Execution:** The code runs in a QuickJS VM. A custom `console.log` function is injected, which captures a snapshot of the VM's entire global scope at that moment, creating a "step" on the timeline.
6. **AST Parsing:** For other languages, Tree-sitter WASM parsers generate a syntax tree, which is then analyzed by a lightweight linter.

## 🧱 Main UI Elements
| Area | Purpose |
| --- | --- |
| Code Strip | Monaco editor with language selection and Vim mode toggle. |
| Timeline Strip | A scrubbable timeline with ticks for each execution step and badges for linter issues. |
| Variables Strip | For JS: a live view of the global scope, with changed values highlighted. For others: an AST explorer. |
| Toolbar | Main controls: Record, Stop, Reset, and Share. |
| Share Dialog | Generates the shareable link, provides a Supabase shortener, and offers a Markdown badge. |

## 🧠 Supported Languages
- **Execution & Time-Travel**: JavaScript / TypeScript
- **AST Parsing & Linting**: Python, Go, Rust, C++

## ➕ Adding Another Language (Parsing)
To add static analysis for a new language, you would need to:
1. Obtain a pre-compiled `tree-sitter-<lang>.wasm` grammar file.
2. Place it in the `/public/wasm/` directory.
3. Add the language to the `LANGUAGES` array in `src/types/index.ts`.
4. (Optional) Add new linting rules for it in `src/lib/linter.ts`.

## ⚖️ Practical Limits
- **URL Length**: Very large projects (over ~10MB) can create URLs that are too long for some browsers or platforms. The UI is designed to guide users toward GitHub Gists (a planned feature) for these cases.
- **JS Execution**: The QuickJS sandbox has no network or file system access for security. Execution is limited to a few seconds to prevent infinite loops.

## 🔐 Privacy Model
- The URL fragment (`#...`) is not sent in HTTP requests. The server never sees your code when sharing via hash.
- No analytics are performed on editor contents.
- Using the optional Supabase shortener sends only the long URL (containing the compressed code) to Supabase to create the link.

## 🧾 FAQ
**Q: Can I collaborate in real time?**  
A: Not yet. Lemma is designed for asynchronous sharing.

**Q: Can I execute Python, Go, etc.?**  
A: No. Execution with time-travel is currently only supported for JavaScript. Other languages receive static analysis (AST parsing and linting).

**Q: How big can a project be?**  
A: The URL hash method is reliable up to about 10MB. Beyond that, a planned Gist export feature will be recommended.

**Q: Why not just use JSFiddle or CodePen?**  
A: Lemma's focus is not on live web output, but on the internal execution flow. It's a debugging and learning tool designed to make the *process* of code execution transparent.

## 🛠 For Curious Technologists
The sharing pipeline is simple and robust:
```
{ code, language } → JSON.stringify()
	→ pako.gzip()
	→ base64Encode() → #h:<payload>
```
The Supabase shortener stores the entire long URL (e.g., `https://...#h:payload`) in a single `text` column, keyed by a `nanoid`. The Next.js middleware reads this and issues a 302 redirect, making the short link ephemeral.

## 📝 License
MIT — See `LICENSE`.

## 🙏 Acknowledgements
Next.js · Monaco Editor · Tree-sitter · QuickJS · Supabase · Zustand · Framer Motion · The open source community.

---

### Developer Appendix
<details>
<summary>Open for local development & contribution details</summary>

#### Clone & Run
```bash
git clone https://github.com/your-username/lemma.git
cd lemma
npm install
```

#### Environment Setup
Create a `.env.local` file in the project root and add your Supabase credentials for the URL shortener feature.
```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

#### Crucial: Manual Asset Setup
The `web-tree-sitter` library requires its core WASM and JS files to be manually available as static assets.
1. Copy `node_modules/web-tree-sitter/tree-sitter.wasm` → `/public/tree-sitter.wasm`
2. Copy `node_modules/web-tree-sitter/tree-sitter.js` → `/public/tree-sitter.js`

#### Run the Development Server
```bash
npm run dev
```
The site will be available at `http://localhost:3000`.

#### Supabase Setup for Short Links
- In your Supabase project, create a table named `lemma_short_links`.
- Columns:
  - `id` (type: `text`, is primary key)
  - `long_url` (type: `text`)
  - `created_at` (type: `timestamptz`, default: `now()`)
- Deploy the Edge Function located at `supabase/functions/shorten-url/index.ts` to your Supabase project.

</details>

---
<p align="center">
  Made with ❤️ by Anchor
</p>
