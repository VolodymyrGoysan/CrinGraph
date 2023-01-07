import { useEffect } from 'react';

export default function useDarkTheme() {
  const body = document.querySelector("body");
  
  const toggleTheme = () => {
    if (localStorage.getItem("dark-mode-pref")) {
      localStorage.removeItem("dark-mode-pref");
      body.classList.remove("dark-mode");
    } else {
      localStorage.setItem("dark-mode-pref", "true");
      body.classList.add("dark-mode");
    }
  }

  useEffect(() => {
    if (localStorage.getItem("dark-mode-pref")) {
      body.classList.add("dark-mode");
    }
  }, []);

  return {
    toggleTheme,
  }
}
