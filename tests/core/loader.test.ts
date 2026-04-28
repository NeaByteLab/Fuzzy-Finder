import { assertEquals } from '@std/assert'
import Loader from '@app/core/loader.ts'

Deno.test('Loader.buildAsync - deduplicates before indexing', async () => {
  const indexedPaths: string[] = []
  const input = ['/a.ts', '/a.ts', '/b.ts']
  const resetArrays = (p: string[]) => {
    indexedPaths.push(...p)
  }
  const indexPath = (_i: number) => {}
  const setReadyCount = (_count: number) => {}
  const result = Loader.buildAsync(input, resetArrays, indexPath, setReadyCount)
  await result.done
  assertEquals(indexedPaths, ['/a.ts', '/b.ts'])
})

Deno.test('Loader.buildAsync - done resolves when complete', async () => {
  let finalCount = 0
  const paths = ['/a.ts', '/b.ts', '/c.ts']
  const resetArrays = (_p: string[]) => {}
  const indexPath = (_i: number) => {}
  const setReadyCount = (count: number) => {
    finalCount = count
  }
  const result = Loader.buildAsync(paths, resetArrays, indexPath, setReadyCount)
  await result.done
  assertEquals(finalCount, 3)
})

Deno.test('Loader.buildAsync - queryable resolves after first chunk', async () => {
  let indexedCount = 0
  const paths: string[] = []
  for (let i = 0; i < 300; i++) {
    paths.push(`/file${i}.ts`)
  }
  const resetArrays = (p: string[]) => {
    paths.length = p.length
  }
  const indexPath = (_i: number) => {
    indexedCount++
  }
  const setReadyCount = (_count: number) => {}
  const result = Loader.buildAsync(paths, resetArrays, indexPath, setReadyCount)
  await result.queryable
  assertEquals(indexedCount > 0, true)
  await result.done
})

Deno.test('Loader.buildAsync - returns queryable and done promises', () => {
  const resetArrays = (_paths: string[]) => {}
  const indexPath = (_i: number) => {}
  const setReadyCount = (_count: number) => {}
  const result = Loader.buildAsync(['/a.ts'], resetArrays, indexPath, setReadyCount)
  assertEquals(result.queryable instanceof Promise, true)
  assertEquals(result.done instanceof Promise, true)
})

Deno.test('Loader.deduplicatePaths - all duplicates removed', () => {
  const input = ['/x.ts', '/x.ts', '/x.ts']
  const result = Loader.deduplicatePaths(input)
  assertEquals(result, ['/x.ts'])
})

Deno.test('Loader.deduplicatePaths - handles empty array', () => {
  const result = Loader.deduplicatePaths([])
  assertEquals(result, [])
})

Deno.test('Loader.deduplicatePaths - handles single item', () => {
  const result = Loader.deduplicatePaths(['/file.ts'])
  assertEquals(result, ['/file.ts'])
})

Deno.test('Loader.deduplicatePaths - maintains order', () => {
  const input = ['/c.ts', '/a.ts', '/b.ts']
  const result = Loader.deduplicatePaths(input)
  assertEquals(result, ['/c.ts', '/a.ts', '/b.ts'])
})

Deno.test('Loader.deduplicatePaths - removes duplicates', () => {
  const input = ['/a.ts', '/b.ts', '/a.ts', '/c.ts']
  const result = Loader.deduplicatePaths(input)
  assertEquals(result, ['/a.ts', '/b.ts', '/c.ts'])
})

Deno.test('Loader.deduplicatePaths - removes empty strings', () => {
  const input = ['/a.ts', '', '/b.ts', '']
  const result = Loader.deduplicatePaths(input)
  assertEquals(result, ['/a.ts', '/b.ts'])
})
