import * as r from 'ramda'
import * as __ from 'hamjest'

const createType = (props) => {
  const _props = r.mergeAll(r.map((x) => r.objOf(x, x))(props))
  return {
    props: r.map(r.always)(_props),
    get: r.map(r.prop)(_props)
  }
}

describe('KISS type', () => {
  describe('in its most basic form', () => {
    const type = createType(['prop'])
    it('exposes property names', () => {
      __.assertThat(type.props.prop(), __.is('prop'))
    })
    it('gives property access', () => {
      __.assertThat(type.get.prop({ prop: 42 }), __.is(42))
    })
  })
})
