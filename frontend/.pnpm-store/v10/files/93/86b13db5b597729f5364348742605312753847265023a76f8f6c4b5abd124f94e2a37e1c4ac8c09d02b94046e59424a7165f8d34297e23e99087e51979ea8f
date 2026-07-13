'use strict';

var MagicString = require('magic-string');
var oxcParser = require('oxc-parser');
var addImport = require('./add-import.cjs');

function isIdentifier(node) {
  return node.type === "Identifier";
}
function isMemberExpression(node) {
  return node.type === "MemberExpression";
}
function isObjectExpression(node) {
  return node.type === "ObjectExpression";
}
function isArrayExpression(node) {
  return node.type === "ArrayExpression";
}
function updateBuildConfig({
  content,
  pluginName,
  pluginImportPath
}) {
  const result = oxcParser.parseSync("config.ts", content);
  if (result.errors.length > 0) {
    return content;
  }
  let pluginsArrayInfo = null;
  let buildOptionsInfo = null;
  const visitor = new oxcParser.Visitor({
    CallExpression(node) {
      const { callee } = node;
      let isBuildCall = false;
      if (isIdentifier(callee) && callee.name === "build") {
        isBuildCall = true;
      } else if (isMemberExpression(callee) && isIdentifier(callee.object) && callee.object.name === "Bun" && callee.property.name === "build") {
        isBuildCall = true;
      }
      if (!isBuildCall || node.arguments.length === 0) return;
      const firstArg = node.arguments[0];
      if (!isObjectExpression(firstArg)) return;
      const properties = firstArg.properties;
      buildOptionsInfo = {
        objectStart: firstArg.start,
        objectEnd: firstArg.end,
        hasProperties: properties.length > 0
      };
      if (properties.length > 0) {
        const lastProp = properties[properties.length - 1];
        buildOptionsInfo.lastPropertyEnd = lastProp.end;
      }
      for (const prop of properties) {
        if (prop.type === "SpreadElement") continue;
        let isPluginsKey = false;
        if (prop.key.type === "Identifier" && prop.key.name === "plugins") {
          isPluginsKey = true;
        } else if (prop.key.type === "Literal" && prop.key.value === "plugins") {
          isPluginsKey = true;
        }
        if (!isPluginsKey) continue;
        const propValue = prop.value;
        if (isArrayExpression(propValue)) {
          const elements = propValue.elements;
          const pluginExists = elements.some((el) => el !== null && el.type === "Identifier" && el.name === pluginName);
          let lastElementEnd;
          if (elements.length > 0) {
            const lastElement = elements[elements.length - 1];
            if (lastElement) {
              lastElementEnd = lastElement.end;
            }
          }
          pluginsArrayInfo = {
            arrayStart: propValue.start,
            arrayEnd: propValue.end,
            hasElements: elements.length > 0,
            lastElementEnd,
            pluginExists
          };
        }
        break;
      }
    }
  });
  visitor.visit(result.program);
  const finalBuildOptions = buildOptionsInfo;
  const finalPluginsArray = pluginsArrayInfo;
  if (!finalBuildOptions) {
    return addImport.addImport({
      content,
      importName: pluginName,
      importPath: pluginImportPath
    });
  }
  const s = new MagicString(content);
  if (finalPluginsArray) {
    if (!finalPluginsArray.pluginExists) {
      if (finalPluginsArray.hasElements && finalPluginsArray.lastElementEnd) {
        s.appendLeft(finalPluginsArray.lastElementEnd, `, ${pluginName}`);
      } else {
        s.appendLeft(finalPluginsArray.arrayStart + 1, pluginName);
      }
    }
  } else {
    if (finalBuildOptions.hasProperties && finalBuildOptions.lastPropertyEnd) {
      s.appendLeft(finalBuildOptions.lastPropertyEnd, `,
        plugins: [${pluginName}]`);
    } else {
      s.appendLeft(finalBuildOptions.objectStart + 1, ` plugins: [${pluginName}] `);
    }
  }
  let modifiedCode = s.toString();
  modifiedCode = addImport.addImport({
    content: modifiedCode,
    importName: pluginName,
    importPath: pluginImportPath
  });
  return modifiedCode;
}

exports.updateBuildConfig = updateBuildConfig;
//# sourceMappingURL=update-build-config.cjs.map
