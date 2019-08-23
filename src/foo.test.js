import * as r from 'ramda'
import * as __ from 'hamjest'

const createType = (props) => {
  return {
    get: r.mergeAll(
      r.map((prop) => r.objOf(r.identity(prop), r.prop(prop)))(props)
    )
  }
}

describe('KISS type', () => {
  describe('in its most basic form', () => {
    const type = createType(['prop'])
    it('gives property access', () => {
      __.assertThat(type.get.prop({ prop: 42 }), __.is(42))
    })
  })
})
