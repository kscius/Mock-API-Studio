import * as protoLoader from '@grpc/proto-loader';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import * as path from 'node:path';
import { extractCatalogs, flattenServices } from './grpc-proto.parser';

const SAMPLE_PROTO = `
syntax = "proto3";
package users.v1;

service UserService {
  rpc GetUser (GetUserRequest) returns (User);
}

message GetUserRequest { string id = 1; }
message User { string id = 1; string name = 2; }
`;

describe('extractCatalogs', () => {
  it('parses flat package definition keys from proto-loader', () => {
    const dir = mkdtempSync(path.join(tmpdir(), 'grpc-proto-'));
    const file = path.join(dir, 'user.proto');
    writeFileSync(file, SAMPLE_PROTO);

    const definition = protoLoader.loadSync(file, {
      keepCase: true,
      longs: String,
      enums: String,
      defaults: true,
      oneofs: true,
      includeDirs: [dir],
    });
    const catalogs = extractCatalogs(definition);
    const services = flattenServices(catalogs);

    expect(services).toHaveLength(1);
    expect(services[0].fqName).toBe('users.v1.UserService');
    expect(services[0].methods[0].name).toBe('GetUser');
  });
});
