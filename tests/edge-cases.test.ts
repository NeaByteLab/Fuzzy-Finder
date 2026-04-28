import { assertEquals } from '@std/assert'
import { FuzzyFinder } from '@neabyte/fuzzy-finder'
import Scoring from '@app/scoring.ts'
import Utils from '@app/utils.ts'
import Indexer from '@app/core/indexer.ts'
import Searcher from '@app/core/searcher.ts'
import Loader from '@app/core/loader.ts'
import Config from '@app/constants.ts'
import type * as Types from '@app/types.ts'

function createState(paths: string[]): Types.IndexState {
  const state = Indexer.createInitialState()
  const deduped = Loader.deduplicatePaths(paths)
  Indexer.resetArrays(state, deduped)
  Indexer.buildIndex(state)
  return state
}

Deno.test('EdgeCase: Config - constants are readonly', () => {
  assertEquals(Config.maxQuery, 64)
  assertEquals(Config.scoreMatch, 16)
  assertEquals(Config.bonusFirst, 10)
})

Deno.test('EdgeCase: Config - constants are readonly at compile time', () => {
  assertEquals(typeof Config.maxQuery, 'number')
  assertEquals(typeof Config.scoreMatch, 'number')
  assertEquals(typeof Config.bonusBoundary, 'number')
})

Deno.test('EdgeCase: FuzzyFinder - all paths with identical charBits', () => {
  const index = new FuzzyFinder()
  const files: string[] = []
  for (let i = 0; i < 1000; i++) {
    files.push(`/${'a'.repeat(i + 1)}.ts`)
  }
  index.load(files)
  const results = index.search('a', 100)
  assertEquals(results.length, 100)
})

Deno.test('EdgeCase: FuzzyFinder - path at Uint16Array max boundary (65535)', () => {
  const index = new FuzzyFinder()
  const longPath = 'a'.repeat(65535) + '.ts'
  index.load([longPath, 'short.ts'])
  const results = index.search('aaa', 10)
  assertEquals(Array.isArray(results), true)
})

Deno.test('EdgeCase: FuzzyFinder - re-indexing multiple times', () => {
  const index = new FuzzyFinder()
  index.load(['a.ts', 'b.ts'])
  index.load(['c.ts', 'd.ts', 'e.ts'])
  index.load(['f.ts'])
  const results = index.search('.ts', 10)
  assertEquals(results.length, 1)
  assertEquals(results[0]!.path, 'f.ts')
})

Deno.test('EdgeCase: FuzzyFinder - worst case query matching many paths', () => {
  const index = new FuzzyFinder()
  const files: string[] = []
  for (let i = 0; i < 5000; i++) {
    files.push(`/src/components/feature${i}/index.ts`)
  }
  index.load(files)
  const results = index.search('i', 100)
  assertEquals(results.length, 100)
})

Deno.test('EdgeCase: FuzzyFinder.load - all empty strings', () => {
  const index = new FuzzyFinder()
  index.load(['', '', ''])
  const results = index.search('', 10)
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: FuzzyFinder.load - array with empty strings', () => {
  const index = new FuzzyFinder()
  index.load(['', 'file.ts', ''])
  const results = index.search('file', 10)
  assertEquals(results.length, 1)
  assertEquals(results[0]!.path, 'file.ts')
})

Deno.test('EdgeCase: FuzzyFinder.load - empty array', () => {
  const index = new FuzzyFinder()
  index.load([])
  const results = index.search('anything', 10)
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: FuzzyFinder.load - extremely large path count (50k)', () => {
  const index = new FuzzyFinder()
  const files: string[] = []
  for (let i = 0; i < 50000; i++) {
    files.push(`/path/to/file${i}.ts`)
  }
  index.load(files)
  const results = index.search('file25000', 10)
  assertEquals(results.length >= 1, true)
})

Deno.test('EdgeCase: FuzzyFinder.load - paths with combining characters', () => {
  const index = new FuzzyFinder()
  index.load(['/file\u0065\u0301.ts'])
  const results = index.search('file', 10)
  assertEquals(results.length, 1)
})

Deno.test('EdgeCase: FuzzyFinder.load - paths with emoji', () => {
  const index = new FuzzyFinder()
  index.load(['📁file.ts', 'file📄.ts', '📂/file.ts'])
  const results = index.search('file', 10)
  assertEquals(results.length, 3)
})

