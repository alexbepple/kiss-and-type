import * as r from 'ramda'

const getOnlyKey = r.pipe(
  r.keys,
  r.head
)
const getOnlyValue = r.pipe(
  r.values,
  r.head
)
const toArrayIfNecessary = r.pipe(
  r.of,
  r.unnest
)

export const canonizePropDef = r.pipe(
  r.when(r.is(String))((propName) => ({ [propName]: {} })),
  (nestedDef) =>
    r.merge(getOnlyValue(nestedDef), { privateName: getOnlyKey(nestedDef) }),
  r.evolve({ alias: toArrayIfNecessary }),
  r.merge({ alias: [] }),
  (def) =>
    r.pipe(
      () => r.concat(def.alias, [def.privateName]),
      r.map((publicName) => r.assoc('publicName', publicName, def))
    )()
)

export const createType = (propDefs) => {
  const pluckDefined = (prop) =>
    r.pipe(
      () => propDefs,
      r.chain(canonizePropDef),
      r.indexBy(r.prop('publicName')),
      r.pluck(prop),
      r.reject(r.isNil)
    )()

  const nameMap = pluckDefined('privateName')

  const rawGet = r.map(r.prop)(nameMap)
  const get = r.mergeAll([
    rawGet,
    r.pipe(
      () => pluckDefined('get'),
      r.mapObjIndexed((fn, publicName) =>
        r.pipe(
          rawGet[publicName],
          fn
        )
      )
    )()
  ])

  const pickOne = (prop) => (obj) => ({ [prop]: get[prop](obj) })

  const rawSet = r.map(r.assoc)(nameMap)
  const set = r.mergeAll([
    rawSet,
    r.pipe(
      () => pluckDefined('set'),
      r.mapObjIndexed((fn, publicName) =>
        r.pipe(
          fn,
          rawSet[publicName]
        )
      )
    )()
  ])

  return {
    props: r.map(r.always)(nameMap),
    get,
    pick: r.map(pickOne)(nameMap),
    set,
    objOf: r.map((setFn) => (x) => setFn(x, {}))(set)
  }
}
