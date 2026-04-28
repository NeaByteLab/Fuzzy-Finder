import type * as Types from '@app/types.ts'
import Config from '@app/constants.ts'
import Scoring from '@app/scoring.ts'

/**
 * Fuzzy search implementation.
 * @description Finds and scores matching paths using fuzzy algorithm.
 */
export default class Searcher {
  /**
   * Search indexed paths with fuzzy matching.
   * @description Returns top N matches with scores.
   * @param state - Current index state
   * @param positionBuffer - Reusable array for match positions
   * @param query - Search string to match
   * @param limit - Maximum results to return
   * @param options - Optional search configuration
   * @returns Ranked search results
   */
  static search(
    state: Types.IndexState,
    positionBuffer: Int32Array,
    query: string,
    limit: number,
    options?: Types.SearchOptions
  ): Types.SearchResult[] {
    if (Number.isNaN(limit) || limit <= 0) {
      return []
    }
    if (query.length === 0) {
      if (state.topLevelCache) {
        return state.topLevelCache.slice(0, limit)
      }
      return []
    }
    const caseSensitive = query !== query.toLowerCase()
    const queryChars = caseSensitive ? query : query.toLowerCase()
    const queryLength = Math.min(queryChars.length, Config.maxQuery)
    const queryCharList: string[] = new Array(queryLength)
    let needleBitmap = 0
    for (let j = 0; j < queryLength; j++) {
      const char = queryChars.charAt(j)
      queryCharList[j] = char
      const charCode = char.charCodeAt(0)
      if (charCode >= 97 && charCode <= 122) {
        needleBitmap |= 1 << (charCode - 97)
      }
    }
    const scoreCeiling = queryLength * (Config.scoreMatch + Config.bonusBoundary) +
      Config.bonusFirst + 32
    const topMatches: Types.FuzzyMatch[] = []
    let threshold = -Infinity
    const { paths, lowerPaths, charBits, pathLengths, readyCount } = state
    outer: for (let i = 0; i < readyCount; i++) {
      if ((charBits[i]! & needleBitmap) !== needleBitmap) {
        continue
      }
      const searchContent = caseSensitive ? paths[i]! : lowerPaths[i]!
      let position = searchContent.indexOf(queryCharList[0]!)
      if (position === -1) {
        continue
      }
      positionBuffer[0] = position
      let gapPenalty = 0
      let consecutiveBonus = 0
      let previousPosition = position
      for (let j = 1; j < queryLength; j++) {
        position = searchContent.indexOf(queryCharList[j]!, previousPosition + 1)
        if (position === -1) {
          continue outer
        }
        positionBuffer[j] = position
        const gap = position - previousPosition - 1
        if (gap === 0) {
          consecutiveBonus += Config.bonusConsecutive
        } else {
          gapPenalty += Config.penaltyStart + gap * Config.penaltyExtension
        }
        previousPosition = position
      }
      if (
        topMatches.length === limit &&
        scoreCeiling + consecutiveBonus - gapPenalty <= threshold
      ) {
        continue
      }
      const path = paths[i]!
      const contentLength = pathLengths[i]!
      let score = queryLength * Config.scoreMatch + consecutiveBonus - gapPenalty
      score += Scoring.scoreBonusAt(path, positionBuffer[0]!, true)
      for (let j = 1; j < queryLength; j++) {
        score += Scoring.scoreBonusAt(path, positionBuffer[j]!, false)
      }
      score += Math.max(0, 32 - (contentLength >> 2))
      if (topMatches.length < limit) {
        const matchPositions = Array.from(positionBuffer.slice(0, queryLength))
        topMatches.push({ path, fuzzyScore: score, positions: matchPositions })
        if (topMatches.length === limit) {
          topMatches.sort((a, b) => a.fuzzyScore - b.fuzzyScore)
          threshold = topMatches[0]!.fuzzyScore
        }
      } else if (score > threshold) {
        let low = 0
        let high = topMatches.length
        while (low < high) {
          const midIndex = (low + high) >> 1
          if (topMatches[midIndex]!.fuzzyScore < score) {
            low = midIndex + 1
          } else {
            high = midIndex
          }
        }
        const matchPositions = Array.from(positionBuffer.slice(0, queryLength))
        topMatches.splice(low, 0, { path, fuzzyScore: score, positions: matchPositions })
        topMatches.shift()
        threshold = topMatches[0]!.fuzzyScore
      }
    }
    topMatches.sort((a, b) => b.fuzzyScore - a.fuzzyScore)
    const matchCount = topMatches.length
    const totalCount = Math.max(matchCount, 1)
    const results: Types.SearchResult[] = new Array(matchCount)
    const includePositions = options?.includePositions ?? false
    for (let i = 0; i < matchCount; i++) {
      const match = topMatches[i]!
      const path = match.path
      const positionScore = 1 - i / totalCount
      const finalScore = path.includes('test') ? Math.max(positionScore * 0.95, 0.0) : positionScore
      if (includePositions) {
        results[i] = { path, score: finalScore, positions: match.positions }
      } else {
        results[i] = { path, score: finalScore }
      }
    }
    return results
  }
}
