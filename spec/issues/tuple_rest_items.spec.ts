import _Ajv from "../ajv"
import _Ajv2019 from "../ajv2019"
import _Ajv2020 from "../ajv2020"
import chai from "../chai"
const should = chai.should()

describe("tuple schemas with a schema for remaining items", () => {
  const ajv = new _Ajv({strictTuples: true})
  const ajv2019 = new _Ajv2019({strictTuples: true})
  const ajv2020 = new _Ajv2020({strictTuples: true})

  function stillRejectsOpenEnded(): void {
    should.throw(() => {
      ajv.compile({
        type: "array",
        items: [{type: "string"}, {type: "number"}],
      })
    }, /minItems or maxItems/)

    should.throw(() => {
      ajv.compile({
        type: "array",
        items: [{type: "string"}],
        minItems: 1,
        additionalItems: true,
      })
    }, /minItems or maxItems/)

    should.throw(() => {
      ajv2020.compile({
        type: "array",
        prefixItems: [{type: "string"}],
        minItems: 1,
        items: true,
      })
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
    stillRejectsOpenEnded()
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
    stillRejectsOpenEnded()
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
    stillRejectsOpenEnded()
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
    stillRejectsOpenEnded()
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
    stillRejectsOpenEnded()
  })

  it("allows remaining items that use enum", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}],
      minItems: 1,
      additionalItems: {enum: ["n", "s", "e", "w"]},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!(["origin", "n", "e"]).should.equal(true)
    validate!(["origin", "up"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows remaining items that use anyOf", () => {
    const schema = {
      type: "array",
      items: [{type: "number"}, {type: "number"}],
      minItems: 2,
      additionalItems: {anyOf: [{type: "string"}, {type: "null"}]},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!([1, 2, "label", null]).should.equal(true)
    validate!([1, 2, true]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows remaining items under a nested pattern property", () => {
    const schema = {
      type: "object",
      patternProperties: {
        "^row-": {
          type: "array",
          items: [{type: "string"}],
          minItems: 1,
          additionalItems: {type: "integer"},
        },
      },
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!({"row-a": ["hdr", 2, 3]}).should.equal(true)
    validate!({"row-a": ["hdr", "x"]}).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2019-09 items tuples with remaining strings", () => {
    const schema = {
      type: "array",
      items: [{type: "boolean"}, {type: "boolean"}],
      minItems: 2,
      additionalItems: {type: "string"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2019.compile(schema)
    })
    validate!([true, false, "ok"]).should.equal(true)
    validate!([true, false, 1]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2019-09 remaining object items", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}],
      minItems: 1,
      additionalItems: {type: "object", minProperties: 1},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2019.compile(schema)
    })
    validate!(["h", {a: 1}]).should.equal(true)
    validate!(["h", {}]).should.equal(false)
    stillRejectsOpenEnded()
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
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 prefixItems with remaining integers", () => {
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
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 empty remaining-items schema", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "string"}, {type: "string"}],
      minItems: 2,
      items: {},
    }
    should.not.throw(() => {
      ajv2020.compile(schema)
    })
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 remaining items with maxLength", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "number"}],
      minItems: 1,
      items: {type: "string", maxLength: 2},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!([0, "ab", "c"]).should.equal(true)
    validate!([0, "abcd"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 remaining items nested in properties", () => {
    const schema = {
      type: "object",
      properties: {
        path: {
          type: "array",
          prefixItems: [{type: "string"}],
          minItems: 1,
          items: {type: "string", minLength: 1},
        },
      },
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!({path: ["root", "a", "b"]}).should.equal(true)
    validate!({path: ["root", ""]}).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 remaining items that use const", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "string"}, {type: "string"}],
      minItems: 2,
      items: {const: "tail"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!(["a", "b", "tail", "tail"]).should.equal(true)
    validate!(["a", "b", "no"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows a remaining-items schema when minItems is 0", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}],
      minItems: 0,
      additionalItems: {type: "number"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!([]).should.equal(true)
    validate!(["h", 1, 2]).should.equal(true)
    validate!(["h", "x"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows a remaining-items schema when minItems is smaller than the prefix", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}, {type: "number"}],
      minItems: 1,
      additionalItems: {type: "boolean"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!(["only"]).should.equal(true)
    validate!(["ok", 1, false]).should.equal(true)
    validate!(["ok", 1, "no"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows a remaining-items schema when minItems is omitted", () => {
    const schema = {
      type: "array",
      items: [{type: "boolean"}],
      additionalItems: {type: "string"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!([true, "a"]).should.equal(true)
    validate!([true, 1]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows a remaining-items schema together with a maxItems cap", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}, {type: "string"}],
      minItems: 0,
      maxItems: 5,
      additionalItems: {type: "number"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!(["a", "b", 1, 2]).should.equal(true)
    validate!(["a", "b", "z"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows remaining enum items when minItems is 0", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}],
      minItems: 0,
      additionalItems: {enum: ["n", "s"]},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!([]).should.equal(true)
    validate!(["h", "n"]).should.equal(true)
    validate!(["h", "x"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows remaining items nested under properties when minItems is 0", () => {
    const schema = {
      type: "object",
      properties: {
        row: {
          type: "array",
          items: [{type: "string"}],
          minItems: 0,
          additionalItems: {type: "integer"},
        },
      },
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!({row: []}).should.equal(true)
    validate!({row: ["h", 2]}).should.equal(true)
    validate!({row: ["h", "x"]}).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2019-09 remaining items when minItems is 0", () => {
    const schema = {
      type: "array",
      items: [{type: "boolean"}],
      minItems: 0,
      additionalItems: {type: "string"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2019.compile(schema)
    })
    validate!([true, "ok"]).should.equal(true)
    validate!([true, 1]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2019-09 remaining objects when minItems is omitted", () => {
    const schema = {
      type: "array",
      items: [{type: "string"}],
      additionalItems: {type: "object", minProperties: 1},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2019.compile(schema)
    })
    validate!(["h", {a: 1}]).should.equal(true)
    validate!(["h", {}]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 remaining items when minItems is 0", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "string"}],
      minItems: 0,
      items: {type: "number"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!([]).should.equal(true)
    validate!(["h", 1]).should.equal(true)
    validate!(["h", "x"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 remaining items when minItems is smaller than the prefix", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "string"}, {type: "number"}],
      minItems: 1,
      items: {type: "boolean"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!(["only"]).should.equal(true)
    validate!(["ok", 1, false]).should.equal(true)
    validate!(["ok", 1, "no"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 remaining items when minItems is omitted", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "boolean"}],
      items: {type: "string"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!([true, "a"]).should.equal(true)
    validate!([true, 1]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 empty remaining schema when minItems is 0", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "string"}, {type: "string"}],
      minItems: 0,
      items: {},
    }
    should.not.throw(() => {
      ajv2020.compile(schema)
    })
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 remaining const items when minItems is 0", () => {
    const schema = {
      type: "array",
      prefixItems: [{type: "string"}],
      minItems: 0,
      items: {const: "tail"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!(["h", "tail"]).should.equal(true)
    validate!(["h", "no"]).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows draft-2020-12 remaining items nested in properties when minItems is 0", () => {
    const schema = {
      type: "object",
      properties: {
        path: {
          type: "array",
          prefixItems: [{type: "string"}],
          minItems: 0,
          items: {type: "string", minLength: 1},
        },
      },
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv2020.compile(schema)
    })
    validate!({path: []}).should.equal(true)
    validate!({path: ["root", "a"]}).should.equal(true)
    validate!({path: ["root", ""]}).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows remaining items under patternProperties when minItems is smaller than the prefix", () => {
    const schema = {
      type: "object",
      patternProperties: {
        "^col-": {
          type: "array",
          items: [{type: "string"}, {type: "string"}],
          minItems: 1,
          additionalItems: {type: "integer"},
        },
      },
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!({"col-a": ["hdr"]}).should.equal(true)
    validate!({"col-a": ["a", "b", 3]}).should.equal(true)
    validate!({"col-a": ["a", "b", "x"]}).should.equal(false)
    stillRejectsOpenEnded()
  })

  it("allows a three-item prefix with remaining strings when minItems is 0", () => {
    const schema = {
      type: "array",
      items: [{type: "number"}, {type: "number"}, {type: "number"}],
      minItems: 0,
      additionalItems: {type: "string"},
    }
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = ajv.compile(schema)
    })
    validate!([1, 2, 3, "x"]).should.equal(true)
    validate!([1, 2, 3, 4]).should.equal(false)
    stillRejectsOpenEnded()
  })
})
