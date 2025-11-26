import { describe, it, expect } from 'vitest'
import { shallow } from '../src/utils/shallow'

describe('shallow equality', () => {
  // ============================================================
  // Primitives
  // ============================================================
  describe('primitives', () => {
    describe('numbers', () => {
      it('returns true for same numbers', () => {
        expect(shallow(1, 1)).toBe(true)
        expect(shallow(0, 0)).toBe(true)
        expect(shallow(-1, -1)).toBe(true)
        expect(shallow(3.14, 3.14)).toBe(true)
        expect(shallow(Infinity, Infinity)).toBe(true)
        expect(shallow(-Infinity, -Infinity)).toBe(true)
      })

      it('returns false for different numbers', () => {
        expect(shallow(1, 2)).toBe(false)
        expect(shallow(0, 1)).toBe(false)
        expect(shallow(-1, 1)).toBe(false)
        expect(shallow(3.14, 3.15)).toBe(false)
      })
    })

    describe('strings', () => {
      it('returns true for same strings', () => {
        expect(shallow('', '')).toBe(true)
        expect(shallow('hello', 'hello')).toBe(true)
        expect(shallow('a b c', 'a b c')).toBe(true)
      })

      it('returns false for different strings', () => {
        expect(shallow('hello', 'world')).toBe(false)
        expect(shallow('', 'a')).toBe(false)
        expect(shallow('Hello', 'hello')).toBe(false) // case sensitive
      })
    })

    describe('booleans', () => {
      it('returns true for same booleans', () => {
        expect(shallow(true, true)).toBe(true)
        expect(shallow(false, false)).toBe(true)
      })

      it('returns false for different booleans', () => {
        expect(shallow(true, false)).toBe(false)
        expect(shallow(false, true)).toBe(false)
      })
    })

    describe('null and undefined', () => {
      it('returns true for same null/undefined', () => {
        expect(shallow(null, null)).toBe(true)
        expect(shallow(undefined, undefined)).toBe(true)
      })

      it('returns false for null vs undefined', () => {
        expect(shallow(null, undefined)).toBe(false)
        expect(shallow(undefined, null)).toBe(false)
      })
    })

    describe('symbols', () => {
      it('returns true for same symbol reference', () => {
        const sym = Symbol('test')
        expect(shallow(sym, sym)).toBe(true)
      })

      it('returns false for different symbols even with same description', () => {
        const sym1 = Symbol('test')
        const sym2 = Symbol('test')
        expect(shallow(sym1, sym2)).toBe(false)
      })
    })

    describe('bigint', () => {
      it('returns true for same bigint', () => {
        expect(shallow(BigInt(123), BigInt(123))).toBe(true)
        expect(shallow(0n, 0n)).toBe(true)
      })

      it('returns false for different bigint', () => {
        expect(shallow(BigInt(123), BigInt(456))).toBe(false)
      })
    })
  })

  // ============================================================
  // Special values (Object.is behavior)
  // ============================================================
  describe('special values', () => {
    it('NaN equals NaN (Object.is behavior)', () => {
      expect(shallow(NaN, NaN)).toBe(true)
    })

    it('+0 does not equal -0 (Object.is behavior)', () => {
      expect(shallow(+0, -0)).toBe(false)
      expect(shallow(-0, +0)).toBe(false)
    })

    it('0 equals 0', () => {
      expect(shallow(0, 0)).toBe(true)
    })
  })

  // ============================================================
  // Objects
  // ============================================================
  describe('objects', () => {
    describe('basic object comparison', () => {
      it('returns true for empty objects', () => {
        expect(shallow({}, {})).toBe(true)
      })

      it('returns true for objects with same properties', () => {
        expect(shallow({ a: 1 }, { a: 1 })).toBe(true)
        expect(shallow({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
        expect(shallow({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 })).toBe(true)
      })

      it('returns false for objects with different values', () => {
        expect(shallow({ a: 1 }, { a: 2 })).toBe(false)
        expect(shallow({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
      })

      it('returns false for objects with different number of keys', () => {
        expect(shallow({ a: 1 }, { a: 1, b: 2 })).toBe(false)
        expect(shallow({ a: 1, b: 2 }, { a: 1 })).toBe(false)
      })

      it('returns false for objects with different keys', () => {
        expect(shallow({ a: 1 }, { b: 1 })).toBe(false)
        expect(shallow({ a: 1, b: 2 }, { a: 1, c: 2 })).toBe(false)
      })

      it('returns true for same object reference', () => {
        const obj = { a: 1, b: 2 }
        expect(shallow(obj, obj)).toBe(true)
      })
    })

    describe('objects with special values', () => {
      it('handles undefined values', () => {
        expect(shallow({ a: undefined }, { a: undefined })).toBe(true)
        expect(shallow({ a: undefined }, { b: undefined })).toBe(false)
      })

      it('handles null values', () => {
        expect(shallow({ a: null }, { a: null })).toBe(true)
        expect(shallow({ a: null }, { a: undefined })).toBe(false)
      })

      it('handles NaN values', () => {
        expect(shallow({ a: NaN }, { a: NaN })).toBe(true)
      })

      it('handles mixed primitive values', () => {
        expect(
          shallow(
            { a: 1, b: 'hello', c: true, d: null },
            { a: 1, b: 'hello', c: true, d: null }
          )
        ).toBe(true)
      })
    })

    describe('nested objects (shallow only)', () => {
      it('returns false for nested objects with different references', () => {
        const obj1 = { a: { b: 1 } }
        const obj2 = { a: { b: 1 } }
        expect(shallow(obj1, obj2)).toBe(false) // Different nested reference
      })

      it('returns true for nested objects with same reference', () => {
        const nested = { b: 1 }
        const obj1 = { a: nested }
        const obj2 = { a: nested }
        expect(shallow(obj1, obj2)).toBe(true) // Same nested reference
      })
    })

    describe('objects with symbol keys', () => {
      it('does not compare symbol keys (Object.keys limitation)', () => {
        const sym = Symbol('key')
        const obj1 = { [sym]: 1 }
        const obj2 = { [sym]: 1 }
        // Symbol keys are not included in Object.keys, so both appear empty
        expect(shallow(obj1, obj2)).toBe(true)
      })
    })

    describe('objects with inherited properties', () => {
      it('only compares own properties', () => {
        const proto = { inherited: true }
        const obj1 = Object.create(proto)
        obj1.own = 1
        const obj2 = Object.create(proto)
        obj2.own = 1
        expect(shallow(obj1, obj2)).toBe(true)
      })

      it('does not consider inherited properties', () => {
        const proto = { inherited: true }
        const obj1 = Object.create(proto)
        obj1.own = 1
        const obj2 = { own: 1 }
        expect(shallow(obj1, obj2)).toBe(true)
      })
    })
  })

  // ============================================================
  // Arrays
  // ============================================================
  describe('arrays', () => {
    describe('basic array comparison', () => {
      it('returns true for empty arrays', () => {
        expect(shallow([], [])).toBe(true)
      })

      it('returns true for arrays with same elements', () => {
        expect(shallow([1], [1])).toBe(true)
        expect(shallow([1, 2, 3], [1, 2, 3])).toBe(true)
        expect(shallow(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(true)
      })

      it('returns false for arrays with different elements', () => {
        expect(shallow([1], [2])).toBe(false)
        expect(shallow([1, 2, 3], [1, 2, 4])).toBe(false)
      })

      it('returns false for arrays with different order', () => {
        expect(shallow([1, 2, 3], [3, 2, 1])).toBe(false)
        expect(shallow([1, 2], [2, 1])).toBe(false)
      })

      it('returns false for arrays with different lengths', () => {
        expect(shallow([1], [1, 2])).toBe(false)
        expect(shallow([1, 2, 3], [1, 2])).toBe(false)
      })

      it('returns true for same array reference', () => {
        const arr = [1, 2, 3]
        expect(shallow(arr, arr)).toBe(true)
      })
    })

    describe('arrays with special values', () => {
      it('handles undefined elements', () => {
        expect(shallow([undefined], [undefined])).toBe(true)
        expect(shallow([1, undefined, 3], [1, undefined, 3])).toBe(true)
      })

      it('handles null elements', () => {
        expect(shallow([null], [null])).toBe(true)
        expect(shallow([null, null], [null, null])).toBe(true)
      })

      it('handles mixed types', () => {
        expect(shallow([1, 'a', true, null], [1, 'a', true, null])).toBe(true)
      })
    })

    describe('sparse arrays', () => {
      it('handles sparse arrays', () => {
        const sparse1 = [1, , 3] // eslint-disable-line no-sparse-arrays
        const sparse2 = [1, , 3] // eslint-disable-line no-sparse-arrays
        expect(shallow(sparse1, sparse2)).toBe(true)
      })

      it('sparse array not equal to array with undefined', () => {
        const sparse = [1, , 3] // eslint-disable-line no-sparse-arrays
        const withUndefined = [1, undefined, 3]
        // Sparse arrays have holes, regular arrays have undefined
        // Object.keys includes indices for undefined but not for holes
        expect(shallow(sparse, withUndefined)).toBe(false)
      })
    })

    describe('nested arrays (shallow only)', () => {
      it('returns false for nested arrays with different references', () => {
        expect(shallow([[1]], [[1]])).toBe(false)
        expect(shallow([1, [2, 3]], [1, [2, 3]])).toBe(false)
      })

      it('returns true for nested arrays with same reference', () => {
        const nested = [2, 3]
        expect(shallow([1, nested], [1, nested])).toBe(true)
      })
    })
  })

  // ============================================================
  // Map
  // ============================================================
  describe('Map', () => {
    describe('basic Map comparison', () => {
      it('returns true for empty Maps', () => {
        expect(shallow(new Map(), new Map())).toBe(true)
      })

      it('returns true for Maps with same entries', () => {
        const map1 = new Map([['a', 1], ['b', 2]])
        const map2 = new Map([['a', 1], ['b', 2]])
        expect(shallow(map1, map2)).toBe(true)
      })

      it('returns false for Maps with different values', () => {
        const map1 = new Map([['a', 1]])
        const map2 = new Map([['a', 2]])
        expect(shallow(map1, map2)).toBe(false)
      })

      it('returns false for Maps with different keys', () => {
        const map1 = new Map([['a', 1]])
        const map2 = new Map([['b', 1]])
        expect(shallow(map1, map2)).toBe(false)
      })

      it('returns false for Maps with different sizes', () => {
        const map1 = new Map([['a', 1]])
        const map2 = new Map([['a', 1], ['b', 2]])
        expect(shallow(map1, map2)).toBe(false)
      })

      it('returns true for same Map reference', () => {
        const map = new Map([['a', 1]])
        expect(shallow(map, map)).toBe(true)
      })
    })

    describe('Map with special keys', () => {
      it('handles object keys', () => {
        const key = { id: 1 }
        const map1 = new Map([[key, 'value']])
        const map2 = new Map([[key, 'value']])
        expect(shallow(map1, map2)).toBe(true)
      })

      it('handles object keys with different references', () => {
        const map1 = new Map([[{ id: 1 }, 'value']])
        const map2 = new Map([[{ id: 1 }, 'value']])
        // Different object key references
        expect(shallow(map1, map2)).toBe(false)
      })
    })

    describe('Map with special values', () => {
      it('handles undefined values', () => {
        const map1 = new Map([['a', undefined]])
        const map2 = new Map([['a', undefined]])
        expect(shallow(map1, map2)).toBe(true)
      })

      it('handles NaN values', () => {
        const map1 = new Map([['a', NaN]])
        const map2 = new Map([['a', NaN]])
        expect(shallow(map1, map2)).toBe(true)
      })
    })
  })

  // ============================================================
  // Set
  // ============================================================
  describe('Set', () => {
    describe('basic Set comparison', () => {
      it('returns true for empty Sets', () => {
        expect(shallow(new Set(), new Set())).toBe(true)
      })

      it('returns true for Sets with same values', () => {
        const set1 = new Set([1, 2, 3])
        const set2 = new Set([1, 2, 3])
        expect(shallow(set1, set2)).toBe(true)
      })

      it('returns true for Sets with same values in different order', () => {
        const set1 = new Set([1, 2, 3])
        const set2 = new Set([3, 2, 1])
        expect(shallow(set1, set2)).toBe(true)
      })

      it('returns false for Sets with different values', () => {
        const set1 = new Set([1, 2, 3])
        const set2 = new Set([1, 2, 4])
        expect(shallow(set1, set2)).toBe(false)
      })

      it('returns false for Sets with different sizes', () => {
        const set1 = new Set([1, 2])
        const set2 = new Set([1, 2, 3])
        expect(shallow(set1, set2)).toBe(false)
      })

      it('returns true for same Set reference', () => {
        const set = new Set([1, 2, 3])
        expect(shallow(set, set)).toBe(true)
      })
    })

    describe('Set with special values', () => {
      it('handles NaN values', () => {
        const set1 = new Set([NaN])
        const set2 = new Set([NaN])
        expect(shallow(set1, set2)).toBe(true)
      })

      it('handles object values with same reference', () => {
        const obj = { a: 1 }
        const set1 = new Set([obj])
        const set2 = new Set([obj])
        expect(shallow(set1, set2)).toBe(true)
      })

      it('handles object values with different references', () => {
        const set1 = new Set([{ a: 1 }])
        const set2 = new Set([{ a: 1 }])
        expect(shallow(set1, set2)).toBe(false)
      })
    })
  })

  // ============================================================
  // Mixed types
  // ============================================================
  describe('mixed types', () => {
    it('empty array vs empty object - considered equal via Object.keys', () => {
      // Both have 0 keys, so shallow considers them equal
      expect(shallow([], {})).toBe(true)
    })

    it('array vs object with same numeric keys - considered equal', () => {
      // Object.keys treats array indices and object numeric keys the same
      expect(shallow([1, 2], { '0': 1, '1': 2 })).toBe(true)
    })

    it('Map vs object - falls through to Object.keys comparison', () => {
      // When only one is Map, falls through to Object.keys comparison
      // Map has no enumerable own properties, empty object has 0 keys
      expect(shallow(new Map(), {})).toBe(true)
      // Map([['a', 1]]) has no enumerable props, {a:1} has 1 key
      expect(shallow(new Map([['a', 1]]), { a: 1 })).toBe(false)
    })

    it('Set vs array - falls through to Object.keys comparison', () => {
      // When only one is Set, falls through to Object.keys comparison
      // Set has no enumerable own properties
      expect(shallow(new Set(), [])).toBe(true)
      // Set has 0 enumerable props, array has indices as keys
      expect(shallow(new Set([1, 2]), [1, 2])).toBe(false)
    })

    it('returns false for null vs empty object', () => {
      expect(shallow(null, {})).toBe(false)
    })

    it('returns false for undefined vs empty object', () => {
      expect(shallow(undefined, {})).toBe(false)
    })

    it('returns false for primitives vs objects', () => {
      expect(shallow(1, { valueOf: () => 1 })).toBe(false)
      expect(shallow('hello', { toString: () => 'hello' })).toBe(false)
    })

    it('returns false for different types with same "value"', () => {
      expect(shallow(0, false)).toBe(false)
      expect(shallow('', false)).toBe(false)
      expect(shallow(1, true)).toBe(false)
      expect(shallow('1', 1)).toBe(false)
    })
  })

  // ============================================================
  // Edge cases
  // ============================================================
  describe('edge cases', () => {
    it('handles Date objects - compared via Object.keys', () => {
      const date1 = new Date('2024-01-01')
      const date2 = new Date('2024-01-01')
      // Date objects have no own enumerable properties, so they compare equal
      expect(shallow(date1, date2)).toBe(true)

      // Same reference
      expect(shallow(date1, date1)).toBe(true)
    })

    it('handles RegExp objects - compared via Object.keys', () => {
      const regex1 = /test/
      const regex2 = /test/
      // RegExp objects have no own enumerable properties
      expect(shallow(regex1, regex2)).toBe(true)

      expect(shallow(regex1, regex1)).toBe(true)
    })

    it('handles functions - not objects, uses Object.is', () => {
      const fn1 = () => {}
      const fn2 = () => {}
      expect(shallow(fn1, fn2)).toBe(false) // Different references

      expect(shallow(fn1, fn1)).toBe(true)
    })

    it('handles objects with function values', () => {
      const fn = () => {}
      const obj1 = { fn }
      const obj2 = { fn }
      expect(shallow(obj1, obj2)).toBe(true) // Same function reference
    })

    it('handles very large objects', () => {
      const large1: Record<string, number> = {}
      const large2: Record<string, number> = {}
      for (let i = 0; i < 1000; i++) {
        large1[`key${i}`] = i
        large2[`key${i}`] = i
      }
      expect(shallow(large1, large2)).toBe(true)
    })

    it('handles objects with numeric string keys', () => {
      const obj1 = { '0': 'a', '1': 'b' }
      const obj2 = { '0': 'a', '1': 'b' }
      expect(shallow(obj1, obj2)).toBe(true)
    })

    it('handles Error objects - compared via Object.keys', () => {
      const err1 = new Error('test')
      const err2 = new Error('test')
      // Error.message is not enumerable, so errors compare by enumerable props
      expect(shallow(err1, err2)).toBe(true)

      expect(shallow(err1, err1)).toBe(true)
    })
  })

  // ============================================================
  // Real-world usage scenarios
  // ============================================================
  describe('real-world scenarios', () => {
    it('compares selector results correctly', () => {
      const state1 = { user: { name: 'John', age: 30 }, items: [1, 2, 3] }
      const state2 = { user: { name: 'John', age: 30 }, items: [1, 2, 3] }

      // Full state comparison - false (nested objects)
      expect(shallow(state1, state2)).toBe(false)

      // But with shared references
      const user = { name: 'John', age: 30 }
      const items = [1, 2, 3]
      const state3 = { user, items }
      const state4 = { user, items }
      expect(shallow(state3, state4)).toBe(true)
    })

    it('compares simple selectors correctly', () => {
      // Selecting primitive values
      expect(shallow(30, 30)).toBe(true)
      expect(shallow('John', 'John')).toBe(true)

      // Selecting arrays (same reference needed for true)
      const items = [1, 2, 3]
      expect(shallow(items, items)).toBe(true)
    })

    it('compares multi-value selectors', () => {
      // Pattern: returning object with multiple values
      const selector = (state: { a: number; b: number }) => ({
        sum: state.a + state.b,
        product: state.a * state.b,
      })

      const result1 = selector({ a: 2, b: 3 })
      const result2 = selector({ a: 2, b: 3 })

      expect(shallow(result1, result2)).toBe(true) // Same computed values
    })
  })
})
