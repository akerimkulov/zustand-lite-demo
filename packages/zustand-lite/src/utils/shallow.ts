/**
 * Shallow equality comparison utility.
 *
 * Used to prevent unnecessary re-renders when selected state
 * is structurally equal but referentially different.
 *
 * @module utils/shallow
 */

/**
 * Performs a shallow comparison of two values.
 *
 * Returns true if:
 * - Values are strictly equal (Object.is)
 * - Both are objects with the same keys and shallowly equal values
 * - Both are arrays with the same length and shallowly equal elements
 * - Both are Maps with the same entries
 * - Both are Sets with the same values
 *
 * @template T - Type of values to compare
 * @param objA - First value
 * @param objB - Second value
 * @returns True if values are shallowly equal
 *
 * @example
 * shallow({ a: 1, b: 2 }, { a: 1, b: 2 }) // true
 * shallow({ a: 1 }, { a: 2 }) // false
 * shallow([1, 2], [1, 2]) // true
 */
export function shallow<T>(objA: T, objB: T): boolean {
  // Strictly equal (same reference or primitive)
  if (Object.is(objA, objB)) {
    return true
  }

  // If either is not an object, they're not equal (we already checked Object.is)
  if (
    typeof objA !== 'object' ||
    objA === null ||
    typeof objB !== 'object' ||
    objB === null
  ) {
    return false
  }

  // Handle Map comparison
  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size) {
      return false
    }

    for (const [key, value] of objA) {
      if (!objB.has(key) || !Object.is(value, objB.get(key))) {
        return false
      }
    }

    return true
  }

  // Handle Set comparison
  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size) {
      return false
    }

    for (const value of objA) {
      if (!objB.has(value)) {
        return false
      }
    }

    return true
  }

  // Handle array and object comparison
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  // Different number of keys means not equal
  if (keysA.length !== keysB.length) {
    return false
  }

  // Check each key's value
  for (const key of keysA) {
    if (
      !Object.prototype.hasOwnProperty.call(objB, key) ||
      !Object.is(
        (objA as Record<string, unknown>)[key],
        (objB as Record<string, unknown>)[key]
      )
    ) {
      return false
    }
  }

  return true
}
