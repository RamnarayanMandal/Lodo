# Complete Ludo Path Map with Arrows

This document shows the exact movement paths for all four colors with numbered tiles and arrow directions.

## Movement Rules Summary

1. **Starting from Home**: Each player starts in their color's home base (position -1). Can only move out after rolling a 6.
2. **Main Track**: 52 positions (0-51) going clockwise around the board.
3. **Home Stretch**: 6 positions (52-57) for each color, leading to center.
4. **Direction Rules**:
   - 🟥 **Red** → Moves **DOWNWARDS** into center
   - 🟩 **Green** → Moves **LEFTWARDS** into center
   - 🟨 **Yellow** → Moves **UPWARDS** into center
   - 🟦 **Blue** → Moves **RIGHTWARDS** into center

## Complete Path Arrays

### 🟥 RED Path (0-57)
```
Track Positions (0-51):
  0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
  ↓
  13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25
  ↓
  26 → 27 → 28 → 29 → 30 → 31 → 32 → 33 → 34 → 35 → 36 → 37 → 38
  ↓
  39 → 40 → 41 → 42 → 43 → 44 → 45 → 46 → 47 → 48 → 49 → 50 → 51
  ↓
Home Stretch (52-57) - DOWNWARDS:
  52 → 53 → 54 → 55 → 56 → 57 → CENTER
```

### 🟩 GREEN Path (13-69)
```
Track Positions (0-51):
  Start at position 13:
  13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25
  ↓
  26 → 27 → 28 → 29 → 30 → 31 → 32 → 33 → 34 → 35 → 36 → 37 → 38
  ↓
  39 → 40 → 41 → 42 → 43 → 44 → 45 → 46 → 47 → 48 → 49 → 50 → 51
  ↓
  0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
  ↓
Home Stretch (64-69) - LEFTWARDS:
  64 → 65 → 66 → 67 → 68 → 69 → CENTER
```

### 🟨 YELLOW Path (26-75)
```
Track Positions (0-51):
  Start at position 26:
  26 → 27 → 28 → 29 → 30 → 31 → 32 → 33 → 34 → 35 → 36 → 37 → 38
  ↓
  39 → 40 → 41 → 42 → 43 → 44 → 45 → 46 → 47 → 48 → 49 → 50 → 51
  ↓
  0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
  ↓
  13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25
  ↓
Home Stretch (70-75) - UPWARDS:
  70 → 71 → 72 → 73 → 74 → 75 → CENTER
```

### 🟦 BLUE Path (39-63)
```
Track Positions (0-51):
  Start at position 39:
  39 → 40 → 41 → 42 → 43 → 44 → 45 → 46 → 47 → 48 → 49 → 50 → 51
  ↓
  0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 → 12
  ↓
  13 → 14 → 15 → 16 → 17 → 18 → 19 → 20 → 21 → 22 → 23 → 24 → 25
  ↓
  26 → 27 → 28 → 29 → 30 → 31 → 32 → 33 → 34 → 35 → 36 → 37 → 38
  ↓
Home Stretch (58-63) - RIGHTWARDS:
  58 → 59 → 60 → 61 → 62 → 63 → CENTER
```

## Visual Path Diagram

```
        🟩 GREEN (Top-Right)        🟩 GREEN START (13)
              ↓
    [64] ← [65] ← [66] ← [67] ← [68] ← [69] → CENTER
              ↑
    [0] → [1] → [2] → ... → [12]
    ↑                         ↓
    [51] ← [50] ← [49] ← ... ← [13] ← GREEN START
    ↑                         ↓
    [52] → [53] → [54] → [55] → [56] → [57] → CENTER
    ↓                         ↑
    RED START (0)        [26] → [27] → [28] → [29] → [30] → [31]
    ↓                         ↓
    [38] ← [37] ← [36] ← [35] ← [34] ← [33] ← [32]
    ↑                         ↑
    [39] → [40] → [41] → [42] → [43] → [44]
    ↓                         ↓
    BLUE START (39)      [45] → [46] → [47] → [48] → [49] → [50] → [51]
    ↓
    [58] → [59] → [60] → [61] → [62] → [63] → CENTER
        🟦 BLUE (Bottom-Left)          🟦 BLUE MOVES RIGHT
```

## Complete Coordinate Map

### Main Track (0-51) - Clockwise Direction

| Position | Red Track | Green Track | Yellow Track | Blue Track |
|----------|-----------|-------------|--------------|------------|
| 0 | 🟥 Start | Position 38 | Position 13 | Position 26 |
| 1 | Track 1 | Position 39 | Position 14 | Position 27 |
| 2 | Track 2 | Position 40 | Position 15 | Position 28 |
| ... | ... | ... | ... | ... |
| 12 | Track 12 | Position 50 | Position 25 | Position 38 |
| 13 | Track 13 | 🟩 Start | Position 0 | Position 39 |
| 14 | Track 14 | Track 1 | Position 1 | Position 40 |
| ... | ... | ... | ... | ... |
| 25 | Track 25 | Track 12 | Position 12 | Position 51 |
| 26 | Track 26 | Track 13 | 🟨 Start | Position 0 |
| 27 | Track 27 | Track 14 | Track 1 | Position 1 |
| ... | ... | ... | ... | ... |
| 38 | Track 38 | Track 25 | Track 12 | Position 12 |
| 39 | Track 39 | Track 26 | Track 13 | 🟦 Start |
| 40 | Track 40 | Track 27 | Track 14 | Track 1 |
| ... | ... | ... | ... | ... |
| 51 | Track 51 | Track 38 | Track 25 | Track 12 |

### Home Stretch (52-75)

| Color | Positions | Direction | End Point |
|-------|-----------|-----------|-----------|
| 🟥 Red | 52-57 | ⬇️ DOWNWARDS | Center |
| 🟦 Blue | 58-63 | ➡️ RIGHTWARDS | Center |
| 🟩 Green | 64-69 | ⬅️ LEFTWARDS | Center |
| 🟨 Yellow | 70-75 | ⬆️ UPWARDS | Center |

## Arrow Markers for Visualization

### RED (⬇️ Downwards to Center)
```
Position 52 → 53 → 54 → 55 → 56 → 57
   ↓        ↓     ↓     ↓     ↓     ↓
[CENTER]
```

### GREEN (⬅️ Leftwards to Center)
```
Position 64 → 65 → 66 → 67 → 68 → 69
   ←        ←     ←     ←     ←     ←
[CENTER]
```

### YELLOW (⬆️ Upwards to Center)
```
Position 70 → 71 → 72 → 73 → 74 → 75
   ↑        ↑     ↑     ↑     ↑     ↑
[CENTER]
```

### BLUE (➡️ Rightwards to Center)
```
Position 58 → 59 → 60 → 61 → 62 → 63
   →        →     →     →     →     →
[CENTER]
```

## Movement Flow Summary

1. **Home Base (-1)** → Roll 6 → **Start Position (0 for each color)**
2. **Track (0-51)** → Move clockwise → **Complete one full circle**
3. **Enter Home Stretch** → After completing track → **Move in color-specific direction**
4. **Reach Center** → Complete home stretch → **Win condition**

## Key Points

- All players move **clockwise** on the main track (0-51)
- Each color's position 0 = their own start position on the track
- After position 51, players enter their respective home stretch
- Home stretch direction is **fixed** for each color as per standard Ludo rules
- Cursor/piece should follow this exact path with smooth animation


