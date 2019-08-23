import * as r from 'ramda'
import * as __ from 'hamjest'

const canonizePropDef = r.pipe(
  r.when(r.is(String))((def) => ({ name: def })),
  (withName) =>
    r.pipe(
      () => ({ publicName: withName.name, privateName: withName.name }),
      r.merge(withName),
      r.dissoc('name')
    )()
)

const getGetterEnhancers = r.pipe(
  r.map((x) => ({ [x.publicName]: x.get })),
  r.mergeAll,
  r.reject(r.isNil)
)

const createType = (propDefs) => {
  const canonicalPropDefs = r.map(canonizePropDef)(propDefs)
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

    it('exposes property names', () => {
      __.assertThat(type.props.prop(), __.is('prop'))
    })
    it('gives read access to properties', () => {
      __.assertThat(type.get.prop({ prop: 42 }), __.is(42))
    })
    it('gives write access to properties', () => {
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
    const type = createType([{ name: 'prop', get: r.defaultTo(0) }])

    it('applies enhancer upon raw value', () => {
      __.assertThat(type.get.prop({}), __.is(0))
    })
    it('uses enhancer for #pick', () => {
      __.assertThat(type.pick.prop({}), __.is({ prop: 0 }))
    })
  })

  describe('Canonical prop definition', () => {
    describe('can be derived from basic prop definition (just a string)', () => {
      it('derives public and private names', () => {
        __.assertThat(
          canonizePropDef('prop'),
          __.hasProperties({
            publicName: 'prop',
            privateName: 'prop'
          })
        )
      })
    })
    describe('can be derived from temporary extended definition', () => {
      it('derives public and private names', () => {
        __.assertThat(
          canonizePropDef({ name: 'prop' }),
          __.allOf(
            __.hasProperties({ publicName: 'prop', privateName: 'prop' }),
            __.not(__.hasProperty('name'))
          )
        )
      })
      it('preserves other props', () => {
        __.assertThat(
          canonizePropDef({ name: 'foo', get: 'bar' }),
          __.hasProperty('get')
        )
      })
    })
  })
})
