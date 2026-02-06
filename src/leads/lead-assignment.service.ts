import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadStatus } from './schemas/lead.schema';
import { User, UserAvailability } from '../users/schemas/user.schema';
import { Role } from '../auth/enums/role.enum';

@Injectable()
export class LeadAssignmentService {
  private readonly logger = new Logger(LeadAssignmentService.name);

  constructor(
    @InjectModel(Lead.name) private leadModel: Model<Lead>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  /**
   * Try to assign a lead to an available vendedor
   * Returns true if assigned, false if no vendedores available (goes to queue)
   */
  async assignLeadToVendedor(leadId: string): Promise<boolean> {
    const lead = await this.leadModel.findById(leadId).exec();
    if (!lead) {
      this.logger.warn(`Lead ${leadId} not found`);
      return false;
    }

    // Find available vendedores
    const availableVendedores = await this.userModel
      .find({
        role: Role.VENDEDOR,
        availability: UserAvailability.AVAILABLE,
      })
      .exec();

    if (availableVendedores.length === 0) {
      this.logger.log(`No available vendedores for lead ${leadId}, adding to queue`);
      await this.addToQueue(leadId);
      return false;
    }

    // For now, simple round-robin: get vendedor with fewest assigned leads
    const vendedorWithFewestLeads = await this.getVendedorWithFewestLeads(
      availableVendedores.map(v => v._id.toString()),
    );

    if (!vendedorWithFewestLeads) {
      this.logger.warn('Could not find vendedor with fewest leads');
      await this.addToQueue(leadId);
      return false;
    }

    // Assign lead
    lead.assignedTo = vendedorWithFewestLeads;
    lead.status = LeadStatus.ASSIGNED;
    lead.assignedAt = new Date();
    lead.queuePosition = null as any; // Remove from queue if it was there
    await lead.save();

    this.logger.log(`Lead ${leadId} assigned to vendedor ${vendedorWithFewestLeads}`);

    // TODO: Send push notification to vendedor
    // await this.notificationService.sendPushToVendedor(vendedorWithFewestLeads, lead);

    return true;
  }

  /**
   * Add lead to the waiting queue
   */
  private async addToQueue(leadId: string): Promise<void> {
    // Get the highest queue position
    const lastInQueue = await this.leadModel
      .findOne({ status: LeadStatus.PENDING, queuePosition: { $ne: null } })
      .sort({ queuePosition: -1 })
      .exec();

    const nextPosition = lastInQueue?.queuePosition ? lastInQueue.queuePosition + 1 : 1;

    await this.leadModel.findByIdAndUpdate(leadId, {
      status: LeadStatus.PENDING,
      queuePosition: nextPosition,
    }).exec();

    this.logger.log(`Lead ${leadId} added to queue at position ${nextPosition}`);
  }

  /**
   * Process queue: assign waiting leads when vendedores become available
   */
  async processQueue(): Promise<void> {
    // Get leads in queue (ordered by priority and queue position)
    const queuedLeads = await this.leadModel
      .find({
        status: LeadStatus.PENDING,
        queuePosition: { $ne: null },
      })
      .sort({ priority: -1, queuePosition: 1 })
      .exec();

    if (queuedLeads.length === 0) {
      return;
    }

    this.logger.log(`Processing queue with ${queuedLeads.length} leads`);

    // Try to assign each lead
    for (const lead of queuedLeads) {
      const assigned = await this.assignLeadToVendedor(lead._id.toString());
      if (!assigned) {
        // No more available vendedores, stop processing
        break;
      }
    }
  }

  /**
   * Get vendedor with fewest assigned leads (load balancing)
   */
  private async getVendedorWithFewestLeads(vendedorIds: string[]): Promise<string | null> {
    if (vendedorIds.length === 0) return null;

    // Count assigned leads for each vendedor
    const leadCounts = await Promise.all(
      vendedorIds.map(async (vendedorId) => {
        const count = await this.leadModel.countDocuments({
          assignedTo: vendedorId,
          status: { $in: [LeadStatus.ASSIGNED, LeadStatus.IN_PROGRESS] },
        }).exec();
        return { vendedorId, count };
      }),
    );

    // Sort by count (ascending) and return the first
    leadCounts.sort((a, b) => a.count - b.count);
    return leadCounts[0].vendedorId;
  }

  /**
   * Called when a vendedor becomes available
   */
  async onVendedorAvailable(vendedorId: string): Promise<void> {
    this.logger.log(`Vendedor ${vendedorId} became available, processing queue`);
    await this.processQueue();
  }

  /**
   * Reassign lead to another vendedor
   */
  async reassignLead(leadId: string, newVendedorId?: string): Promise<boolean> {
    const lead = await this.leadModel.findById(leadId).exec();
    if (!lead) {
      this.logger.warn(`Lead ${leadId} not found`);
      return false;
    }

    if (newVendedorId) {
      // Assign to specific vendedor
      const vendedor = await this.userModel.findById(newVendedorId).exec();
      if (!vendedor || vendedor.role !== Role.VENDEDOR) {
        this.logger.warn(`Vendedor ${newVendedorId} not found or not a vendedor`);
        return false;
      }

      lead.assignedTo = newVendedorId;
      lead.status = LeadStatus.ASSIGNED;
      lead.assignedAt = new Date();
      await lead.save();

      this.logger.log(`Lead ${leadId} reassigned to vendedor ${newVendedorId}`);
      return true;
    } else {
      // Auto-assign to available vendedor
      lead.assignedTo = null as any;
      lead.status = LeadStatus.PENDING;
      lead.assignedAt = null as any;
      await lead.save();

      return this.assignLeadToVendedor(leadId);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    totalInQueue: number;
    averageWaitTime: number;
    oldestLead?: Date;
  }> {
    const queuedLeads = await this.leadModel
      .find({
        status: LeadStatus.PENDING,
        queuePosition: { $ne: null },
      })
      .sort({ createdAt: 1 })
      .exec();

    if (queuedLeads.length === 0) {
      return {
        totalInQueue: 0,
        averageWaitTime: 0,
      };
    }

    const now = new Date();
    const totalWaitTime = queuedLeads.reduce((sum, lead) => {
      return sum + (now.getTime() - lead.createdAt.getTime());
    }, 0);

    return {
      totalInQueue: queuedLeads.length,
      averageWaitTime: totalWaitTime / queuedLeads.length / 1000 / 60, // in minutes
      oldestLead: queuedLeads[0].createdAt,
    };
  }
}
