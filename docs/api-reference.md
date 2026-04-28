# API Reference

Complete API for the FuzzyFinder class.

## FuzzyFinder Class

Main entry point for fuzzy search operations.

### Constructor

```typescript
const finder = new FuzzyFinder()
```

Creates a new fuzzy finder instance with empty index.

### Methods

#### load(paths)

Synchronously index an array of file paths.

```typescript
finder.load(['src/index.ts', 'src/utils/helpers.ts', 'tests/index.test.ts'])
```

**Parameters:**

- `paths: string[]` - Array of file paths to index

**Returns:** `void`

---

#### loadAsync(paths)

Asynchronously index paths with chunked processing.

```typescript
const { queryable, done } = finder.loadAsync(largeFileList)

// Search available after first chunk
await queryable
const results = finder.search('query', 10)

// Wait for complete indexing
await done
```

**Parameters:**

- `paths: string[]` - Array of file paths to index

**Returns:** `LoadResult`

| Property    | Type            | Description                           |
| ----------- | --------------- | ------------------------------------- |
| `queryable` | `Promise<void>` | Resolves when index ready for queries |
| `done`      | `Promise<void>` | Resolves when indexing complete       |

---

#### search(query, limit, options?)

Search indexed paths with fuzzy matching.

```typescript
// Basic search
const results = finder.search('idx', 5)

// With positions
const results = finder.search('btn', 10, { includePositions: true })
```

**Parameters:**

- `query: string` - Search string to match
- `limit: number` - Maximum results to return
- `options?: SearchOptions` - Optional configuration

**Returns:** `SearchResult[]`

## Types

### SearchResult

```typescript
type SearchResult = {
  path: string
  score: number
  positions?: number[]
}
```

| Property    | Type       | Description                                         |
| ----------- | ---------- | --------------------------------------------------- |
| `path`      | `string`   | Matched file path                                   |
| `score`     | `number`   | Normalized score 0-1 (higher = better match)        |
| `positions` | `number[]` | Character indices of matched query chars (optional) |

### LoadResult

```typescript
type LoadResult = {
  queryable: Promise<void>
  done: Promise<void>
}
```

### SearchOptions

```typescript
type SearchOptions = {
  includePositions?: boolean
}
```

| Property           | Type      | Default | Description                                |
| ------------------ | --------- | ------- | ------------------------------------------ |
| `includePositions` | `boolean` | `false` | Include match character indices in results |

## Case-Sensitive Mode

Fuzzy Finder auto-detects case sensitivity:

```typescript
// Lowercase query = case-insensitive
finder.search('button', 5) // Matches: Button.tsx, button.ts

// Uppercase in query = case-sensitive
finder.search('Button', 5) // Matches: Button.tsx (not button.ts)
```

## Empty Query Behavior

Empty query returns top-level directories:

```typescript
finder.search('', 10)
// Returns: [{ path: 'src', score: 0 }, { path: 'tests', score: 0 }, ...]
```
