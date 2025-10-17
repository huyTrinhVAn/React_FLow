const PlatformMetrics = require('./platformMetrics'); // Adjust path

// Replace your existing route
router.get("/platformmetrics", async (req, res) => {
    try {
        // Build filter object từ query parameters
        const filter = {};
        
        if (req.query.platform) {
            filter.platform = req.query.platform;
        }
        
        if (req.query.status) {
            filter.status = req.query.status;
        }
        
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filter.$or = [
                { item: searchRegex },
                { account: searchRegex },
                { reason: searchRegex },
                { item_type: searchRegex },
                { platform: searchRegex }
            ];
        }

        // Pagination options [web:135]
        const options = {
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 20,
            sort: { date: -1 }, // Sort by date descending
            lean: true, // Return plain objects for better performance
        };

        // Use paginate method thay vì find()
        const result = await PlatformMetrics.paginate(filter, options);
        
        // Get group summary cho frontend
        const groupSummary = await getGroupSummary(filter);
        
        // Structured response cho frontend
        const response = {
            success: true,
            data: result.docs,
            pagination: {
                currentPage: result.page,
                totalPages: result.totalPages,
                totalItems: result.totalDocs,
                itemsPerPage: result.limit,
                hasNextPage: result.hasNextPage,
                hasPreviousPage: result.hasPrevPage,
                nextPage: result.nextPage,
                previousPage: result.prevPage
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

// Helper function để get group summary bằng aggregation
async function getGroupSummary(filter = {}) {
    try {
        const pipeline = [
            { $match: filter },
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
