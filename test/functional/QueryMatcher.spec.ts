/// <reference types="jest-extended" />
import { QueryManager } from '../../src/QueryManager'
import { getTest } from '../helper'

describe('query matching', () => {
	describe('truth tables', () => {
		const createObject = (flags: number, bits: number) => {
			const prop = 'abcdefghijklmnopqrstuvwxyz',
				res: { [k: string]: 'true' | 'false' | number } = { flags }
			for (let i = 0; i < bits; i++)
				res[prop.charAt(i)] = (flags >> (bits - i - 1)) & 1 ? 'true' : 'false'
			return res
		}
		const q = (expected: number[]) => {
			return () => {
				const p = QueryManager.parse(getTest('truth tables')),
					bits = p.stats().numberOfFields
				const res = Array.from(Array(1 << bits).keys())
					.map((i) => createObject(i, bits))
					.filter(p.matcher())
					.map((k) => k.flags)
				expect(res).toEqual(expected)
			}
		}

		it('a:true b:false', q([2]))
		it('a:true or b:true', q([1, 2, 3]))
		it('a:true and b:true', q([3]))
		it('a:true or b:true and c:true', q([3, 4, 5, 6, 7]))
		it('(a:true or b:true) and c:true', q([3, 5, 7]))
		it('(a:true and b:true or c:false) and d:true', q([1, 5, 9, 13, 15]))
	})

	describe('comparators', () => {
		const objects = [
			{ id: 1, count: 5, value: 'table-long' },
			{ id: 2, count: 8, value: 'table-SHORT' },
			{ id: 3, count: 10, value: 'table-striped' },
			{ id: 4, count: 2, value: 'table-StRiPeD-long' },
			{ id: 5, count: 4, value: 'table-striped-short' },
		]

		const q = (expected: number[]) => {
			return () => {
				const matcher = QueryManager.create().getMatcher(getTest('comparators'))
				const res = objects.filter(matcher).map((k) => k.id)
				expect(res).toEqual(expected)
			}
		}

		it('value: table-long', q([1]))
		it('value: taBLE-StrIpeD', q([3, 4, 5]))
		it('value: /^tablE-sHort/', q([2]))
		it('value: /short$/', q([2, 5]))
		it('count > 4', q([1, 2, 3]))
		it('count >= 4', q([1, 2, 3, 5]))
		it('count < 5', q([4, 5]))
		it('count <= 5', q([1, 4, 5]))
	})

	describe('touch order', () => {
		const q = (expected: number[], matching: boolean) => {
			return () => {
				const p = QueryManager.parse(getTest('touch order'))
				const order: number[] = [],
					obj = {}
				for (let i = 1; i <= 10; i++)
					Object.defineProperty(obj, i, {
						get() {
							order.push(i)
							return 'true'
						},
					})
				const match = [obj].filter(p.matcher())
				expect(order).toEqual(expected)
				expect(match).toBeArrayOfSize(matching ? 1 : 0)
			}
		}

		it('1:true 2:false 3:true', q([1, 2], false))
		it('1:false 2:true 3:true', q([1], false))
		it('1:true and (2:true 3:false) and 4: false', q([1, 2, 3], false))
		it('1:true and (2:true 3:false) or 4: false', q([1, 2, 3, 4], false))
		it('1:true or (2:true 3:false) or 4: false', q([1], true))
		it('1:false or (2:true or 3:false) and 4: true', q([1, 2, 4], true))
	})

	describe('custom getter', () => {
		const objects = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }]

		const q = (expected: number[]) => {
			return () => {
				const matcher = QueryManager.create<typeof objects[0]>({
					casts: { id_even: 'boolean' },
					getters: {
						id_even(obj) {
							return obj.id % 2 === 0
						},
					},
				}).getMatcher(getTest('custom getter'))
				const res = objects.filter(matcher).map((k) => k.id)
				expect(res).toEqual(expected)
			}
		}

		it('id_even: true', q([2, 4]))
		it('id_even: false', q([1, 3, 5]))
	})
	describe('operator overrides', () => {
		const objects = [
			{ id: 1, str: 'asdf' },
			{ id: 2, str: 'foobar' },
			{ id: 3, str: 'baz' },
			{ id: 4, str: 'qwert' },
			{ id: 5, str: '' },
		]

		const q = (expected: number[]) => {
			return () => {
				const matcher = QueryManager.create<typeof objects[0]>({
					comparatorOverrides: {
						str: {
							'<'(itm, qry) {
								return (itm as string).length < (qry as string).length
							},
						},
					},
				}).getMatcher(getTest('operator overrides'))
				const res = objects.filter(matcher).map((k) => k.id)
				expect(res).toEqual(expected)
			}
		}

		it('str < qwert', q([1, 3, 5]))
		it('str <= qwert', q([1, 2, 3, 4, 5]))
	})
})
