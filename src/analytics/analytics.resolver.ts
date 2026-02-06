import { Resolver, Query, Args, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Analytics } from './entities/analytics.entity';
import {
  AnalyticsComparison,
  AnalyticsTimeSeries,
  ProductConversionAnalytics,
  StatusDistributionAnalytics,
} from './entities/analytics-enhanced.entity';
import { GqlAuthGuard } from '../auth/guards/gql-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { Permission } from '../auth/enums/permission.enum';

@Resolver(() => Analytics)
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => Analytics, { name: 'analytics' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getAnalytics(
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
  ): Promise<Analytics> {
    return this.analyticsService.getAnalytics(startDate, endDate);
  }

  @Query(() => AnalyticsComparison, { name: 'analyticsComparison' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getAnalyticsComparison(
    @Args('currentStart', { type: () => Date }) currentStart: Date,
    @Args('currentEnd', { type: () => Date }) currentEnd: Date,
    @Args('previousStart', { type: () => Date }) previousStart: Date,
    @Args('previousEnd', { type: () => Date }) previousEnd: Date,
  ): Promise<AnalyticsComparison> {
    return this.analyticsService.getAnalyticsComparison(
      currentStart,
      currentEnd,
      previousStart,
      previousEnd,
    );
  }

  @Query(() => AnalyticsTimeSeries, { name: 'analyticsTimeSeries' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getTimeSeries(
    @Args('startDate', { type: () => Date }) startDate: Date,
    @Args('endDate', { type: () => Date }) endDate: Date,
    @Args('period', { type: () => String, defaultValue: 'day' })
    period: 'day' | 'month',
  ): Promise<AnalyticsTimeSeries> {
    return this.analyticsService.getTimeSeries(startDate, endDate, period);
  }

  @Query(() => ProductConversionAnalytics, { name: 'productConversionAnalytics' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getProductConversionAnalytics(
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
    @Args('limit', { type: () => Int, defaultValue: 20 }) limit?: number,
  ): Promise<ProductConversionAnalytics> {
    return this.analyticsService.getProductConversionAnalytics(
      startDate,
      endDate,
      limit,
    );
  }

  @Query(() => StatusDistributionAnalytics, { name: 'analyticsStatusDistribution' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getStatusDistribution(
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
  ): Promise<StatusDistributionAnalytics> {
    return this.analyticsService.getStatusDistribution(startDate, endDate);
  }
}
