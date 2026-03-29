import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './agent.entity';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';
import { ModelConfigsModule } from '../model-configs/model-configs.module';

@Module({
  imports: [TypeOrmModule.forFeature([Agent]), ModelConfigsModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
