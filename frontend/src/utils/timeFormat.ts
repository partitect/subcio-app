/**
 * Time formatting utilities for media player and timeline
 */

/**
 * Format seconds to mm:ss.ms display format
 * Uses fixed width with tabular-nums for no layout shift
 * @param seconds - Time in seconds
 * @returns Formatted time string "mm:ss.ms"
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

/**
 * Format seconds to simple mm:ss format
 * @param seconds - Time in seconds
 * @returns Formatted time string "m:ss"
 */
export const formatTimeSimple = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Parse time string to seconds
 * Supports formats: "mm:ss", "mm:ss.ms", "ss.ms", "ss"
 * @param timeStr - Time string
 * @returns Time in seconds
 */
export const parseTime = (timeStr: string): number => {
  const parts = timeStr.split(':');
  
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10) || 0;
    const secs = parseFloat(parts[1]) || 0;
    return mins * 60 + secs;
  }
  
  return parseFloat(timeStr) || 0;
};

/**
 * Timeline tick mark configuration
 */
export interface TimelineTick {
  position: number;  // Percentage position (0-100)
  label: string;     // Display label (empty for minor ticks)
  isMajor: boolean;  // Is this a major tick?
}

/**
 * Generate timeline tick marks based on duration
 * @param duration - Total duration in seconds
 * @returns Array of tick marks
 */
export const generateTimelineTicks = (duration: number): TimelineTick[] => {
  if (duration <= 0) return [];
  
  // Determine tick interval based on duration
  let majorInterval: number;
  let minorInterval: number;
  
  if (duration <= 30) {
    majorInterval = 5;
    minorInterval = 1;
  } else if (duration <= 60) {
    majorInterval = 10;
    minorInterval = 2;
  } else if (duration <= 180) {
    majorInterval = 30;
    minorInterval = 5;
  } else if (duration <= 600) {
    majorInterval = 60;
    minorInterval = 10;
  } else {
    majorInterval = 120;
    minorInterval = 30;
  }
  
  const ticks: TimelineTick[] = [];
  
  for (let t = 0; t <= duration; t += minorInterval) {
    const isMajor = t % majorInterval === 0;
    const mins = Math.floor(t / 60);
    const secs = Math.floor(t % 60);
    ticks.push({
      position: (t / duration) * 100,
      label: isMajor ? `${mins}:${secs.toString().padStart(2, '0')}` : '',
      isMajor,
    });
  }
  
  return ticks;
};

/**
 * Clamp time value within valid range
 * @param time - Time in seconds
 * @param min - Minimum value (default 0)
 * @param max - Maximum value
 * @returns Clamped time value
 */
export const clampTime = (time: number, min = 0, max: number): number => {
  return Math.max(min, Math.min(time, max));
};
