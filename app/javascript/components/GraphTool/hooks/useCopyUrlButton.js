import { useState } from "react";

export default function useCopyUrlButton() {
  const [copyUrlButtonClass, setCopyUrlButtonClass] = useState("");

  const onCopyUrlButtonClick = (event) => {
    const targetWindow = window.top === window ? window : window.top;

    navigator.clipboard.writeText(targetWindow.location.href);

    event.stopPropagation();

    setCopyUrlButtonClass("clicked");
    
    setTimeout(() => setCopyUrlButtonClass(""), 600);
  }

  return {
    copyUrlButtonClass,
    onCopyUrlButtonClick,
  }
}
