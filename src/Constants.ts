declare global {
	const CC_EQ: number
	const CC_COLON: number
	const CC_TILDE: number
	const CC_GT: number
	const CC_LT: number
	const CC_SQUOT: number
	const CC_DQUOT: number
	const CC_ESCAPE: number
	const CC_t: number
	const CC_n: number
}

export const NonWordChars = new Set([
	...Array.from(Array(45).keys()), // 0x00 .. 0x2c
	0x2e,
	0x2f,
	...Array.from(Array(7).keys()).map((n) => n + 0x3a), // 0x3a .. 0x40
	...Array.from(Array(4).keys()).map((n) => n + 0x5b), // 0x5b .. 0x60
	0x60,
	...Array.from(Array(69).keys()).map((n) => n + 0x7b), // 0x7b .. 0xbf
])

export const Conjugations = new Set(['and', 'or'])

export const ComparatorChars = new Set([
	CC_EQ,
	CC_COLON,
	CC_TILDE,
	CC_GT,
	CC_LT,
])

export const StringEscapeChars = {
	[CC_SQUOT]: '\'',
	[CC_DQUOT]: '"',
	[CC_ESCAPE]: '\\',
	[CC_t]: '\t',
	[CC_n]: '\n',
}
