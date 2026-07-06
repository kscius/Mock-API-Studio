-- Advanced mocking fields for ApiEndpoint
ALTER TABLE "api_endpoints" ADD COLUMN IF NOT EXISTS "sequenceMode" TEXT;
ALTER TABLE "api_endpoints" ADD COLUMN IF NOT EXISTS "chaosEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "api_endpoints" ADD COLUMN IF NOT EXISTS "chaosConfig" JSONB;
ALTER TABLE "api_endpoints" ADD COLUMN IF NOT EXISTS "stateEnabled" BOOLEAN NOT NULL DEFAULT false;
