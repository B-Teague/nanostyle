var sheet = document.head.appendChild(document.createElement("style")).sheet
var cache = {};

//Perfect 32bit hash function for css class names
var m = new Uint32Array(1); //for hash function
var seed = 1;
function hash() {
  m[0] = seed++;
  m[0] = (m[0] ^ m[0] >> 16) * 0x7feb352d
  m[0] = (m[0] ^ m[0] >> 16) * 0x846ca68b
  m[0] ^= m[0] >> 16;
  return m[0].toString(36);
}

export default function (options) {
  options = options || {}
  var _prefix = options.prefix || "morpho";
  var _unit = options.unit || "px";
  var cssProps = {}
  for (let prop in options.cssProps) {
    cssProps[hyphenate(prop)] = options.cssProps[prop]
  }

  return { css, keyframes }

  function css(decls, prefix) {
    return fromCache(serialize(decls, "&"), ".", prefix || _prefix)
  }

  function keyframes(decls, prefix) {
    return fromCache([wrap(serialize(decls, "").join(""), "& ")], "@keyframes ", prefix || _prefix)
  }

  function isArr(v) { return !!v && v.constructor === Array }
  function isObj(v) { return !!v && v.constructor === Object }

  function hyphenate(str) {
    return str.replace(/[A-Z]/g, "-$&").toLowerCase()
  }

  //cssType is "@keyframes " or "."
  function createStyle(rules, cssType, prefix) {
    var id = prefix + "-" + hash();
    var name = cssType + id
    for (var i = 0; i < rules.length; i++) {
      sheet.insertRule(rules[i].replace(/&/g, name), sheet.cssRules.lenth)
    }
    return id
  }

  function wrap(str, prop) {
    return prop + "{" + str + "}"
  }

  function serialize(obj, parent) {
    var rules = []
    var css = ""
    for (var prop in obj) {
      var value = obj[prop]

      if (/^@/.test(prop)) { //nested @-rule objects only.  Doesn't support global @ rules
        rules.push(wrap(serialize(value, parent).join(""), prop))
      } else {
        if (isObj(value)) {
          rules = rules.concat(serialize(value, parent === "&" && prop.includes("&") ? prop : parent + " " + prop))
        } else {
          var { vendor, unit } = Object.assign({ vendor: [], unit: _unit }, cssProps[hyphenate(prop)])
          value = isArr(value) ? isArr(value[0]) ? value : [value] : [[value]]
          css += value.reduce(function (propRepeat, value) {
            value = value.map(function (val) { return typeof val === "number" ? val + unit : val }).join(" ");
            return propRepeat + vendor.concat("").reduce(function (result, prefix) {
              return result + prefix + hyphenate(prop) + ":" + value + ";" //Vendor prefixing
            }, "")
          }, "")
        }
      }
    }

    //Add all normal css properties as a new rule
    if (css) { rules.push(wrap(css, parent)) }

    return rules
  }

  function fromCache(rules, cssType, prefix) {
    var key = prefix + rules.join("")
    return cache[key] || (cache[key] = createStyle(rules, cssType, prefix))
  }

  function styled(nodeName, decls, prefix) {
    return function (props, context) {
      props = props || {}
      props[cache.classProp] = [props[cache.classProp], css(isFunc(decls) ? decls(props) : decls, prefix)]
        .filter(Boolean).join(" ")
      return isFunc(nodeName) ? nodeName(props, context) : h(nodeName, props, options.childParam ? context : props.children || [])
    }
  }

  function isArr(v) { return !!v && v.constructor === Array }
  function isObj(v) { return !!v && v.constructor === Object }
  function isFunc(v) { return !!v && v.constructor === Function }

  //This hash function may cause collision with future css property names
  //This library requires a perfect hash function for vendor prefixing to work correctly.
  //This file will fail to generate from createCssPropMap.js if a collision is detected.
  function hashCssProp(prop) {
    n[0] = 0;
    for (var i = 0; i < prop.length; i++) {
      n[0] = ((n[0] << 4) - n[0]) + prop.charCodeAt(i);
    }
    return n[0].toString(36);
  }

  //Perfect 32bit hash function for generating unique css class names
  function hash() {
    m[0] = seed++;
    m[0] = (m[0] ^ m[0] >> 16) * 0x7feb352d
    m[0] = (m[0] ^ m[0] >> 16) * 0x846ca68b
    m[0] ^= m[0] >> 16;
    return m[0].toString(36);
  }

  function hyphenate(str) {
    return str.replace(/[A-Z]/g, "-$&").toLowerCase()
  }

  //cssType is "@keyframes " or "."
  function createStyle(rules, cssType, prefix) {
    var id = prefix + "-" + hash();
    var name = cssType + id
    for (var i = 0; i < rules.length; i++) {
      sheet.insertRule(rules[i].replace(/&/g, name), sheet.cssRules.lenth)
    }
    return id
  }

  function wrap(str, prop) {
    return prop + "{" + str + "}"
  }

  function serialize(obj, parent) {
    var rules = []
    var css = ""
    for (var prop in obj) {
      var value = obj[prop]

      if (/^@/.test(prop)) { //nested @-rule objects only.  Doesn't support global @ rules
        rules.push(wrap(serialize(value, parent).join(""), prop))
      } else {
        if (isObj(value)) {
          rules = rules.concat(serialize(value, parent === "&" && prop.includes("&") ? prop : parent + " " + prop))
        } else {
          prop = hyphenate(prop)
          var hashed = hashCssProp(prop)
          var { vendor, unit } = Object.assign({ vendor: [], unit: cache.unit }, cssProps[hashed])
          value = isArr(value) ? isArr(value[0]) ? value : [value] : [[value]]
          css += value.reduce(function (propRepeat, value) {
            value = value.map(function (val) { return typeof val === "number" ? val + unit : val }).join(" ");
            return propRepeat + vendor.concat("").reduce(function (result, prefix) {
              return result + prefix + prop + ":" + value + ";" //Vendor prefixing
            }, "")
          }, "")
        }
      }
    }

    //Add all normal css properties as a new rule
    if (css) { rules.push(wrap(css, parent)) }

    return rules
  }

  function fromCache(rules, cssType, prefix) {
    var key = prefix + rules.join("")
    return cache[key] || (cache[key] = createStyle(rules, cssType, prefix))
  }
}
