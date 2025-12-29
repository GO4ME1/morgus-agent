/**
 * Error Analyzer Service
 * 
 * Analyzes errors and suggests corrective actions for intelligent retry logic.
 * 
 * Features:
 * - Pattern-based error detection
 * - Severity classification
 * - Corrective action suggestions
 * - Alternative approach recommendations
 */

export interface ErrorAnalysis {
  errorType: 'missing_package' | 'syntax_error' | 'permission_error' | 
             'network_error' | 'timeout' | 'resource_limit' | 'file_not_found' |
             'import_error' | 'type_error' | 'runtime_error' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
  isRetryable: boolean;
  confidence: number; // 0-1
  suggestedFix: CorrectiveAction | null;
  alternativeApproaches: string[];
  estimatedFixTime: number; // seconds
  errorMessage: string;
  context?: any;
}

export interface CorrectiveAction {
  type: 'install_package' | 'fix_syntax' | 'change_permissions' | 
        'increase_timeout' | 'retry_with_backoff' | 'use_alternative_tool' |
        'fix_import' | 'add_error_handling' | 'optimize_code';
  description: string;
  code?: string; // Code to execute for fix
  parameters?: any;
  estimatedTime: number; // seconds
}

export interface ExecutionContext {
  code?: string;
  language?: string;
  tool?: string;
  parameters?: any;
  previousAttempts?: number;
  previousErrors?: string[];
}

/**
 * Error pattern definitions
 */
const ERROR_PATTERNS = {
  // Python package errors
  MISSING_PACKAGE_PYTHON: /ModuleNotFoundError: No module named '([^']+)'/,
  MISSING_PACKAGE_IMPORT: /ImportError: cannot import name '([^']+)'/,
  
  // JavaScript package errors
  MISSING_PACKAGE_NODE: /Cannot find module '([^']+)'/,
  
  // Syntax errors
  SYNTAX_ERROR_PYTHON: /SyntaxError: (.+)/,
  SYNTAX_ERROR_JS: /SyntaxError: (.+)/,
  
  // Permission errors
  PERMISSION_DENIED: /PermissionError: \[Errno 13\] Permission denied/,
  EACCES: /EACCES: permission denied/,
  
  // Network errors
  CONNECTION_ERROR: /ConnectionError|ConnectionRefusedError|ConnectionResetError/,
  TIMEOUT_ERROR: /TimeoutError|timeout|timed out/i,
  NETWORK_ERROR: /NetworkError|ECONNREFUSED|ECONNRESET|ETIMEDOUT/,
  
  // Resource errors
  MEMORY_ERROR: /MemoryError|Out of memory/i,
  DISK_FULL: /No space left on device|Disk quota exceeded/i,
  CPU_LIMIT: /CPU time limit exceeded/i,
  
  // File errors
  FILE_NOT_FOUND: /FileNotFoundError|ENOENT: no such file or directory/,
  
  // Type errors
  TYPE_ERROR: /TypeError: (.+)/,
  ATTRIBUTE_ERROR: /AttributeError: (.+)/,
  
  // Runtime errors
  DIVISION_BY_ZERO: /ZeroDivisionError|division by zero/i,
  INDEX_ERROR: /IndexError|list index out of range/i,
  KEY_ERROR: /KeyError: (.+)/,
  VALUE_ERROR: /ValueError: (.+)/,
};

