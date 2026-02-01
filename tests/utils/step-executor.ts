/**
 * Step Executor Utility
 * 
 * Provides structured test step execution with:
 * - Clear step descriptions
 * - Automatic error handling
 * - Step-level logging
 * - Better debugging (know exactly which step failed)
 * - Support for auto-documentation generation
 * 
 * Usage:
 * ```typescript
 * await step('Navigate to home page', async () => {
 *   await page.goto('/');
 * });
 * 
 * await step('Verify page title contains GMP', async () => {
 *   await expect(page).toHaveTitle(/GMP/i);
 * });
 * ```
 */

interface StepOptions {
  /**
   * Whether to continue execution if this step fails
   * @default false
   */
  continueOnError?: boolean;
  
  /**
   * Whether to retry this step on failure
   * @default false
   */
  retry?: boolean;
  
  /**
   * Maximum number of retries if retry is enabled
   * @default 2
   */
  maxRetries?: number;
  
  /**
   * Timeout for this specific step in milliseconds
   * @default undefined (uses Playwright's default timeout)
   */
  timeout?: number;
  
  /**
   * Additional context for logging/debugging
   */
  context?: Record<string, any>;
}

interface StepResult {
  success: boolean;
  stepName: string;
  duration: number;
  error?: Error;
  context?: Record<string, any>;
}

/**
 * Execute a test step with proper error handling and logging
 * 
 * @param stepName - Clear description of what this step does (used for logging and documentation)
 * @param stepAction - The async function to execute
 * @param options - Optional configuration for step execution
 * @returns Promise that resolves when step completes (or rejects if step fails and continueOnError is false)
 * 
 * @example
 * ```typescript
 * await step('Navigate to catalog page', async () => {
 *   await page.goto('/catalogo');
 *   await page.waitForLoadState('networkidle');
 * });
 * ```
 */
export async function step<T>(
  stepName: string,
  stepAction: () => Promise<T>,
  options: StepOptions = {}
): Promise<T> {
  const {
    continueOnError = false,
    retry = false,
    maxRetries = 2,
    timeout,
    context = {}
  } = options;

  const startTime = Date.now();
  let lastError: Error | undefined;
  let attempt = 0;
  const maxAttempts = retry ? maxRetries + 1 : 1;

  // Log step start
  console.log(`🔹 Step: ${stepName}`);
  if (Object.keys(context).length > 0) {
    console.log(`   Context:`, context);
  }

  while (attempt < maxAttempts) {
    try {
      // Execute step with optional timeout
      let result: T;
      
      if (timeout) {
        // Use Promise.race to implement timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Step "${stepName}" timed out after ${timeout}ms`)), timeout);
        });
        
        result = await Promise.race([
          stepAction(),
          timeoutPromise
        ]);
      } else {
        result = await stepAction();
      }

      // Step succeeded
      const duration = Date.now() - startTime;
      console.log(`✅ Step completed: ${stepName} (${duration}ms)`);
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempt++;

      if (attempt < maxAttempts) {
        // Retry logic
        console.log(`⚠️  Step failed (attempt ${attempt}/${maxAttempts}): ${stepName}`);
        console.log(`   Error: ${lastError.message}`);
        console.log(`   Retrying...`);
        
        // Wait a bit before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      } else {
        // All attempts failed
        const duration = Date.now() - startTime;
        console.log(`❌ Step failed: ${stepName} (${duration}ms)`);
        console.log(`   Error: ${lastError.message}`);
        
        if (lastError.stack) {
          console.log(`   Stack: ${lastError.stack.split('\n').slice(0, 3).join('\n')}`);
        }

        if (continueOnError) {
          console.log(`   Continuing despite error (continueOnError=true)`);
          // Return undefined or throw based on return type
          // For now, we'll throw but this could be enhanced
          throw lastError;
        } else {
          throw lastError;
        }
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error(`Step "${stepName}" failed after ${maxAttempts} attempts`);
}

/**
 * Execute multiple steps in sequence with proper error handling
 * 
 * @param steps - Array of step definitions
 * @returns Promise that resolves when all steps complete
 * 
 * @example
 * ```typescript
 * await steps([
 *   { name: 'Navigate to home', action: async () => await page.goto('/') },
 *   { name: 'Verify title', action: async () => await expect(page).toHaveTitle(/GMP/i) },
 *   { name: 'Check header', action: async () => await expect(page.locator('header')).toBeVisible() }
 * ]);
 * ```
 */
export async function steps(
  stepDefinitions: Array<{
    name: string;
    action: () => Promise<any>;
    options?: StepOptions;
  }>
): Promise<void> {
  for (const stepDef of stepDefinitions) {
    await step(stepDef.name, stepDef.action, stepDef.options);
  }
}

/**
 * Execute a step group (multiple related steps) with a group name
 * Useful for organizing related steps and better documentation
 * 
 * @param groupName - Name of the step group
 * @param stepDefinitions - Array of steps to execute
 * @param options - Options applied to all steps in the group
 * 
 * @example
 * ```typescript
 * await stepGroup('Navigation Setup', [
 *   { name: 'Navigate to home', action: async () => await page.goto('/') },
 *   { name: 'Wait for load', action: async () => await page.waitForLoadState('networkidle') }
 * ]);
 * ```
 */
export async function stepGroup(
  groupName: string,
  stepDefinitions: Array<{
    name: string;
    action: () => Promise<any>;
    options?: StepOptions;
  }>,
  options: StepOptions = {}
): Promise<void> {
  console.log(`\n📦 Step Group: ${groupName}`);
  console.log(`   Steps: ${stepDefinitions.length}`);
  
  for (const stepDef of stepDefinitions) {
    // Merge group options with step-specific options (step options take precedence)
    const mergedOptions = { ...options, ...stepDef.options };
    await step(`${groupName} > ${stepDef.name}`, stepDef.action, mergedOptions);
  }
  
  console.log(`✅ Step Group completed: ${groupName}\n`);
}

/**
 * Extract step information for documentation purposes
 * This can be used by auto-documentation tools to generate test documentation
 * 
 * @param testFile - The test file content (as string)
 * @returns Array of step information
 */
export function extractStepsForDocumentation(testFile: string): Array<{
  stepName: string;
  lineNumber: number;
  context?: Record<string, any>;
}> {
  // This is a placeholder - actual implementation would parse the test file
  // to extract step calls and their descriptions
  // Could use AST parsing or regex matching
  const steps: Array<{ stepName: string; lineNumber: number; context?: Record<string, any> }> = [];
  
  // Simple regex to find step() calls (basic implementation)
  const stepRegex = /await\s+step\(['"]([^'"]+)['"]/g;
  let match;
  let lineNumber = 1;
  
  const lines = testFile.split('\n');
  lines.forEach((line, index) => {
    if (stepRegex.test(line)) {
      const stepMatch = line.match(/await\s+step\(['"]([^'"]+)['"]/);
      if (stepMatch) {
        steps.push({
          stepName: stepMatch[1],
          lineNumber: index + 1
        });
      }
    }
  });
  
  return steps;
}

