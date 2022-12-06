import type { ReactElement,  ReactTextElement } from "../../react/createElement/createElement"  
  
const render = (element:ReactElement|ReactTextElement , dom:HTMLElement) => {

  const child:any = element.type === "TEXT_ELEMENT" 
  ?document.createTextNode("")
  :document.createElement(element.type)

  const isProperty = (key:string) => key !== "children"

  Object.keys(element.props)
  .filter(isProperty)
  .forEach((prop)=>{
    child[prop] = element.props[prop]
  })

  element.props.children.forEach((ch)=>{
    render(ch , child)
  })

  dom.appendChild(child)

}

export {render}