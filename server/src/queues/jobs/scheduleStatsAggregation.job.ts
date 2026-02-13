import statsAggregatorQueue from '../jobs/stats-aggregator.queue.js';

const scheduleStatsAggregation = async (userId: string) => {
  try {
    await statsAggregatorQueue.add(
      'stats-aggregator',
      { userId },
      {
        
        repeat: {
          every: 120000, // Every 5 minutes (300,000 ms)
        },
      }
    );

    console.log(`📊 Stats aggregation scheduled for user ${userId}`);
  } catch (error) {
    console.error('❌ Failed to schedule stats aggregation:', error);
  }
};

export default scheduleStatsAggregation;

