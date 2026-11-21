export function resolveServicePort(
  runtimePort: string | number | undefined,
  servicePort: string | number | undefined,
  fallbackPort: number,
): number {
  const selectedPort = [runtimePort, servicePort].find(
    (candidate) =>
      candidate !== undefined && String(candidate).trim().length > 0,
  );

  return Number(selectedPort ?? fallbackPort);
}
