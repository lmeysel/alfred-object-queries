import { Conjugation, ParserSettings, Queryable } from './Common'
import { Conjugations } from './Constants'
import { QueryMatcher, queryMatcher } from './QueryMatcher'
import { QueryParser } from './QueryParser'
import { StandardCasts, ValueCast, ValueCastLookup, ValueType } from './support/casting'
import { Comparator, ComparatorOverride, Comparison, DefaultComparisons } from './support/comparators'
import { PropertyGetterConfiguration } from './support/getters'

export class QueryManager<T extends Queryable = Queryable> {
	private defaultConjugation: Conjugation = 'and'
	private regex = true

	private blacklist: Set<string> | null = null
	private whitelist: Set<string> | null = null
	private getters: PropertyGetterConfiguration<T> = {}
	private casts: ValueCastLookup = {}

	private comparatorConfig: ComparatorOverride<T> = {}

	public static create<T extends Queryable = Queryable>(settings: ParserSettings<T> = {}): QueryManager<T> {
		return new QueryManager<T>(settings)
	}

	/**
   * @internal
   */
	public static parse<T extends Queryable>(query: string): QueryParser<T> {
		return new QueryManager<T>({}).parse(query)
	}

	private constructor(settings: ParserSettings<T>) {
		if (
			settings.defaultConjugation &&
			Conjugations.has(settings.defaultConjugation)
		)
			this.defaultConjugation = settings.defaultConjugation

		if (settings.blacklist && settings.whitelist)
			throw new Error('Cannot set both blacklist and whitelist.')
		else if (settings.blacklist) this.blacklist = new Set(settings.blacklist)
		else if (settings.whitelist) this.whitelist = new Set(settings.whitelist)

		if (typeof settings.regex === 'boolean') this.regex = settings.regex

		if (typeof settings.casts === 'object') {
			this.casts = {}
			for (const k in settings.casts)
				this.casts[k] =
					typeof settings.casts[k] === 'string'
						? StandardCasts[settings.casts[k] as ValueType]
						: (settings.casts[k] as ValueCast)
		}

		if (typeof settings.getters === 'object') {
			const obj = (this.getters = settings.getters)
			if (this.whitelist) {
				const keys = Object.keys(obj).filter((k) => !(this.whitelist as Set<string>).has(k))
				if (keys.length)
					throw new Error(`Please add the following getters to whitelist: ${keys.join(', ')}.`)
			}
			if (this.blacklist) {
				const keys = Object.keys(obj).filter((k) =>
					(this.blacklist as Set<string>).has(k)
				)
				if (keys.length)
					throw new Error(`Please remove the following getters from blacklist: ${keys.join(', ')}.`)
			}
		}

		if (typeof settings.comparatorOverrides === 'object') {
			const obj = (this.comparatorConfig = settings.comparatorOverrides)
			if (this.whitelist) {
				const keys = Object.keys(obj).filter((k) => !(this.whitelist as Set<string>).has(k))
				if (keys.length)
					throw new Error(
						`Comparators for the following fields have been overridden but are not whitelisted: ${keys.join(', ')}.`
					)
			}
			if (this.blacklist) {
				const keys = Object.keys(obj).filter((k) =>
					(this.blacklist as Set<string>).has(k)
				)
				if (keys.length)
					throw new Error(
						`Comparators for the following fields have been overridden while beeing blacklisted: ${keys.join(', ')}.`
					)
			}
		}
	}

	public getParser(): QueryParser<T> {
		return new QueryParser(
			this,
			this.defaultConjugation,
			this.blacklist,
			this.whitelist,
			this.casts,
			this.regex
		)
	}
	public parse(query: string): QueryParser<T> {
		return this.getParser().parse(query)
	}
	public getMatcher(query: string): QueryMatcher<T> {
		const parser = this.getParser()
		parser.parse(query)
		return this.getMatcherFor(parser)
	}

	/**
   * @internal
   */
	public getMatcherFor(parser: QueryParser<T>): QueryMatcher<T> {
		return queryMatcher(this, parser.getResult())
	}

	/**
   * @internal
   */
	public compare(comparator: Comparator, property: string, object: T, queryValue: string | RegExp): boolean {
		let fn: Comparison<T>
		if (property in this.comparatorConfig && comparator in this.comparatorConfig[property])
			fn = this.comparatorConfig[property][comparator] as Comparison<T>
		else fn = DefaultComparisons[comparator] as Comparison<T>;

		const itemValue = property in this.getters ?
			this.getters[property](object, queryValue as string, property) :
			object[property]

		return fn(itemValue, queryValue as string, object, property)
	}
}
