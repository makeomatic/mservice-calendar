// The MIT License (MIT)
//
// Copyright (c) 2014 Adam Paszke
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

/* eslint-disable no-use-before-define */
const net = require('net');

const ping = (options, callback) => {
  let i = 0;
  let results = false;
  options.address = options.address || 'localhost';
  options.port = options.port || 80;
  options.attempts = options.attempts || 10;
  options.timeout = options.timeout || 5000;

  const connect = (opts, next) => {
    const s = new net.Socket();
    let timer;

    s.on('connect', () => {
      clearTimeout(timer);
      s.destroy();
      results = true;
      i++;
      check(opts, next);
    });

    s.on('error', () => {
      clearTimeout(timer);
      s.destroy();
      results = false;
      i++;
      check(opts, next);
    });

    s.connect(opts.port, opts.address);

    timer = setTimeout(() => {
      results = false;
      s.destroy();
      i++;
      check(opts, callback);
    }, opts.timeout);
  };

  const check = (opts, next) => {
    if (i < options.attempts && !results) {
      setTimeout(() => connect(opts, next), options.timeout);
    } else {
      next(null, results);
    }
  };

  connect(options, callback);
};

module.exports.ping = ping;
