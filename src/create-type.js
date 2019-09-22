import * as r from 'ramda'

const toArrayIfNecessary = r.pipe(
  r.of,
  r.unnest
)

const canonizeObjectForm = r.pipe(
  r.evolve({ alias: toArrayIfNecessary }),
  r.merge({ alias: [] }),
  def =>
    r.pipe(
      () => r.concat(def.alias, [def.privateName]),
      r.map(publicName => r.assoc('publicName', publicName, def))
    )()
)
export const canonizePropDef = r.pipe(
  r.when(r.is(String))(propName => ({ [propName]: {} })),
  r.mapObjIndexed((val, key) => r.assoc('privateName', key, val)),
  r.map(canonizeObjectForm),
  r.values,
  r.unnest
)

export const createType = propDefs => {
  const pluckDefined = prop =>
    r.pipe(
      () => propDefs,
      r.chain(canonizePropDef),
      r.indexBy(r.prop('publicName')),
      r.pluck(prop),
      r.reject(r.isNil)
    )()

  const nameMap = pluckDefined('privateName')

  const rawGet = r.map(r.prop)(nameMap)
  const get = r.mergeWith(r.pipe)(rawGet)(pluckDefined('get'))

  const pickOne = prop => obj => ({ [prop]: get[prop](obj) })

  const rawSet = r.map(r.assoc)(nameMap)
  const set = r.mergeWith(r.pipe)(pluckDefined('set'))(rawSet)

  const lenses = r.mergeWith(r.lens)(get)(set)

  return {
    props: r.map(r.always)(nameMap),

    get,
    pick: r.map(pickOne)(nameMap),
    pluck: r.map(r.map)(get),
    has: r.map(fn =>
      r.pipe(
        fn,
        r.complement(r.isNil)
      )
    )(get),
    eq: r.map(fn => r.useWith(r.equals, [r.identity, fn]))(get),

    set,
    objOf: r.map(setFn => x => setFn(x, {}))(set),

    over: r.map(r.over)(lenses)
  }
}
