import * as r from 'ramda'
import * as rr from './ramda-plus'

/*
Basic form (string form): 'foo'
Extended form (nested object form): { _foo: { alias: 'foo' } }
Canonical form: { privateName: '_foo', publicName: 'foo', … }
*/

const isBasicForm = r.is(String)
const basicForm2extendedForm = propName => ({ [propName]: {} })

const canonizeExtendedForm = r.pipe(
  r.evolve({ alias: rr.toArrayIfNecessary }),
  r.mergeRight({ alias: [] }),
  def =>
    rr.runPipe(
      r.concat(def.alias, [def.privateName]),
      r.map(publicName => r.assoc('publicName', publicName, def))
    )
)

export const canonizePropDef = r.pipe(
  r.when(isBasicForm)(basicForm2extendedForm),
  r.mapObjIndexed((val, key) => r.assoc('privateName', key, val)),
  r.map(canonizeExtendedForm),
  r.values,
  r.unnest
)

const explodeOnUnknownProp = (obj, prop) => {
  if (
    typeof prop === 'symbol' ||
    prop === 'inspect' ||
    prop === '@@functional/placeholder'
  ) {
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
  const propDefByName = rr.runPipe(
    propDefs,
    rr.toArrayIfNecessary,
    r.chain(canonizePropDef),
    r.indexBy(r.prop('publicName'))
  )
  const pluckDefined = prop =>
    rr.runPipe(propDefByName, r.pluck(prop), r.reject(r.isNil))

  const privateNameByPublicName = pluckDefined('privateName')

  const getterByName = rr.runPipe(
    privateNameByPublicName,
    r.mapObjIndexed((privateName, publicName) => {
      const rawGet = r.prop(privateName)
      const enhancedGet = r.defaultTo(r.identity)(
        pluckDefined('get')[publicName]
      )
      return obj => rr.runPipe(obj, rawGet, v => enhancedGet(v, obj))
    })
  )

  const pickOne = prop => obj => ({ [prop]: getterByName[prop](obj) })

  const rawSetterByName = r.map(r.assoc)(privateNameByPublicName)
  const setterByName = r.mergeWith(r.pipe)(pluckDefined('set'))(rawSetterByName)

  const lensByName = r.mergeWith(r.lens)(getterByName)(setterByName)

  const propLevelFns = r.map(preventAccessToUnknownProps)({
    props: r.map(r.always)(privateNameByPublicName),

    get: getterByName,
    pick: r.map(pickOne)(privateNameByPublicName),
    pluck: r.map(r.map)(getterByName),
    has: r.map(fn =>
      r.pipe(
        fn,
        r.complement(r.isNil)
      )
    )(getterByName),
    eq: r.map(fn => r.useWith(r.equals, [r.identity, fn]))(getterByName),
    findBy: r.map(fn =>
      r.useWith(r.find, [val => item => r.equals(val, fn(item)), r.identity])
    )(getterByName),

    set: setterByName,
    objOf: r.map(setFn => x => setFn(x)({}))(setterByName),

    over: r.map(r.over)(lensByName)
  })

  const typeLevelFns = {
    pickAll: r.pick(r.values(privateNameByPublicName))
  }

  return r.mergeRight(propLevelFns, typeLevelFns)
}
