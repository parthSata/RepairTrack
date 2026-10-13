import { config } from 'dotenv'
import { spawnSync } from 'node:child_process'
import packageJson from '../package.json'

config({ path: '.env.local' })

// Styling tokens for clean terminal readability
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
}

function logError(title: string, message: string) {
  console.error(`\n${colors.red}${colors.bold}✖ ${title}${colors.reset}`)
  console.error(`${colors.yellow}${message}${colors.reset}\n`)
}

function main() {
  const primaryDbUrl = process.env.DATABASE_URL?.trim()
  const testDbUrl = process.env.TEST_DATABASE_URL?.trim()

  console.log(`\n${colors.cyan}${colors.bold}RepairTrack Integration Test Runner${colors.reset}`)
  console.log(`${colors.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)

  if (!testDbUrl) {
    logError(
      'TEST_DATABASE_URL is not set',
      'Integration tests execute live database migrations and fixture mutations.\n' +
        'Please define TEST_DATABASE_URL in .env.local or your environment pointing\n' +
        'to a dedicated isolated test database.',
    )
    process.exit(1)
  }

  if (primaryDbUrl && testDbUrl === primaryDbUrl) {
    logError(
      'TEST_DATABASE_URL cannot match DATABASE_URL',
      'Safety guard blocked test execution: TEST_DATABASE_URL must be distinct from\n' +
        'DATABASE_URL to prevent destructive mutations or test resets against primary data.',
    )
    process.exit(1)
  }

  const verifyScripts = Object.keys(packageJson.scripts).filter((name) =>
    name.startsWith('verify:'),
  )

  if (verifyScripts.length === 0) {
    console.log(`${colors.yellow}No verify:* scripts found in package.json.${colors.reset}\n`)
    process.exit(0)
  }

  console.log(
    `${colors.dim}Found ${verifyScripts.length} verification scripts to run against test database.${colors.reset}\n`,
  )

  const childEnv = {
    ...process.env,
    DATABASE_URL: testDbUrl,
  }

  const startTime = Date.now()

  for (let i = 0; i < verifyScripts.length; i++) {
    const scriptName = verifyScripts[i]!
    const stepLabel = `[${i + 1}/${verifyScripts.length}]`

    console.log(
      `${colors.bold}${stepLabel} Running ${colors.cyan}${scriptName}${colors.reset}...`,
    )

    const result = spawnSync('bun', ['run', scriptName], {
      env: childEnv,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })

    if (result.status !== 0) {
      const exitCode = result.status ?? 1
      logError(
        `Verification failed: ${scriptName}`,
        `Script exited with status code ${exitCode}. Halting integration suite.`,
      )
      process.exit(exitCode)
    }

    console.log(`${colors.green}✔ ${scriptName} passed${colors.reset}\n`)
  }

  const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1)
  console.log(`${colors.dim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`)
  console.log(
    `${colors.green}${colors.bold}✔ All ${verifyScripts.length} verification scripts passed successfully in ${elapsedSec}s.${colors.reset}\n`,
  )
}

main()
