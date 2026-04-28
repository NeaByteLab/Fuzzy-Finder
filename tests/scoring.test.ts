import { assertEquals } from '@std/assert'
import Scoring from '@app/scoring.ts'

Deno.test('Scoring.isBoundary - backslash is boundary', () => {
  assertEquals(Scoring.isBoundary(92), true)
})

Deno.test('Scoring.isBoundary - dash is boundary', () => {
  assertEquals(Scoring.isBoundary(45), true)
})

Deno.test('Scoring.isBoundary - dot is boundary', () => {
  assertEquals(Scoring.isBoundary(46), true)
})

Deno.test('Scoring.isBoundary - letter a is not boundary', () => {
  assertEquals(Scoring.isBoundary(97), false)
})

Deno.test('Scoring.isBoundary - number is not boundary', () => {
  assertEquals(Scoring.isBoundary(48), false)
})

Deno.test('Scoring.isBoundary - slash is boundary', () => {
  assertEquals(Scoring.isBoundary(47), true)
})

Deno.test('Scoring.isBoundary - space is boundary', () => {
  assertEquals(Scoring.isBoundary(32), true)
})

Deno.test('Scoring.isBoundary - underscore is boundary', () => {
  assertEquals(Scoring.isBoundary(95), true)
})

Deno.test('Scoring.isLower - lowercase a is lower', () => {
  assertEquals(Scoring.isLower(97), true)
})

Deno.test('Scoring.isLower - lowercase z is lower', () => {
  assertEquals(Scoring.isLower(122), true)
})

Deno.test('Scoring.isLower - number is not lower', () => {
  assertEquals(Scoring.isLower(48), false)
})

Deno.test('Scoring.isLower - uppercase A is not lower', () => {
  assertEquals(Scoring.isLower(65), false)
})

Deno.test('Scoring.isUpper - lowercase a is not upper', () => {
  assertEquals(Scoring.isUpper(97), false)
})

Deno.test('Scoring.isUpper - uppercase A is upper', () => {
  assertEquals(Scoring.isUpper(65), true)
})

Deno.test('Scoring.isUpper - uppercase Z is upper', () => {
  assertEquals(Scoring.isUpper(90), true)
})

Deno.test('Scoring.scoreBonusAt - camelCase transition gets camel bonus', () => {
  const bonus = Scoring.scoreBonusAt('myVariableName', 2, false)
  assertEquals(bonus, 6)
})

Deno.test('Scoring.scoreBonusAt - char after dot gets boundary bonus', () => {
  const bonus = Scoring.scoreBonusAt('file.txt', 5, false)
  assertEquals(bonus, 8)
})

Deno.test('Scoring.scoreBonusAt - char after slash gets boundary bonus', () => {
  const bonus = Scoring.scoreBonusAt('/src/index.ts', 5, false)
  assertEquals(bonus, 8)
})

Deno.test('Scoring.scoreBonusAt - first char at position 0 gets first bonus', () => {
  const bonus = Scoring.scoreBonusAt('/src/index.ts', 0, true)
  assertEquals(bonus, 10)
})

Deno.test('Scoring.scoreBonusAt - no bonus for regular position', () => {
  const bonus = Scoring.scoreBonusAt('index', 2, false)
  assertEquals(bonus, 0)
})

Deno.test('Scoring.scoreBonusAt - non-first char at position 0 gets no bonus', () => {
  const bonus = Scoring.scoreBonusAt('/src/index.ts', 0, false)
  assertEquals(bonus, 0)
})
