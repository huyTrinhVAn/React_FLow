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
async function getGroupSummaryAggregation(matchStage) {
    try {
        const pipeline = [
            { $match: matchStage },
            {
                $group: {
                    _id: "$platform",
                    totalItems: { $sum: 1 },
                    healthyCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "healthy"] }, 1, 0]
                        }
                    },
                    unhealthyCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "unhealthy"] }, 1, 0]
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

        return await PlatformMetrics.aggregate(pipeline);
    } catch (error) {
        console.error("Error getting group summary:", error);
        return [];
    }
}
