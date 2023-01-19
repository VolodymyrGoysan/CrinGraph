// Taken from https://github.com/exupero/saveSvgAsPng
// Repo is no longer maintained and does not support exports

const xmlNs = 'http://www.w3.org/2000/xmlns/';
const xhtmlNs = 'http://www.w3.org/1999/xhtml';
const svgNs = 'http://www.w3.org/2000/svg';
const doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>';
const urlRegex = /url\(["']?(.+?)["']?\)/;
const fontFormats = {
  woff2: 'font/woff2',
  woff: 'font/woff',
  otf: 'application/x-font-opentype',
  ttf: 'application/x-font-ttf',
  eot: 'application/vnd.ms-fontobject',
  sfnt: 'application/font-sfnt',
  svg: 'image/svg+xml'
};

const isElement = function isElement(obj) {
  return obj instanceof HTMLElement || obj instanceof SVGElement;
};
const requireDomNode = function requireDomNode(el) {
  if (!isElement(el)) throw new Error('an HTMLElement or SVGElement is required; got ' + el);
};
const requireDomNodePromise = function requireDomNodePromise(el) {
  return new Promise(function (resolve, reject) {
    if (isElement(el)) resolve(el); else reject(new Error('an HTMLElement or SVGElement is required; got ' + el));
  });
};
const isExternal = function isExternal(url) {
  return url && url.lastIndexOf('http', 0) === 0 && url.lastIndexOf(window.location.host) === -1;
};

const getFontMimeTypeFromUrl = function getFontMimeTypeFromUrl(fontUrl) {
  const formats = Object.keys(fontFormats).filter(function (extension) {
    return fontUrl.indexOf('.' + extension) > 0;
  }).map(function (extension) {
    return fontFormats[extension];
  });
  if (formats) return formats[0];
  console.error('Unknown font format for ' + fontUrl + '. Fonts may not be working correctly.');
  return 'application/octet-stream';
};

const arrayBufferToBase64 = function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
};

const getDimension = function getDimension(el, clone, dim) {
  const v = el.viewBox && el.viewBox.baseVal && el.viewBox.baseVal[dim] || clone.getAttribute(dim) !== null && !clone.getAttribute(dim).match(/%$/) && parseInt(clone.getAttribute(dim)) || el.getBoundingClientRect()[dim] || parseInt(clone.style[dim]) || parseInt(window.getComputedStyle(el).getPropertyValue(dim));
  return typeof v === 'undefined' || v === null || isNaN(parseFloat(v)) ? 0 : v;
};

const getDimensions = function getDimensions(el, clone, width, height) {
  if (el.tagName === 'svg') return {
    width: width || getDimension(el, clone, 'width'),
    height: height || getDimension(el, clone, 'height')
  }; else if (el.getBBox) {
    const _el$getBBox = el.getBBox(),
      x = _el$getBBox.x,
      y = _el$getBBox.y,
      _width = _el$getBBox.width,
      _height = _el$getBBox.height;

    return {
      width: x + _width,
      height: y + _height
    };
  }
};

const reEncode = function reEncode(data) {
  return decodeURIComponent(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, function (match, p1) {
    // @ts-ignore
    const c = String.fromCharCode(`0x${p1}`);
    return c === '%' ? '%25' : c;
  }));
};

const uriToBlob = function uriToBlob(uri) {
  const byteString = window.atob(uri.split(',')[1]);
  const mimeString = uri.split(',')[0].split(':')[1].split(';')[0];
  const buffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(buffer);
  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }
  return new Blob([buffer], { type: mimeString });
};

const query = function query(el, selector) {
  if (!selector) return;
  try {
    return el.querySelector(selector) || el.parentNode && el.parentNode.querySelector(selector);
  } catch (err) {
    console.warn('Invalid CSS selector "' + selector + '"', err);
  }
};

