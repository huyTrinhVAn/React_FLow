router.get("/platformmetrics", async (req, res) => {
    try {
        // Build match stage
        const matchStage = {};
        
        if (req.query.platform) {
            matchStage.platform = req.query.platform;
        }
        
        if (req.query.status) {
            matchStage.status = req.query.status;
        }
        
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            matchStage.$or = [
                { item: searchRegex },
                { account: searchRegex },
                { reason: searchRegex },
                { item_type: searchRegex }
            ];
        }

        // Build aggregation pipeline
        const pipeline = [
            { $match: matchStage },
            { $sort: { date: -1 } }
        ];

        // Pagination options
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            customLabels: {
                totalDocs: 'totalItems',
                docs: 'data',
                limit: 'itemsPerPage',
                page: 'currentPage',
                nextPage: 'next',
                prevPage: 'previous',
                totalPages: 'pageCount',
                hasNextPage: 'hasNext',
                hasPrevPage: 'hasPrevious'
            }
        };

        // Use aggregatePaginate
        const result = await PlatformMetrics.aggregatePaginate(
            PlatformMetrics.aggregate(pipeline), 
            options
        );

        // Get group summary if needed
        const groupSummary = await getGroupSummaryAggregation(matchStage);

        const response = {
            success: true,
            data: result.data,
            pagination: {
                currentPage: result.currentPage,
                totalPages: result.pageCount,
                totalItems: result.totalItems,
                itemsPerPage: result.itemsPerPage,
                hasNextPage: result.hasNext,
                hasPreviousPage: result.hasPrevious
            },
            groupSummary: groupSummary
        };

        res.status(200).json(response);

    } catch (error) {
        console.error("Error fetching platform metrics:", error);
        res.status(500).json({ 
            success: false,
            error: "Failed to fetch platform metrics",
            message: error.message 
        });
    }
});

// Group summary với aggregation
// Backend: thêm debug vào getGroupSummaryAggregation
async function getGroupSummaryAggregation(matchStage) {
    try {
        // DEBUG: Check raw data first
        const rawData = await PlatformMetrics.find(matchStage).limit(10);
        console.log("Raw sample data:", JSON.stringify(rawData, null, 2));
        
        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: "$platform",
                    totalItems: { $sum: 1 },
                    // DEBUG: Get all unique states
                    allStates: { $addToSet: "$state" },
                    healthyCount: {
                        $sum: {
                            $cond: [{ $eq: ["$state", "healthy"] }, 1, 0]
                        }
                    },
                    unhealthyCount: {
                        $sum: {
                            $cond: [{ $eq: ["$state", "unhealthy"] }, 1, 0]
                        }
                    }
                }
            },
            {
                $addFields: {
                    platform: "$_id",
                    overallStatus: {
                        $cond: [
                            { $gt: ["$unhealthyCount", 0] },
                            "unhealthy", 
                            "healthy"
                        ]
                    }
                }
            },
            { $sort: { platform: 1 } }
        ];

        const result = await PlatformMetrics.aggregate(pipeline);
        console.log("Aggregation result:", JSON.stringify(result, null, 2));
        
        return result;
    } catch (error) {
        console.error("Error getting group summary:", error);
        return [];
    }
}

}
