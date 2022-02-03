/**
 * Rate limiter wrapping function.
 * 
 * @param {Function} fn - The function to wrap in the rate limiter.
 */

module.exports = (fn) => {
  let done = false;
  let evenly = false;
  let per = -1;
  let rollWindow = [];
  let to = 1;

  function getDelay() {
    let delay;

    if (per >= 0) {
      if (evenly) {
        delay = rollWindow[rollWindow.length - 1] + (per / to);
      } else if (rollWindow.length >= to) {
        delay = rollWindow[rollWindow.length - to] + per;
      }
    } else if (rollWindow.length >= to) {
      done = true;

      throw new Error('Limit reached.');
    }
    
    rollWindow.push(delay || Date.now());

    return delay ? delay - Date.now() : 0;
  }

  /**
   * Wrapped function that checks the rate limits. 
   *  
   * @param  {...any} args - The arguments to pass to the wrapped function.
   */

  const limiter = async function (...args) {
    if (done) {
      throw new Error('Limit reached.');
    }

    const delay = getDelay();

    if (delay) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    return await fn.apply(null, args);
  };

  /**
   * Set the maximum number of calls the function can be called.
   * 
   * @param {number} count 
   */

  limiter.to = (count) => {
    if (count <= 0) {
      throw new Error('Invalid value provided to option `to`. Expected a value greater than 0.')
    }
    
    to = +count;

    return limiter;
  };

  /**
   * Set the time window to count function calls towards the maximum number of calls.
   * 
   * @param {number} time 
   */
  limiter.per = (time) => {
    if (time <= 0) {
      throw new Error('Invalid value provided to option `per`. Expected a value greater than 0.')
    }

    // Clean up calls that have left the rolling window if `per` is being defined for the first time.
    if (per === -1) {
      setInterval(() => {
        const now = Date.now();
        
        // eslint-disable-next-line no-constant-condition
        while (now - rollWindow[0] > per) {
          rollWindow.shift();
        }
      }, 5000);
    }

    per = +time;

    return limiter;
  };
  
  /**
   * Set the limiter to evenly distribute the calls in the time window.
   * 
   * @param {boolean} value 
   */

  limiter.evenly = (value) => {
    evenly = !!value;

    return limiter;
  };

  return limiter;
};
