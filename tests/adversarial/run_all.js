/**
 * Challenger 2: Master Adversarial Runner
 * Executes both Asset Integrity & Video Scrub Engine Stress Suites
 */

const { execSync } = require('child_process');
const path = require('path');

function run() {
  console.log('========================================================================');
  console.log('   CHALLENGER 2: MASTER ADVERSARIAL VERIFICATION & STRESS SUITE');
  console.log('========================================================================\n');

  const scripts = [
    { name: 'Video Assets & Parity Verification', file: 'verify_assets_and_integrity.js' },
    { name: 'Scrub Engine & Physics Stress Suite', file: 'stress_scrub_engine.test.js' }
  ];

  let totalPassed = 0;
  for (const s of scripts) {
    console.log(`\n>> Executing: ${s.name} (${s.file})...`);
    const fullPath = path.join(__dirname, s.file);
    try {
      execSync(`node "${fullPath}"`, { stdio: 'inherit' });
      totalPassed++;
    } catch (err) {
      console.error(`\nFAILED: ${s.name}`);
      process.exit(1);
    }
  }

  console.log('\n========================================================================');
  console.log(`   ALL ${totalPassed}/${scripts.length} CHALLENGER 2 ADVERSARIAL SUITES PASSED!`);
  console.log('========================================================================\n');
}

run();
