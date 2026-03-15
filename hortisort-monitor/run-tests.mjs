import { startVitest } from 'vitest/node';

const files = process.argv.slice(2);
const vitest = await startVitest('test', files.length ? files : undefined, { 
  run: true,
  watch: false,
});

await vitest?.close();
process.exit(vitest?.state?.getCountOfFailedTests() ? 1 : 0);
