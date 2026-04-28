# Examples

Real-world integration patterns for Fuzzy Finder.

## Command Palette (VS Code Style)

```typescript
import FuzzyFinder from '@neabyte/fuzzy-finder'

class CommandPalette {
  // Single FuzzyFinder instance reused for all searches
  private finder = new FuzzyFinder()

  async initialize(files: string[]) {
    // Start async indexing - queryable resolves after first chunk
    const { queryable } = this.finder.loadAsync(files)
    await queryable // UI ready for typing immediately, not after full index
  }

  onInput(query: string) {
    // includePositions = true allows us to highlight which chars matched
    const results = this.finder.search(query, 10, {
      includePositions: true
    })
    this.render(results)
  }

  private render(results: SearchResult[]) {
    for (const r of results) {
      // positions[] contains indices where query chars matched in the path
      // e.g., query "idx" on "src/index.ts" -> positions = [4, 5, 6]
      const highlighted = this.highlight(r.path, r.positions!)
      console.log(`${highlighted} (${r.score.toFixed(2)})`)
    }
  }

  private highlight(path: string, positions: number[]): string {
    let result = ''
    for (let i = 0; i < path.length; i++) {
      // Wrap matched characters in brackets for visibility
      result += positions.includes(i)
        ? `[${path[i]}]` // Matched char: wrap in [ ]
        : path[i] // Unmatched char: as-is
    }
    return result
  }
}
```

## File Picker CLI

```typescript
import FuzzyFinder from '@neabyte/fuzzy-finder'

async function filePicker(allFiles: string[]) {
  const finder = new FuzzyFinder()

  // For CLI tools with <10k files, sync load is fine
  // For larger lists, use loadAsync() to keep UI responsive
  finder.load(allFiles)
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
  rl.on('line', (query: string) => {
    if (query === 'exit') {
      rl.close()
      return
    }

    // Search returns top 5 matches sorted by relevance score
    const results = finder.search(query, 5)
    results.forEach((r, i) => {
      // Score is 0-1, multiply by 100 for percentage display
      console.log(`${i + 1}. ${r.path} (${(r.score * 100).toFixed(0)}%)`)
    })
  })

  console.log('Type to search (exit to quit):')
}
```

## IDE Integration

```typescript
import FuzzyFinder from '@neabyte/fuzzy-finder'

class IDEService {
  private finder = new FuzzyFinder()
  private fileWatcher: FileWatcher

  async init(projectPath: string) {
    const files = await this.scanProject(projectPath)

    // Use loadAsync for projects with 10k+ files
    // queryable resolves after first chunk -> search available immediately
    const { queryable, done } = this.finder.loadAsync(files)
    await queryable // User can start searching now

    // Set up file watching while indexing continues in background
    this.fileWatcher = new FileWatcher(projectPath, {
      onAdd: (path) => this.addFile(path),
      onRemove: (path) => this.removeFile(path)
    })

    await done // Wait for full index before marking "ready"
  }

  quickOpen(query: string) {
    // Return 15 results with positions for highlighting matched chars
    return this.finder.search(query, 15, { includePositions: true })
  }

  private addFile(path: string) {
    // Current implementation: full re-index required on any change
    // This is acceptable for small projects, but see architecture.md
    // for notes on potential incremental indexing approaches
    const current = this.getAllFiles()
    this.finder.load([...current, path])
  }
}
```

## Browser File Search

```html
<!DOCTYPE html>
<script type="module">
  // Import directly from CDN - no build step required
  import FuzzyFinder from 'https://esm.sh/jsr/@neabyte/fuzzy-finder'

  // Create FuzzyFinder instance - this holds the search index in memory
  const finder = new FuzzyFinder()

  // In real apps, files might come from:
  // - File drag-and-drop (FileSystemDirectoryHandle)
  // - User file picker (showDirectoryPicker API)
  // - Server-side file list
  const files = ['documents/report.pdf', 'documents/notes.txt', 'images/photo.jpg']

  // Load once, then search many times
  finder.load(files)

  // Expose to global scope for inline event handlers
  window.searchFiles = (query) => {
    return finder.search(query, 10)
  }
</script>

<!-- Call searchFiles() on every keystroke -->
<input type="text" oninput="showResults(searchFiles(this.value))" />
<div id="results"></div>
```

## Fuzzy Filter Pipeline

```typescript
import FuzzyFinder from '@neabyte/fuzzy-finder'

// Generic wrapper: search any object type by a string property
function createFuzzyPipeline<T>(
  items: T[],
  getPath: (item: T) => string // Extract searchable string from object
) {
  const finder = new FuzzyFinder()
  const pathMap = new Map<string, T>() // Map path back to original object

  // Build array of searchable paths while preserving object mapping
  const paths = items.map((item) => {
    const path = getPath(item)
    pathMap.set(path, item) // Store reference for later retrieval
    return path
  })
  finder.load(paths)
  return {
    search(query: string, limit: number) {
      // Search on paths, then map results back to original objects
      const results = finder.search(query, limit)
      return results.map((r) => ({
        item: pathMap.get(r.path)!, // Original object
        score: r.score, // Match relevance
        positions: r.positions // Match locations
      }))
    }
  }
}

// Example: Fuzzy search user objects by name
const users = [
  { id: 1, name: 'John Doe', email: 'john@example.com' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
]
const pipeline = createFuzzyPipeline(users, (u) => u.name)
const matches = pipeline.search('jn', 5) // Matches "John" (j=0, n=3)
```
