import { PlayerColor } from '@/types/socket';

/**
 * Position Calculator for Flexbox Ludo Board Layout
 * Based on actual HTML structure with colored paths
 * 
 * Board Structure:
 * - Top Row: Red box (250px) + Top-middle cells (3 cols x 6 rows = 120px) + Green box (250px)
 * - Middle Row: Left cells (6 cols x 3 rows = 240px) + Destination (126px) + Right cells (6 cols x 3 rows = 240px)
 * - Bottom Row: Blue box (250px) + Bottom-middle cells (3 cols x 6 rows = 120px) + Yellow box (250px)
 * 
 * Actual Colored Paths in HTML:
 * - RED: Left-middle, row 0 col 1, row 1 cols 1-5 (6 cells total)
 * - GREEN: Top-middle, row 1 col 1, row 1 col 2, rows 2-5 col 1 (6 cells total)
 * - YELLOW: Right-middle, row 1 cols 0-4 (5 cells), row 2 col 4 (1 cell) = 6 cells total
 * - BLUE: Bottom-middle, rows 0-3 col 1 (4 cells), row 4 cols 0-1 (2 cells) = 6 cells total
 */

const CELL_SIZE = 40;
const BOX_SIZE = 250;
const BOARD_BORDER = 10;
const DEST_SIZE = 126; // Destination triangle size

// Starting positions on track
const START_POSITIONS: Record<PlayerColor, number> = {
  [PlayerColor.RED]: 0,    // Red start
  [PlayerColor.GREEN]: 13, // Green start
  [PlayerColor.YELLOW]: 26, // Yellow start
  [PlayerColor.BLUE]: 39,   // Blue start
};

// Home stretch positions (52+)
const HOME_STRETCH: Record<PlayerColor, number[]> = {
  [PlayerColor.RED]: [52, 53, 54, 55, 56, 57],
  [PlayerColor.BLUE]: [58, 59, 60, 61, 62, 63],
  [PlayerColor.GREEN]: [64, 65, 66, 67, 68, 69],
  [PlayerColor.YELLOW]: [70, 71, 72, 73, 74, 75],
};

type ContainerType = 'top-middle' | 'left-middle' | 'right-middle' | 'bottom-middle';

interface CellPosition {
  container: ContainerType;
  row: number; // 0-indexed within container
  col: number; // 0-indexed within container
}

/**
 * Calculate pixel coordinates from cell position in flexbox layout
 */
function calculatePixelFromCell(container: ContainerType, row: number, col: number): { x: number; y: number } {
  const cellX = col * CELL_SIZE + CELL_SIZE / 2;
  const cellY = row * CELL_SIZE + CELL_SIZE / 2;

  switch (container) {
    case 'top-middle':
      // Top-middle: x starts after Red box (250px + border)
      return {
        x: BOX_SIZE + BOARD_BORDER + cellX,
        y: BOARD_BORDER + cellY,
      };
    
    case 'left-middle':
      // Left-middle: x starts after Red box, y starts after top row (250px + border)
      return {
        x: BOX_SIZE + BOARD_BORDER + cellX,
        y: BOX_SIZE + BOARD_BORDER + cellY,
      };
    
    case 'right-middle':
      // Right-middle: x starts after Red(250) + Top-middle(120) + Green(250) + Left(240) + Dest(126)
      const rightStartX = BOX_SIZE * 2 + (CELL_SIZE * 3) + BOARD_BORDER * 2 + DEST_SIZE;
      return {
        x: rightStartX + cellX,
        y: BOX_SIZE + BOARD_BORDER + cellY,
      };
    
    case 'bottom-middle':
      // Bottom-middle: x starts after Blue box, y starts after top(250) + middle(250) + border
      const bottomStartY = BOX_SIZE * 2 + (CELL_SIZE * 3) + BOARD_BORDER * 2 + DEST_SIZE;
      return {
        x: BOX_SIZE + BOARD_BORDER + cellX,
        y: bottomStartY + cellY,
      };
  }
}

/**
 * Maps logical position to pixel coordinates in flexbox layout
 */
