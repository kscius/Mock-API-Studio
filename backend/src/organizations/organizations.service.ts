import { Injectable, Logger, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { OrganizationRole } from '@prisma/client';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    slug: string;
    description?: string;
    billingEmail?: string;
    createdById: string;
  }) {
    // Check if slug is taken
    const existing = await this.prisma.organization.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      throw new ConflictException(`Organization with slug '${data.slug}' already exists`);
    }

    // Create organization with creator as OWNER
    const organization = await this.prisma.organization.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        billingEmail: data.billingEmail,
        members: {
          create: {
            userId: data.createdById,
            role: OrganizationRole.OWNER,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    this.logger.log(`Organization created: ${organization.name} (${organization.id})`);

    return organization;
  }

  async findAll(userId: string) {
    const organizations = await this.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        _count: {
          select: {
            members: true,
            teams: true,
            workspaces: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return organizations;
  }

  async findOne(id: string, userId: string) {
    await this.verifyMembership(id, userId);

    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
        teams: {
          include: {
            _count: {
              select: { members: true },
            },
          },
        },
        workspaces: {
          include: {
            _count: {
              select: { apiDefinitions: true },
            },
          },
        },
      },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${id} not found`);
    }

    return organization;
  }

  async addMember(organizationId: string, userId: string, requesterId: string, role: OrganizationRole = OrganizationRole.MEMBER) {
    // Verify requester is OWNER or ADMIN
    await this.verifyRole(organizationId, requesterId, [OrganizationRole.OWNER, OrganizationRole.ADMIN]);

    // Check if user is already a member
    const existing = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this organization');
    }

    const member = await this.prisma.organizationMember.create({
      data: {
        organizationId,
        userId,
        role,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    this.logger.log(`Member added to organization ${organizationId}: ${userId} (${role})`);

    return member;
  }

  async updateMemberRole(organizationId: string, userId: string, requesterId: string, newRole: OrganizationRole) {
    // Verify requester is OWNER
    await this.verifyRole(organizationId, requesterId, [OrganizationRole.OWNER]);

    const member = await this.prisma.organizationMember.update({
      where: {
        organizationId_userId: { organizationId, userId },
      },
      data: {
        role: newRole,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    this.logger.log(`Member role updated in organization ${organizationId}: ${userId} -> ${newRole}`);

    return member;
  }

  async removeMember(organizationId: string, userId: string, requesterId: string) {
    // Verify requester is OWNER or ADMIN
    await this.verifyRole(organizationId, requesterId, [OrganizationRole.OWNER, OrganizationRole.ADMIN]);

    // Cannot remove the last OWNER
    const owners = await this.prisma.organizationMember.count({
      where: {
        organizationId,
        role: OrganizationRole.OWNER,
      },
    });

    const memberToRemove = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (memberToRemove?.role === OrganizationRole.OWNER && owners <= 1) {
      throw new ForbiddenException('Cannot remove the last owner of an organization');
    }

    await this.prisma.organizationMember.delete({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    this.logger.log(`Member removed from organization ${organizationId}: ${userId}`);
  }

  private async verifyMembership(organizationId: string, userId: string): Promise<void> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!member) {
      throw new ForbiddenException('User is not a member of this organization');
    }
  }

  private async verifyRole(organizationId: string, userId: string, allowedRoles: OrganizationRole[]): Promise<void> {
    const member = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId },
      },
    });

    if (!member || !allowedRoles.includes(member.role)) {
      throw new ForbiddenException('Insufficient permissions');
    }
  }
}

