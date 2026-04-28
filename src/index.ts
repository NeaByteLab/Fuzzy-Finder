import type * as Types from '@app/types.ts'
import * as Core from '@app/core/index.ts'
import Config from '@app/constants.ts'

/**
 * Main file index for fuzzy searching.
 * @description Manages file list indexing and search operations.
 */
export class FuzzyFinder {
  /** Current index state with paths and metadata */
  private state: Types.IndexState
  /** Reusable buffer for match positions */
  private positionBuffer: Int32Array

  /** Initialize empty fuzzy finder */
  constructor() {
    this.state = Core.Indexer.createInitialState()
    this.positionBuffer = new Int32Array(Config.maxQuery)
  }

  /**
   * Load files synchronously.
   * @description Deduplicates and indexes file list immediately.
   * @param fileList - Array of file paths to index
   */
  load(fileList: string[]): void {
    const paths = Core.Loader.deduplicatePaths(fileList)
    Core.Indexer.resetArrays(this.state, paths)
    Core.Indexer.buildIndex(this.state)
  }

  /**
   * Load files asynchronously with chunked processing.
   * @description Indexes large file lists without blocking.
   * @param fileList - Array of file paths to index
   * @returns Promise wrappers for progress tracking
   */
  loadAsync(fileList: string[]): Types.LoadResult {
    return Core.Loader.buildAsync(
      fileList,
      (paths) => Core.Indexer.resetArrays(this.state, paths),
      (i) => Core.Indexer.indexPath(this.state, i),
      (count) => {
        this.state.readyCount = count
      }
    )
  }

  /**
   * Search indexed files with fuzzy matching.
   * @description Returns ranked results matching query.
   * @param query - Search string to match against paths
   * @param limit - Maximum results to return
   * @param options - Optional search configuration
   * @returns Ranked search results with scores
   */
  search(query: string, limit: number, options?: Types.SearchOptions): Types.SearchResult[] {
    return Core.Searcher.search(this.state, this.positionBuffer, query, limit, options)
  }
}

/** Default fuzzy finder class export */
export default FuzzyFinder

/** Type alias for FuzzyFinder class */
export type { FuzzyFinder as FuzzyFinderType }

/** Re-exported search types */
export type * from '@app/types.ts'
