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
    let runAt = Date.now();

    if (per >= 0) {
      let cull = true;

      // Clean up calls that have left the rolling window.
      do {
        if (runAt - rollWindow[0] > per) {
          rollWindow.shift();
        } else {
          cull = false;
        }
      } while(cull);
    
      if (evenly) {
        runAt = Math.max(runAt, (rollWindow[rollWindow.length - 1] || 0) + (per / to));
      }
    } else if (rollWindow.length >= to) {
      done = true;
      
      throw new Error('Limit reached.');
    }

    if (rollWindow.length >= to) {
      runAt = Math.max(runAt, rollWindow[rollWindow.length - to] + per);
    }
    
    rollWindow.push(runAt);

    return Math.max(0, runAt - Date.now());
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
