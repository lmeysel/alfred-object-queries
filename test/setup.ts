// eslint-disable-next-line @typescript-eslint/no-var-requires
const constants = require('../constants');

for (const key in constants) (global as unknown as Record<string, number>)[key] = constants[key]
