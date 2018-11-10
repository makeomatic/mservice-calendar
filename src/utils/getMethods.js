const { coroutine } = require('bluebird');

function isGenerator(obj) {
  return typeof obj.next === 'function' && typeof obj.throw === 'function';
}

function isGeneratorFunction({ constructor }) {
  if (!constructor) return false;
  if (constructor.name === 'GeneratorFunction' || constructor.displayName === 'GeneratorFunction') return true;
  return isGenerator(constructor.prototype);
}

function getAllMethodNames(_obj) {
  const methods = new Set();
  let obj = _obj;
  // eslint-disable-next-line no-cond-assign
  while (obj = Reflect.getPrototypeOf(obj)) {
    const keys = Reflect.ownKeys(obj);
    keys.forEach(k => methods.add(k));
  }
  return methods;
}

module.exports = getAllMethodNames;
module.exports.coroutine = function applyCoroutine(obj) {
  getAllMethodNames(obj).forEach((method) => {
    const fn = obj[method];
    if (isGeneratorFunction(fn)) {
      obj[method] = coroutine(fn);
    }
  });
};
