# Scoring Algorithm

Fuzzy Finder uses a multi-factor scoring system combining bonuses and penalties.

## Score Components

### Base Match Score

Each matched character receives base points:

```
baseScore = matchCount * 16
```

### Bonus System

| Bonus               | Value | Condition                                    |
| ------------------- | ----- | -------------------------------------------- |
| **First Character** | +10   | First query char matches first path char     |
| **Boundary**        | +8    | Match after `/`, `-`, `_`, `.`, or space     |
| **CamelCase**       | +6    | lowercase → UPPERCASE transition             |
| **Consecutive**     | +7    | Character immediately follows previous match |

### Penalty System

| Penalty           | Value       | Condition                            |
| ----------------- | ----------- | ------------------------------------ |
| **Gap Start**     | -4          | Base penalty for gap between matches |
| **Gap Extension** | -1 per char | Additional penalty per gap character |
| **Length**        | -0 to -32   | Longer paths penalized (max -32)     |

### Test File Modifier

Paths containing "test" have final score multiplied by 0.95:

```typescript
score = path.includes('test') ? score * 0.95 : score
```

## Calculation Example

Query: `idx` on path: `src/index.ts`

| Char | Position | Bonus                       | Calculation        |
| ---- | -------- | --------------------------- | ------------------ |
| `i`  | 4        | First (+10) + Boundary (+8) | Match 16 + 18 = 34 |
| `d`  | 5        | Consecutive (+7)            | Match 16 + 7 = 23  |
| `x`  | 6        | Consecutive (+7)            | Match 16 + 7 = 23  |

**Subtotal:** 80

**Length penalty:** `max(0, 32 - (12 / 4))` = 29 (bonus, not penalty)

**Final score:** 80 + 29 = 109

## Score Normalization

Raw scores are normalized to 0-1 range for final output:

```typescript
positionScore = 1 - rankIndex / totalResults
finalScore = path.includes('test') ? positionScore * 0.95 : positionScore
```

## Implementation Details

See source:

- [<root>/src/scoring.ts](../src/scoring.ts) - Bonus calculation
- [<root>/src/core/searcher.ts](../src/core/searcher.ts) - Score aggregation
- [<root>/src/constants.ts](../src/constants.ts) - All weight values