export function positionToFlexbox(
  position: number,
  color: PlayerColor
): { x: number; y: number } | null {
  if (position < 0) return null; // Piece in home base

  // Home stretch positions (52+)
  if (position >= 52) {
    const homeStretch = HOME_STRETCH[color];
    if (!homeStretch.includes(position)) return null;
    
    const indexInStretch = homeStretch.indexOf(position);
    
    // Map to actual colored cells in HTML
    // IMPORTANT: Home stretch directions according to standard Ludo rules:
    // RED → DOWNWARDS (moves down into center)
    // GREEN → LEFTWARDS (moves left into center)
    // YELLOW → UPWARDS (moves up into center)
    // BLUE → RIGHTWARDS (moves right into center)
    switch (color) {
      case PlayerColor.RED:
        // Red home stretch: Moves DOWNWARDS (from top to bottom)
        // Left-middle, vertical column moving DOWN (col 1, rows increasing 0→5)
        // indexInStretch 0 = topmost (row 0), indexInStretch 5 = bottommost (row 5) near center
        return calculatePixelFromCell('left-middle', indexInStretch, 1);
      
      case PlayerColor.GREEN:
        // Green home stretch: Moves LEFTWARDS (from right to left)
        // Top-middle, horizontal row moving LEFT (row 1, cols decreasing 2→1)
        // Actually: col 2 → col 1 → towards center (left direction)
        // Using vertical cells in top-middle that represent leftward movement
        if (indexInStretch < 2) {
          // First two: col 2, then col 1
          return calculatePixelFromCell('top-middle', 1 + indexInStretch, 2 - indexInStretch);
        } else {
          // Continue leftward: row 2-5, col 1
          return calculatePixelFromCell('top-middle', 1 + indexInStretch, 1);
        }
      
      case PlayerColor.YELLOW:
        // Yellow home stretch: Moves UPWARDS (from bottom to top)
        // Right-middle, vertical column moving UP (col 4, rows decreasing 2→1)
        // indexInStretch 0 = bottom (row 2), indexInStretch 5 = top (row 1) near center
        if (indexInStretch < 5) {
          // Horizontal part: row 1, cols 0-4
          return calculatePixelFromCell('right-middle', 1, 4 - indexInStretch);
        } else {
          // Vertical part: row 2, col 4 (bottom position)
          return calculatePixelFromCell('right-middle', 2, 4);
        }
      
      case PlayerColor.BLUE:
        // Blue home stretch: Moves RIGHTWARDS (from left to right)
        // Bottom-middle, horizontal row moving RIGHT (row 4, cols increasing 0→1)
        // Actually: col 1 → towards center (right direction)
        // Vertical part (col 1, rows 0-3) then horizontal (row 4, cols 0-1 moving right)
        if (indexInStretch < 4) {
          // Vertical part: col 1, rows 0-3
          return calculatePixelFromCell('bottom-middle', indexInStretch, 1);
        } else {
          // Horizontal part: row 4, cols 0→1 (moving RIGHT)
          return calculatePixelFromCell('bottom-middle', 4, indexInStretch - 4);
        }
    }
  }

  // Main track positions (0-51) - map to colored paths in HTML
  const trackMapping = getFlexboxTrackMapping(color);
  const cellPos = trackMapping[position];
  
  if (!cellPos) {
    console.warn(`Position ${position} not found for ${color}`);
    return null;
  }

  return calculatePixelFromCell(cellPos.container, cellPos.row, cellPos.col);
}

/**
 * Build complete 52-position track based on actual HTML colored paths
 */
