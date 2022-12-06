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
let fiberRoot:Fiber|null = null
const render = (element:ReactElement|ReactTextElement , dom:HTMLElement) => {

  fiberRoot = {
    dom,
    type:"",
    props:{
      children:[element]
    },
    parent:null,
    child:null,
    sibling:null
  }
  nextUnitWork = fiberRoot
  requestIdleCallback(workLoop)

}


const workLoop = (deadline:IdleDeadline) => {
  let shouldYield = false
  while(nextUnitWork && !shouldYield){
    nextUnitWork = performUnitOfWork(nextUnitWork)
    shouldYield = deadline.timeRemaining() < 1
  }
  if(!nextUnitWork && fiberRoot){
    // all units of work are finished.
    commitRoot()
    return 
  }
  requestIdleCallback(workLoop)
}

const commitRoot = () => {
  if(fiberRoot && fiberRoot.child){
    commitWork(fiberRoot.child)
  }
  fiberRoot = null
}

const commitWork = (fiber:null|Fiber) => {
  if(!fiber){
    return
  }
  const domParent = fiber.parent?.dom
  domParent?.appendChild(fiber.dom as HTMLElement)
  // recursively call commitWork with fibers...
  commitWork(fiber.sibling)
  commitWork(fiber.child)

}

const performUnitOfWork = (fiber:Fiber):Fiber|null => {
  //  add dom

  if(!fiber.dom){
    fiber.dom = createDom(fiber)
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