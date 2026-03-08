type RetryOptions = {
  retries: number;
  delayMs: number;
  shouldRetry?: (error: unknown) => boolean;
};

function wait(delayMs: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, delayMs);
  });
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt <= options.retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const canRetry =
        attempt < options.retries &&
        (options.shouldRetry ? options.shouldRetry(error) : true);

      if (!canRetry) {
        break;
      }

      await wait(options.delayMs * (attempt + 1));
      attempt += 1;
    }
  }

  throw lastError;
}