export class ErrorAnalyzer {
  /**
   * Analyze an error and provide corrective actions
   */
  static analyze(error: string, context: ExecutionContext = {}): ErrorAnalysis {
    const errorLower = error.toLowerCase();
    
    // Check for missing package errors (highest priority)
    if (ERROR_PATTERNS.MISSING_PACKAGE_PYTHON.test(error)) {
      return this.analyzeMissingPackagePython(error, context);
    }
    
    if (ERROR_PATTERNS.MISSING_PACKAGE_NODE.test(error)) {
      return this.analyzeMissingPackageNode(error, context);
    }
    
    if (ERROR_PATTERNS.MISSING_PACKAGE_IMPORT.test(error)) {
      return this.analyzeImportError(error, context);
    }
    
    // Check for syntax errors
    if (ERROR_PATTERNS.SYNTAX_ERROR_PYTHON.test(error) || ERROR_PATTERNS.SYNTAX_ERROR_JS.test(error)) {
      return this.analyzeSyntaxError(error, context);
    }
    
    // Check for permission errors
    if (ERROR_PATTERNS.PERMISSION_DENIED.test(error) || ERROR_PATTERNS.EACCES.test(error)) {
      return this.analyzePermissionError(error, context);
    }
    
    // Check for network errors
    if (ERROR_PATTERNS.CONNECTION_ERROR.test(error) || 
        ERROR_PATTERNS.TIMEOUT_ERROR.test(error) ||
        ERROR_PATTERNS.NETWORK_ERROR.test(error)) {
      return this.analyzeNetworkError(error, context);
    }
    
    // Check for resource errors
    if (ERROR_PATTERNS.MEMORY_ERROR.test(error) ||
        ERROR_PATTERNS.DISK_FULL.test(error) ||
        ERROR_PATTERNS.CPU_LIMIT.test(error)) {
      return this.analyzeResourceError(error, context);
    }
    
    // Check for file errors
    if (ERROR_PATTERNS.FILE_NOT_FOUND.test(error)) {
      return this.analyzeFileNotFoundError(error, context);
    }
    
    // Check for type errors
    if (ERROR_PATTERNS.TYPE_ERROR.test(error) || ERROR_PATTERNS.ATTRIBUTE_ERROR.test(error)) {
      return this.analyzeTypeError(error, context);
    }
    
    // Check for runtime errors
    if (ERROR_PATTERNS.DIVISION_BY_ZERO.test(error) ||
        ERROR_PATTERNS.INDEX_ERROR.test(error) ||
        ERROR_PATTERNS.KEY_ERROR.test(error) ||
        ERROR_PATTERNS.VALUE_ERROR.test(error)) {
      return this.analyzeRuntimeError(error, context);
    }
    
    // Unknown error
    return this.analyzeUnknownError(error, context);
  }
  
