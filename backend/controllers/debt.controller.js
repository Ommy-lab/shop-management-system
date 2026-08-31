// controllers/debt.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| GET OUTSTANDING SALES
|--------------------------------------------------------------------------
| Salesperson sees unpaid/partial sales only from their assigned truck.
|--------------------------------------------------------------------------
*/
export const getOutstandingSales = async (req, res) => {
    try {
        // A salesperson must belong to a truck.
        if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
        }

        const result = await pool.query(
        `
        SELECT
            s.id AS sale_id,
            s.sale_date,
            s.total_amount,
            s.payment_status,

            c.id AS customer_id,
            c.name AS customer_name,
            c.business_name,
            c.phone,
            c.location,

            COALESCE(SUM(sp.amount), 0) AS amount_paid,

            (
            s.total_amount - COALESCE(SUM(sp.amount), 0)
            ) AS balance

        FROM sales s

        JOIN customers c
            ON c.id = s.customer_id

        LEFT JOIN sale_payments sp
            ON sp.sale_id = s.id

        WHERE s.truck_id = $1
            AND s.payment_status IN ('UNPAID', 'PARTIAL')

        GROUP BY
            s.id,
            c.id

        HAVING
            (
            s.total_amount - COALESCE(SUM(sp.amount), 0)
            ) > 0

        ORDER BY s.sale_date ASC, s.id ASC
        `,
        [req.user.truckId]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            outstanding_sales: result.rows,
        });

    } catch (error) {
        console.error("Get outstanding sales error:", error);

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
}
};


/*
|--------------------------------------------------------------------------
| GET CUSTOMER DEBT SUMMARY
|--------------------------------------------------------------------------
| Groups outstanding balances by customer.
|--------------------------------------------------------------------------
*/
export const getCustomerDebts = async (req, res) => {
    try {
        if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
    }

    const result = await pool.query(
        `
        SELECT
            c.id AS customer_id,
            c.name AS customer_name,
            c.business_name,
            c.phone,
            c.location,

            COUNT(s.id) AS total_credit_sales,

            COALESCE(SUM(s.total_amount), 0) AS total_sales_amount,

            COALESCE(SUM(payment_summary.amount_paid), 0)
            AS total_amount_paid,

            (
            COALESCE(SUM(s.total_amount), 0)
            -
            COALESCE(SUM(payment_summary.amount_paid), 0)
            ) AS total_balance

        FROM customers c

        JOIN sales s
            ON s.customer_id = c.id

        LEFT JOIN (
            SELECT
            sale_id,
            SUM(amount) AS amount_paid
            FROM sale_payments
            GROUP BY sale_id
        ) payment_summary
            ON payment_summary.sale_id = s.id

        WHERE c.truck_id = $1
            AND s.payment_status IN ('UNPAID', 'PARTIAL')

        GROUP BY
            c.id

        HAVING
            (
            COALESCE(SUM(s.total_amount), 0)
            -
            COALESCE(SUM(payment_summary.amount_paid), 0)
            ) > 0

        ORDER BY total_balance DESC
        `,
        [req.user.truckId]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            customers: result.rows,
        });

    } catch (error) {
        console.error("Get customer debts error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ONE CUSTOMER'S CREDIT HISTORY
|--------------------------------------------------------------------------
*/
export const getCustomerDebtDetails = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
        }

        /*
        |--------------------------------------------------------------------------
        | CHECK CUSTOMER
        |--------------------------------------------------------------------------
        */

        const customerResult = await pool.query(
        `
        SELECT
            id,
            name,
            business_name,
            phone,
            location
        FROM customers
        WHERE id = $1
            AND truck_id = $2
        `,
        [
            customerId,
            req.user.truckId,
        ]
        );

        if (customerResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Customer not found for your truck",
        });
        }

        /*
        |--------------------------------------------------------------------------
        | GET CUSTOMER SALES AND BALANCES
        |--------------------------------------------------------------------------
        */

        const salesResult = await pool.query(
        `
        SELECT
            s.id AS sale_id,
            s.sale_date,
            s.total_amount,
            s.payment_status,

            COALESCE(SUM(sp.amount), 0) AS amount_paid,

            (
            s.total_amount - COALESCE(SUM(sp.amount), 0)
            ) AS balance

        FROM sales s

        LEFT JOIN sale_payments sp
            ON sp.sale_id = s.id

        WHERE s.customer_id = $1
            AND s.truck_id = $2

        GROUP BY s.id

        ORDER BY s.sale_date DESC, s.id DESC
        `,
        [
            customerId,
            req.user.truckId,
        ]
        );

        const totalBalance = salesResult.rows.reduce(
        (sum, sale) => sum + Number(sale.balance),
        0
        );

        return res.status(200).json({
        success: true,

        customer: customerResult.rows[0],

        summary: {
            total_sales: salesResult.rows.length,
            outstanding_balance: totalBalance,
        },

        sales: salesResult.rows,
        });

    } catch (error) {
        console.error("Get customer debt details error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET TRUCK DEBT SUMMARY
|--------------------------------------------------------------------------
*/
export const getTruckDebtSummary = async (req, res) => {
    try {
        if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
    }

    const result = await pool.query(
        `
        SELECT
            COUNT(*) FILTER (
            WHERE payment_status = 'UNPAID'
            ) AS unpaid_sales,

            COUNT(*) FILTER (
            WHERE payment_status = 'PARTIAL'
            ) AS partial_sales,

            COUNT(*) AS credit_sales,

            COALESCE(SUM(total_amount), 0)
            AS total_credit_sales_amount,

            COALESCE(SUM(amount_paid), 0)
            AS total_amount_paid,

            COALESCE(SUM(balance), 0)
            AS total_outstanding_balance

        FROM (
            SELECT
            s.id,
            s.payment_status,
            s.total_amount,

            COALESCE(SUM(sp.amount), 0)
                AS amount_paid,

            (
                s.total_amount - COALESCE(SUM(sp.amount), 0)
            ) AS balance

            FROM sales s

            LEFT JOIN sale_payments sp
            ON sp.sale_id = s.id

            WHERE s.truck_id = $1
            AND s.payment_status IN ('UNPAID', 'PARTIAL')

            GROUP BY s.id
        ) debt_summary
        `,
        [req.user.truckId]
        );

        return res.status(200).json({
            success: true,
            summary: result.rows[0],
        });

    } catch (error) {
        console.error("Get truck debt summary error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};