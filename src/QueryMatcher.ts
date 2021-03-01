import { Queryable } from './Common'
import { QueryManager } from './QueryManager'
import { NormalizedCondition, NormalizedQueryGroup } from './support/query'

export type QueryMatcher<T extends Queryable> = (object: T) => boolean;

export function queryMatcher<T extends Queryable>(factory: QueryManager<T>, query: NormalizedQueryGroup): QueryMatcher<T> {
	function test(object: T, condition: NormalizedQueryGroup | NormalizedCondition): boolean {
		if (condition instanceof Array) {
			let match = false
			for (const itm of condition) {
				const { conjugation, descriptor } = itm
				if (itm === condition[0]) match = test(object, descriptor)
				else if (match && conjugation === 'and')
					match = match && test(object, descriptor)
				else if (!match && conjugation === 'or')
					match = match || test(object, descriptor)
			}
			return match
		} else {
			const { comparator, property, value } = condition
			return factory.compare(comparator, property, object, value)
		}
	}

	return function (object: T) {
		return test(object, query)
	}
}
