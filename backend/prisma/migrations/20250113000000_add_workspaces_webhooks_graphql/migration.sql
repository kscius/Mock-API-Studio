-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_subscriptions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "apiId" TEXT,
    "targetUrl" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "secret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_subscriptions_pkey" PRIMARY KEY ("id")
);

-- AlterTable ApiDefinition: add workspaceId, change slug unique constraint
ALTER TABLE "api_definitions" ADD COLUMN "workspaceId" TEXT;
ALTER TABLE "api_definitions" DROP CONSTRAINT "api_definitions_slug_key";

-- AlterTable ApiEndpoint: add GraphQL fields
ALTER TABLE "api_endpoints" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'REST';
ALTER TABLE "api_endpoints" ADD COLUMN "operationName" TEXT;
ALTER TABLE "api_endpoints" ADD COLUMN "operationType" TEXT;

-- AlterTable MockRequest: add workspaceId
ALTER TABLE "mock_requests" ADD COLUMN "workspaceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");
CREATE INDEX "webhook_subscriptions_workspaceId_isActive_idx" ON "webhook_subscriptions"("workspaceId", "isActive");
CREATE UNIQUE INDEX "api_definitions_workspaceId_slug_key" ON "api_definitions"("workspaceId", "slug");
CREATE INDEX "mock_requests_workspaceId_apiSlug_createdAt_idx" ON "mock_requests"("workspaceId", "apiSlug", "createdAt");

-- AddForeignKey
ALTER TABLE "api_definitions" ADD CONSTRAINT "api_definitions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create default workspace for existing data
INSERT INTO "workspaces" ("id", "name", "slug", "description", "isActive", "createdAt", "updatedAt")
VALUES ('default-workspace-id', 'Default Workspace', 'default', 'Auto-generated default workspace', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Assign existing APIs to default workspace
UPDATE "api_definitions" SET "workspaceId" = 'default-workspace-id' WHERE "workspaceId" IS NULL;

-- Make workspaceId NOT NULL after assigning
ALTER TABLE "api_definitions" ALTER COLUMN "workspaceId" SET NOT NULL;

