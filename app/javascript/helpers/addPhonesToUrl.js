export default function addPhonesToUrl(config, targetWindow, activePhones) {
  const baseTitle = config.pageTitle || "CrinGraph";
  const baseDescription = config.pageDescription || "View and compare frequency response graphs";
  const baseURL = targetWindow.location.href.split("?").shift();
  const names = activePhones.filter(p => !p.isDynamic).map(p => p.fileName);
  const namesCombined = names.join(", ");
  const url = names.length ? `${baseURL}?share=${encodeURI(names.join().replace(/ /g, "_")) }` : baseURL;
  const title = names.length ? `${namesCombined} - ${baseTitle}` : baseTitle;

  if (names.length === 1) {
    targetWindow.document.querySelector("link[rel='canonical']").setAttribute("href", url)
  } else {
    targetWindow.document.querySelector("link[rel='canonical']").setAttribute("href", baseURL)
  }

  targetWindow.history.replaceState("", title, url);
  targetWindow.document.title = title;
  targetWindow.document
    .querySelector("meta[name='description']")
    .setAttribute("content", `${baseDescription}, including ${namesCombined}.`);
}
