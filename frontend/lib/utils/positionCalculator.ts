import { PlayerColor } from '@/types/socket';

/**
 * Ludo Board Position Calculator
 * 
 * This module handles all position calculations for the Ludo game board.
 * 
 * Movement Path Structure (based on second image):
 * - Main Track: 52 positions (0-51) going clockwise around the board
 * - Each color starts at a different position on the track:
 *   - RED: Position 0 (Row 8, Column 6)
 *   - GREEN: Position 13 (Row 1, Column 7)
 *   - YELLOW: Position 26 (Row 7, Column 10)
 *   - BLUE: Position 39 (Row 10, Column 9)
 * 
 * - Home Stretch: 6 positions (52-57 for Red, 58-63 for Blue, 64-69 for Green, 70-75 for Yellow)
 *   - RED: Vertical column (Rows 2-7, Column 7) - moves upwards
 *   - GREEN: Horizontal row (Row 7, Columns 2-7) - moves leftwards
 *   - YELLOW: Vertical column (Rows 2-7, Column 9) - moves upwards
 *   - BLUE: Horizontal row (Row 9, Columns 2-7) - moves leftwards
 * 
 * - Home Base: Position -1 (piece not on board)
 */

// Board layout constants
export const CELL_SIZE = 38;

// Starting positions for each color on the main track (0-51)
// Based on the second image: Red starts at position 0 (row 8, col 6)
// Green starts at position 13 (row 1, col 7)
// Yellow starts at position 26 (row 7, col 10)
// Blue starts at position 39 (row 10, col 9)
export const START_POSITIONS: Record<PlayerColor, number> = {
  [PlayerColor.RED]: 0,    // Row 8, Column 6
  [PlayerColor.GREEN]: 13, // Row 1, Column 7
  [PlayerColor.YELLOW]: 26, // Row 7, Column 10
  [PlayerColor.BLUE]: 39,   // Row 10, Column 9
};

// Safe zones - positions where pieces cannot be captured
// Safe zones are typically at starting positions and corners
export const SAFE_ZONES: Record<PlayerColor, number[]> = {
  [PlayerColor.RED]: [0, 8, 13],      // Red start, corner, and after 8 steps
  [PlayerColor.GREEN]: [13, 14, 26],  // Green start, safe zone, and corner
  [PlayerColor.YELLOW]: [26, 29, 39], // Yellow start, safe zone, and corner
  [PlayerColor.BLUE]: [39, 42, 0],    // Blue start, safe zone, and corner (wraps to red start)
};

// Home stretch positions (final 6 positions before home)
export const HOME_STRETCH: Record<PlayerColor, number[]> = {
  [PlayerColor.RED]: [52, 53, 54, 55, 56, 57],
  [PlayerColor.BLUE]: [58, 59, 60, 61, 62, 63],
  [PlayerColor.GREEN]: [64, 65, 66, 67, 68, 69],
  [PlayerColor.YELLOW]: [70, 71, 72, 73, 74, 75],
};

