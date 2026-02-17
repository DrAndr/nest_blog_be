import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PublicUpdateUserDto } from './dto/public-update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/__generated__/client';
import { PublicUserDto } from './dto/publick-user.dto';
import { ServiceUpdateUserDto } from '@/user/dto/service-update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({ data: createUserDto });
  }

  async findAll(): Promise<User[] | null> {
    return this.prisma.user.findMany({
      /** TODO add limits */
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async update(id: string, updateUserDto: ServiceUpdateUserDto): Promise<User> {
    const updatedUser = await this.prisma.user.update({
      where: {
        id,
      },
      data: updateUserDto,
    });

    if (!updatedUser) {
      throw new InternalServerErrorException('Failed to update user.');
    }

    return updatedUser;
  }

  async remove(id: string): Promise<User> {
    return this.prisma.user.delete({ where: { id } });
  }
}
