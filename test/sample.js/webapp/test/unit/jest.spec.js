/**
 * @test/sample.js/webapp/test/unit/jest.spec.js
 * Create a spec file that illustrates *all* features of jest testing framework.
 * For instance, use nested describes, beforeAll, beforeEach, afterEach, afterAll.
 * In the test, assess that the nesting and relevant before/after functions are called appropriately.
 * The create test cases for jest.spyOn and associated functions.
 * Also create test cases to illustrate all the existing expectations.
 */

describe('Jest Features Showcase', () => {
  // 1. Hooks and nested describes
  describe('Hooks and Execution Order', () => {
    const executionOrder = []
    let testCount = 0

    beforeAll(() => {
      executionOrder.push('outer beforeAll')
    })

    beforeEach(() => {
      executionOrder.push('outer beforeEach')
      ++testCount
    })

    afterEach(() => {
      executionOrder.push('outer afterEach')
    })

    afterAll(() => {
      executionOrder.push('outer afterAll')
      // This is the final state, let's test it here.
      expect(executionOrder).toEqual([
        'outer beforeAll',
        'outer beforeEach',
        'outer test',
        'outer afterEach',
        'inner beforeAll',
        'outer beforeEach',
        'inner beforeEach',
        'inner test',
        'inner afterEach',
        'outer afterEach',
        'inner afterAll',
        'outer afterAll'
      ])
    })

    test('outer test', () => {
      executionOrder.push('outer test')
      expect(testCount).toBe(1)
    })

    describe('Nested Describe', () => {
      beforeAll(() => {
        executionOrder.push('inner beforeAll')
      })

      beforeEach(() => {
        executionOrder.push('inner beforeEach')
      })

      afterEach(() => {
        executionOrder.push('inner afterEach')
      })

      afterAll(() => {
        executionOrder.push('inner afterAll')
      })

      test('inner test', () => {
        executionOrder.push('inner test')
        expect(testCount).toBe(2)
      })
    })
  })

  // 2. Spies and Mocks
  describe('Spies and Mocks', () => {
    const calculator = {
      add: (a, b) => a + b
    }

    test('jest.spyOn', () => {
      const addSpy = jest.spyOn(calculator, 'add')
      const result = calculator.add(2, 3)

      expect(result).toBe(5)
      expect(addSpy).toHaveBeenCalled()
      expect(addSpy).toHaveBeenCalledTimes(1)
      expect(addSpy).toHaveBeenCalledWith(2, 3)

      addSpy.mockRestore() // Clean up the spy
    })

    test('jest.spyon twice', () => {
      const addSpy1 = jest.spyOn(calculator, 'add')
      const addSpy2 = jest.spyOn(calculator, 'add')
      expect(addSpy1).toStrictEqual(addSpy2)
      calculator.add(2, 3)
      expect(addSpy1).toHaveBeenCalled()
      expect(addSpy2).toHaveBeenCalled()
      addSpy2.mockRestore() // Clean up the spy
    })

    test('jest.fn() for mock functions', () => {
      const mockCallback = jest.fn(x => 42 + x);
      [0, 1].forEach(mockCallback)
      expect(mockCallback(2)).toBe(44)

      expect(mockCallback.mock.calls.length).toBe(3)
      expect(mockCallback.mock.calls[0][0]).toBe(0)
      expect(mockCallback.mock.results[0].value).toBe(42)
    })

    test('mockImplementation', () => {
      const myMock = jest.fn()
      const result = myMock.mockImplementation(() => 'mocked value')
      expect(result).toStrictEqual(myMock)
      expect(myMock()).toBe('mocked value')
    })

    test('mockReturnValue', () => {
      const myMock = jest.fn()
      myMock.mockReturnValue('mocked return')
      expect(myMock()).toBe('mocked return')
    })

    test('mockReturnValueOnce', () => {
      const mockCallback = jest.fn(x => 42 + x)
      mockCallback.mockReturnValueOnce(0)
      expect(mockCallback(0)).toStrictEqual(0)
      expect(mockCallback(0)).toStrictEqual(42)
    })

    test('mockResolvedValue', async () => {
      const myMock = jest.fn()
      myMock.mockResolvedValue('OK')
      expect(await myMock()).toStrictEqual('OK')
    })

    test('mockResolvedValueOnce', async () => {
      const myMock = jest.fn()
      myMock.mockResolvedValue('OK')
      myMock.mockResolvedValueOnce('KO')
      expect(await myMock()).toStrictEqual('KO')
      expect(await myMock()).toStrictEqual('OK')
    })
  })

  // 3. Matchers
  describe('Jest Matchers', () => {
    // Truthiness
    test('.toBeNull()', () => {
      expect(null).toBeNull()
    })
    test('.toBeDefined()', () => {
      expect(1).toBeDefined()
    })
    test('.toBeUndefined()', () => {
      expect(undefined).toBeUndefined()
    })
    test('.toBeTruthy()', () => {
      expect(true).toBeTruthy()
      expect(1).toBeTruthy()
      expect('hello').toBeTruthy()
    })
    test('.toBeFalsy()', () => {
      expect(false).toBeFalsy()
      expect(0).toBeFalsy()
      expect('').toBeFalsy()
    })
    test('.toBeNaN()', () => {
      expect(NaN).toBeNaN()
    })

    // Equality
    test('.toBe()', () => {
      expect(1).toBe(1)
      const obj = {}
      expect(obj).toBe(obj) // Same object reference
    })

    test('.toEqual()', () => {
      const obj1 = { a: 1 }
      const obj2 = { a: 1 }
      expect(obj1).toEqual(obj2) // Deep equality
      expect([1, 2, 3]).toEqual([1, 2, 3])
    })

    // Numbers
    test('.toBeGreaterThan()', () => {
      expect(10).toBeGreaterThan(5)
    })
    test('.toBeGreaterThanOrEqual()', () => {
      expect(10).toBeGreaterThanOrEqual(10)
    })
    test('.toBeLessThan()', () => {
      expect(5).toBeLessThan(10)
    })
    test('.toBeLessThanOrEqual()', () => {
      expect(10).toBeLessThanOrEqual(10)
    })
    test('.toBeCloseTo()', () => {
      expect(0.1 + 0.2).toBeCloseTo(0.3)
    })

    // Strings
    test('.toMatch()', () => {
      expect('hello world').toMatch(/world/)
    })

    // Arrays and iterables
    test('.toContain()', () => {
      expect([1, 2, 3]).toContain(2)
      expect('hello').toContain('ell')
    })

    // Exceptions
    test('.toThrow()', () => {
      const throwError = () => {
        throw new Error('it broke')
      }
      expect(throwError).toThrow()
      expect(throwError).toThrow(Error)
      expect(throwError).toThrow('it broke')
      expect(throwError).toThrow(/broke/)
    })

    // Asymmetric Matchers
    test.skip('asymmetric matchers', () => {
      expect({ a: 1, b: 'hello' }).toEqual({
        a: expect.any(Number),
        b: expect.any(String)
      })
      expect([1, 'hello', { c: 3 }]).toEqual(expect.arrayContaining([1, 'hello']))
      expect({ a: 1, b: 2 }).toEqual(expect.objectContaining({ a: 1 }))
      expect('long string').toEqual(expect.stringContaining('string'))
      expect('string with numbers 123').toEqual(expect.stringMatching(/[0-9]+/))
    })

    // .not
    test('.not', () => {
      expect(1).not.toBe(2)
      expect({ a: 1 }).not.toEqual({ a: 2 })
    })

    // Assertions count
    test.skip('assertions count', () => {
      expect.hasAssertions()
      expect(1).toBe(1)
      expect(true).toBeTruthy()
      expect.assertions(2)
    })

    test.todo('other specificities')
  })
})
