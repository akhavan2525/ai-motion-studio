import { createRequire } from 'module'; const require = createRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// ../../node_modules/zod/v3/helpers/util.js
var util, objectUtil, ZodParsedType, getParsedType;
var init_util = __esm({
  "../../node_modules/zod/v3/helpers/util.js"() {
    (function(util2) {
      util2.assertEqual = (_) => {
      };
      function assertIs(_arg) {
      }
      util2.assertIs = assertIs;
      function assertNever(_x) {
        throw new Error();
      }
      util2.assertNever = assertNever;
      util2.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
          obj[item] = item;
        }
        return obj;
      };
      util2.getValidEnumValues = (obj) => {
        const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
          filtered[k] = obj[k];
        }
        return util2.objectValues(filtered);
      };
      util2.objectValues = (obj) => {
        return util2.objectKeys(obj).map(function(e) {
          return obj[e];
        });
      };
      util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
        const keys = [];
        for (const key in object) {
          if (Object.prototype.hasOwnProperty.call(object, key)) {
            keys.push(key);
          }
        }
        return keys;
      };
      util2.find = (arr, checker) => {
        for (const item of arr) {
          if (checker(item))
            return item;
        }
        return void 0;
      };
      util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
      function joinValues(array, separator = " | ") {
        return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
      }
      util2.joinValues = joinValues;
      util2.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
    })(util || (util = {}));
    (function(objectUtil2) {
      objectUtil2.mergeShapes = (first, second) => {
        return {
          ...first,
          ...second
          // second overwrites first
        };
      };
    })(objectUtil || (objectUtil = {}));
    ZodParsedType = util.arrayToEnum([
      "string",
      "nan",
      "number",
      "integer",
      "float",
      "boolean",
      "date",
      "bigint",
      "symbol",
      "function",
      "undefined",
      "null",
      "array",
      "object",
      "unknown",
      "promise",
      "void",
      "never",
      "map",
      "set"
    ]);
    getParsedType = (data) => {
      const t = typeof data;
      switch (t) {
        case "undefined":
          return ZodParsedType.undefined;
        case "string":
          return ZodParsedType.string;
        case "number":
          return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
        case "boolean":
          return ZodParsedType.boolean;
        case "function":
          return ZodParsedType.function;
        case "bigint":
          return ZodParsedType.bigint;
        case "symbol":
          return ZodParsedType.symbol;
        case "object":
          if (Array.isArray(data)) {
            return ZodParsedType.array;
          }
          if (data === null) {
            return ZodParsedType.null;
          }
          if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
            return ZodParsedType.promise;
          }
          if (typeof Map !== "undefined" && data instanceof Map) {
            return ZodParsedType.map;
          }
          if (typeof Set !== "undefined" && data instanceof Set) {
            return ZodParsedType.set;
          }
          if (typeof Date !== "undefined" && data instanceof Date) {
            return ZodParsedType.date;
          }
          return ZodParsedType.object;
        default:
          return ZodParsedType.unknown;
      }
    };
  }
});

// ../../node_modules/zod/v3/ZodError.js
var ZodIssueCode, quotelessJson, ZodError;
var init_ZodError = __esm({
  "../../node_modules/zod/v3/ZodError.js"() {
    init_util();
    ZodIssueCode = util.arrayToEnum([
      "invalid_type",
      "invalid_literal",
      "custom",
      "invalid_union",
      "invalid_union_discriminator",
      "invalid_enum_value",
      "unrecognized_keys",
      "invalid_arguments",
      "invalid_return_type",
      "invalid_date",
      "invalid_string",
      "too_small",
      "too_big",
      "invalid_intersection_types",
      "not_multiple_of",
      "not_finite"
    ]);
    quotelessJson = (obj) => {
      const json = JSON.stringify(obj, null, 2);
      return json.replace(/"([^"]+)":/g, "$1:");
    };
    ZodError = class _ZodError extends Error {
      get errors() {
        return this.issues;
      }
      constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
          this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
          this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
          Object.setPrototypeOf(this, actualProto);
        } else {
          this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
      }
      format(_mapper) {
        const mapper = _mapper || function(issue) {
          return issue.message;
        };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
          for (const issue of error.issues) {
            if (issue.code === "invalid_union") {
              issue.unionErrors.map(processError);
            } else if (issue.code === "invalid_return_type") {
              processError(issue.returnTypeError);
            } else if (issue.code === "invalid_arguments") {
              processError(issue.argumentsError);
            } else if (issue.path.length === 0) {
              fieldErrors._errors.push(mapper(issue));
            } else {
              let curr = fieldErrors;
              let i = 0;
              while (i < issue.path.length) {
                const el = issue.path[i];
                const terminal = i === issue.path.length - 1;
                if (!terminal) {
                  curr[el] = curr[el] || { _errors: [] };
                } else {
                  curr[el] = curr[el] || { _errors: [] };
                  curr[el]._errors.push(mapper(issue));
                }
                curr = curr[el];
                i++;
              }
            }
          }
        };
        processError(this);
        return fieldErrors;
      }
      static assert(value) {
        if (!(value instanceof _ZodError)) {
          throw new Error(`Not a ZodError: ${value}`);
        }
      }
      toString() {
        return this.message;
      }
      get message() {
        return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
      }
      get isEmpty() {
        return this.issues.length === 0;
      }
      flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
          if (sub.path.length > 0) {
            const firstEl = sub.path[0];
            fieldErrors[firstEl] = fieldErrors[firstEl] || [];
            fieldErrors[firstEl].push(mapper(sub));
          } else {
            formErrors.push(mapper(sub));
          }
        }
        return { formErrors, fieldErrors };
      }
      get formErrors() {
        return this.flatten();
      }
    };
    ZodError.create = (issues) => {
      const error = new ZodError(issues);
      return error;
    };
  }
});

// ../../node_modules/zod/v3/locales/en.js
var errorMap, en_default;
var init_en = __esm({
  "../../node_modules/zod/v3/locales/en.js"() {
    init_ZodError();
    init_util();
    errorMap = (issue, _ctx) => {
      let message;
      switch (issue.code) {
        case ZodIssueCode.invalid_type:
          if (issue.received === ZodParsedType.undefined) {
            message = "Required";
          } else {
            message = `Expected ${issue.expected}, received ${issue.received}`;
          }
          break;
        case ZodIssueCode.invalid_literal:
          message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
          break;
        case ZodIssueCode.unrecognized_keys:
          message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
          break;
        case ZodIssueCode.invalid_union:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_union_discriminator:
          message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
          break;
        case ZodIssueCode.invalid_enum_value:
          message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
          break;
        case ZodIssueCode.invalid_arguments:
          message = `Invalid function arguments`;
          break;
        case ZodIssueCode.invalid_return_type:
          message = `Invalid function return type`;
          break;
        case ZodIssueCode.invalid_date:
          message = `Invalid date`;
          break;
        case ZodIssueCode.invalid_string:
          if (typeof issue.validation === "object") {
            if ("includes" in issue.validation) {
              message = `Invalid input: must include "${issue.validation.includes}"`;
              if (typeof issue.validation.position === "number") {
                message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
              }
            } else if ("startsWith" in issue.validation) {
              message = `Invalid input: must start with "${issue.validation.startsWith}"`;
            } else if ("endsWith" in issue.validation) {
              message = `Invalid input: must end with "${issue.validation.endsWith}"`;
            } else {
              util.assertNever(issue.validation);
            }
          } else if (issue.validation !== "regex") {
            message = `Invalid ${issue.validation}`;
          } else {
            message = "Invalid";
          }
          break;
        case ZodIssueCode.too_small:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "bigint")
            message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.too_big:
          if (issue.type === "array")
            message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
          else if (issue.type === "string")
            message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
          else if (issue.type === "number")
            message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "bigint")
            message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
          else if (issue.type === "date")
            message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
          else
            message = "Invalid input";
          break;
        case ZodIssueCode.custom:
          message = `Invalid input`;
          break;
        case ZodIssueCode.invalid_intersection_types:
          message = `Intersection results could not be merged`;
          break;
        case ZodIssueCode.not_multiple_of:
          message = `Number must be a multiple of ${issue.multipleOf}`;
          break;
        case ZodIssueCode.not_finite:
          message = "Number must be finite";
          break;
        default:
          message = _ctx.defaultError;
          util.assertNever(issue);
      }
      return { message };
    };
    en_default = errorMap;
  }
});

// ../../node_modules/zod/v3/errors.js
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
var overrideErrorMap;
var init_errors = __esm({
  "../../node_modules/zod/v3/errors.js"() {
    init_en();
    overrideErrorMap = en_default;
  }
});

// ../../node_modules/zod/v3/helpers/parseUtil.js
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var makeIssue, EMPTY_PATH, ParseStatus, INVALID, DIRTY, OK, isAborted, isDirty, isValid, isAsync;
var init_parseUtil = __esm({
  "../../node_modules/zod/v3/helpers/parseUtil.js"() {
    init_errors();
    init_en();
    makeIssue = (params) => {
      const { data, path: path3, errorMaps, issueData } = params;
      const fullPath = [...path3, ...issueData.path || []];
      const fullIssue = {
        ...issueData,
        path: fullPath
      };
      if (issueData.message !== void 0) {
        return {
          ...issueData,
          path: fullPath,
          message: issueData.message
        };
      }
      let errorMessage = "";
      const maps = errorMaps.filter((m) => !!m).slice().reverse();
      for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
      }
      return {
        ...issueData,
        path: fullPath,
        message: errorMessage
      };
    };
    EMPTY_PATH = [];
    ParseStatus = class _ParseStatus {
      constructor() {
        this.value = "valid";
      }
      dirty() {
        if (this.value === "valid")
          this.value = "dirty";
      }
      abort() {
        if (this.value !== "aborted")
          this.value = "aborted";
      }
      static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
          if (s.status === "aborted")
            return INVALID;
          if (s.status === "dirty")
            status.dirty();
          arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
      }
      static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value
          });
        }
        return _ParseStatus.mergeObjectSync(status, syncPairs);
      }
      static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
          const { key, value } = pair;
          if (key.status === "aborted")
            return INVALID;
          if (value.status === "aborted")
            return INVALID;
          if (key.status === "dirty")
            status.dirty();
          if (value.status === "dirty")
            status.dirty();
          if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
            finalObject[key.value] = value.value;
          }
        }
        return { status: status.value, value: finalObject };
      }
    };
    INVALID = Object.freeze({
      status: "aborted"
    });
    DIRTY = (value) => ({ status: "dirty", value });
    OK = (value) => ({ status: "valid", value });
    isAborted = (x) => x.status === "aborted";
    isDirty = (x) => x.status === "dirty";
    isValid = (x) => x.status === "valid";
    isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
  }
});

// ../../node_modules/zod/v3/helpers/typeAliases.js
var init_typeAliases = __esm({
  "../../node_modules/zod/v3/helpers/typeAliases.js"() {
  }
});

// ../../node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
var init_errorUtil = __esm({
  "../../node_modules/zod/v3/helpers/errorUtil.js"() {
    (function(errorUtil2) {
      errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
      errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
    })(errorUtil || (errorUtil = {}));
  }
});

