import { PlayerColor } from '@/types/socket';

// Valid position ranges for Ludo board
const VALID_TRACK_POSITIONS = Array.from({ length: 52 }, (_, i) => i); // 0-51

// Home stretch positions for each color
const HOME_STRETCH: Record<PlayerColor, number[]> = {
  [PlayerColor.RED]: [52, 53, 54, 55, 56, 57],
  [PlayerColor.BLUE]: [58, 59, 60, 61, 62, 63],
  [PlayerColor.GREEN]: [64, 65, 66, 67, 68, 69],
  [PlayerColor.YELLOW]: [70, 71, 72, 73, 74, 75],
};

// Starting positions
const START_POSITIONS: Record<PlayerColor, number> = {
  [PlayerColor.RED]: 0,
  [PlayerColor.BLUE]: 13,
  [PlayerColor.GREEN]: 26,
  [PlayerColor.YELLOW]: 39,
};

/**
 * Validates if a position is valid on the Ludo board for a given color
 * @param position - The position to validate
 * @param color - The color of the piece
 * @returns true if position is valid, false otherwise
 */
export function isValidBoardPosition(position: number, color: PlayerColor): boolean {
  // Position -1 means piece is at home (valid)
  if (position === -1) return true;

  // Check if position is on outer track (0-51)
  if (VALID_TRACK_POSITIONS.includes(position)) return true;

  // Check if position is in home stretch for this color
  const homeStretch = HOME_STRETCH[color];
  if (homeStretch.includes(position)) return true;

  // Position is out of bounds
  return false;
}

/**
 * Validates if a move from one position to another is valid
 * @param fromPosition - Starting position
 * @param toPosition - Target position
 * @param color - Color of the piece
 * @param diceValue - Value rolled on dice
 * @returns Object with isValid flag and error message if invalid
 */
export function validateMove(
  fromPosition: number,
  toPosition: number,
  color: PlayerColor,
  diceValue: number
): { isValid: boolean; error?: string } {
  // Check if target position is valid on board
  if (toPosition < -1 || toPosition > 75) {
    return {
      isValid: false,
      error: 'Invalid move: goti out of board.',
    };
  }
  
  if (!isValidBoardPosition(toPosition, color)) {
    return {
      isValid: false,
      error: 'Invalid move: goti out of board.',
    };
  }

  // If piece is at home, can only move if dice is 6
  if (fromPosition === -1 && diceValue !== 6) {
    return {
      isValid: false,
      error: 'You need to roll a 6 to move a goti from home.',
    };
  }

  // If in home stretch, check if move is within bounds
  if (fromPosition >= 52) {
    const homeStretch = HOME_STRETCH[color];
    if (!homeStretch.includes(fromPosition)) {
      return {
        isValid: false,
        error: 'Invalid move: goti out of board.',
      };
    }

    const currentIndex = homeStretch.indexOf(fromPosition);
    const targetIndex = homeStretch.indexOf(toPosition);

    // If target is not in home stretch, it's invalid
    if (targetIndex === -1 && toPosition !== -1) {
      return {
        isValid: false,
        error: 'Invalid move: goti out of board.',
      };
    }

    // If target index is beyond home stretch length, it's invalid
    if (targetIndex >= homeStretch.length) {
      return {
        isValid: false,
        error: 'Invalid move: goti out of board.',
      };
    }
  }

  // Check if position is in valid track range
  if (fromPosition >= 0 && fromPosition < 52) {
    // Position should be within valid range or in home stretch
    if (toPosition >= 0 && toPosition < 52) {
      // Valid track position
      return { isValid: true };
    }

    // Moving to home stretch
    const homeStretch = HOME_STRETCH[color];
    if (homeStretch.includes(toPosition)) {
      return { isValid: true };
    }

    // If toPosition is -1 but not from home, it might be invalid
    if (toPosition === -1) {
      return {
        isValid: false,
        error: 'Invalid move: goti cannot return to home.',
      };
    }
  }

  return { isValid: true };
}

/**
 * Gets all valid positions for a piece based on color
 * @param color - Color of the piece
 * @returns Array of valid positions
 */
export function getValidPositions(color: PlayerColor): number[] {
  const homeStretch = HOME_STRETCH[color];
  return [...VALID_TRACK_POSITIONS, ...homeStretch, -1];
}

