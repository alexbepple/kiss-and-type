import * as r from 'ramda'

const wrapAsFunctionIfNecessary = r.unless(r.is(Function), r.always)
export const runPipeFrom = r.curry((buildPipe, first, ...args) =>
  buildPipe(wrapAsFunctionIfNecessary(first), ...args)()
)

export const runPipe = runPipeFrom(r.pipe)
