import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProfilesService } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMyProfile(@Request() req) {
    return this.profilesService.getByUserId(req.user.userId);
  }

  @Patch('me')
  updateMyProfile(
    @Request() req,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateByUserId(req.user.userId, dto);
  }
}
