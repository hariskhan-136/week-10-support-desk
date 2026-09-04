import {
  Body,
  Controller,
  Get,
  Delete,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/users.entity';
import { ChangeStatusDto } from './dto/change-status.dto';
import { ListTicketsDto } from './dto/list-tickets.dto';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() request: Request, @Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(
      Number(request.user!.sub),
      createTicketDto,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Req() request: Request, @Query() listTicketsDto: ListTicketsDto) {
    return this.ticketsService.findAll(
      Number(request.user!.sub),
      listTicketsDto,
    );
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string, @Req() request: Request) {
    const ticket = await this.ticketsService.findOne(
      Number(id),
      Number(request.user!.sub),
    );

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    return ticket;
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Req() request: Request,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(
      Number(id),
      Number(request.user!.sub),
      updateTicketDto,
    );
  }

  @Post(':id/assign')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  assign(
    @Param('id') id: string,
    @Req() request: Request,
    @Body() assignTicketDto: AssignTicketDto,
  ) {
    return this.ticketsService.assign(
      Number(id),
      Number(request.user!.sub),
      assignTicketDto.assigneeId,
    );
  }

  @Post(':id/status')
  @HttpCode(200)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AGENT, UserRole.ADMIN)
  changeStatus(
    @Param('id') id: string,
    @Req() request: Request,
    @Body() changeStatusDto: ChangeStatusDto,
  ) {
    return this.ticketsService.changeStatus(
      Number(id),
      Number(request.user!.sub),
      changeStatusDto,
    );
  }

  @Delete(':id')
  @HttpCode(204)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.ticketsService.remove(Number(id));
  }
}
