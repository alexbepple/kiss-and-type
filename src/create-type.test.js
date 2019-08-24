import * as r from 'ramda'
import * as __ from 'hamjest'
import { canonizePropDef, createType } from './create-type'

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
      { prop: { alias: 'anAlias', get: r.defaultTo(0) } }
    ])
    it('applies enhancer upon raw value', () => {
      __.assertThat(type.get.anAlias({}), __.is(0))
    })
  })

  describe('with setter enhancer', () => {
    const type = createType([{ prop: { set: r.inc } }])

    it('applies enhancer upon given value', () => {
      __.assertThat(type.get.prop(type.set.prop(0)({})), __.is(1))
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
  describe('from extended definition with one alias', () => {
    it('is just a shorthand', () => {
      __.assertThat(
        canonizePropDef({ prop: { alias: ['alias'] } }),
        __.is(canonizePropDef({ prop: { alias: 'alias' } }))
      )
    })
  })
  describe('from extended definition with aliases', () => {
    it('derives public and private names', () => {
      __.assertThat(
        canonizePropDef({ prop: { alias: ['alias'] } }),
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
        canonizePropDef({ prop: { alias: ['alias'], get: 'fdsa' } }),
        __.everyItem(__.hasProperty('get'))
      )
    })
  })
})