const detectCssFont = function detectCssFont(rule, href) {
  // Match CSS font-face rules to external links.
  // @font-face {
  //   src: local('Abel'), url(https://fonts.gstatic.com/s/abel/v6/UzN-iejR1VoXU2Oc-7LsbvesZW2xOQ-xsNqO47m55DA.woff2);
  // }
  const match = rule.cssText.match(urlRegex);
  const url = match && match[1] || '';
  if (!url || url.match(/^data:/) || url === 'about:blank') return;
  const fullUrl = url.startsWith('../') ? href + '/../' + url : url.startsWith('./') ? href + '/.' + url : url;
  return {
    text: rule.cssText,
    format: getFontMimeTypeFromUrl(fullUrl),
    url: fullUrl
  };
};

const inlineImages = function inlineImages(el) {
  return Promise.all(Array.from(el.querySelectorAll('image')).map(function (image) {
    let href = image.getAttributeNS('http://www.w3.org/1999/xlink', 'href') || image.getAttribute('href');
    if (!href) return Promise.resolve(null);
    if (isExternal(href)) {
      href += (href.indexOf('?') === -1 ? '?' : '&') + 't=' + new Date().valueOf();
    }
    return new Promise(function (resolve, reject) {
      const canvas = document.createElement('canvas');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = href;
      img.onerror = function () {
        return reject(new Error('Could not load ' + href));
      };
      img.onload = function () {
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        image.setAttributeNS('http://www.w3.org/1999/xlink', 'href', canvas.toDataURL('image/png'));
        resolve(true);
      };
    });
  }));
};

const cachedFonts = {};
const inlineFonts = function inlineFonts(fonts) {
  return Promise.all(fonts.map(function (font) {
    return new Promise(function (resolve) {
      if (cachedFonts[font.url]) return resolve(cachedFonts[font.url]);

      const req = new XMLHttpRequest();
      req.addEventListener('load', function () {
        // TODO: it may also be worth it to wait until fonts are fully loaded before
        // attempting to rasterize them. (e.g. use https://developer.mozilla.org/en-US/docs/Web/API/FontFaceSet)
        const fontInBase64 = arrayBufferToBase64(req.response);
        const fontUri = font.text.replace(urlRegex, 'url("data:' + font.format + ';base64,' + fontInBase64 + '")') + '\n';
        cachedFonts[font.url] = fontUri;
        resolve(fontUri);
      });
      req.addEventListener('error', function (e) {
        console.warn('Failed to load font from: ' + font.url, e);
        cachedFonts[font.url] = null;
        resolve(null);
      });
      req.addEventListener('abort', function (e) {
        console.warn('Aborted loading font from: ' + font.url, e);
        resolve(null);
      });
      req.open('GET', font.url);
      req.responseType = 'arraybuffer';
      req.send();
    });
  })).then(function (fontCss) {
    return fontCss.filter(function (x) {
      return x;
    }).join('');
  });
};

let cachedRules = null;
const styleSheetRules = function styleSheetRules() {
  if (cachedRules) return cachedRules;
  return cachedRules = Array.from(document.styleSheets).map(function (sheet) {
    try {
      return { rules: sheet.cssRules, href: sheet.href };
    } catch (e) {
      console.warn('Stylesheet could not be loaded: ' + sheet.href, e);
      return {};
    }
  });
};

const inlineCss = function inlineCss(el, options) {
  const _ref = options || {},
    selectorRemap = _ref.selectorRemap,
    modifyStyle = _ref.modifyStyle,
    modifyCss = _ref.modifyCss,
    fonts = _ref.fonts,
    excludeUnusedCss = _ref.excludeUnusedCss;

  const generateCss = modifyCss || function (selector, properties) {
    const sel = selectorRemap ? selectorRemap(selector) : selector;
    const props = modifyStyle ? modifyStyle(properties) : properties;
    return sel + '{' + props + '}\n';
  };
  const css = [];
  const detectFonts = typeof fonts === 'undefined';
  const fontList = fonts || [];
  styleSheetRules().forEach(function (_ref2) {
    const rules = _ref2.rules,
      href = _ref2.href;

    if (!rules) return;
    Array.from(rules).forEach(function (rule) {
      if (typeof rule.style != 'undefined') {
        if (query(el, rule.selectorText)) css.push(generateCss(rule.selectorText, rule.style.cssText)); else if (detectFonts && rule.cssText.match(/^@font-face/)) {
          const font = detectCssFont(rule, href);
          if (font) fontList.push(font);
        } else if (!excludeUnusedCss) {
          css.push(rule.cssText);
        }
      }
    });
  });

  return inlineFonts(fontList).then(function (fontCss) {
    return css.join('\n') + fontCss;
  });
};