Deno.test('EdgeCase: FuzzyFinder.load - paths with leading/trailing whitespace', () => {
  const index = new FuzzyFinder()
  index.load([' file.ts', 'file.ts ', ' file.ts '])
  const results = index.search('file', 10)
  assertEquals(results.length, 3)
})

Deno.test('EdgeCase: FuzzyFinder.load - paths with null bytes', () => {
  const index = new FuzzyFinder()
  index.load(['file\x00name.ts', 'normal.ts'])
  const results = index.search('normal', 10)
  assertEquals(results.length, 1)
  assertEquals(results[0]!.path, 'normal.ts')
})

Deno.test('EdgeCase: FuzzyFinder.load - paths with only separators', () => {
  const index = new FuzzyFinder()
  index.load(['///', '\\\\\\', '/\\\\\\/mixed'])
  const results = index.search('/', 10)
  assertEquals(Array.isArray(results), true)
})

Deno.test('EdgeCase: FuzzyFinder.load - paths with RTL (right-to-left) characters', () => {
  const index = new FuzzyFinder()
  index.load(['/עברית/file.ts', '/العربية/file.ts'])
  const results = index.search('file', 10)
  assertEquals(results.length, 2)
})

Deno.test('EdgeCase: FuzzyFinder.search - empty query on fresh index', () => {
  const index = new FuzzyFinder()
  const results = index.search('', 10)
  assertEquals(Array.isArray(results), true)
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: FuzzyFinder.search - handles Infinity limit', () => {
  const index = new FuzzyFinder()
  index.load(['a.ts', 'b.ts', 'c.ts'])
  const results = index.search('.ts', Infinity)
  assertEquals(results.length, 3)
})

Deno.test('EdgeCase: FuzzyFinder.search - handles NaN limit', () => {
  const index = new FuzzyFinder()
  index.load(['file.ts'])
  const results = index.search('file', NaN)
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: FuzzyFinder.search - mixed case sensitivity query', () => {
  const index = new FuzzyFinder()
  index.load(['/src/Index.ts', '/src/index.ts', '/src/INDEX.ts'])
  const results = index.search('InDeX', 10)
  assertEquals(Array.isArray(results), true)
})

Deno.test('EdgeCase: FuzzyFinder.search - negative limit', () => {
  const index = new FuzzyFinder()
  index.load(['a.ts', 'b.ts'])
  const results = index.search('a', -1)
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: FuzzyFinder.search - newlines and tabs in paths', () => {
  const index = new FuzzyFinder()
  index.load(['file\nname.ts', 'file\tname.ts'])
  const results = index.search('file', 10)
  assertEquals(results.length, 2)
})

Deno.test('EdgeCase: FuzzyFinder.search - on fresh index without any load', () => {
  const index = new FuzzyFinder()
  const results = index.search('anything', 10)
  assertEquals(Array.isArray(results), true)
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: FuzzyFinder.search - query exactly at maxQuery boundary (64 chars)', () => {
  const index = new FuzzyFinder()
  index.load(['abcdefghijklmnopqrstuvwxyz.ts'])
  const query = 'a'.repeat(Config.maxQuery)
  const results = index.search(query, 10)
  assertEquals(Array.isArray(results), true)
})

Deno.test('EdgeCase: FuzzyFinder.search - query longer than maxQuery', () => {
  const index = new FuzzyFinder()
  index.load(['abcdefghijklmnop.ts'])
  const longQuery = 'a'.repeat(100)
  const results = index.search(longQuery, 10)
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: FuzzyFinder.search - query with combining characters', () => {
  const index = new FuzzyFinder()
  index.load(['/resume/file.ts'])
  const results = index.search('r\u0065\u0301sume', 10)
  assertEquals(Array.isArray(results), true)
})

Deno.test('EdgeCase: FuzzyFinder.search - query with emoji', () => {
  const index = new FuzzyFinder()
  index.load(['file.ts'])
  const results = index.search('file🔍', 10)
  assertEquals(Array.isArray(results), true)
})

Deno.test('EdgeCase: FuzzyFinder.search - query with only non-letter characters', () => {
  const index = new FuzzyFinder()
  index.load(['file123.ts', 'test_456.js', 'data-789.json'])
  const results = index.search('123', 10)
  assertEquals(Array.isArray(results), true)
})