// ../../node_modules/zod/v3/types.js
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var ParseInputLazyPath, handleResult, ZodType, cuidRegex, cuid2Regex, ulidRegex, uuidRegex, nanoidRegex, jwtRegex, durationRegex, emailRegex, _emojiRegex, emojiRegex, ipv4Regex, ipv4CidrRegex, ipv6Regex, ipv6CidrRegex, base64Regex, base64urlRegex, dateRegexSource, dateRegex, ZodString, ZodNumber, ZodBigInt, ZodBoolean, ZodDate, ZodSymbol, ZodUndefined, ZodNull, ZodAny, ZodUnknown, ZodNever, ZodVoid, ZodArray, ZodObject, ZodUnion, getDiscriminator, ZodDiscriminatedUnion, ZodIntersection, ZodTuple, ZodRecord, ZodMap, ZodSet, ZodFunction, ZodLazy, ZodLiteral, ZodEnum, ZodNativeEnum, ZodPromise, ZodEffects, ZodOptional, ZodNullable, ZodDefault, ZodCatch, ZodNaN, BRAND, ZodBranded, ZodPipeline, ZodReadonly, late, ZodFirstPartyTypeKind, instanceOfType, stringType, numberType, nanType, bigIntType, booleanType, dateType, symbolType, undefinedType, nullType, anyType, unknownType, neverType, voidType, arrayType, objectType, strictObjectType, unionType, discriminatedUnionType, intersectionType, tupleType, recordType, mapType, setType, functionType, lazyType, literalType, enumType, nativeEnumType, promiseType, effectsType, optionalType, nullableType, preprocessType, pipelineType, ostring, onumber, oboolean, coerce, NEVER;
var init_types = __esm({
  "../../node_modules/zod/v3/types.js"() {
    init_ZodError();
    init_errors();
    init_errorUtil();
    init_parseUtil();
    init_util();
    ParseInputLazyPath = class {
      constructor(parent, value, path3, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path3;
        this._key = key;
      }
      get path() {
        if (!this._cachedPath.length) {
          if (Array.isArray(this._key)) {
            this._cachedPath.push(...this._path, ...this._key);
          } else {
            this._cachedPath.push(...this._path, this._key);
          }
        }
        return this._cachedPath;
      }
    };
    handleResult = (ctx, result) => {
      if (isValid(result)) {
        return { success: true, data: result.value };
      } else {
        if (!ctx.common.issues.length) {
          throw new Error("Validation failed but no issues detected.");
        }
        return {
          success: false,
          get error() {
            if (this._error)
              return this._error;
            const error = new ZodError(ctx.common.issues);
            this._error = error;
            return this._error;
          }
        };
      }
    };
    ZodType = class {
      get description() {
        return this._def.description;
      }
      _getType(input) {
        return getParsedType(input.data);
      }
      _getOrReturnCtx(input, ctx) {
        return ctx || {
          common: input.parent.common,
          data: input.data,
          parsedType: getParsedType(input.data),
          schemaErrorMap: this._def.errorMap,
          path: input.path,
          parent: input.parent
        };
      }
      _processInputParams(input) {
        return {
          status: new ParseStatus(),
          ctx: {
            common: input.parent.common,
            data: input.data,
            parsedType: getParsedType(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent
          }
        };
      }
      _parseSync(input) {
        const result = this._parse(input);
        if (isAsync(result)) {
          throw new Error("Synchronous parse encountered promise.");
        }
        return result;
      }
      _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
      }
      parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      safeParse(data, params) {
        const ctx = {
          common: {
            issues: [],
            async: params?.async ?? false,
            contextualErrorMap: params?.errorMap
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
      }
      "~validate"(data) {
        const ctx = {
          common: {
            issues: [],
            async: !!this["~standard"].async
          },
          path: [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        if (!this["~standard"].async) {
          try {
            const result = this._parseSync({ data, path: [], parent: ctx });
            return isValid(result) ? {
              value: result.value
            } : {
              issues: ctx.common.issues
            };
          } catch (err) {
            if (err?.message?.toLowerCase()?.includes("encountered")) {
              this["~standard"].async = true;
            }
            ctx.common = {
              issues: [],
              async: true
            };
          }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        });
      }
      async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
          return result.data;
        throw result.error;
      }
      async safeParseAsync(data, params) {
        const ctx = {
          common: {
            issues: [],
            contextualErrorMap: params?.errorMap,
            async: true
          },
          path: params?.path || [],
          schemaErrorMap: this._def.errorMap,
          parent: null,
          data,
          parsedType: getParsedType(data)
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
      }
      refine(check, message) {
        const getIssueProperties = (val) => {
          if (typeof message === "string" || typeof message === "undefined") {
            return { message };
          } else if (typeof message === "function") {
            return message(val);
          } else {
            return message;
          }
        };
        return this._refinement((val, ctx) => {
          const result = check(val);
          const setError = () => ctx.addIssue({
            code: ZodIssueCode.custom,
            ...getIssueProperties(val)
          });
          if (typeof Promise !== "undefined" && result instanceof Promise) {
            return result.then((data) => {
              if (!data) {
                setError();
                return false;
              } else {
                return true;
              }
            });
          }
          if (!result) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
          if (!check(val)) {
            ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
            return false;
          } else {
            return true;
          }
        });
      }
      _refinement(refinement) {
        return new ZodEffects({
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "refinement", refinement }
        });
      }
      superRefine(refinement) {
        return this._refinement(refinement);
      }
      constructor(def) {
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
          version: 1,
          vendor: "zod",
          validate: (data) => this["~validate"](data)
        };
      }
      optional() {
        return ZodOptional.create(this, this._def);
      }
      nullable() {
        return ZodNullable.create(this, this._def);
      }
      nullish() {
        return this.nullable().optional();
      }
      array() {
        return ZodArray.create(this);
      }
      promise() {
        return ZodPromise.create(this, this._def);
      }
      or(option) {
        return ZodUnion.create([this, option], this._def);
      }
      and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
      }
      transform(transform) {
        return new ZodEffects({
          ...processCreateParams(this._def),
          schema: this,
          typeName: ZodFirstPartyTypeKind.ZodEffects,
          effect: { type: "transform", transform }
        });
      }
      default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
          ...processCreateParams(this._def),
          innerType: this,
          defaultValue: defaultValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodDefault
        });
      }
      brand() {
        return new ZodBranded({
          typeName: ZodFirstPartyTypeKind.ZodBranded,
          type: this,
          ...processCreateParams(this._def)
        });
      }
      catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
          ...processCreateParams(this._def),
          innerType: this,
          catchValue: catchValueFunc,
          typeName: ZodFirstPartyTypeKind.ZodCatch
        });
      }
      describe(description) {
        const This = this.constructor;
        return new This({
          ...this._def,
          description
        });
      }
      pipe(target) {
        return ZodPipeline.create(this, target);
      }
      readonly() {
        return ZodReadonly.create(this);
      }
      isOptional() {
        return this.safeParse(void 0).success;
      }
      isNullable() {
        return this.safeParse(null).success;
      }
    };
    cuidRegex = /^c[^\s-]{8,}$/i;
    cuid2Regex = /^[0-9a-z]+$/;
    ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
    uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
    nanoidRegex = /^[a-z0-9_-]{21}$/i;
    jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
    durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
    emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
    _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
    ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
    ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
    ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
    base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
    base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
    dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
    dateRegex = new RegExp(`^${dateRegexSource}$`);
    ZodString = class _ZodString extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.string) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.string,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.length < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.length > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "string",
                inclusive: true,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "length") {
            const tooBig = input.data.length > check.value;
            const tooSmall = input.data.length < check.value;
            if (tooBig || tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              if (tooBig) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_big,
                  maximum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              } else if (tooSmall) {
                addIssueToContext(ctx, {
                  code: ZodIssueCode.too_small,
                  minimum: check.value,
                  type: "string",
                  inclusive: true,
                  exact: true,
                  message: check.message
                });
              }
              status.dirty();
            }
          } else if (check.kind === "email") {
            if (!emailRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "email",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "emoji") {
            if (!emojiRegex) {
              emojiRegex = new RegExp(_emojiRegex, "u");
            }
            if (!emojiRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "emoji",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "uuid") {
            if (!uuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "uuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "nanoid") {
            if (!nanoidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "nanoid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid") {
            if (!cuidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cuid2") {
            if (!cuid2Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cuid2",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ulid") {
            if (!ulidRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ulid",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "url") {
            try {
              new URL(input.data);
            } catch {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "regex") {
            check.regex.lastIndex = 0;
            const testResult = check.regex.test(input.data);
            if (!testResult) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "regex",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "trim") {
            input.data = input.data.trim();
          } else if (check.kind === "includes") {
            if (!input.data.includes(check.value, check.position)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { includes: check.value, position: check.position },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "toLowerCase") {
            input.data = input.data.toLowerCase();
          } else if (check.kind === "toUpperCase") {
            input.data = input.data.toUpperCase();
          } else if (check.kind === "startsWith") {
            if (!input.data.startsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { startsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "endsWith") {
            if (!input.data.endsWith(check.value)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: { endsWith: check.value },
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "datetime") {
            const regex = datetimeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "datetime",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "date") {
            const regex = dateRegex;
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "date",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "time") {
            const regex = timeRegex(check);
            if (!regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_string,
                validation: "time",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "duration") {
            if (!durationRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "duration",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "ip") {
            if (!isValidIP(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "ip",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "jwt") {
            if (!isValidJWT(input.data, check.alg)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "jwt",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "cidr") {
            if (!isValidCidr(input.data, check.version)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "cidr",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64") {
            if (!base64Regex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "base64url") {
            if (!base64urlRegex.test(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                validation: "base64url",
                code: ZodIssueCode.invalid_string,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
          validation,
          code: ZodIssueCode.invalid_string,
          ...errorUtil.errToObj(message)
        });
      }
      _addCheck(check) {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      email(message) {
        return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
      }
      url(message) {
        return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
      }
      emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
      }
      uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
      }
      nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
      }
      cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
      }
      cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
      }
      ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
      }
      base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
      }
      base64url(message) {
        return this._addCheck({
          kind: "base64url",
          ...errorUtil.errToObj(message)
        });
      }
      jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options) });
      }
      ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
      }
      cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options) });
      }
      datetime(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "datetime",
            precision: null,
            offset: false,
            local: false,
            message: options
          });
        }
        return this._addCheck({
          kind: "datetime",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          offset: options?.offset ?? false,
          local: options?.local ?? false,
          ...errorUtil.errToObj(options?.message)
        });
      }
      date(message) {
        return this._addCheck({ kind: "date", message });
      }
      time(options) {
        if (typeof options === "string") {
          return this._addCheck({
            kind: "time",
            precision: null,
            message: options
          });
        }
        return this._addCheck({
          kind: "time",
          precision: typeof options?.precision === "undefined" ? null : options?.precision,
          ...errorUtil.errToObj(options?.message)
        });
      }
      duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
      }
      regex(regex, message) {
        return this._addCheck({
          kind: "regex",
          regex,
          ...errorUtil.errToObj(message)
        });
      }
      includes(value, options) {
        return this._addCheck({
          kind: "includes",
          value,
          position: options?.position,
          ...errorUtil.errToObj(options?.message)
        });
      }
      startsWith(value, message) {
        return this._addCheck({
          kind: "startsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      endsWith(value, message) {
        return this._addCheck({
          kind: "endsWith",
          value,
          ...errorUtil.errToObj(message)
        });
      }
      min(minLength, message) {
        return this._addCheck({
          kind: "min",
          value: minLength,
          ...errorUtil.errToObj(message)
        });
      }
      max(maxLength, message) {
        return this._addCheck({
          kind: "max",
          value: maxLength,
          ...errorUtil.errToObj(message)
        });
      }
      length(len, message) {
        return this._addCheck({
          kind: "length",
          value: len,
          ...errorUtil.errToObj(message)
        });
      }
      /**
       * Equivalent to `.min(1)`
       */
      nonempty(message) {
        return this.min(1, errorUtil.errToObj(message));
      }
      trim() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "trim" }]
        });
      }
      toLowerCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toLowerCase" }]
        });
      }
      toUpperCase() {
        return new _ZodString({
          ...this._def,
          checks: [...this._def.checks, { kind: "toUpperCase" }]
        });
      }
      get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
      }
      get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
      }
      get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
      }
      get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
      }
      get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
      }
      get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
      }
      get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
      }
      get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
      }
      get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
      }
      get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
      }
      get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
      }
      get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
      }
      get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
      }
      get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
      }
      get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
      }
      get isBase64url() {
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
      }
      get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodString.create = (params) => {
      return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    ZodNumber = class _ZodNumber extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
      }
      _parse(input) {
        if (this._def.coerce) {
          input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.number) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.number,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "int") {
            if (!util.isInteger(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.invalid_type,
                expected: "integer",
                received: "float",
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                minimum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                maximum: check.value,
                type: "number",
                inclusive: check.inclusive,
                exact: false,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (floatSafeRemainder(input.data, check.value) !== 0) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "finite") {
            if (!Number.isFinite(input.data)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_finite,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodNumber({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodNumber({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      int(message) {
        return this._addCheck({
          kind: "int",
          message: errorUtil.toString(message)
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: 0,
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      finite(message) {
        return this._addCheck({
          kind: "finite",
          message: errorUtil.toString(message)
        });
      }
      safe(message) {
        return this._addCheck({
          kind: "min",
          inclusive: true,
          value: Number.MIN_SAFE_INTEGER,
          message: errorUtil.toString(message)
        })._addCheck({
          kind: "max",
          inclusive: true,
          value: Number.MAX_SAFE_INTEGER,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
      get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
      }
      get isFinite() {
        let max = null;
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
            return true;
          } else if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          } else if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return Number.isFinite(min) && Number.isFinite(max);
      }
    };
    ZodNumber.create = (params) => {
      return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    ZodBigInt = class _ZodBigInt extends ZodType {
      constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
      }
      _parse(input) {
        if (this._def.coerce) {
          try {
            input.data = BigInt(input.data);
          } catch {
            return this._getInvalidInput(input);
          }
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.bigint) {
          return this._getInvalidInput(input);
        }
        let ctx = void 0;
        const status = new ParseStatus();
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
            if (tooSmall) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                type: "bigint",
                minimum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
            if (tooBig) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                type: "bigint",
                maximum: check.value,
                inclusive: check.inclusive,
                message: check.message
              });
              status.dirty();
            }
          } else if (check.kind === "multipleOf") {
            if (input.data % check.value !== BigInt(0)) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.not_multiple_of,
                multipleOf: check.value,
                message: check.message
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return { status: status.value, value: input.data };
      }
      _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.bigint,
          received: ctx.parsedType
        });
        return INVALID;
      }
      gte(value, message) {
        return this.setLimit("min", value, true, errorUtil.toString(message));
      }
      gt(value, message) {
        return this.setLimit("min", value, false, errorUtil.toString(message));
      }
      lte(value, message) {
        return this.setLimit("max", value, true, errorUtil.toString(message));
      }
      lt(value, message) {
        return this.setLimit("max", value, false, errorUtil.toString(message));
      }
      setLimit(kind, value, inclusive, message) {
        return new _ZodBigInt({
          ...this._def,
          checks: [
            ...this._def.checks,
            {
              kind,
              value,
              inclusive,
              message: errorUtil.toString(message)
            }
          ]
        });
      }
      _addCheck(check) {
        return new _ZodBigInt({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      positive(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      negative(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: false,
          message: errorUtil.toString(message)
        });
      }
      nonpositive(message) {
        return this._addCheck({
          kind: "max",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      nonnegative(message) {
        return this._addCheck({
          kind: "min",
          value: BigInt(0),
          inclusive: true,
          message: errorUtil.toString(message)
        });
      }
      multipleOf(value, message) {
        return this._addCheck({
          kind: "multipleOf",
          value,
          message: errorUtil.toString(message)
        });
      }
      get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min;
      }
      get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max;
      }
    };
    ZodBigInt.create = (params) => {
      return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params)
      });
    };
    ZodBoolean = class extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.boolean) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.boolean,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodBoolean.create = (params) => {
      return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: params?.coerce || false,
        ...processCreateParams(params)
      });
    };
    ZodDate = class _ZodDate extends ZodType {
      _parse(input) {
        if (this._def.coerce) {
          input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.date) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.date,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        if (Number.isNaN(input.data.getTime())) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_date
          });
          return INVALID;
        }
        const status = new ParseStatus();
        let ctx = void 0;
        for (const check of this._def.checks) {
          if (check.kind === "min") {
            if (input.data.getTime() < check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_small,
                message: check.message,
                inclusive: true,
                exact: false,
                minimum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else if (check.kind === "max") {
            if (input.data.getTime() > check.value) {
              ctx = this._getOrReturnCtx(input, ctx);
              addIssueToContext(ctx, {
                code: ZodIssueCode.too_big,
                message: check.message,
                inclusive: true,
                exact: false,
                maximum: check.value,
                type: "date"
              });
              status.dirty();
            }
          } else {
            util.assertNever(check);
          }
        }
        return {
          status: status.value,
          value: new Date(input.data.getTime())
        };
      }
      _addCheck(check) {
        return new _ZodDate({
          ...this._def,
          checks: [...this._def.checks, check]
        });
      }
      min(minDate, message) {
        return this._addCheck({
          kind: "min",
          value: minDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      max(maxDate, message) {
        return this._addCheck({
          kind: "max",
          value: maxDate.getTime(),
          message: errorUtil.toString(message)
        });
      }
      get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "min") {
            if (min === null || ch.value > min)
              min = ch.value;
          }
        }
        return min != null ? new Date(min) : null;
      }
      get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
          if (ch.kind === "max") {
            if (max === null || ch.value < max)
              max = ch.value;
          }
        }
        return max != null ? new Date(max) : null;
      }
    };
    ZodDate.create = (params) => {
      return new ZodDate({
        checks: [],
        coerce: params?.coerce || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params)
      });
    };
    ZodSymbol = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.symbol) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.symbol,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodSymbol.create = (params) => {
      return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params)
      });
    };
    ZodUndefined = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.undefined,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodUndefined.create = (params) => {
      return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params)
      });
    };
    ZodNull = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.null) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.null,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodNull.create = (params) => {
      return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params)
      });
    };
    ZodAny = class extends ZodType {
      constructor() {
        super(...arguments);
        this._any = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodAny.create = (params) => {
      return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params)
      });
    };
    ZodUnknown = class extends ZodType {
      constructor() {
        super(...arguments);
        this._unknown = true;
      }
      _parse(input) {
        return OK(input.data);
      }
    };
    ZodUnknown.create = (params) => {
      return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params)
      });
    };
    ZodNever = class extends ZodType {
      _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_type,
          expected: ZodParsedType.never,
          received: ctx.parsedType
        });
        return INVALID;
      }
    };
    ZodNever.create = (params) => {
      return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params)
      });
    };
    ZodVoid = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.undefined) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.void,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return OK(input.data);
      }
    };
    ZodVoid.create = (params) => {
      return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params)
      });
    };
    ZodArray = class _ZodArray extends ZodType {
      _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (def.exactLength !== null) {
          const tooBig = ctx.data.length > def.exactLength.value;
          const tooSmall = ctx.data.length < def.exactLength.value;
          if (tooBig || tooSmall) {
            addIssueToContext(ctx, {
              code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
              minimum: tooSmall ? def.exactLength.value : void 0,
              maximum: tooBig ? def.exactLength.value : void 0,
              type: "array",
              inclusive: true,
              exact: true,
              message: def.exactLength.message
            });
            status.dirty();
          }
        }
        if (def.minLength !== null) {
          if (ctx.data.length < def.minLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.minLength.message
            });
            status.dirty();
          }
        }
        if (def.maxLength !== null) {
          if (ctx.data.length > def.maxLength.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxLength.value,
              type: "array",
              inclusive: true,
              exact: false,
              message: def.maxLength.message
            });
            status.dirty();
          }
        }
        if (ctx.common.async) {
          return Promise.all([...ctx.data].map((item, i) => {
            return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
          })).then((result2) => {
            return ParseStatus.mergeArray(status, result2);
          });
        }
        const result = [...ctx.data].map((item, i) => {
          return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return ParseStatus.mergeArray(status, result);
      }
      get element() {
        return this._def.type;
      }
      min(minLength, message) {
        return new _ZodArray({
          ...this._def,
          minLength: { value: minLength, message: errorUtil.toString(message) }
        });
      }
      max(maxLength, message) {
        return new _ZodArray({
          ...this._def,
          maxLength: { value: maxLength, message: errorUtil.toString(message) }
        });
      }
      length(len, message) {
        return new _ZodArray({
          ...this._def,
          exactLength: { value: len, message: errorUtil.toString(message) }
        });
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodArray.create = (schema, params) => {
      return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params)
      });
    };
    ZodObject = class _ZodObject extends ZodType {
      constructor() {
        super(...arguments);
        this._cached = null;
        this.nonstrict = this.passthrough;
        this.augment = this.extend;
      }
      _getCached() {
        if (this._cached !== null)
          return this._cached;
        const shape = this._def.shape();
        const keys = util.objectKeys(shape);
        this._cached = { shape, keys };
        return this._cached;
      }
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.object) {
          const ctx2 = this._getOrReturnCtx(input);
          addIssueToContext(ctx2, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx2.parsedType
          });
          return INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
          for (const key in ctx.data) {
            if (!shapeKeys.includes(key)) {
              extraKeys.push(key);
            }
          }
        }
        const pairs = [];
        for (const key of shapeKeys) {
          const keyValidator = shape[key];
          const value = ctx.data[key];
          pairs.push({
            key: { status: "valid", value: key },
            value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (this._def.catchall instanceof ZodNever) {
          const unknownKeys = this._def.unknownKeys;
          if (unknownKeys === "passthrough") {
            for (const key of extraKeys) {
              pairs.push({
                key: { status: "valid", value: key },
                value: { status: "valid", value: ctx.data[key] }
              });
            }
          } else if (unknownKeys === "strict") {
            if (extraKeys.length > 0) {
              addIssueToContext(ctx, {
                code: ZodIssueCode.unrecognized_keys,
                keys: extraKeys
              });
              status.dirty();
            }
          } else if (unknownKeys === "strip") {
          } else {
            throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
          }
        } else {
          const catchall = this._def.catchall;
          for (const key of extraKeys) {
            const value = ctx.data[key];
            pairs.push({
              key: { status: "valid", value: key },
              value: catchall._parse(
                new ParseInputLazyPath(ctx, value, ctx.path, key)
                //, ctx.child(key), value, getParsedType(value)
              ),
              alwaysSet: key in ctx.data
            });
          }
        }
        if (ctx.common.async) {
          return Promise.resolve().then(async () => {
            const syncPairs = [];
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              syncPairs.push({
                key,
                value,
                alwaysSet: pair.alwaysSet
              });
            }
            return syncPairs;
          }).then((syncPairs) => {
            return ParseStatus.mergeObjectSync(status, syncPairs);
          });
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get shape() {
        return this._def.shape();
      }
      strict(message) {
        errorUtil.errToObj;
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strict",
          ...message !== void 0 ? {
            errorMap: (issue, ctx) => {
              const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
              if (issue.code === "unrecognized_keys")
                return {
                  message: errorUtil.errToObj(message).message ?? defaultError
                };
              return {
                message: defaultError
              };
            }
          } : {}
        });
      }
      strip() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "strip"
        });
      }
      passthrough() {
        return new _ZodObject({
          ...this._def,
          unknownKeys: "passthrough"
        });
      }
      // const AugmentFactory =
      //   <Def extends ZodObjectDef>(def: Def) =>
      //   <Augmentation extends ZodRawShape>(
      //     augmentation: Augmentation
      //   ): ZodObject<
      //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
      //     Def["unknownKeys"],
      //     Def["catchall"]
      //   > => {
      //     return new ZodObject({
      //       ...def,
      //       shape: () => ({
      //         ...def.shape(),
      //         ...augmentation,
      //       }),
      //     }) as any;
      //   };
      extend(augmentation) {
        return new _ZodObject({
          ...this._def,
          shape: () => ({
            ...this._def.shape(),
            ...augmentation
          })
        });
      }
      /**
       * Prior to zod@1.0.12 there was a bug in the
       * inferred type of merged objects. Please
       * upgrade if you are experiencing issues.
       */
      merge(merging) {
        const merged = new _ZodObject({
          unknownKeys: merging._def.unknownKeys,
          catchall: merging._def.catchall,
          shape: () => ({
            ...this._def.shape(),
            ...merging._def.shape()
          }),
          typeName: ZodFirstPartyTypeKind.ZodObject
        });
        return merged;
      }
      // merge<
      //   Incoming extends AnyZodObject,
      //   Augmentation extends Incoming["shape"],
      //   NewOutput extends {
      //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
      //       ? Augmentation[k]["_output"]
      //       : k extends keyof Output
      //       ? Output[k]
      //       : never;
      //   },
      //   NewInput extends {
      //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
      //       ? Augmentation[k]["_input"]
      //       : k extends keyof Input
      //       ? Input[k]
      //       : never;
      //   }
      // >(
      //   merging: Incoming
      // ): ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"],
      //   NewOutput,
      //   NewInput
      // > {
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      setKey(key, schema) {
        return this.augment({ [key]: schema });
      }
      // merge<Incoming extends AnyZodObject>(
      //   merging: Incoming
      // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
      // ZodObject<
      //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
      //   Incoming["_def"]["unknownKeys"],
      //   Incoming["_def"]["catchall"]
      // > {
      //   // const mergedShape = objectUtil.mergeShapes(
      //   //   this._def.shape(),
      //   //   merging._def.shape()
      //   // );
      //   const merged: any = new ZodObject({
      //     unknownKeys: merging._def.unknownKeys,
      //     catchall: merging._def.catchall,
      //     shape: () =>
      //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
      //     typeName: ZodFirstPartyTypeKind.ZodObject,
      //   }) as any;
      //   return merged;
      // }
      catchall(index) {
        return new _ZodObject({
          ...this._def,
          catchall: index
        });
      }
      pick(mask) {
        const shape = {};
        for (const key of util.objectKeys(mask)) {
          if (mask[key] && this.shape[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      omit(mask) {
        const shape = {};
        for (const key of util.objectKeys(this.shape)) {
          if (!mask[key]) {
            shape[key] = this.shape[key];
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => shape
        });
      }
      /**
       * @deprecated
       */
      deepPartial() {
        return deepPartialify(this);
      }
      partial(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
          const fieldSchema = this.shape[key];
          if (mask && !mask[key]) {
            newShape[key] = fieldSchema;
          } else {
            newShape[key] = fieldSchema.optional();
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      required(mask) {
        const newShape = {};
        for (const key of util.objectKeys(this.shape)) {
          if (mask && !mask[key]) {
            newShape[key] = this.shape[key];
          } else {
            const fieldSchema = this.shape[key];
            let newField = fieldSchema;
            while (newField instanceof ZodOptional) {
              newField = newField._def.innerType;
            }
            newShape[key] = newField;
          }
        }
        return new _ZodObject({
          ...this._def,
          shape: () => newShape
        });
      }
      keyof() {
        return createZodEnum(util.objectKeys(this.shape));
      }
    };
    ZodObject.create = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.strictCreate = (shape, params) => {
      return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodObject.lazycreate = (shape, params) => {
      return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params)
      });
    };
    ZodUnion = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
          for (const result of results) {
            if (result.result.status === "valid") {
              return result.result;
            }
          }
          for (const result of results) {
            if (result.result.status === "dirty") {
              ctx.common.issues.push(...result.ctx.common.issues);
              return result.result;
            }
          }
          const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
        if (ctx.common.async) {
          return Promise.all(options.map(async (option) => {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            return {
              result: await option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: childCtx
              }),
              ctx: childCtx
            };
          })).then(handleResults);
        } else {
          let dirty = void 0;
          const issues = [];
          for (const option of options) {
            const childCtx = {
              ...ctx,
              common: {
                ...ctx.common,
                issues: []
              },
              parent: null
            };
            const result = option._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: childCtx
            });
            if (result.status === "valid") {
              return result;
            } else if (result.status === "dirty" && !dirty) {
              dirty = { result, ctx: childCtx };
            }
            if (childCtx.common.issues.length) {
              issues.push(childCtx.common.issues);
            }
          }
          if (dirty) {
            ctx.common.issues.push(...dirty.ctx.common.issues);
            return dirty.result;
          }
          const unionErrors = issues.map((issues2) => new ZodError(issues2));
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union,
            unionErrors
          });
          return INVALID;
        }
      }
      get options() {
        return this._def.options;
      }
    };
    ZodUnion.create = (types, params) => {
      return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params)
      });
    };
    getDiscriminator = (type) => {
      if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
      } else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
      } else if (type instanceof ZodLiteral) {
        return [type.value];
      } else if (type instanceof ZodEnum) {
        return type.options;
      } else if (type instanceof ZodNativeEnum) {
        return util.objectValues(type.enum);
      } else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
      } else if (type instanceof ZodUndefined) {
        return [void 0];
      } else if (type instanceof ZodNull) {
        return [null];
      } else if (type instanceof ZodOptional) {
        return [void 0, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
      } else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
      } else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
      } else {
        return [];
      }
    };
    ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_union_discriminator,
            options: Array.from(this.optionsMap.keys()),
            path: [discriminator]
          });
          return INVALID;
        }
        if (ctx.common.async) {
          return option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        } else {
          return option._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
        }
      }
      get discriminator() {
        return this._def.discriminator;
      }
      get options() {
        return this._def.options;
      }
      get optionsMap() {
        return this._def.optionsMap;
      }
      /**
       * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
       * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
       * have a different value for each object in the union.
       * @param discriminator the name of the discriminator property
       * @param types an array of object schemas
       * @param params
       */
      static create(discriminator, options, params) {
        const optionsMap = /* @__PURE__ */ new Map();
        for (const type of options) {
          const discriminatorValues = getDiscriminator(type.shape[discriminator]);
          if (!discriminatorValues.length) {
            throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
          }
          for (const value of discriminatorValues) {
            if (optionsMap.has(value)) {
              throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
            }
            optionsMap.set(value, type);
          }
        }
        return new _ZodDiscriminatedUnion({
          typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
          discriminator,
          options,
          optionsMap,
          ...processCreateParams(params)
        });
      }
    };
    ZodIntersection = class extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
          if (isAborted(parsedLeft) || isAborted(parsedRight)) {
            return INVALID;
          }
          const merged = mergeValues(parsedLeft.value, parsedRight.value);
          if (!merged.valid) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.invalid_intersection_types
            });
            return INVALID;
          }
          if (isDirty(parsedLeft) || isDirty(parsedRight)) {
            status.dirty();
          }
          return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
          return Promise.all([
            this._def.left._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            }),
            this._def.right._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            })
          ]).then(([left, right]) => handleParsed(left, right));
        } else {
          return handleParsed(this._def.left._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }), this._def.right._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          }));
        }
      }
    };
    ZodIntersection.create = (left, right, params) => {
      return new ZodIntersection({
        left,
        right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params)
      });
    };
    ZodTuple = class _ZodTuple extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.array) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.array,
            received: ctx.parsedType
          });
          return INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          return INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: this._def.items.length,
            inclusive: true,
            exact: false,
            type: "array"
          });
          status.dirty();
        }
        const items = [...ctx.data].map((item, itemIndex) => {
          const schema = this._def.items[itemIndex] || this._def.rest;
          if (!schema)
            return null;
          return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        }).filter((x) => !!x);
        if (ctx.common.async) {
          return Promise.all(items).then((results) => {
            return ParseStatus.mergeArray(status, results);
          });
        } else {
          return ParseStatus.mergeArray(status, items);
        }
      }
      get items() {
        return this._def.items;
      }
      rest(rest) {
        return new _ZodTuple({
          ...this._def,
          rest
        });
      }
    };
    ZodTuple.create = (schemas, params) => {
      if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
      }
      return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params)
      });
    };
    ZodRecord = class _ZodRecord extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.object) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.object,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
          pairs.push({
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
            value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
            alwaysSet: key in ctx.data
          });
        }
        if (ctx.common.async) {
          return ParseStatus.mergeObjectAsync(status, pairs);
        } else {
          return ParseStatus.mergeObjectSync(status, pairs);
        }
      }
      get element() {
        return this._def.valueType;
      }
      static create(first, second, third) {
        if (second instanceof ZodType) {
          return new _ZodRecord({
            keyType: first,
            valueType: second,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(third)
          });
        }
        return new _ZodRecord({
          keyType: ZodString.create(),
          valueType: first,
          typeName: ZodFirstPartyTypeKind.ZodRecord,
          ...processCreateParams(second)
        });
      }
    };
    ZodMap = class extends ZodType {
      get keySchema() {
        return this._def.keyType;
      }
      get valueSchema() {
        return this._def.valueType;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.map) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.map,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
          return {
            key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
            value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
          };
        });
        if (ctx.common.async) {
          const finalMap = /* @__PURE__ */ new Map();
          return Promise.resolve().then(async () => {
            for (const pair of pairs) {
              const key = await pair.key;
              const value = await pair.value;
              if (key.status === "aborted" || value.status === "aborted") {
                return INVALID;
              }
              if (key.status === "dirty" || value.status === "dirty") {
                status.dirty();
              }
              finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
          });
        } else {
          const finalMap = /* @__PURE__ */ new Map();
          for (const pair of pairs) {
            const key = pair.key;
            const value = pair.value;
            if (key.status === "aborted" || value.status === "aborted") {
              return INVALID;
            }
            if (key.status === "dirty" || value.status === "dirty") {
              status.dirty();
            }
            finalMap.set(key.value, value.value);
          }
          return { status: status.value, value: finalMap };
        }
      }
    };
    ZodMap.create = (keyType, valueType, params) => {
      return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params)
      });
    };
    ZodSet = class _ZodSet extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.set) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.set,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
          if (ctx.data.size < def.minSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: def.minSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.minSize.message
            });
            status.dirty();
          }
        }
        if (def.maxSize !== null) {
          if (ctx.data.size > def.maxSize.value) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: def.maxSize.value,
              type: "set",
              inclusive: true,
              exact: false,
              message: def.maxSize.message
            });
            status.dirty();
          }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements2) {
          const parsedSet = /* @__PURE__ */ new Set();
          for (const element of elements2) {
            if (element.status === "aborted")
              return INVALID;
            if (element.status === "dirty")
              status.dirty();
            parsedSet.add(element.value);
          }
          return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
          return Promise.all(elements).then((elements2) => finalizeSet(elements2));
        } else {
          return finalizeSet(elements);
        }
      }
      min(minSize, message) {
        return new _ZodSet({
          ...this._def,
          minSize: { value: minSize, message: errorUtil.toString(message) }
        });
      }
      max(maxSize, message) {
        return new _ZodSet({
          ...this._def,
          maxSize: { value: maxSize, message: errorUtil.toString(message) }
        });
      }
      size(size, message) {
        return this.min(size, message).max(size, message);
      }
      nonempty(message) {
        return this.min(1, message);
      }
    };
    ZodSet.create = (valueType, params) => {
      return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params)
      });
    };
    ZodFunction = class _ZodFunction extends ZodType {
      constructor() {
        super(...arguments);
        this.validate = this.implement;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.function) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.function,
            received: ctx.parsedType
          });
          return INVALID;
        }
        function makeArgsIssue(args, error) {
          return makeIssue({
            data: args,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
            issueData: {
              code: ZodIssueCode.invalid_arguments,
              argumentsError: error
            }
          });
        }
        function makeReturnsIssue(returns, error) {
          return makeIssue({
            data: returns,
            path: ctx.path,
            errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
            issueData: {
              code: ZodIssueCode.invalid_return_type,
              returnTypeError: error
            }
          });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
          const me = this;
          return OK(async function(...args) {
            const error = new ZodError([]);
            const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
              error.addIssue(makeArgsIssue(args, e));
              throw error;
            });
            const result = await Reflect.apply(fn, this, parsedArgs);
            const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
              error.addIssue(makeReturnsIssue(result, e));
              throw error;
            });
            return parsedReturns;
          });
        } else {
          const me = this;
          return OK(function(...args) {
            const parsedArgs = me._def.args.safeParse(args, params);
            if (!parsedArgs.success) {
              throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
            }
            const result = Reflect.apply(fn, this, parsedArgs.data);
            const parsedReturns = me._def.returns.safeParse(result, params);
            if (!parsedReturns.success) {
              throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
            }
            return parsedReturns.data;
          });
        }
      }
      parameters() {
        return this._def.args;
      }
      returnType() {
        return this._def.returns;
      }
      args(...items) {
        return new _ZodFunction({
          ...this._def,
          args: ZodTuple.create(items).rest(ZodUnknown.create())
        });
      }
      returns(returnType) {
        return new _ZodFunction({
          ...this._def,
          returns: returnType
        });
      }
      implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
      }
      static create(args, returns, params) {
        return new _ZodFunction({
          args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
          returns: returns || ZodUnknown.create(),
          typeName: ZodFirstPartyTypeKind.ZodFunction,
          ...processCreateParams(params)
        });
      }
    };
    ZodLazy = class extends ZodType {
      get schema() {
        return this._def.getter();
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
      }
    };
    ZodLazy.create = (getter, params) => {
      return new ZodLazy({
        getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params)
      });
    };
    ZodLiteral = class extends ZodType {
      _parse(input) {
        if (input.data !== this._def.value) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_literal,
            expected: this._def.value
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
      get value() {
        return this._def.value;
      }
    };
    ZodLiteral.create = (value, params) => {
      return new ZodLiteral({
        value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params)
      });
    };
    ZodEnum = class _ZodEnum extends ZodType {
      _parse(input) {
        if (typeof input.data !== "string") {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(this._def.values);
        }
        if (!this._cache.has(input.data)) {
          const ctx = this._getOrReturnCtx(input);
          const expectedValues = this._def.values;
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get options() {
        return this._def.values;
      }
      get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
          enumValues[val] = val;
        }
        return enumValues;
      }
      extract(values, newDef = this._def) {
        return _ZodEnum.create(values, {
          ...this._def,
          ...newDef
        });
      }
      exclude(values, newDef = this._def) {
        return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
          ...this._def,
          ...newDef
        });
      }
    };
    ZodEnum.create = createZodEnum;
    ZodNativeEnum = class extends ZodType {
      _parse(input) {
        const nativeEnumValues = util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            expected: util.joinValues(expectedValues),
            received: ctx.parsedType,
            code: ZodIssueCode.invalid_type
          });
          return INVALID;
        }
        if (!this._cache) {
          this._cache = new Set(util.getValidEnumValues(this._def.values));
        }
        if (!this._cache.has(input.data)) {
          const expectedValues = util.objectValues(nativeEnumValues);
          addIssueToContext(ctx, {
            received: ctx.data,
            code: ZodIssueCode.invalid_enum_value,
            options: expectedValues
          });
          return INVALID;
        }
        return OK(input.data);
      }
      get enum() {
        return this._def.values;
      }
    };
    ZodNativeEnum.create = (values, params) => {
      return new ZodNativeEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params)
      });
    };
    ZodPromise = class extends ZodType {
      unwrap() {
        return this._def.type;
      }
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.promise,
            received: ctx.parsedType
          });
          return INVALID;
        }
        const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return OK(promisified.then((data) => {
          return this._def.type.parseAsync(data, {
            path: ctx.path,
            errorMap: ctx.common.contextualErrorMap
          });
        }));
      }
    };
    ZodPromise.create = (schema, params) => {
      return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params)
      });
    };
    ZodEffects = class extends ZodType {
      innerType() {
        return this._def.schema;
      }
      sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
      }
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
          addIssue: (arg) => {
            addIssueToContext(ctx, arg);
            if (arg.fatal) {
              status.abort();
            } else {
              status.dirty();
            }
          },
          get path() {
            return ctx.path;
          }
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
          const processed = effect.transform(ctx.data, checkCtx);
          if (ctx.common.async) {
            return Promise.resolve(processed).then(async (processed2) => {
              if (status.value === "aborted")
                return INVALID;
              const result = await this._def.schema._parseAsync({
                data: processed2,
                path: ctx.path,
                parent: ctx
              });
              if (result.status === "aborted")
                return INVALID;
              if (result.status === "dirty")
                return DIRTY(result.value);
              if (status.value === "dirty")
                return DIRTY(result.value);
              return result;
            });
          } else {
            if (status.value === "aborted")
              return INVALID;
            const result = this._def.schema._parseSync({
              data: processed,
              path: ctx.path,
              parent: ctx
            });
            if (result.status === "aborted")
              return INVALID;
            if (result.status === "dirty")
              return DIRTY(result.value);
            if (status.value === "dirty")
              return DIRTY(result.value);
            return result;
          }
        }
        if (effect.type === "refinement") {
          const executeRefinement = (acc) => {
            const result = effect.refinement(acc, checkCtx);
            if (ctx.common.async) {
              return Promise.resolve(result);
            }
            if (result instanceof Promise) {
              throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
            }
            return acc;
          };
          if (ctx.common.async === false) {
            const inner = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inner.status === "aborted")
              return INVALID;
            if (inner.status === "dirty")
              status.dirty();
            executeRefinement(inner.value);
            return { status: status.value, value: inner.value };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
              if (inner.status === "aborted")
                return INVALID;
              if (inner.status === "dirty")
                status.dirty();
              return executeRefinement(inner.value).then(() => {
                return { status: status.value, value: inner.value };
              });
            });
          }
        }
        if (effect.type === "transform") {
          if (ctx.common.async === false) {
            const base = this._def.schema._parseSync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (!isValid(base))
              return INVALID;
            const result = effect.transform(base.value, checkCtx);
            if (result instanceof Promise) {
              throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
            }
            return { status: status.value, value: result };
          } else {
            return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
              if (!isValid(base))
                return INVALID;
              return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
                status: status.value,
                value: result
              }));
            });
          }
        }
        util.assertNever(effect);
      }
    };
    ZodEffects.create = (schema, effect, params) => {
      return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params)
      });
    };
    ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
      return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params)
      });
    };
    ZodOptional = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.undefined) {
          return OK(void 0);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodOptional.create = (type, params) => {
      return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params)
      });
    };
    ZodNullable = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === ZodParsedType.null) {
          return OK(null);
        }
        return this._def.innerType._parse(input);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodNullable.create = (type, params) => {
      return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params)
      });
    };
    ZodDefault = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === ZodParsedType.undefined) {
          data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      removeDefault() {
        return this._def.innerType;
      }
    };
    ZodDefault.create = (type, params) => {
      return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params)
      });
    };
    ZodCatch = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const newCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          }
        };
        const result = this._def.innerType._parse({
          data: newCtx.data,
          path: newCtx.path,
          parent: {
            ...newCtx
          }
        });
        if (isAsync(result)) {
          return result.then((result2) => {
            return {
              status: "valid",
              value: result2.status === "valid" ? result2.value : this._def.catchValue({
                get error() {
                  return new ZodError(newCtx.common.issues);
                },
                input: newCtx.data
              })
            };
          });
        } else {
          return {
            status: "valid",
            value: result.status === "valid" ? result.value : this._def.catchValue({
              get error() {
                return new ZodError(newCtx.common.issues);
              },
              input: newCtx.data
            })
          };
        }
      }
      removeCatch() {
        return this._def.innerType;
      }
    };
    ZodCatch.create = (type, params) => {
      return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params)
      });
    };
    ZodNaN = class extends ZodType {
      _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== ZodParsedType.nan) {
          const ctx = this._getOrReturnCtx(input);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: ZodParsedType.nan,
            received: ctx.parsedType
          });
          return INVALID;
        }
        return { status: "valid", value: input.data };
      }
    };
    ZodNaN.create = (params) => {
      return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params)
      });
    };
    BRAND = Symbol("zod_brand");
    ZodBranded = class extends ZodType {
      _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
          data,
          path: ctx.path,
          parent: ctx
        });
      }
      unwrap() {
        return this._def.type;
      }
    };
    ZodPipeline = class _ZodPipeline extends ZodType {
      _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
          const handleAsync = async () => {
            const inResult = await this._def.in._parseAsync({
              data: ctx.data,
              path: ctx.path,
              parent: ctx
            });
            if (inResult.status === "aborted")
              return INVALID;
            if (inResult.status === "dirty") {
              status.dirty();
              return DIRTY(inResult.value);
            } else {
              return this._def.out._parseAsync({
                data: inResult.value,
                path: ctx.path,
                parent: ctx
              });
            }
          };
          return handleAsync();
        } else {
          const inResult = this._def.in._parseSync({
            data: ctx.data,
            path: ctx.path,
            parent: ctx
          });
          if (inResult.status === "aborted")
            return INVALID;
          if (inResult.status === "dirty") {
            status.dirty();
            return {
              status: "dirty",
              value: inResult.value
            };
          } else {
            return this._def.out._parseSync({
              data: inResult.value,
              path: ctx.path,
              parent: ctx
            });
          }
        }
      }
      static create(a, b) {
        return new _ZodPipeline({
          in: a,
          out: b,
          typeName: ZodFirstPartyTypeKind.ZodPipeline
        });
      }
    };
    ZodReadonly = class extends ZodType {
      _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
          if (isValid(data)) {
            data.value = Object.freeze(data.value);
          }
          return data;
        };
        return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
      }
      unwrap() {
        return this._def.innerType;
      }
    };
    ZodReadonly.create = (type, params) => {
      return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params)
      });
    };
    late = {
      object: ZodObject.lazycreate
    };
    (function(ZodFirstPartyTypeKind2) {
      ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
      ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
      ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
      ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
      ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
      ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
      ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
      ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
      ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
      ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
      ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
      ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
      ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
      ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
      ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
      ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
      ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
      ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
      ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
      ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
      ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
      ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
      ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
      ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
      ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
      ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
      ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
      ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
      ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
      ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
      ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
      ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
      ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
      ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
      ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
      ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
    })(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
    instanceOfType = (cls, params = {
      message: `Input not instance of ${cls.name}`
    }) => custom((data) => data instanceof cls, params);
    stringType = ZodString.create;
    numberType = ZodNumber.create;
    nanType = ZodNaN.create;
    bigIntType = ZodBigInt.create;
    booleanType = ZodBoolean.create;
    dateType = ZodDate.create;
    symbolType = ZodSymbol.create;
    undefinedType = ZodUndefined.create;
    nullType = ZodNull.create;
    anyType = ZodAny.create;
    unknownType = ZodUnknown.create;
    neverType = ZodNever.create;
    voidType = ZodVoid.create;
    arrayType = ZodArray.create;
    objectType = ZodObject.create;
    strictObjectType = ZodObject.strictCreate;
    unionType = ZodUnion.create;
    discriminatedUnionType = ZodDiscriminatedUnion.create;
    intersectionType = ZodIntersection.create;
    tupleType = ZodTuple.create;
    recordType = ZodRecord.create;
    mapType = ZodMap.create;
    setType = ZodSet.create;
    functionType = ZodFunction.create;
    lazyType = ZodLazy.create;
    literalType = ZodLiteral.create;
    enumType = ZodEnum.create;
    nativeEnumType = ZodNativeEnum.create;
    promiseType = ZodPromise.create;
    effectsType = ZodEffects.create;
    optionalType = ZodOptional.create;
    nullableType = ZodNullable.create;
    preprocessType = ZodEffects.createWithPreprocess;
    pipelineType = ZodPipeline.create;
    ostring = () => stringType().optional();
    onumber = () => numberType().optional();
    oboolean = () => booleanType().optional();
    coerce = {
      string: ((arg) => ZodString.create({ ...arg, coerce: true })),
      number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
      boolean: ((arg) => ZodBoolean.create({
        ...arg,
        coerce: true
      })),
      bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
      date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
    };
    NEVER = INVALID;
  }
});

