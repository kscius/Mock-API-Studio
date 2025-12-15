import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(private prisma: PrismaService) {}

  async create(data: {
    entityType: string;
    entityId: string;
    userId: string;
    content: string;
    mentions?: string[];
    parentId?: string;
  }) {
    const comment = await this.prisma.comment.create({
      data: {
        entityType: data.entityType,
        entityId: data.entityId,
        userId: data.userId,
        content: data.content,
        mentions: data.mentions || [],
        parentId: data.parentId,
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
        },
      },
    });

    this.logger.log(`Comment created on ${data.entityType} ${data.entityId}`);

    return comment;
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.prisma.comment.findMany({
      where: {
        entityType,
        entityId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
        replies: {
          include: {
            user: {
              select: { id: true, email: true, name: true },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async resolve(commentId: string, userId: string) {
    return this.prisma.comment.update({
      where: { id: commentId },
      data: { isResolved: true },
    });
  }
}

