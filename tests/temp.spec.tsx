import * as React from 'react';
import  '../src'









const SomeStyle = "other-custom-style"

function Component() {
    return <div className="somecls" styleName='other-custom-style'/>
}

function Component2() {
    return <div className="somecls" styleName={SomeStyle}/>
}

function Component3() {
    return <div className={'somecls'} styleName='other-custom-style'/>
}

function Component4() {
    return <div className={'somecls'} styleName={SomeStyle}/>
}

function Component5() {
    return <div className={'somecls'}/>
}

function Component6() {
    return <div styleName={SomeStyle}/>
}

function Component7() {
    return <div styleName='other-custom-style'/>
}

function Component8() {
    return <div className='somecls' styleName={undefined}/>
}


function Component9() {
    return <div styleName={['somecls', 'other cls']}/>
}



function NestedComponent() {
    return <div styleName='other-custom-style'>
        <div styleName='other-custom-style'/>
    </div>
}