import express from 'express';
import { customers_lifetime, geographical_distribution_of_customers, new_customers_added_over_time, repeat_customer, sales_growth_rate_over_time, total_sales_Over_time } from '../controllers/controllers.js';

const router = express.Router();

// router.get('/total', total);
router.get('/total-sales', total_sales_Over_time);
router.get('/sales-growth-rate', sales_growth_rate_over_time);
router.get('/new-customers', new_customers_added_over_time);
router.get('/repeat-customers', repeat_customer);
router.get('/geographical-distribution', geographical_distribution_of_customers);
router.get('/customer-lifetime-value', customers_lifetime);


export default router;