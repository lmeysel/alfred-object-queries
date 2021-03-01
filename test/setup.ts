import constants from '../constants'

for (const key in constants) (global as unknown as Record<string, number>)[key] = constants[key]
