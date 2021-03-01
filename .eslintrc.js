module.exports = {
	parser: '@typescript-eslint/parser',
	extends: ['plugin:@typescript-eslint/recommended'],
	parserOptions: {
		ecmaVersion: 2018,
		sourceType: 'module',
	},
	rules: {
		'quotes': ['warn', 'single'],
		'indent': 'off',
		'prefer-const': 'off',
		'@typescript-eslint/indent': ['warn', 'tab'],
		'@typescript-eslint/no-inferrable-types': 'off',
	},
}
