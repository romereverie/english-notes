import { Transform } from 'class-transformer';
import { IsNotEmpty, ValidateIf, IsString, MaxLength } from 'class-validator';
export class CreateNoteDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @MaxLength(20000)
  content?: string;
}