// ../../node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});
var init_external = __esm({
  "../../node_modules/zod/v3/external.js"() {
    init_errors();
    init_parseUtil();
    init_typeAliases();
    init_util();
    init_types();
    init_ZodError();
  }
});

// ../../node_modules/zod/index.js
var init_zod = __esm({
  "../../node_modules/zod/index.js"() {
    init_external();
    init_external();
  }
});

// ../../packages/project-schema/src/index.ts
function validateProject(input) {
  const r = ProjectSchema.safeParse(input);
  if (r.success) return { ok: true, project: r.data };
  return {
    ok: false,
    errors: r.error.issues.map((i) => `${i.path.join(".") || "(\u0631\u06CC\u0634\u0647)"}: ${i.message}`)
  };
}
var SCHEMA_VERSION, hexColor, StyleSchema, AspectSchema, PaletteSchema, PaperShapeSchema, LayerMotionSchema, PaperLayerSchema, sceneBase, PaperLayersRevealSceneSchema, LogoAssembleSceneSchema, TitleRevealSceneSchema, SceneSchema, ProjectSchema, PALETTES;
var init_src = __esm({
  "../../packages/project-schema/src/index.ts"() {
    "use strict";
    init_zod();
    SCHEMA_VERSION = 1;
    hexColor = external_exports.string().regex(/^#[0-9a-fA-F]{6}$/, "\u0631\u0646\u06AF \u0628\u0627\u06CC\u062F \u0628\u0647 \u0634\u06A9\u0644 #RRGGBB \u0628\u0627\u0634\u062F");
    StyleSchema = external_exports.enum(["paper-cut", "minimal"]);
    AspectSchema = external_exports.enum(["16:9", "9:16", "1:1"]);
    PaletteSchema = external_exports.object({
      background: hexColor,
      /** رنگ‌های لایه‌های کاغذی از دور به نزدیک */
      layers: external_exports.array(hexColor).min(2).max(6),
      primary: hexColor,
      accent: hexColor,
      text: hexColor
    });
    PaperShapeSchema = external_exports.enum([
      "hills",
      "mountains",
      "waves",
      "clouds",
      "sun",
      "trees",
      "city"
    ]);
    LayerMotionSchema = external_exports.enum([
      "rise",
      // از پایین بالا می‌آید
      "drop",
      // از بالا پایین می‌افتد
      "parallax",
      // حرکت افقی آرام وابسته به عمق
      "sway",
      // تاب خوردن
      "float",
      // شناور بالا و پایین
      "spin"
      // چرخش آرام (برای خورشید)
    ]);
    PaperLayerSchema = external_exports.object({
      id: external_exports.string().min(1),
      shape: PaperShapeSchema,
      /** ۰ = دورترین، ۱ = نزدیک‌ترین؛ روی سایه، سرعت پارالاکس و ترتیب ورود اثر دارد */
      depth: external_exports.number().min(0).max(1),
      color: hexColor.optional(),
      motions: external_exports.array(LayerMotionSchema).min(1).max(3),
      /** تأخیر ورود به فریم نسبت به شروع صحنه */
      delayFrames: external_exports.number().int().min(0).default(0)
    });
    sceneBase = {
      id: external_exports.string().min(1),
      startFrame: external_exports.number().int().min(0),
      durationFrames: external_exports.number().int().min(1)
    };
    PaperLayersRevealSceneSchema = external_exports.object({
      ...sceneBase,
      action: external_exports.literal("paper_layers_reveal"),
      layers: external_exports.array(PaperLayerSchema).min(1).max(12),
      camera: external_exports.enum(["none", "push-in", "pan"]).default("push-in")
    });
    LogoAssembleSceneSchema = external_exports.object({
      ...sceneBase,
      action: external_exports.literal("logo_assemble"),
      /** متن کوتاه داخل نشان (مثلاً حروف اول) */
      monogram: external_exports.string().min(1).max(4),
      /** مسیر فایل لوگوی کاربر (PNG/SVG)؛ اگر نباشد نشان کاغذی ساخته می‌شود */
      logoSrc: external_exports.string().optional()
    });
    TitleRevealSceneSchema = external_exports.object({
      ...sceneBase,
      action: external_exports.literal("title_reveal"),
      text: external_exports.string().min(1).max(120),
      subtitle: external_exports.string().max(160).optional(),
      animation: external_exports.enum(["word-by-word", "fade-up", "paper-strip"]).default("word-by-word"),
      /** صحنه‌ای که متن رویش نمایش داده می‌شود (لایه‌ها پشت متن می‌مانند) */
      overScene: external_exports.string().optional()
    });
    SceneSchema = external_exports.discriminatedUnion("action", [
      PaperLayersRevealSceneSchema,
      LogoAssembleSceneSchema,
      TitleRevealSceneSchema
    ]);
    ProjectSchema = external_exports.object({
      schemaVersion: external_exports.literal(SCHEMA_VERSION).default(SCHEMA_VERSION),
      project: external_exports.string().min(1).max(120),
      fps: external_exports.number().int().min(12).max(60),
      durationFrames: external_exports.number().int().min(1).max(60 * 60 * 10),
      aspect: AspectSchema.default("16:9"),
      style: StyleSchema,
      palette: PaletteSchema,
      scenes: external_exports.array(SceneSchema).min(1).max(40)
    }).superRefine((p, ctx) => {
      const ids = /* @__PURE__ */ new Set();
      p.scenes.forEach((s, i) => {
        if (ids.has(s.id)) {
          ctx.addIssue({ code: "custom", path: ["scenes", i, "id"], message: `\u0634\u0646\u0627\u0633\u0647 \u062A\u06A9\u0631\u0627\u0631\u06CC \u0635\u062D\u0646\u0647: ${s.id}` });
        }
        ids.add(s.id);
        if (s.startFrame + s.durationFrames > p.durationFrames) {
          ctx.addIssue({
            code: "custom",
            path: ["scenes", i],
            message: `\u0635\u062D\u0646\u0647 \xAB${s.id}\xBB \u0627\u0632 \u0627\u0646\u062A\u0647\u0627\u06CC \u067E\u0631\u0648\u0698\u0647 (${p.durationFrames} \u0641\u0631\u06CC\u0645) \u0628\u06CC\u0631\u0648\u0646 \u0645\u06CC\u200C\u0632\u0646\u062F`
          });
        }
      });
      p.scenes.forEach((s, i) => {
        if (s.action === "title_reveal" && s.overScene && !ids.has(s.overScene)) {
          ctx.addIssue({ code: "custom", path: ["scenes", i, "overScene"], message: `\u0635\u062D\u0646\u0647 \u067E\u0627\u06CC\u0647 \xAB${s.overScene}\xBB \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F` });
        }
      });
    });
    PALETTES = {
      /** پیش‌فرض: آسمان آبی و تپه‌های سبز/فیروزه‌ای */
      sky: {
        background: "#cfe8f3",
        layers: ["#9fd3c7", "#6fb7a8", "#3f8f84", "#24665f"],
        primary: "#1f5f8b",
        accent: "#f4a259",
        text: "#163042"
      },
      gold: {
        background: "#fbf3df",
        layers: ["#f1d9a0", "#e3b85c", "#c9922f", "#8d6418"],
        primary: "#b8860b",
        accent: "#d4762c",
        text: "#3b2a07"
      },
      sunset: {
        background: "#ffe3d1",
        layers: ["#ffb4a2", "#e5989b", "#b5838d", "#6d6875"],
        primary: "#c44569",
        accent: "#f8b500",
        text: "#2d1e2f"
      },
      night: {
        background: "#1b2440",
        layers: ["#2e3a66", "#3f4f86", "#5468a8", "#7b8fd1"],
        primary: "#9fb4ff",
        accent: "#ffd166",
        text: "#f5f7ff"
      }
    };
  }
});

// ../../packages/render-engine/src/index.ts
var src_exports = {};
__export(src_exports, {
  entryPoint: () => entryPoint,
  getBundle: () => getBundle,
  renderFrame: () => renderFrame,
  renderProject: () => renderProject
});
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition, ensureBrowser } from "@remotion/renderer";
function entryPoint() {
  if (process.env.AMS_ENTRY_POINT) return process.env.AMS_ENTRY_POINT;
  const here2 = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here2, "../../animation-engine/src/entry.ts");
}
function getBundle(publicDir, onProgress) {
  if (!bundleCache) {
    bundleCache = bundle({
      entryPoint: entryPoint(),
      publicDir,
      onProgress: (p) => onProgress?.(p / 100)
    }).catch((e) => {
      bundleCache = null;
      throw e;
    });
  }
  return bundleCache;
}
async function resolveBrowser(explicit) {
  const candidate = explicit ?? process.env.AMS_BROWSER;
  if (candidate && fs.existsSync(candidate)) return candidate;
  for (const p of KNOWN_BROWSERS) if (fs.existsSync(p)) return p;
  await ensureBrowser();
  return void 0;
}
function assertValid(project) {
  const v = validateProject(project);
  if (!v.ok) throw new Error(`\u067E\u0631\u0648\u0698\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A \u0648 \u0631\u0646\u062F\u0631 \u0646\u0645\u06CC\u200C\u0634\u0648\u062F:
${v.errors.join("\n")}`);
  return v.project;
}
async function renderProject(projectInput, opts) {
  const project = assertValid(projectInput);
  const browserExecutable = await resolveBrowser(opts.browserExecutable);
  const serveUrl = await getBundle(opts.publicDir, (p) => opts.onProgress?.({ stage: "bundling", progress: p }));
  const inputProps = { project };
  const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps, browserExecutable });
  fs.mkdirSync(path.dirname(opts.outputPath), { recursive: true });
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation: opts.outputPath,
    inputProps,
    crf: opts.crf ?? 20,
    pixelFormat: "yuv420p",
    concurrency: opts.concurrency ?? null,
    browserExecutable,
    chromiumOptions: { gl: process.env.AMS_GL ?? "angle" },
    onProgress: ({ progress, stitchStage }) => opts.onProgress?.({ stage: stitchStage === "muxing" ? "encoding" : "rendering", progress })
  });
  opts.onProgress?.({ stage: "done", progress: 1 });
  return opts.outputPath;
}
async function renderFrame(projectInput, frame, outputPath, publicDir) {
  const project = assertValid(projectInput);
  const browserExecutable = await resolveBrowser();
  const serveUrl = await getBundle(publicDir);
  const inputProps = { project };
  const composition = await selectComposition({ serveUrl, id: COMPOSITION_ID, inputProps, browserExecutable });
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await renderStill({ composition, serveUrl, output: outputPath, frame, inputProps, browserExecutable, chromiumOptions: { gl: process.env.AMS_GL ?? "angle" } });
  return outputPath;
}
var COMPOSITION_ID, bundleCache, KNOWN_BROWSERS;
var init_src2 = __esm({
  "../../packages/render-engine/src/index.ts"() {
    "use strict";
    init_src();
    COMPOSITION_ID = "MotionProject";
    bundleCache = null;
    KNOWN_BROWSERS = [
      "/opt/pw-browsers/chromium_headless_shell-1243/chrome-linux/headless_shell",
      "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"
    ];
  }
});

