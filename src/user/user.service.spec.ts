import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { InternalServerErrorException } from '@nestjs/common';
import { User } from '@db/__generated__/client';

describe('UserService', () => {
  let service: UserService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create user', async () => {
    const user = { id: '1', email: 'test@test.com' } as User;
    mockPrisma.user.create.mockResolvedValue(user);

    const result = await service.create({ email: 'test@test.com' } as any);

    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'test@test.com' },
    });
    expect(result).toEqual(user);
  });

  it('should return all users', async () => {
    const users = [{ id: '1' }, { id: '2' }] as User[];
    mockPrisma.user.findMany.mockResolvedValue(users);

    const result = await service.findAll();

    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(result).toEqual(users);
  });

  it('should find user by id', async () => {
    const user = { id: '1' } as User;
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const result = await service.findById('1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(user);
  });

  it('should find user by email', async () => {
    const user = { id: '1', email: 'a@test.com' } as User;
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const result = await service.findByEmail('a@test.com');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'a@test.com' },
    });
    expect(result).toEqual(user);
  });

  it('should update user', async () => {
    const user = { id: '1', email: 'updated@test.com' } as User;
    mockPrisma.user.update.mockResolvedValue(user);

    const result = await service.update('1', { email: 'updated@test.com' });

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { email: 'updated@test.com' },
    });
    expect(result).toEqual(user);
  });

  it('should throw if update fails', async () => {
    mockPrisma.user.update.mockResolvedValue(null);

    await expect(
      service.update('1', { email: 'fail@test.com' }),
    ).rejects.toThrow(InternalServerErrorException);
  });

  it('should delete user', async () => {
    const user = { id: '1' } as User;
    mockPrisma.user.delete.mockResolvedValue(user);

    const result = await service.remove('1');

    expect(prisma.user.delete).toHaveBeenCalledWith({
      where: { id: '1' },
    });
    expect(result).toEqual(user);
  });
});
