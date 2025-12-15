import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ChangeRequestStatus } from '@prisma/client';

@Injectable()
export class ChangeRequestsService {
  private readonly logger = new Logger(ChangeRequestsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: {
    workspaceId: string;
    apiId?: string;
    endpointId?: string;
    title: string;
    description: string;
    changes: any;
    createdById: string;
    requiredApprovals?: number;
  }) {
    const changeRequest = await this.prisma.changeRequest.create({
      data: {
        workspaceId: data.workspaceId,
        apiId: data.apiId,
        endpointId: data.endpointId,
        title: data.title,
        description: data.description,
        changes: data.changes,
        createdById: data.createdById,
        requiredApprovals: data.requiredApprovals || 1,
        status: ChangeRequestStatus.PENDING,
      },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    this.logger.log(`Change request created: ${changeRequest.title} (${changeRequest.id})`);

    return changeRequest;
  }

  async findAll(workspaceId: string, status?: ChangeRequestStatus) {
    return this.prisma.changeRequest.findMany({
      where: {
        workspaceId,
        ...(status && { status }),
      },
      include: {
        createdBy: {
          select: { id: true, email: true, name: true },
        },
        approvals: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approve(changeRequestId: string, userId: string, comment?: string) {
    // Check if user already approved
    const existing = await this.prisma.changeRequestApproval.findUnique({
      where: {
        changeRequestId_userId: { changeRequestId, userId },
      },
    });

    if (existing) {
      throw new ForbiddenException('You have already reviewed this change request');
    }

    const approval = await this.prisma.changeRequestApproval.create({
      data: {
        changeRequestId,
        userId,
        approved: true,
        comment,
      },
    });

    // Check if enough approvals
    const changeRequest = await this.prisma.changeRequest.findUnique({
      where: { id: changeRequestId },
      include: {
        approvals: {
          where: { approved: true },
        },
      },
    });

    if (changeRequest && changeRequest.approvals.length >= changeRequest.requiredApprovals) {
      await this.prisma.changeRequest.update({
        where: { id: changeRequestId },
        data: { status: ChangeRequestStatus.APPROVED },
      });

      this.logger.log(`Change request approved: ${changeRequestId}`);
    }

    return approval;
  }

  async reject(changeRequestId: string, userId: string, comment: string) {
    const approval = await this.prisma.changeRequestApproval.create({
      data: {
        changeRequestId,
        userId,
        approved: false,
        comment,
      },
    });

    await this.prisma.changeRequest.update({
      where: { id: changeRequestId },
      data: { status: ChangeRequestStatus.REJECTED },
    });

    this.logger.log(`Change request rejected: ${changeRequestId}`);

    return approval;
  }
}

