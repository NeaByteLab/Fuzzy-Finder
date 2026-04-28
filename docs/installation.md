# Installation

Fuzzy Finder works in Deno, Node.js, and browsers.

## Prerequisites

- [Deno](https://deno.com/) 2.0+ or [Node.js](https://nodejs.org/) 22+
- TypeScript 5.0+ (recommended)

## Deno (JSR)

```bash
deno add jsr:@neabyte/fuzzy-finder
```

Import in your code:

```typescript
import FuzzyFinder from '@neabyte/fuzzy-finder'
```

## npm/Node.js

```bash
npm install @neabyte/fuzzy-finder
```

Import:

```typescript
import FuzzyFinder from '@neabyte/fuzzy-finder'
```

## CDN (Browser)

### esm.sh (Recommended)

```typescript
import FuzzyFinder from 'https://esm.sh/jsr/@neabyte/fuzzy-finder'
```

### unpkg

```typescript
import FuzzyFinder from 'https://unpkg.com/@neabyte/fuzzy-finder@latest/src/index.ts'
```

### HTML Script Tag

```html
<script type="module">
  import FuzzyFinder from 'https://esm.sh/jsr/@neabyte/fuzzy-finder'
  // Use FuzzyFinder here
</script>
```

## TypeScript Types

Types are included. Import explicitly if needed:

```typescript
import type { LoadResult, SearchOptions, SearchResult } from '@neabyte/fuzzy-finder'
```
