# mem-vibe
Mostly vibe coded (including this doc).  You have been warned.

**Memorare** — a React + TypeScript (Vite) app for memorizing text (or typing practice). You enter or paste text in the large textarea at the top; each wrapped preview line is shown in large type with a dedicated input underneath. Match the line to move on; mismatched and pending characters are color-coded.

## Features

- **Wrapped preview lines** — Line breaks follow the preview column width and typography (not only manual newlines), via `src/splitVisualLines.ts`.
- **Per-line feedback** — Gray for not-yet-typed positions, black when correct, red when wrong.
- **Auto-advance** — When an input exactly matches the line above, focus moves to the next field and the window scrolls to keep it centered.
- **Keyboard** — With the caret at the start of a line, **Backspace** jumps to the previous input (caret at end).
- **Favicon** — Black “M” at `public/m.svg`.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ (LTS recommended)

## Setup

```bash
npm install
```

## Development

Start the dev server (default: http://localhost:5173):

```bash
npm run dev
```

## Production build

Type-check, bundle, and output to `dist/`:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Lint

```bash
npm run lint
```

## Repository

```text
git@github.com:mkehrt/mem-vibe.git
```
