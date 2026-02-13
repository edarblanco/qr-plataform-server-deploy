import { Resolver, Query, Mutation, Args, Int, Float } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { Analytics, TopProduct } from './entities/analytics.entity';
import {
  AnalyticsComparison,
  AnalyticsTimeSeries,
  ProductConversionAnalytics,
  StatusDistributionAnalytics,
} from './entities/analytics-enhanced.entity';
import { UserConversion } from './entities/user-conversion.entity';
import { CartItemInput } from './dto/cart-item.input';
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

  @Query(() => ProductConversionAnalytics, {
    name: 'productConversionAnalytics',
  })
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

  @Query(() => StatusDistributionAnalytics, {
    name: 'analyticsStatusDistribution',
  })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getStatusDistribution(
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
  ): Promise<StatusDistributionAnalytics> {
    return this.analyticsService.getStatusDistribution(startDate, endDate);
  }

  // ============================================
  // NUEVAS QUERIES Y MUTATIONS
  // ============================================

  @Query(() => Float, { name: 'cartAbandonmentRate' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getCartAbandonmentRate(
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
  ): Promise<number> {
    return this.analyticsService.getCartAbandonmentRate(startDate, endDate);
  }

  @Query(() => [TopProduct], { name: 'topScannedProducts' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getTopScannedProducts(
    @Args('limit', { type: () => Int, defaultValue: 5 }) limit: number,
  ): Promise<TopProduct[]> {
    return this.analyticsService.getTopScannedProducts(limit);
  }

  @Query(() => [UserConversion], { name: 'leadConversionByUser' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions(Permission.ANALYTICS_READ)
  async getLeadConversionByUser(
    @Args('startDate', { type: () => Date, nullable: true }) startDate?: Date,
    @Args('endDate', { type: () => Date, nullable: true }) endDate?: Date,
  ): Promise<UserConversion[]> {
    return this.analyticsService.getLeadConversionByUser(startDate, endDate);
  }

  @Mutation(() => Boolean)
  async trackScan(
    @Args('productId') productId: string,
    @Args('source', { nullable: true }) source?: string,
    @Args('userAgent', { nullable: true }) userAgent?: string,
    @Args('ip', { nullable: true }) ip?: string,
  ): Promise<boolean> {
    return this.analyticsService.trackScan(productId, source, userAgent, ip);
  }

  @Mutation(() => Boolean)
  async syncCart(
    @Args('sessionId') sessionId: string,
    @Args('items', { type: () => [CartItemInput] }) items: CartItemInput[],
    @Args('totalValue', { type: () => Float }) totalValue: number,
    @Args('userId', { nullable: true }) userId?: string,
  ): Promise<boolean> {
    return this.analyticsService.syncCart(sessionId, items, totalValue, userId);
  }
}
