// backend/src/shared/faker-templating.service.ts
import { Injectable } from '@nestjs/common';
import { faker } from '@faker-js/faker';
import Handlebars from 'handlebars';

@Injectable()
export class FakerTemplatingService {
  private handlebarsInstance: typeof Handlebars;

  constructor() {
    this.handlebarsInstance = Handlebars.create();
    this.registerFakerHelpers();
  }

  /**
   * Register Faker.js helpers for Handlebars
   * Supports syntax like {{faker "person.fullName"}}, {{faker "internet.email"}}, etc.
   */
  private registerFakerHelpers() {
    // Register main faker helper with explicit string parameter
    this.handlebarsInstance.registerHelper('faker', (path: string) => {
      try {
        if (!path || typeof path !== 'string') {
          return '';
        }

        // Split path like "person.fullName" into ["person", "fullName"]
        const parts = path.split('.');
        let current: any = faker;

        // Navigate through the path
        for (const part of parts) {
          current = current[part];
          if (!current) {
            return `{{faker "${path}"}}`;
          }
        }

        // If it's a function, call it
        if (typeof current === 'function') {
          const result = current();
          return result !== null && result !== undefined ? String(result) : '';
        }

        return String(current);
      } catch (err) {
        return `{{faker "${path}"}}`;
      }
    });

    // Also register property access syntax for modules
    // This allows {{faker.person.fullName}} to work by registering faker as an object
    const fakerProxy: any = {};
    const fakerModules = [
      'person', 'name', 'internet', 'phone', 'address', 'location',
      'company', 'commerce', 'finance', 'date', 'lorem',
      'datatype', 'number', 'string', 'image', 'git', 'color',
      'vehicle', 'music', 'system', 'database', 'hacker', 'animal',
    ];

    fakerModules.forEach((moduleName) => {
      const moduleProxy: any = {};
      const module = (faker as any)[moduleName];
      
      if (module && typeof module === 'object') {
        // Get all methods from the module
        Object.keys(module).forEach((methodName) => {
          if (typeof module[methodName] === 'function') {
            moduleProxy[methodName] = () => {
              try {
                return module[methodName]();
              } catch {
                return '';
              }
            };
          }
        });
      }
      
      fakerProxy[moduleName] = moduleProxy;
    });

    // Register faker as a data object
    this.handlebarsInstance.registerHelper('fakerData', () => fakerProxy);
  }

  /**
   * Pre-process template to convert {{faker.module.method}} to {{faker "module.method"}}
   */
  private preprocessTemplate(template: string): string {
    // Convert {{faker.module.method}} to {{faker "module.method"}}
    return template.replace(/\{\{faker\.([a-zA-Z]+\.[a-zA-Z]+)\}\}/g, '{{faker "$1"}}');
  }

  /**
   * Render a template with Faker.js support
   * @param template - String or object containing Handlebars templates
   * @param context - Additional context variables
   * @returns Rendered output
   */
  render(template: any, context: Record<string, any> = {}): any {
    if (typeof template === 'string') {
      try {
        // Pre-process to convert faker syntax
        const processedTemplate = this.preprocessTemplate(template);
        const compiled = this.handlebarsInstance.compile(processedTemplate);
        const result = compiled(context);
        // Return empty string as is (might be intentional)
        if (result === '') {
          return result;
        }
        // Try to parse as JSON if it looks like JSON
        if (result.startsWith('{') || result.startsWith('[')) {
          try {
            return JSON.parse(result);
          } catch {
            return result;
          }
        }
        return result;
      } catch (err) {
        return template;
      }
    }

    if (Array.isArray(template)) {
      return template.map((item) => this.render(item, context));
    }

    if (typeof template === 'object' && template !== null) {
      const result: Record<string, any> = {};
      for (const [key, value] of Object.entries(template)) {
        result[key] = this.render(value, context);
      }
      return result;
    }

    return template;
  }

  /**
   * Check if a template contains Faker.js placeholders
   */
  hasFakerPlaceholders(template: any): boolean {
    const templateStr = JSON.stringify(template);
    return templateStr.includes('{{faker.') || templateStr.includes('{{faker_');
  }

  /**
   * Get list of available Faker methods (for documentation/autocomplete)
   */
  getAvailableMethods(): Record<string, string[]> {
    return {
      person: ['fullName', 'firstName', 'lastName', 'middleName', 'prefix', 'suffix', 'gender', 'jobTitle'],
      internet: ['email', 'userName', 'password', 'url', 'domainName', 'ip', 'ipv6', 'userAgent', 'color', 'mac'],
      phone: ['number', 'imei'],
      address: ['streetAddress', 'city', 'state', 'zipCode', 'country', 'countryCode', 'latitude', 'longitude'],
      location: ['streetAddress', 'city', 'state', 'zipCode', 'country', 'countryCode', 'latitude', 'longitude'],
      company: ['name', 'catchPhrase', 'bs'],
      commerce: ['productName', 'price', 'productDescription', 'department', 'color'],
      finance: ['accountNumber', 'iban', 'bic', 'creditCardNumber', 'creditCardCVV', 'bitcoinAddress', 'ethereumAddress'],
      date: ['past', 'future', 'recent', 'soon', 'birthdate', 'month', 'weekday'],
      lorem: ['word', 'words', 'sentence', 'sentences', 'paragraph', 'paragraphs', 'text', 'lines'],
      datatype: ['boolean', 'number', 'float', 'uuid'],
      number: ['int', 'float', 'binary', 'octal', 'hex'],
      string: ['uuid', 'alphanumeric', 'alpha', 'numeric', 'sample'],
      image: ['avatar', 'url', 'dataUri'],
      color: ['human', 'rgb', 'hex', 'hsl'],
      vehicle: ['vehicle', 'manufacturer', 'model', 'type', 'fuel', 'vin', 'color'],
      git: ['branch', 'commitSha', 'commitMessage'],
      database: ['column', 'type', 'collation', 'engine'],
      hacker: ['abbreviation', 'adjective', 'noun', 'verb', 'phrase'],
      animal: ['dog', 'cat', 'bird', 'fish', 'type'],
    };
  }
}

