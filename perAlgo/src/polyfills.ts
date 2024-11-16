import { Buffer } from 'buffer';

// Define a minimal process shim that satisfies NodeJS.Process
const process = {
  env: {},
  version: '',
  versions: {},
  platform: '',
  nextTick: (callback: () => void) => setTimeout(callback, 0),
  // Add required properties from NodeJS.Process
  argv: [],
  argv0: '',
  execArgv: [],
  execPath: '',
  abort: () => {},
  chdir: () => {},
  cwd: () => '',
  exit: () => {},
  pid: 0,
  ppid: 0,
  title: '',
  arch: '',
  browser: true,
  connected: false,
  debugPort: 0,
  exitCode: 0,
  mainModule: undefined,
  release: {},
  features: {},
  config: {},
  dlopen: () => {},
  uptime: () => 0,
  hrtime: () => [0, 0],
  cpuUsage: () => ({ user: 0, system: 0 }),
  memoryUsage: () => ({
    rss: 0,
    heapTotal: 0,
    heapUsed: 0,
    external: 0,
    arrayBuffers: 0
  }),
  kill: () => true,
  stdout: null,
  stderr: null,
  stdin: null,
  openStdin: () => null,
  // Add other required methods as no-ops
  addListener: () => process,
  emit: () => false,
  listenerCount: () => 0,
  listeners: () => [],
  off: () => process,
  on: () => process,
  once: () => process,
  prependListener: () => process,
  prependOnceListener: () => process,
  removeAllListeners: () => process,
  removeListener: () => process,
  setMaxListeners: () => process,
  getMaxListeners: () => 0,
  eventNames: () => []
} as unknown as NodeJS.Process;

// Declare global augmentations
declare global {
  interface Window {
    global: typeof globalThis;
    Buffer: typeof Buffer;
    process: typeof process;
  }
}

// Apply polyfills only in browser environment
if (typeof window !== 'undefined') {
  window.global = window;
  window.Buffer = Buffer;
  window.process = process;
}

export {};