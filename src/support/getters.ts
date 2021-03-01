import { Queryable } from '../Common'
import { Comparable } from './comparators'

export type PropertyGetter<T extends Queryable> = (
	object: T,
	queryValue: Comparable,
	property: string
) => any // eslint-disable-line @typescript-eslint/no-explicit-any
export type PropertyGetterConfiguration<T extends Queryable> = {
	[key: string]: PropertyGetter<T>
}
