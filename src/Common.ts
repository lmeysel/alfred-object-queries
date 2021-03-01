import { ValueCastsSetting } from './support/casting'
import { ComparatorOverride } from './support/comparators'
import { PropertyGetterConfiguration } from './support/getters'

export interface QueryStats {
	/**
	 * The total number of conditions.
	 */
	numberOfConditions: number

	/**
	 * The number of queried fields, whereas fields occuring multiple times are counted once.
	 */
	numberOfFields: number
}

export type Queryable = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
export type Conjugation = 'and' | 'or'

export interface ParserSettings<T extends Queryable = Queryable> {
	/**
	 * Specify which fields can be queried.
	 */
	whitelist?: string[]
	/**
	 * Specify which fields cannot be queried.
	 */
	blacklist?: string[]
	/**
	 * True to allow RegExp in queries, false otherwise (defaults to true).
	 */
	regex?: boolean
	/**
	 * Set the default conjugation if user does not specify conjugation. Defaults to 'and'.
	 */
	defaultConjugation?: Conjugation

	/**
	 * Set which types the given values in queries should have.
	 */
	casts?: ValueCastsSetting<T>
	/**
	 * Define "custom" properties (like computed properties per object)
	 */
	getters?: PropertyGetterConfiguration<T>

	/**
	 * Override comparators per queried field.
	 */
	comparatorOverrides?: ComparatorOverride<T>
}
