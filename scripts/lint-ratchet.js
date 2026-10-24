const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASELINE_PATH = path.join(__dirname, '..', '.lint-baseline.json');

function runLintRatchet() {
  console.log('🔍 Running Incremental Lint Ratchet Check...');

  let baseline = { maxAllowedViolations: 338 };
  if (fs.existsSync(BASELINE_PATH)) {
    try {
      baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    } catch (e) {
      console.warn('⚠️ Could not parse .lint-baseline.json, using default fallback.');
    }
  }

  let totalProblems = 0;
  try {
    const rawOutput = execSync('npm run lint --prefix client -- -f json', {
      encoding: 'utf8',
      cwd: path.join(__dirname, '..'),
      maxBuffer: 10 * 1024 * 1024,
    });

    // Strip npm output lines if present before JSON bracket
    const jsonStart = rawOutput.indexOf('[');
    const jsonString = jsonStart !== -1 ? rawOutput.substring(jsonStart) : rawOutput;

    const results = JSON.parse(jsonString);
    totalProblems = results.reduce(
      (sum, r) => sum + r.errorCount + r.warningCount,
      0
    );
  } catch (err) {
    if (err.stdout) {
      try {
        const jsonStart = err.stdout.indexOf('[');
        const jsonString = jsonStart !== -1 ? err.stdout.substring(jsonStart) : err.stdout;

        const results = JSON.parse(jsonString);
        totalProblems = results.reduce(
          (sum, r) => sum + r.errorCount + r.warningCount,
          0
        );
      } catch (parseErr) {
        console.error('❌ Failed to parse ESLint JSON output:', parseErr);
        process.exit(1);
      }
    } else {
      console.error('❌ Failed to run ESLint:', err.message);
      process.exit(1);
    }
  }

  console.log(`📊 Current Lint Violations: ${totalProblems}`);
  console.log(`🎯 Baseline Max Allowed:    ${baseline.maxAllowedViolations}`);

  if (totalProblems > baseline.maxAllowedViolations) {
    console.error(
      `❌ LINT RATCHET FAILED: New lint violations introduced! (${totalProblems} > ${baseline.maxAllowedViolations})`
    );
    process.exit(1);
  } else if (totalProblems < baseline.maxAllowedViolations) {
    console.log(
      `🎉 LINT DEBT REDUCED! Ratcheting baseline down from ${baseline.maxAllowedViolations} to ${totalProblems}.`
    );
    const updatedBaseline = {
      maxAllowedViolations: totalProblems,
      lastUpdated: new Date().toISOString(),
    };
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(updatedBaseline, null, 2));
    console.log('✅ Updated .lint-baseline.json successfully.');
  } else {
    console.log('✅ LINT RATCHET PASSED: No new lint violations introduced.');
  }
}

runLintRatchet();
