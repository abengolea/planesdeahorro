/**
 * Preload para ejecutar código con `import 'server-only'` bajo tsx/node puro.
 * Next.js reemplaza ese módulo en build; en scripts hace falta stub.
 */
const Module = require('module');
const origLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'server-only') {
    return {};
  }
  return origLoad.apply(this, arguments);
};
