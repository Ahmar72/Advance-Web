---
description: "Refactor UI files to remove hardcoded colors and use globals.css design tokens"
name: "Remove Hardcoded Colors"
argument-hint: "target files or folders (for example: app/components, app/(public), components/ui/button.tsx)"
agent: "agent"
---

Refactor the provided UI scope to remove hardcoded color values and use project color tokens from [globals.css](../../app/globals.css).

Task inputs:

- Target scope: ${input:target files or folders}

Requirements:

1. Find hardcoded colors in class strings and style objects:

- Tailwind arbitrary values like `bg-[#123456]`, `text-[rgb(10,20,30)]`, `border-[hsl(...)]`
- Inline styles like `style={{ color: '#111827' }}`
- Raw CSS in component files containing hex/rgb/hsl color literals

2. Replace hardcoded values with existing tokenized classes or CSS variables already defined in [globals.css](../../app/globals.css).
3. Do not add new color values directly in components.
4. Keep visual intent and accessibility (contrast) as close as possible.
5. Preserve behavior and component APIs.
6. For internal navigation, use `Link` instead of `<a>` if touched during refactor.
7. Avoid changing unrelated code.

Implementation rules:

- Prefer server components when possible.
- Reuse utilities from `lib/` instead of creating duplicate helpers.
- Keep edits minimal and feature-focused.

Return format:

1. Files changed and why.
2. Token mapping summary in this format: `old color -> new token/class`.
3. Any places skipped because no suitable token existed in [globals.css](../../app/globals.css).
4. Suggested follow-up if token gaps are found.
