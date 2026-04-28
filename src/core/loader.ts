import type * as Types from '@app/types.ts'
import Config from '@app/constants.ts'
import Utils from '@app/utils.ts'

/**
 * Async file list loading.
 * @description Chunked indexing with non-blocking yields.
 */
export default class Loader {
  /**
   * Build index asynchronously.
   * @description Processes paths in chunks to prevent blocking.
   * @param fileList - Raw file paths from user
   * @param resetArrays - Callback to reset index arrays
   * @param indexPath - Callback to index single path
   * @param setReadyCount - Callback to update progress
   * @returns Promise tracking queryable and done states
   */
  static buildAsync(
    fileList: string[],
    resetArrays: (paths: string[]) => void,
    indexPath: (i: number) => void,
    setReadyCount: (count: number) => void
  ): Types.LoadResult {
    let resolveQueryable: () => void = () => {}
    const queryablePromise = new Promise<void>((resolve) => {
      resolveQueryable = resolve
    })
    const donePromise = (async () => {
      const paths = Loader.deduplicatePaths(fileList)
      resetArrays(paths)
      let chunkStart = performance.now()
      let firstChunk = true
      for (let i = 0; i < paths.length; i++) {
        indexPath(i)
        if ((i & 0xff) === 0xff && performance.now() - chunkStart > Config.chunkMs) {
          setReadyCount(i + 1)
          if (firstChunk) {
            resolveQueryable()
            firstChunk = false
          }
          await Utils.yieldToEventLoop()
          chunkStart = performance.now()
        }
      }
      setReadyCount(paths.length)
      resolveQueryable()
    })()
    return { queryable: queryablePromise, done: donePromise }
  }

  /**
   * Remove duplicate paths from list.
   * @description Filters empty strings and duplicates.
   * @param fileList - Array of file paths
   * @returns Deduplicated path array
   */
  static deduplicatePaths(fileList: string[]): string[] {
    const seenPaths = new Set<string>()
    const paths: string[] = []
    for (const filePath of fileList) {
      if (typeof filePath === 'string' && filePath.length > 0 && !seenPaths.has(filePath)) {
        seenPaths.add(filePath)
        paths.push(filePath)
      }
    }
    return paths
  }
}
