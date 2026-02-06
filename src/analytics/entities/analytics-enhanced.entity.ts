import { ObjectType, Field, Float, Int } from '@nestjs/graphql';

// ============================================
// PERIOD METRICS - Métricas de un período
// ============================================

@ObjectType()
export class PeriodMetrics {
  @Field(() => Int)
  totalLeads: number;

  @Field(() => Int)
  completedLeads: number;

  @Field(() => Int)
  totalQuotations: number;

  @Field(() => Int)
  acceptedQuotations: number;

  @Field(() => Float)
  totalQuotationValue: number;

  @Field(() => Float)
  conversionRate: number;

  @Field(() => Float)
  acceptanceRate: number;

  @Field(() => Float)
  averageTicket: number;

  @Field(() => Float)
  averageResponseTime: number; // horas
}

// ============================================
// ANALYTICS COMPARISON - Comparación de períodos
// ============================================

@ObjectType()
export class AnalyticsComparison {
  @Field(() => PeriodMetrics)
  current: PeriodMetrics;

  @Field(() => PeriodMetrics)
  previous: PeriodMetrics;

  @Field(() => Float)
  leadsGrowth: number; // percentage

  @Field(() => Float)
  quotationsGrowth: number;

  @Field(() => Float)
  revenueGrowth: number;

  @Field(() => Float)
  conversionGrowth: number;
}

// ============================================
// TIME SERIES - Serie temporal para gráficas
// ============================================

@ObjectType()
export class TimeSeriesDataPoint {
  @Field()
  date: string; // YYYY-MM-DD or YYYY-MM

  @Field(() => Int)
  leads: number;

  @Field(() => Int)
  completedLeads: number;

  @Field(() => Int)
  quotations: number;

  @Field(() => Int)
  acceptedQuotations: number;

  @Field(() => Float)
  revenue: number;
}

@ObjectType()
export class AnalyticsTimeSeries {
  @Field(() => [TimeSeriesDataPoint])
  dataPoints: TimeSeriesDataPoint[];

  @Field()
  period: string; // 'day' | 'week' | 'month'
}

// ============================================
// PRODUCT CONVERSION - Conversión por producto
// ============================================

@ObjectType()
export class ProductConversion {
  @Field()
  productId: string;

  @Field()
  productName: string;

  @Field()
  productSku: string;

  @Field(() => Int)
  totalLeads: number;

  @Field(() => Int)
  completedLeads: number;

  @Field(() => Int)
  quotationsSent: number;

  @Field(() => Int)
  quotationsAccepted: number;

  @Field(() => Float)
  leadConversionRate: number; // completedLeads / totalLeads

  @Field(() => Float)
  quotationConversionRate: number; // acceptedQuotations / quotationsSent

  @Field(() => Float)
  totalRevenue: number; // suma de quotations accepted

  @Field(() => Float)
  averageQuotationValue: number;
}

@ObjectType()
export class ProductConversionAnalytics {
  @Field(() => [ProductConversion])
  products: ProductConversion[];

  @Field(() => Int)
  totalProductsAnalyzed: number;
}

// ============================================
// STATUS DISTRIBUTION - Distribución de estados
// ============================================

@ObjectType()
export class StatusDistribution {
  @Field()
  status: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  percentage: number;
}

@ObjectType()
export class StatusDistributionAnalytics {
  @Field(() => [StatusDistribution])
  leadStatuses: StatusDistribution[];

  @Field(() => [StatusDistribution])
  quotationStatuses: StatusDistribution[];
}