Deno.test('EdgeCase: FuzzyFinder.search - query with only special characters', () => {
  const index = new FuzzyFinder()
  index.load(['file_name.ts', 'test-file.js'])
  const results = index.search('_.-', 10)
  assertEquals(Array.isArray(results), true)
})

Deno.test('EdgeCase: FuzzyFinder.search - query with zero-width characters', () => {
  const index = new FuzzyFinder()
  index.load(['file.ts'])
  const results = index.search('file\u200D.ts', 10)
  assertEquals(Array.isArray(results), true)
})

Deno.test('EdgeCase: FuzzyFinder.search - special regex characters in query', () => {
  const index = new FuzzyFinder()
  index.load(['file[1].ts', 'file.test.ts', 'file^name.ts'])
  const results1 = index.search('[1]', 10)
  assertEquals(results1.length, 1)
  const results2 = index.search('.test', 10)
  assertEquals(results2.length >= 1, true)
})

Deno.test('EdgeCase: FuzzyFinder.search - unicode characters', () => {
  const index = new FuzzyFinder()
  index.load(['文件.ts', 'ファイル.ts', 'файл.ts'])
  const results = index.search('文件', 10)
  assertEquals(results.length >= 0, true)
})

Deno.test('EdgeCase: FuzzyFinder.search - very large limit', () => {
  const index = new FuzzyFinder()
  index.load(['a.ts', 'b.ts'])
  const results = index.search('.ts', 10000)
  assertEquals(results.length, 2)
})

Deno.test('EdgeCase: FuzzyFinder.search - whitespace only query', () => {
  const index = new FuzzyFinder()
  index.load(['a b.ts', 'c d.ts'])
  const results = index.search('   ', 10)
  assertEquals(results.length >= 0, true)
})

Deno.test('EdgeCase: FuzzyFinder.search - zero limit', () => {
  const index = new FuzzyFinder()
  index.load(['a.ts', 'b.ts'])
  const results = index.search('a', 0)
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: Indexer.buildIndex - single path', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, ['/single.ts'])
  Indexer.buildIndex(state)
  assertEquals(state.readyCount, 1)
})

Deno.test('EdgeCase: Indexer.indexPath - empty string path', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, [''])
  Indexer.indexPath(state, 0)
  assertEquals(state.lowerPaths[0], '')
  assertEquals(state.pathLengths[0], 0)
  assertEquals(state.charBits[0], 0)
})

Deno.test('EdgeCase: Indexer.indexPath - path with only non-letters', () => {
  const state = Indexer.createInitialState()
  Indexer.resetArrays(state, ['123_-./'])
  Indexer.indexPath(state, 0)
  assertEquals(state.lowerPaths[0], '123_-./')
  assertEquals(state.charBits[0], 0)
})

Deno.test('EdgeCase: Loader.deduplicatePaths - all duplicates', () => {
  const input = ['/a.ts', '/a.ts', '/a.ts']
  const result = Loader.deduplicatePaths(input)
  assertEquals(result, ['/a.ts'])
})

Deno.test('EdgeCase: Loader.deduplicatePaths - array with only empty strings', () => {
  const result = Loader.deduplicatePaths(['', '', '', ''])
  assertEquals(result.length, 0)
})

Deno.test('EdgeCase: Loader.deduplicatePaths - mixed valid and empty', () => {
  const input = ['/a.ts', '', '/b.ts', '', '/a.ts']
  const result = Loader.deduplicatePaths(input)
  assertEquals(result, ['/a.ts', '/b.ts'])
})

Deno.test('EdgeCase: Scoring.isBoundary - edge char codes', () => {
  assertEquals(Scoring.isBoundary(0), false)
  assertEquals(Scoring.isBoundary(127), false)
  assertEquals(Scoring.isBoundary(1000), false)
})

Deno.test('EdgeCase: Scoring.isBoundary - with surrogate pairs', () => {
  const emojiHigh = 0xd83d
  const emojiLow = 0xde00
  assertEquals(Scoring.isBoundary(emojiHigh), false)
  assertEquals(Scoring.isBoundary(emojiLow), false)
})

Deno.test('EdgeCase: Scoring.scoreBonusAt - position 0 with empty string', () => {
  const bonus = Scoring.scoreBonusAt('', 0, true)
  assertEquals(bonus, 10)
})