// electron/main.ts
import { app, BrowserWindow, dialog, ipcMain, safeStorage, shell } from "electron";
import path2 from "node:path";
import fs2 from "node:fs";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// ../../packages/ai-agent/src/agent.ts
init_src();

// ../../packages/ai-agent/src/tools.ts
init_src();
var SHAPES = ["hills", "mountains", "waves", "clouds", "sun", "trees", "city"];
var MOTIONS = ["rise", "drop", "parallax", "sway", "float", "spin"];
var THEMES = ["landscape", "sea", "city", "night"];
var TOOL_DEFINITIONS = [
  {
    type: "function",
    function: {
      name: "createProject",
      description: "\u06CC\u06A9 \u067E\u0631\u0648\u0698\u0647 \u062E\u0627\u0644\u06CC \u062C\u062F\u06CC\u062F \u0645\u06CC\u200C\u0633\u0627\u0632\u062F. \u0647\u0645\u06CC\u0634\u0647 \u0627\u0648\u0644\u06CC\u0646 \u0627\u0628\u0632\u0627\u0631 \u0628\u0631\u0627\u06CC \u067E\u0631\u0648\u0698\u0647 \u062C\u062F\u06CC\u062F \u0627\u0633\u062A.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "\u0646\u0627\u0645 \u067E\u0631\u0648\u0698\u0647" },
          durationSeconds: { type: "number", minimum: 1, maximum: 600 },
          style: { type: "string", enum: ["paper-cut", "minimal"] },
          aspect: { type: "string", enum: ["16:9", "9:16", "1:1"] },
          palette: { type: "string", enum: Object.keys(PALETTES) }
        },
        required: ["name", "durationSeconds", "style"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "addPaperCutScene",
      description: "\u0635\u062D\u0646\u0647 \u06A9\u0627\u063A\u0630\u06CC \u0686\u0646\u062F\u0644\u0627\u06CC\u0647 \u0627\u0636\u0627\u0641\u0647 \u0645\u06CC\u200C\u06A9\u0646\u062F. \u0627\u06AF\u0631 layers \u062F\u0627\u062F\u0647 \u0646\u0634\u0648\u062F\u060C Layer Composer \u0628\u0631\u0627\u0633\u0627\u0633 theme \u0644\u0627\u06CC\u0647\u200C\u0647\u0627 \u0631\u0627 \u062E\u0648\u062F\u06A9\u0627\u0631 \u0645\u06CC\u200C\u0686\u06CC\u0646\u062F.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          startSeconds: { type: "number", minimum: 0 },
          durationSeconds: { type: "number", minimum: 0.5 },
          theme: { type: "string", enum: [...THEMES] },
          camera: { type: "string", enum: ["none", "push-in", "pan"] },
          layers: {
            type: "array",
            items: {
              type: "object",
              properties: {
                shape: { type: "string", enum: SHAPES },
                depth: { type: "number", minimum: 0, maximum: 1 },
                motions: { type: "array", items: { type: "string", enum: MOTIONS } }
              },
              required: ["shape", "depth", "motions"]
            }
          }
        },
        required: ["startSeconds", "durationSeconds"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "animateLogo",
      description: "\u0644\u0648\u06AF\u0648\u0645\u0648\u0634\u0646: \u0642\u0637\u0639\u0627\u062A \u06A9\u0627\u063A\u0630\u06CC \u06A9\u0646\u0627\u0631 \u0647\u0645 \u0642\u0631\u0627\u0631 \u0645\u06CC\u200C\u06AF\u06CC\u0631\u0646\u062F \u0648 \u0646\u0634\u0627\u0646 \u0633\u0627\u062E\u062A\u0647 \u0645\u06CC\u200C\u0634\u0648\u062F.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          startSeconds: { type: "number", minimum: 0 },
          durationSeconds: { type: "number", minimum: 1 },
          monogram: { type: "string", description: "\u06F1 \u062A\u0627 \u06F4 \u062D\u0631\u0641 \u062F\u0627\u062E\u0644 \u0646\u0634\u0627\u0646" },
          logoSrc: { type: "string", description: "\u0645\u0633\u06CC\u0631 \u0641\u0627\u06CC\u0644 \u0644\u0648\u06AF\u0648\u06CC \u06A9\u0627\u0631\u0628\u0631 \u062F\u0631 \u0635\u0648\u0631\u062A \u0648\u062C\u0648\u062F" }
        },
        required: ["startSeconds", "durationSeconds", "monogram"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "addAnimatedText",
      description: "\u0645\u062A\u0646 \u0645\u062A\u062D\u0631\u06A9 \u0641\u0627\u0631\u0633\u06CC (\u0631\u0627\u0633\u062A\u200C\u0628\u0647\u200C\u0686\u067E) \u0627\u0636\u0627\u0641\u0647 \u0645\u06CC\u200C\u06A9\u0646\u062F.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          subtitle: { type: "string" },
          startSeconds: { type: "number", minimum: 0 },
          durationSeconds: { type: "number", minimum: 0.5 },
          animation: { type: "string", enum: ["word-by-word", "fade-up", "paper-strip"] }
        },
        required: ["text", "startSeconds", "durationSeconds"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "setPalette",
      description: "\u0641\u0642\u0637 \u0631\u0646\u06AF\u200C\u0647\u0627\u06CC \u067E\u0631\u0648\u0698\u0647 \u0631\u0627 \u0639\u0648\u0636 \u0645\u06CC\u200C\u06A9\u0646\u062F. \u06CC\u0627 \u06CC\u06A9 preset \u0628\u062F\u0647 \u06CC\u0627 \u0631\u0646\u06AF\u200C\u0647\u0627\u06CC \u062A\u06A9\u06CC \u0631\u0627.",
      parameters: {
        type: "object",
        properties: {
          preset: { type: "string", enum: Object.keys(PALETTES) },
          background: { type: "string" },
          primary: { type: "string" },
          accent: { type: "string" },
          text: { type: "string" }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "updateScene",
      description: "\u0641\u0642\u0637 \u06CC\u06A9 \u0635\u062D\u0646\u0647 \u0631\u0627 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0645\u06CC\u200C\u06A9\u0646\u062F (\u0645\u062A\u0646\u060C \u0632\u0645\u0627\u0646\u060C \u0627\u0646\u06CC\u0645\u06CC\u0634\u0646). \u0628\u0642\u06CC\u0647 \u067E\u0631\u0648\u0698\u0647 \u062F\u0633\u062A \u0646\u0645\u06CC\u200C\u062E\u0648\u0631\u062F.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          subtitle: { type: "string" },
          monogram: { type: "string" },
          animation: { type: "string", enum: ["word-by-word", "fade-up", "paper-strip"] },
          startSeconds: { type: "number" },
          durationSeconds: { type: "number" }
        },
        required: ["id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "removeScene",
      description: "\u06CC\u06A9 \u0635\u062D\u0646\u0647 \u0631\u0627 \u062D\u0630\u0641 \u0645\u06CC\u200C\u06A9\u0646\u062F.",
      parameters: { type: "object", properties: { id: { type: "string" } }, required: ["id"] }
    }
  },
  {
    type: "function",
    function: {
      name: "exportVideo",
      description: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0631\u0646\u062F\u0631 \u062E\u0631\u0648\u062C\u06CC MP4. \u0641\u0642\u0637 \u0648\u0642\u062A\u06CC \u067E\u0631\u0648\u0698\u0647 \u0622\u0645\u0627\u062F\u0647 \u0627\u0633\u062A \u0635\u062F\u0627 \u0628\u0632\u0646.",
      parameters: { type: "object", properties: { fileName: { type: "string" } } }
    }
  }
];
function composeLayers(theme) {
  const L = (shape, depth, motions, delayFrames) => ({
    shape,
    depth,
    motions,
    delayFrames
  });
  switch (theme) {
    case "sea":
      return [
        L("sun", 0.05, ["rise", "spin"], 0),
        L("clouds", 0.2, ["drop", "float"], 6),
        L("waves", 0.45, ["rise", "parallax"], 10),
        L("waves", 0.7, ["rise", "parallax"], 16),
        L("waves", 0.95, ["rise", "parallax"], 22)
      ];
    case "city":
      return [
        L("sun", 0.05, ["rise", "spin"], 0),
        L("clouds", 0.2, ["drop", "float"], 6),
        L("city", 0.45, ["rise", "parallax"], 10),
        L("city", 0.7, ["rise", "parallax"], 16),
        L("hills", 0.95, ["rise", "parallax"], 22)
      ];
    case "night":
    case "landscape":
    default:
      return [
        L("sun", 0.05, ["rise", "spin"], 0),
        L("clouds", 0.2, ["drop", "float"], 6),
        L("mountains", 0.35, ["rise", "parallax"], 10),
        L("hills", 0.55, ["rise", "parallax"], 15),
        L("hills", 0.75, ["rise", "parallax"], 20),
        L("trees", 0.85, ["rise", "sway"], 26),
        L("hills", 1, ["rise", "parallax"], 30)
      ];
  }
}
function sec(project, s, name) {
  if (typeof s !== "number" || !Number.isFinite(s) || s < 0) throw new Error(`${name} \u0628\u0627\u06CC\u062F \u0639\u062F\u062F \u0645\u062B\u0628\u062A \u0628\u0627\u0634\u062F`);
  return Math.round(s * project.fps);
}
function nextId(project, prefix) {
  let i = 1;
  while (project.scenes.some((s) => s.id === `${prefix}-${i}`)) i++;
  return `${prefix}-${i}`;
}
function current(state) {
  if (state.project) return state.project;
  if (state.draft) return { ...state.draft, scenes: [] };
  throw new Error("\u0647\u0646\u0648\u0632 \u067E\u0631\u0648\u0698\u0647\u200C\u0627\u06CC \u0633\u0627\u062E\u062A\u0647 \u0646\u0634\u062F\u0647\u061B \u0627\u0648\u0644 createProject \u0631\u0627 \u0635\u062F\u0627 \u0628\u0632\u0646");
}
function commit(state, next) {
  const v = validateProject(next);
  if (!v.ok) return { ok: false, error: `\u067E\u0631\u0648\u0698\u0647 \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0634\u062F:
${v.errors.join("\n")}` };
  state.project = v.project;
  return { ok: true, project: v.project, message: "" };
}
function executeTool(state, call) {
  try {
    const a = call.args ?? {};
    switch (call.name) {
      case "createProject": {
        const preset = PALETTES[a.palette] ?? (a.style === "minimal" ? PALETTES.night : PALETTES.sky);
        const fps = 30;
        const durationFrames = sec({ fps }, a.durationSeconds, "durationSeconds");
        if (durationFrames < fps) throw new Error("\u0645\u062F\u062A \u067E\u0631\u0648\u0698\u0647 \u062D\u062F\u0627\u0642\u0644 \u06F1 \u062B\u0627\u0646\u06CC\u0647 \u0627\u0633\u062A");
        state.draft = {
          project: String(a.name || "\u067E\u0631\u0648\u0698\u0647 \u0628\u062F\u0648\u0646 \u0646\u0627\u0645"),
          fps,
          durationFrames,
          aspect: a.aspect ?? "16:9",
          style: a.style === "minimal" ? "minimal" : "paper-cut",
          palette: preset
        };
        state.project = null;
        return { ok: true, project: null, message: `\u067E\u0631\u0648\u0698\u0647 \xAB${state.draft.project}\xBB \u0628\u0627 ${a.durationSeconds} \u062B\u0627\u0646\u06CC\u0647 \u0633\u0627\u062E\u062A\u0647 \u0634\u062F` };
      }
      case "addPaperCutScene": {
        const p = current(state);
        const theme = THEMES.includes(a.theme) ? a.theme : "landscape";
        const raw = Array.isArray(a.layers) && a.layers.length ? a.layers.map((l, i) => ({ shape: l.shape, depth: l.depth, motions: l.motions, delayFrames: i * 5 })) : composeLayers(theme);
        const scene = {
          id: a.id || nextId(p, "paper"),
          action: "paper_layers_reveal",
          startFrame: sec(p, a.startSeconds, "startSeconds"),
          durationFrames: clampToEnd(p, sec(p, a.startSeconds, "startSeconds"), sec(p, a.durationSeconds, "durationSeconds")),
          camera: a.camera ?? "push-in",
          layers: raw.map((l, i) => ({ ...l, id: `${l.shape}-${i + 1}` }))
        };
        const r = commit(state, { ...p, scenes: [...p.scenes, scene] });
        return r.ok ? { ...r, message: `\u0635\u062D\u0646\u0647 \u06A9\u0627\u063A\u0630\u06CC \xAB${scene.id}\xBB \u0628\u0627 ${scene.layers.length} \u0644\u0627\u06CC\u0647 \u0627\u0636\u0627\u0641\u0647 \u0634\u062F` } : r;
      }
      case "animateLogo": {
        const p = current(state);
        const start = sec(p, a.startSeconds, "startSeconds");
        const scene = {
          id: a.id || nextId(p, "logo"),
          action: "logo_assemble",
          startFrame: start,
          durationFrames: clampToEnd(p, start, sec(p, a.durationSeconds, "durationSeconds")),
          monogram: String(a.monogram ?? "AI").slice(0, 4),
          ...a.logoSrc ? { logoSrc: String(a.logoSrc) } : {}
        };
        const r = commit(state, { ...p, scenes: [...p.scenes, scene] });
        return r.ok ? { ...r, message: `\u0644\u0648\u06AF\u0648\u0645\u0648\u0634\u0646 \xAB${scene.id}\xBB \u0627\u0636\u0627\u0641\u0647 \u0634\u062F` } : r;
      }
      case "addAnimatedText": {
        const p = current(state);
        const start = sec(p, a.startSeconds, "startSeconds");
        const scene = {
          id: a.id || nextId(p, "title"),
          action: "title_reveal",
          startFrame: start,
          durationFrames: clampToEnd(p, start, sec(p, a.durationSeconds, "durationSeconds")),
          text: String(a.text),
          ...a.subtitle ? { subtitle: String(a.subtitle) } : {},
          animation: a.animation ?? "word-by-word"
        };
        const r = commit(state, { ...p, scenes: [...p.scenes, scene] });
        return r.ok ? { ...r, message: `\u0645\u062A\u0646 \xAB${scene.text}\xBB \u0627\u0636\u0627\u0641\u0647 \u0634\u062F` } : r;
      }
      case "setPalette": {
        const p = current(state);
        const base = PALETTES[a.preset] ?? p.palette;
        const palette = {
          ...base,
          ...a.background ? { background: a.background } : {},
          ...a.primary ? { primary: a.primary } : {},
          ...a.accent ? { accent: a.accent } : {},
          ...a.text ? { text: a.text } : {}
        };
        if (!state.project) {
          state.draft = { ...state.draft, palette };
          return { ok: true, project: null, message: "\u0631\u0646\u06AF\u200C\u0647\u0627 \u062A\u0646\u0638\u06CC\u0645 \u0634\u062F" };
        }
        const r = commit(state, { ...p, palette });
        return r.ok ? { ...r, message: "\u0641\u0642\u0637 \u0631\u0646\u06AF\u200C\u0647\u0627\u06CC \u067E\u0631\u0648\u0698\u0647 \u0639\u0648\u0636 \u0634\u062F" } : r;
      }
      case "updateScene": {
        const p = current(state);
        const idx = p.scenes.findIndex((s) => s.id === a.id);
        if (idx < 0) throw new Error(`\u0635\u062D\u0646\u0647 \xAB${a.id}\xBB \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F. \u0635\u062D\u0646\u0647\u200C\u0647\u0627: ${p.scenes.map((s) => s.id).join("\u060C ")}`);
        const old = p.scenes[idx];
        const updated = { ...old };
        if (a.startSeconds !== void 0) updated.startFrame = sec(p, a.startSeconds, "startSeconds");
        if (a.durationSeconds !== void 0) updated.durationFrames = sec(p, a.durationSeconds, "durationSeconds");
        if (old.action === "title_reveal") {
          if (a.text) updated.text = String(a.text);
          if (a.subtitle !== void 0) updated.subtitle = String(a.subtitle);
          if (a.animation) updated.animation = a.animation;
        }
        if (old.action === "logo_assemble" && a.monogram) updated.monogram = String(a.monogram).slice(0, 4);
        const scenes = [...p.scenes];
        scenes[idx] = updated;
        const r = commit(state, { ...p, scenes });
        return r.ok ? { ...r, message: `\u0641\u0642\u0637 \u0635\u062D\u0646\u0647 \xAB${a.id}\xBB \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0634\u062F` } : r;
      }
      case "removeScene": {
        const p = current(state);
        if (!p.scenes.some((s) => s.id === a.id)) throw new Error(`\u0635\u062D\u0646\u0647 \xAB${a.id}\xBB \u067E\u06CC\u062F\u0627 \u0646\u0634\u062F`);
        const r = commit(state, { ...p, scenes: p.scenes.filter((s) => s.id !== a.id) });
        return r.ok ? { ...r, message: `\u0635\u062D\u0646\u0647 \xAB${a.id}\xBB \u062D\u0630\u0641 \u0634\u062F` } : r;
      }
      case "exportVideo": {
        if (!state.project) throw new Error("\u067E\u0631\u0648\u0698\u0647 \u0647\u0646\u0648\u0632 \u0635\u062D\u0646\u0647\u200C\u0627\u06CC \u0646\u062F\u0627\u0631\u062F \u0648 \u0642\u0627\u0628\u0644 \u0631\u0646\u062F\u0631 \u0646\u06CC\u0633\u062A");
        return {
          ok: true,
          project: state.project,
          message: "\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0631\u0646\u062F\u0631 \u062B\u0628\u062A \u0634\u062F",
          exportRequested: { fileName: a.fileName }
        };
      }
      default:
        return { ok: false, error: `\u0627\u0628\u0632\u0627\u0631 \u0646\u0627\u0634\u0646\u0627\u062E\u062A\u0647: ${call.name}` };
    }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
function clampToEnd(p, start, duration) {
  return Math.max(1, Math.min(duration, p.durationFrames - start));
}

// ../../packages/ai-agent/src/persian.ts
var FA_DIGITS = "\u06F0\u06F1\u06F2\u06F3\u06F4\u06F5\u06F6\u06F7\u06F8\u06F9";
var AR_DIGITS = "\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669";
function normalizeDigits(s) {
  return s.replace(/[۰-۹٠-٩]/g, (d) => {
    const i = FA_DIGITS.indexOf(d);
    return String(i >= 0 ? i : AR_DIGITS.indexOf(d));
  });
}
function normalizeText(s) {
  return normalizeDigits(s).replace(/ي/g, "\u06CC").replace(/ك/g, "\u06A9").replace(/‌+/g, "\u200C").replace(/\s+/g, " ").trim();
}
var NUMBER_WORDS = {
  \u06CC\u06A9: 1,
  \u062F\u0648: 2,
  \u0633\u0647: 3,
  \u0686\u0647\u0627\u0631: 4,
  \u067E\u0646\u062C: 5,
  \u0634\u0634: 6,
  \u0647\u0641\u062A: 7,
  \u0647\u0634\u062A: 8,
  \u0646\u0647: 9,
  \u062F\u0647: 10,
  \u06CC\u0627\u0632\u062F\u0647: 11,
  \u062F\u0648\u0627\u0632\u062F\u0647: 12,
  \u0633\u06CC\u0632\u062F\u0647: 13,
  \u0686\u0647\u0627\u0631\u062F\u0647: 14,
  \u067E\u0627\u0646\u0632\u062F\u0647: 15,
  \u067E\u0648\u0646\u0632\u062F\u0647: 15,
  \u0634\u0627\u0646\u0632\u062F\u0647: 16,
  \u0647\u0641\u062F\u0647: 17,
  \u0647\u062C\u062F\u0647: 18,
  \u0646\u0648\u0632\u062F\u0647: 19,
  \u0628\u06CC\u0633\u062A: 20,
  \u0633\u06CC: 30,
  \u0686\u0647\u0644: 40,
  \u067E\u0646\u062C\u0627\u0647: 50,
  \u0634\u0635\u062A: 60
};
function extractSeconds(text) {
  const t = normalizeText(text);
  const num = t.match(/(\d+(?:\.\d+)?)\s*(ثانیه|ثانیه‌ای|s\b|sec)/i);
  if (num) return parseFloat(num[1]);
  const min = t.match(/(\d+(?:\.\d+)?)\s*دقیقه/);
  if (min) return parseFloat(min[1]) * 60;
  const words = Object.keys(NUMBER_WORDS).sort((a, b) => b.length - a.length).join("|");
  const re = new RegExp(`((?:${words})(?:\\s*\u0648\\s*(?:${words}))*)\\s*(\u062B\u0627\u0646\u06CC\u0647|\u062F\u0642\u06CC\u0642\u0647)`);
  const m = t.match(re);
  if (m) {
    const value = m[1].split(/\s*و\s*/).reduce((sum, w) => sum + (NUMBER_WORDS[w.trim()] ?? 0), 0);
    return m[2] === "\u062F\u0642\u06CC\u0642\u0647" ? value * 60 : value;
  }
  return void 0;
}
function monogramFrom(text) {
  const words = normalizeText(text).split(" ").filter((w) => w.length > 1 && !STOP_WORDS.has(w));
  if (words.length === 0) return "AI";
  const pick = words.slice(-2);
  return pick.map((w) => w[0]).join("\u200C");
}
var STOP_WORDS = /* @__PURE__ */ new Set(["\u0628\u0627", "\u0648", "\u062F\u0631", "\u0628\u0647", "\u0627\u0632", "\u0628\u0631\u0627\u06CC", "\u06A9\u0647", "\u0631\u0627"]);

// ../../packages/ai-agent/src/offline-planner.ts
var COLOR_TO_PRESET = [
  [/طلایی|طلا|زرد|gold/i, "gold"],
  [/غروب|نارنجی|صورتی|sunset/i, "sunset"],
  [/شب|تیره|سرمه|مشکی|night|dark/i, "night"],
  [/آبی|آسمان|سبز|sky|blue/i, "sky"]
];
function presetFor(text) {
  return COLOR_TO_PRESET.find(([re]) => re.test(text))?.[1];
}
function extractTitle(text) {
  const t = normalizeText(text);
  const quoted = t.match(/[«"“]([^»"”]+)[»"”]/);
  if (quoted) return quoted[1].trim();
  const m = t.match(
    /(?:با\s+)?(?:عنوان|تیتر|متن|نوشته)\s*(?:ی\s+)?(?::\s*)?(.+?)\s*(?:بساز|درست کن|بنویس|ایجاد کن|تولید کن|بذار|بگذار|[.!؟?]|$)/
  );
  if (m) {
    return m[1].replace(/\s*(برام|برای من|لطفا|لطفاً)\s*$/, "").replace(/\s+(رو|را)$/, "").trim();
  }
  return void 0;
}
function detectStyle(t) {
  if (/مینیمال|minimal|ساده|هندسی/i.test(t)) return "minimal";
  return "paper-cut";
}
function detectAspect(t) {
  if (/9:16|عمودی|استوری|ریلز|reels|story|شورتز|shorts/i.test(t)) return "9:16";
  if (/1:1|مربع|پست اینستا/i.test(t)) return "1:1";
  return "16:9";
}
function detectTheme(t) {
  if (/دریا|اقیانوس|موج|ساحل/.test(t)) return "sea";
  if (/شهر|ساختمان|برج/.test(t)) return "city";
  if (/شب|ستاره|ماه/.test(t)) return "night";
  return "landscape";
}
var r1 = (n) => Math.round(n * 10) / 10;
function planNew(text) {
  const t = normalizeText(text);
  const seconds = Math.min(600, Math.max(3, extractSeconds(t) ?? 10));
  const style = detectStyle(t);
  const aspect = detectAspect(t);
  const theme = detectTheme(t);
  const title = extractTitle(t) ?? "\u0645\u0648\u0634\u0646\u200C\u06AF\u0631\u0627\u0641\u06CC\u06A9 \u0645\u0646";
  const wantsLogo = /لوگو|logo|نشان/i.test(t);
  const palette = presetFor(t.replace(/آبی|سبز/g, "")) ?? (theme === "night" ? "night" : style === "minimal" ? "night" : "sky");
  const calls = [
    { name: "createProject", args: { name: title, durationSeconds: seconds, style, aspect, palette } },
    { name: "addPaperCutScene", args: { id: "scene-bg", startSeconds: 0, durationSeconds: seconds, theme, camera: "push-in" } }
  ];
  if (wantsLogo) {
    calls.push({
      name: "animateLogo",
      args: { id: "logo", startSeconds: r1(seconds * 0.12), durationSeconds: r1(seconds * 0.45), monogram: monogramFrom(title) }
    });
    calls.push({
      name: "addAnimatedText",
      args: { id: "title", text: title, startSeconds: r1(seconds * 0.5), durationSeconds: r1(seconds * 0.5), animation: "word-by-word" }
    });
  } else {
    calls.push({
      name: "addAnimatedText",
      args: { id: "title", text: title, startSeconds: r1(seconds * 0.22), durationSeconds: r1(seconds * 0.78), animation: "word-by-word" }
    });
  }
  calls.push({ name: "exportVideo", args: {} });
  return calls;
}
function planEdit(text, project) {
  const t = normalizeText(text);
  const calls = [];
  const title = project.scenes.find((s) => s.action === "title_reveal");
  const colorChange = t.match(/رنگ\s*(?:\S+\s+)?(?:رو|را)?\s*(.+?)\s*(?:کن|بکن|بشه|بزن)/);
  if (colorChange || /رنگ/.test(t)) {
    const target = colorChange?.[1] ?? t;
    const preset = presetFor(target.split(/\s+(?:رو|را)\s+/).pop() ?? target);
    if (preset) calls.push({ name: "setPalette", args: { preset } });
  }
  const newTitle = t.match(/(?:عنوان|متن|تیتر)\s*(?:رو|را)\s*(?:به\s*)?[«"]?(.+?)[»"]?\s*(?:تغییر بده|عوض کن|کن)$/);
  if (newTitle && title) calls.push({ name: "updateScene", args: { id: title.id, text: newTitle[1].trim() } });
  if (title && /محو|fade/i.test(t) && /متن|عنوان/.test(t)) calls.push({ name: "updateScene", args: { id: title.id, animation: "fade-up" } });
  if (title && /نوار|کاغذ/.test(t) && /متن|عنوان/.test(t) && !newTitle) calls.push({ name: "updateScene", args: { id: title.id, animation: "paper-strip" } });
  const logo = project.scenes.find((s) => s.action === "logo_assemble");
  if (logo && /لوگو/.test(t) && /حذف|بردار/.test(t)) calls.push({ name: "removeScene", args: { id: logo.id } });
  if (!logo && /لوگو/.test(t) && /اضافه|بذار|بگذار|بساز/.test(t)) {
    const secs = project.durationFrames / project.fps;
    calls.push({
      name: "animateLogo",
      args: { id: "logo", startSeconds: r1(secs * 0.05), durationSeconds: r1(secs * 0.4), monogram: monogramFrom(title?.text ?? project.project) }
    });
  }
  if (/رندر|خروجی|export|mp4/i.test(t)) calls.push({ name: "exportVideo", args: {} });
  return calls.length ? calls : null;
}
function planOffline(text, project) {
  const t = normalizeText(text);
  const isNew = !project || /بساز|درست کن|تولید کن|ایجاد کن/.test(t) && !/رنگ|عوض|تغییر|حذف/.test(t);
  if (!isNew && project) {
    const edit = planEdit(t, project);
    if (edit) return { calls: edit, summary: "\u0648\u06CC\u0631\u0627\u06CC\u0634 \u0628\u062E\u0634 \u0645\u0631\u062A\u0628\u0637 \u067E\u0631\u0648\u0698\u0647" };
    return { calls: [], summary: "\u0627\u06CC\u0646 \u062F\u0633\u062A\u0648\u0631 \u0631\u0627 \u062F\u0631 \u062D\u0627\u0644\u062A \u0622\u0641\u0644\u0627\u06CC\u0646 \u0645\u062A\u0648\u062C\u0647 \u0646\u0634\u062F\u0645. \u0628\u0631\u0627\u06CC \u062F\u0633\u062A\u0648\u0631\u0647\u0627\u06CC \u0622\u0632\u0627\u062F\u062A\u0631 \u06A9\u0644\u06CC\u062F AvalAI \u0631\u0627 \u0648\u0627\u0631\u062F \u06A9\u0646\u06CC\u062F." };
  }
  return { calls: planNew(t), summary: "\u0633\u0627\u062E\u062A \u067E\u0631\u0648\u0698\u0647 \u062C\u062F\u06CC\u062F" };
}

// ../../packages/ai-agent/src/agent.ts
var SYSTEM_PROMPT = `\u062A\u0648 \u062F\u0633\u062A\u06CC\u0627\u0631 \u0633\u0627\u062E\u062A \u0645\u0648\u0634\u0646\u200C\u06AF\u0631\u0627\u0641\u06CC\u06A9 \u062F\u0631 \u0646\u0631\u0645\u200C\u0627\u0641\u0632\u0627\u0631 AI Motion Studio \u0647\u0633\u062A\u06CC.
\u06A9\u0627\u0631\u0628\u0631 \u0641\u0627\u0631\u0633\u06CC \u0645\u06CC\u200C\u0646\u0648\u06CC\u0633\u062F. \u062A\u0648 \u0641\u0642\u0637 \u0627\u0632 \u0637\u0631\u06CC\u0642 \u0627\u0628\u0632\u0627\u0631\u0647\u0627 \u067E\u0631\u0648\u0698\u0647 \u0631\u0627 \u0645\u06CC\u200C\u0633\u0627\u0632\u06CC \u06CC\u0627 \u0648\u06CC\u0631\u0627\u06CC\u0634 \u0645\u06CC\u200C\u06A9\u0646\u06CC \u0648 \u0647\u0631\u06AF\u0632 \u06A9\u062F \u0627\u062C\u0631\u0627 \u0646\u0645\u06CC\u200C\u06A9\u0646\u06CC.

\u0642\u0648\u0627\u0639\u062F:
- \u067E\u0631\u0648\u0698\u0647 \u062C\u062F\u06CC\u062F: createProject\u060C \u0628\u0639\u062F addPaperCutScene \u0628\u0631\u0627\u06CC \u067E\u0633\u200C\u0632\u0645\u06CC\u0646\u0647 \u06A9\u0627\u0645\u0644 (\u0627\u0632 \u062B\u0627\u0646\u06CC\u0647 \u06F0 \u062A\u0627 \u0627\u0646\u062A\u0647\u0627)\u060C \u0628\u0639\u062F \u062F\u0631 \u0635\u0648\u0631\u062A \u0646\u06CC\u0627\u0632 animateLogo\u060C \u0628\u0639\u062F addAnimatedText\u060C \u0648 \u062F\u0631 \u0622\u062E\u0631 exportVideo.
- \u067E\u0633\u200C\u0632\u0645\u06CC\u0646\u0647 \u06A9\u0627\u063A\u0630\u06CC \u0628\u0627\u06CC\u062F \u06A9\u0644 \u0645\u062F\u062A \u067E\u0631\u0648\u0698\u0647 \u0631\u0627 \u0628\u067E\u0648\u0634\u0627\u0646\u062F\u061B \u0644\u0648\u06AF\u0648 \u0648 \u0645\u062A\u0646 \u0631\u0648\u06CC \u0622\u0646 \u0645\u06CC\u200C\u0622\u06CC\u0646\u062F.
- \u0644\u0648\u06AF\u0648 \u0648 \u0645\u062A\u0646 \u0646\u0628\u0627\u06CC\u062F \u0628\u06CC\u0634 \u0627\u0632 \u06F0.\u06F5 \u062B\u0627\u0646\u06CC\u0647 \u0647\u0645\u200C\u067E\u0648\u0634\u0627\u0646\u06CC \u062F\u0627\u0634\u062A\u0647 \u0628\u0627\u0634\u0646\u062F.
- \u0648\u06CC\u0631\u0627\u06CC\u0634: \u0641\u0642\u0637 \u0627\u0628\u0632\u0627\u0631 \u0645\u0631\u0628\u0648\u0637 \u0628\u0647 \u0647\u0645\u0627\u0646 \u0628\u062E\u0634 \u0631\u0627 \u0635\u062F\u0627 \u0628\u0632\u0646 (\u0645\u062B\u0644\u0627\u064B \u0628\u0631\u0627\u06CC \u0631\u0646\u06AF \u0641\u0642\u0637 setPalette). \u06A9\u0644 \u067E\u0631\u0648\u0698\u0647 \u0631\u0627 \u0627\u0632 \u0646\u0648 \u0646\u0633\u0627\u0632.
- \u0645\u062A\u0646 \u0641\u0627\u0631\u0633\u06CC \u06A9\u0627\u0631\u0628\u0631 \u0631\u0627 \u062F\u0642\u06CC\u0642\u0627\u064B \u0647\u0645\u0627\u0646\u200C\u0637\u0648\u0631 \u06A9\u0647 \u0646\u0648\u0634\u062A\u0647 \u0627\u0633\u062A\u0641\u0627\u062F\u0647 \u06A9\u0646.
- \u0632\u0645\u0627\u0646\u200C\u0647\u0627 \u0631\u0627 \u0628\u0647 \u062B\u0627\u0646\u06CC\u0647 \u0628\u062F\u0647. \u067E\u0627\u0644\u062A\u200C\u0647\u0627\u06CC \u0645\u0648\u062C\u0648\u062F: ${Object.keys(PALETTES).join("\u060C ")}.
- \u0627\u06AF\u0631 \u0627\u0628\u0632\u0627\u0631\u06CC \u062E\u0637\u0627 \u062F\u0627\u062F\u060C \u0639\u0644\u062A \u0631\u0627 \u0628\u062E\u0648\u0627\u0646 \u0648 \u0627\u0635\u0644\u0627\u062D \u06A9\u0646.
- \u062F\u0631 \u067E\u0627\u06CC\u0627\u0646 \u06CC\u06A9 \u062C\u0645\u0644\u0647 \u06A9\u0648\u062A\u0627\u0647 \u0641\u0627\u0631\u0633\u06CC \u062F\u0631\u0628\u0627\u0631\u0647 \u06A9\u0627\u0631\u06CC \u06A9\u0647 \u06A9\u0631\u062F\u06CC \u0628\u0646\u0648\u06CC\u0633.`;
function describeProject(p) {
  if (!p) return "\u0647\u0646\u0648\u0632 \u067E\u0631\u0648\u0698\u0647\u200C\u0627\u06CC \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F.";
  return `\u067E\u0631\u0648\u0698\u0647 \u0641\u0639\u0644\u06CC (JSON):
${JSON.stringify(p)}`;
}
var AgentSession = class {
  constructor(opts = {}, initial) {
    this.opts = opts;
    if (initial) this.state.project = initial;
  }
  state = { project: null, draft: null };
  undoStack = [];
  redoStack = [];
  history = [];
  get project() {
    return this.state.project;
  }
  setClient(client) {
    this.opts.client = client;
  }
  load(project) {
    this.pushUndo();
    this.state = { project, draft: null };
  }
  undo() {
    if (!this.undoStack.length) return this.state.project;
    this.redoStack.push(this.state.project);
    this.state = { project: this.undoStack.pop(), draft: null };
    return this.state.project;
  }
  redo() {
    if (!this.redoStack.length) return this.state.project;
    this.undoStack.push(this.state.project);
    this.state = { project: this.redoStack.pop(), draft: null };
    return this.state.project;
  }
  get canUndo() {
    return this.undoStack.length > 0;
  }
  get canRedo() {
    return this.redoStack.length > 0;
  }
  pushUndo() {
    this.undoStack.push(this.state.project);
    if (this.undoStack.length > 100) this.undoStack.shift();
    this.redoStack = [];
  }
  async send(userText) {
    const before = this.state.project;
    const result = this.opts.client ? await this.runLLM(userText) : this.runOffline(userText);
    if (result.project !== before) {
      this.undoStack.push(before);
      this.redoStack = [];
    }
    return result;
  }
  apply(call, steps) {
    const r = executeTool(this.state, call);
    const step = { tool: call.name, args: call.args, ok: r.ok, message: r.ok ? r.message : r.error };
    steps.push(step);
    this.opts.onStep?.(step);
    return r;
  }
  runOffline(text) {
    const plan = planOffline(text, this.state.project);
    const steps = [];
    let exportRequested = null;
    for (const call of plan.calls) {
      const r = this.apply(call, steps);
      if (r.ok && r.exportRequested) exportRequested = r.exportRequested;
    }
    const failed = steps.filter((s) => !s.ok);
    const reply = plan.calls.length === 0 ? plan.summary : failed.length ? `\u0628\u062E\u0634\u06CC \u0627\u0632 \u062F\u0633\u062A\u0648\u0631 \u0627\u062C\u0631\u0627 \u0646\u0634\u062F: ${failed.map((f) => f.message).join(" | ")}` : `${plan.summary} \u0627\u0646\u062C\u0627\u0645 \u0634\u062F (${steps.length} \u0645\u0631\u062D\u0644\u0647\u060C \u062D\u0627\u0644\u062A \u0622\u0641\u0644\u0627\u06CC\u0646).`;
    return { project: this.state.project, steps, reply, exportRequested, mode: "offline" };
  }
  async runLLM(text) {
    const client = this.opts.client;
    const steps = [];
    let exportRequested = null;
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...this.history.slice(-8),
      { role: "user", content: `${describeProject(this.state.project)}

\u062F\u0633\u062A\u0648\u0631 \u06A9\u0627\u0631\u0628\u0631: ${text}` }
    ];
    let reply = "";
    const maxSteps = this.opts.maxSteps ?? 10;
    for (let i = 0; i < maxSteps; i++) {
      const res = await client.chat({ messages, tools: TOOL_DEFINITIONS, model: this.opts.model });
      messages.push(res.message);
      const calls = res.message.tool_calls ?? [];
      if (!calls.length) {
        reply = res.message.content ?? "";
        break;
      }
      for (const tc of calls) {
        let args = {};
        let result;
        try {
          args = JSON.parse(tc.function.arguments || "{}");
          const r = this.apply({ name: tc.function.name, args }, steps);
          if (r.ok && r.exportRequested) exportRequested = r.exportRequested;
          result = r.ok ? `OK: ${r.message}` : `ERROR: ${r.error}`;
        } catch (e) {
          result = `ERROR: \u0622\u0631\u06AF\u0648\u0645\u0627\u0646\u200C\u0647\u0627\u06CC JSON \u0646\u0627\u0645\u0639\u062A\u0628\u0631 (${e.message})`;
        }
        messages.push({ role: "tool", tool_call_id: tc.id, content: result });
      }
    }
    this.history.push({ role: "user", content: text }, { role: "assistant", content: reply || "\u0627\u0646\u062C\u0627\u0645 \u0634\u062F." });
    return {
      project: this.state.project,
      steps,
      reply: reply || "\u0627\u0646\u062C\u0627\u0645 \u0634\u062F.",
      exportRequested,
      mode: "llm"
    };
  }
};

// ../../packages/avalai-client/src/index.ts
var AVALAI_BASE_URL = "https://api.avalai.ir/v1";
var DEFAULT_MODEL = "gpt-4.1-mini";
var AvalAIError = class extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = "AvalAIError";
  }
};
var AvalAIClient = class {
  constructor(opts) {
    this.opts = opts;
    if (!opts.apiKey) throw new AvalAIError("\u06A9\u0644\u06CC\u062F API \u0628\u0631\u0627\u06CC AvalAI \u062A\u0646\u0638\u06CC\u0645 \u0646\u0634\u062F\u0647 \u0627\u0633\u062A");
    this.baseUrl = (opts.baseUrl ?? AVALAI_BASE_URL).replace(/\/$/, "");
    this.model = opts.model ?? DEFAULT_MODEL;
    this.timeoutMs = opts.timeoutMs ?? 6e4;
    this.maxRetries = opts.maxRetries ?? 2;
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }
  baseUrl;
  model;
  timeoutMs;
  maxRetries;
  fetchImpl;
  async chat(req) {
    const body = JSON.stringify({
      model: req.model ?? this.model,
      messages: req.messages.map(({ providerRaw: _raw, ...m }) => m),
      tools: req.tools?.length ? req.tools : void 0,
      tool_choice: req.tools?.length ? "auto" : void 0,
      temperature: req.temperature ?? 0.3
    });
    let lastErr;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), this.timeoutMs);
      req.signal?.addEventListener("abort", () => ctrl.abort());
      try {
        const res = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.opts.apiKey}`
          },
          body,
          signal: ctrl.signal
        });
        const text = await res.text();
        if (!res.ok) {
          const err = new AvalAIError(describeStatus(res.status), res.status, text);
          if (res.status === 429 || res.status >= 500) {
            lastErr = err;
            await sleep(500 * 2 ** attempt);
            continue;
          }
          throw err;
        }
        const json = JSON.parse(text);
        const choice = json.choices?.[0];
        if (!choice?.message) throw new AvalAIError("\u067E\u0627\u0633\u062E \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0632 AvalAI", res.status, text);
        return { message: choice.message, finishReason: choice.finish_reason, usage: json.usage };
      } catch (e) {
        if (e instanceof AvalAIError) throw e;
        lastErr = e;
        if (req.signal?.aborted) throw new AvalAIError("\u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0644\u063A\u0648 \u0634\u062F");
        await sleep(500 * 2 ** attempt);
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr instanceof Error ? new AvalAIError(`\u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 AvalAI \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F: ${lastErr.message}`) : new AvalAIError("\u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 AvalAI \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F");
  }
};
function describeStatus(status) {
  if (status === 401) return "\u06A9\u0644\u06CC\u062F API \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A (401)";
  if (status === 402) return "\u0627\u0639\u062A\u0628\u0627\u0631 \u062D\u0633\u0627\u0628 AvalAI \u06A9\u0627\u0641\u06CC \u0646\u06CC\u0633\u062A (402)";
  if (status === 429) return "\u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A AvalAI (429)";
  return `\u062E\u0637\u0627\u06CC AvalAI \u0628\u0627 \u06A9\u062F ${status}`;
}
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ../../packages/claude-client/src/index.ts
import Anthropic from "@anthropic-ai/sdk";
var DEFAULT_CLAUDE_MODEL = "claude-opus-5-5";
var ClaudeError = class extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
    this.name = "ClaudeError";
  }
};
function toAnthropic(messages) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content ?? "").join("\n\n");
  const out = [];
  for (const m of messages) {
    if (m.role === "system") continue;
    if (m.role === "user") {
      out.push({ role: "user", content: m.content ?? "" });
    } else if (m.role === "assistant") {
      if (m.providerRaw) {
        out.push({ role: "assistant", content: m.providerRaw });
      } else {
        const content = [];
        if (m.content) content.push({ type: "text", text: m.content });
        for (const tc of m.tool_calls ?? []) {
          content.push({ type: "tool_use", id: tc.id, name: tc.function.name, input: safeJson(tc.function.arguments) });
        }
        out.push({ role: "assistant", content: content.length ? content : "..." });
      }
    } else if (m.role === "tool") {
      const block = {
        type: "tool_result",
        tool_use_id: m.tool_call_id,
        content: m.content ?? "",
        ...m.content?.startsWith("ERROR") ? { is_error: true } : {}
      };
      const last = out[out.length - 1];
      if (last?.role === "user" && Array.isArray(last.content) && last.content.every((b) => b.type === "tool_result")) {
        last.content.push(block);
      } else {
        out.push({ role: "user", content: [block] });
      }
    }
  }
  return { system, messages: out };
}
function safeJson(s) {
  try {
    return JSON.parse(s || "{}");
  } catch {
    return {};
  }
}
var ClaudeClient = class {
  constructor(opts = {}) {
    this.opts = opts;
    this.client = new Anthropic(opts.apiKey ? { apiKey: opts.apiKey } : {});
    this.model = opts.model ?? DEFAULT_CLAUDE_MODEL;
  }
  client;
  model;
  async chat(req) {
    const { system, messages } = toAnthropic(req.messages);
    const tools = (req.tools ?? []).map((t) => ({
      name: t.function.name,
      description: t.function.description,
      input_schema: t.function.parameters
    }));
    try {
      const response = await this.client.beta.messages.create(
        {
          model: req.model ?? this.model,
          max_tokens: this.opts.maxTokens ?? 16e3,
          system,
          messages,
          tools: tools.length ? tools : void 0,
          output_config: { effort: this.opts.effort ?? "medium" },
          // اگر درخواستی به‌اشتباه رد شود، سرور خودش با مدل جایگزین ادامه می‌دهد
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default"
        },
        { signal: req.signal }
      );
      if (response.stop_reason === "refusal") {
        throw new ClaudeError("Claude \u0627\u06CC\u0646 \u062F\u0631\u062E\u0648\u0627\u0633\u062A \u0631\u0627 \u0631\u062F \u06A9\u0631\u062F. \u062F\u0633\u062A\u0648\u0631 \u0631\u0627 \u0628\u0647 \u0634\u06A9\u0644 \u062F\u06CC\u06AF\u0631\u06CC \u0628\u0646\u0648\u06CC\u0633\u06CC\u062F.");
      }
      const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("\n");
      const toolCalls = response.content.filter((b) => b.type === "tool_use").map((b) => ({ id: b.id, type: "function", function: { name: b.name, arguments: JSON.stringify(b.input) } }));
      return {
        message: {
          role: "assistant",
          content: text || null,
          tool_calls: toolCalls.length ? toolCalls : void 0,
          providerRaw: response.content
        },
        finishReason: response.stop_reason ?? "end_turn",
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens
        }
      };
    } catch (e) {
      if (e instanceof ClaudeError) throw e;
      if (e instanceof Anthropic.AuthenticationError) throw new ClaudeError("\u06A9\u0644\u06CC\u062F API \u0628\u0631\u0627\u06CC Claude \u0646\u0627\u0645\u0639\u062A\u0628\u0631 \u0627\u0633\u062A", 401);
      if (e instanceof Anthropic.RateLimitError) throw new ClaudeError("\u0645\u062D\u062F\u0648\u062F\u06CC\u062A \u062A\u0639\u062F\u0627\u062F \u062F\u0631\u062E\u0648\u0627\u0633\u062A Claude\u061B \u06A9\u0645\u06CC \u0628\u0639\u062F \u062F\u0648\u0628\u0627\u0631\u0647 \u0627\u0645\u062A\u062D\u0627\u0646 \u06A9\u0646\u06CC\u062F", 429);
      if (e instanceof Anthropic.APIConnectionError) throw new ClaudeError("\u0627\u0631\u062A\u0628\u0627\u0637 \u0628\u0627 Claude \u0628\u0631\u0642\u0631\u0627\u0631 \u0646\u0634\u062F (\u0627\u06CC\u0646\u062A\u0631\u0646\u062A \u0631\u0627 \u0628\u0631\u0631\u0633\u06CC \u06A9\u0646\u06CC\u062F)");
      if (e instanceof Anthropic.APIError) throw new ClaudeError(`\u062E\u0637\u0627\u06CC Claude \u0628\u0627 \u06A9\u062F ${e.status}: ${e.message}`, e.status);
      throw e;
    }
  }
};

// ../../packages/ai-agent/src/providers.ts
function createChatClient(cfg) {
  switch (cfg.provider) {
    case "claude":
      return new ClaudeClient({ apiKey: cfg.apiKey, model: cfg.model });
    case "avalai":
      if (!cfg.apiKey) return null;
      return new AvalAIClient({ apiKey: cfg.apiKey, model: cfg.model, baseUrl: cfg.baseUrl });
    default:
      return null;
  }
}

// electron/main.ts
init_src();
var here = path2.dirname(fileURLToPath2(import.meta.url));
var repoRoot = path2.resolve(here, "../../..");
process.env.AMS_ENTRY_POINT ??= path2.join(repoRoot, "packages/animation-engine/src/entry.ts");
var win = null;
var currentFile = null;
var settingsPath = () => path2.join(app.getPath("userData"), "settings.json");
function readSettings() {
  try {
    return JSON.parse(fs2.readFileSync(settingsPath(), "utf8"));
  } catch {
    return { provider: "claude", encryptedKeys: {} };
  }
}
function writeSettings(s) {
  fs2.mkdirSync(path2.dirname(settingsPath()), { recursive: true });
  fs2.writeFileSync(settingsPath(), JSON.stringify(s, null, 2));
}
function decryptKey(s, p) {
  const enc = s.encryptedKeys[p];
  if (!enc || !safeStorage.isEncryptionAvailable()) return void 0;
  try {
    return safeStorage.decryptString(Buffer.from(enc, "base64"));
  } catch {
    return void 0;
  }
}
function providerConfig() {
  const s = readSettings();
  const apiKey = decryptKey(s, s.provider) ?? (s.provider === "claude" ? process.env.ANTHROPIC_API_KEY : process.env.AVALAI_API_KEY);
  if (s.provider !== "offline" && !apiKey) return { provider: "offline" };
  return { provider: s.provider, apiKey, model: s.model };
}
var session = new AgentSession({ client: createChatClient(providerConfig()) });
function snapshot() {
  return { project: session.project, canUndo: session.canUndo, canRedo: session.canRedo, file: currentFile };
}
ipcMain.handle("agent:send", async (_e, text) => {
  session.setClient(createChatClient(providerConfig()));
  try {
    const r = await session.send(text);
    return { ok: true, reply: r.reply, steps: r.steps, mode: r.mode, exportRequested: r.exportRequested, ...snapshot() };
  } catch (e) {
    return { ok: false, reply: e.message, steps: [], ...snapshot() };
  }
});
ipcMain.handle("agent:undo", () => (session.undo(), snapshot()));
ipcMain.handle("agent:redo", () => (session.redo(), snapshot()));
ipcMain.handle("agent:state", () => snapshot());
ipcMain.handle("settings:get", () => {
  const s = readSettings();
  return {
    provider: s.provider,
    model: s.model ?? "",
    hasKey: { claude: !!s.encryptedKeys.claude || !!process.env.ANTHROPIC_API_KEY, avalai: !!s.encryptedKeys.avalai },
    secureStorage: safeStorage.isEncryptionAvailable(),
    active: providerConfig().provider
  };
});
ipcMain.handle("settings:set", (_e, patch) => {
  const s = readSettings();
  if (patch.provider) s.provider = patch.provider;
  if (patch.model !== void 0) s.model = patch.model || void 0;
  if (patch.apiKey && s.provider !== "offline") {
    if (!safeStorage.isEncryptionAvailable()) throw new Error("\u0641\u0636\u0627\u06CC \u0627\u0645\u0646 \u0633\u06CC\u0633\u062A\u0645\u200C\u0639\u0627\u0645\u0644 \u062F\u0631 \u062F\u0633\u062A\u0631\u0633 \u0646\u06CC\u0633\u062A\u061B \u06A9\u0644\u06CC\u062F \u0630\u062E\u06CC\u0631\u0647 \u0646\u0634\u062F");
    s.encryptedKeys[s.provider] = safeStorage.encryptString(patch.apiKey).toString("base64");
  }
  writeSettings(s);
  return true;
});
ipcMain.handle("project:save", async (_e, saveAs) => {
  if (!session.project) return snapshot();
  if (!currentFile || saveAs) {
    const r = await dialog.showSaveDialog(win, { defaultPath: `${session.project.project}.amsproj.json`, filters: [{ name: "AI Motion Studio", extensions: ["json"] }] });
    if (r.canceled || !r.filePath) return snapshot();
    currentFile = r.filePath;
  }
  fs2.writeFileSync(currentFile, JSON.stringify(session.project, null, 2));
  return snapshot();
});
ipcMain.handle("project:open", async () => {
  const r = await dialog.showOpenDialog(win, { filters: [{ name: "AI Motion Studio", extensions: ["json"] }], properties: ["openFile"] });
  if (r.canceled || !r.filePaths[0]) return snapshot();
  const v = validateProject(JSON.parse(fs2.readFileSync(r.filePaths[0], "utf8")));
  if (!v.ok) throw new Error(`\u0641\u0627\u06CC\u0644 \u067E\u0631\u0648\u0698\u0647 \u0645\u0639\u062A\u0628\u0631 \u0646\u06CC\u0633\u062A:
${v.errors.join("\n")}`);
  session.load(v.project);
  currentFile = r.filePaths[0];
  return snapshot();
});
var rendering = false;
ipcMain.handle("render:start", async (e) => {
  const project = session.project;
  if (!project) throw new Error("\u067E\u0631\u0648\u0698\u0647\u200C\u0627\u06CC \u0628\u0631\u0627\u06CC \u0631\u0646\u062F\u0631 \u0648\u062C\u0648\u062F \u0646\u062F\u0627\u0631\u062F");
  if (rendering) throw new Error("\u06CC\u06A9 \u0631\u0646\u062F\u0631 \u062F\u0631 \u062D\u0627\u0644 \u0627\u062C\u0631\u0627\u0633\u062A");
  const r = process.env.AMS_AUTO_OUTPUT ? { canceled: false, filePath: process.env.AMS_AUTO_OUTPUT } : await dialog.showSaveDialog(win, { defaultPath: `${project.project}.mp4`, filters: [{ name: "MP4", extensions: ["mp4"] }] });
  if (r.canceled || !r.filePath) return null;
  rendering = true;
  try {
    const { renderProject: renderProject2 } = await Promise.resolve().then(() => (init_src2(), src_exports));
    await renderProject2(project, {
      outputPath: r.filePath,
      onProgress: (p) => e.sender.send("render:progress", p)
    });
    return r.filePath;
  } finally {
    rendering = false;
  }
});
ipcMain.handle("shell:show", (_e, p) => shell.showItemInFolder(p));
function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    backgroundColor: "#11151c",
    title: "AI Motion Studio",
    webPreferences: {
      preload: path2.join(here, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) win.loadURL(devUrl);
  else win.loadFile(path2.join(here, "../dist/index.html"));
}
app.whenReady().then(createWindow);
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
