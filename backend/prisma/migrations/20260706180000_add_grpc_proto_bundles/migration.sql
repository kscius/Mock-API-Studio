-- CreateTable
CREATE TABLE "grpc_proto_bundles" (
    "id" TEXT NOT NULL,
    "apiId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "packageName" TEXT,
    "services" JSONB NOT NULL,
    "sha256" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grpc_proto_bundles_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "api_definitions" ADD COLUMN "grpcWireEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "grpc_proto_bundles_apiId_filename_key" ON "grpc_proto_bundles"("apiId", "filename");

-- AddForeignKey
ALTER TABLE "grpc_proto_bundles" ADD CONSTRAINT "grpc_proto_bundles_apiId_fkey" FOREIGN KEY ("apiId") REFERENCES "api_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
