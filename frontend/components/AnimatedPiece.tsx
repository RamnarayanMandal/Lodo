'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayerColor } from '@/types/socket';

interface AnimatedPieceProps {
  pieceId: number;
  color: PlayerColor;
  fromPosition: number;
  toPosition: number;
  diceValue: number;
  isSelected: boolean;
  isMoving: boolean;
  isSafe: boolean;
  isInHome: boolean;
  onClick: () => void;
  gridRow: number;
  gridColumn: number;
  cellSize: number;
}

export function AnimatedPiece({
  pieceId,
  color,
  fromPosition,
  toPosition,
  diceValue,
  isSelected,
  isMoving,
  isSafe,
  isInHome,
  onClick,
  gridRow,
  gridColumn,
  cellSize,
}: AnimatedPieceProps) {
  const [currentPosition, setCurrentPosition] = useState(fromPosition);
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    if (isMoving && fromPosition !== toPosition) {
      // Calculate intermediate positions
      const positions = calculateStepPositions(fromPosition, toPosition, diceValue);
      
      // Animate through each position
      let stepIndex = 0;
      const animateStep = () => {
        if (stepIndex < positions.length) {
          setCurrentPosition(positions[stepIndex]);
          stepIndex++;
          setTimeout(animateStep, 150); // 150ms per step
        } else {
          setCurrentPosition(toPosition);
        }
      };
      
      animateStep();
      setAnimationKey(prev => prev + 1);
    } else {
      setCurrentPosition(toPosition);
    }
  }, [fromPosition, toPosition, isMoving, diceValue]);

  const getColorClass = () => {
    const colors = {
      [PlayerColor.RED]: 'red-token',
      [PlayerColor.GREEN]: 'green-token',
      [PlayerColor.BLUE]: 'blue-token',
      [PlayerColor.YELLOW]: 'yellow-token',
    };
    return colors[color] || '';
  };

  const getColorGradient = () => {
    const gradients = {
      [PlayerColor.RED]: 'radial-gradient(circle at 30% 30%, #ff6b6b 0%, #E53935 40%, #C62828 100%)',
      [PlayerColor.GREEN]: 'radial-gradient(circle at 30% 30%, #81c784 0%, #4CAF50 40%, #388E3C 100%)',
      [PlayerColor.BLUE]: 'radial-gradient(circle at 30% 30%, #64b5f6 0%, #2196F3 40%, #1976D2 100%)',
      [PlayerColor.YELLOW]: 'radial-gradient(circle at 30% 30%, #ffd54f 0%, #FFC107 40%, #F9A825 100%)',
    };
    return gradients[color] || '';
  };

  // Calculate X and Y positions based on grid
  const x = (gridColumn - 1) * cellSize + cellSize / 2;
  const y = (gridRow - 1) * cellSize + cellSize / 2;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`piece-${pieceId}-${animationKey}`}
        className={`track-piece ${getColorClass()} ${isSelected ? 'selected' : ''} ${isMoving ? 'moving' : ''}`}
        onClick={onClick}
        style={{
          position: 'absolute',
          left: `${x - cellSize / 4}px`,
          top: `${y - cellSize / 4}px`,
          background: getColorGradient(),
          width: `${cellSize * 0.6}px`,
          height: `${cellSize * 0.6}px`,
          borderRadius: '50%',
          border: isSelected ? '3px solid #ffd700' : '2.5px solid #444',
          cursor: 'pointer',
          zIndex: isMoving ? 100 : 10,
          boxShadow: isMoving
            ? '0 0 20px rgba(255, 215, 0, 0.8), 0 5px 12px rgba(0, 0, 0, 0.6)'
            : isSelected
            ? '0 0 15px rgba(255, 215, 0, 0.8), 0 3px 8px rgba(0, 0, 0, 0.5)'
            : '0 3px 8px rgba(0, 0, 0, 0.5)',
        }}
        animate={{
          scale: isMoving ? 1.3 : isSelected ? 1.15 : 1,
          rotate: isMoving ? [0, 5, -5, 0] : 0,
        }}
        transition={{
          duration: isMoving ? 0.6 : 0.2,
          ease: 'easeInOut',
        }}
        whileHover={{
          scale: 1.2,
          transition: { duration: 0.2 },
        }}
      >
        {/* Glow effect for safe zones */}
        {isSafe && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255, 255, 0, 0.5) 0%, transparent 70%)',
              filter: 'blur(8px)',
              zIndex: -1,
            }}
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Glow effect for home */}
        {isInHome && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle, ${getColorGradient()} 0%, transparent 70%)`,
              filter: 'blur(12px)',
              zIndex: -1,
            }}
            animate={{
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Highlight dot */}
        <div
          className="absolute"
          style={{
            width: '40%',
            height: '40%',
            top: '25%',
            left: '25%',
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.6) 60%, rgba(255, 255, 255, 0.3) 100%)',
            borderRadius: '50%',
            border: '1.5px solid rgba(0, 0, 0, 0.3)',
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}

// Calculate step-by-step positions for animation
function calculateStepPositions(from: number, to: number, steps: number): number[] {
  if (from === to) return [];
  if (from === -1) return [to]; // Coming from home
  
  const positions: number[] = [];
  let current = from;
  
  for (let i = 0; i < steps && current !== to; i++) {
    if (current < 51) {
      current = (current + 1) % 52;
    } else {
      // In home stretch - continue incrementing
      current = current + 1;
      if (current > to) break;
    }
    positions.push(current);
  }
  
  return positions;
}

