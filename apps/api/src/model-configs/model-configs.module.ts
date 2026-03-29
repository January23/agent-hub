import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModelConfigsController } from './model-configs.controller';
import { ModelConfigsService } from './model-configs.service';
import { ModelConfigEntity } from './model-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ModelConfigEntity])],
  controllers: [ModelConfigsController],
  providers: [ModelConfigsService],
  exports: [ModelConfigsService],
})
export class ModelConfigsModule {}
