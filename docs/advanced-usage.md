# Advanced Usage

Edge cases, configuration, and optimization patterns.

## Async Loading Patterns

### Progressive Search

```typescript
const finder = new FuzzyFinder()
const { queryable, done } = finder.loadAsync(massiveFileList)

// queryable resolves after first chunk is processed
// This allows UI to be responsive even with large file lists
await queryable
const earlyResults = finder.search('component', 10)
// Note: earlyResults may be partial - only first chunk indexed

// done resolves when ALL files are indexed
await done
const finalResults = finder.search('component', 10)
// Now results are complete across entire file list
```

### Loading Indicator

```typescript
async function loadWithProgress(files: string[]) {
  const finder = new FuzzyFinder()
  const { done } = finder.loadAsync(files)

  // Access internal state via bracket notation to poll progress
  // readyCount = number of paths fully indexed so far
  const interval = setInterval(() => {
    const indexed = finder['state'].readyCount
    const progress = (indexed / files.length) * 100
    updateProgressBar(progress)
  }, 16) // Update interval for smooth progress display

  await done
  clearInterval(interval)
  return finder
}
```

## Case Sensitivity

Auto-detection based on query content:

```typescript
// All lowercase = case-insensitive
finder.search('readme', 5) // Matches: README.md, ReadMe.txt, readme

// Any uppercase = case-sensitive
finder.search('README', 5) // Matches: README.md (only)
finder.search('ReadMe', 5) // Matches: ReadMe.txt (only)
```

## Match Positions

Enable for highlighting:

```typescript
const results = finder.search('idx', 5, { includePositions: true })

for (const r of results) {
  // positions = indices where query chars matched
  // Example: "src/index.ts" with query "idx"
  // positions = [4, 5, 6] (i at 4, d at 5, x at 6)

  const highlighted = highlightMatches(r.path, r.positions!)
  // src/[i][d][x]ex.ts
}
```

## Empty Query Behavior

```typescript
// Empty string returns top-level directories
const topLevel = finder.search('', 10)
// [{ path: 'src', score: 0 }, { path: 'tests', score: 0 }, ...]

// Useful for initial "command palette" state
```

## Handling Large Result Sets

```typescript
// Limit is required - prevents memory issues
const results = finder.search('a', 100) // Good: capped
const results = finder.search('a', 1000) // Use sparingly

// For pagination, re-query with refined terms
function paginatedSearch(finder: FuzzyFinder, query: string, page: number) {
  const all = finder.search(query, 100)
  return all.slice((page - 1) * 10, page * 10)
}
```

## Re-indexing Strategies

Current implementation requires full re-index for changes:

```typescript
class ReindexingFinder {
  private finder = new FuzzyFinder()
  private currentFiles: string[] = []

  updateFiles(newFiles: string[]) {
    this.currentFiles = newFiles
    // Full re-index: O(n) where n = total file count
    // Acceptable for small projects (<10k files)
    this.finder.load(newFiles)
  }

  addFile(path: string) {
    // Avoid duplicates before re-indexing
    if (!this.currentFiles.includes(path)) {
      this.currentFiles.push(path)
      // Re-index entire list - no incremental API currently
      this.finder.load(this.currentFiles)
    }
  }

  removeFile(path: string) {
    const idx = this.currentFiles.indexOf(path)
    if (idx >= 0) {
      this.currentFiles.splice(idx, 1) // Remove from tracking array
      // Full re-index after removal
      this.finder.load(this.currentFiles)
    }
  }
}
```

## Query Length Limits

Maximum query length is 64 characters (configurable in source):

```typescript
// Queries longer than 64 chars are truncated
const longQuery = 'a'.repeat(100)
finder.search(longQuery, 10) // Only first 64 chars used
```

## Browser Considerations

### Web Worker Usage

```typescript
// fuzzy-worker.ts - Run fuzzy search off main thread
import FuzzyFinder from '@neabyte/fuzzy-finder'

const finder = new FuzzyFinder()

self.onmessage = (e) => {
  if (e.data.type === 'load') {
    // Indexing in worker = no UI blocking even with 100k+ files
    finder.load(e.data.files)
    self.postMessage({ type: 'loaded' })
  }
  if (e.data.type === 'search') {
    // Searching runs off main thread for better responsiveness
    const results = finder.search(e.data.query, e.data.limit)
    self.postMessage({ type: 'results', results })
  }
}
```

### Memory Management

```typescript
// Free memory by resetting index to empty state
function clearFinder(finder: FuzzyFinder) {
  finder.load([]) // Empty array releases all internal buffers
  // charBits, pathLengths arrays are resized to 0
  // strings are eligible for GC (if no external refs)
}
```
