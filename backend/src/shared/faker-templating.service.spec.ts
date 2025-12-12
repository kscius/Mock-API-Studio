// backend/src/shared/faker-templating.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { FakerTemplatingService } from './faker-templating.service';

describe('FakerTemplatingService', () => {
  let service: FakerTemplatingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FakerTemplatingService],
    }).compile();

    service = module.get<FakerTemplatingService>(FakerTemplatingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('render', () => {
    it('should render simple faker placeholders', () => {
      const template = { name: '{{faker.person.fullName}}' };
      const result = service.render(template);

      expect(result.name).toBeDefined();
      expect(typeof result.name).toBe('string');
      expect(result.name.length).toBeGreaterThan(0);
      expect(result.name).not.toBe('{{faker.person.fullName}}');
    });

    it('should render multiple faker placeholders', () => {
      const template = {
        name: '{{faker.person.fullName}}',
        email: '{{faker.internet.email}}',
        phone: '{{faker.phone.number}}',
      };
      const result = service.render(template);

      expect(result.name).toBeDefined();
      expect(result.email).toBeDefined();
      expect(result.phone).toBeDefined();
      expect(result.name).not.toContain('{{faker');
      expect(result.email).not.toContain('{{faker');
    });

    it('should render nested objects with faker', () => {
      const template = {
        user: {
          profile: {
            name: '{{faker.person.fullName}}',
            city: '{{faker.address.city}}',
          },
        },
      };
      const result = service.render(template);

      expect(result.user.profile.name).toBeDefined();
      expect(result.user.profile.city).toBeDefined();
    });

    it('should render arrays with faker', () => {
      const template = {
        users: [
          { name: '{{faker.person.fullName}}' },
          { name: '{{faker.person.fullName}}' },
        ],
      };
      const result = service.render(template);

      expect(result.users).toHaveLength(2);
      expect(result.users[0].name).toBeDefined();
      expect(result.users[1].name).toBeDefined();
      // Should generate different names
      expect(result.users[0].name).not.toBe(result.users[1].name);
    });

    it('should handle mixed content (faker + static)', () => {
      const template = {
        id: 123,
        name: '{{faker.person.fullName}}',
        status: 'active',
      };
      const result = service.render(template);

      expect(result.id).toBe(123);
      expect(result.name).toBeDefined();
      expect(result.name).not.toContain('{{faker');
      expect(result.status).toBe('active');
    });

    it('should handle invalid faker paths gracefully', () => {
      const template = { invalid: '{{faker.nonexistent.method}}' };
      const result = service.render(template);

      // Should return the placeholder (may be HTML-escaped by Handlebars)
      expect(result.invalid).toContain('faker');
      expect(result.invalid).toContain('nonexistent.method');
    });

    it('should handle context variables alongside faker', () => {
      const template = {
        id: '{{params.id}}',
        name: '{{faker.person.fullName}}',
      };
      const result = service.render(template, { params: { id: '123' } });

      expect(result.id).toBe('123');
      expect(result.name).toBeDefined();
      expect(result.name).not.toContain('{{faker');
    });

    it('should not modify strings without placeholders', () => {
      const template = { message: 'Hello World' };
      const result = service.render(template);

      expect(result.message).toBe('Hello World');
    });
  });

  describe('hasFakerPlaceholders', () => {
    it('should detect faker placeholders', () => {
      const template = { name: '{{faker.person.fullName}}' };
      expect(service.hasFakerPlaceholders(template)).toBe(true);
    });

    it('should return false for templates without faker', () => {
      const template = { name: 'John Doe' };
      expect(service.hasFakerPlaceholders(template)).toBe(false);
    });

    it('should detect faker_ helper syntax', () => {
      const template = { name: '{{faker_person "fullName"}}' };
      expect(service.hasFakerPlaceholders(template)).toBe(true);
    });
  });

  describe('getAvailableMethods', () => {
    it('should return a list of available modules', () => {
      const methods = service.getAvailableMethods();

      expect(methods).toBeDefined();
      expect(methods.person).toBeDefined();
      expect(methods.internet).toBeDefined();
      expect(methods.address).toBeDefined();
      expect(Array.isArray(methods.person)).toBe(true);
      expect(methods.person.length).toBeGreaterThan(0);
    });
  });
});

