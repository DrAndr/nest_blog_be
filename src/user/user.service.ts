import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  create(createUserDto: CreateUserDto) {
    try {
      return this.prisma.user.create({ data: createUserDto });
    } catch (err) {
      console.error('User > create => ' + err);
    }
    return false;
  }

  async findAll() {
    try {
      return await this.prisma.user.findMany({
        /** TODO add limits */
      });
    } catch (err) {
      console.error('User > findAll => ' + err);
    }
  }

  async findById(id: string) {
    try {
      return await this.prisma.user.findFirst({
        where: {
          id,
        },
      });
    } catch (err) {
      console.error('User > findById => ' + err);
    }
  }

  async findByEmail(email: string) {
    try {
      return await this.prisma.user.findFirst({
        where: {
          email,
        },
      });
    } catch (err) {
      console.error('User > findByEmail => ' + err);
    }
  }

  update(id: string, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: string) {
    return `This action removes a #${id} user`;
  }
}
