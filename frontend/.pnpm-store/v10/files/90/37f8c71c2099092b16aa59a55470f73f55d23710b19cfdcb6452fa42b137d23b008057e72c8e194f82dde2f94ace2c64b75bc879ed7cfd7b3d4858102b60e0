import MagicString from 'magic-string';
import { parseSync, Visitor } from 'oxc-parser';

const builders = {
  stringLiteral: (value) => JSON.stringify(value),
  identifier: (name) => name,
  callExpression: (callee, args) => args.length > 0 ? `${callee}(${args.join(", ")})` : `${callee}()`
};
function addToConfig({
  content,
  targetPath,
  valueGenerator
}) {
  const parseResult = parseSync("config.ts", content);
  if (parseResult.errors.length > 0) {
    return content;
  }
  const valueToAdd = valueGenerator(builders);
  const pathParts = targetPath.split(".");
  const configObjects = /* @__PURE__ */ new Map();
  let targetObjectStart = null;
  let targetObjectEnd = null;
  const collectVisitor = new Visitor({
    VariableDeclarator(node) {
      if (node.id?.type !== "Identifier" || !node.init) return;
      const varName = node.id.name;
      if (node.init.type === "ObjectExpression") {
        configObjects.set(varName, { start: node.init.start, end: node.init.end });
      } else if (node.init.type === "CallExpression" && node.init.arguments?.length > 0 && node.init.arguments[0]?.type === "ObjectExpression") {
        configObjects.set(varName, {
          start: node.init.arguments[0].start,
          end: node.init.arguments[0].end
        });
      }
    }
  });
  collectVisitor.visit(parseResult.program);
  const findExportVisitor = new Visitor({
    ExportDefaultDeclaration(node) {
      const decl = node.declaration;
      if (!decl) return;
      if (decl.type === "ObjectExpression") {
        targetObjectStart = decl.start;
        targetObjectEnd = decl.end;
      } else if (decl.type === "Identifier") {
        const obj = configObjects.get(decl.name);
        if (obj) {
          targetObjectStart = obj.start;
          targetObjectEnd = obj.end;
        }
      } else if ((decl.type === "TSAsExpression" || decl.type === "TSSatisfiesExpression") && decl.expression?.type === "ObjectExpression") {
        targetObjectStart = decl.expression.start;
        targetObjectEnd = decl.expression.end;
      } else if (decl.type === "CallExpression" && decl.arguments?.length > 0) {
        const arg = decl.arguments[0];
        if (arg?.type === "ObjectExpression") {
          targetObjectStart = arg.start;
          targetObjectEnd = arg.end;
        } else if (arg?.type === "Identifier") {
          const obj = configObjects.get(arg.name);
          if (obj) {
            targetObjectStart = obj.start;
            targetObjectEnd = obj.end;
          }
        }
      }
    },
    AssignmentExpression(node) {
      const left = node.left;
      if (left?.type === "MemberExpression" && left.object?.type === "Identifier" && left.object.name === "module" && left.property?.type === "Identifier" && left.property.name === "exports") {
        if (node.right?.type === "ObjectExpression") {
          targetObjectStart = node.right.start;
          targetObjectEnd = node.right.end;
        } else if (node.right?.type === "Identifier") {
          const obj = configObjects.get(node.right.name);
          if (obj) {
            targetObjectStart = obj.start;
            targetObjectEnd = obj.end;
          }
        } else if (node.right?.type === "CallExpression" && node.right.arguments?.length > 0 && node.right.arguments[0]?.type === "ObjectExpression") {
          targetObjectStart = node.right.arguments[0].start;
          targetObjectEnd = node.right.arguments[0].end;
        }
      }
    }
  });
  findExportVisitor.visit(parseResult.program);
  if (targetObjectStart === null || targetObjectEnd === null) {
    return content;
  }
  const result = findTargetArrayOrCreationPoint(content, targetObjectStart, targetObjectEnd, pathParts);
  const s = new MagicString(content);
  if (result.type === "found") {
    const targetArrayLocation = result.array;
    const exists = checkValueExists(targetArrayLocation, valueToAdd);
    if (exists) {
      return content;
    }
    const arrayStyle = detectArrayStyle(content, targetArrayLocation);
    if (targetArrayLocation.elements.length > 0) {
      const lastElement = targetArrayLocation.elements[targetArrayLocation.elements.length - 1];
      if (arrayStyle.isMultiLine) {
        const afterLastElement = content.slice(lastElement.end, targetArrayLocation.end);
        const hasTrailingComma = /^[\s]*,/.test(afterLastElement);
        if (hasTrailingComma) {
          const commaOffset = afterLastElement.indexOf(",") + 1;
          s.appendLeft(lastElement.end + commaOffset, `
${arrayStyle.elementIndent}${valueToAdd}`);
        } else {
          s.appendLeft(lastElement.end, `,
${arrayStyle.elementIndent}${valueToAdd}`);
        }
      } else {
        s.appendLeft(lastElement.end, `, ${valueToAdd}`);
      }
    } else {
      if (arrayStyle.isMultiLine) {
        s.appendLeft(targetArrayLocation.start + 1, `
${arrayStyle.elementIndent}${valueToAdd}
${arrayStyle.indent}`);
      } else {
        s.appendLeft(targetArrayLocation.start + 1, valueToAdd);
      }
    }
  } else if (result.type === "create") {
    const { insertPosition, propertyPath, needsComma, indent } = result.creation;
    const indentUnit = detectIndentUnit(content);
    let newContent = "";
    const lastIndex = propertyPath.length - 1;
    for (let i = 0; i < propertyPath.length; i++) {
      const key = propertyPath[i];
      const currentIndent = indent + indentUnit.repeat(i);
      if (i === lastIndex) {
        newContent += `${currentIndent}${key}: [${valueToAdd}]`;
      } else {
        newContent += `${currentIndent}${key}: {
`;
      }
    }
    for (let i = propertyPath.length - 2; i >= 0; i--) {
      const currentIndent = indent + indentUnit.repeat(i);
      newContent += `
${currentIndent}}`;
    }
    const prefix = needsComma ? ",\n" : "\n";
    s.appendLeft(insertPosition, prefix + newContent);
  } else {
    return content;
  }
  return s.toString();
}
function findTargetArrayOrCreationPoint(content, objectStart, objectEnd, pathParts) {
  const objectContent = content.slice(objectStart, objectEnd);
  const wrappedContent = `(${objectContent})`;
  const parseResult = parseSync("temp.ts", wrappedContent);
  if (parseResult.errors.length > 0) {
    return { type: "none" };
  }
  const baseOffset = objectStart - 1;
  function extractObjectInfo(node) {
    const obj = node;
    const props = [];
    for (const prop of obj.properties || []) {
      const p = prop;
      if (p.type !== "ObjectProperty" && p.type !== "Property") continue;
      let propKey;
      if (p.key.type === "Identifier") {
        propKey = p.key.name;
      } else if (p.key.type === "StringLiteral" || p.key.type === "Literal") {
        propKey = String(p.key.value);
      }
      if (propKey) {
        props.push({
          key: propKey,
          start: baseOffset + p.start,
          end: baseOffset + p.end,
          valueType: p.value.type,
          value: p.value
        });
      }
    }
    return {
      start: baseOffset + obj.start,
      end: baseOffset + obj.end,
      properties: props
    };
  }
  function processPath(objInfo, remainingPath, depth) {
    if (remainingPath.length === 0) {
      return { type: "none" };
    }
    const key = remainingPath[0];
    const prop = objInfo.properties.find((p) => p.key === key);
    if (!prop) {
      const lastProp = objInfo.properties[objInfo.properties.length - 1];
      const insertPosition = lastProp ? lastProp.end : objInfo.start + 1;
      const needsComma = objInfo.properties.length > 0;
      const beforeObj = content.slice(Math.max(0, objInfo.start - 50), objInfo.start);
      const indentMatch = beforeObj.match(/\n([ \t]*)$/);
      const indentUnit = detectIndentUnit(content);
      const baseIndent = indentMatch ? indentMatch[1] : indentUnit;
      const indent = baseIndent + indentUnit.repeat(depth);
      return {
        type: "create",
        creation: {
          insertPosition,
          propertyPath: remainingPath,
          needsComma,
          indent
        }
      };
    }
    if (remainingPath.length === 1) {
      const value2 = prop.value;
      if (value2.type === "ArrayExpression") {
        return {
          type: "found",
          array: extractArrayLocation(value2, baseOffset)
        };
      } else if (value2.type === "CallExpression") {
        const arr = extractArrayFromCallExpression(value2, baseOffset);
        if (arr) {
          return { type: "found", array: arr };
        }
      }
      return { type: "none" };
    }
    const value = prop.value;
    if (value.type !== "ObjectExpression") {
      return { type: "none" };
    }
    const nestedObjInfo = extractObjectInfo(prop.value);
    return processPath(nestedObjInfo, remainingPath.slice(1), depth + 1);
  }
  let result = { type: "none" };
  const visitor = new Visitor({
    ObjectExpression(node) {
      if (result.type === "none") {
        const objInfo = extractObjectInfo(node);
        result = processPath(objInfo, pathParts, 0);
      }
    }
  });
  visitor.visit(parseResult.program);
  return result;
}
function extractArrayLocation(node, offset) {
  const arr = node;
  const elements = [];
  for (const el of arr.elements || []) {
    if (!el) continue;
    const e = el;
    const elemInfo = {
      start: offset + e.start,
      end: offset + e.end,
      type: e.type
    };
    if (e.type === "StringLiteral" || e.type === "Literal") {
      elemInfo.value = String(e.value);
    }
    if (e.type === "Identifier") {
      elemInfo.name = e.name;
    }
    if (e.type === "CallExpression" && e.callee?.type === "Identifier") {
      elemInfo.calleeName = e.callee.name;
    }
    elements.push(elemInfo);
  }
  return {
    start: offset + arr.start,
    end: offset + arr.end,
    elements
  };
}
function extractArrayFromCallExpression(node, offset) {
  const call = node;
  if (call.callee?.type === "MemberExpression") {
    const obj = call.callee.object;
    if (obj?.type === "ArrayExpression") {
      return extractArrayLocation(obj, offset);
    }
  }
  return null;
}
function detectIndentUnit(content) {
  const lines = content.split("\n");
  const indentCounts = /* @__PURE__ */ new Map();
  for (const line of lines) {
    const match = line.match(/^(\s+)\S/);
    if (match) {
      const indent = match[1];
      if (indent === "	") {
        indentCounts.set("	", (indentCounts.get("	") || 0) + 1);
      } else if (/^ +$/.test(indent)) {
        const len = indent.length;
        if (len <= 4) {
          indentCounts.set(indent, (indentCounts.get(indent) || 0) + 1);
        }
      }
    }
  }
  let bestIndent = "  ";
  let bestCount = 0;
  for (const [indent, count] of indentCounts) {
    if (count > bestCount) {
      bestCount = count;
      bestIndent = indent;
    }
  }
  if (bestIndent === "	") {
    return "	";
  }
  const spaceCounts = Array.from(indentCounts.entries()).filter(([k]) => /^ +$/.test(k)).map(([k, v]) => ({ len: k.length, count: v }));
  if (spaceCounts.length > 0) {
    const lengths = spaceCounts.map((s) => s.len);
    const gcd = lengths.reduce((a, b) => {
      while (b) {
        [a, b] = [b, a % b];
      }
      return a;
    });
    if (gcd === 2 || gcd === 4) {
      return " ".repeat(gcd);
    }
  }
  return bestIndent;
}
function detectArrayStyle(content, arrayLocation) {
  const arrayContent = content.slice(arrayLocation.start, arrayLocation.end);
  const indentUnit = detectIndentUnit(content);
  const hasNewlines = arrayContent.includes("\n");
  if (!hasNewlines || arrayLocation.elements.length === 0) {
    return {
      isMultiLine: false,
      indent: "",
      elementIndent: ""
    };
  }
  const firstElement = arrayLocation.elements[0];
  const contentBeforeFirst = content.slice(arrayLocation.start, firstElement.start);
  const indentMatch = contentBeforeFirst.match(/\n([ \t]*)$/);
  const elementIndent = indentMatch ? indentMatch[1] : indentUnit;
  let arrayIndent = "";
  if (elementIndent.startsWith("	")) {
    arrayIndent = elementIndent.slice(0, -1);
  } else {
    const unitLen = indentUnit.length;
    if (elementIndent.length >= unitLen) {
      arrayIndent = elementIndent.slice(0, -unitLen);
    }
  }
  return {
    isMultiLine: true,
    indent: arrayIndent,
    elementIndent
  };
}
function checkValueExists(arrayLocation, valueToAdd) {
  return arrayLocation.elements.some((el) => {
    if ((el.type === "StringLiteral" || el.type === "Literal") && el.value !== void 0) {
      try {
        const parsed = JSON.parse(valueToAdd);
        return el.value === parsed;
      } catch {
        return false;
      }
    }
    if (el.type === "Identifier" && el.name) {
      return el.name === valueToAdd;
    }
    if (el.type === "CallExpression" && el.calleeName) {
      const callMatch = valueToAdd.match(/^(\w+)\(/);
      if (callMatch) {
        return el.calleeName === callMatch[1];
      }
    }
    return false;
  });
}

export { addToConfig, builders };
//# sourceMappingURL=add-to-config.js.map
