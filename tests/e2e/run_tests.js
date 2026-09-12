#!/usr/bin/env node

/**
 * Portfolio Scroll-Driven Transparent Video Engine
 * Automated Opaque-Box E2E Test Suite Runner
 *
 * Implements the 4-Tier Test Architecture from TEST_INFRA.md:
 * - Tier 1: Feature Coverage (≥50 test cases, 5 per feature across 10 features)
 * - Tier 2: Boundary & Corner Cases (≥50 test cases, 5 per feature across 10 features)
 * - Tier 3: Cross-Feature Combinations (≥10 pairwise combinatorial test cases)
 * - Tier 4: Real-World Scenarios (≥5 realistic workload scenarios)
 *
 * Total tests: ≥ 115 tests
 * Command: node tests/e2e/run_tests.js
 * Exit code: 0 on 100% pass, non-zero on any failure.
 */

const path = require('path');
const { registry } = require('./helpers/test_utils');

// Require all test suites to register them in the runner
require('./tier1_feature_coverage.test');
require('./tier2_boundary_corner.test');
require('./tier3_cross_feature.test');
require('./tier4_real_world.test');

// ANSI Color Helpers
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function main() {
  console.log('\n' + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.white + '  PORTFOLIO SCROLL-DRIVEN TRANSPARENT VIDEO ENGINE' + colors.reset);
  console.log(colors.cyan + '  Automated Opaque-Box E2E Test Suite (Tiers 1 - 4)' + colors.reset);
  console.log(colors.dim + `  Execution Date: ${new Date().toISOString()} | Node.js ${process.version}` + colors.reset);
  console.log(colors.cyan + '='.repeat(80) + colors.reset + '\n');

  const startTime = Date.now();
  const results = await registry.runAll();
  const totalDuration = Date.now() - startTime;

  // Group suites by Tier
  const tierSummary = {
    'Tier 1 (Feature Coverage)': { total: 0, passed: 0, failed: 0 },
    'Tier 2 (Boundary & Corner Cases)': { total: 0, passed: 0, failed: 0 },
    'Tier 3 (Cross-Feature Combinations)': { total: 0, passed: 0, failed: 0 },
    'Tier 4 (Real-World Scenarios)': { total: 0, passed: 0, failed: 0 }
  };

  for (const suite of results.suites) {
    let tierKey = 'Tier 1 (Feature Coverage)';
    if (suite.name.includes('Boundary')) {
      tierKey = 'Tier 2 (Boundary & Corner Cases)';
    } else if (suite.name.includes('Tier 3')) {
      tierKey = 'Tier 3 (Cross-Feature Combinations)';
    } else if (suite.name.includes('Tier 4')) {
      tierKey = 'Tier 4 (Real-World Scenarios)';
    }

    tierSummary[tierKey].total += suite.tests.length;
    tierSummary[tierKey].passed += suite.passed;
    tierSummary[tierKey].failed += suite.failed;

    const suiteStatusColor = suite.failed === 0 ? colors.green : colors.red;
    const suiteStatusMark = suite.failed === 0 ? '✓' : '✗';
    console.log(`${suiteStatusColor}${suiteStatusMark}${colors.reset} ${colors.bright}${suite.name}${colors.reset} ${colors.dim}(${suite.passed}/${suite.tests.length} passed, ${suite.durationMs}ms)${colors.reset}`);

    for (const test of suite.tests) {
      if (test.status === 'PASS') {
        console.log(`  ${colors.green}•${colors.reset} ${test.name} ${colors.dim}(${test.duration}ms)${colors.reset}`);
      } else {
        console.log(`  ${colors.red}✗ ${test.name} (${test.duration}ms)${colors.reset}`);
        console.log(`    ${colors.red}${test.error?.message || test.error}${colors.reset}`);
      }
    }
    console.log();
  }

  // Summary Table
  console.log(colors.cyan + '-'.repeat(80) + colors.reset);
  console.log(colors.bright + colors.white + '  TIER COVERAGE SUMMARY TABLE' + colors.reset);
  console.log(colors.cyan + '-'.repeat(80) + colors.reset);
  console.log(
    colors.bright +
    '  Tier Name                             | Target | Executed | Passed | Failed | Pass Rate' +
    colors.reset
  );
  console.log('  ' + '-'.repeat(74));

  for (const [tierName, stats] of Object.entries(tierSummary)) {
    const target = tierName.includes('Tier 1') ? 50 : tierName.includes('Tier 2') ? 50 : tierName.includes('Tier 3') ? 10 : 5;
    const rate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) + '%' : '0.0%';
    const rateColor = stats.failed === 0 ? colors.green : colors.red;
    const paddedName = tierName.padEnd(37);
    const paddedTarget = String(target).padStart(6);
    const paddedExec = String(stats.total).padStart(8);
    const paddedPass = String(stats.passed).padStart(6);
    const paddedFail = String(stats.failed).padStart(6);
    const paddedRate = rate.padStart(9);
    console.log(`  ${paddedName} | ${paddedTarget} | ${paddedExec} | ${paddedPass} | ${paddedFail} | ${rateColor}${paddedRate}${colors.reset}`);
  }

  console.log('  ' + '-'.repeat(74));
  const overallRate = results.totalCount > 0 ? ((results.totalPass / results.totalCount) * 100).toFixed(1) + '%' : '0.0%';
  const overallColor = results.totalFail === 0 ? colors.green : colors.red;
  console.log(
    colors.bright +
    `  TOTAL ALL TIERS                       |    115 | ${String(results.totalCount).padStart(8)} | ${String(results.totalPass).padStart(6)} | ${String(results.totalFail).padStart(6)} | ${overallColor}${overallRate.padStart(9)}${colors.reset}`
  );
  console.log(colors.cyan + '-'.repeat(80) + colors.reset);
  console.log(`  Total Execution Time: ${formatDuration(totalDuration)}`);

  if (results.totalFail > 0) {
    console.log('\n' + colors.red + colors.bright + `  FAILURES: ${results.totalFail} test(s) failed!` + colors.reset);
    for (const fail of results.failures) {
      console.log(`\n  [${colors.yellow}${fail.suite}${colors.reset}] ${fail.test}`);
      console.log(`  ${colors.red}${fail.error.stack || fail.error.message}${colors.reset}`);
    }
    process.exit(1);
  } else {
    console.log('\n' + colors.green + colors.bright + `  SUCCESS: All ${results.totalPass} test cases passed with 100% success rate!` + colors.reset + '\n');
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('\nFatal test runner error:', err);
  process.exit(1);
});
