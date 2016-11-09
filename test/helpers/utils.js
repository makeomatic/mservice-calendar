class Utils {
  static debug(result, printValue) {
    if (result.isRejected()) {
      const err = result.reason();
      // console.log(require('util').inspect(err, {depth: 5}) + '\n'); // eslint-disable-line
      console.log(err && err.stack || err); // eslint-disable-line
      console.log(err && err.response || ''); // eslint-disable-line
    }

    if (printValue && result.isFulfilled()) {
      console.log(result.value());
    }
  }
}

Utils.duration = 20 * 1000;

module.exports = Utils;
