import * as r from 'ramda'
import * as __ from 'hamjest'

const createType = (props) => {
  const _props = r.mergeAll(r.map((x) => r.objOf(x, x))(props))
  return {
    props: r.map(r.always)(_props),
    get: r.map(r.prop)(_props),
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
  })
})
