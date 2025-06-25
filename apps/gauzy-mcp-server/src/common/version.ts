import * as pkg from '../../package.json';

export function getVersion() {
  return (pkg as any).version;
}
