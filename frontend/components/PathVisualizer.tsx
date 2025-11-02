'use client';

import React from 'react';
import { PlayerColor } from '@/types/socket';
import { positionToFlexbox } from '@/lib/utils/positionCalculatorFlex';
import { START_POSITIONS, HOME_STRETCH } from '@/lib/utils/positionCalculatorFlex';

interface PathVisualizerProps {
  color: PlayerColor;
  showArrows?: boolean;
  highlightPosition?: number;
}

const CELL_SIZE = 40;
const ARROW_SIZE = 8;

const colorConfig = {
  [PlayerColor.RED]: { 
    name: 'Red', 
    color: '#FF0000',
    direction: 'DOWNWARDS',
    arrow: '↓'
  },
  [PlayerColor.GREEN]: { 
    name: 'Green', 
    color: '#009900',
    direction: 'LEFTWARDS',
    arrow: '←'
  },
  [PlayerColor.YELLOW]: { 
    name: 'Yellow', 
    color: '#FFCC00',
    direction: 'UPWARDS',
    arrow: '↑'
  },
  [PlayerColor.BLUE]: { 
    name: 'Blue', 
    color: '#66CCFF',
    direction: 'RIGHTWARDS',
    arrow: '→'
  },
};

/**
 * Path Visualizer Component
 * Shows the complete movement path for a color with arrows
 */
export function PathVisualizer({ color, showArrows = true, highlightPosition }: PathVisualizerProps) {
  const config = colorConfig[color];
  const startPos = START_POSITIONS[color];
  const homeStretch = HOME_STRETCH[color];

  // Generate all positions for the path
  const trackPositions: number[] = [];
  for (let i = 0; i < 52; i++) {
    const logicalPos = (startPos + i) % 52;
    trackPositions.push(logicalPos);
  }

  // Render arrow based on position and direction
  const getArrowDirection = (fromPos: number, toPos: number, isHomeStretch: boolean): string => {
    if (!isHomeStretch) {
      // Main track: always clockwise
      return '→';
    }
    
    // Home stretch: depends on color direction
    return config.arrow;
  };

  return (
    <div className="path-visualizer" style={{ 
      padding: '20px', 
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      margin: '10px'
    }}>
      <h3 style={{ color: config.color, marginBottom: '15px' }}>
        {config.name} Path ({config.direction})
      </h3>
      
      {/* Track Positions (0-51) */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Main Track (0-51):</h4>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '5px',
          maxWidth: '600px'
        }}>
          {trackPositions.map((pos, idx) => {
            const coords = positionToFlexbox(pos, color);
            const isHighlighted = highlightPosition === pos;
            const isStart = pos === startPos;
            
            return (
              <div
                key={`track-${pos}`}
                style={{
                  width: '40px',
                  height: '40px',
                  border: isStart ? '3px solid gold' : '1px solid #333',
                  backgroundColor: isHighlighted ? '#ffff00' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  fontWeight: isStart ? 'bold' : 'normal',
                  position: 'relative',
                }}
                title={`Position ${pos}`}
              >
                {pos}
                {isStart && <span style={{ position: 'absolute', top: '-5px', right: '-5px', fontSize: '8px' }}>⭐</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Home Stretch (52-57) */}
      <div>
        <h4>Home Stretch (52-57) - {config.direction}:</h4>
        <div style={{ 
          display: 'flex', 
          gap: '5px',
          alignItems: 'center',
          flexDirection: config.direction === 'UPWARDS' ? 'column-reverse' : 
                        config.direction === 'DOWNWARDS' ? 'column' :
                        config.direction === 'LEFTWARDS' ? 'row-reverse' : 'row'
        }}>
          {homeStretch.map((pos, idx) => {
            const coords = positionToFlexbox(pos, color);
            const isHighlighted = highlightPosition === pos;
            const isLast = idx === homeStretch.length - 1;
            
            return (
              <React.Fragment key={`home-${pos}`}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    border: '2px solid ' + config.color,
                    backgroundColor: isHighlighted ? '#ffff00' : config.color,
                    opacity: 0.7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff',
                    position: 'relative',
                  }}
                  title={`Home Stretch Position ${pos}`}
                >
                  {pos}
                </div>
                {showArrows && idx < homeStretch.length - 1 && (
                  <div style={{ 
                    fontSize: '20px', 
                    color: config.color,
                    fontWeight: 'bold'
                  }}>
                    {config.arrow}
                  </div>
                )}
                {isLast && (
                  <div style={{
                    width: '40px',
                    height: '40px',
                    border: '3px solid ' + config.color,
                    backgroundColor: config.color,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff',
                    marginLeft: '10px',
                  }}>
                    🏁
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Direction Legend */}
      <div style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
        Direction: <strong>{config.direction}</strong> {config.arrow}
      </div>
    </div>
  );
}

/**
 * Complete Path Map Component
 * Shows all four colors' paths together
 */
export function CompletePathMap() {
  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px' }}>Complete Ludo Path Map</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        <PathVisualizer color={PlayerColor.RED} />
        <PathVisualizer color={PlayerColor.GREEN} />
        <PathVisualizer color={PlayerColor.YELLOW} />
        <PathVisualizer color={PlayerColor.BLUE} />
      </div>

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '8px' }}>
        <h3>Legend:</h3>
        <ul>
          <li><strong>Track Positions (0-51)</strong>: Main clockwise path around the board</li>
          <li><strong>⭐ Marked Cell</strong>: Starting position for each color</li>
          <li><strong>Home Stretch (52-57)</strong>: Final 6 positions leading to center</li>
          <li><strong>🏁</strong>: Center (winning position)</li>
          <li><strong>Directions</strong>:
            <ul>
              <li>🟥 Red: ⬇️ DOWNWARDS</li>
              <li>🟩 Green: ⬅️ LEFTWARDS</li>
              <li>🟨 Yellow: ⬆️ UPWARDS</li>
              <li>🟦 Blue: ➡️ RIGHTWARDS</li>
            </ul>
          </li>
        </ul>
      </div>
    </div>
  );
}

