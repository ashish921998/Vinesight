import { describe, it, expect } from 'vitest'
import { cn, capitalize } from '../utils'

describe('cn', () => {
  it('should merge class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3')
  })

  it('should merge Tailwind classes correctly', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('should handle arrays', () => {
    expect(cn(['class1', 'class2'])).toBe('class1 class2')
  })

  it('should handle objects', () => {
    expect(cn({ class1: true, class2: false, class3: true })).toBe('class1 class3')
  })

  it('should handle undefined and null', () => {
    expect(cn('class1', undefined, null, 'class2')).toBe('class1 class2')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle complex Tailwind merge scenarios', () => {
    // Override conflicting Tailwind classes
    expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500')
    expect(cn('text-sm', 'text-lg')).toBe('text-lg')
    expect(cn('p-4', 'px-2')).toBe('p-4 px-2')
  })
})

describe('capitalize', () => {
  it('should capitalize first letter and lowercase rest', () => {
    expect(capitalize('hello')).toBe('Hello')
  })

  it('should handle already capitalized strings', () => {
    expect(capitalize('Hello')).toBe('Hello')
  })

  it('should handle all uppercase strings', () => {
    expect(capitalize('HELLO')).toBe('Hello')
  })

  it('should handle mixed case strings', () => {
    expect(capitalize('hELLO')).toBe('Hello')
  })

  it('should handle single character strings', () => {
    expect(capitalize('a')).toBe('A')
  })

  it('should handle empty strings', () => {
    expect(capitalize('')).toBe('')
  })

  it('should handle strings with spaces', () => {
    expect(capitalize('hello world')).toBe('Hello world')
  })

  it('should handle strings starting with numbers', () => {
    expect(capitalize('123abc')).toBe('123abc')
  })

  it('should handle strings with special characters', () => {
    expect(capitalize('@hello')).toBe('@hello')
  })
})
