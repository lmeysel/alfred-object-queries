/* eslint-disable @typescript-eslint/no-explicit-any */
/// <reference types="jest-extended" />
import { UnexpectedTokenParserError, ForbiddenPropertyParserError } from '../../src/ParserError'
import { QueryManager } from '../../src/QueryManager'
import { QueryGroup, Condition, Token, NormalizedQueryGroup } from '../../src/support/query'
import { getTest } from '../helper'

describe('Query parser', () => {
	function inspectToken(
		obj: any,
		property: string,
		comparator: string,
		value: string
	) {
		if (typeof obj.property === 'string') {
			expect(obj.property).toEqual(property)
			expect(obj.comparator).toEqual(comparator)
			expect(obj.value).toEqual(value)
		} else {
			expect(obj.property.value).toEqual(property)
			expect(obj.comparator.value).toEqual(comparator)
			expect(obj.value.value).toEqual(value)
		}
	}
	it('simple query', () => {
		const p = QueryManager.parse('hello: world')

		const res = (p as any).tree as QueryGroup
		expect(res).toHaveLength(1)
		expect(res[0]).toContainKeys(['conjugation', 'descriptor'])

		expect(res[0].conjugation).toBeNull()
		inspectToken(res[0].descriptor as Condition, 'hello', ':', 'world')
	})
	it('assume implicit and', () => {
		const p = QueryManager.parse('hello:world foo:bar')

		const res = (p as any).tree as QueryGroup
		expect(res).toHaveLength(2)
		expect(res[0]).toContainKeys(['conjugation', 'descriptor'])
		expect(res[1]).toContainKeys(['conjugation', 'descriptor'])

		expect(res[0].conjugation).toBeNull()
		inspectToken(res[0].descriptor as Condition, 'hello', ':', 'world')
		expect(res[1].conjugation).toBeNull()
		inspectToken(res[1].descriptor as Condition, 'foo', ':', 'bar')
	})
	it('consider explicit or', () => {
		const p = QueryManager.parse('hello:world or foo:bar')

		const res = (p as any).tree as QueryGroup
		expect(res).toHaveLength(2)
		expect(res[0]).toContainKeys(['conjugation', 'descriptor'])
		expect(res[1]).toContainKeys(['conjugation', 'descriptor'])

		expect(res[0].conjugation).toBeNull()
		inspectToken(res[0].descriptor as Condition, 'hello', ':', 'world')
		expect(res[1].conjugation as Token).toMatchObject({
			kind: 'symbol',
			value: 'or',
		})
		inspectToken(res[1].descriptor as Condition, 'foo', ':', 'bar')
	})
	it('grouping sub-query (implicit and)', () => {
		const p = QueryManager.parse('foo: bar (hello:world)')

		const res = (p as any).normalizedTree as NormalizedQueryGroup
		expect(res).toHaveLength(2)

		inspectToken(res[0].descriptor, 'foo', ':', 'bar')
		expect(res[1].conjugation).toEqual('and')
		expect(res[1].descriptor).not.toBeArray()
	})
	it('grouping sub-query (explicit or)', () => {
		const p = QueryManager.parse('foo: bar or (hello:world)')

		const res = (p as any).normalizedTree as NormalizedQueryGroup
		expect(res).toHaveLength(2)

		inspectToken(res[0].descriptor, 'foo', ':', 'bar')
		expect(res[1].conjugation).toEqual('or')
		expect(res[1].descriptor).not.toBeArray()
	})

	it('stats: queried fields', () => {
		const fields = QueryManager.parse(
			'foo: bar and foo < 5 or baz: 12'
		).queriedFields()
		expect(Array.from(fields)).toContainAllValues(['foo', 'baz'])
	})
	it('stats: result values', () => {
		const fields = QueryManager.parse(
			'foo: bar and (foo < 5 or baz: 12 bar:foo)'
		).stats()
		expect(fields).toEqual({ numberOfConditions: 4, numberOfFields: 3 })
	})

	describe('stringify parsed queries', () => {
		const q = (expected: string, defaultConjugation?: 'and' | 'or') => {
			return () => {
				const query = getTest('stringify parsed queries')
				const p = QueryManager.create({ defaultConjugation }).parse(query)
				expect(p.toString()).toBe(expected)
			}
		}
		it('a:b', q('"a":"b"'))
		it('a:b c:d', q('"a":"b" and "c":"d"'))
		it('a:b or c:d e:f', q('"a":"b" or "c":"d" and "e":"f"'))
		it('(a:b c:d)', q('("a":"b" and "c":"d")'))
	})

	describe('query normalization', () => {
		const prefix = 'query normalization' // must match description name!
		const q = (expected: string, defaultConjugation?: 'and' | 'or') => {
			return () => {
				const name = expect.getState().currentTestName
				const query = name.substring(
					name.lastIndexOf(prefix) + prefix.length + 1
				)
				const p = QueryManager.create({ defaultConjugation }).parse(query)
				expect(p.toString(true)).toBe(expected)
			}
		}
		it('a:b', q('"a":"b"'))
		it('a:b c:d', q('"a":"b" or "c":"d"', 'or'))
		it('a:b c:d', q('"a":"b" and "c":"d"', 'and'))
		it('(a:b)', q('"a":"b"'))
		it('(a:b or b:c)', q('"a":"b" or "b":"c"'))
		it('(a:b or b: /.*/)', q('"a":"b" or "b":/.*/'))
		it('(a:b or b: /\\/\\n/)', q('"a":"b" or "b":/\\/\\n/'))
		it(
			'(a:b or b:c) or c:d and e:f',
			q('("a":"b" or "b":"c") or ("c":"d" and "e":"f")')
		)
		it(
			'x:y and (a:b or b:c) or c:d and e:f',
			q('("x":"y" and ("a":"b" or "b":"c")) or ("c":"d" and "e":"f")')
		)
		it('(a:b (c:d)) e:f', q('("a":"b" and "c":"d") and "e":"f"'))
		it(
			'a:b c:d or e:f g:h',
			q('("a":"b" and "c":"d") or ("e":"f" and "g":"h")')
		)
		it(
			'a:b c:d or e:  "hello world" g:h',
			q('("a":"b" and "c":"d") or ("e":"hello world" and "g":"h")')
		)
	})

	describe('query-parser errors', () => {
		const q = () => {
			expect(() =>
				QueryManager.parse(getTest('query-parser errors'))
			).toThrowError()
		}
		it('a(b:a)', q)
		it('a:b)', q)
		it('(a:b and)', q)
		it('(a:b) and', q)
		it('(a:b', q)
		it('a', q)
		it('a:', q)
		it('and a:b', q)
		it('a := foo', q)
		it('a:"hello', q)
		it('/foobar/: sdf', q)

		it('Parser error due to disabled regex', () => {
			expect(() => QueryManager.parse('(b: /.*/)')).not.toThrow()
			expect(() =>
				QueryManager.create({ regex: false }).parse('(b: /.*/)')
			).toThrowError(UnexpectedTokenParserError)
		})
	})

	describe('black/whitelisting', () => {
		it('throw due to blacklisted property', () => {
			expect(() => QueryManager.parse('foo: bar')).not.toThrowError(
				ForbiddenPropertyParserError
			)
			expect(() =>
				QueryManager.create({ blacklist: ['foo'] }).parse('foo: bar')
			).toThrowError(ForbiddenPropertyParserError)
			expect(() =>
				QueryManager.create({ blacklist: ['bar'] }).parse('foo: bar')
			).not.toThrowError(ForbiddenPropertyParserError)
		})
		it('throw due to not-whitelisted propery', () => {
			expect(() => QueryManager.parse('foo: bar')).not.toThrowError(
				ForbiddenPropertyParserError
			)
			expect(() =>
				QueryManager.create({ whitelist: ['bar'] }).parse('foo: bar')
			).toThrowError(ForbiddenPropertyParserError)
			expect(() =>
				QueryManager.create({ whitelist: ['foo'] }).parse('foo: bar')
			).not.toThrowError(ForbiddenPropertyParserError)
		})
		it('throw due to setting both lists', () => {
			expect(() =>
				QueryManager.create({ whitelist: [], blacklist: [] })
			).toThrowError(Error)
		})
	})
})
