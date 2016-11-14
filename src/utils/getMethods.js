const { coroutine } = require('bluebird');
const is = require('is');

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
    if (is.fn(fn)) obj[method] = coroutine(fn);
  });
};
