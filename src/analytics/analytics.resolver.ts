import { Resolver, Query, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Analytics } from './entities/analytics.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';

@Resolver(() => Analytics)
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => Analytics, { name: 'analytics' })
  @UseGuards(GqlAuthGuard)
  async getAnalytics(
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
  ): Promise<Analytics> {
    return this.analyticsService.getAnalytics(startDate, endDate);
  }
}
