import { IsString, IsNotEmpty } from 'class-validator';

export class CompareVersionsDto {
  @IsString()
  @IsNotEmpty()
  fromVersion: string;

  @IsString()
  @IsNotEmpty()
  toVersion: string;
}