  /**
   * Analyze missing Python package error
   */
  private static analyzeMissingPackagePython(error: string, context: ExecutionContext): ErrorAnalysis {
    const match = error.match(ERROR_PATTERNS.MISSING_PACKAGE_PYTHON);
    const packageName = match ? match[1] : 'unknown';
    
    return {
      errorType: 'missing_package',
      severity: 'medium',
      isRetryable: true,
      confidence: 0.95,
      suggestedFix: {
        type: 'install_package',
        description: `Install missing Python package: ${packageName}`,
        code: `pip install ${packageName}`,
        parameters: { package: packageName, manager: 'pip' },
        estimatedTime: 30
      },
      alternativeApproaches: [
        `Try installing with pip3: pip3 install ${packageName}`,
        `Check if package name is correct (common typos: ${this.suggestPackageAlternatives(packageName)})`,
        `Install from requirements.txt if available`
      ],
      estimatedFixTime: 30,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze missing Node.js package error
   */
  private static analyzeMissingPackageNode(error: string, context: ExecutionContext): ErrorAnalysis {
    const match = error.match(ERROR_PATTERNS.MISSING_PACKAGE_NODE);
    const packageName = match ? match[1] : 'unknown';
    
    return {
      errorType: 'missing_package',
      severity: 'medium',
      isRetryable: true,
      confidence: 0.95,
      suggestedFix: {
        type: 'install_package',
        description: `Install missing Node.js package: ${packageName}`,
        code: `npm install ${packageName}`,
        parameters: { package: packageName, manager: 'npm' },
        estimatedTime: 30
      },
      alternativeApproaches: [
        `Try with yarn: yarn add ${packageName}`,
        `Check if package name is correct`,
        `Install from package.json if available`
      ],
      estimatedFixTime: 30,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze import error
   */
  private static analyzeImportError(error: string, context: ExecutionContext): ErrorAnalysis {
    const match = error.match(ERROR_PATTERNS.MISSING_PACKAGE_IMPORT);
    const importName = match ? match[1] : 'unknown';
    
    return {
      errorType: 'import_error',
      severity: 'medium',
      isRetryable: true,
      confidence: 0.85,
      suggestedFix: {
        type: 'fix_import',
        description: `Fix import statement for: ${importName}`,
        code: context.code || '',
        parameters: { importName },
        estimatedTime: 20
      },
      alternativeApproaches: [
        `Check if import name is correct`,
        `Try importing from different module`,
        `Install package that contains this import`
      ],
      estimatedFixTime: 20,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze syntax error
   */
  private static analyzeSyntaxError(error: string, context: ExecutionContext): ErrorAnalysis {
    return {
      errorType: 'syntax_error',
      severity: 'high',
      isRetryable: true,
      confidence: 0.90,
      suggestedFix: {
        type: 'fix_syntax',
        description: 'Fix syntax error in code',
        code: context.code || '',
        parameters: { error },
        estimatedTime: 15
      },
      alternativeApproaches: [
        'Review code for missing brackets, parentheses, or quotes',
        'Check indentation (Python)',
        'Validate code with linter'
      ],
      estimatedFixTime: 15,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze permission error
   */
  private static analyzePermissionError(error: string, context: ExecutionContext): ErrorAnalysis {
    return {
      errorType: 'permission_error',
      severity: 'high',
      isRetryable: true,
      confidence: 0.85,
      suggestedFix: {
        type: 'change_permissions',
        description: 'Fix file permissions',
        code: 'chmod +x <file>',
        parameters: {},
        estimatedTime: 10
      },
      alternativeApproaches: [
        'Run with elevated permissions (sudo)',
        'Change file ownership',
        'Write to a different directory with write permissions'
      ],
      estimatedFixTime: 10,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze network error
   */
  private static analyzeNetworkError(error: string, context: ExecutionContext): ErrorAnalysis {
    const isTimeout = ERROR_PATTERNS.TIMEOUT_ERROR.test(error);
    
    return {
      errorType: isTimeout ? 'timeout' : 'network_error',
      severity: 'medium',
      isRetryable: true,
      confidence: 0.90,
      suggestedFix: {
        type: isTimeout ? 'increase_timeout' : 'retry_with_backoff',
        description: isTimeout ? 'Increase timeout and retry' : 'Retry with exponential backoff',
        parameters: { 
          timeout: isTimeout ? (context.parameters?.timeout || 30) * 2 : undefined,
          backoff: !isTimeout ? 2000 : undefined
        },
        estimatedTime: isTimeout ? 60 : 30
      },
      alternativeApproaches: [
        'Check network connectivity',
        'Verify URL/endpoint is correct',
        'Try alternative endpoint or mirror',
        'Check if service is down'
      ],
      estimatedFixTime: isTimeout ? 60 : 30,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze resource limit error
   */
  private static analyzeResourceError(error: string, context: ExecutionContext): ErrorAnalysis {
    const isMemory = ERROR_PATTERNS.MEMORY_ERROR.test(error);
    const isDisk = ERROR_PATTERNS.DISK_FULL.test(error);
    
    return {
      errorType: 'resource_limit',
      severity: 'critical',
      isRetryable: false,
      confidence: 0.95,
      suggestedFix: {
        type: 'optimize_code',
        description: isMemory ? 'Optimize memory usage' : isDisk ? 'Free up disk space' : 'Reduce resource usage',
        parameters: { resourceType: isMemory ? 'memory' : isDisk ? 'disk' : 'cpu' },
        estimatedTime: 60
      },
      alternativeApproaches: [
        isMemory ? 'Process data in smaller chunks' : '',
        isDisk ? 'Clean up temporary files' : '',
        'Use more efficient algorithms',
        'Request resource limit increase'
      ].filter(Boolean),
      estimatedFixTime: 60,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze file not found error
   */
  private static analyzeFileNotFoundError(error: string, context: ExecutionContext): ErrorAnalysis {
    return {
      errorType: 'file_not_found',
      severity: 'medium',
      isRetryable: true,
      confidence: 0.90,
      suggestedFix: {
        type: 'add_error_handling',
        description: 'Create file or handle missing file gracefully',
        parameters: {},
        estimatedTime: 20
      },
      alternativeApproaches: [
        'Check if file path is correct',
        'Create the file if it should exist',
        'Use alternative file location',
        'Add file existence check before accessing'
      ],
      estimatedFixTime: 20,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze type error
   */
  private static analyzeTypeError(error: string, context: ExecutionContext): ErrorAnalysis {
    return {
      errorType: 'type_error',
      severity: 'high',
      isRetryable: true,
      confidence: 0.85,
      suggestedFix: {
        type: 'fix_syntax',
        description: 'Fix type mismatch in code',
        code: context.code || '',
        parameters: { error },
        estimatedTime: 20
      },
      alternativeApproaches: [
        'Check variable types',
        'Add type conversion',
        'Verify function arguments',
        'Check for None/null values'
      ],
      estimatedFixTime: 20,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze runtime error
   */
  private static analyzeRuntimeError(error: string, context: ExecutionContext): ErrorAnalysis {
    return {
      errorType: 'runtime_error',
      severity: 'high',
      isRetryable: true,
      confidence: 0.80,
      suggestedFix: {
        type: 'add_error_handling',
        description: 'Add error handling and validation',
        code: context.code || '',
        parameters: { error },
        estimatedTime: 25
      },
      alternativeApproaches: [
        'Add input validation',
        'Check for edge cases',
        'Add try-except blocks',
        'Validate data before processing'
      ],
      estimatedFixTime: 25,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Analyze unknown error
   */
  private static analyzeUnknownError(error: string, context: ExecutionContext): ErrorAnalysis {
    return {
      errorType: 'unknown',
      severity: 'medium',
      isRetryable: true,
      confidence: 0.75,
      suggestedFix: {
        type: 'retry_with_backoff',
        description: 'Retry with exponential backoff',
        estimatedTime: 5
      },
      alternativeApproaches: [
        'Review error message carefully',
        'Search for error online',
        'Try alternative approach',
        'Ask for user guidance'
      ],
      estimatedFixTime: 60,
      errorMessage: error,
      context
    };
  }
  
  /**
   * Determine if error should be retried
   */
  static shouldRetry(analysis: ErrorAnalysis, attemptCount: number, maxAttempts: number = 3): boolean {
    // Don't retry if max attempts reached
    if (attemptCount >= maxAttempts) {
      return false;
    }
    
    // Don't retry if not retryable
    if (!analysis.isRetryable) {
      return false;
    }
    
    // Don't retry if confidence is too low
    if (analysis.confidence < 0.7) {
      return false;
    }
    
    // Don't retry critical errors without fix
    if (analysis.severity === 'critical' && !analysis.suggestedFix) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Suggest alternative package names for common typos
   */
  private static suggestPackageAlternatives(packageName: string): string {
    const alternatives: { [key: string]: string[] } = {
      'beautifulsoup': ['beautifulsoup4', 'bs4'],
      'cv2': ['opencv-python', 'opencv-python-headless'],
      'sklearn': ['scikit-learn'],
      'PIL': ['Pillow'],
      'yaml': ['pyyaml'],
      'dotenv': ['python-dotenv'],
      'psycopg': ['psycopg2', 'psycopg2-binary'],
    };
    
    const lower = packageName.toLowerCase();
    for (const [typo, correct] of Object.entries(alternatives)) {
      if (lower.includes(typo)) {
        return correct.join(', ');
      }
    }
    
    return packageName;
  }
}
