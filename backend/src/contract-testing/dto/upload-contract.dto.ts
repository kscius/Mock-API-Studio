import { IsString, IsNotEmpty } from 'class-validator';

export class UploadContractDto {
  @IsString()
  @IsNotEmpty()
  apiId: string;
}

