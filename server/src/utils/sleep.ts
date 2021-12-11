// Artifical Delay
function sleep(ms: number) {
    // `delay` returns a promise
    return new Promise(function (resolve, reject) {
      // Only `delay` is able to resolve or reject the promise
      setTimeout(function () {
        resolve(42); // After 3 seconds, resolve the promise with value 42
      }, ms);
    });
}

  export default sleep;
  