const downloadOptions = function downloadOptions() {
  // @ts-ignore
  if (!navigator.msSaveOrOpenBlob && !('download' in document.createElement('a'))) {
    return { popup: window.open() };
  }
};

export function prepareSvg(el, options, done) {
  requireDomNode(el);

  const _ref3 = options || {},
    _ref3$left = _ref3.left,
    left = _ref3$left === undefined ? 0 : _ref3$left,
    _ref3$top = _ref3.top,
    top = _ref3$top === undefined ? 0 : _ref3$top,
    w = _ref3.width,
    h = _ref3.height,
    _ref3$scale = _ref3.scale,
    scale = _ref3$scale === undefined ? 1 : _ref3$scale,
    _ref3$responsive = _ref3.responsive,
    responsive = _ref3$responsive === undefined ? false : _ref3$responsive,
    _ref3$excludeCss = _ref3.excludeCss,
    excludeCss = _ref3$excludeCss === undefined ? false : _ref3$excludeCss;

  return inlineImages(el).then(function () {
    let clone = el.cloneNode(true);
    clone.style.backgroundColor = (options || {}).backgroundColor || el.style.backgroundColor;

    const _getDimensions = getDimensions(el, clone, w, h),
      width = _getDimensions.width,
      height = _getDimensions.height;

    if (el.tagName !== 'svg') {
      if (el.getBBox) {
        if (clone.getAttribute('transform') != null) {
          clone.setAttribute('transform', clone.getAttribute('transform').replace(/translate\(.*?\)/, ''));
        }
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.appendChild(clone);
        clone = svg;
      } else {
        console.error('Attempted to render non-SVG element', el);
        return;
      }
    }

    clone.setAttribute('version', '1.1');
    clone.setAttribute('viewBox', [left, top, width, height].join(' '));
    if (!clone.getAttribute('xmlns')) clone.setAttributeNS(xmlNs, 'xmlns', svgNs);
    if (!clone.getAttribute('xmlns:xlink')) clone.setAttributeNS(xmlNs, 'xmlns:xlink', 'http://www.w3.org/1999/xlink');

    if (responsive) {
      clone.removeAttribute('width');
      clone.removeAttribute('height');
      clone.setAttribute('preserveAspectRatio', 'xMinYMin meet');
    } else {
      clone.setAttribute('width', width * scale);
      clone.setAttribute('height', height * scale);
    }

    Array.from(clone.querySelectorAll('foreignObject > *')).forEach(function (foreignObject) {
      foreignObject.setAttributeNS(xmlNs, 'xmlns', foreignObject.tagName === 'svg' ? svgNs : xhtmlNs);
    });

    if (excludeCss) {
      const outer = document.createElement('div');
      outer.appendChild(clone);
      const src = outer.innerHTML;
      if (typeof done === 'function') done(src, width, height); else return { src: src, width: width, height: height };
    } else {
      return inlineCss(el, options).then(function (css) {
        const style = document.createElement('style');
        style.setAttribute('type', 'text/css');
        style.innerHTML = '<![CDATA[\n' + css + '\n]]>';

        const defs = document.createElement('defs');
        defs.appendChild(style);
        clone.insertBefore(defs, clone.firstChild);

        const outer = document.createElement('div');
        outer.appendChild(clone);
        const src = outer.innerHTML.replace(/NS\d+:href/gi, 'xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href');

        if (typeof done === 'function') done(src, width, height); else return { src: src, width: width, height: height };
      });
    }
  });
}

