/// <reference types="jest-extended" />
import { InvalidCastParserError } from '../../src/ParserError'
import { QueryManager } from '../../src/QueryManager'
import { INVALID_CAST } from '../../src/support/casting'

describe('Query parser - advanced features', () => {
	describe('casting', () => {
		it('numeric', () => {
			expect(() =>
				QueryManager.create({ casts: { foo: 'number' } }).parse('foo: 005')
			).not.toThrow()
			expect(() =>
				QueryManager.create({ casts: { foo: 'number' } }).parse('foo: abc')
			).toThrowError(InvalidCastParserError)
		})
		it('numeric', () => {
			expect(() =>
				QueryManager.create({ casts: { foo: 'boolean' } }).parse('foo: yes')
			).not.toThrow()
			expect(() =>
				QueryManager.create({ casts: { foo: 'boolean' } }).parse('foo: false')
			).not.toThrow()
			expect(() =>
				QueryManager.create({ casts: { foo: 'boolean' } }).parse('foo: abc')
			).toThrowError(InvalidCastParserError)
		})
		it('custom cast', () => {
			expect(() =>
				QueryManager.create({
					casts: { foo: (v) => (/bar/.test(v) ? v : INVALID_CAST) },
				}).parse('foo: "bar baz"')
			).not.toThrow()
			expect(() =>
				QueryManager.create({
					casts: { foo: (v) => (/bar/.test(v) ? v : INVALID_CAST) },
				}).parse('foo: "qux baz"')
			).toThrowError(InvalidCastParserError)
		})
	})
})
