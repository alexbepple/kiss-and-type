import * as r from 'ramda'
import * as __ from 'hamjest'

const getOnlyKey = r.pipe(
  r.keys,
  r.head
)
const getOnlyValue = r.pipe(
  r.values,
  r.head
)

const canonizePropDef = r.pipe(
  r.when(r.is(String))((propName) => ({ [propName]: {} })),
  (nestedDef) =>
    r.merge(getOnlyValue(nestedDef), { privateName: getOnlyKey(nestedDef) }),
  r.merge({ aliases: [] }),
  (def) =>
    r.pipe(
      () => r.concat(def.aliases, [def.privateName]),
      r.map((publicName) => r.assoc('publicName', publicName, def))
    )()
)

const getGetterEnhancers = r.pipe(
  r.map((x) => ({ [x.publicName]: x.get })),
  r.mergeAll,
  r.reject(r.isNil)
)

const createType = (propDefs) => {
  const canonicalPropDefs = r.chain(canonizePropDef)(propDefs)
  const nameMap = r.pipe(
    () => canonicalPropDefs,
    r.map((x) => ({ [x.publicName]: x.privateName })),
    r.mergeAll
  )()
  const rawGet = r.map(r.prop)(nameMap)
  const get = r.mergeAll([
    rawGet,
    r.pipe(
      () => canonicalPropDefs,
      getGetterEnhancers,
      r.mapObjIndexed((fn, publicName) =>
        r.pipe(
          rawGet[publicName],
          fn
        )
      )
    )()
  ])

  return {
    props: r.map(r.always)(nameMap),
    get,
    pick: r.map((privateName) => (obj) => ({
      [privateName]: get[privateName](obj)
    }))(nameMap),
    set: r.map(r.assoc)(nameMap)
  }
}

describe('KISS type', () => {
  describe('in its most basic form', () => {
    const type = createType(['prop'])

    it('exposes property name', () => {
      __.assertThat(type.props.prop(), __.is('prop'))
    })
    it('gives read access to property', () => {
      __.assertThat(type.get.prop({ prop: 42 }), __.is(42))
    })
    it('gives write access to property', () => {
      __.assertThat(type.get.prop(type.set.prop(0)({})), __.is(0))
    })
    describe('adopts Ramda lingo', () => {
      it('#pick', () => {
        __.assertThat(
          type.pick.prop({ prop: 0, sthElse: null }),
          __.is({ prop: 0 })
        )
      })
    })
  })

  describe('with getter enhancer', () => {
    const type = createType([{ prop: { get: r.defaultTo(0) } }])

    it('applies enhancer upon raw value', () => {
      __.assertThat(type.get.prop({}), __.is(0))
    })
    it('uses enhancer for #pick', () => {
      __.assertThat(type.pick.prop({}), __.is({ prop: 0 }))
    })
  })

  describe('with alias', () => {
    const type = createType([{ prop: { aliases: ['alias'] } }])

    it('gives read access to property through alias', () => {
      __.assertThat(type.get.alias({ prop: 42 }), __.is(42))
    })
  })
})

describe('Canonical prop definition', () => {
  describe('from basic prop definition (just a string)', () => {
    it('derives public and private names', () => {
      __.assertThat(
        canonizePropDef('prop'),
        __.contains(
          __.hasProperties({
            publicName: 'prop',
            privateName: 'prop'
          })
        )
      )
    })
  })
  describe('from extended definition without aliases', () => {
    it('derives public and private names', () => {
      __.assertThat(
        canonizePropDef({ prop: {} }),
        __.contains(
          __.hasProperties({
            publicName: 'prop',
            privateName: 'prop'
          })
        )
      )
    })
    it('preserves other props', () => {
      __.assertThat(
        canonizePropDef({ prop: { get: 'fdsa' } }),
        __.contains(__.hasProperties({ get: 'fdsa' }))
      )
    })
  })
  describe('from extended definition with aliases', () => {
    it('derives public and private names', () => {
      __.assertThat(
        canonizePropDef({ prop: { aliases: ['alias'] } }),
        __.allOf(
          __.everyItem(__.hasProperties({ privateName: 'prop' })),
          __.containsInAnyOrder(
            __.hasProperties({ publicName: 'prop' }),
            __.hasProperties({ publicName: 'alias' })
          )
        )
      )
    })
    it('preserves other props', () => {
      __.assertThat(
        canonizePropDef({ prop: { aliases: ['alias'], get: 'fdsa' } }),
        __.everyItem(__.hasProperty('get'))
      )
    })
  })
})
