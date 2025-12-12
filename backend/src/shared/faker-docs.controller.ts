// backend/src/shared/faker-docs.controller.ts
import { Controller, Get } from '@nestjs/common';
import { FakerTemplatingService } from './faker-templating.service';

@Controller('faker-docs')
export class FakerDocsController {
  constructor(private readonly fakerTemplating: FakerTemplatingService) {}

  @Get()
  getAvailableMethods() {
    return {
      message: 'Available Faker.js methods for template placeholders',
      syntax: '{{faker.module.method}} or {{faker_module "method"}}',
      examples: [
        '{{faker.person.fullName}}',
        '{{faker.internet.email}}',
        '{{faker.phone.number}}',
        '{{faker.address.city}}',
        '{{faker.company.name}}',
        '{{faker.lorem.sentence}}',
        '{{faker.datatype.uuid}}',
      ],
      modules: this.fakerTemplating.getAvailableMethods(),
    };
  }
}

