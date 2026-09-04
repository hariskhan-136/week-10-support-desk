import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  body: string;

  @IsOptional()
  @IsBoolean()
  isInternal?: boolean;
}
