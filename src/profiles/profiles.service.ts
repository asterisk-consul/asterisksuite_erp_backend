import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getByUserId(userId: string) {
    const profile = await this.prisma.user_profiles.findUnique({
      where: { user_id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }

  async updateByUserId(userId: string, dto: UpdateProfileDto) {
    return this.prisma.user_profiles.update({
      where: { user_id: userId },
      data: dto,
    });
  }
}
