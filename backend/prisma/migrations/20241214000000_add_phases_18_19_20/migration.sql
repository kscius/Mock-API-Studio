-- Phases 18, 19, 20: Integrations, Scale & Performance, Enterprise Features

-- =============================================
-- Phase 18: Integrations
-- =============================================

-- CreateTable: SlackIntegration
CREATE TABLE "slack_integrations" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "slack_integrations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "slack_integrations_workspaceId_key" ON "slack_integrations"("workspaceId");

-- AddForeignKey
ALTER TABLE "slack_integrations" ADD CONSTRAINT "slack_integrations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- Phase 19: Scale & Performance
-- =============================================

-- AlterTable: ApiEndpoint - Add Proxy Mode fields
ALTER TABLE "api_endpoints" ADD COLUMN "proxyMode" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "api_endpoints" ADD COLUMN "proxyTarget" TEXT;
ALTER TABLE "api_endpoints" ADD COLUMN "proxyHeaders" JSONB;
ALTER TABLE "api_endpoints" ADD COLUMN "proxyTimeout" INTEGER NOT NULL DEFAULT 5000;

-- AlterTable: ApiEndpoint - Add Request Deduplication
ALTER TABLE "api_endpoints" ADD COLUMN "deduplication" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: ApiEndpoint - Add CDN/Browser Caching
ALTER TABLE "api_endpoints" ADD COLUMN "cacheEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "api_endpoints" ADD COLUMN "cacheTTL" INTEGER NOT NULL DEFAULT 3600;
ALTER TABLE "api_endpoints" ADD COLUMN "cacheControl" TEXT NOT NULL DEFAULT 'public';

-- CreateTable: WebSocketEndpoint
CREATE TABLE "websocket_endpoints" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "events" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "websocket_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "websocket_endpoints_apiId_path_key" ON "websocket_endpoints"("apiId", "path");

-- AddForeignKey
ALTER TABLE "websocket_endpoints" ADD CONSTRAINT "websocket_endpoints_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "api_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: MockRequest - Add Advanced Analytics
ALTER TABLE "mock_requests" ADD COLUMN "requestSize" INTEGER;
ALTER TABLE "mock_requests" ADD COLUMN "responseSize" INTEGER;
ALTER TABLE "mock_requests" ADD COLUMN "geoCountry" TEXT;
ALTER TABLE "mock_requests" ADD COLUMN "geoCity" TEXT;
ALTER TABLE "mock_requests" ADD COLUMN "deduplicated" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "mock_requests" ADD COLUMN "proxied" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex: MockRequest - Add geo index
CREATE INDEX "mock_requests_geoCountry_idx" ON "mock_requests"("geoCountry");

-- =============================================
-- Phase 20: Enterprise Features
-- =============================================

-- CreateTable: SamlConfig
CREATE TABLE "saml_configs" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "ssoUrl" TEXT NOT NULL,
    "certificate" TEXT NOT NULL,
    "attributeMapping" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saml_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "saml_configs_workspaceId_key" ON "saml_configs"("workspaceId");

-- AddForeignKey
ALTER TABLE "saml_configs" ADD CONSTRAINT "saml_configs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: CustomDomain
CREATE TABLE "custom_domains" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "verificationTxt" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "sslEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sslCertificate" TEXT,
    "sslPrivateKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "custom_domains_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "custom_domains_workspaceId_key" ON "custom_domains"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "custom_domains_domain_key" ON "custom_domains"("domain");

-- AddForeignKey
ALTER TABLE "custom_domains" ADD CONSTRAINT "custom_domains_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: Workspace - Add White-labeling fields
ALTER TABLE "workspaces" ADD COLUMN "logoUrl" TEXT;
ALTER TABLE "workspaces" ADD COLUMN "primaryColor" TEXT DEFAULT '#667eea';
ALTER TABLE "workspaces" ADD COLUMN "secondaryColor" TEXT DEFAULT '#764ba2';
ALTER TABLE "workspaces" ADD COLUMN "footerText" TEXT;

