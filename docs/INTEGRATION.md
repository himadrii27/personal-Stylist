# Component Bundle Integration

This document describes the integrated **InteractiveHero3D** component and how the codebase supports React, TypeScript, Tailwind CSS, and Vite.

## What Was Integrated

- **InteractiveHero3D** (`src/components/InteractiveHero3D.jsx`): A 3D interactive hero section with
  - Mouse-driven 3D tilt on the main card (Framer Motion `useTransform` + `useSpring`)
  - Fixed-position mouse follower (soft gradient that follows the cursor)
  - Gradient title, sparkle icon animation, CTA button, and three feature cards (Wardrobe Analysis, Color Matching, Style Magic)
  - CTA "Start Your Style Journey" scrolls smoothly to the main app content (`#main-content`)

- **Dependencies added**: `lucide-react`, `tailwindcss`, `postcss`, `autoprefixer`

- **Tailwind CSS v3**: Configured via `tailwind.config.js` and `postcss.config.js`. Theme variables (e.g. `--background`, `--primary`) are defined in `src/index.css` for use with Tailwind or future components.

- **App flow**: The hero is the first screen; the rest of the app (preferences, occasion form, recommendations) lives in `<section id="main-content">` and is revealed when the user clicks the CTA or scrolls.

## Project Support

| Requirement        | Status |
|--------------------|--------|
| React              | ✅ (React 19) |
| TypeScript         | ⚠️ Optional – see below |
| Tailwind CSS       | ✅ v3 with PostCSS |
| Vite               | ✅ Already in use |

## Adding TypeScript

The project currently uses JSX. To add TypeScript support:

1. **Install types and TS compiler**
   ```bash
   npm install -D typescript @vitejs/plugin-react
   ```
   (You already have `@vitejs/plugin-react`; Vite supports TS out of the box.)

2. **Add `tsconfig.json`** in the project root:
   ```json
   {
     "compilerOptions": {
       "target": "ES2020",
       "useDefineForClassFields": true,
       "lib": ["ES2020", "DOM", "DOM.Iterable"],
       "module": "ESNext",
       "skipLibCheck": true,
       "moduleResolution": "bundler",
       "allowImportingTsExtensions": true,
       "resolveJsonModule": true,
       "isolatedModules": true,
       "noEmit": true,
       "jsx": "react-jsx",
       "strict": true,
       "noUnusedLocals": true,
       "noUnusedParameters": true,
       "noFallthroughCasesInSwitch": true,
       "allowJs": true
     },
     "include": ["src"],
     "references": [{ "path": "./tsconfig.node.json" }]
   }
   ```

3. **Rename files** from `.jsx` / `.js` to `.tsx` / `.ts` as needed and add type annotations.

4. **Update `index.html`** script tag to point to `src/main.tsx` if you rename the entry.

New components (e.g. from the bundle) can be written in `.tsx`; existing JSX files work as-is with `allowJs: true`.

## Tailwind v4 (Alternative)

The bundle’s `index.css` used Tailwind v4 syntax (`@import "tailwindcss"`, `@theme inline`). This project uses **Tailwind v3** for stability. To switch to v4 later:

1. Install Tailwind v4 and the Vite plugin: `npm install -D tailwindcss @tailwindcss/vite`
2. In `vite.config.js`, add: `import tailwindcss from '@tailwindcss/vite'` and add `tailwindcss()` to the `plugins` array.
3. Replace `@tailwind base/components/utilities` in `src/index.css` with `@import "tailwindcss";` and use the `@theme inline { ... }` block from the bundle’s styles.

## Custom Colors / Fonts

- **Hero colors** are hardcoded in the component’s `<style>` block (e.g. `#FF6B9D`, `#C084FC`, `#60A5FA`). To theme them, replace with CSS variables or Tailwind theme values.
- **Fonts**: The app uses Inter (from `index.html`). Tailwind’s base layer does not override this.

## Reusable Utilities

- **Motion values**: The hero uses `useMotionValue`, `useSpring`, and `useTransform` from Framer Motion. The same pattern can be reused for other 3D or parallax effects.
- **Scroll target**: Any “scroll into view” CTA can target `#main-content` or another element with a known `id`.
