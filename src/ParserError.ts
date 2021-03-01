export class ParserError extends Error {
	constructor(message: string, public readonly position?: number) {
		super(message) /* istanbul ignore next */
		Object.setPrototypeOf(this, ParserError.prototype)
	}
}
export class ForbiddenPropertyParserError extends ParserError {
	constructor(public readonly prop: string, public readonly position?: number) {
		super(
			`Property "${prop}" cannot be queried as it is either blacklisted or not whitelisted.`,
			position
		) /* istanbul ignore next */
		Object.setPrototypeOf(this, ForbiddenPropertyParserError.prototype)
	}
}

export class InvalidCastParserError extends ParserError {
	constructor(
		public readonly prop: string,
		public readonly value: string,
		public readonly position?: number
	) {
		super(
			`Casting failed with value "${value}" for property "${prop}".`,
			position
		) /* istanbul ignore next */
		Object.setPrototypeOf(this, InvalidCastParserError.prototype)
	}
}

export class UnexpectedEndOfInputParserError extends ParserError {
	constructor(
		public readonly expectation: string,
		public readonly position?: number
	) {
		super(
			`Unexpected end of input (expected ${expectation})`,
			position
		) /* istanbul ignore next */
		Object.setPrototypeOf(this, UnexpectedEndOfInputParserError.prototype)
	}
}

export class UnexpectedClosingParserError extends ParserError {
	constructor(public readonly position?: number) {
		super(
			`Unexpected ) at position ${position} (too many parentheses?).`,
			position
		) /* istanbul ignore next */
		Object.setPrototypeOf(this, UnexpectedClosingParserError.prototype)
	}
}

export class UnexpectedTokenParserError extends ParserError {
	constructor(
		public readonly expected: string,
		public readonly position?: number
	) {
		super(
			`Expected "${expected}" at position ${position}.`,
			position
		) /* istanbul ignore next */
		Object.setPrototypeOf(this, UnexpectedTokenParserError.prototype)
	}
}
export class RunawayStringParserError extends ParserError {
	constructor(public readonly position?: number) {
		super(
			`Runaway string starting at position ${position}.`,
			position
		) /* istanbul ignore next */
		Object.setPrototypeOf(this, RunawayStringParserError.prototype)
	}
}
export class UnknownEscapeSequenceParserError extends ParserError {
	public readonly sequenceChar
	constructor(sequenceChar: number, public readonly position?: number) {
		super(
			`Unknown escape sequence \\${String.fromCharCode(
				sequenceChar
			)} at position ${position}.`,
			position
		) /* istanbul ignore next */
		this.sequenceChar = String.fromCharCode(sequenceChar)
		Object.setPrototypeOf(this, UnknownEscapeSequenceParserError.prototype)
	}
}
