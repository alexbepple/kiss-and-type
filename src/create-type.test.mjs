import * as util from 'node:util'
import * as r from 'ramda'
import * as __ from 'hamjest'
import { canonizePropDef, createType } from './create-type.mjs'

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
    it('fails on attempted access to unknown props', () => {
      const failsNicely = __.throws(
        __.typedError(TypeError, __.containsString('unknown')),
      )
      __.assertThat(() => type.get.unknown, failsNicely)
      __.assertThat(() => type.set.unknown, failsNicely)
    })
    describe('type properties can be enumerated/inspected', () => {
      it('by Node', () => {
        util.inspect(type.props)
        // alternative formulation: console.log(type.props)
      })
      it('by Ramda', () => {
        __.assertThat(r.keys(type.props), __.is(['prop']))
      })
    })
    describe('#findBy', () => {
      it('is curryable', () => {
        __.assertThat(
          type.findBy.prop(null)([]),
          __.is(type.findBy.prop(null, [])),
        )
      })
    })
  })

  describe('with getter enhancer', () => {
    const type = createType([{ prop: { get: r.defaultTo(0) } }])

    it('uses enhancer for #pick', () => {
      __.assertThat(type.pick.prop({}), __.is({ prop: 0 }))
    })
    it('uses enhancer for #findBy', () => {
      const item = {}
      __.assertThat(type.findBy.prop(0)([item]), __.is(item))
    })
  })

  describe('with alias', () => {
    const type = createType([{ prop: { alias: 'anAlias' } }])
    const obj = { prop: 42 }

    it('uses alias as a synonym for direct access', () => {
      __.assertThat(type.get.anAlias(obj), __.is(type.get.prop(obj)))
    })
    it('and otherwise', () => {
      __.assertThat(type.pick.anAlias(obj), __.is(type.pick.prop(obj)))
    })
  })

  describe('with alias and getter enhancer', () => {
    const type = createType([
      { prop: { alias: 'anAlias', get: r.defaultTo(0) } },
    ])
    it('applies enhancer upon raw value', () => {
      __.assertThat(type.get.anAlias({}), __.is(0))
    })
  })

  it('can be defined without array for prop in basic form', () => {
    const type = createType('foo')
    __.assertThat(type.get.foo({ foo: 0 }), __.is(0))
  })
})

describe('Prop definition: canonical form', () => {
  describe('from basic form (just a string)', () => {
    it('derives public and private names', () => {
      __.assertThat(
        canonizePropDef('prop'),
        __.contains(
          __.hasProperties({
            publicName: 'prop',
            privateName: 'prop',
          }),
        ),
      )
    })
  })

  describe('from extended form without aliases', () => {
    it('derives public and private names', () => {
      __.assertThat(
        canonizePropDef({ prop: {} }),
        __.contains(
          __.hasProperties({
            publicName: 'prop',
            privateName: 'prop',
          }),
        ),
      )
    })
    it('preserves other props', () => {
      __.assertThat(
        canonizePropDef({ prop: { get: 'fdsa' } }),
        __.contains(__.hasProperties({ get: 'fdsa' })),
      )
    })
  })

  describe('from extended form with multiple props', () => {
    it('derives definitions for all props', () => {
      __.assertThat(canonizePropDef({ foo: {}, bar: {} }), __.hasSize(2))
    })
  })

  describe('from extended form with one alias', () => {
    it('is just a shorthand to avoid array notation', () => {
      __.assertThat(
        canonizePropDef({ prop: { alias: 'alias' } }),
        __.is(canonizePropDef({ prop: { alias: ['alias'] } })),
      )
    })
  })
  describe('from extended form with multiple aliases', () => {
    it('derives public and private names', () => {
      __.assertThat(
        canonizePropDef({ prop: { alias: ['alias'] } }),
        __.allOf(
          __.everyItem(__.hasProperties({ privateName: 'prop' })),
          __.containsInAnyOrder(
            __.hasProperties({ publicName: 'prop' }),
            __.hasProperties({ publicName: 'alias' }),
          ),
        ),
      )
    })
    it('preserves other props', () => {
      __.assertThat(
        canonizePropDef({ prop: { alias: ['alias'], get: 'fdsa' } }),
        __.everyItem(__.hasProperty('get')),
      )
    })
  })
})

describe('Performance', () => {
  it('does not get worse', function () {
    this.timeout(70)
    for (let i = 0; i < 1000; i++) {
      createType(['foo'])
    }
  })
})
