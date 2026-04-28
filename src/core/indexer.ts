import type * as Types from '@app/types.ts'
import Config from '@app/constants.ts'
import Utils from '@app/utils.ts'

/**
 * Path indexing operations.
 * @description Builds and manages the searchable path index.
 */
export default class Indexer {
  /**
   * Build complete index from paths.
   * @description Indexes all paths and marks ready.
   * @param state - Index state to populate
   */
  static buildIndex(state: Types.IndexState): void {
    for (let i = 0; i < state.paths.length; i++) {
      Indexer.indexPath(state, i)
    }
    state.readyCount = state.paths.length
  }

  /** Create empty initial index state */
  static createInitialState(): Types.IndexState {
    return {
      paths: [],
      lowerPaths: [],
      charBits: new Int32Array(0),
      pathLengths: new Uint16Array(0),
      readyCount: 0,
      topLevelCache: null
    }
  }

  /**
   * Index single path at position.
   * @description Computes lowercase and char bitmask.
   * @param state - Index state to update
   * @param i - Path index to process
   */
  static indexPath(state: Types.IndexState, i: number): void {
    const lowerPath = state.paths[i]!.toLowerCase()
    state.lowerPaths[i] = lowerPath
    const length = lowerPath.length
    state.pathLengths[i] = length
    let pathCharBits = 0
    for (let j = 0; j < length; j++) {
      const charCode = lowerPath.charCodeAt(j)
      if (charCode >= 97 && charCode <= 122) {
        pathCharBits |= 1 << (charCode - 97)
      }
    }
    state.charBits[i] = pathCharBits
  }

  /**
   * Reset arrays for new path list.
   * @description Allocates new arrays and builds top-level cache.
   * @param state - Index state to reset
   * @param paths - New file paths to index
   */
  static resetArrays(state: Types.IndexState, paths: string[]): void {
    const pathCount = paths.length
    state.paths = paths
    state.lowerPaths = new Array(pathCount)
    state.charBits = new Int32Array(pathCount)
    state.pathLengths = new Uint16Array(pathCount)
    state.readyCount = 0
    state.topLevelCache = Utils.computeTopLevelEntries(paths, Config.cacheLimit)
  }
}
