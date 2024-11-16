import { Buffer } from 'buffer';
import process from 'process';

declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: typeof process;
  }
}

window.Buffer = Buffer;
window.process = process;