# Complete Ludo Path Coordinates Map

This document provides the complete coordinate mapping for all four colors with exact positions, directions, and arrows.

## 🟥 RED Path (Positions 0-57)

### Main Track (0-51) - Clockwise
Starting Position: **0** (Left-middle, row 0, col 1)

| Position | Logical Position | Container | Row | Col | Direction |
|----------|------------------|-----------|-----|-----|-----------|
| 0 | 0 (RED START) | left-middle | 0 | 1 | → |
| 1 | 1 | left-middle | 1 | 1 | → |
| 2 | 2 | left-middle | 1 | 2 | → |
| 3 | 3 | left-middle | 1 | 3 | → |
| 4 | 4 | left-middle | 1 | 4 | → |
| 5 | 5 | left-middle | 1 | 5 | ↓ |
| 6 | 6 | top-middle | 0 | 0 | ↓ |
| 7 | 7 | top-middle | 0 | 1 | ↓ |
| 8 | 8 | top-middle | 0 | 2 | ↓ |
| 9 | 9 | top-middle | 1 | 0 | ↓ |
| 10 | 10 | top-middle | 1 | 2 | ↓ |
| 11 | 11 | top-middle | 2 | 0 | ↓ |
| 12 | 12 | top-middle | 2 | 2 | → |
| 13 | 13 | top-middle | 1 | 1 | → |
| ... | ... | ... | ... | ... | ... |
| 51 | 51 | left-middle | 2 | 2 | ↓ |

### Home Stretch (52-57) - ⬇️ DOWNWARDS to Center

| Position | Index | Container | Row | Col | Direction |
|----------|-------|-----------|-----|-----|-----------|
| 52 | 0 | left-middle | 0 | 1 | ↓ |
| 53 | 1 | left-middle | 1 | 1 | ↓ |
| 54 | 2 | left-middle | 2 | 1 | ↓ |
| 55 | 3 | left-middle | 3 | 1 | ↓ |
| 56 | 4 | left-middle | 4 | 1 | ↓ |
| 57 | 5 | left-middle | 5 | 1 | ↓ |

**Direction Flow:**
```
Position 52 → 53 → 54 → 55 → 56 → 57 → CENTER
   ↓        ↓     ↓     ↓     ↓     ↓
[START] → [Pos1] → [Pos2] → [Pos3] → [Pos4] → [Pos5] → [🏁]
```

## 🟩 GREEN Path (Positions 13-69)

### Main Track (0-51) - Clockwise
Starting Position: **13** (Top-middle, row 1, col 1)

| Position | Logical Position | Container | Row | Col | Direction |
|----------|------------------|-----------|-----|-----|-----------|
| 0 | 13 (GREEN START) | top-middle | 1 | 1 | → |
| 1 | 14 | top-middle | 1 | 2 | ↓ |
| 2 | 15 | top-middle | 2 | 1 | ↓ |
| 3 | 16 | top-middle | 3 | 1 | ↓ |
| 4 | 17 | top-middle | 4 | 1 | ↓ |
| 5 | 18 | top-middle | 5 | 1 | → |
| ... | ... | ... | ... | ... | ... |
| 38 | 51 | left-middle | 2 | 2 | → |
| 39 | 0 | left-middle | 0 | 1 | → |
| 40 | 1 | left-middle | 1 | 1 | → |
| ... | ... | ... | ... | ... | ... |
| 51 | 12 | top-middle | 2 | 2 | ← |

### Home Stretch (64-69) - ⬅️ LEFTWARDS to Center

| Position | Index | Container | Row | Col | Direction |
|----------|-------|-----------|-----|-----|-----------|
| 64 | 0 | top-middle | 1 | 2 | ← |
| 65 | 1 | top-middle | 1 | 1 | ← |
| 66 | 2 | top-middle | 2 | 1 | ← |
| 67 | 3 | top-middle | 3 | 1 | ← |
| 68 | 4 | top-middle | 4 | 1 | ← |
| 69 | 5 | top-middle | 5 | 1 | ← |

**Direction Flow:**
```
Position 64 → 65 → 66 → 67 → 68 → 69 → CENTER
   ←        ←     ←     ←     ←     ←
[START] ← [Pos1] ← [Pos2] ← [Pos3] ← [Pos4] ← [Pos5] ← [🏁]
```

## 🟨 YELLOW Path (Positions 26-75)

### Main Track (0-51) - Clockwise
Starting Position: **26** (Right-middle, row 1, col 0)

| Position | Logical Position | Container | Row | Col | Direction |
|----------|------------------|-----------|-----|-----|-----------|
| 0 | 26 (YELLOW START) | right-middle | 1 | 0 | → |
| 1 | 27 | right-middle | 1 | 1 | → |
| 2 | 28 | right-middle | 1 | 2 | → |
| 3 | 29 | right-middle | 1 | 3 | → |
| 4 | 30 | right-middle | 1 | 4 | ↓ |
| 5 | 31 | right-middle | 2 | 4 | ← |
| ... | ... | ... | ... | ... | ... |
| 38 | 0 | left-middle | 0 | 1 | → |
| 39 | 1 | left-middle | 1 | 1 | → |
| ... | ... | ... | ... | ... | ... |
| 51 | 13 | top-middle | 1 | 1 | ↑ |

### Home Stretch (70-75) - ⬆️ UPWARDS to Center

