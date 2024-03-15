import * as r from 'ramda'

const toArrayIfNecessary = r.pipe(
  r.of,
  r.unnest
)

/*
Basic form (string form): 'foo'
Extended form (nested object form): { _foo: { alias: 'foo' } }
Canonical form: { privateName: '_foo', publicName: 'foo', … }
*/

const isBasicForm = r.is(String)
const basicForm2extendedForm = propName => ({ [propName]: {} })

const canonizeExtendedForm = r.pipe(
  r.evolve({ alias: toArrayIfNecessary }),
  r.mergeRight({ alias: [] }),
  def =>
    r.pipe(
      () => r.concat(def.alias, [def.privateName]),
      r.map(publicName => r.assoc('publicName', publicName, def))
    )()
)

export const canonize = r.pipe(
  r.when(isBasicForm)(basicForm2extendedForm),
  r.mapObjIndexed((val, key) => r.assoc('privateName', key, val)),
  r.map(canonizeExtendedForm),
  r.values,
  r.unnest
)

const explodeOnUnknownProp = (obj, prop) => {
  if (typeof prop === 'symbol' || prop === 'inspect') {
    return
  }

  if (prop in obj) {
    return obj[prop]
  }

  throw new TypeError(`Unknown property '${prop}'`)
}

const preventAccessToUnknownProps = x =>
  new Proxy(x, {
    get: explodeOnUnknownProp
  })

export const createType = propDefs => {
  const pluckDefined = prop =>
    r.pipe(
      () => propDefs,
      toArrayIfNecessary,
      r.chain(canonize),
      r.indexBy(r.prop('publicName')),
      r.pluck(prop),
      r.reject(r.isNil)
    )()

  const nameMap = pluckDefined('privateName')

  const get = r.pipe(
    () => nameMap,
    r.mapObjIndexed((privateName, publicName) => {
      const rawGet = r.prop(privateName)
      const enhancedGet = r.defaultTo(r.identity)(
        pluckDefined('get')[publicName]
      )
      return obj =>
        r.pipe(
          () => obj,
          rawGet,
          v => enhancedGet(v, obj)
        )()
    })
  )()

  const pickOne = prop => obj => ({ [prop]: get[prop](obj) })

  const rawSet = r.map(r.assoc)(nameMap)
  const set = r.mergeWith(r.pipe)(pluckDefined('set'))(rawSet)

  const lenses = r.mergeWith(r.lens)(get)(set)

  const fnsPerProp = r.map(preventAccessToUnknownProps)({
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
    findBy: r.map(fn =>
      r.useWith(r.find, [val => item => r.equals(val, fn(item)), r.identity])
    )(get),

    set,
    objOf: r.map(setFn => x => setFn(x)({}))(set),

    over: r.map(r.over)(lenses)
  })

  return r.mergeRight(fnsPerProp, { pickAll: r.pick(r.values(nameMap)) })
}
