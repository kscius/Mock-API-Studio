import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { RedisService } from '../common/redis/redis.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

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
}

