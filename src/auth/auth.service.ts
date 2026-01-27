import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where: { email },
      include: {
        user_companies: {
          include: {
            user_company_roles: {
              include: {
                roles: true,
              },
            },
          },
        },
      },
    });

    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, user_companies, ...result } = user;
      // Flatten roles from all companies
      const roles = user_companies.flatMap((uc) =>
        uc.user_company_roles.map((ucr) => ucr.roles.code),
      );
      return { ...result, roles };
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const payload = { email: user.email, sub: user.id, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(registerDto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.prisma.users.create({
      data: {
        email: registerDto.email,
        password_hash: hashedPassword,
        user_profiles: {
          create: {
            first_name: registerDto.firstName,
            last_name: registerDto.lastName,
          },
        },
      },
      include: {
        user_profiles: true,
      },
    });

    const { password_hash, ...result } = user;
    return result;
  }
}
