// backend/src/shared/faker-docs.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { FakerTemplatingService } from './faker-templating.service';

@Controller('faker-docs')
export class FakerDocsController {
  constructor(private readonly fakerTemplating: FakerTemplatingService) {}

  @Get('methods')
  getAvailableMethods() {
    return this.fakerTemplating.getAvailableMethods();
  }

  @Get()
  getDocumentation() {
    return {
      message: 'Available Faker.js methods for template placeholders',
      syntax: '{{faker.module.method}}',
      examples: [
        '{{faker.person.fullName}}',
        '{{faker.internet.email}}',
        '{{faker.phone.number}}',
        '{{faker.location.city}}',
        '{{faker.company.name}}',
        '{{faker.lorem.sentence}}',
        '{{faker.string.uuid}}',
      ],
      modules: this.fakerTemplating.getAvailableMethods(),
    };
  }

  @Post('render')
  renderTemplate(@Body() body: any) {
    return this.fakerTemplating.render(body);
  }
}

