/* eslint-disable @typescript-eslint/no-explicit-any */
import { QueryParser } from '../../src/QueryParser'
import { Token } from '../../src/support/query'

describe('Query parser', () => {
	const Parser = (query: string) => {
		const res = new QueryParser(null as any, 'and', null, null, {}, true)
		const tmp = res as any
		tmp.str = query
		tmp.pos = 0
		tmp.len = query.length
		return res
	}

	it('Parse simple word', () => {
		const p = Parser('foo bar')
		const res = (p as any).word() as Token

		expect(res.value).toBe('foo')
		expect(res.start).toBe(0)
		expect(res.end).toBe(3)
	})
	it('Parse double-quoted string', () => {
		const p = Parser('"\\t\\"foobar baz"öalksdjf')
		const res = (p as any).word() as Token

		expect(res.value).toBe('\t"foobar baz')
		expect(res.start).toBe(0)
		expect(res.end).toBe(16)
	})
	it('Parse single-quoted string', () => {
		const p = Parser('\'\\t\\\'foobar baz\'öalksdjf')
		const res = (p as any).word() as Token

		expect(res.value).toBe('\t\'foobar baz')
		expect(res.start).toBe(0)
		expect(res.end).toBe(16)
	})
	it('Parse comparator string', () => {
		let res = (Parser('> foobar') as any).comparator() as Token

		expect(res.value).toBe('>')
		expect(res.start).toBe(0)
		expect(res.end).toBe(1)

		res = (Parser('>= foobar') as any).comparator() as Token

		expect(res.value).toBe('>=')
		expect(res.start).toBe(0)
		expect(res.end).toBe(2)
	})
	it('Parse single-quoted string with wrong escape sequence', () => {
		const p = Parser('"\\a"')

		expect(() => (p as any).word()).toThrowError()
	})
})
