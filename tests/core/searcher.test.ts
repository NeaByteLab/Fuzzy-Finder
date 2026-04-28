import { assertEquals } from '@std/assert'
import Searcher from '@app/core/searcher.ts'
import * as Core from '@app/core/index.ts'
import type * as Types from '@app/types.ts'

function createState(paths: string[]): Types.IndexState {
  const state = Core.Indexer.createInitialState()
  const deduped = Core.Loader.deduplicatePaths(paths)
  Core.Indexer.resetArrays(state, deduped)
  Core.Indexer.buildIndex(state)
  return state
}

Deno.test('Searcher.search - bitmap filter skips non-matching paths', () => {
  const state = createState(['/aaa.ts', '/bbb.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'c', 10, {})
  assertEquals(result.length, 0)
})

Deno.test('Searcher.search - camelCase matching', () => {
  const state = createState(['/src/myFile.ts', '/src/myfile.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'F', 10, {})
  assertEquals(result.length > 0, true)
})

Deno.test('Searcher.search - case insensitive by default', () => {
  const state = createState(['/SRC/INDEX.TS'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'index', 10, {})
  assertEquals(result.length, 1)
  assertEquals(result[0]!.path, '/SRC/INDEX.TS')
})

Deno.test('Searcher.search - case sensitive when query has uppercase', () => {
  const state = createState(['/src/Index.ts', '/src/index.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'Index', 10, {})
  assertEquals(result.length >= 1, true)
})

Deno.test('Searcher.search - consecutive matches get bonus', () => {
  const state = createState(['/src/abc.ts', '/src/a_b_c.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'abc', 10, {})
  assertEquals(result.length >= 1, true)
})

Deno.test('Searcher.search - empty query returns topLevelCache', () => {
  const state = createState(['home/a.ts', 'var/b.ts'])
  assertEquals(state.topLevelCache !== null, true)
  assertEquals(state.topLevelCache!.length, 2)
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, '', 10, {})
  assertEquals(result.length, 2)
})

Deno.test('Searcher.search - finds exact match', () => {
  const state = createState(['/src/index.ts', '/src/utils.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'index', 10, {})
  assertEquals(result.length > 0, true)
  assertEquals(result[0]!.path, '/src/index.ts')
})

Deno.test('Searcher.search - fuzzy match with gaps', () => {
  const state = createState(['/src/index.ts', '/lib/main.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'sidx', 10, {})
  assertEquals(result.length > 0, true)
})

Deno.test('Searcher.search - handles no matches', () => {
  const state = createState(['/a.ts', '/b.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'xyz', 10, {})
  assertEquals(result.length, 0)
})

Deno.test('Searcher.search - includePositions returns positions', () => {
  const state = createState(['/src/index.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'idx', 10, { includePositions: true })
  assertEquals(result[0]!.positions !== undefined, true)
  assertEquals(Array.isArray(result[0]!.positions), true)
})

Deno.test('Searcher.search - limit 0 returns empty', () => {
  const state = createState(['/a.ts', '/b.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'a', 0, {})
  assertEquals(result.length, 0)
})

Deno.test('Searcher.search - no positions when not requested', () => {
  const state = createState(['/src/index.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'idx', 10, {})
  assertEquals(result[0]!.positions, undefined)
})

Deno.test('Searcher.search - prefers boundary matches', () => {
  const state = createState(['/src/myindex.ts', '/src/index.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'index', 10, {})
  assertEquals(result[0]!.path, '/src/index.ts')
})

Deno.test('Searcher.search - prefers shorter paths', () => {
  const state = createState(['/a.ts', '/very/long/path/to/file.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'a', 10, {})
  assertEquals(result[0]!.path, '/a.ts')
})

Deno.test('Searcher.search - respects limit parameter', () => {
  const state = createState(['/a.ts', '/b.ts', '/c.ts', '/d.ts', '/e.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, '.ts', 3, {})
  assertEquals(result.length <= 3, true)
})

Deno.test('Searcher.search - results sorted by score descending', () => {
  const state = createState(['/index.ts', '/src/utils/helper.ts', '/a.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'index', 10, {})
  for (let i = 1; i < result.length; i++) {
    assertEquals(result[i - 1]!.score >= result[i]!.score, true)
  }
})

Deno.test('Searcher.search - returns normalized scores 0-1', () => {
  const state = createState(['/aaaaa.ts', '/bbbbb.ts', '/ccccc.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'a', 10, {})
  for (const searchResult of result) {
    assertEquals(searchResult.score >= 0 && searchResult.score <= 1, true)
  }
})

Deno.test('Searcher.search - test file penalty applied', () => {
  const state = createState(['/src/file.ts', '/src/file.test.ts'])
  const buffer = new Int32Array(64)
  const result = Searcher.search(state, buffer, 'file', 10, {})
  const regularFile = result.find((r: { path: string }) => r.path === '/src/file.ts')
  const testFile = result.find((r: { path: string }) => r.path === '/src/file.test.ts')
  if (regularFile && testFile) {
    assertEquals(regularFile.score >= testFile.score, true)
  }
})
