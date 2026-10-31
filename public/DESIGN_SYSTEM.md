# LearnSphere AI — Global Design System

This design system is **framework-agnostic** and is applied globally by including one stylesheet:

- `styles/index.css`

## Tokens (exact colors + spacing)

All tokens live in `styles/tokens.css`:

- **Primary**: `#2563EB`
- **Secondary**: `#7C3AED`
- **Background**: `#F8FAFC`
- **Card**: `#FFFFFF`
- **Success**: `#22C55E`
- **Text primary**: `#111827`
- **Text secondary**: `#6B7280`
- **Font**: Poppins/Inter (loaded via Google Fonts)
- **Buttons radius**: `8px` (`--radius-md`)
- **Cards shadow**: `--shadow-card` (soft)
- **Section spacing**: `24px` (`--section-gap`)

## Usage (apply to all pages)

Add this to every page’s `<head>`:

```html
<link rel="stylesheet" href="./styles/index.css" />
```

If your pages are in subfolders, adjust the relative path accordingly.

## Component classes

Defined in `styles/components.css`:

- **Buttons**: `.btn` + `.btn-primary` / `.btn-secondary` / `.btn-outline`
- **Cards**: `.card` (and optional `.card--compact`)
- **Badges**: `.badge` and `.badge-success`

