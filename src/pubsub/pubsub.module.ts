import { Module } from '@nestjs/common';
import { pubSubProvider } from './pubsub.provider';

@Module({
  providers: [pubSubProvider],
  exports: [pubSubProvider],
})
export class PubSubModule {}
