import { StringEscapeChars, NonWordChars, ComparatorChars, Conjugations } from './Constants'
import { ForbiddenPropertyParserError, InvalidCastParserError, RunawayStringParserError, UnexpectedClosingParserError, UnexpectedEndOfInputParserError, UnexpectedTokenParserError, UnknownEscapeSequenceParserError } from './ParserError'
import { Token, QueryGroup, Condition, NormalizedCondition, NormalizedQueryGroup, NormalizedQuery, StringToken, ConjugationToken, Query } from './support/query'
import { Conjugation, Queryable, QueryStats } from './Common'
import { INVALID_CAST, ValueCastLookup } from './support/casting'
import { Comparator, DefaultComparisons } from './support/comparators'
import { QueryManager } from './QueryManager'
import { QueryMatcher } from './QueryMatcher'

declare type char = number
declare const CC_SQUOT: char
declare const CC_DQUOT: char
declare const CC_SPACE: char
declare const CC_ESCAPE: char
declare const CC_SLASH: char
declare const CC_PARENTHESES_OPEN: char
declare const CC_PARENTHESES_CLOSE: char

export class QueryParser<T extends Queryable>  {
	private pos = 0
	private len = 0
	private str = ''

	private tree: QueryGroup = []
	private normalizedTree: NormalizedQueryGroup = []

	private statsFields: Set<string> = new Set()
	private statsObj: QueryStats = { numberOfConditions: 0, numberOfFields: 0 }

	/**
   * @internal
   */
	public constructor(
		private factory: QueryManager<T>,
		private defaultConjugation: Conjugation,
		private blacklist: Set<string> | null,
		private whitelist: Set<string> | null,
		private casts: ValueCastLookup,
		private regex: boolean
	) { }

	parse(query: string): QueryParser<T> {
		this.str = query
		this.pos = 0
		this.len = query.length

		this.query(0, this.tree)

		this.normalizedTree = this.normalizeSubset(this.tree)
		if (
			this.normalizedTree.length === 1 &&
			this.normalizedTree[0].descriptor instanceof Array
		) {
			this.normalizedTree = this.normalizedTree[0]
				.descriptor as NormalizedQueryGroup
		}
		this.statsObj.numberOfFields = this.statsFields.size

		return this
	}

	matcher(): QueryMatcher<T> {
		return this.factory.getMatcherFor(this)
	}
	stats(): QueryStats {
		return this.statsObj
	}
	queriedFields(): string[] {
		return Array.from(this.statsFields)
	}
	getResult(): NormalizedQueryGroup {
		return this.normalizedTree
	}

