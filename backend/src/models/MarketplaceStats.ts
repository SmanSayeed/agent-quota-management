import mongoose, { Document, Model } from 'mongoose';

interface IMarketplaceStats extends Document {
  totalQuotaAvailable: number;
  lastUpdated: Date;
}

interface IMarketplaceStatsModel extends Model<IMarketplaceStats> {
  getStats(): Promise<IMarketplaceStats>;
  recalculate(): Promise<number>;
}

const marketplaceStatsSchema = new mongoose.Schema({
  totalQuotaAvailable: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Singleton pattern: ensure only one document exists
marketplaceStatsSchema.statics.getStats = async function() {
  let stats = await this.findOne();
  if (!stats) {
    stats = await this.create({ totalQuotaAvailable: 0 });
  }
  return stats;
};

// Recalculate stats from active listings (for consistency checks)
marketplaceStatsSchema.statics.recalculate = async function() {
  const QuotaListing = mongoose.model('QuotaListing');
  const result = await QuotaListing.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: null, total: { $sum: '$quantity' } } }
  ]);
  
  const total = result.length > 0 ? result[0].total : 0;
  
  await this.findOneAndUpdate(
    {}, 
    { totalQuotaAvailable: total, lastUpdated: new Date() },
    { upsert: true }
  );
  
  return total;
};

export const MarketplaceStats = mongoose.model<IMarketplaceStats, IMarketplaceStatsModel>('MarketplaceStats', marketplaceStatsSchema);
