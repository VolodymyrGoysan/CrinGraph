import { useEffect } from "react";

// fixme
function useBlurFocus() {
  useEffect(() => {
    // Blur focus from inputs on submit 
    let inputFields = document.querySelectorAll("input"),
      body = document.querySelector("body");

    inputFields.forEach(function (field) {
      field.addEventListener("keyup", function (e) {
        if (e.keyCode === 13) {
          field.blur();
        }
      });

      field.addEventListener("focus", function () {
        body.setAttribute("data-input-state", "focus");
      });

      field.addEventListener("blur", function () {
        body.setAttribute("data-input-state", "blur");
      });
    });
  }, []);
}

export default useBlurFocus;