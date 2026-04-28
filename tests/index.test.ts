import { assert, assertEquals } from '@std/assert'
import { FuzzyFinder, type SearchResult } from '@neabyte/fuzzy-finder'

Deno.test('FuzzyFinder - can be instantiated', () => {
  const index = new FuzzyFinder()
  assert(index instanceof FuzzyFinder)
})

Deno.test('FuzzyFinder - handles empty file list', () => {
  const index = new FuzzyFinder()
  index.load([])
  const results = index.search('anything', 10)
  assertEquals(results.length, 0)
})

Deno.test('FuzzyFinder - handles large number of files', () => {
  const index = new FuzzyFinder()
  const files: string[] = []
  for (let i = 0; i < 1000; i++) {
    files.push(`/path/to/file${i}.ts`)
  }
  index.load(files)
  const results = index.search('file500', 5)
  assertEquals(results.length >= 1, true)
})

Deno.test('FuzzyFinder - handles paths with special characters', () => {
  const index = new FuzzyFinder()
  index.load(['/my-file_name.ts', '/my.file.ts', '/my file.ts'])
  const results = index.search('my', 10)
  assertEquals(results.length, 3)
})

Deno.test('FuzzyFinder - handles Windows paths', () => {
  const index = new FuzzyFinder()
  index.load(['C:/Users/file.ts', 'D:/Data/file.ts'])
  const results = index.search('file', 10)
  assertEquals(results.length, 2)
})

Deno.test('FuzzyFinder - re-indexing replaces previous data', () => {
  const index = new FuzzyFinder()
  index.load(['/a.ts', '/b.ts'])
  index.load(['/c.ts', '/d.ts'])
  const results = index.search('.ts', 10)
  const paths = results.map((r: SearchResult) => r.path)
  assertEquals(paths.includes('/a.ts'), false)
  assertEquals(paths.includes('/b.ts'), false)
  assertEquals(paths.includes('/c.ts'), true)
  assertEquals(paths.includes('/d.ts'), true)
})

Deno.test('FuzzyFinder - score is normalized 0-1', () => {
  const index = new FuzzyFinder()
  index.load(['/a.ts', '/b.ts', '/c.ts'])
  const results = index.search('a', 10)
  for (const searchResult of results) {
    assertEquals(searchResult.score >= 0 && searchResult.score <= 1, true)
  }
})

Deno.test('FuzzyFinder.load - deduplicates paths', () => {
  const index = new FuzzyFinder()
  index.load(['/a.ts', '/a.ts', '/b.ts'])
  const results = index.search('.ts', 10)
  const paths = results.map((searchResult: SearchResult) => searchResult.path)
  const uniquePaths = [...new Set(paths)]
  assertEquals(paths.length, uniquePaths.length)
})

Deno.test('FuzzyFinder.load - indexes files synchronously', () => {
  const index = new FuzzyFinder()
  const files = ['/a.ts', '/b.ts', '/c.ts']
  index.load(files)
  const results = index.search('a', 10)
  assertEquals(results.length >= 1, true)
})

Deno.test('FuzzyFinder.loadAsync - returns queryable and done promises', () => {
  const index = new FuzzyFinder()
  const result = index.loadAsync(['/a.ts', '/b.ts'])
  assertEquals(result.queryable instanceof Promise, true)
  assertEquals(result.done instanceof Promise, true)
})

Deno.test('FuzzyFinder.search - case insensitive matching', () => {
  const index = new FuzzyFinder()
  index.load(['/SRC/INDEX.TS'])
  const results = index.search('index', 5)
  assertEquals(results.length, 1)
})

Deno.test('FuzzyFinder.search - empty query returns top-level entries', () => {
  const index = new FuzzyFinder()
  index.load(['home/file.ts', 'var/file.ts'])
  const results = index.search('', 10)
  assertEquals(results.length, 2)
  assertEquals(results[0]!.path, 'var')
  assertEquals(results[1]!.path, 'home')
})

Deno.test('FuzzyFinder.search - fuzzy matching works', () => {
  const index = new FuzzyFinder()
  index.load(['/src/index.ts'])
  const results = index.search('sidx', 5)
  assertEquals(results.length, 1)
  assertEquals(results[0]!.path, '/src/index.ts')
})

Deno.test('FuzzyFinder.search - includePositions option', () => {
  const index = new FuzzyFinder()
  index.load(['/src/index.ts'])
  const results = index.search('idx', 5, { includePositions: true })
  assertEquals(results[0]!.positions !== undefined, true)
  assertEquals(Array.isArray(results[0]!.positions), true)
})

Deno.test('FuzzyFinder.search - respects limit', () => {
  const index = new FuzzyFinder()
  index.load(['/a.ts', '/b.ts', '/c.ts', '/d.ts', '/e.ts'])
  const results = index.search('.ts', 3)
  assertEquals(results.length <= 3, true)
})

Deno.test('FuzzyFinder.search - returns ranked results', () => {
  const index = new FuzzyFinder()
  index.load(['/src/index.ts', '/lib/main.ts', '/test/setup.ts'])
  const results = index.search('index', 5)
  assertEquals(results.length > 0, true)
  assertEquals(typeof results[0]!.score, 'number')
})
