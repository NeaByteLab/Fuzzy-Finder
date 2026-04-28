import Config from '@app/constants.ts'

/**
 * Fuzzy match scoring utilities.
 * @description Calculates score bonuses for match positions.
 */
export default class Scoring {
  /**
   * Check if character is a path boundary.
   * @description Matches slash, dash, underscore, dot, or space.
   * @param charCode - Unicode code point to check
   * @returns True if character is a boundary
   */
  static isBoundary(charCode: number): boolean {
    return (
      charCode === 47 ||
      charCode === 92 ||
      charCode === 45 ||
      charCode === 95 ||
      charCode === 46 ||
      charCode === 32
    )
  }

  /**
   * Check if character is lowercase.
   * @description Matches a-z ASCII range.
   * @param charCode - Unicode code point to check
   * @returns True if character is lowercase
   */
  static isLower(charCode: number): boolean {
    return charCode >= 97 && charCode <= 122
  }

  /**
   * Check if character is uppercase.
   * @description Matches A-Z ASCII range.
   * @param charCode - Unicode code point to check
   * @returns True if character is uppercase
   */
  static isUpper(charCode: number): boolean {
    return charCode >= 65 && charCode <= 90
  }

  /**
   * Calculate bonus score for match position.
   * @description Awards bonus for boundaries and camelCase.
   * @param path - Full file path being searched
   * @param position - Index of matched character
   * @param isFirst - Whether this is first query character
   * @returns Bonus score value
   */
  static scoreBonusAt(path: string, position: number, isFirst: boolean): number {
    if (position === 0) {
      return isFirst ? Config.bonusFirst : 0
    }
    const prevChar = path.charCodeAt(position - 1)
    if (Scoring.isBoundary(prevChar)) {
      return Config.bonusBoundary
    }
    if (Scoring.isLower(prevChar) && Scoring.isUpper(path.charCodeAt(position))) {
      return Config.bonusCamel
    }
    return 0
  }
}
