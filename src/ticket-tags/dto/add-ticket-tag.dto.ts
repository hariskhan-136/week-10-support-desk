import { IsInt, Min } from 'class-validator';

export class AddTicketTagDto {
  @IsInt()
  @Min(1)
  tagId: number;
}
