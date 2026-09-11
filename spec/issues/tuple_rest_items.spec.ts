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

    should.throw(() => {
      ajv.compile({
        type: "array",
        items: [{type: "string"}, {type: "number"}],
        additionalItems: false,
      })
    }, /minItems or maxItems/)

    should.throw(() => {
      ajv2020.compile({
        type: "array",
        prefixItems: [{type: "string"}],
        unevaluatedItems: true,
      })
    }, /minItems or maxItems/)
  }

  function expectSchema(
    compiler: {compile: (schema: object) => (data: unknown) => boolean},
    schema: object,
    good: unknown[],
    bad: unknown[]
  ): void {
    let validate: (data: unknown) => boolean
    should.not.throw(() => {
      validate = compiler.compile(schema)
    })
    for (const value of good) validate!(value).should.equal(true)
    for (const value of bad) validate!(value).should.equal(false)
    stillRejectsOpenEnded()
  }

  it("allows a two-item prefix with remaining strings", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        items: [{type: "string"}, {type: "number"}],
        minItems: 2,
        additionalItems: {type: "string"},
      },
      [
        ["ok", 1],
        ["ok", 1, "more"],
      ],
      [["ok", 1, 2]]
    )
  })

  it("allows remaining items nested under properties", () => {
    expectSchema(
      ajv,
      {
        type: "object",
        properties: {
          coords: {
            type: "array",
            items: [{type: "number"}, {type: "number"}],
            minItems: 2,
            additionalItems: {type: "number"},
          },
        },
      },
      [{coords: [1, 2, 3]}],
      [{coords: [1, 2, "z"]}]
    )
  })

  it("allows remaining items that use enum", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        items: [{type: "string"}],
        minItems: 1,
        additionalItems: {enum: ["n", "s", "e", "w"]},
      },
      [["origin", "n", "e"]],
      [["origin", "up"]]
    )
  })

  it("allows a remaining-items schema when minItems is omitted", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        items: [{type: "boolean"}],
        additionalItems: {type: "string"},
      },
      [[true, "a"]],
      [[true, 1]]
    )
  })

  it("allows remaining items referenced with $ref", () => {
    expectSchema(
      ajv,
      {
        $defs: {tail: {type: "number"}},
        type: "array",
        items: [{type: "string"}],
        minItems: 1,
        additionalItems: {$ref: "#/$defs/tail"},
      },
      [["h", 1, 2]],
      [["h", "x"]]
    )
  })

  it("allows draft-2019-09 remaining object items", () => {
    expectSchema(
      ajv2019,
      {
        type: "array",
        items: [{type: "string"}],
        minItems: 1,
        additionalItems: {type: "object", minProperties: 1},
      },
      [["h", {a: 1}]],
      [["h", {}]]
    )
  })

  it("allows draft-2020-12 prefixItems with a schema for later items", () => {
    expectSchema(
      ajv2020,
      {
        type: "array",
        prefixItems: [{type: "string"}, {type: "number"}],
        minItems: 2,
        items: {type: "string"},
      },
      [["ok", 1, "more"]],
      [["ok", 1, 2]]
    )
  })

  it("allows draft-2020-12 remaining items when minItems is 0", () => {
    expectSchema(
      ajv2020,
      {
        type: "array",
        prefixItems: [{type: "string"}],
        minItems: 0,
        items: {type: "number"},
      },
      [[], ["h", 1]],
      [["h", "x"]]
    )
  })

  it("allows a closed two-item prefix with the last slot optional", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        items: [{type: "string"}, {type: "number"}],
        minItems: 1,
        additionalItems: false,
      },
      [["only"], ["ok", 1]],
      [["ok", 1, true]]
    )
  })

  it("allows remaining items via unevaluatedItems in draft-2020-12", () => {
    expectSchema(
      ajv2020,
      {
        type: "array",
        prefixItems: [{type: "string"}],
        minItems: 1,
        unevaluatedItems: {type: "number"},
      },
      [["h", 1]],
      [["h", "x"]]
    )
  })

  it("allows unevaluatedItems remaining items when minItems is omitted", () => {
    expectSchema(
      ajv2020,
      {
        type: "array",
        prefixItems: [{type: "boolean"}],
        unevaluatedItems: {type: "string"},
      },
      [[true, "a"]],
      [[true, 1]]
    )
  })

  it("allows a closed prefix nested under properties", () => {
    expectSchema(
      ajv,
      {
        type: "object",
        properties: {
          pair: {
            type: "array",
            items: [{type: "number"}, {type: "number"}],
            minItems: 1,
            additionalItems: false,
          },
        },
      },
      [{pair: [1]}, {pair: [1, 2]}],
      [{pair: [1, 2, 3]}]
    )
  })

  const closedString = {
    type: "array",
    items: [{type: "string"}],
    additionalItems: false,
  }

  const closedPair = {
    type: "array",
    items: [{type: "string"}, {type: "number"}],
    additionalItems: false,
  }

  const closed2020 = {
    type: "array",
    prefixItems: [{type: "boolean"}],
    items: false,
  }

  it("allows a closed tuple as one anyOf arm without local minItems", () => {
    expectSchema(
      ajv,
      {anyOf: [closedString, {type: "string"}]},
      [["ok"], "ok"],
      [[1]]
    )
  })

  it("allows a closed two-item tuple as one anyOf arm without minItems", () => {
    expectSchema(
      ajv,
      {anyOf: [closedPair, {type: "null"}]},
      [["ok", 1], null],
      [["ok", "x"]]
    )
  })

  it("allows a closed tuple as one oneOf arm without local minItems", () => {
    expectSchema(
      ajv,
      {
        oneOf: [
          {
            type: "array",
            items: [{type: "number"}, {type: "number"}],
            additionalItems: false,
          },
          {type: "null"},
        ],
      },
      [[1, 2], null],
      [[1, 2, 3]]
    )
  })

  it("allows a closed integer tuple as a oneOf arm without minItems", () => {
    expectSchema(
      ajv,
      {
        oneOf: [
          {
            type: "array",
            items: [{type: "integer"}],
            additionalItems: false,
          },
          {type: "boolean"},
        ],
      },
      [[3], false],
      [[3, 4]]
    )
  })

  it("allows a closed tuple inside not without local minItems", () => {
    expectSchema(
      ajv,
      {not: closedString},
      ["ok", [1]],
      [["ok"]]
    )
  })

  it("allows a closed two-item tuple inside not without minItems", () => {
    expectSchema(
      ajv,
      {not: closedPair},
      ["ok", [1, 2], ["ok", 1, true]],
      [["ok", 1], ["ok"]]
    )
  })

  it("allows draft-2020-12 closed prefixItems as an anyOf arm", () => {
    expectSchema(
      ajv2020,
      {anyOf: [closed2020, {type: "boolean"}]},
      [[true], false],
      [[true, false]]
    )
  })

  it("allows draft-2020-12 closed prefixItems as a oneOf arm", () => {
    expectSchema(
      ajv2020,
      {
        oneOf: [
          {
            type: "array",
            prefixItems: [{type: "string"}, {type: "number"}],
            items: false,
          },
          {type: "null"},
        ],
      },
      [["ok", 1], null],
      [["ok", 1, true]]
    )
  })

  it("allows draft-2020-12 closed prefixItems inside not", () => {
    expectSchema(
      ajv2020,
      {not: closed2020},
      ["ok", [true, false]],
      [[true]]
    )
  })

  it("allows a closed tuple inside then when if has no minItems", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        if: {type: "array"},
        then: {
          additionalItems: false,
          items: [{type: "string", enum: ["a", "b", "c"]}],
        },
      },
      [["a"]],
      [["z"]]
    )
  })

  it("allows a closed two-item tuple inside then when if has no minItems", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        if: {type: "array"},
        then: {
          additionalItems: false,
          items: [{type: "string"}, {type: "object"}],
        },
      },
      [["a", {}]],
      [["a", "x"]]
    )
  })

  it("allows closed tuples in then and else when if has no minItems", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        if: {contains: {const: "flag"}},
        then: {
          additionalItems: false,
          items: [{const: "flag"}],
        },
        else: {
          additionalItems: false,
          items: [{type: "string"}, {type: "number"}],
        },
      },
      [["flag"], ["a", 1]],
      [["a", "x"]]
    )
  })

  it("allows a closed tuple inside else when if has no minItems", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        if: {const: ["skip"]},
        then: {type: "array"},
        else: {
          additionalItems: false,
          items: [{type: "string"}],
        },
      },
      [["skip"], ["ok"]],
      [["ok", "x"]]
    )
  })

  it("allows a closed tuple inside then when if uses a const value", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        if: {const: ["flag"]},
        then: {
          additionalItems: false,
          items: [{const: "flag"}],
        },
      },
      [["flag"], ["other"]],
      []
    )
  })

  it("allows allOf-composed if/then closed tuples without minItems", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        allOf: [
          {
            if: {type: "array"},
            then: {
              additionalItems: false,
              items: [{type: "string", enum: ["a", "b", "c"]}],
            },
          },
        ],
      },
      [["a"]],
      [["z"]]
    )
  })

  it("allows draft-2020-12 closed prefixItems inside then without minItems", () => {
    expectSchema(
      ajv2020,
      {
        type: "array",
        if: {type: "array"},
        then: {
          prefixItems: [{type: "string"}, {type: "number"}],
          items: false,
        },
      },
      [["ok", 1]],
      [["ok", 1, true]]
    )
  })

  it("allows closed prefixItems inside else without minItems", () => {
    expectSchema(
      ajv2020,
      {
        type: "array",
        if: {const: [0]},
        then: {
          prefixItems: [{type: "number"}],
          items: false,
        },
        else: {
          prefixItems: [{type: "number"}, {type: "string"}],
          items: false,
        },
      },
      [[0], [1, "x"]],
      [[1, 2]]
    )
  })

  it("allows closed tuples inside then nested under properties without minItems", () => {
    expectSchema(
      ajv,
      {
        type: "object",
        properties: {
          cell: {
            type: "array",
            if: {type: "array"},
            then: {
              additionalItems: false,
              items: [{type: "integer"}],
            },
          },
        },
      },
      [{cell: [3]}],
      [{cell: ["x"]}]
    )
  })

  it("allows a closed three-item prefix inside then under patternProperties", () => {
    expectSchema(
      ajv,
      {
        type: "object",
        patternProperties: {
          "^cell-": {
            type: "array",
            if: {type: "array"},
            then: {
              additionalItems: false,
              items: [{type: "string"}, {type: "string"}, {type: "number"}],
            },
          },
        },
      },
      [{"cell-a": ["a", "b", 1]}],
      [{"cell-a": ["a", "b", "x"]}]
    )
  })

  it("allows draft-2019-09 closed tuples inside then without minItems", () => {
    expectSchema(
      ajv2019,
      {
        type: "array",
        if: {type: "array"},
        then: {
          additionalItems: false,
          items: [{type: "boolean"}, {type: "boolean"}],
        },
      },
      [[true, false]],
      [[true, "x"]]
    )
  })

  it("allows a closed tuple as an anyOf arm nested under properties", () => {
    expectSchema(
      ajv,
      {
        type: "object",
        properties: {
          value: {
            anyOf: [closedString, {type: "number"}],
          },
        },
      },
      [{value: ["ok"]}, {value: 1}],
      [{value: [1]}]
    )
  })

  it("allows a closed tuple as an anyOf arm nested under patternProperties", () => {
    expectSchema(
      ajv,
      {
        type: "object",
        patternProperties: {
          "^v-": {
            anyOf: [closedPair, {type: "boolean"}],
          },
        },
      },
      [{"v-a": ["ok", 1]}, {"v-a": true}],
      [{"v-a": ["ok", "x"]}]
    )
  })

  it("allows two closed anyOf arms with different prefix lengths and no minItems", () => {
    expectSchema(
      ajv,
      {
        anyOf: [
          closedString,
          {
            type: "array",
            items: [{type: "string"}, {type: "object"}],
            additionalItems: false,
          },
        ],
      },
      [["ok"], ["ok", {}]],
      [["ok", {}, 1]]
    )
  })

  it("allows a closed tuple inside anyOf next to an object arm", () => {
    expectSchema(
      ajv,
      {
        anyOf: [
          closedPair,
          {
            type: "object",
            properties: {ok: {type: "boolean"}},
            required: ["ok"],
          },
        ],
      },
      [["ok", 1], {ok: true}],
      [["ok", 1, true]]
    )
  })

  it("allows a closed tuple inside oneOf next to an enum arm", () => {
    expectSchema(
      ajv,
      {
        oneOf: [
          {
            type: "array",
            items: [{enum: ["n", "s"]}],
            additionalItems: false,
          },
          {const: "none"},
        ],
      },
      [["n"], "none"],
      [["n", "s"]]
    )
  })

  it("allows a closed tuple inside not nested under properties", () => {
    expectSchema(
      ajv,
      {
        type: "object",
        properties: {
          skip: {not: closedString},
        },
      },
      [{skip: "ok"}, {skip: [1]}],
      [{skip: ["ok"]}]
    )
  })

  it("allows draft-2020-12 closed prefixItems inside anyOf nested in properties", () => {
    expectSchema(
      ajv2020,
      {
        type: "object",
        properties: {
          path: {anyOf: [closed2020, {type: "string"}]},
        },
      },
      [{path: [true]}, {path: "root"}],
      [{path: [true, false]}]
    )
  })

  it("allows a closed remaining unevaluatedItems tuple as an anyOf arm", () => {
    expectSchema(
      ajv2019,
      {
        anyOf: [
          {
            type: "array",
            items: [{type: "string"}],
            unevaluatedItems: false,
          },
          {type: "string"},
        ],
      },
      [["ok"], "ok"],
      [["ok", "x"]]
    )
  })

  it("allows draft-2020-12 closed unevaluatedItems as a oneOf arm", () => {
    expectSchema(
      ajv2020,
      {
        oneOf: [
          {
            type: "array",
            prefixItems: [{type: "string"}, {type: "string"}],
            unevaluatedItems: false,
          },
          {type: "null"},
        ],
      },
      [["a", "b"], null],
      [["a", "b", "c"]]
    )
  })

  it("allows a closed tuple inside then with if matching via required items shape", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        if: {contains: {type: "number"}},
        then: {
          additionalItems: false,
          items: [{type: "number"}],
        },
      },
      [[1]],
      [[1, 2]]
    )
  })

  it("allows a closed tuple inside else with if matching via enum", () => {
    expectSchema(
      ajv,
      {
        type: "array",
        if: {const: ["special"]},
        then: {type: "array"},
        else: closedPair,
      },
      [["special"], ["ok", 1]],
      [["ok", "x"]]
    )
  })

  it("allows a closed tuple as the only anyOf arm without minItems", () => {
    expectSchema(ajv, {anyOf: [closedString]}, [["ok"]], [[1], ["ok", "x"]])
  })

  it("allows a closed tuple as the only oneOf arm without minItems", () => {
    expectSchema(ajv, {oneOf: [closedPair]}, [["ok", 1], ["ok"]], [["ok", "x"], ["ok", 1, 2]])
  })

  it("allows draft-2019-09 closed additionalItems as an anyOf arm", () => {
    expectSchema(
      ajv2019,
      {
        anyOf: [
          {
            type: "array",
            items: [{type: "boolean"}, {type: "string"}],
            additionalItems: false,
          },
          {type: "number"},
        ],
      },
      [[true, "ok"], 4],
      [[true, "ok", 1]]
    )
  })

  it("allows a closed enum prefix as a not schema without minItems", () => {
    expectSchema(
      ajv,
      {
        not: {
          type: "array",
          items: [{enum: ["a", "b"]}],
          additionalItems: false,
        },
      },
      ["a", ["a", "b"]],
      [["a"]]
    )
  })

  it("allows nested anyOf of closed tuples without minItems", () => {
    expectSchema(
      ajv,
      {
        anyOf: [
          {anyOf: [closedString, {type: "null"}]},
          {type: "number"},
        ],
      },
      [["ok"], null, 1],
      [[1]]
    )
  })

  it("allows a closed tuple inside then nested under items of an object property", () => {
    expectSchema(
      ajv,
      {
        type: "object",
        properties: {
          rows: {
            type: "array",
            items: {
              type: "array",
              if: {type: "array"},
              then: {
                additionalItems: false,
                items: [{type: "string"}],
              },
            },
          },
        },
      },
      [{rows: [["a"], ["b"]]}],
      [{rows: [["a", "b"]]}]
    )
  })
})
