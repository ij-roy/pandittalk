import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import {
  CustomerContractsController,
  SupportController,
  PanditApplicationsController,
} from './customer-contracts.controller';
import { CustomerContractsService } from './customer-contracts.service';

@Module({
  imports: [AuthModule],
  controllers: [
    CustomerContractsController,
    SupportController,
    PanditApplicationsController,
  ],
  providers: [CustomerContractsService],
})
export class CustomerContractsModule {}
