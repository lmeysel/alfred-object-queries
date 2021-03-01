export function getTest(prefix: string): string {
	const name = expect.getState().currentTestName
	const index = name.lastIndexOf(prefix)
	if (index === -1)
		throw 'cannot find prefix in overall test name - make sure, prefix equals the description of the current context.'
	return name.substring(name.lastIndexOf(prefix) + prefix.length + 1)
}
