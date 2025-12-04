/**
 * Retry a function with exponential backoff
 * @param fn The async function to retry
 * @param maxRetries Maximum number of retry attempts
 * @param initialDelay Initial delay in milliseconds
 * @returns Promise with the result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        throw error;
      }
      
      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = initialDelay * Math.pow(2, attempt);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  // Don't retry permission errors
  if (error.code === 'permission-denied') {
    return true;
  }
  
  // Don't retry authentication errors
  if (error.code?.startsWith('auth/')) {
    return true;
  }
  
  // Don't retry validation errors
  if (error.code === 'invalid-argument') {
    return true;
  }
  
  // Don't retry if already exists
  if (error.code === 'already-exists') {
    return true;
  }
  
  return false;
}

/**
 * Check if an error is a network error that might be transient
 */
export function isNetworkError(error: any): boolean {
  return (
    error.code === 'unavailable' ||
    error.code === 'deadline-exceeded' ||
    error.message?.includes('network') ||
    error.message?.includes('offline')
  );
}

/**
 * Get a user-friendly error message from a Firebase error
 */
export function getFirebaseErrorMessage(error: any): string {
  // Firestore errors
  if (error.code === 'permission-denied') {
    return 'You do not have permission to perform this action.';
  }
  if (error.code === 'unavailable') {
    return 'Service temporarily unavailable. Please try again.';
  }
  if (error.code === 'deadline-exceeded') {
    return 'Request timed out. Please check your connection and try again.';
  }
  if (error.code === 'not-found') {
    return 'The requested resource was not found.';
  }
  if (error.code === 'already-exists') {
    return 'This resource already exists.';
  }
  
  // Auth errors
  if (error.code === 'auth/user-not-found') {
    return 'No account found with this email.';
  }
  if (error.code === 'auth/wrong-password') {
    return 'Incorrect password.';
  }
  if (error.code === 'auth/email-already-in-use') {
    return 'An account with this email already exists.';
  }
  if (error.code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (error.code === 'auth/invalid-email') {
    return 'Invalid email address.';
  }
  if (error.code === 'auth/user-disabled') {
    return 'This account has been disabled.';
  }
  if (error.code === 'auth/too-many-requests') {
    return 'Too many failed attempts. Please try again later.';
  }
  
  // Network errors
  if (isNetworkError(error)) {
    return 'Network error. Please check your connection and try again.';
  }
  
  // Default message
  return error.message || 'An unexpected error occurred. Please try again.';
}