| Position | Index | Container | Row | Col | Direction |
|----------|-------|-----------|-----|-----|-----------|
| 70 | 0 | right-middle | 1 | 4 | ↑ |
| 71 | 1 | right-middle | 1 | 3 | ↑ |
| 72 | 2 | right-middle | 1 | 2 | ↑ |
| 73 | 3 | right-middle | 1 | 1 | ↑ |
| 74 | 4 | right-middle | 1 | 0 | ↑ |
| 75 | 5 | right-middle | 2 | 4 | ↑ |

**Direction Flow:**
```
Position 70 → 71 → 72 → 73 → 74 → 75 → CENTER
   ↑        ↑     ↑     ↑     ↑     ↑
[START] ↑ [Pos1] ↑ [Pos2] ↑ [Pos3] ↑ [Pos4] ↑ [Pos5] ↑ [🏁]
```

## 🟦 BLUE Path (Positions 39-63)

### Main Track (0-51) - Clockwise
Starting Position: **39** (Bottom-middle, row 0, col 1)

| Position | Logical Position | Container | Row | Col | Direction |
|----------|------------------|-----------|-----|-----|-----------|
| 0 | 39 (BLUE START) | bottom-middle | 0 | 1 | ↓ |
| 1 | 40 | bottom-middle | 1 | 1 | ↓ |
| 2 | 41 | bottom-middle | 2 | 1 | ↓ |
| 3 | 42 | bottom-middle | 3 | 1 | → |
| 4 | 43 | bottom-middle | 4 | 0 | → |
| 5 | 44 | bottom-middle | 4 | 1 | ↑ |
| ... | ... | ... | ... | ... | ... |
| 38 | 13 | top-middle | 1 | 1 | → |
| 39 | 14 | top-middle | 1 | 2 | ↓ |
| ... | ... | ... | ... | ... | ... |
| 51 | 26 | right-middle | 1 | 0 | → |

### Home Stretch (58-63) - ➡️ RIGHTWARDS to Center

| Position | Index | Container | Row | Col | Direction |
|----------|-------|-----------|-----|-----|-----------|
| 58 | 0 | bottom-middle | 0 | 1 | → |
| 59 | 1 | bottom-middle | 1 | 1 | → |
| 60 | 2 | bottom-middle | 2 | 1 | → |
| 61 | 3 | bottom-middle | 3 | 1 | → |
| 62 | 4 | bottom-middle | 4 | 0 | → |
| 63 | 5 | bottom-middle | 4 | 1 | → |

**Direction Flow:**
```
Position 58 → 59 → 60 → 61 → 62 → 63 → CENTER
   →        →     →     →     →     →
[START] → [Pos1] → [Pos2] → [Pos3] → [Pos4] → [Pos5] → [🏁]
```

## Complete Path Summary

### All Colors Main Track (0-51) - Clockwise Direction
```
RED:    Position 0  → ... → Position 51
GREEN:  Position 13 → ... → Position 12 (wraps)
YELLOW: Position 26 → ... → Position 25 (wraps)
BLUE:   Position 39 → ... → Position 38 (wraps)
```

### All Colors Home Stretch (52-75) - Color-Specific Direction

| Color | Positions | Direction | Arrow |
|-------|-----------|-----------|-------|
| 🟥 RED | 52-57 | ⬇️ DOWNWARDS | ↓ |
| 🟦 BLUE | 58-63 | ➡️ RIGHTWARDS | → |
| 🟩 GREEN | 64-69 | ⬅️ LEFTWARDS | ← |
| 🟨 YELLOW | 70-75 | ⬆️ UPWARDS | ↑ |

## Visual Path Flow Diagram

```
        🟩 GREEN (Top-Right)        Position 13 (GREEN START)
              ↓
    [64] ← [65] ← [66] ← [67] ← [68] ← [69] → CENTER
    ↑         ←         ←         ←         ←
    ↓
    [0] → [1] → [2] → [3] → [4] → [5] → [6] → [7] → ... → [12]
    ↑         RED START (0)                           ↓
    ↓
    [38] ← [37] ← [36] ← [35] ← [34] ← [33] ← [32] ← [31]
    ↑                                              ↓
    [39] → [40] → [41] → [42] → [43] → [44] → ... → [51]
    ↓         BLUE START (39)                      ↑
    ↓
    [58] → [59] → [60] → [61] → [62] → [63] → CENTER
        🟦 BLUE (Bottom-Left)          BLUE MOVES RIGHT →

    [26] → [27] → [28] → [29] → [30] → [31]
    ↑         YELLOW START (26)                   ↓
    ↓
    [70] → [71] → [72] → [73] → [74] → [75] → CENTER
        🟨 YELLOW (Bottom-Right)        YELLOW MOVES UP ↑
```

## Key Rules

1. **Start from Home**: Position -1 (home base) → Roll 6 → Position 0 (start on track)
2. **Main Track**: Positions 0-51 go clockwise around the board
3. **Home Stretch**: After completing track (position 51), enter home stretch at position 52+
4. **Direction**: Each color's home stretch moves toward center in its specific direction:
   - RED: Down (↓)
   - GREEN: Left (←)
   - YELLOW: Up (↑)
   - BLUE: Right (→)

## Usage

This coordinate map can be used to:
- Visualize the complete path for each color
- Debug position calculations
- Create path animations
- Verify movement logic
- Render arrow markers showing direction flow


