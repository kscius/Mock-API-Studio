import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { TeamRole } from '@prisma/client';

@Injectable()
export class TeamsService {
  private readonly logger = new Logger(TeamsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: {
    organizationId: string;
    name: string;
    slug: string;
    description?: string;
    createdById: string;
  }) {
    const existing = await this.prisma.team.findUnique({
      where: {
        organizationId_slug: {
          organizationId: data.organizationId,
          slug: data.slug,
        },
      },
    });

    if (existing) {
      throw new ConflictException(`Team with slug '${data.slug}' already exists in this organization`);
    }

    const team = await this.prisma.team.create({
      data: {
        organizationId: data.organizationId,
        name: data.name,
        slug: data.slug,
        description: data.description,
        members: {
          create: {
            userId: data.createdById,
            role: TeamRole.LEAD,
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

    this.logger.log(`Team created: ${team.name} (${team.id})`);

    return team;
  }

  async findAll(organizationId: string) {
    return this.prisma.team.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            members: true,
            workspaces: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async addMember(teamId: string, userId: string, role: TeamRole = TeamRole.MEMBER) {
    const existing = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: { teamId, userId },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this team');
    }

    return this.prisma.teamMember.create({
      data: { teamId, userId, role },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });
  }

  async removeMember(teamId: string, userId: string) {
    await this.prisma.teamMember.delete({
      where: {
        teamId_userId: { teamId, userId },
      },
    });

    this.logger.log(`Member removed from team ${teamId}: ${userId}`);
  }
}

