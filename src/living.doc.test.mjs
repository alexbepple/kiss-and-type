import * as r from 'ramda'
import * as __ from 'hamjest'
import { createType } from './create-type.mjs'

/*
 * The intent of this spec is to be an exhaustive, yet brief API documentation.
 *
 * Edge cases and other tests that do not add to a user’s high-level
 * understanding of the API, go somewhere else.
 */

const thing = { foo: 1, bar: 2, baz: 3 }

describe('Defining types: Basic and extended forms', () => {
  it('The most basic way to define props is to use strings.', () => {
    const type = createType(['foo', 'bar', 'baz'])
    __.assertThat(type.get.foo(thing), __.is(1))
    __.assertThat(type.get.bar(thing), __.is(2))
    __.assertThat(type.get.baz(thing), __.is(3))
    __.assertThat(() => type.get.xyz({}), __.throws())
  })
  it('Every basic definition can be converted into an extended form, which allows for advanced features.', () => {
    const type = createType(['foo', { bar: { alias: 'barAlias' } }, 'baz'])
    __.assertThat(type.get.barAlias(thing), __.is(2))
  })
  it('There can be multiple extended forms next to each other.', () => {
    const type = createType([
      'foo',
      { bar: { alias: 'barAlias' } },
      { baz: { alias: 'bazAlias' } }
    ])
    __.assertThat(type.get.bazAlias(thing), __.is(3))
  })
  it('In such a case, they can be merged.', () => {
    const type = createType([
      'foo',
      { bar: { alias: 'barAlias' }, baz: { alias: 'bazAlias' } }
    ])
    __.assertThat(type.get.barAlias(thing), __.is(2))
    __.assertThat(type.get.bazAlias(thing), __.is(3))
  })
})

describe('Lingo inspired by Ramda', () => {
  const type = createType(['foo'])

  it('#pick', () => {
    __.assertThat(type.pick.foo({ foo: 0, sthElse: null }), __.is({ foo: 0 }))
  })
  it('#pickAll', () => {
    __.assertThat(type.pickAll({ foo: 0, bar: 1 }), __.is({ foo: 0 }))
  })
  it('#pluck', () => {
    __.assertThat(
      type.pluck.foo([type.objOf.foo(0), type.objOf.foo(1)]),
      __.is([0, 1])
    )
  })
  it('#has', () => {
    __.assertThat(type.has.foo({}), __.is(false))
    __.assertThat(type.has.foo(type.objOf.foo(null)), __.is(false))
    __.assertThat(type.has.foo(type.objOf.foo(0)), __.is(true))
  })
  it('#eq', () => {
    const isFoo0 = type.eq.foo(0)
    __.assertThat(isFoo0(type.objOf.foo(0)), __.is(true))
    __.assertThat(isFoo0(type.objOf.foo(1)), __.is(false))
  })
  it('#findBy', () => {
    __.assertThat(
      type.findBy.foo(1)([
        type.objOf.foo(0),
        type.objOf.foo(1),
        type.objOf.foo(2)
      ]),
      __.is(type.objOf.foo(1))
    )
  })

  it('#objOf', () => {
    __.assertThat(type.objOf.foo(0), __.is(type.set.foo(0)({})))
  })

  it('#over', () => {
    __.assertThat(
      type.get.foo(type.over.foo(r.inc)(type.objOf.foo(0))),
      __.is(1)
    )
  })
})

describe('Aliases', () => {
  it('Yes, they alias.', () => {
    const type = createType([{ foo: { alias: 'fooAlias' } }])
    __.assertThat(type.get.fooAlias(thing), __.is(type.get.foo(thing)))
  })
  it('There can be many.', () => {
    const type = createType([{ foo: { alias: ['alias1', 'alias2'] } }])
    __.assertThat(type.get.alias1(thing), __.is(type.get.foo(thing)))
    __.assertThat(type.get.alias2(thing), __.is(type.get.foo(thing)))
  })
})

describe('Getter enhancers', () => {
  const type = createType([{ foo: { get: r.defaultTo(0) } }])
  it('enhance simple `get`', () => {
    __.assertThat(type.get.foo({}), __.is(0))
  })
  it('enhance other prop retrievals, e.g. #pluck', () => {
    __.assertThat(type.pluck.foo([{}, null]), __.is([0, 0]))
  })

  it('can optionally use the whole object', () => {
    const typeWithVirtualProp = createType([
      'a',
      { aPlus1: { get: (_, obj) => obj.a + 1 } }
    ])
    __.assertThat(typeWithVirtualProp.get.aPlus1({ a: 1 }), __.is(2))
  })
})

describe('Setter enhancers', () => {
  const type = createType([{ foo: { set: Math.floor } }])
  it('enhance simple `set`', () => {
    __.assertThat(type.get.foo(type.set.foo(0.5)(null)), __.is(0))
  })
  it('enhance other prop modifiers, e.g. #objOf', () => {
    __.assertThat(type.get.foo(type.objOf.foo(0.5)), __.is(0))
  })
})
