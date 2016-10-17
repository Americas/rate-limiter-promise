module.exports = (fn) => {
  const queue = [];

	let done = false;
	let evenly = false;
	let per = -1;
  let rollWindow = [];
	let timer = false;
	let to = 1;

	const drain = () => {
		const now = Date.now();

		rollWindow = rollWindow.filter(time => per < 0 ? true : (now - time < per));

		while(rollWindow.length < to && queue.length) {
			rollWindow.push(now);

			const run = queue.shift();

			try {
				const result = fn.apply(null, run.args);


        Promise.resolve(result).then(
          res => { run.promise.resolve(res); },
          error => { run.promise.reject(error); }
        );

				if (evenly) {
					break;
				}
			} catch (e) {
				run.promise.reject(e);
			}
		}

		if (queue.length <= 0 && !evenly) {
			timer = null;
		}
		else if (per > -1) {
			var delay = evenly ? (per / to) : (per - (now - rollWindow[0]));
			timer = setTimeout(drain, delay);
		}
		else {
			done = true;
      queue.forEach(run => run.promise.reject(new Error('Limit reached.')));
		}
	};

	const limiter = function () {
		const promise = new Promise((resolve, reject) => {

  		if (done) {
  			return reject(new Error('Limit reached.'));
  		}

      let i = arguments.length;
      const args = new Array(i);
      while (i--) args[i] = arguments[i];

      queue.push({ promise : { resolve, reject }, args });

      if (!timer) {
        timer = setImmediate(drain);
      }
    });

		return promise;
	};

	limiter.to = (count) => {
		if (count > 0 ) {
			to = +count;
		}

		return limiter;
	};

	limiter.per = (time) => {
		if (time > -1) {
			per = +time;
		}

		return limiter;
	};

	limiter.evenly = (value) => {
		evenly = !!value;

		return limiter;
	};

	return limiter;
};
