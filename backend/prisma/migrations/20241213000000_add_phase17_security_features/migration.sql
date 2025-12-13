-- Phase 17: Security & Governance
-- Includes: RBAC, API Key Scopes, API Versioning, and Two-Factor Authentication

-- =============================================
-- 1. RBAC (Role-Based Access Control)
-- =============================================

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateTable
CREATE TABLE "workspace_members" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'VIEWER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspace_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "workspace_members_workspaceId_userId_key" ON "workspace_members"("workspaceId", "userId");

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_members" ADD CONSTRAINT "workspace_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- =============================================
-- 2. API Key Scopes
-- =============================================

-- AlterTable: Rename scope to scopes (array)
ALTER TABLE "api_keys" RENAME COLUMN "scope" TO "scopes";

-- AlterTable: Add workspaceId for workspace-specific keys
ALTER TABLE "api_keys" ADD COLUMN "workspaceId" TEXT;

-- =============================================
-- 3. API Versioning
-- =============================================

-- AlterTable: Add version tracking fields
ALTER TABLE "api_definitions" ADD COLUMN "isLatest" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "api_definitions" ADD COLUMN "parentId" TEXT;

-- Drop old unique constraint (workspaceId, slug)
ALTER TABLE "api_definitions" DROP CONSTRAINT "api_definitions_workspaceId_slug_key";

-- Add new unique constraint including version (workspaceId, slug, version)
ALTER TABLE "api_definitions" ADD CONSTRAINT "api_definitions_workspaceId_slug_version_key" UNIQUE("workspaceId", "slug", "version");

-- AddForeignKey for version parent relationship
ALTER TABLE "api_definitions" ADD CONSTRAINT "api_definitions_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "api_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================
-- 4. Two-Factor Authentication (2FA)
-- =============================================

-- AlterTable: Add 2FA fields to users
ALTER TABLE "users" ADD COLUMN "twoFactorSecret" TEXT;
ALTER TABLE "users" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;

