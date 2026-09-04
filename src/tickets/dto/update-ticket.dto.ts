import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { TicketPriority } from '../tickets.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}
