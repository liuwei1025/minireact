function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        return typeof child === 'object' ? child : createTextElement(child);
      }),
    },
  };
}

function createTextElement(text) {
  return {
    type: 'TEXT_ELEMENT',
    props: {
      nodeValue: text,
      children: [],
    },
  };
}

function commitRoot() {
  // 此处必须是渲染子元素 因为第一个fiber是根据容器dom构造出来的
  commitWork(wipRoot.child);
  currentRoot = wipRoot
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return
  const domParent = fiber.parent.dom;
  domParent.appendChild(fiber.dom);
  commitWork(fiber.child)
  commitWork(fiber.sibling)
}

function render(element, container) {
  // container.appendChild(dom);
  // element.props.children.forEach(child => {
  //   render(child, dom);
  // });
  wipRoot = {
    dom: container,
    props: {
      children: [element],
    },
    // the fiber that we committed to the DOM in the previous commit phase
    alternate: currentRoot
  };
  nextUnitOfWork = wipRoot;
}

let nextUnitOfWork = null;
// last fiber tree we committed to the DOM
let currentRoot = null;
let wipRoot = null;

function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
  if (!nextUnitOfWork && wipRoot) {
    commitRoot();
  }
}

requestIdleCallback(workLoop);

function createDom(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);

  const isProperty = key => key !== 'children';

  Object.keys(fiber.props)
    .filter(isProperty)
    .forEach(name => {
      dom[name] = fiber.props[name];
    });

  return dom;
}

/**
 * 执行work并返回下一个work
 * 1. 因为unit是可以中断的，每次又都会appendChild，会导致页面出现渲染部分UI的情况
 */
function performUnitOfWork(fiber) {
  // 将节点写入dom
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  // if (fiber.parent) {
  //   fiber.parent.dom.appendChild(fiber.dom);
  //   // promise = promise.then(() => {
  //   //   return new Promise(resolve => {
  //   //     setTimeout(() => {
  //   //       resolve();
  //   //     }, 500);
  //   //   });
  //   // });
  // }

  const elements = fiber.props.children;
  reconcileChildren(fiber, elements)
  /**
   * 返回下一个节点
   */
  if (fiber.child) {
    return fiber.child;
  }
  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibling) {
      return nextFiber.sibling;
    }
    nextFiber = nextFiber.parent;
  }
}

function reconcileChildren(wipFiber, elements) {
  /**
   * 根据fiber的子节点构造出一个新的fiber树
   */
   let index = 0;
   let prevSibling = null;
 
   while (index < elements.length) {
     const element = elements[index];
     const newFiber = {
       type: element.type,
       props: element.props,
       parent: wipFiber,
       dom: null,
     };
     if (index == 0) {
       wipFiber.child = newFiber;
     } else {
       prevSibling.sibling = newFiber;
     }
     prevSibling = newFiber;
     index += 1;
   }
}

/** Didact 代替React */

const Didact = {
  createElement,
  render,
};

/** @jsx Didact.createElement */
const element = (
  <div style="background: salmon">
    <h1>Hello World</h1>
    <h2 style="text-align:right">from Didact</h2>
    <h2 style="text-align:right">from Didact</h2>
    <h2 style="text-align:right">from Didact</h2>
    <h2 style="text-align:right">from Didact</h2>
    <h2 style="text-align:right">from Didact</h2>
    <h2 style="text-align:right">from Didact</h2>
    <h2 style="text-align:right">from Didact</h2>
    <h2 style="text-align:right">from Didact</h2>
  </div>
);

Didact.render(element, document.getElementById('root'));
