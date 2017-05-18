
import * as ts from 'typescript';

const PROP_NAME = 'styleName';

export function patchTsLib(tsLibModule: any) {
  tsLibModule.__getAndCheckStyleName = function __getAndCheckStyleName(styleName: any) {
    if (styleName === undefined) {
      throw new Error('stylename is undefined');
    }
    if (!Array.isArray(styleName)) {
      return styleName
    }
    for (const el of styleName) {
      if (el === undefined) {
        throw new Error('one of stylenames is undefined');
      }
    }
    return styleName.join(' ')
  };
}


const getAndCheckStyleName: ts.EmitHelper = {
  name: '__getAndCheckStyleName',
  scoped: false,
  text: `function __getAndCheckStyleName(styleName) {
    if (styleName === undefined) {
      throw new Error('stylename is undefined');
    }
    if (!Array.isArray(styleName)) {
      return styleName
    }
    for (const el of styleName) {
      if (el === undefined) {
        throw new Error('one of stylenames is undefined');
      }
    }
    return styleName.join(' ')
  };`
}

export default function Transformer(context: ts.TransformationContext) {

  function getExp(initializer: ts.StringLiteral | ts.JsxExpression): ts.Expression | ts.StringLiteral {
    if (initializer.kind == ts.SyntaxKind.StringLiteral) {
      return initializer
    } else {
      if (initializer.expression === undefined) {
        throw new Error('initializer exp is empty')
      }
      return initializer.expression
    }

  }

  function concat(left: ts.Expression, right: ts.Expression) {
    return ts.createBinary(left, ts.SyntaxKind.PlusToken, right)
  }

  function getHelperName(name: string) {
    return ts.setEmitFlags(ts.createIdentifier(name), ts.EmitFlags.HelperName | ts.EmitFlags.AdviseOnEmitNode);
  }

  function getNewClassNameInitializer(initializer: ts.StringLiteral | ts.JsxExpression | undefined,
    styleNameExp: ts.Expression | ts.StringLiteral) {

    context.requestEmitHelper(getAndCheckStyleName)

    const checkStyleNameExp = ts.createCall(getHelperName("__getAndCheckStyleName"), undefined, [styleNameExp])

    let newClassNameExp: ts.Expression
    if (initializer === undefined) {
      newClassNameExp = checkStyleNameExp
    } else {
      const classNameExpr = getExp(initializer)
      newClassNameExp = concat(concat(classNameExpr, ts.createLiteral(" ")), checkStyleNameExp)
    }
    return ts.createJsxExpression(undefined, newClassNameExp)
  }

  function visitJsxElement(node: ts.JsxOpeningLikeElement) {
    let styleNameAttr: ts.JsxAttribute | undefined;
    let classNameAttr: ts.JsxAttribute | undefined;
    const newProps = node.attributes.properties.filter(prop => {
      if (prop.kind == ts.SyntaxKind.JsxSpreadAttribute) {
        return true
      }
      if (prop.name.getText() == PROP_NAME) {
        styleNameAttr = prop //ignore and save
      } else if (prop.name.getText() == 'className') {
        classNameAttr = prop  //ignore and save
      }
      return false
    })
    if (styleNameAttr === undefined) {
      return node
    }

    if (styleNameAttr.initializer == undefined) {
      return node
    }
    const styleNameExp = getExp(styleNameAttr.initializer)

    if (classNameAttr !== undefined) {
      classNameAttr = ts.getMutableClone(classNameAttr)
      classNameAttr.initializer = getNewClassNameInitializer(classNameAttr.initializer, styleNameExp)
    } else {
      classNameAttr = ts.createJsxAttribute(ts.createIdentifier('className'), getNewClassNameInitializer(undefined, styleNameExp))
    }
    newProps.push(classNameAttr)

    const newJsxAttrubutes = ts.createJsxAttributes(newProps)

    const nodeCopy = ts.getMutableClone(node)
    nodeCopy.attributes = newJsxAttrubutes
    return nodeCopy

  }



  function visitor(node: ts.Node): ts.VisitResult<ts.Node> {

    switch (node.kind) {
      case ts.SyntaxKind.JsxSelfClosingElement:
      case ts.SyntaxKind.JsxOpeningElement:
        return visitJsxElement(<ts.JsxOpeningLikeElement>node)

      default:
        return ts.visitEachChild(node, visitor, context)
    }
  }

  return function transform(source: ts.SourceFile): ts.SourceFile {
    if (source.isDeclarationFile) {
      return source
    }
    if (source.languageVariant !== ts.LanguageVariant.JSX) {
      return source
    }
    const newNode = ts.visitEachChild(source, visitor, context);
    const anynode = <any>(newNode)
    anynode.symbol = (<any>source).symbol;
    return newNode

  }
}

