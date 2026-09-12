/**
 * E2E Test Suite Framework Utilities
 * Lightweight, zero-dependency, opaque-box test harness for Node.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class TestRegistry {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.totalPass = 0;
    this.totalFail = 0;
    this.totalSkip = 0;
    this.failures = [];
  }

  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0,
      durationMs: 0
    };
    this.suites.push(suite);
    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    try {
      fn();
    } finally {
      this.currentSuite = prevSuite;
    }
  }

  it(name, fn) {
    if (!this.currentSuite) {
      throw new Error(`Test "${name}" must be placed inside a describe() block`);
    }
    this.currentSuite.tests.push({ name, fn });
  }

  async runSuite(suite) {
    const startTime = Date.now();
    for (const test of suite.tests) {
      const testStart = Date.now();
      try {
        await test.fn();
        const duration = Date.now() - testStart;
        test.status = 'PASS';
        test.duration = duration;
        suite.passed++;
        this.totalPass++;
      } catch (err) {
        const duration = Date.now() - testStart;
        test.status = 'FAIL';
        test.duration = duration;
        test.error = err;
        suite.failed++;
        this.totalFail++;
        this.failures.push({
          suite: suite.name,
          test: test.name,
          error: err
        });
      }
    }
    suite.durationMs = Date.now() - startTime;
  }

  async runAll() {
    this.totalPass = 0;
    this.totalFail = 0;
    this.totalSkip = 0;
    this.failures = [];
    const overallStart = Date.now();

    for (const suite of this.suites) {
      await this.runSuite(suite);
    }

    const overallDuration = Date.now() - overallStart;
    return {
      suites: this.suites,
      totalPass: this.totalPass,
      totalFail: this.totalFail,
      totalCount: this.totalPass + this.totalFail,
      durationMs: overallDuration,
      failures: this.failures
    };
  }
}

const registry = new TestRegistry();

function describe(name, fn) {
  registry.describe(name, fn);
}

function it(name, fn) {
  registry.it(name, fn);
}

const test = it;

function assert(condition, message = 'Assertion failed') {
  if (!condition) {
    const err = new Error(message);
    Error.captureStackTrace(err, assert);
    throw err;
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    const detail = message ? `${message}: ` : '';
    const err = new Error(`${detail}Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    Error.captureStackTrace(err, assertEqual);
    throw err;
  }
}

function assertDeepEqual(actual, expected, message) {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    const detail = message ? `${message}: ` : '';
    const err = new Error(`${detail}Deep equality mismatch:\nExpected: ${expectedStr}\nActual:   ${actualStr}`);
    Error.captureStackTrace(err, assertDeepEqual);
    throw err;
  }
}

function assertApprox(actual, expected, tolerance = 0.001, message) {
  if (Math.abs(actual - expected) > tolerance) {
    const detail = message ? `${message}: ` : '';
    const err = new Error(`${detail}Expected ~${expected} (±${tolerance}), got ${actual}`);
    Error.captureStackTrace(err, assertApprox);
    throw err;
  }
}

function assertInRange(value, min, max, message) {
  if (value < min || value > max) {
    const detail = message ? `${message}: ` : '';
    const err = new Error(`${detail}Expected value in range [${min}, ${max}], got ${value}`);
    Error.captureStackTrace(err, assertInRange);
    throw err;
  }
}

function sha256File(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

module.exports = {
  registry,
  describe,
  it,
  test,
  assert,
  assertEqual,
  assertDeepEqual,
  assertApprox,
  assertInRange,
  sha256File
};
