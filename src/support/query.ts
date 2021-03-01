import { Conjugation } from '../Common'
import { Comparator } from './comparators'

type TokenKind = 'symbol' | 'string' | 'regex'

export interface Token<
	T extends TokenKind = TokenKind,
	V = T extends 'regex' ? RegExp : string
> {
	kind: T
	start: number
	end: number
	value: T extends 'regex' ? RegExp : V
}
export type ConjugationToken = Token<'symbol', Conjugation>
export type ComparatorToken = Token<'symbol', Comparator>
export type StringToken = Token<'string' | 'symbol', string>

export interface Query<T = QueryGroup | Condition> {
	conjugation: ConjugationToken | null
	descriptor: T
}

export type QueryGroup = Array<Query>
export interface Condition<T extends TokenKind = TokenKind> {
	property: StringToken
	comparator: ComparatorToken
	value: Token<T>
}

export interface NormalizedQuery<
	T = NormalizedQueryGroup | NormalizedCondition
> {
	conjugation: Conjugation
	descriptor: T
}
export type NormalizedQueryGroup = Array<NormalizedQuery>
export interface NormalizedCondition {
	comparator: Comparator
	property: string
	value: string | RegExp
}
