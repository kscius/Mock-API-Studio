import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async findAll() {
    return this.prisma.workspace.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { apiDefinitions: true },
        },
      },
    });
  }

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
      include: {
        apiDefinitions: {
          select: {
            id: true,
            name: true,
            slug: true,
            version: true,
            isActive: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with id ${id} not found`);
    }

    return workspace;
  }

  async findBySlug(slug: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { slug },
    });

    if (!workspace) {
      throw new NotFoundException(`Workspace with slug ${slug} not found`);
    }

    return workspace;
  }

  async create(dto: CreateWorkspaceDto) {
    // Check if slug already exists
    const existing = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });

    if (existing) {
      throw new ConflictException(`Workspace with slug ${dto.slug} already exists`);
    }

    return this.prisma.workspace.create({
      data: dto,
    });
  }

  async update(id: string, dto: UpdateWorkspaceDto) {
    await this.findOne(id); // Verify exists

    return this.prisma.workspace.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id); // Verify exists

    // This will cascade delete all APIs and endpoints
    await this.prisma.workspace.delete({
      where: { id },
    });

    return { message: 'Workspace deleted successfully' };
  }

  /**
   * Get or create default workspace
   */
  async getDefaultWorkspace() {
    const defaultSlug = 'default';
    let workspace = await this.prisma.workspace.findUnique({
      where: { slug: defaultSlug },
    });

    if (!workspace) {
      workspace = await this.prisma.workspace.create({
        data: {
          name: 'Default Workspace',
          slug: defaultSlug,
          description: 'Auto-generated default workspace',
        },
      });
    }

    return workspace;
  }

  // ========== WORKSPACE MEMBERS ==========

  /**
   * Get all members of a workspace
   */
  async getMembers(workspaceId: string) {
    await this.findOne(workspaceId); // Verify workspace exists

    return this.prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            isActive: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Add a member to workspace
   */
  async addMember(workspaceId: string, dto: AddMemberDto) {
    await this.findOne(workspaceId); // Verify workspace exists

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException(`User with email ${dto.email} not found`);
    }

    // Check if already a member
    const existing = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new ConflictException('User is already a member of this workspace');
    }

    return this.prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: dto.role || Role.VIEWER,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update member role
   */
  async updateMemberRole(workspaceId: string, memberId: string, dto: UpdateMemberRoleDto) {
    await this.findOne(workspaceId); // Verify workspace exists

    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    return this.prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role: dto.role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, memberId: string) {
    await this.findOne(workspaceId); // Verify workspace exists

    const member = await this.prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new NotFoundException('Member not found in this workspace');
    }

    await this.prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed successfully' };
  }

  /**
   * Get user's role in a workspace
   */
  async getUserRole(workspaceId: string, userId: string): Promise<Role | null> {
    const member = await this.prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    return member ? member.role : null;
  }

  /**
   * Check if user has permission in workspace
   */
  async hasPermission(workspaceId: string, userId: string, requiredRole: Role): Promise<boolean> {
    const userRole = await this.getUserRole(workspaceId, userId);
    
    if (!userRole) {
      return false;
    }

    // Permission hierarchy: ADMIN > EDITOR > VIEWER
    const roleHierarchy = {
      [Role.ADMIN]: 3,
      [Role.EDITOR]: 2,
      [Role.VIEWER]: 1,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }
}