// Calculate intermediate positions for step-by-step animation
export function calculateIntermediatePositions(
  fromPosition: number,
  toPosition: number,
  color: PlayerColor,
  diceValue: number
): number[] {
  if (fromPosition === -1 && toPosition !== -1) {
    // Moving from home to start position
    return [START_POSITIONS[color]];
  }
  
  if (fromPosition === -1 || toPosition === -1) {
    return [toPosition];
  }
  
  if (fromPosition === toPosition) {
    return [toPosition];
  }

  const positions: number[] = [];
  
  // Check if moving in home stretch
  const homeStretch = HOME_STRETCH[color];
  const isFromInHomeStretch = homeStretch.includes(fromPosition);
  const isToInHomeStretch = homeStretch.includes(toPosition);

  if (isFromInHomeStretch && isToInHomeStretch) {
    // Moving within home stretch
    const fromIndex = homeStretch.indexOf(fromPosition);
    const toIndex = homeStretch.indexOf(toPosition);
    
    for (let i = fromIndex + 1; i <= toIndex; i++) {
      positions.push(homeStretch[i]);
    }
    return positions;
  }

  // Moving on outer track (0-51) - calculate all intermediate positions
  let currentPos = fromPosition;
  const steps = diceValue;
  
  // If entering home stretch from track
  if (!isFromInHomeStretch && isToInHomeStretch) {
    // Piece is on track and moving to home stretch
    // Calculate how many steps remain on track before entering home stretch
    const stepsRemainingOnTrack = 52 - fromPosition;
    const stepsIntoHomeStretch = toPosition - 52; // This is relative to home stretch start
    
    // First, move forward on track until reaching position 51 (end of track)
    for (let i = fromPosition + 1; i <= 51; i++) {
      positions.push(i);
    }
    
    // Then enter home stretch
    const toIndex = homeStretch.indexOf(toPosition);
    for (let i = 0; i <= toIndex; i++) {
      positions.push(homeStretch[i]);
    }
    
    return positions;
  }

  // Normal track movement - go step by step forward
  // Ensure we don't go backwards or skip positions
  let stepsToMove = Math.min(steps, 52 - fromPosition);
  
  for (let i = 1; i <= stepsToMove && currentPos < 51; i++) {
    currentPos = fromPosition + i;
    if (currentPos <= 51) {
      positions.push(currentPos);
    }
    
    if (currentPos === toPosition) break;
  }
  
  // If we've reached the end of track but toPosition is still ahead, 
  // we're entering home stretch (handled above)
  if (currentPos >= 52 && isToInHomeStretch) {
    const toIndex = homeStretch.indexOf(toPosition);
    for (let i = 0; i <= toIndex; i++) {
      positions.push(homeStretch[i]);
    }
  }

  return positions.length > 0 ? positions : [toPosition];
}

// Map board position to CSS Grid coordinates based on actual Ludo board layout
// Board is 15x15 grid with pathways connecting around the board
export function positionToGrid(
  position: number,
  color: PlayerColor
): { row: number; col: number; x: number; y: number } | null {
  if (position < 0) return null; // Piece in home area

  const cellSize = CELL_SIZE;

  // Home stretch positions (52+)
  if (position >= 52) {
    const homeStretch = HOME_STRETCH[color];
    if (!homeStretch.includes(position)) return null;
    
    const indexInStretch = homeStretch.indexOf(position);
    
    // Home stretch paths based on second image description:
    // Red: Vertical column (Rows 2-7, Column 7) - moves upwards (from row 7 to row 2)
    // Green: Horizontal row (Row 7, Columns 2-7) - moves leftwards (from col 7 to col 2)
    // Yellow: Vertical column (Rows 2-7, Column 9) - moves upwards (from row 7 to row 2)
    // Blue: Horizontal row (Row 9, Columns 2-7) - moves leftwards (from col 7 to col 2)
    switch (color) {
      case PlayerColor.RED:
        // Vertical path up (rows 7 down to 2, col 7)
        // indexInStretch 0 = row 7, indexInStretch 5 = row 2
        return {
          row: 7 - indexInStretch,
          col: 7,
          x: (7 - 1) * cellSize + cellSize / 2,
          y: (7 - indexInStretch - 1) * cellSize + cellSize / 2,
        };
      case PlayerColor.GREEN:
        // Horizontal path left (row 7, cols 7 down to 2)
        // indexInStretch 0 = col 7, indexInStretch 5 = col 2
        return {
          row: 7,
          col: 7 - indexInStretch,
          x: (7 - indexInStretch - 1) * cellSize + cellSize / 2,
          y: (7 - 1) * cellSize + cellSize / 2,
        };
      case PlayerColor.YELLOW:
        // Vertical path up (rows 7 down to 2, col 9)
        // indexInStretch 0 = row 7, indexInStretch 5 = row 2
        return {
          row: 7 - indexInStretch,
          col: 9,
          x: (9 - 1) * cellSize + cellSize / 2,
          y: (7 - indexInStretch - 1) * cellSize + cellSize / 2,
        };
      case PlayerColor.BLUE:
        // Horizontal path left (row 9, cols 7 down to 2)
        // indexInStretch 0 = col 7, indexInStretch 5 = col 2
        return {
          row: 9,
          col: 7 - indexInStretch,
          x: (7 - indexInStretch - 1) * cellSize + cellSize / 2,
          y: (9 - 1) * cellSize + cellSize / 2,
        };
    }
  }

  // Outer track positions (0-51)
  // Get color-specific mapping
  const trackMapping = getProperTrackMapping(color);
  const gridPos = trackMapping[position];
  
  if (!gridPos) {
    // Invalid position
    console.warn(`Position ${position} not found in track mapping for ${color}`);
    return null;
  }
  
  return {
    row: gridPos.row,
    col: gridPos.col,
    x: (gridPos.col - 1) * cellSize + cellSize / 2,
    y: (gridPos.row - 1) * cellSize + cellSize / 2,
  };
}

