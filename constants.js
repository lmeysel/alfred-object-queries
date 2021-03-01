const cc_plain = {
	CC_DQUOT: '"',
	CC_SQUOT: '\'',
	CC_ESCAPE: '\\',
	CC_SLASH: '/',
	CC_SPACE: ' ',
	CC_EQ: '=',
	CC_COLON: ':',
	CC_TILDE: '~',
	CC_GT: '>',
	CC_LT: '<',
	CC_PARENTHESES_OPEN: '(',
	CC_PARENTHESES_CLOSE: ')',
	CC_t: 't',
	CC_n: 'n',
};
const cc = {};
for (const key in cc_plain) {
	cc[key] = cc_plain[key].charCodeAt(0);
}

// these constants are made globally available using rollp-replace.
module.exports = { ...cc };