export function svgAsDataUri(el, options, done) {
  requireDomNode(el);
  return prepareSvg(el, options).then(function (_ref4) {
    const src = _ref4.src,
      width = _ref4.width,
      height = _ref4.height;

    const svgXml = 'data:image/svg+xml;base64,' + window.btoa(reEncode(doctype + src));
    if (typeof done === 'function') {
      done(svgXml, width, height);
    }
    return svgXml;
  });
}

export function svgAsPngUri(el, options, done) {
  requireDomNode(el);

  const _ref5 = options || {},
    _ref5$encoderType = _ref5.encoderType,
    encoderType = _ref5$encoderType === undefined ? 'image/png' : _ref5$encoderType,
    _ref5$encoderOptions = _ref5.encoderOptions,
    encoderOptions = _ref5$encoderOptions === undefined ? 0.8 : _ref5$encoderOptions,
    canvg = _ref5.canvg;

  const convertToPng = function convertToPng(_ref6) {
    const src = _ref6.src,
      width = _ref6.width,
      height = _ref6.height;

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = width * pixelRatio;
    canvas.height = height * pixelRatio;
    canvas.style.width = canvas.width + 'px';
    canvas.style.height = canvas.height + 'px';
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    if (canvg) canvg(canvas, src); else context.drawImage(src, 0, 0);

    let png;

    try {
      png = canvas.toDataURL(encoderType, encoderOptions);
    } catch (e) {
      // @ts-ignore
      // eslint-disable-next-line no-undef
      if (typeof SecurityError !== 'undefined' && e instanceof SecurityError || e.name === 'SecurityError') {
        console.error('Rendered SVG images cannot be downloaded in this browser.');
        return;
      } else throw e;
    }
    if (typeof done === 'function') done(png, canvas.width, canvas.height);
    return Promise.resolve(png);
  };

  if (canvg) return prepareSvg(el, options).then(convertToPng); else return svgAsDataUri(el, options).then(function (uri) {
    return new Promise(function (resolve, reject) {
      const image = new Image();
      image.onload = function () {
        return resolve(convertToPng({
          src: image,
          width: image.width,
          height: image.height
        }));
      };
      image.onerror = function () {
        reject('There was an error loading the data URI as an image on the following SVG\n' + window.atob(uri.slice(26)) + 'Open the following link to see browser\'s diagnosis\n' + uri);
      };
      image.src = uri;
    });
  });
}

export function download(name, uri, options) {
  // @ts-ignore
  if (navigator.msSaveOrOpenBlob) navigator.msSaveOrOpenBlob(uriToBlob(uri), name); else {
    const saveLink = document.createElement('a');
    if ('download' in saveLink) {
      saveLink.download = name;
      saveLink.style.display = 'none';
      document.body.appendChild(saveLink);
      try {
        const blob = uriToBlob(uri);
        const url = URL.createObjectURL(blob);
        saveLink.href = url;
        saveLink.onclick = function () {
          return requestAnimationFrame(function () {
            return URL.revokeObjectURL(url);
          });
        };
      } catch (e) {
        console.error(e);
        console.warn('Error while getting object URL. Falling back to string URL.');
        saveLink.href = uri;
      }
      saveLink.click();
      document.body.removeChild(saveLink);
    } else if (options && options.popup) {
      options.popup.document.title = name;
      options.popup.location.replace(uri);
    }
  }
}

export function saveSvg(el, name, options) {
  const downloadOpts = downloadOptions(); // don't inline, can't be async
  return requireDomNodePromise(el).then(function (el) {
    return svgAsDataUri(el, options || {});
  }).then(function (uri) {
    return download(name, uri, downloadOpts);
  });
}

export function saveSvgAsPng(el, name, options) {
  const downloadOpts = downloadOptions(); // don't inline, can't be async
  return requireDomNodePromise(el).then(function (el) {
    return svgAsPngUri(el, options || {});
  }).then(function (uri) {
    return download(name, uri, downloadOpts);
  });
}
