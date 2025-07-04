import { Module } from '@nestjs/common';
import { ArenaService } from './arena.service';

@Module({
  providers: [ArenaService]
})
export class ArenaModule {}
