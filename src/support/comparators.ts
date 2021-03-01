import { Queryable } from '../Common'

export type Comparable = string | number | boolean
export type Comparison<T extends Queryable, U extends keyof T = keyof T, V = Comparable> = (itemValue: T[U], queryValue: V, object: T, property: U) => boolean

export type Comparator = ':' | '>' | '>=' | '<' | '<='

export type ComparatorConfiguration<T extends Queryable> =
	{ ':'?: Comparison<T, keyof T, Comparable | RegExp> } & { [k in '>' | '>=' | '<' | '<=']?: Comparison<T> }

export const DefaultComparisons: Required<ComparatorConfiguration<Queryable>> = {
	':': (itm, qry) => {
		if (qry instanceof RegExp) return qry.test(itm)
		else if (typeof qry === 'string')
			return itm.toLocaleLowerCase().indexOf(qry) !== -1
		else return itm == qry
	},
	'>': (itm, qry) => itm > qry,
	'>=': (itm, qry) => itm >= qry,
	'<=': (itm, qry) => itm <= qry,
	'<': (itm, qry) => itm < qry,
}

export type ComparatorOverride<T extends Queryable> = {
	[key in keyof T]?: ComparatorConfiguration<T>
} & { [key: string]: ComparatorConfiguration<T> }
