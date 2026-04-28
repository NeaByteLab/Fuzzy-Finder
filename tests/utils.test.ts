import { assertEquals } from '@std/assert'
import Utils from '@app/utils.ts'

Deno.test('Utils.computeTopLevelEntries - deduplicates same root', () => {
  const paths = ['home/a.ts', 'home/b.ts', 'home/c.ts']
  const result = Utils.computeTopLevelEntries(paths, 100)
  assertEquals(result.length, 1)
  assertEquals(result[0]!.path, 'home')
})

Deno.test('Utils.computeTopLevelEntries - extracts unique top-level directories', () => {
  const paths = ['home/user/file.ts', 'home/other/file.ts', 'var/log/file.ts']
  const result = Utils.computeTopLevelEntries(paths, 100)
  assertEquals(result.length, 2)
  assertEquals(result[0]!.path, 'var')
  assertEquals(result[1]!.path, 'home')
})

Deno.test('Utils.computeTopLevelEntries - handles empty paths array', () => {
  const result = Utils.computeTopLevelEntries([], 100)
  assertEquals(result.length, 0)
})

Deno.test('Utils.computeTopLevelEntries - handles paths without separators', () => {
  const paths = ['file.ts', 'other.ts']
  const result = Utils.computeTopLevelEntries(paths, 100)
  assertEquals(result.length, 2)
  assertEquals(result[0]!.path, 'file.ts')
  assertEquals(result[1]!.path, 'other.ts')
})

Deno.test('Utils.computeTopLevelEntries - handles Windows paths', () => {
  const paths = ['C:', 'D:/Data']
  const result = Utils.computeTopLevelEntries(paths, 100)
  assertEquals(result.length, 2)
  assertEquals(result[0]!.path, 'C:')
  assertEquals(result[1]!.path, 'D:')
})

Deno.test('Utils.computeTopLevelEntries - respects limit parameter', () => {
  const paths = ['/a/file.ts', '/b/file.ts', '/c/file.ts', '/d/file.ts']
  const result = Utils.computeTopLevelEntries(paths, 2)
  assertEquals(result.length <= 2, true)
})

Deno.test('Utils.computeTopLevelEntries - returns score 0.0', () => {
  const paths = ['home/file.ts']
  const result = Utils.computeTopLevelEntries(paths, 100)
  assertEquals(result.length, 1)
  assertEquals(result[0]!.path, 'home')
  assertEquals(result[0]!.score, 0.0)
})

Deno.test('Utils.computeTopLevelEntries - sorts by length then alphabetically', () => {
  const paths = ['very/long/path/file.ts', 'a/file.ts', 'middle/path/file.ts']
  const result = Utils.computeTopLevelEntries(paths, 100)
  const pathsOnly = result.map((entry) => entry.path)
  assertEquals(pathsOnly[0], 'a')
  assertEquals(pathsOnly[1], 'very')
  assertEquals(pathsOnly[2], 'middle')
})
