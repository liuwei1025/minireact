function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.map(child => {
        return typeof child === "object" ? child : createTextElement(child)
      })
    }
  }
}

function createTextElement(text) {
  return {
    type: "TEXT_ELEMENT",
    props: {
      nodeValue: text,
      children: []
    }
  }
}

function render(element, container) {
  const dom = element.type === "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(element.type)

  const isProperty = key => key !== "children"

  Object.keys(element.props).filter(isProperty).forEach(name => {
    dom[name] = element.props[name]
  })

  container.appendChild(dom)
  element.props.children.forEach(child => {
    render(child, dom)
  })
}

/** Didact 代替React */

const Didact = {
  createElement,
  render,
}

/** @jsx Didact.createElement */
const element = (
  <div style="background: salmon">
    <h1>Hello World</h1>
    <h2 style="text-align:right">from Didact</h2>
  </div>
)

Didact.render(element, document.getElementById('root'))


