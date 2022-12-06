import type { ReactElement,  ReactTextElement } from "../../react/createElement/createElement"  
  
interface Fiber {
  type:string;
  dom:HTMLElement|null;
  props:{
    [str:string]:any;
    children:(ReactElement|ReactTextElement)[]
  };
  parent:null|Fiber ;
  child:null|Fiber ;
  sibling: null|Fiber
}


let nextUnitWork:Fiber|null = null

const render = (element:ReactElement|ReactTextElement , dom:HTMLElement) => {

  nextUnitWork = {
    dom,
    type:"",
    props:{
      children:[element]
    },
    parent:null,
    child:null,
    sibling:null
  }

  requestIdleCallback(workLoop)

}


const workLoop = (deadline:IdleDeadline) => {
  let shouldYield = false
  while(nextUnitWork && !shouldYield){
    nextUnitWork = performUnitOfWork(nextUnitWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  requestIdleCallback(workLoop)
}


const performUnitOfWork = (fiber:Fiber):Fiber|null => {
  //  add dom

  if(!fiber.dom){
    fiber.dom = createDom(fiber)
  }


  // adding dom to parent dom
  // ! we must don't do this because we are adding dom scilly
  // TODO create a functionality that add all doms in one call

  if(fiber.parent){
    fiber.parent.dom?.appendChild(fiber.dom)
  }

  //  create new Fiber

  const element = fiber.props.children
  let prevSibling:Fiber|null = null

  element.forEach((el,index)=>{
    let newFiber:Fiber = {
      type:el.type,
      props:el.props,
      parent:fiber,
      dom:null,
      child:null,
      sibling:null
    }
    if (index === 0){
      fiber.child = newFiber
    }else{
      if(prevSibling){
        prevSibling.sibling = newFiber
      }
    }
    prevSibling = newFiber

  })

  //  return New Fiber

  if(fiber.child){
    return fiber.child
  }

  let nextFiber:Fiber|null = fiber
  while(nextFiber){
    if(nextFiber.sibling){
      return nextFiber.sibling
    }
    nextFiber = nextFiber.parent
  }
  return null
}



const createDom = (fiber:Fiber):HTMLElement => {
  const dom:any = fiber.type === "TEXT_ELEMENT" ?
  document.createTextNode('')
  :document.createElement(fiber.type)

  const isProperty = (key:string)=>key!=="children"

  Object.keys(fiber.props)
  .filter(isProperty)
  .forEach((prop)=>{
    dom[prop] = fiber.props[prop]
  })

  return dom

}



export {render}