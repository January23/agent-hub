import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnowledgeBasesController } from './knowledge-bases.controller';
import { KnowledgeBasesService } from './knowledge-bases.service';
import { KnowledgeBaseEntity } from './knowledge-base.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnowledgeBaseEntity])],
  controllers: [KnowledgeBasesController],
  providers: [KnowledgeBasesService],
  exports: [KnowledgeBasesService],
})
export class KnowledgeBasesModule {}
