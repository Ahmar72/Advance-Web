export function getMissingSchemaTable(errorMessage: string): string | null {
  const match = errorMessage.match(/Could not find the table '([^']+)'/i);
  if (!match?.[1]) {
    return null;
  }
  return match[1];
}

export function isMissingTableSchemaCacheError(errorMessage: string): boolean {
  return /Could not find the table '[^']+'/i.test(errorMessage);
}
