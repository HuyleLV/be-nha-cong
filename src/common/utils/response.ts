export function ok<T>(data: T, meta: Record<string, any> = {}) {
    return { success: true, data, meta };
  }
  