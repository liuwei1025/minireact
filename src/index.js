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

function render(element, container) {
  // container.appendChild(dom);
  // element.props.children.forEach(child => {
  //   render(child, dom);
  // });
  nextUnitOfWork = {
    dom: container,
    props: {
      children: [element],
    },
  };
}

let nextUnitOfWork = null;
function workLoop(deadline) {
  let shouldYield = false;
  while (nextUnitOfWork && !shouldYield && Math.random() > 0.7) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    shouldYield = deadline.timeRemaining() < 1;
  }
  requestIdleCallback(workLoop);
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

let promise = Promise.resolve();

/**
 * 执行work并返回下一个work
 * 1. 因为unit是可以中断的，每次又都会appendChild，会导致页面出现渲染部分UI的情况
 */
function performUnitOfWork(fiber) {
  // 将节点写入dom
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }

  if (fiber.parent) {
    fiber.parent.dom.appendChild(fiber.dom);
    // promise = promise.then(() => {
    //   return new Promise(resolve => {
    //     setTimeout(() => {
    //       resolve();
    //     }, 500);
    //   });
    // });
  }

  const elements = fiber.props.children;

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
      parent: fiber,
      dom: null,
    };
    if (index == 0) {
      fiber.child = newFiber;
    } else {
      prevSibling.sibling = newFiber;
    }
    prevSibling = newFiber;
    index += 1;
  }
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
