import { Transform } from 'class-transformer';
import {
  ValidateBy,
  MaxLength,
  Matches,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Matches(/^[a-zA-Z0-9_-]{3,40}$/)
  nickname!: string;

  @IsString()
  @ValidateBy({
    name: 'passwordBytes',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' && Buffer.byteLength(value) <= 72,
      defaultMessage: () => 'password must be at most 72 UTF-8 bytes',
    },
  })
  @MaxLength(72)
  @MinLength(6)
  password!: string;
}
