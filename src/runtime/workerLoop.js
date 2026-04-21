import { runWorkerOnce } from './workerRuntime.js';
import { sleep } from './sleep.js';

export async function runWorkerLoop({
  config,
  runWorkerOnceImpl = runWorkerOnce,
  sleepImpl = sleep,
  shouldStopImpl = () => false
}) {
  const maxIterations = config.workerMaxIterations || Number.POSITIVE_INFINITY;
  let iteration = 0;
  let lastResult = null;

  while (iteration < maxIterations) {
    iteration += 1;
    lastResult = await runWorkerOnceImpl({ config });

    if (shouldStopImpl({ iteration, lastResult, config })) {
      break;
    }

    if (iteration < maxIterations) {
      await sleepImpl(config.workerPollIntervalMs);
    }
  }

  return {
    iterations: iteration,
    lastResult
  };
}