// Generate proper track mapping based on actual Ludo board layout
// Uses a precise circular track with 52 positions mapped to actual grid cells
// The track is fixed starting from RED's position (0), so each color's position
// is relative to their START_POSITION in the circular track
function getProperTrackMapping(color: PlayerColor): Record<number, { row: number; col: number }> {
  const mapping: Record<number, { row: number; col: number }> = {};
  
  // Create the complete 52-position circular track going clockwise
  // Track starts from RED (position 0 = row 8, col 6) and goes clockwise
  const trackCells = createPreciseCircularTrack();
  
  // Get this color's starting position in the track
  const colorStartPos = START_POSITIONS[color];
  
  // Map each logical position (0-51) to the actual grid cell
  // For each color, position 0 is their starting position on the track
  // So we offset by their start position to get the correct cell
  for (let i = 0; i < 52; i++) {
    // i is the logical position for this color (0-51)
    // To find the actual cell in the track, we add the color's start position
    const trackCellIndex = (colorStartPos + i) % 52;
    mapping[i] = trackCells[trackCellIndex];
  }

  return mapping;
}

// Create precise circular track with exactly 52 positions
// Based on actual visible cells on the Ludo board
// The track follows the visible pathway cells around the board
function createPreciseCircularTrack(): Array<{ row: number; col: number }> {
  const track: Array<{ row: number; col: number }> = [];
  
  // Build track starting from RED's entry point (position 0) going clockwise
  // RED starts in center-left pathway - red-start is at row 1, col 5 (internal)
  // Which maps to actual grid: row 8, col 6
  // Position 0: RED start - center-left pathway (red-start cell)
  track.push({ row: 8, col: 6 }); // 0: RED start (center-left pathway, red-start)
  
  // Moving clockwise from RED start (row 8, col 6):
  // Up through center-left pathway, then to top-middle pathway
  // From red-start (row 8, col 6), move up to top-middle
  
  // Positions 1-5: Moving up in center-left pathway
  track.push({ row: 8, col: 5 }); // 1
  track.push({ row: 8, col: 4 }); // 2
  track.push({ row: 8, col: 3 }); // 3
  track.push({ row: 8, col: 2 }); // 4
  track.push({ row: 8, col: 1 }); // 5
  
  // Positions 6-11: Moving through top area to top-middle pathway
  // Transition from left to top-middle
  track.push({ row: 7, col: 1 }); // 6
  track.push({ row: 6, col: 1 }); // 7
  track.push({ row: 5, col: 1 }); // 8: Safe zone
  track.push({ row: 4, col: 1 }); // 9
  track.push({ row: 3, col: 1 }); // 10
  track.push({ row: 2, col: 1 }); // 11
  track.push({ row: 1, col: 1 }); // 12
  
  // Positions 13-18: Top-middle pathway (rows 1-6, cols 7-9)
  track.push({ row: 1, col: 7 }); // 13: GREEN start
  track.push({ row: 1, col: 8 }); // 14: Safe zone
  track.push({ row: 1, col: 9 }); // 15
  track.push({ row: 2, col: 9 }); // 16
  track.push({ row: 3, col: 9 }); // 17
  track.push({ row: 4, col: 9 }); // 18
  
  // Positions 19-25: Top-right area transitioning to center-right pathway
  track.push({ row: 5, col: 9 }); // 19
  track.push({ row: 6, col: 9 }); // 20
  track.push({ row: 6, col: 10 }); // 21
  track.push({ row: 5, col: 10 }); // 22
  track.push({ row: 4, col: 10 }); // 23: Safe zone
  track.push({ row: 3, col: 10 }); // 24
  track.push({ row: 2, col: 10 }); // 25
  
  // Positions 26-31: Center-right pathway (rows 7-9, cols 10-15)
  track.push({ row: 7, col: 10 }); // 26: YELLOW start
  track.push({ row: 7, col: 11 }); // 27
  track.push({ row: 7, col: 12 }); // 28
  track.push({ row: 7, col: 13 }); // 29: Safe zone
  track.push({ row: 7, col: 14 }); // 30
  track.push({ row: 7, col: 15 }); // 31
  
  // Positions 32-37: Bottom-right area transitioning to bottom-middle pathway
  track.push({ row: 8, col: 15 }); // 32
  track.push({ row: 9, col: 15 }); // 33
  track.push({ row: 9, col: 14 }); // 34
  track.push({ row: 9, col: 13 }); // 35
  track.push({ row: 9, col: 12 }); // 36
  track.push({ row: 9, col: 11 }); // 37
  track.push({ row: 9, col: 10 }); // 38
  
  // Positions 39-44: Bottom-middle pathway (rows 10-15, cols 7-9)
  track.push({ row: 10, col: 9 }); // 39: BLUE start
  track.push({ row: 11, col: 9 }); // 40
  track.push({ row: 12, col: 9 }); // 41
  track.push({ row: 13, col: 9 }); // 42: Safe zone
  track.push({ row: 14, col: 9 }); // 43
  track.push({ row: 15, col: 9 }); // 44
  
  // Positions 45-51: Bottom-left area transitioning back to center-left pathway to close the circle
  // From position 44 (row 15, col 9), we need to move left and then up to connect to position 0 (row 8, col 6)
  track.push({ row: 15, col: 8 }); // 45
  track.push({ row: 15, col: 7 }); // 46: Safe zone (corner)
  track.push({ row: 15, col: 6 }); // 47
  track.push({ row: 15, col: 5 }); // 48
  track.push({ row: 15, col: 4 }); // 49
  track.push({ row: 15, col: 3 }); // 50
  track.push({ row: 15, col: 2 }); // 51
  
  // Position 51 (row 15, col 2) should connect back to position 0 (row 8, col 6)
  // Through the center-left pathway going up
  // The path from 51 to 0 would go: (15,2) -> (14,2) -> (13,2) -> ... -> (9,2) -> (9,3) -> ... -> (9,6) -> (8,6)
  // But we already have position 0 at (8,6), so position 51 is the last before completing the circle
  // Verify we have exactly 52 positions (0-51)
  if (track.length !== 52) {
    console.error(`Track has ${track.length} positions, expected 52`);
    // Ensure we have exactly 52
    while (track.length < 52) {
      const lastPos = track[track.length - 1];
      // Fill missing cells to connect position 51 back to position 0
      if (lastPos.row === 15 && lastPos.col > 2) {
        track.push({ row: lastPos.row, col: lastPos.col - 1 });
      } else if (lastPos.row > 8 && lastPos.col === 2) {
        track.push({ row: lastPos.row - 1, col: lastPos.col });
      } else if (lastPos.row === 8 && lastPos.col < 6) {
        track.push({ row: lastPos.row, col: lastPos.col + 1 });
      } else {
        // Default: move towards position 0
        if (lastPos.row > 8) {
          track.push({ row: lastPos.row - 1, col: lastPos.col });
        } else if (lastPos.col < 6) {
          track.push({ row: lastPos.row, col: lastPos.col + 1 });
        } else {
          break; // Reached position 0
        }
      }
    }
    // Trim if exceeded
    if (track.length > 52) {
      track.splice(52);
    }
  }
  
  // The circular track is now complete with 52 positions
  // Position 0 is at { row: 8, col: 6 } (RED start)
  // Position 13 is at { row: 1, col: 7 } (GREEN start)
  // Position 26 is at { row: 7, col: 10 } (YELLOW start)
  // Position 39 is at { row: 10, col: 9 } (BLUE start)
  
  return track;
}

