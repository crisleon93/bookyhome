/**
 * Simple builder-like interface for backward compatibility
 */
export declare const builders: {
    stringLiteral: (value: string) => string;
    identifier: (name: string) => string;
    callExpression: (callee: string, args: string[]) => string;
};
export type ValueGenerator = (b: typeof builders) => string;
/**
 * Modifies the given content by adding a value to a specified path within the content.
 */
export declare function addToConfig({ content, targetPath, valueGenerator, }: {
    content: string;
    targetPath: string;
    valueGenerator: ValueGenerator;
}): string;
