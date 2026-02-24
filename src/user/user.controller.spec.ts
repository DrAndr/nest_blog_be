import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRole } from '@db/__generated__/enums';
import { User } from '@db/__generated__/client';

describe('UserController', () => {
  let controller: UserController;
  let userService: UserService;

  const mockUserService = {
    findById: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    controller = module.get<UserController>(UserController);
    userService = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return user profile', async () => {
    const user = { id: '1', email: 'test@test.com' } as User;
    mockUserService.findById.mockResolvedValue(user);

    const result = await controller.getUserProfile('1');

    expect(userService.findById).toHaveBeenCalledWith('1');
    expect(result).toEqual(user);
  });

  it('should update user', async () => {
    const dto = { email: 'updated@test.com' };
    const updatedUser = { id: '1', ...dto } as User;

    mockUserService.update.mockResolvedValue(updatedUser);

    const result = await controller.update('1', dto as any);

    expect(userService.update).toHaveBeenCalledWith('1', dto);
    expect(result).toEqual(updatedUser);
  });

  it('should remove user and return message', async () => {
    mockUserService.remove.mockResolvedValue({ id: '1' });

    const result = await controller.remove('1');

    expect(userService.remove).toHaveBeenCalledWith('1');
    expect(result).toEqual({
      message: 'User profile deleted successfully.',
    });
  });
});
