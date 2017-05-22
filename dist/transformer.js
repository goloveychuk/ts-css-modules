"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var ts = require("typescript");
var PROP_NAME = 'styleName';
function showWarning(node, msg) {
    var fname = node.getSourceFile().fileName;
    var location = node.getSourceFile().getLineAndCharacterOfPosition(node.getStart());
    var node_text = node.getText();
    console.warn("\n\nwarning: " + msg + ": " + fname + " " + location.line + ":" + location.character + ": " + node_text + "\n");
}
function patchTsLib(tsLibModule) {
    tsLibModule.__getAndCheckStyleName = function __getAndCheckStyleName(styleName) {
        if (styleName === undefined) {
            throw new Error('stylename is undefined');
        }
        if (!Array.isArray(styleName)) {
            return styleName;
        }
        for (var _i = 0, styleName_1 = styleName; _i < styleName_1.length; _i++) {
            var el = styleName_1[_i];
            if (el === undefined) {
                throw new Error('one of stylenames is undefined');
            }
        }
        return styleName.join(' ');
    };
}
exports.patchTsLib = patchTsLib;
var getAndCheckStyleName = {
    name: '__getAndCheckStyleName',
    scoped: false,
    text: "function __getAndCheckStyleName(styleName) {\n    if (styleName === undefined) {\n      throw new Error('stylename is undefined');\n    }\n    if (!Array.isArray(styleName)) {\n      return styleName\n    }\n    for (const el of styleName) {\n      if (el === undefined) {\n        throw new Error('one of stylenames is undefined');\n      }\n    }\n    return styleName.join(' ')\n  };"
};
function Transformer(context) {
    function getExp(initializer) {
        if (initializer.kind == ts.SyntaxKind.StringLiteral) {
            return initializer;
        }
        else {
            if (initializer.expression === undefined) {
                throw new Error('initializer exp is empty');
            }
            return initializer.expression;
        }
    }
    function concat(left, right) {
        return ts.createBinary(left, ts.SyntaxKind.PlusToken, right);
    }
    function getHelperName(name) {
        return ts.setEmitFlags(ts.createIdentifier(name), ts.EmitFlags.HelperName | ts.EmitFlags.AdviseOnEmitNode);
    }
    function getNewClassNameInitializer(initializer, styleNameExp) {
        context.requestEmitHelper(getAndCheckStyleName);
        var checkStyleNameExp = ts.createCall(getHelperName("__getAndCheckStyleName"), undefined, [styleNameExp]);
        var newClassNameExp;
        if (initializer === undefined) {
            newClassNameExp = checkStyleNameExp;
        }
        else {
            var classNameExpr = getExp(initializer);
            newClassNameExp = concat(concat(classNameExpr, ts.createLiteral(" ")), checkStyleNameExp);
        }
        return ts.createJsxExpression(undefined, newClassNameExp);
    }
    function visitJsxElement(node) {
        var styleNameAttr;
        var classNameAttr;
        var newProps = node.attributes.properties.filter(function (prop) {
            if (prop.kind == ts.SyntaxKind.JsxSpreadAttribute) {
                return true;
            }
            if (prop.name.getText() == PROP_NAME) {
                styleNameAttr = prop;
                return false;
            }
            else if (prop.name.getText() == 'className') {
                classNameAttr = prop;
                return false;
            }
            return true;
        });
        if (styleNameAttr === undefined) {
            return node;
        }
        if (styleNameAttr.initializer == undefined) {
            return node;
        }
        if (styleNameAttr.initializer.kind === ts.SyntaxKind.StringLiteral) {
            showWarning(styleNameAttr, 'styleName attribute is string literal');
        }
        var styleNameExp = getExp(styleNameAttr.initializer);
        if (classNameAttr !== undefined) {
            classNameAttr = ts.getMutableClone(classNameAttr);
            classNameAttr.initializer = getNewClassNameInitializer(classNameAttr.initializer, styleNameExp);
        }
        else {
            classNameAttr = ts.createJsxAttribute(ts.createIdentifier('className'), getNewClassNameInitializer(undefined, styleNameExp));
        }
        newProps.push(classNameAttr);
        var newJsxAttrubutes = ts.createJsxAttributes(newProps);
        var nodeCopy = ts.getMutableClone(node);
        nodeCopy.attributes = newJsxAttrubutes;
        return nodeCopy;
    }
    function visitor(node) {
        switch (node.kind) {
            case ts.SyntaxKind.JsxSelfClosingElement:
            case ts.SyntaxKind.JsxOpeningElement:
                return visitJsxElement(node);
            default:
                return ts.visitEachChild(node, visitor, context);
        }
    }
    return function transform(source) {
        if (source.isDeclarationFile) {
            return source;
        }
        if (source.languageVariant !== ts.LanguageVariant.JSX) {
            return source;
        }
        var newNode = ts.visitEachChild(source, visitor, context);
        var anynode = (newNode);
        anynode.symbol = source.symbol;
        return newNode;
    };
}
exports.default = Transformer;
//# sourceMappingURL=transformer.js.map