function buildFlexboxTrack(): CellPosition[] {
  const track: CellPosition[] = [];

  // RED TRACK (Positions 0-12): Left-middle red path
  // Position 0: RED start - Left-middle, row 0, col 1 (first red cell)
  track.push({ container: 'left-middle', row: 0, col: 1 }); // 0: RED start
  
  // Continue through left-middle red path (row 1, cols 1-5)
  track.push({ container: 'left-middle', row: 1, col: 1 }); // 1
  track.push({ container: 'left-middle', row: 1, col: 2 }); // 2
  track.push({ container: 'left-middle', row: 1, col: 3 }); // 3
  track.push({ container: 'left-middle', row: 1, col: 4 }); // 4
  track.push({ container: 'left-middle', row: 1, col: 5 }); // 5
  
  // Transition to top-middle (positions 6-12)
  // Move through top-middle white cells to reach green path
  track.push({ container: 'top-middle', row: 0, col: 0 }); // 6
  track.push({ container: 'top-middle', row: 0, col: 1 }); // 7
  track.push({ container: 'top-middle', row: 0, col: 2 }); // 8
  track.push({ container: 'top-middle', row: 1, col: 0 }); // 9
  track.push({ container: 'top-middle', row: 1, col: 2 }); // 10
  track.push({ container: 'top-middle', row: 2, col: 0 }); // 11
  track.push({ container: 'top-middle', row: 2, col: 2 }); // 12

  // GREEN TRACK (Positions 13-25): Top-middle green path
  // Position 13: GREEN start - Top-middle, row 1, col 1 (first green cell)
  track.push({ container: 'top-middle', row: 1, col: 1 }); // 13: GREEN start
  track.push({ container: 'top-middle', row: 1, col: 2 }); // 14: Second green cell
  track.push({ container: 'top-middle', row: 2, col: 1 }); // 15: Third green cell
  track.push({ container: 'top-middle', row: 3, col: 1 }); // 16
  track.push({ container: 'top-middle', row: 4, col: 1 }); // 17
  track.push({ container: 'top-middle', row: 5, col: 1 }); // 18
  
  // Transition to right-middle (positions 19-25)
  track.push({ container: 'top-middle', row: 5, col: 0 }); // 19
  track.push({ container: 'top-middle', row: 5, col: 2 }); // 20
  track.push({ container: 'right-middle', row: 0, col: 0 }); // 21
  track.push({ container: 'right-middle', row: 0, col: 1 }); // 22
  track.push({ container: 'right-middle', row: 0, col: 2 }); // 23
  track.push({ container: 'right-middle', row: 0, col: 3 }); // 24
  track.push({ container: 'right-middle', row: 0, col: 4 }); // 25

  // YELLOW TRACK (Positions 26-38): Right-middle yellow path
  // Position 26: YELLOW start - Right-middle, row 1, col 0 (first yellow cell)
  track.push({ container: 'right-middle', row: 1, col: 0 }); // 26: YELLOW start
  track.push({ container: 'right-middle', row: 1, col: 1 }); // 27
  track.push({ container: 'right-middle', row: 1, col: 2 }); // 28
  track.push({ container: 'right-middle', row: 1, col: 3 }); // 29
  track.push({ container: 'right-middle', row: 1, col: 4 }); // 30
  track.push({ container: 'right-middle', row: 2, col: 4 }); // 31: Last yellow cell
  
  // Transition to bottom-middle (positions 32-38)
  track.push({ container: 'right-middle', row: 2, col: 3 }); // 32
  track.push({ container: 'right-middle', row: 2, col: 2 }); // 33
  track.push({ container: 'right-middle', row: 2, col: 1 }); // 34
  track.push({ container: 'right-middle', row: 2, col: 0 }); // 35
  track.push({ container: 'bottom-middle', row: 0, col: 0 }); // 36
  track.push({ container: 'bottom-middle', row: 0, col: 2 }); // 37
  track.push({ container: 'bottom-middle', row: 1, col: 0 }); // 38

  // BLUE TRACK (Positions 39-51): Bottom-middle blue path
  // Position 39: BLUE start - Bottom-middle, row 0, col 1 (first blue cell)
  track.push({ container: 'bottom-middle', row: 0, col: 1 }); // 39: BLUE start
  track.push({ container: 'bottom-middle', row: 1, col: 1 }); // 40
  track.push({ container: 'bottom-middle', row: 2, col: 1 }); // 41
  track.push({ container: 'bottom-middle', row: 3, col: 1 }); // 42
  track.push({ container: 'bottom-middle', row: 4, col: 0 }); // 43: Blue cell row 5, col 1
  track.push({ container: 'bottom-middle', row: 4, col: 1 }); // 44: Blue cell row 5, col 2
  
  // Transition back to left-middle (positions 45-51)
  track.push({ container: 'bottom-middle', row: 4, col: 2 }); // 45
  track.push({ container: 'bottom-middle', row: 5, col: 0 }); // 46
  track.push({ container: 'bottom-middle', row: 5, col: 1 }); // 47
  track.push({ container: 'bottom-middle', row: 5, col: 2 }); // 48
  track.push({ container: 'left-middle', row: 2, col: 0 }); // 49
  track.push({ container: 'left-middle', row: 2, col: 1 }); // 50
  track.push({ container: 'left-middle', row: 2, col: 2 }); // 51
  
  // Verify we have exactly 52 positions
  if (track.length !== 52) {
    console.warn(`Track has ${track.length} positions, expected 52`);
    // Adjust
    while (track.length < 52) {
      const last = track[track.length - 1];
      track.push({ container: last.container, row: last.row, col: last.col });
    }
    if (track.length > 52) {
      track.splice(52);
    }
  }

  return track;
}

/**
 * Get track mapping for specific color
 */
function getFlexboxTrackMapping(color: PlayerColor): Record<number, CellPosition> {
  const mapping: Record<number, CellPosition> = {};
  const startPos = START_POSITIONS[color];
  const track = buildFlexboxTrack();
  
  // Map each logical position (0-51) to actual cell position
  // Each color's position 0 is their start position
  for (let i = 0; i < 52; i++) {
    const trackIndex = (startPos + i) % 52;
    mapping[i] = track[trackIndex];
  }

  return mapping;
}

/**
 * Get complete path array for a color
 * Returns array of positions from start (0) to home stretch end
 */
export function getCompletePath(color: PlayerColor): number[] {
  const startPos = START_POSITIONS[color];
  const homeStretch = HOME_STRETCH[color];
  const path: number[] = [];
  
  // Main track positions (0-51)
  for (let i = 0; i < 52; i++) {
    const logicalPos = (startPos + i) % 52;
    path.push(logicalPos);
  }
  
  // Home stretch positions (52+)
  path.push(...homeStretch);
  
  return path;
}

/**
 * Get path with coordinates for visualization
 */
export function getPathWithCoordinates(color: PlayerColor): Array<{ position: number; x: number; y: number; isStart: boolean; isHomeStretch: boolean }> {
  const path = getCompletePath(color);
  const startPos = START_POSITIONS[color];
  const homeStretch = HOME_STRETCH[color];
  
  return path.map(pos => {
    const coords = positionToFlexbox(pos, color);
    return {
      position: pos,
      x: coords?.x || 0,
      y: coords?.y || 0,
      isStart: pos === startPos,
      isHomeStretch: homeStretch.includes(pos),
    };
  });
}

export { START_POSITIONS, HOME_STRETCH, CELL_SIZE };
