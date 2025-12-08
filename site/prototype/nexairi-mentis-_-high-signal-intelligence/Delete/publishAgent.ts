import { spawnSync, type SpawnSyncReturns } from 'node:child_process';

interface Args {
  message: string;
  auto: boolean;
}

function parseArgs(): Args {
  const args = process.argv.slice(2);
  let message = 'chore: orchestrated publish';
  let auto = false;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--message' && args[i + 1]) {
      message = args[i + 1];
      i += 1;
    } else if (arg === '--auto') {
      auto = true;
    }
  }
  return { message, auto };
}

function run(command: string, commandArgs: string[], inherit = true): SpawnSyncReturns<string> {
  const result = spawnSync(command, commandArgs, {
    stdio: inherit ? 'inherit' : 'pipe',
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    const output = result.stdout || result.stderr;
    throw new Error(`Command failed: ${command} ${commandArgs.join(' ')}\n${output}`);
  }
  return result;
}

function getStatus(): string {
  const { stdout } = spawnSync('git', ['status', '--short'], { encoding: 'utf8' });
  return stdout.trim();
}

function getBranch(): string {
  const { stdout } = spawnSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' });
  return stdout.trim();
}

async function main() {
  const { message, auto } = parseArgs();
  const status = getStatus();
  if (!status) {
    console.log('✅ Working tree already clean. Nothing to publish.');
    return;
  }
  if (!auto) {
    console.log('Pending changes:');
    console.log(status);
    console.log('Run `npm run publish-agent -- --auto --message "feat: ..."` to push.');
    process.exit(1);
  }
  console.log('🪄 publishAgent executing git workflow…');
  console.log('> git add -A');
  run('git', ['add', '-A']);
  console.log(`> git commit -m "${message}"`);
  try {
    run('git', ['commit', '-m', message]);
  } catch (error) {
    if ((error as Error).message.includes('nothing to commit')) {
      console.log('No diff to commit, continuing to push.');
    } else {
      throw error;
    }
  }
  const branch = getBranch();
  console.log(`> git push origin ${branch}`);
  run('git', ['push', 'origin', branch]);
  console.log('🚀 Publish automation complete.');
}

main().catch((error) => {
  console.error('publishAgent failed:', error);
  process.exit(1);
});
