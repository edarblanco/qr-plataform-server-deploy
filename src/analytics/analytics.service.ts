import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadStatus } from '../leads/schemas/lead.schema';
import { Quotation, QuotationStatus } from '../quotations/schemas/quotation.schema';
import { Product } from '../products/schemas/product.schema';
import { Analytics, TopProduct, MonthlyGoals } from './entities/analytics.entity';
import {
  AnalyticsComparison,
  PeriodMetrics,
  AnalyticsTimeSeries,
  TimeSeriesDataPoint,
  ProductConversionAnalytics,
  ProductConversion,
  StatusDistributionAnalytics,
  StatusDistribution,
} from './entities/analytics-enhanced.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    @InjectModel(Quotation.name) private quotationModel: Model<Quotation>,
    @InjectModel(Product.name) private productModel: Model<Product>,
  ) {}

  // ============================================
  // MÉTODO ORIGINAL - MEJORADO
  // ============================================

  async getAnalytics(startDate?: Date, endDate?: Date): Promise<Analytics> {
    const query: any = {};

    // Filter by date range if provided
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = startDate;
      if (endDate) query.createdAt.$lte = endDate;
    }

    // Total leads
    const totalLeads = await this.leadModel.countDocuments(query).exec();

    // Closed leads (converted)
    const closedLeads = await this.leadModel
      .countDocuments({ ...query, status: LeadStatus.COMPLETED })
      .exec();

    // Conversion rate
    const conversionRate =
      totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

    // Top 5 most requested products
    const topProductsAggregation = await this.leadModel
      .aggregate([
        { $match: query },
        { $group: { _id: '$productId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            productId: { $toString: '$_id' },
            productName: {
              $ifNull: ['$product.name', 'Producto Eliminado'],
            },
            requestCount: '$count',
          },
        },
      ])
      .exec();

    const topProducts: TopProduct[] = topProductsAggregation.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      requestCount: item.requestCount,
    }));

    // MEJORADO: Average response time (ahora es real, no hardcoded)
    const responseTimeAgg = await this.leadModel.aggregate([
      {
        $match: {
          ...query,
          assignedAt: { $ne: null },
        },
      },
      {
        $project: {
          responseTime: {
            $divide: [{ $subtract: ['$assignedAt', '$createdAt'] }, 3600000], // ms to hours
          },
        },
      },
      { $group: { _id: null, avgResponseTime: { $avg: '$responseTime' } } },
    ]).exec();

    const averageResponseTime = responseTimeAgg[0]?.avgResponseTime || 0;

    // NUEVO: Average ticket y total revenue de quotations aceptadas
    const acceptedQuotationsAgg = await this.quotationModel.aggregate([
      {
        $match: {
          status: QuotationStatus.ACCEPTED,
          ...(startDate || endDate ? {
            acceptedAt: {
              ...(startDate ? { $gte: startDate } : {}),
              ...(endDate ? { $lte: endDate } : {}),
            }
          } : {}),
        },
      },
      {
        $group: {
          _id: null,
          avgTicket: { $avg: '$total' },
          totalRevenue: { $sum: '$total' },
          count: { $sum: 1 },
        },
      },
    ]).exec();

    const averageTicket = acceptedQuotationsAgg[0]?.avgTicket || 0;
    const totalRevenue = acceptedQuotationsAgg[0]?.totalRevenue || 0;

    // Monthly goals (these would typically come from a configuration)
    const monthlyGoals: MonthlyGoals = {
      leadsGoal: 100,
      leadsAchieved: totalLeads,
      conversionGoal: 30.0,
      conversionAchieved: conversionRate,
    };

    return {
      totalLeads,
      conversionRate,
      topProducts,
      averageResponseTime,
      monthlyGoals,
      averageTicket, // NUEVO campo opcional
      totalRevenue,  // NUEVO campo opcional
    };
  }

  // ============================================
  // NUEVOS MÉTODOS - ANALYTICS MEJORADO
  // ============================================

  /**
   * Compara métricas entre dos períodos
   */
  async getAnalyticsComparison(
    currentStart: Date,
    currentEnd: Date,
    previousStart: Date,
    previousEnd: Date,
  ): Promise<AnalyticsComparison> {
    // Calcular métricas para ambos períodos en paralelo
    const [currentMetrics, previousMetrics] = await Promise.all([
      this.getPeriodMetrics(currentStart, currentEnd),
      this.getPeriodMetrics(previousStart, previousEnd),
    ]);

    // Calcular porcentajes de crecimiento
    const leadsGrowth = this.calculateGrowth(
      previousMetrics.totalLeads,
      currentMetrics.totalLeads,
    );
    const quotationsGrowth = this.calculateGrowth(
      previousMetrics.totalQuotations,
      currentMetrics.totalQuotations,
    );
    const revenueGrowth = this.calculateGrowth(
      previousMetrics.totalQuotationValue,
      currentMetrics.totalQuotationValue,
    );
    const conversionGrowth = this.calculateGrowth(
      previousMetrics.conversionRate,
      currentMetrics.conversionRate,
    );

    return {
      current: currentMetrics,
      previous: previousMetrics,
      leadsGrowth,
      quotationsGrowth,
      revenueGrowth,
      conversionGrowth,
    };
  }

  /**
   * Obtiene serie temporal de métricas para gráficas
   */
  async getTimeSeries(
    startDate: Date,
    endDate: Date,
    period: 'day' | 'month' = 'day',
  ): Promise<AnalyticsTimeSeries> {
    const groupFormat =
      period === 'day'
        ? { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }
        : { $dateToString: { format: '%Y-%m', date: '$createdAt' } };

    // Agregación de Leads por fecha
    const leadsByDate = await this.leadModel
      .aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        {
          $group: {
            _id: groupFormat,
            total: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', LeadStatus.COMPLETED] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    // Agregación de Quotations por fecha
    const quotationsByDate = await this.quotationModel
      .aggregate([
        {
          $match: {
            createdAt: { $gte: startDate, $lte: endDate },
            status: { $ne: QuotationStatus.DRAFT },
          },
        },
        {
          $group: {
            _id: groupFormat,
            total: { $sum: 1 },
            accepted: {
              $sum: { $cond: [{ $eq: ['$status', QuotationStatus.ACCEPTED] }, 1, 0] },
            },
            revenue: {
              $sum: {
                $cond: [{ $eq: ['$status', QuotationStatus.ACCEPTED] }, '$total', 0],
              },
            },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();

    // Merge ambos resultados por fecha
    const dateMap = new Map<string, TimeSeriesDataPoint>();

    leadsByDate.forEach((item) => {
      dateMap.set(item._id, {
        date: item._id,
        leads: item.total,
        completedLeads: item.completed,
        quotations: 0,
        acceptedQuotations: 0,
        revenue: 0,
      });
    });

    quotationsByDate.forEach((item) => {
      const existing = dateMap.get(item._id) || {
        date: item._id,
        leads: 0,
        completedLeads: 0,
        quotations: 0,
        acceptedQuotations: 0,
        revenue: 0,
      };
      existing.quotations = item.total;
      existing.acceptedQuotations = item.accepted;
      existing.revenue = item.revenue;
      dateMap.set(item._id, existing);
    });

    const dataPoints = Array.from(dateMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    return { dataPoints, period };
  }

  /**
   * Análisis de conversión por producto
   */
  async getProductConversionAnalytics(
    startDate?: Date,
    endDate?: Date,
    limit: number = 20,
  ): Promise<ProductConversionAnalytics> {
    const dateQuery =
      startDate && endDate
        ? { createdAt: { $gte: startDate, $lte: endDate } }
        : {};

    // Agregación compleja: Leads + Quotations por producto
    const productStats = await this.leadModel
      .aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$productId',
            totalLeads: { $sum: 1 },
            completedLeads: {
              $sum: { $cond: [{ $eq: ['$status', LeadStatus.COMPLETED] }, 1, 0] },
            },
          },
        },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'product',
          },
        },
        { $unwind: { path: '$product', preserveNullAndEmptyArrays: false } },
        {
          $lookup: {
            from: 'quotations',
            let: { productIdStr: { $toString: '$_id' } },
            pipeline: [
              {
                $match: {
                  status: { $in: [QuotationStatus.SENT, QuotationStatus.ACCEPTED] },
                  ...(startDate && endDate
                    ? { createdAt: { $gte: startDate, $lte: endDate } }
                    : {}),
                },
              },
              { $unwind: '$items' },
              {
                $match: {
                  $expr: { $eq: ['$items.productId', '$$productIdStr'] },
                },
              },
              {
                $group: {
                  _id: null,
                  quotationsSent: { $sum: 1 },
                  quotationsAccepted: {
                    $sum: {
                      $cond: [{ $eq: ['$status', QuotationStatus.ACCEPTED] }, 1, 0],
                    },
                  },
                  totalRevenue: {
                    $sum: {
                      $cond: [
                        { $eq: ['$status', QuotationStatus.ACCEPTED] },
                        '$items.total',
                        0,
                      ],
                    },
                  },
                },
              },
            ],
            as: 'quotationStats',
          },
        },
        {
          $project: {
            productId: { $toString: '$_id' },
            productName: '$product.name',
            productSku: '$product.sku',
            totalLeads: 1,
            completedLeads: 1,
            quotationsSent: {
              $ifNull: [{ $arrayElemAt: ['$quotationStats.quotationsSent', 0] }, 0],
            },
            quotationsAccepted: {
              $ifNull: [{ $arrayElemAt: ['$quotationStats.quotationsAccepted', 0] }, 0],
            },
            totalRevenue: {
              $ifNull: [{ $arrayElemAt: ['$quotationStats.totalRevenue', 0] }, 0],
            },
          },
        },
        {
          $addFields: {
            leadConversionRate: {
              $cond: [
                { $gt: ['$totalLeads', 0] },
                { $multiply: [{ $divide: ['$completedLeads', '$totalLeads'] }, 100] },
                0,
              ],
            },
            quotationConversionRate: {
              $cond: [
                { $gt: ['$quotationsSent', 0] },
                {
                  $multiply: [{ $divide: ['$quotationsAccepted', '$quotationsSent'] }, 100],
                },
                0,
              ],
            },
            averageQuotationValue: {
              $cond: [
                { $gt: ['$quotationsAccepted', 0] },
                { $divide: ['$totalRevenue', '$quotationsAccepted'] },
                0,
              ],
            },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: limit },
      ])
      .exec();

    return {
      products: productStats,
      totalProductsAnalyzed: productStats.length,
    };
  }

  /**
   * Distribución de estados de Leads y Quotations
   */
  async getStatusDistribution(
    startDate?: Date,
    endDate?: Date,
  ): Promise<StatusDistributionAnalytics> {
    const dateQuery =
      startDate && endDate
        ? { createdAt: { $gte: startDate, $lte: endDate } }
        : {};

    // Lead status distribution
    const leadStatusAgg = await this.leadModel
      .aggregate([
        { $match: dateQuery },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .exec();

    const totalLeads = leadStatusAgg.reduce((sum, item) => sum + item.count, 0);
    const leadStatuses: StatusDistribution[] = leadStatusAgg.map((item) => ({
      status: item._id,
      count: item.count,
      percentage: totalLeads > 0 ? (item.count / totalLeads) * 100 : 0,
    }));

    // Quotation status distribution
    const quotationStatusAgg = await this.quotationModel
      .aggregate([
        {
          $match: { ...dateQuery, status: { $ne: QuotationStatus.DRAFT } },
        },
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .exec();

    const totalQuotations = quotationStatusAgg.reduce(
      (sum, item) => sum + item.count,
      0,
    );
    const quotationStatuses: StatusDistribution[] = quotationStatusAgg.map(
      (item) => ({
        status: item._id,
        count: item.count,
        percentage: totalQuotations > 0 ? (item.count / totalQuotations) * 100 : 0,
      }),
    );

    return { leadStatuses, quotationStatuses };
  }

  // ============================================
  // MÉTODOS PRIVADOS (HELPERS)
  // ============================================

  /**
   * Calcula métricas completas para un período específico
   */
  private async getPeriodMetrics(
    startDate: Date,
    endDate: Date,
  ): Promise<PeriodMetrics> {
    const dateQuery = { createdAt: { $gte: startDate, $lte: endDate } };

    // Queries paralelas para máxima performance
    const [
      totalLeads,
      completedLeads,
      totalQuotations,
      acceptedQuotations,
      quotationValueAgg,
      responseTimeAgg,
    ] = await Promise.all([
      this.leadModel.countDocuments(dateQuery).exec(),
      this.leadModel
        .countDocuments({ ...dateQuery, status: LeadStatus.COMPLETED })
        .exec(),
      this.quotationModel
        .countDocuments({
          createdAt: dateQuery.createdAt,
          status: {
            $in: [
              QuotationStatus.SENT,
              QuotationStatus.ACCEPTED,
              QuotationStatus.REJECTED,
            ],
          },
        })
        .exec(),
      this.quotationModel
        .countDocuments({
          acceptedAt: { $gte: startDate, $lte: endDate },
          status: QuotationStatus.ACCEPTED,
        })
        .exec(),
      this.quotationModel
        .aggregate([
          {
            $match: {
              acceptedAt: { $gte: startDate, $lte: endDate },
              status: QuotationStatus.ACCEPTED,
            },
          },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ])
        .exec(),
      this.leadModel
        .aggregate([
          {
            $match: {
              ...dateQuery,
              assignedAt: { $ne: null },
            },
          },
          {
            $project: {
              responseTime: {
                $divide: [{ $subtract: ['$assignedAt', '$createdAt'] }, 3600000],
              },
            },
          },
          { $group: { _id: null, avgResponseTime: { $avg: '$responseTime' } } },
        ])
        .exec(),
    ]);

    const totalQuotationValue = quotationValueAgg[0]?.total || 0;
    const averageTicket =
      acceptedQuotations > 0 ? totalQuotationValue / acceptedQuotations : 0;
    const conversionRate = totalLeads > 0 ? (completedLeads / totalLeads) * 100 : 0;
    const acceptanceRate =
      totalQuotations > 0 ? (acceptedQuotations / totalQuotations) * 100 : 0;
    const averageResponseTime = responseTimeAgg[0]?.avgResponseTime || 0;

    return {
      totalLeads,
      completedLeads,
      totalQuotations,
      acceptedQuotations,
      totalQuotationValue,
      conversionRate,
      acceptanceRate,
      averageTicket,
      averageResponseTime,
    };
  }

  /**
   * Calcula porcentaje de crecimiento entre dos valores
   */
  private calculateGrowth(previous: number, current: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // ============================================
  // MÉTODO EXISTENTE (mantener para compatibilidad)
  // ============================================

  async getLeadsByPeriod(
    period: 'day' | 'week' | 'month' | 'year' = 'month',
  ): Promise<any[]> {
    const groupFormat: any = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: { $week: '$createdAt' },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
      year: { $year: '$createdAt' },
    };

    return this.leadModel
      .aggregate([
        {
          $group: {
            _id: groupFormat[period],
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .exec();
  }
}
