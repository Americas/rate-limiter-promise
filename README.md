# rate-limiter-promise

A simple library to wrap methods with rate limiting.

[![npm version](https://badge.fury.io/js/rate-limiter-promise.svg)](https://badge.fury.io/js/rate-limiter-promise) [![Test](https://github.com/Americas/rate-limiter-promise/actions/workflows/test.yaml/badge.svg?branch=master)](https://github.com/Americas/rate-limiter-promise/actions/workflows/test.yaml)

## Instalation

To install simply run:

```sh
$ npm install rate-limiter-promise
```

Or, if you use yarn:

```sh
$ yarn add rate-limiter-promise
```

## Example usage

```js
const limiter = require('rate-limiter-promise');
const fn = a => a*a;
const limitedFn = limiter(fn).to(1).per(1000);

const a = await limitedFn(2);
```

## Test

To test, simply run:

```sh
$ npm test
```

You can also check for linting errors:

```sh
$ npm run lint
```

## License

Unlicense
