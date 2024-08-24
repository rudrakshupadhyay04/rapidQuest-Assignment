import { MongoClient} from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const mongoUri = process.env.MONGO_URI;
const dbName = 'RQ_Analytics';
const client = new MongoClient(mongoUri);
const db = client.db(dbName);
const collectionName = 'shopifyOrders';
const shopifyOrders = db.collection(collectionName);
const shopifyCustomers = db.collection('shopifyCustomers');



// demo api
export const customers = async (req, res) => {
    try {
        const customers = await db.collection('shopifyCustomers').findOne({});
        res.status(200).json(customers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const total_sales_Over_time = async (req, res) => {
    const interval = req.query.interval; // Ensure this matches one of the valid units
    const startDate = req.query.start_date;
    const endDate = req.query.end_date;

    // Validate the interval
    const validIntervals = ["year", "quarter", "month", "week", "day", "hour", "minute", "second", "millisecond"];
    if (!validIntervals.includes(interval)) {
        return res.status(400).json({ error: "Invalid interval unit" });
    }

    let unit = interval;
    if (interval === 'daily') {
        unit = 'day';
    } else if (!validIntervals.includes(interval)) {
        return res.status(400).json({ error: "Invalid interval unit" });
    }

    const pipeline = [
        {
            $group: {
                _id: {
                    $dateTrunc: { date: "$created_at", unit: unit }
                },
                total_sales: { $sum: "$total_price_set" }
            }
        },
        {
            $sort: { _id: 1 }
        }
    ];

    if (startDate && endDate) {
        pipeline.unshift({
            $match: {
                created_at: { $gte: new Date(startDate), $lte: new Date(endDate) }
            }
        });
    }

    try {
        const result = await shopifyOrders.aggregate(pipeline).toArray();
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};



export const sales_growth_rate_over_time = async (req, res) => {
    try {
        const sales = await shopifyOrders.aggregate([
            // Match documents where 'created_at' is a valid Date object
            { $match: { created_at: { $type: "date" } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$created_at" } },
                    totalSales: { $sum: "$total_price_set" }
                }
            },
            { $sort: { _id: 1 } }
        ]).toArray();

        const growthRate = sales.map((current, index, array) => {
            if (index === 0) return { period: current._id, growthRate: 0 };
            const previous = array[index - 1];
            const rate = ((current.totalSales - previous.totalSales) / previous.totalSales) * 100;
            return { period: current._id, growthRate: rate };
        });

        res.json(growthRate);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




export const new_customers_added_over_time = async (req, res) => {
    try {
        const { interval } = req.query;

        const groupBy = {
            'daily': { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            'monthly': { $dateToString: { format: "%Y-%m", date: "$created_at" } },
            'quarterly': { $dateToString: { format: "%Y-Q%q", date: "$created_at" } },
            'yearly': { $dateToString: { format: "%Y", date: "$created_at" } },
        }[interval];

        const newCustomers = await shopifyCustomers.aggregate([
            { $group: { _id: groupBy, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]).toArray(); // Convert cursor to array

        res.json(newCustomers);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};




export const repeat_customer = async (req, res) => {
    try {
        const { interval } = req.query;

        const groupBy = {
            'daily': { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
            'monthly': { $dateToString: { format: "%Y-%m", date: "$created_at" } },
            'quarterly': { $dateToString: { format: "%Y-Q%q", date: "$created_at" } },
            'yearly': { $dateToString: { format: "%Y", date: "$created_at" } },
        }[interval] || { $dateToString: { format: "%Y-%m", date: "$created_at" } };

        const repeatCustomers = await shopifyOrders.aggregate([
            { $group: { _id: "$customer_id", orderCount: { $sum: 1 } } },
            { $match: { orderCount: { $gt: 1 } } },
            { $group: { _id: groupBy, count: { $sum: 1 } } }
        ]).toArray(); // Convert cursor to array

        res.json(repeatCustomers);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const geographical_distribution_of_customers = async (req, res) => {
    try {
        const distribution = await shopifyCustomers.aggregate([
            { $group: { _id: "$default_address.city", count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]).toArray(); // Convert cursor to array

        res.json(distribution);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};


export const customers_lifetime = async (req, res) => {
    try {
        const lifetimeValue = await shopifyOrders.aggregate([
            { $group: { _id: { customer_id: "$customer_id", firstPurchase: { $min: "$created_at" } }, totalValue: { $sum: "$total_price_set" } } },
            { $group: { _id: { $dateToString: { format: "%Y-%m", date: "$firstPurchase" } }, lifetimeValue: { $avg: "$totalValue" } } },
            { $sort: { _id: 1 } }
        ]).toArray(); // Convert cursor to array

        res.json(lifetimeValue);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
