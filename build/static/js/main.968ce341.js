!function(){"use strict";function e(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function t(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function r(r){for(var n=1;n<arguments.length;n++){var o=null!=arguments[n]?arguments[n]:{};n%2?t(Object(o),!0).forEach((function(t){e(r,t,o[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(r,Object.getOwnPropertyDescriptors(o)):t(Object(o)).forEach((function(e){Object.defineProperty(r,e,Object.getOwnPropertyDescriptor(o,e))}))}return r}function n(e){return{type:"TEXT_ELEMENT",props:{nodeValue:e,children:[]}}}var o={createElement:function(e,t){for(var o=arguments.length,c=new Array(o>2?o-2:0),i=2;i<o;i++)c[i-2]=arguments[i];return{type:e,props:r(r({},t),{},{children:c.map((function(e){return"object"===typeof e?e:n(e)}))})}},render:function e(t,r){var n="TEXT_ELEMENT"===t.type?document.createTextNode(""):document.createElement(t.type);Object.keys(t.props).filter((function(e){return"children"!==e})).forEach((function(e){n[e]=t.props[e]})),r.appendChild(n),t.props.children.forEach((function(t){e(t,n)}))}},c=o.createElement("div",{style:"background: salmon"},o.createElement("h1",null,"Hello World"),o.createElement("h2",{style:"text-align:right"},"from Didact"));o.render(c,document.getElementById("root"))}();
//# sourceMappingURL=main.968ce341.js.map