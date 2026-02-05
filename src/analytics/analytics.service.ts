import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadStatus } from '../leads/schemas/lead.schema';
import { Analytics, TopProduct, MonthlyGoals } from './entities/analytics.entity';

@Injectable()
export class AnalyticsService {
  constructor(@InjectModel(Lead.name) private leadModel: Model<Lead>) {}

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
      .countDocuments({ ...query, status: LeadStatus.CLOSED })
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

    // Average response time (placeholder - would need timestamps for actual calculation)
    // For now, we'll return a fixed value or calculate based on status changes
    const averageResponseTime = 24; // hours

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
    };
  }

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
