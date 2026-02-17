import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/infrastructure/prisma-provider/prisma.service';
import { type Prisma, User } from '@prisma/__generated__/client';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create new user record
   * @param data
   */
  create(data: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data });
  }

  /**
   * Find users cording to filters and pagination limits TODO
   */
  async findAll(): Promise<User[] | null> {
    return this.prisma.user.findMany({
      /** TODO add limits */
    });
  }

  /**
   * Find user by ID
   * @param id string
   * @return User | null
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  /**
   * Find user by uniq email
   * @param email string
   * @return User | null
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  /**
   * Update user
   * @param id
   * @param data <Prisma.UserUpdateInput>
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data,
    });

    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to update user.');
    }

    return updatedUser;
  }

  /**
   * To delete user record
   * @param id
   */
  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
