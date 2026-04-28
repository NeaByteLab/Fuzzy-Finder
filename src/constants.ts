/**
 * Scoring and limit configuration constants.
 * @description Defines fuzzy match scoring weights and limits.
 */
export default class Config {
  /** Score bonus at path boundaries */
  static readonly bonusBoundary = 8
  /** Score bonus for camelCase matches */
  static readonly bonusCamel = 6
  /** Score bonus for consecutive matches */
  static readonly bonusConsecutive = 7
  /** Score bonus for first character match */
  static readonly bonusFirst = 10
  /** Maximum cached top-level entries */
  static readonly cacheLimit = 100
  /** Chunk processing time limit in ms */
  static readonly chunkMs = 4
  /** Maximum query length allowed */
  static readonly maxQuery = 64
  /** Gap penalty multiplier per char */
  static readonly penaltyExtension = 1
  /** Base gap penalty for match gaps */
  static readonly penaltyStart = 4
  /** Base score for each matched char */
  static readonly scoreMatch = 16
}
