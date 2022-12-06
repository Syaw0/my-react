export interface ReactElement {
  type:string ;
  props:{
    [s:string]:any,
    children:(ReactTextElement|ReactElement)[]
  }
}

export interface ReactTextElement extends ReactElement {
  type:"TEXT_ELEMENT"
  props:{
    [s:string]:any,
    nodeValue:string,
    children:[]
  }
}

const textElement = (nodeValue:string):ReactTextElement =>{

  return {
    type:"TEXT_ELEMENT",
    props:{
      nodeValue:nodeValue,
      children:[]
    }
  }
}



const createElement = (type:string , config:any , ...children:(string|ReactElement)[]):ReactElement => {
  return {
    type,
    props:{
      ...config,
      children:children.map((ch)=>
      typeof ch === 'object' ? ch : textElement(ch)
      )
    }
  }
}

export {createElement}