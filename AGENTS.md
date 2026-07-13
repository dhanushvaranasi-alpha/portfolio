<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

# Tailwind gotcha: never use the `text-base` utility

This theme defines a custom color token `--color-base` (#050810). In Tailwind v4 the `text-*` namespace serves both font-size and color, and the color token hijacks `text-base` into `color: #050810` — near-black text, invisible on the dark background. Use `text-[1rem]/6` when you need the 16px size (the `/6` restores `text-base`'s 1.5rem line-height, which a bare arbitrary size does not set).
<!-- END:nextjs-agent-rules -->