// Check if position is in safe zone
export function isSafePosition(position: number, color: PlayerColor): boolean {
  return SAFE_ZONES[color].includes(position);
}

// Check if position is in home stretch
export function isHomeStretch(position: number, color: PlayerColor): boolean {
  return HOME_STRETCH[color].includes(position);
}

/**
 * Calculates the new position of a goti after moving by diceValue steps.
 * 
 * Rules:
 * - If piece is at home (-1), can only move if dice is 6, goes to start position (0 for that color)
 * - If piece is on track (0-51), moves forward by diceValue steps clockwise
 * - If piece reaches its start position after completing a circle, enters home stretch
 * - If piece is in home stretch (52+), moves forward in home stretch only
 * - Piece cannot move beyond the end of its home stretch
 * 
 * @param color - The color of the goti
 * @param currentPosition - Current position (-1 for home, 0-51 for track, 52+ for home stretch)
 * @param diceValue - Value rolled on dice (1-6)
 * @returns New position after movement, or -1 if move is invalid
 */
export function moveGoti(
  color: PlayerColor,
  currentPosition: number,
  diceValue: number
): number {
  // Validate dice value
  if (diceValue < 1 || diceValue > 6) {
    return -1; // Invalid dice value
  }

  const startPos = START_POSITIONS[color];
  const homeStretch = HOME_STRETCH[color];

  // Case 1: Piece is at home (-1)
  if (currentPosition === -1) {
    // Can only move if dice is 6
    if (diceValue === 6) {
      // Move to start position on track (0 for this color's logical position)
      return 0;
    }
    // Cannot move from home without rolling 6
    return -1;
  }

  // Case 2: Piece is in home stretch (52+)
  if (homeStretch.includes(currentPosition)) {
    const currentIndex = homeStretch.indexOf(currentPosition);
    const newIndex = currentIndex + diceValue;
    
    // Check if new position is within home stretch (0-5 indices, 6 positions total)
    if (newIndex < homeStretch.length) {
      // Move forward in home stretch
      return homeStretch[newIndex];
    } else {
      // Cannot move beyond end of home stretch
      // In standard Ludo, piece must land exactly on the last home stretch position to reach home
      // If dice value is too high, move is invalid
      return -1;
    }
  }

  // Case 3: Piece is on the track (0-51)
  // Calculate current track position relative to this color's start
  // Each color's position 0 is their start position in the circular track
  const currentTrackPos = currentPosition;
  const newTrackPos = currentTrackPos + diceValue;

  // Check if piece would complete a circle and enter home stretch
  // After position 51, piece should enter home stretch at its start position
  if (newTrackPos >= 52) {
    // Piece has completed track and should enter home stretch
    // The excess steps determine how far into home stretch
    const excessSteps = newTrackPos - 52;
    
    // Check if excess steps allow entry into home stretch
    if (excessSteps < homeStretch.length) {
      return homeStretch[excessSteps];
    } else {
      // Cannot move beyond end of home stretch
      return -1;
    }
  }

  // Normal movement on track (0-51)
  return newTrackPos;
}
