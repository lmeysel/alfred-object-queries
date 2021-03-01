import { NonWordChars } from '../../src/Constants'

describe('Constants', () => {
	it('non-word chars', () => {
		function testRange(start: number, end: number) {
			if (start > 0) expect(NonWordChars).not.toContain(start - 1)
			expect(NonWordChars).toContain(start)
			if (start != end) expect(NonWordChars).toContain(end)
			expect(NonWordChars).not.toContain(end + 1)
		}

		testRange(0x00, 0x2c)
		testRange(0x2e, 0x2f)
		testRange(0x3a, 0x40)
		testRange(0x5b, 0x5e)
		testRange(0x60, 0x60)
		testRange(0x7b, 0xbf)
	})
})
