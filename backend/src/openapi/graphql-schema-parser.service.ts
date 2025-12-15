import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { parse, buildSchema, GraphQLSchema, GraphQLObjectType, GraphQLField } from 'graphql';

@Injectable()
export class GraphQLSchemaParserService {
  private readonly logger = new Logger(GraphQLSchemaParserService.name);

  /**
   * Parse GraphQL schema file and generate endpoint definitions
   */
  async parseGraphQLSchema(schemaContent: string): Promise<{
    queries: any[];
    mutations: any[];
    types: Map<string, any>;
  }> {
    try {
      // Parse and build the schema
      const schema: GraphQLSchema = buildSchema(schemaContent);

      // Extract queries
      const queries = this.extractOperations(schema.getQueryType());

      // Extract mutations
      const mutations = this.extractOperations(schema.getMutationType());

      // Extract custom types
      const types = this.extractTypes(schema);

      this.logger.log(
        `Parsed GraphQL schema: ${queries.length} queries, ${mutations.length} mutations, ${types.size} types`,
      );

      return {
        queries,
        mutations,
        types,
      };
    } catch (error) {
      this.logger.error('Error parsing GraphQL schema', error.stack);
      throw new BadRequestException(`Invalid GraphQL schema: ${error.message}`);
    }
  }

  /**
   * Extract operations (queries or mutations) from a GraphQL type
   */
  private extractOperations(type: GraphQLObjectType | null | undefined): any[] {
    if (!type) return [];

    const operations: any[] = [];
    const fields = type.getFields();

    for (const [name, field] of Object.entries(fields)) {
      operations.push({
        name,
        description: field.description || null,
        args: this.extractArguments(field),
        returnType: this.getTypeString(field.type),
        exampleResponse: this.generateExampleResponse(field.type),
      });
    }

    return operations;
  }

  /**
   * Extract arguments from a GraphQL field
   */
  private extractArguments(field: GraphQLField<any, any>): any[] {
    return field.args.map((arg) => ({
      name: arg.name,
      type: this.getTypeString(arg.type),
      description: arg.description || null,
      defaultValue: arg.defaultValue,
    }));
  }

  /**
   * Extract custom types from the schema
   */
  private extractTypes(schema: GraphQLSchema): Map<string, any> {
    const typesMap = new Map<string, any>();
    const typeMap = schema.getTypeMap();

    for (const [name, type] of Object.entries(typeMap)) {
      // Skip built-in types
      if (name.startsWith('__')) continue;

      if (type instanceof GraphQLObjectType) {
        const fields: any = {};
        const fieldMap = type.getFields();

        for (const [fieldName, field] of Object.entries(fieldMap)) {
          fields[fieldName] = {
            type: this.getTypeString(field.type),
            description: field.description || null,
          };
        }

        typesMap.set(name, {
          kind: 'OBJECT',
          name,
          description: type.description || null,
          fields,
        });
      }
    }

    return typesMap;
  }

  /**
   * Get string representation of a GraphQL type
   */
  private getTypeString(type: any): string {
    if (type.ofType) {
      // Handle NonNull and List wrappers
      const innerType = this.getTypeString(type.ofType);
      if (type.toString().startsWith('[')) {
        return `[${innerType}]`;
      }
      return `${innerType}!`;
    }
    return type.name;
  }

  /**
   * Generate example response based on GraphQL type
   */
  private generateExampleResponse(type: any): any {
    const typeName = this.getTypeString(type);

    // Handle lists
    if (typeName.startsWith('[')) {
      const innerType = typeName.slice(1, -1).replace('!', '');
      return [this.generateExampleForType(innerType)];
    }

    return this.generateExampleForType(typeName.replace('!', ''));
  }

  /**
   * Generate example value for a specific type
   */
  private generateExampleForType(typeName: string): any {
    switch (typeName) {
      case 'String':
        return 'example string';
      case 'Int':
        return 42;
      case 'Float':
        return 3.14;
      case 'Boolean':
        return true;
      case 'ID':
        return '550e8400-e29b-41d4-a716-446655440000';
      default:
        // For custom types, return an object with mock fields
        return {
          id: '1',
          __typename: typeName,
        };
    }
  }

  /**
   * Convert parsed schema to API endpoint definitions
   */
  convertToEndpoints(
    parsed: {
      queries: any[];
      mutations: any[];
      types: Map<string, any>;
    },
  ): any[] {
    const endpoints: any[] = [];

    // Convert queries
    for (const query of parsed.queries) {
      endpoints.push({
        method: 'POST',
        path: `/graphql`,
        summary: `GraphQL Query: ${query.name}`,
        type: 'GRAPHQL',
        operationName: query.name,
        operationType: 'query',
        requestSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            variables: { type: 'object' },
            operationName: { type: 'string', enum: [query.name] },
          },
          required: ['query'],
        },
        responses: [
          {
            status: 200,
            body: {
              data: {
                [query.name]: query.exampleResponse,
              },
            },
            isDefault: true,
          },
        ],
        enabled: true,
      });
    }

    // Convert mutations
    for (const mutation of parsed.mutations) {
      endpoints.push({
        method: 'POST',
        path: `/graphql`,
        summary: `GraphQL Mutation: ${mutation.name}`,
        type: 'GRAPHQL',
        operationName: mutation.name,
        operationType: 'mutation',
        requestSchema: {
          type: 'object',
          properties: {
            query: { type: 'string' },
            variables: { type: 'object' },
            operationName: { type: 'string', enum: [mutation.name] },
          },
          required: ['query'],
        },
        responses: [
          {
            status: 200,
            body: {
              data: {
                [mutation.name]: mutation.exampleResponse,
              },
            },
            isDefault: true,
          },
        ],
        enabled: true,
      });
    }

    return endpoints;
  }
}

