// backend/src/shared/services/validation.service.ts
import { Injectable } from '@nestjs/common';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

@Injectable()
export class ValidationService {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
    });
    addFormats(this.ajv);
  }

  validateRequest(requestSchema: any, requestData: any): ValidationResult {
    if (!requestSchema) {
      return { valid: true };
    }

    try {
      const validate: ValidateFunction = this.ajv.compile(requestSchema);
      const valid = validate(requestData);

      if (!valid && validate.errors) {
        const errors = validate.errors.map((err) => {
          const path = err.instancePath || '/';
          return `${path}: ${err.message}`;
        });
        return { valid: false, errors };
      }

      return { valid: true };
    } catch (error) {
      // Schema inválido o error de compilación
      return {
        valid: false,
        errors: [`Schema validation error: ${error.message}`],
      };
    }
  }

  /**
   * Valida request completo (query, body, headers)
   */
  validateFullRequest(
    requestSchema: any,
    data: {
      query?: any;
      body?: any;
      headers?: any;
    },
  ): ValidationResult {
    if (!requestSchema) {
      return { valid: true };
    }

    const allErrors: string[] = [];

    // Validar query
    if (requestSchema.query) {
      const result = this.validateRequest(requestSchema.query, data.query || {});
      if (!result.valid && result.errors) {
        allErrors.push(...result.errors.map((e) => `query${e}`));
      }
    }

    // Validar body
    if (requestSchema.body) {
      const result = this.validateRequest(requestSchema.body, data.body);
      if (!result.valid && result.errors) {
        allErrors.push(...result.errors.map((e) => `body${e}`));
      }
    }

    // Validar headers (opcional)
    if (requestSchema.headers) {
      const result = this.validateRequest(requestSchema.headers, data.headers || {});
      if (!result.valid && result.errors) {
        allErrors.push(...result.errors.map((e) => `headers${e}`));
      }
    }

    if (allErrors.length > 0) {
      return { valid: false, errors: allErrors };
    }

    return { valid: true };
  }
}

