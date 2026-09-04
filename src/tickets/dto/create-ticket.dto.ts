import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { TicketPriority } from '../tickets.entity';

export class CreateTicketDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsEnum(TicketPriority)
  priority: TicketPriority;
}
