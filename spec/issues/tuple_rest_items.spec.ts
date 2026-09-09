import _Ajv from "../ajv"
import _Ajv2020 from "../ajv2020"
import chai from "../chai"
const should = chai.should()

const unconstrainedTuple = {
  type: "array",
  items: [{type: "string"}, {type: "number"}],
}

describe("tuple schemas with a schema for remaining items", () => {
  const ajv = new _Ajv({strictTuples: true})
  const ajv2020 = new _Ajv2020({strictTuples: true})

  function stillRejectsUnconstrained(): void {
    should.throw(() => {
      ajv.compile(unconstrainedTuple)
    }, /minItems or maxItems/)
  }

  it("allows a two-item prefix with remaining strings", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}, {type: "number"}],
      minItems: 2,
      additionalItems: {type: "string"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!(["ok", 1]).should.equal(true)
    validate!(["ok", 1, "more"]).should.equal(true)
    validate!(["ok", 1, 2]).should.equal(false)
    stillRejectsUnconstrained()
  })

  it("allows a one-item prefix with remaining numbers", () => {
    const schema = {
      type: "array",
      items: [{type: "boolean"}],
      minItems: 1,
      additionalItems: {type: "number"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!([true]).should.equal(true)
    validate!([true, 3]).should.equal(true)
    validate!([true, "no"]).should.equal(false)
    stillRejectsUnconstrained()
  })

  it("allows an empty remaining-items schema object", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}],
      minItems: 1,
      additionalItems: {},
    }
    should.not.throw(() => {
      ajv.compile(schema)
    })
    stillRejectsUnconstrained()
  })

  it("allows remaining items nested under properties", () => {
    const schema = {
      type: "object",
      properties: {
        coords: {
          type: "array",
          items: [{type: "number"}, {type: "number"}],
          minItems: 2,
          additionalItems: {type: "number"},
        },
      },
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!({coords: [1, 2, 3]}).should.equal(true)
    validate!({coords: [1, 2, "z"]}).should.equal(false)
    stillRejectsUnconstrained()
  })

  it("allows remaining items with a nested object schema", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}],
      minItems: 1,
      additionalItems: {
        type: "object",
        properties: {id: {type: "number"}},
        required: ["id"],
      },
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!(["head", {id: 1}]).should.equal(true)
    validate!(["head", {}]).should.equal(false)
    stillRejectsUnconstrained()
  })

  it("allows a boolean remaining-items schema", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}, {type: "string"}],
      minItems: 2,
      additionalItems: {type: "boolean"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!(["a", "b", true]).should.equal(true)
    validate!(["a", "b", "no"]).should.equal(false)
    stillRejectsUnconstrained()
  })

  it("allows draft-2020-12 prefixItems with a schema for later items", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "string"}, {type: "number"}],
      minItems: 2,
      items: {type: "string"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!(["ok", 1, "more"]).should.equal(true)
    validate!(["ok", 1, 2]).should.equal(false)
    stillRejectsUnconstrained()
  })

  it("allows draft-2020-12 prefixItems with remaining numbers", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "boolean"}],
      minItems: 1,
      items: {type: "integer"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!([false, 8]).should.equal(true)
    validate!([false, 1.5]).should.equal(false)
    stillRejectsUnconstrained()
  })
})
