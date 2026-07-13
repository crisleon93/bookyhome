'use strict';

function removeReactImport(parseResult) {
  if (parseResult?.program?.body) {
    parseResult.program.body = parseResult.program.body.filter(
      (node) => !(typeof node === "object" && node !== null && "type" in node && node.type === "ImportDeclaration" && "source" in node && typeof node.source === "object" && node.source !== null && "value" in node.source && typeof node.source.value === "string" && node.source.value === "react" && "specifiers" in node && Array.isArray(node.specifiers) && node.specifiers[0]?.local?.name === "React")
    );
  }
  return parseResult;
}

exports.removeReactImport = removeReactImport;
//# sourceMappingURL=remove-react-import.cjs.map
