/// <reference types="jest-extended" />
import { QueryManager } from '../../src/QueryManager'

describe('Query manager (failures)', () => {
	it('getter not in whitelist', () => {
		expect(() =>
			QueryManager.create({ whitelist: [], getters: { foo: () => 0 } })
		).toThrowError()
		expect(() =>
			QueryManager.create({ whitelist: ['foo'], getters: { foo: () => 0 } })
		).not.toThrow()
	})
	it('getter in blacklist', () => {
		expect(() =>
			QueryManager.create({ blacklist: ['foo'], getters: { foo: () => 0 } })
		).toThrowError()
		expect(() =>
			QueryManager.create({ blacklist: [], getters: { foo: () => 0 } })
		).not.toThrowError()
	})
	it('comparator override not in whitelist', () => {
		expect(() =>
			QueryManager.create({
				whitelist: [],
				comparatorOverrides: { foo: { ':': () => false } },
			})
		).toThrowError()
		expect(() =>
			QueryManager.create({
				whitelist: ['foo'],
				comparatorOverrides: { foo: { ':': () => false } },
			})
		).not.toThrowError()
	})
	it('comparator override in blacklist', () => {
		expect(() =>
			QueryManager.create({
				blacklist: ['foo'],
				comparatorOverrides: { foo: { ':': () => false } },
			})
		).toThrowError()
		expect(() =>
			QueryManager.create({
				blacklist: [],
				comparatorOverrides: { foo: { ':': () => false } },
			})
		).not.toThrowError()
	})
})
