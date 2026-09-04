import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/users.entity';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.tagsService.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto.name);
  }
}
