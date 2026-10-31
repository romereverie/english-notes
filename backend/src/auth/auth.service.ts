import {BadRequestException, Injectable} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: {
        nickname: dto.nickname,
      },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Nickname is already taken',
      );
    }

    const passwordHash = await bcrypt.hash(
      dto.password,
      10,
    );

    const user = await this.prisma.user.create({
      data: {
        nickname: dto.nickname,
        passwordHash,
      },
    });

    return {
      id: user.id,
      nickname: user.nickname,
      createdAt: user.createdAt,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        nickname: dto.nickname,
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Invalid credentials',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException(
        'Invalid credentials',
      );
    }

    const accessToken =
      await this.jwtService.signAsync({
        sub: user.id,
        nickname: user.nickname,
      });

    return {
      accessToken,
    };
  }
}