import { createRuntimeConfig } from '../config.js';
import { runWorkerOnce } from '../runtime/workerRuntime.js';

const config = createRuntimeConfig(process.env);
const result = await runWorkerOnce({ config });
console.log(JSON.stringify(result, null, 2));
