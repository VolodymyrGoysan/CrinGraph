export default function addStyleToDocument(document, style) {
  const styleElement = document.createElement("style");

  styleElement.textContent = style;
  styleElement.setAttribute("type", "text/css");
  document.querySelector("body").append(styleElement);
}
