// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get value from a level-scaled array.
 * Safely handles out-of-bounds by clamping to array length.
 */
export function getScaledValue<T>(arr: T[], level: number): T {
  const index = Math.min(level - 1, arr.length - 1);
  return arr[Math.max(0, index)];
}

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}