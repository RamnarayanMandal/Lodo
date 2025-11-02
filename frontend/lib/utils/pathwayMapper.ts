// Maps internal pathway coordinates to actual grid coordinates
// Based on GameBoard pathway structure

// Pathway grid areas:
// - top-middle: grid-area 1/7/7/10 (rows 1-6, cols 7-9) - 3 cols x 6 rows
// - center-left: grid-area 7/1/10/7 (rows 7-9, cols 1-6) - 6 cols x 3 rows
// - center-right: grid-area 7/10/10/16 (rows 7-9, cols 10-15) - 6 cols x 3 rows
// - bottom-middle: grid-area 10/7/16/10 (rows 10-15, cols 7-9) - 3 cols x 6 rows

/**
 * Convert internal pathway cell index to actual grid coordinates
 * @param pathway - Pathway name
 * @param cellIndex - Internal cell index (0-17)
 * @returns Actual grid row and col
 */
export function pathwayCellToGrid(
  pathway: 'top-middle' | 'center-left' | 'center-right' | 'bottom-middle',
  cellIndex: number
): { row: number; col: number } {
  const row = Math.floor(cellIndex / 3);
  const col = cellIndex % 3;

  switch (pathway) {
    case 'top-middle':
      // grid-area 1/7/7/10 - 3 cols x 6 rows
      // Internal: 18 cells, 3 cols, 6 rows
      // Actual: rows 1-6, cols 7-9
      return {
        row: 1 + row, // rows 1-6
        col: 7 + col, // cols 7-9
      };
    
    case 'center-left':
      // grid-area 7/1/10/7 - 6 cols x 3 rows
      // Internal: 18 cells, 6 cols, 3 rows
      const centerLeftRow = Math.floor(cellIndex / 6);
      const centerLeftCol = cellIndex % 6;
      return {
        row: 7 + centerLeftRow, // rows 7-9
        col: 1 + centerLeftCol, // cols 1-6
      };
    
    case 'center-right':
      // grid-area 7/10/10/16 - 6 cols x 3 rows
      // Internal: 18 cells, 6 cols, 3 rows
      const centerRightRow = Math.floor(cellIndex / 6);
      const centerRightCol = cellIndex % 6;
      return {
        row: 7 + centerRightRow, // rows 7-9
        col: 10 + centerRightCol, // cols 10-15
      };
    
    case 'bottom-middle':
      // grid-area 10/7/16/10 - 3 cols x 6 rows
      // Internal: 18 cells, 3 cols, 6 rows
      return {
        row: 10 + row, // rows 10-15
        col: 7 + col, // cols 7-9
      };
  }
}

