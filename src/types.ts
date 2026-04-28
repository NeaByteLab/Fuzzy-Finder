/**
 * Internal fuzzy match with raw score.
 * @description Holds match data before final ranking.
 */
export type FuzzyMatch = {
  /** Matched file path */
  path: string
  /** Raw calculated match score */
  fuzzyScore: number
  /** Indices of matched characters */
  positions: number[]
}

/**
 * Internal index state container.
 * @description Stores indexed paths and computed metadata.
 */
export type IndexState = {
  /** Original file paths */
  paths: string[]
  /** Lowercase versions for search */
  lowerPaths: string[]
  /** Bitmask of characters per path */
  charBits: Int32Array
  /** Length of each path string */
  pathLengths: Uint16Array
  /** Number of paths fully indexed */
  readyCount: number
  /** Cached top-level directory list */
  topLevelCache: SearchResult[] | null
}

/**
 * Async loading progress promises.
 * @description Tracks when index is queryable and complete.
 */
export type LoadResult = {
  /** Resolves when index ready for queries */
  queryable: Promise<void>
  /** Resolves when indexing finished */
  done: Promise<void>
}

/**
 * Search behavior configuration.
 * @description Optional flags for search customization.
 */
export type SearchOptions = {
  /** Include match position arrays */
  includePositions?: boolean
}

/**
 * Single search result entry.
 * @description Final ranked result with normalized score.
 */
export type SearchResult = {
  /** Matched file path */
  path: string
  /** Normalized match score 0-1 */
  score: number
  /** Match character positions if requested */
  positions?: number[]
}
