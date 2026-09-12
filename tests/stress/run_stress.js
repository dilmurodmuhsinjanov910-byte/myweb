#!/usr/bin/env node

/**
 * Challenger 1: Concurrency & Stress Test Runner
 * Executes the adversarial stress suite against production DualControlPhysics and VideoScrubEngine
 */

const { registry } = require('../e2e/helpers/test_utils');

// Require stress suite
require('./stress_concurrency.test');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

async function run() {
  console.log('\n' + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.white + '  CHALLENGER 1: CONCURRENCY & STRESS TEST HARNESS' + colors.reset);
  console.log(colors.cyan + '  Empirical Stress Testing of DualControlPhysics & VideoScrubEngine' + colors.reset);
  console.log(colors.dim + `  Execution Date: ${new Date().toISOString()} | Node.js ${process.version}` + colors.reset);
  console.log(colors.cyan + '='.repeat(80) + colors.reset + '\n');

  const startTime = Date.now();
  const results = await registry.runAll();
  const totalDuration = Date.now() - startTime;

  for (const suite of results.suites) {
    const suiteStatusColor = suite.failed === 0 ? colors.green : colors.red;
    const suiteStatusMark = suite.failed === 0 ? '✓' : '✗';
    console.log(`${suiteStatusColor}${suiteStatusMark}${colors.reset} ${colors.bright}${suite.name}${colors.reset} ${colors.dim}(${suite.passed}/${suite.tests.length} passed, ${suite.durationMs}ms)${colors.reset}`);

    for (const test of suite.tests) {
      if (test.status === 'PASS') {
        console.log(`  ${colors.green}•${colors.reset} ${test.name} ${colors.dim}(${test.duration}ms)${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✗ ${test.name} (${test.duration}ms)${colors.reset}`);
        console.log(`    ${colors.red}${test.error?.message || test.error}${colors.reset}`);
        if (test.error?.stack) {
          console.log(`    ${colors.dim}${test.error.stack}${colors.reset}`);
        }
      }
    }
    console.log();
  }

  console.log(colors.cyan + '-'.repeat(80) + colors.reset);
  console.log(colors.bright + `  TOTAL TESTS: ${results.totalCount} | PASSED: ${results.totalPass} | FAILED: ${results.totalFail}` + colors.reset);
  console.log(colors.dim + `  Total Execution Time: ${totalDuration}ms` + colors.reset);
  console.log(colors.cyan + '-'.repeat(80) + colors.reset + '\n');

  if (results.totalFail > 0) {
    console.error(colors.red + `FAIL: ${results.totalFail} stress tests failed!` + colors.reset);
    process.exit(1);
  } else {
    console.log(colors.green + `SUCCESS: All ${results.totalPass} concurrency & stress tests PASSED with 100% success rate!` + colors.reset);
    process.exit(0);
  }
}

run().catch(err => {
  console.error('Fatal error running stress harness:', err);
  process.exit(1);
});
