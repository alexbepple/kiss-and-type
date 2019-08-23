import * as r from 'ramda'
import * as __ from 'hamjest'

const getGetterEnhancers = r.pipe(
  r.map((x) => ({ [x.name]: x.get })),
  r.mergeAll,
  r.reject(r.isNil)
)

const createType = (propDefs) => {
  const normalizedPropDefs = r.pipe(
    () => propDefs,
    r.map(r.unless(r.is(Object))(r.objOf('name')))
  )()
  const _props = r.pipe(
    () => normalizedPropDefs,
    r.map(r.prop('name')),
    r.map((x) => ({ [x]: x })),
    r.mergeAll
  )()
  const rawGet = r.map(r.prop)(_props)
  const get = r.mergeAll([
    rawGet,
    r.pipe(
      () => normalizedPropDefs,
      getGetterEnhancers,
      r.mapObjIndexed((fn, prop) =>
        r.pipe(
          rawGet[prop],
          fn
        )
      )
    )()
  ])

  return {
    props: r.map(r.always)(_props),
    get,
    pick: r.map((prop) => (obj) => ({ [prop]: get[prop](obj) }))(_props),
    set: r.map(r.assoc)(_props)
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

  describe('with prop defined in extended form', () => {
    const type = createType([{ name: 'prop' }])

    it('exposes all the same facilities as when prop is defined in basic form', () => {
      __.assertThat(type.get.prop({ prop: 42 }), __.is(42))
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
})
