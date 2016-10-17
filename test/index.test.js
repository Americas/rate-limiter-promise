const limiter = require("../");

describe("Rate limiter", () => {
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
      };

      try {
        await limited(5);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Limit reached.");
      };
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
      };
    });

    it("should throw error if wrapped function resolves to error", async () => {
      const mult = a => {
        if (a === 2) return Promise.resolve(4);
        else return Promise.reject(Error("Original function error."));
      };
      const limited = limiter(mult).to(2);

      const res1 = await limited(2);

      expect(res1).toEqual(4);

      try {
        await limited(4);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Original function error.");
      };
    });
  });

  describe("to()", () => {
    it("should limit a function to one call", async () => {
      const mult = a => a*a;
      const limited = limiter(mult).to("lala");

      const res1 = await limited(2);
      expect(res1).toEqual(4);

      try {
        await limited(4);
      } catch (e) {
        expect(e).toBeInstanceOf(Error);
        expect(e.message).toEqual("Limit reached.");
      };
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
      };
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
      };
    });
  });

  describe("per()", () => {
    it("should limit a function to one calls every 1 second", async () => {
      const mult = a => a*a;
      const limited = limiter(mult).per(1000);

      const start = new Date();

      const res1 = await limited(2);
      const res2 = await limited(3);

      const end = new Date();

      expect(res1).toEqual(4);
      expect(res2).toEqual(9);
      expect(end - start).toBeGreaterThanOrEqual(1000);
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
      expect(mid - start).toBeLessThanOrEqual(10);
      expect(end - start).toBeGreaterThanOrEqual(1000);
    });
  });

  describe("evenly()", () => {
    it("should call the function every ~111ms", async () => {
      const mult = a => a*a;
      const limited = limiter(mult).to(9).per(1000).evenly(true);

      const start = new Date();

      const res1 = await limited(2);

      const res2 = await limited(3);

      const mid = new Date();

      const res3 = await limited(4);

      const end = new Date();

      expect(res1).toEqual(4);
      expect(res2).toEqual(9);
      expect(res3).toEqual(16);
      expect(mid - start).toBeGreaterThanOrEqual(100);
      expect(end - mid).toBeGreaterThanOrEqual(100);
      expect(end - start).toBeGreaterThanOrEqual(200);
    });
  });
});
