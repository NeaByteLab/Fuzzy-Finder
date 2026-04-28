import { assertEquals } from '@std/assert'
import Indexer from '@app/core/indexer.ts'

Deno.test('Indexer.buildIndex - handles empty paths', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, [])
  Indexer.buildIndex(state)
  assertEquals(state.readyCount, 0)
})

Deno.test('Indexer.buildIndex - indexes all paths', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, ['/a.ts', '/b.ts', '/c.ts'])
  Indexer.buildIndex(state)
  assertEquals(state.readyCount, 3)
  assertEquals(state.lowerPaths[0], '/a.ts')
  assertEquals(state.lowerPaths[1], '/b.ts')
  assertEquals(state.lowerPaths[2], '/c.ts')
})

Deno.test('Indexer.createInitialState - returns empty state', () => {
  const state = Indexer.createInitialState()
  assertEquals(state.paths.length, 0)
  assertEquals(state.lowerPaths.length, 0)
  assertEquals(state.charBits.length, 0)
  assertEquals(state.pathLengths.length, 0)
  assertEquals(state.readyCount, 0)
  assertEquals(state.topLevelCache, null)
})

Deno.test('Indexer.indexPath - builds correct charBits for abc', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, ['abc'])
  Indexer.indexPath(state, 0)
  assertEquals(state.charBits[0], 7)
})

Deno.test('Indexer.indexPath - builds correct charBits for xyz', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, ['xyz'])
  Indexer.indexPath(state, 0)
  const expected = (1 << 23) | (1 << 24) | (1 << 25)
  assertEquals(state.charBits[0], expected)
})

Deno.test('Indexer.indexPath - computes lowercase version', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, ['/HOME/File.TS'])
  Indexer.indexPath(state, 0)
  assertEquals(state.lowerPaths[0], '/home/file.ts')
})

Deno.test('Indexer.indexPath - stores path length', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, ['/src/index.ts'])
  Indexer.indexPath(state, 0)
  assertEquals(state.pathLengths[0], 13)
})

Deno.test('Indexer.indexPath - uppercase becomes lowercase in charBits', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, ['ABC123!!!'])
  Indexer.indexPath(state, 0)
  assertEquals(state.charBits[0], 7)
})

Deno.test('Indexer.resetArrays - deduplication is done by caller', () => {
  const state = Indexer.createInitialState()
  const paths = ['/a.ts', '/a.ts', '/b.ts']
  Indexer.resetArrays(state, paths)
  assertEquals(state.paths.length, 3)
})

Deno.test('Indexer.resetArrays - sets paths and allocates arrays', () => {
  const state = Indexer.createInitialState()
  const paths = ['/a.ts', '/b.ts', '/c.ts']
  Indexer.resetArrays(state, paths)
  assertEquals(state.paths, paths)
  assertEquals(state.lowerPaths.length, 3)
  assertEquals(state.charBits.length, 3)
  assertEquals(state.pathLengths.length, 3)
  assertEquals(state.readyCount, 0)
  assertEquals(state.topLevelCache !== null, true)
})
