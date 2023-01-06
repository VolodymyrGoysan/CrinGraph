import components from "./*.jsx"

const ReactRailsUJS = require("react_ujs")
const componentsContext = {}

components.forEach((component) => {
  componentsContext[component.name.replace(".jsx", "").replace(/--/g, "/")] = component.module.default
})

ReactRailsUJS.getConstructor = (name) => componentsContext[name];
ReactRailsUJS.handleEvent('turbo:load', ReactRailsUJS.handleMount, false);
ReactRailsUJS.handleEvent('turbo:frame-load', ReactRailsUJS.handleMount, false);
ReactRailsUJS.handleEvent('turbo:before-render', ReactRailsUJS.handleUnmount, false);