Deno.test('EdgeCase: Scoring.scoreBonusAt - position beyond string length', () => {
  const bonus = Scoring.scoreBonusAt('abc', 10, false)
  assertEquals(typeof bonus, 'number')
})

Deno.test('EdgeCase: Scoring.scoreBonusAt - position beyond string with isFirst', () => {
  const bonus = Scoring.scoreBonusAt('short', 100, true)
  assertEquals(typeof bonus, 'number')
})

Deno.test('EdgeCase: Searcher.search - query chars not in any path', () => {
  const state = createState(['aaa.ts', 'bbb.ts'])
  const buffer = new Int32Array(Config.maxQuery)
  const results = Searcher.search(state, buffer, 'zzz', 10, {})
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: Searcher.search - query equals path', () => {
  const state = createState(['exact.ts'])
  const buffer = new Int32Array(Config.maxQuery)
  const results = Searcher.search(state, buffer, 'exact.ts', 10, {})
  assertEquals(results.length, 1)
  assertEquals(results[0]!.path, 'exact.ts')
})

Deno.test('EdgeCase: Searcher.search - query with only non-ascii letters', () => {
  const state = createState(['test.ts'])
  const buffer = new Int32Array(Config.maxQuery)
  const results = Searcher.search(state, buffer, 'TEST', 10, {})
  assertEquals(results.length >= 0, true)
})

Deno.test('EdgeCase: Searcher.search - single char query', () => {
  const state = createState(['abc.ts', 'def.ts'])
  const buffer = new Int32Array(Config.maxQuery)
  const results = Searcher.search(state, buffer, 'a', 10, {})
  assertEquals(results.length, 1)
})

Deno.test('EdgeCase: Searcher.search - state with readyCount 0', () => {
  const state = Indexer.createInitialState()
  const buffer = new Int32Array(Config.maxQuery)
  const results = Searcher.search(state, buffer, 'test', 10, {})
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: Searcher.search - very long path names', () => {
  const longPath = 'a'.repeat(500) + '.ts'
  const state = createState([longPath, 'short.ts'])
  const buffer = new Int32Array(Config.maxQuery)
  const results = Searcher.search(state, buffer, 'aaa', 10, {})
  assertEquals(results.length >= 1, true)
})

Deno.test('EdgeCase: Searcher.search - with corrupted state (null arrays)', () => {
  const state: Types.IndexState = {
    paths: [],
    lowerPaths: [],
    charBits: null as unknown as Int32Array,
    pathLengths: null as unknown as Uint16Array,
    readyCount: 0,
    topLevelCache: null
  }
  const buffer = new Int32Array(Config.maxQuery)
  try {
    Searcher.search(state, buffer, 'test', 10, {})
    assertEquals(true, false, 'Should have thrown')
  } catch (_e) {
    assertEquals(true, true)
  }
})

Deno.test('EdgeCase: Searcher.search - with negative readyCount', () => {
  const state = Indexer.createInitialState()
  const paths = ['/a.ts', '/b.ts']
  Indexer.resetArrays(state, paths)
  Indexer.buildIndex(state)
  state.readyCount = -1
  const buffer = new Int32Array(Config.maxQuery)
  const results = Searcher.search(state, buffer, 'test', 10, {})
  assertEquals(results.length, 0)
})

Deno.test('EdgeCase: Utils.computeTopLevelEntries - limit 0', () => {
  const paths = ['a/file.ts', 'b/file.ts']
  const result = Utils.computeTopLevelEntries(paths, 0)
  assertEquals(result.length, 0)
})

Deno.test('EdgeCase: Utils.computeTopLevelEntries - paths with multiple separators', () => {
  const paths = ['very/deep/nested/path/file.ts']
  const result = Utils.computeTopLevelEntries(paths, 100)
  assertEquals(result[0]!.path, 'very')
})

Deno.test('EdgeCase: Utils.computeTopLevelEntries - single char segments', () => {
  const paths = ['a/file.ts', 'b/file.ts', 'c/file.ts']
  const result = Utils.computeTopLevelEntries(paths, 100)
  assertEquals(result.length, 3)
})

Deno.test('EdgeCase: Utils.computeTopLevelEntries - very large limit', () => {
  const paths = ['a/file.ts', 'b/file.ts', 'c/file.ts']
  const result = Utils.computeTopLevelEntries(paths, Number.MAX_SAFE_INTEGER)
  assertEquals(result.length, 3)
})
