import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { LeadsModule } from './leads/leads.module';
import { InventoryModule } from './inventory/inventory.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CsvModule } from './csv/csv.module';
import { QrModule } from './qr/qr.module';
import { EmailModule } from './email/email.module';
import { SquareModule } from './square/square.module';

@Module({
  imports: [
    // Config Module
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Cache Module (for Square products caching)
    CacheModule.register({
      isGlobal: true,
      ttl: 3600000, // 1 hour in milliseconds
    }),

    // Schedule Module (for cron jobs)
    ScheduleModule.forRoot(),

    // GraphQL Module
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: true,
      context: ({ req }) => ({ req }),
    }),

    // MongoDB Module
    MongooseModule.forRootAsync({
      useFactory: () => ({
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/qr-showroom',
      }),
    }),

    // Feature Modules
    AuthModule,
    ProductsModule,
    LeadsModule,
    InventoryModule,
    AnalyticsModule,
    CsvModule,
    QrModule,
    EmailModule,
    SquareModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
