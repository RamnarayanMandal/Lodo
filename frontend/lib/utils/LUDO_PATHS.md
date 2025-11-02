# Ludo Game Movement Paths

This document describes the correct movement paths for each color in the Ludo game, based on the standard 15x15 grid board layout.

## Path Structure Overview

- **Main Track**: 52 positions (0-51) going clockwise around the board
- **Home Stretch**: 6 positions (52-57 for Red, 58-63 for Blue, 64-69 for Green, 70-75 for Yellow)
- **Home Base**: Position -1 (piece not on board)

## Color-Specific Starting Positions

Each color starts at a different position on the main track:

### RED
- **Track Start Position**: 0
- **Grid Coordinates**: Row 8, Column 6
- **Home Stretch**: Vertical column (Rows 2-7, Column 7) - moves **upwards**
  - Position 52 → Row 7, Col 7
  - Position 53 → Row 6, Col 7
  - Position 54 → Row 5, Col 7
  - Position 55 → Row 4, Col 7
  - Position 56 → Row 3, Col 7
  - Position 57 → Row 2, Col 7 (final before center)

### GREEN
- **Track Start Position**: 13
- **Grid Coordinates**: Row 1, Column 7
- **Home Stretch**: Horizontal row (Row 7, Columns 2-7) - moves **leftwards**
  - Position 64 → Row 7, Col 7
  - Position 65 → Row 7, Col 6
  - Position 66 → Row 7, Col 5
  - Position 67 → Row 7, Col 4
  - Position 68 → Row 7, Col 3
  - Position 69 → Row 7, Col 2 (final before center)

### YELLOW
- **Track Start Position**: 26
- **Grid Coordinates**: Row 7, Column 10
- **Home Stretch**: Vertical column (Rows 2-7, Column 9) - moves **upwards**
  - Position 70 → Row 7, Col 9
  - Position 71 → Row 6, Col 9
  - Position 72 → Row 5, Col 9
  - Position 73 → Row 4, Col 9
  - Position 74 → Row 3, Col 9
  - Position 75 → Row 2, Col 9 (final before center)

### BLUE
- **Track Start Position**: 39
- **Grid Coordinates**: Row 10, Column 9
- **Home Stretch**: Horizontal row (Row 9, Columns 2-7) - moves **leftwards**
  - Position 58 → Row 9, Col 7
  - Position 59 → Row 9, Col 6
  - Position 60 → Row 9, Col 5
  - Position 61 → Row 9, Col 4
  - Position 62 → Row 9, Col 3
  - Position 63 → Row 9, Col 2 (final before center)

## Main Circular Track (52 Positions)

The track goes clockwise starting from RED's position (0):

```
Position 0:  Red start    → Row 8,  Col 6
Position 13: Green start  → Row 1,  Col 7
Position 26: Yellow start → Row 7,  Col 10
Position 39: Blue start   → Row 10, Col 9
```

All positions are connected in a clockwise circle, with position 51 connecting back to position 0.

## Movement Rules

### From Home Base (-1)
- Can only move if dice value is **6**
- Moves to track position **0** (color's starting position)

### On Main Track (0-51)
- Moves forward clockwise by dice value
- After position 51, enters home stretch at position 52+
- Cannot move backwards

### In Home Stretch (52+)
- Moves forward only in home stretch
- Must land exactly on final home stretch position to reach home
- Cannot move beyond end of home stretch

## Example Movement Paths

### RED Piece Movement Example:
1. **At Home (-1)**: Roll 6 → Move to position 0 (Row 8, Col 6)
2. **At Position 0**: Roll 3 → Move to position 3
3. **At Position 50**: Roll 3 → Move to position 53 (enters home stretch)
4. **At Position 53**: Roll 2 → Move to position 55
5. **At Position 57**: Roll 1 → Move to center (game win condition)

### GREEN Piece Movement Example:
1. **At Home (-1)**: Roll 6 → Move to position 0 (relative to GREEN start = position 13 on track)
2. **At Position 0**: Roll 4 → Move to position 4
3. **At Position 51**: Roll 2 → Move to position 53 → Enters home stretch at position 65
4. **At Position 65**: Roll 3 → Move to position 68
5. **At Position 69**: Roll 1 → Move to center (game win condition)

## Safe Zones

Safe zones are positions where pieces cannot be captured:
- **RED**: Positions 0, 8, 13
- **GREEN**: Positions 13, 14, 26
- **YELLOW**: Positions 26, 29, 39
- **BLUE**: Positions 39, 42, 0

## Functions Available

- `moveGoti(color, currentPosition, diceValue)`: Calculates new position after movement
- `positionToGrid(position, color)`: Maps logical position to grid coordinates
- `calculateIntermediatePositions(from, to, color, diceValue)`: Gets all intermediate positions for animation
- `isSafePosition(position, color)`: Checks if position is a safe zone
- `isHomeStretch(position, color)`: Checks if position is in home stretch

