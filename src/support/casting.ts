import { Queryable } from '../Common'

export const INVALID_CAST = Symbol()

const trueLiterals = new Set(['true', 'yes', '1'])
const falseLiterals = new Set(['false', 'no', '0'])

export const StandardCasts: { [key in 'boolean' | 'number']: ValueCast } = {
	number: (v) => {
		const res = parseFloat(v)
		if (isNaN(res)) return INVALID_CAST
		return res
	},
	boolean: (v) => {
		if (trueLiterals.has(v)) return true
		else if (falseLiterals.has(v)) return false
		else return INVALID_CAST
	},
}

export type ValueCast = (value: string) => any // eslint-disable-line @typescript-eslint/no-explicit-any
export type ValueType = keyof typeof StandardCasts
export type ValueCastsSetting<T extends Queryable> = {
	[property in keyof T]?: ValueType | ValueCast
} & { [property: number]: ValueType | ValueCast } & {
	[property: string]: ValueType | ValueCast
}

/** @internal */
export type ValueCastLookup = { [key: string]: ValueCast }
