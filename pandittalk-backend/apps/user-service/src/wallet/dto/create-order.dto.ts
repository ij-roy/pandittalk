import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID()
  @IsNotEmpty()
  coinPackageId!: string;
}
