export default function isRecord(obj: unknown): obj is Record<string, unknown> {
  if (typeof obj !== 'object') return false;
  return Object.getOwnPropertyNames(obj).length !== 0
}