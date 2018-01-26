# ts-css-modules-transformer

Typescript transformer, running in compile time, to auto concat 'styleName' with className.

## Example:
### Input:
```ts

function Component() {
    return <div className="somecls" styleName='other-custom-style' />
}
```

### Output:
```js

function __getAndCheckStyleName(styleName) {
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
  
function Component() {
    return React.createElement("div", { className: "somecls" + " " + __getAndCheckStyleName('other-custom-style') });
}
```
