import type {
  ReactElement,
  ReactTextElement,
} from "../../react/createElement/createElement";

interface Fiber {
  type: string;
  dom: HTMLElement | null;
  props: {
    [str: string]: any;
    children: (ReactElement | ReactTextElement)[];
  };
  parent: null | Fiber;
  child: null | Fiber;
  sibling: null | Fiber;
  alternate: Fiber | null;
  effectTag?: "PLACEMENT" | "DELETION" | "UPDATE";
}

let nextUnitWork: Fiber | null = null;
let fiberRoot: Fiber | null = null;
let currentRoot: Fiber | null = null;
let deletion: Fiber[] = [];
const render = (element: ReactElement | ReactTextElement, dom: HTMLElement) => {
  fiberRoot = {
    dom,
    type: "",
    props: {
      children: [element],
    },
    parent: null,
    child: null,
    sibling: null,
    alternate: currentRoot,
  };
  nextUnitWork = fiberRoot;
  requestIdleCallback(workLoop);
};

const workLoop = (deadline: IdleDeadline) => {
  let shouldYield = false;
  while (nextUnitWork && !shouldYield) {
    nextUnitWork = performUnitOfWork(nextUnitWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  if (!nextUnitWork && fiberRoot) {
    // all units of work are finished.
    commitRoot();
    return;
  }
  requestIdleCallback(workLoop);
};

const commitRoot = () => {
  if (fiberRoot && fiberRoot.child) {
    deletion.forEach(commitWork);
    commitWork(fiberRoot.child);
    currentRoot = fiberRoot;
    fiberRoot = null;
  }
};

const commitWork = (fiber: null | Fiber) => {
  if (!fiber) {
    return;
  }
  const domParent = fiber.parent?.dom;
  // we are appending doubly?
  if (fiber.effectTag === "PLACEMENT" && fiber.dom) {
    domParent?.appendChild(fiber.dom);
  } else if (fiber.effectTag === "DELETION" && fiber.dom) {
    domParent?.removeChild(fiber.dom);
  } else if (fiber.effectTag === "UPDATE" && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate?.props, fiber.props);
  }

  domParent?.appendChild(fiber.dom as HTMLElement);
  // recursively call commitWork with fibers...
  commitWork(fiber.sibling);
  commitWork(fiber.child);
};

const performUnitOfWork = (fiber: Fiber): Fiber | null => {
  //  add dom
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  //  create new Fiber
  const elements = fiber.props.children;
  reconcileChildren(fiber, elements);

  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber: Fiber | null = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
  return null;
};

const isEvent = (key: string) => key.startsWith("on");
const isProperty = (key: string) => key !== "children" && !isEvent(key);
const isNew = (prev: any, next: any) => (key: string) =>
  prev[key] !== next[key];
const isGone = (prev: any, next: any) => (key: string) => !(key in next);

const updateDom = (dom: HTMLElement, prevProps: any, nextProps: any) => {
  // check if any events are removed
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(isGone(prevProps, nextProps))
    .forEach((ev) => {
      const eventName = ev.substring(2).toLowerCase();
      dom.removeEventListener(eventName, prevProps[ev]);
    });

  //add new events
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach((ev) => {
      const eventName = ev.toLowerCase();
      dom.addEventListener(eventName, nextProps[ev]);
    });

  // remove attributes
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((prop) => {
      dom.removeAttribute(prop);
    });

  // set new attributes
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew(prevProps, nextProps))
    .forEach((prop) => {
      dom.setAttribute(prop, nextProps[prop]);
    });

  // ! what happen if property is changed ??
};

const reconcileChildren = (
  fiber: Fiber,
  elements: (ReactElement | ReactTextElement)[]
) => {
  let oldFiber:any = fiber.alternate && fiber.alternate.child;
  let prevSibling: Fiber | null = null;
  let index = 0


  while(
    oldFiber!= null ||
    index < elements.length
  ){
    const el = elements[index]
    const sameType = oldFiber && el && oldFiber.type === el.type;
    let newFiber:Fiber|null =null
    if (sameType) {
      // just update props
      newFiber = {
        type: oldFiber.type,
        props: el.props,
        alternate: oldFiber,
        parent: fiber,
        child: null,
        sibling: null,
        dom: oldFiber.dom,
        effectTag: "UPDATE",
      };
    }

    if (el && !sameType) {
      // adding new node
      newFiber = {
        type: el.type,
        props: el.props,
        alternate: null,
        parent: fiber,
        child: null,
        sibling: null,
        dom: null,
        effectTag: "PLACEMENT",
      };
    }

    if (oldFiber && !sameType) {
      oldFiber.effectTag = "DELETION";
      deletion.push(oldFiber);
    }

    if(oldFiber){
      oldFiber = oldFiber.sibling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      if (prevSibling) {
        prevSibling.sibling = newFiber;
      }
    }
    prevSibling = newFiber;
    index++
  }
};

const createDom = (fiber: Fiber): HTMLElement => {
  const dom: any =
    fiber.type === "TEXT_ELEMENT"
      ? document.createTextNode("")
      : document.createElement(fiber.type);

  const isProperty = (key: string) => key !== "children";

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach((prop) => {
      dom[prop] = fiber.props[prop];
    });

  return dom;
};

export { render };
