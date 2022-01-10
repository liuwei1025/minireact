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

function createDom(fiber) {
  const dom = fiber.type === 'TEXT_ELEMENT' ? document.createTextNode('') : document.createElement(fiber.type);
  updateDom(dom, {}, fiber.props);
  return dom;
}
const isEvent = key => key.startsWith('on');
const isProperty = key => key !== 'children' && !isEvent(key);
const isNew = (prev, next) => key => prev[key] !== next[key];
const isGone = (prev, next) => key => !(key in next);

function updateDom(dom, prevProps, nextProps) {
  // 移除或者修改监听事件
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(
      key =>
        // 移除的监听事件
        !(key in nextProps) ||
        // 监听事件改变了
        isNew(prevProps, nextProps)(key),
    )
    .forEach(name => {
      const eventType = name.toLocaleLowerCase().substring(2);
      dom.removeEventListener(eventType, prevProps[name]);
    });
  // 移除属性
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach(name => {
      dom[name] = '';
    });
  // 增加或者修改属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter(isNew)
    .forEach(name => {
      dom[name] = nextProps[name];
    });
  // 新增监听事件
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(isNew(prevProps, nextProps))
    .forEach(name => {
      const eventType = name.toLocaleLowerCase().substring(2);
      dom.addEventListener(eventType, nextProps[name]);
    });
}

function commitDeletion(fiber, domParent) {
  if (fiber.dom) {
    domParent.removeChild(fiber.dom, domParent);
  } else {
    commitDeletion(fiber.child, domParent);
  }
}

function commitRoot() {
  deletions.forEach(commitWork);
  // 此处必须是渲染子元素 因为第一个fiber是根据容器dom构造出来的
  commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function commitWork(fiber) {
  if (!fiber) return;
  // 如果是函数式组件 本身不会产生dom 所以需要找出父级dom节点
  let domParentFiber = fiber.parent;
  while (!domParentFiber.dom) {
    domParentFiber = domParentFiber.parent;
  }
  const domParent = domParentFiber.dom;
  // fiber.dom在初始化时候是null 函数式组件的fiber的dom也是null
  if (fiber.effectTag === 'PLACEMENT' && fiber.dom !== null) {
    domParent.appendChild(fiber.dom);
  } else if (fiber.effectTag === 'UPDATE' && fiber.dom) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  } else if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber, domParent);
  }
  commitWork(fiber.child);
  commitWork(fiber.sibling);
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
    alternate: currentRoot,
  };
  nextUnitOfWork = wipRoot;
  deletions = [];
}

let nextUnitOfWork = null;
// last fiber tree we committed to the DOM
let currentRoot = null;
let wipRoot = null;
let deletions = null;

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

/**
 * 执行work并返回下一个work
 * 1. 因为unit是可以中断的，每次又都会appendChild，会导致页面出现渲染部分UI的情况
 */
function performUnitOfWork(fiber) {
  const isFunctionComponent = fiber.type instanceof Function;
  if (isFunctionComponent) {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
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

/**
 * Function components are differents in two ways:
 * 1. the fiber from a function component doesn’t have a DOM node
 * 2. and the children come from running the function instead of getting them directly from the props
 */
function updateFunctionComponent(fiber) {
  const children = [fiber.type(fiber.props)];
  reconcileChildren(fiber, children);
}

function updateHostComponent(fiber) {
  // 将节点写入dom
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

function reconcileChildren(wipFiber, elements) {
  /**
   * 根据fiber的子节点构造出一个新的fiber树
   */
  let index = 0;
  /**
   * wipFiber.alternate 首次运行指向null 后续执行指向上次commit时候的节点
   * 获取旧的fiber节点
   * The elements is the thing we want to render to the DOM and the oldFiber is what we rendered the last time.
   */
  let oldFiber = wipFiber.alternate?.child;
  let prevSibling = null;
  /**
   * 遍历不能只针对新的元素，就的节点也应该做判断 这样才能知道旧节点是否该删除
   */
  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    // compare oldFiber to element
    let newFiber = null;
    const sameType = oldFiber && element && oldFiber.type === element.type;
    if (sameType) {
      // update
      newFiber = {
        type: oldFiber.type,
        props: oldFiber.props,
        parent: wipFiber,
        dom: oldFiber.dom,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }
    if (element && !sameType) {
      // add
      newFiber = {
        type: element.type,
        props: element.props,
        parent: wipFiber,
        // 此处是reconcile阶段 不创建dom
        dom: null,
        // 新建的fiber alt是null
        alternate: null,
        effectTag: 'PLACEMENT',
      };
    }
    if (oldFiber && !sameType) {
      // delete
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }
    if (oldFiber) {
      oldFiber = oldFiber.sibling;
    }
    if (index == 0) {
      wipFiber.child = newFiber;
    } else if (element) {
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
function App(props) {
  return (
    <div>
      <h1>Hi, {props.name}</h1>
      <h2 style="text-align:right;background: salmon">from Didact</h2>
      <input
        onInput={evt => {
          console.log(evt.target.value);
        }}
      />
    </div>
  );
}

const element = <App name="liuwei" />;

Didact.render(element, document.getElementById('root'));
