import * as r from 'ramda'
import * as __ from 'hamjest'
import { createType } from './create-type'

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
  it('enhance other prop retrievals, e.g. `pluck`', () => {
    __.assertThat(type.pluck.foo([{}, null]), __.is([0, 0]))
  })
})

describe('Setter enhancers', () => {
  const type = createType([{ foo: { set: Math.floor } }])
  it('enhance simple `set`', () => {
    __.assertThat(type.get.foo(type.set.foo(0.5)(null)), __.is(0))
  })
  it('enhance other prop modifiers, e.g. `objOf`', () => {
    __.assertThat(type.get.foo(type.objOf.foo(0.5)), __.is(0))
  })
})
