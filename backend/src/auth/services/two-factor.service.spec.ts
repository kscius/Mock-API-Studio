import { Test, TestingModule } from '@nestjs/testing';
import { TwoFactorService } from './two-factor.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { authenticator } from 'otplib';

describe('TwoFactorService', () => {
  let service: TwoFactorService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              update: jest.fn(),
              findUnique: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TwoFactorService>(TwoFactorService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSecret', () => {
    it('should generate a secret and otpauth URL', () => {
      const email = 'test@example.com';
      const result = service.generateSecret(email);

      expect(result.secret).toBeDefined();
      expect(result.otpauthUrl).toBeDefined();
      expect(result.otpauthUrl).toContain('otpauth://totp/');
      expect(result.otpauthUrl).toContain(email);
    });
  });

  describe('generateQRCode', () => {
    it('should generate a QR code data URL', async () => {
      const { otpauthUrl } = service.generateSecret('test@example.com');
      const qrCode = await service.generateQRCode(otpauthUrl);

      expect(qrCode).toBeDefined();
      expect(qrCode).toMatch(/^data:image\/png;base64,/);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const secret = authenticator.generateSecret();
      const token = authenticator.generate(secret);

      const result = service.verifyToken(secret, token);

      expect(result).toBe(true);
    });

    it('should reject an invalid token', () => {
      const secret = authenticator.generateSecret();
      const invalidToken = '000000';

      const result = service.verifyToken(secret, invalidToken);

      expect(result).toBe(false);
    });

    it('should handle errors gracefully', () => {
      const result = service.verifyToken('invalid-secret', 'invalid-token');

      expect(result).toBe(false);
    });
  });

  describe('enableTwoFactor', () => {
    it('should enable 2FA for a user', async () => {
      const userId = 'user1';
      const secret = 'test-secret';

      await service.enableTwoFactor(userId, secret);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          twoFactorSecret: secret,
          twoFactorEnabled: true,
        },
      });
    });
  });

  describe('disableTwoFactor', () => {
    it('should disable 2FA for a user', async () => {
      const userId = 'user1';

      await service.disableTwoFactor(userId);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          twoFactorSecret: null,
          twoFactorEnabled: false,
        },
      });
    });
  });

  describe('isTwoFactorEnabled', () => {
    it('should return true if 2FA is enabled', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        twoFactorEnabled: true,
      } as any);

      const result = await service.isTwoFactorEnabled('user1');

      expect(result).toBe(true);
    });

    it('should return false if 2FA is disabled', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        twoFactorEnabled: false,
      } as any);

      const result = await service.isTwoFactorEnabled('user1');

      expect(result).toBe(false);
    });

    it('should return false if user not found', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue(null);

      const result = await service.isTwoFactorEnabled('user1');

      expect(result).toBe(false);
    });
  });

  describe('getTwoFactorSecret', () => {
    it('should return the secret if exists', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        twoFactorSecret: 'secret123',
      } as any);

      const result = await service.getTwoFactorSecret('user1');

      expect(result).toBe('secret123');
    });

    it('should return null if no secret', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
        twoFactorSecret: null,
      } as any);

      const result = await service.getTwoFactorSecret('user1');

      expect(result).toBe(null);
    });
  });
});