	toString(normalized: boolean = false): string {
		if (normalized) return this.serialize(this.normalizedTree, true).trim()
		else return this.serialize(this.tree, false).trim()
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private serialize(subset: any, isNormalized: boolean): string {
		if (subset instanceof Array) {
			let res = ''
			for (const itm of subset) {
				const { descriptor, conjugation } = itm

				if (itm !== subset[0])
					if (isNormalized) res += conjugation + ' '
					else res += (conjugation?.value || this.defaultConjugation) + ' '

				if (descriptor instanceof Array)
					res += '(' + this.serialize(descriptor, isNormalized).trimEnd() + ') '
				else {
					res += this.serialize(descriptor, isNormalized) + ' '
				}
			}
			return res
		} else {
			let comparator: Comparator, property: string, value: string | RegExp
			if (isNormalized) {
				comparator = subset.comparator
				property = subset.property
				value = subset.value
			} else {
				comparator = subset.comparator.value
				property = subset.property.value
				value = subset.value.value
			}
			return `"${property}"${comparator}${value instanceof RegExp ? value.toString().replace(/i$/, '') : '"' + value + '"'}`
		}
	}

	private normalizeSubset(subset: QueryGroup): NormalizedQueryGroup {
		let index = 0
		const normalized: NormalizedQueryGroup = []
		const result: NormalizedQueryGroup = []

		const { statsObj, statsFields } = this

		for (let i = 0; i < subset.length; i++) {
			const itm = subset[i]
			if (itm.descriptor instanceof Array) {
				const tmp = this.normalizeSubset(itm.descriptor)
				normalized.push({
					conjugation: itm.conjugation
						? itm.conjugation.value
						: this.defaultConjugation,
					descriptor: tmp.length === 1 ? tmp[0].descriptor : tmp,
				})
			} else {
				const q = this.unwrapQuery(itm as Query<Condition>)
				normalized.push(q)
				statsObj.numberOfConditions++
				statsFields.add(q.descriptor.property)
			}

			const n = i + 1
			const { conjugation } = subset[n] || { conjugation: null }
			if (
				n == subset.length ||
				(conjugation && conjugation.value === 'or') ||
				(!conjugation && this.defaultConjugation === 'or')
			) {
				if (n - index >= 2) {
					const c = subset[index].conjugation
					result.push({
						conjugation: c ? c.value : this.defaultConjugation,
						descriptor: normalized.slice(index, n),
					})
				} else {
					result.push(normalized[i])
				}
				index = n
			}
		}
		return result
	}
	private unwrapQuery(
		query: Query<Condition>
	): NormalizedQuery<NormalizedCondition> {
		const { descriptor, conjugation } = query
		return {
			conjugation: conjugation?.value || this.defaultConjugation,
			descriptor: {
				property: descriptor.property.value,
				comparator: descriptor.comparator.value,
				value: descriptor.value.value,
			},
		}
	}

	/**
   * Find next non-whitespace character
   */
	private sneak() {
		while (this.consumeIf(CC_SPACE)); // noop
		return true
	}
	private peek(): char {
		return this.str.charCodeAt(this.pos)
	}
	private consumeIf(expected: char) {
		if (this.peek() === expected) {
			this.pos++
			return expected
		}
		return false
	}
	private query(depth: number, queries: QueryGroup) {
		let conjugation: StringToken | null = null,
			validConjugation = false
		while (this.pos < this.len) {
			this.sneak()
			const { pos } = this
			if (
				(!conjugation || validConjugation) &&
				this.consumeIf(CC_PARENTHESES_OPEN)
			) {
				const subquery: QueryGroup = []
				this.query(depth + 1, subquery)
				if (!this.consumeIf(CC_PARENTHESES_CLOSE))
					throw new UnexpectedEndOfInputParserError('")"', pos)
				queries.push({
					conjugation: conjugation as ConjugationToken,
					descriptor: subquery,
				})
				conjugation = null
				validConjugation = false
			} else if (this.peek() == CC_PARENTHESES_CLOSE) {
				if (depth === 0) throw new UnexpectedClosingParserError(this.pos - 1)
				break
			} else if (!conjugation) {
				conjugation = this.word(false)
				validConjugation = Conjugations.has(conjugation.value.toLowerCase())
				if (validConjugation && queries.length === 0)
					throw new UnexpectedTokenParserError('property', pos)
			} else {
				let property: StringToken
				if (!validConjugation) {
					property = conjugation
					conjugation = null
				} else property = this.word(false)

				this.sneak()
				const comparator = this.comparator()

				if (
					(this.whitelist && !this.whitelist.has(property.value)) ||
					this.blacklist?.has(property.value)
				)
					throw new ForbiddenPropertyParserError(property.value, property.start)

				let value: Token
				if (property.value in this.casts) {
					value = this.word(false)

					const cast = this.casts[property.value]
					const val = cast(value.value as string)
					if (val === INVALID_CAST)
						throw new InvalidCastParserError(
							property.value,
							value.value as string,
							value.start
						)
					value.value = val
				} else {
					value = this.word(true)
					if (value.kind === 'symbol' && !value.value)
						throw new UnexpectedTokenParserError('value', value.start)
				}
				if (typeof value.value === 'string')
					value.value = value.value.toLocaleLowerCase()

				queries.push({
					conjugation: conjugation as ConjugationToken | null,
					descriptor: { property, comparator, value },
				})
				conjugation = null
				validConjugation = false
			}
		}
		if (conjugation) {
			if (validConjugation)
				throw new UnexpectedEndOfInputParserError('condition', this.pos)
			else throw new UnexpectedEndOfInputParserError('comparator', this.pos)
		}
	}

	private comparator(): Token<'symbol', Comparator> {
		this.sneak()
		const { pos } = this
		if (ComparatorChars.has(this.str.charCodeAt(this.pos))) {
			let l = 1
			if (ComparatorChars.has(this.str.charCodeAt(this.pos + 1))) l = 2

			const op = this.str.substr(this.pos, l)
			if (op in DefaultComparisons) {
				this.pos += l
				return {
					kind: 'symbol',
					start: pos,
					end: this.pos,
					value: op as Comparator,
				}
			}
		}
		throw new UnexpectedTokenParserError('comparator', this.pos)
	}

	private word(regex: true): Token<'string' | 'symbol' | 'regex'>
	private word(regex: false): Token<'string' | 'symbol'>
	private word(regex: boolean): Token {
		this.sneak()
		const delimiter =
			this.consumeIf(CC_SQUOT) ||
			this.consumeIf(CC_DQUOT) ||
			this.consumeIf(CC_SLASH)
		if (delimiter === CC_SLASH && (!regex || !this.regex))
			throw new UnexpectedTokenParserError('string or symbol', this.pos)

		const result = delimiter
			? this.guzzleString(delimiter)
			: this.guzzleSymbol()

		return result
	}
	private guzzleSymbol(): Token {
		let { len, pos, str } = this
		const pStart = pos
		try {
			while (pos < len) {
				const char = str.charCodeAt(pos)
				if (NonWordChars.has(char)) {
					break
				}
				pos++
			}
			return {
				kind: 'symbol',
				start: pStart,
				end: pos,
				value: str.substring(this.pos, pos),
			}
		} finally {
			this.pos = pos
		}
	}
	private guzzleString(delimiter: char): Token {
		let { len, pos, str } = this

		let p0 = pos,
			pStart = pos
		let word = ''
		const isRegex = delimiter === CC_SLASH
		try {
			while (pos < len) {
				const char = str.charCodeAt(pos)
				if (char === CC_ESCAPE) {
					const esc = str.charCodeAt(pos + 1)
					if (isRegex) {
						pos++ // for regex do not unescape anything, as the regex ctor does it
					} else if (StringEscapeChars[esc]) {
						word += str.substring(p0, pos) + StringEscapeChars[esc]
						p0 = pos + 2
						pos++
					} else
						throw new UnknownEscapeSequenceParserError(
							str.charCodeAt(pos + 1),
							pos
						)
				} else if (char === delimiter) {
					word += str.substring(p0, pos)
					return {
						kind: isRegex ? 'regex' : 'string',
						start: pStart - 1,
						end: pos + 1,
						value: isRegex ? new RegExp(word, 'i') : word,
					}
				}
				pos++
			}
		} finally {
			this.pos = pos + 1
		}
		throw new RunawayStringParserError(pStart - 1)
	}
}
