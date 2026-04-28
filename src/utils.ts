import type * as Types from '@app/types.ts'
import Config from '@app/constants.ts'

/**
 * General utility functions.
 * @description Shared helper methods for indexing and async.
 */
export default class Utils {
  /**
   * Extract top-level directories from paths.
   * @description Returns unique root segments for empty query.
   * @param paths - Array of file paths to analyze
   * @param limit - Maximum entries to return
   * @returns Sorted top-level path segments
   */
  static computeTopLevelEntries(
    paths: string[],
    limit: number = Config.cacheLimit
  ): Types.SearchResult[] {
    const topLevel = new Set<string>()
    for (const path of paths) {
      let segmentEnd = path.length
      for (let i = 0; i < path.length; i++) {
        const charCode = path.charCodeAt(i)
        if (charCode === 47 || charCode === 92) {
          segmentEnd = i
          break
        }
      }
      const pathSegment = path.slice(0, segmentEnd)
      if (pathSegment.length > 0) {
        topLevel.add(pathSegment)
        if (topLevel.size >= limit) {
          break
        }
      }
    }
    const sortedSegments = Array.from(topLevel)
    sortedSegments.sort((a, b) => {
      const lengthDiff = a.length - b.length
      if (lengthDiff !== 0) {
        return lengthDiff
      }
      return a < b ? -1 : a > b ? 1 : 0
    })
    return sortedSegments.slice(0, limit).map((path) => ({ path, score: 0.0 }))
  }

  /** Yield execution to event loop */
  static yieldToEventLoop(): Promise<void> {
    return new Promise((resolve) => {
      if (typeof queueMicrotask === 'function') {
        queueMicrotask(resolve)
      } else {
        setTimeout(resolve, 0)
      }
    })
  }
}
