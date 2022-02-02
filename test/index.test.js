const limiter = require("../");

describe("Rate limiter", () => {
  const nativeSetInterval = global.setInterval;
  const timers = [];
  
  beforeAll(() => {
    global.setInterval = (...args) => {
      const timer = nativeSetInterval(...args);

      timers.push(timer);

      return timer;
    }
  });

  afterAll(() => {
    global.setInterval = nativeSetInterval;
  });

  afterEach(() => {
    while(timers.length) {
      clearInterval(timers.shift());
    }
  });

  describe("default", () => {
    it("should limit a function to one call", async () => {
      const mult = a => a*a;
      const limited = limiter(mult);

      const res1 = await limited(2);

      expect(res1).toEqual(4);

      try {
        await limited(4);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Limit reached.");
      }

      try {
        await limited(5);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Limit reached.");
      }
    });

    it("should throw error if wrapped function throws error", async () => {
      const mult = a => {
        if (a === 2) return 4;
        else throw new Error("Original function error.");
      };
      const limited = limiter(mult).to(2);

      const res1 = await limited(2);

      expect(res1).toEqual(4);

      try {
        await limited(4);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Original function error.");
      }
    });

    it("should throw error if wrapped function resolves to error", async () => {
      const mult = async a => {
        if (a === 2) return 4;
        else throw new Error("Original function error.");
      };
      const limited = limiter(mult).to(2);

      const res1 = await limited(2);

      expect(res1).toEqual(4);

      try {
        await limited(4);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Original function error.");
      }
    });
  });

  describe("to()", () => {
    it("should throw an error if `to()` is called with a value of zero or below", async () => {
      const mult = a => a*a;

      expect(() => limiter(mult).to(0)).toThrow('Invalid value provided to option `to`. Expected a value greater than 0.');
      expect(() => limiter(mult).to(-1)).toThrow('Invalid value provided to option `to`. Expected a value greater than 0.');
      expect(() => limiter(mult).to(-999)).toThrow('Invalid value provided to option `to`. Expected a value greater than 0.');
    });

    it("should limit a function to one call", async () => {
      const mult = a => a * a;
      const limited = limiter(mult).to("lala");

      const res1 = await limited(2);
      expect(res1).toEqual(4);

      try {
        await limited(4);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Limit reached.");
      }
    });

    it("should limit a function to two calls", async () => {
      const mult = a => a*a;
      const limited = limiter(mult).to(2);

      const res1 = await limited(2);
      expect(res1).toEqual(4);

      const res2 = await limited(3);
      expect(res2).toEqual(9);

      try {
        await limited(4);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Limit reached.");
      }
    });

    it("should limit a function to three calls", async () => {
      const mult = a => a*a;
      const limited = limiter(mult).to(3);

      const res1 = await limited(2);
      expect(res1).toEqual(4);

      const res2 = await limited(3);
      expect(res2).toEqual(9);

      const res3 = await limited(4);
      expect(res3).toEqual(16);

      try {
        await limited(5);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Limit reached.");
      }
    });
  });

  describe("per()", () => {
    it("should throw an error if `per()` is called with a value of zero or below", async () => {
      const mult = a => a*a;

      expect(() => limiter(mult).per(0)).toThrow('Invalid value provided to option `per`. Expected a value greater than 0.');
      expect(() => limiter(mult).per(-1)).toThrow('Invalid value provided to option `per`. Expected a value greater than 0.');
      expect(() => limiter(mult).per(-999)).toThrow('Invalid value provided to option `per`. Expected a value greater than 0.');
    });

    it("should limit a function to one call every 1 second", async () => {
      const mult = a => a*a;
      const limited = limiter(mult).per(1000);

      const start = new Date();

      const res1 = await limited(2);
      const res2 = await limited(3);

      const mid = new Date();
      
      const res3 = await limited(4);
      
      const end = new Date();

      expect(res1).toEqual(4);
      expect(res2).toEqual(9);
      expect(res3).toEqual(16);
      expect(mid - start).toBeGreaterThanOrEqual(1000);
      expect(end - start).toBeGreaterThanOrEqual(2000);
    });

    it("should limit a function to 2 calls every 1 second", async () => {
      const mult = a => a*a;
      const limited = limiter(mult).to(2).per(1000);

      const start = new Date();

      const res1 = await limited(2);
      const res2 = await limited(3);

      const mid = new Date();

      const res3 = await limited(4);

      const end = new Date();

      expect(res1).toEqual(4);
      expect(res2).toEqual(9);
      expect(res3).toEqual(16);
      expect(mid - start).toBeLessThanOrEqual(100);
      expect(end - start).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("evenly()", () => {
    it("should call the function every ~100ms", async () => {
      const mult = a => a*a;
      const limited = limiter(mult).to(10).per(1000).evenly(true);

      const start = Date.now();

      const res1 = await limited(2);
      const res2 = await limited(3);

      const mid = Date.now();

      const res3 = await limited(4);

      const end = Date.now();

      expect(res1).toEqual(4);
      expect(res2).toEqual(9);
      expect(res3).toEqual(16);

      expect(mid - start).toBeGreaterThanOrEqual(97);
      expect(mid - start).toBeLessThanOrEqual(103);

      expect(end - mid).toBeGreaterThanOrEqual(97);
      expect(end - mid).toBeLessThanOrEqual(103);

      expect(end - start).toBeGreaterThanOrEqual(197);
      expect(end - start).toBeLessThanOrEqual(203);
    });
  });
});
