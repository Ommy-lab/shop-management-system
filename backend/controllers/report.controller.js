// controllers/report.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| DATE RANGE HELPER
|--------------------------------------------------------------------------
| Reports can receive:
|
| ?start_date=2026-09-01&end_date=2026-09-30
|
| If dates are not provided, today's date is used.
|--------------------------------------------------------------------------
*/
const getDateRange = (req) => {
    const {
        start_date,
        end_date,
    } = req.query;

    return {
        startDate: start_date || null,
        endDate: end_date || null,
    };
    };


/*
|--------------------------------------------------------------------------
| SALES SUMMARY REPORT
|--------------------------------------------------------------------------
| Returns total sales, number of sales and average sale amount.
|--------------------------------------------------------------------------
*/
export const getSalesSummaryReport = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req);

        const result = await pool.query(
        `
        SELECT
            COUNT(*) AS total_sales_transactions,

            COALESCE(
            SUM(total_amount),
            0
            ) AS total_sales_amount,

            COALESCE(
            AVG(total_amount),
            0
            ) AS average_sale_amount,

            COUNT(*) FILTER (
            WHERE payment_status = 'PAID'
            ) AS paid_sales,

            COUNT(*) FILTER (
            WHERE payment_status = 'PARTIAL'
            ) AS partial_sales,

            COUNT(*) FILTER (
            WHERE payment_status = 'UNPAID'
            ) AS unpaid_sales

        FROM sales

        WHERE sale_date BETWEEN
            COALESCE($1::date, CURRENT_DATE)
            AND
            COALESCE($2::date, CURRENT_DATE)
        `,
        [
            startDate,
            endDate,
        ]
        );

    return res.status(200).json({
        success: true,

        period: {
            start_date: startDate || "TODAY",
            end_date: endDate || "TODAY",
        },

        report: result.rows[0],
        });

    } catch (error) {
        console.error(
            "Sales summary report error:",
        error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
    };


/*
|--------------------------------------------------------------------------
| SALES BY TRUCK REPORT
|--------------------------------------------------------------------------
| Shows performance of every truck.
|
| No private customer details are returned.
|--------------------------------------------------------------------------
*/
export const getSalesByTruckReport = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req);

        const result = await pool.query(
        `
        SELECT
            t.id AS truck_id,
            t.name AS truck_name,
            t.registration_number,

            COUNT(s.id) AS sales_count,

            COALESCE(
            SUM(s.total_amount),
            0
            ) AS total_sales

        FROM trucks t

        LEFT JOIN sales s
            ON s.truck_id = t.id

            AND s.sale_date BETWEEN
            COALESCE($1::date, CURRENT_DATE)
            AND
            COALESCE($2::date, CURRENT_DATE)

        GROUP BY
            t.id,
            t.name,
            t.registration_number

        ORDER BY
            total_sales DESC
        `,
        [
            startDate,
            endDate,
        ]
    );

    return res.status(200).json({
        success: true,
        report: result.rows,
    });

    } catch (error) {
        console.error(
        "Sales by truck report error:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| SALES BY PRODUCT REPORT
|--------------------------------------------------------------------------
| Shows which products are selling the most.
|--------------------------------------------------------------------------
*/
export const getSalesByProductReport = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req);

        const result = await pool.query(
        `
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.sku,
            p.unit,

            COALESCE(
            SUM(si.quantity),
            0
            ) AS quantity_sold,

            COALESCE(
            SUM(si.subtotal),
            0
            ) AS total_sales

        FROM products p

        LEFT JOIN sale_items si
            ON si.product_id = p.id

        LEFT JOIN sales s
            ON s.id = si.sale_id

            AND s.sale_date BETWEEN
            COALESCE($1::date, CURRENT_DATE)
            AND
            COALESCE($2::date, CURRENT_DATE)

        WHERE
            s.id IS NOT NULL

        GROUP BY
            p.id,
            p.name,
            p.sku,
            p.unit

        ORDER BY
            quantity_sold DESC
        `,
        [
            startDate,
            endDate,
        ]
    );

    return res.status(200).json({
        success: true,
        report: result.rows,
    });

    } catch (error) {
        console.error(
        "Sales by product report error:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| PURCHASE REPORT
|--------------------------------------------------------------------------
| Shows purchases made from suppliers.
|--------------------------------------------------------------------------
*/
export const getPurchaseReport = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req);

        const result = await pool.query(
        `
        SELECT
            s.id AS supplier_id,
            s.name AS supplier_name,

            COUNT(p.id) AS purchases_count,

            COALESCE(
            SUM(p.total_amount),
            0
            ) AS total_purchased_amount

        FROM suppliers s

        LEFT JOIN purchases p
            ON p.supplier_id = s.id

            AND p.purchase_date BETWEEN
            COALESCE($1::date, CURRENT_DATE)
            AND
            COALESCE($2::date, CURRENT_DATE)

        GROUP BY
            s.id,
            s.name

        ORDER BY
            total_purchased_amount DESC
        `,
        [
            startDate,
            endDate,
        ]
    );

    return res.status(200).json({
        success: true,
        report: result.rows,
    });

    } catch (error) {
        console.error(
        "Purchase report error:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| EXPENSE REPORT
|--------------------------------------------------------------------------
| Shows truck expenses grouped by truck.
|--------------------------------------------------------------------------
*/
export const getExpenseReport = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req);

        const result = await pool.query(
        `
        SELECT
            t.id AS truck_id,
            t.name AS truck_name,

            COUNT(te.id) AS expense_count,

            COALESCE(
            SUM(te.amount),
            0
            ) AS total_expenses

        FROM trucks t

        LEFT JOIN truck_expenses te
            ON te.truck_id = t.id

            AND te.expense_date BETWEEN
            COALESCE($1::date, CURRENT_DATE)
            AND
            COALESCE($2::date, CURRENT_DATE)

        GROUP BY
            t.id,
            t.name

        ORDER BY
            total_expenses DESC
        `,
        [
            startDate,
            endDate,
        ]
        );

        return res.status(200).json({
            success: true,
            report: result.rows,
        });

    } catch (error) {
        console.error(
            "Expense report error:",
        error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
    };


/*
|--------------------------------------------------------------------------
| OUTSTANDING DEBT REPORT
|--------------------------------------------------------------------------
| Gives management an aggregate debt view by truck.
|
| Important:
| We do NOT expose private customer names here.
|--------------------------------------------------------------------------
*/
export const getDebtReport = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            t.id AS truck_id,
            t.name AS truck_name,

            COUNT(s.id) FILTER (
            WHERE
                (
                s.total_amount
                -
                COALESCE(ps.amount_paid, 0)
                ) > 0
            ) AS outstanding_sales,

            COALESCE(
            SUM(
                GREATEST(
                s.total_amount
                -
                COALESCE(ps.amount_paid, 0),
                0
                )
            ),
            0
            ) AS outstanding_debt

        FROM trucks t

        LEFT JOIN sales s
            ON s.truck_id = t.id

        LEFT JOIN (
            SELECT
            sale_id,
            SUM(amount) AS amount_paid

            FROM sale_payments

            GROUP BY sale_id
        ) ps
            ON ps.sale_id = s.id

        GROUP BY
            t.id,
            t.name

        ORDER BY
            outstanding_debt DESC
        `);

        return res.status(200).json({
        success: true,
        report: result.rows,
        });

    } catch (error) {
        console.error(
        "Debt report error:",
        error
        );

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
    };


/*
|--------------------------------------------------------------------------
| STOCK EVENT REPORT
|--------------------------------------------------------------------------
| Reports:
| - Returns
| - Damaged
| - Lost
| - Expired
|--------------------------------------------------------------------------
*/
export const getStockEventReport = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req);

        const result = await pool.query(
        `
        SELECT
            tse.event_type,

            COUNT(DISTINCT tse.id)
            AS event_count,

            COALESCE(
            SUM(tsei.quantity),
            0
            ) AS total_quantity

        FROM truck_stock_events tse

        JOIN truck_stock_event_items tsei
            ON tsei.event_id = tse.id

        WHERE tse.event_date BETWEEN
            COALESCE($1::date, CURRENT_DATE)
            AND
            COALESCE($2::date, CURRENT_DATE)

        GROUP BY
            tse.event_type

        ORDER BY
            tse.event_type
        `,
        [
            startDate,
            endDate,
        ]
        );

        return res.status(200).json({
        success: true,
        report: result.rows,
        });

    } catch (error) {
        console.error(
        "Stock event report error:",
        error
        );

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
    };


/*
|--------------------------------------------------------------------------
| BEST SELLING PRODUCTS
|--------------------------------------------------------------------------
*/
export const getBestSellingProducts = async (req, res) => {
    try {
        const { startDate, endDate } = getDateRange(req);

        const result = await pool.query(
        `
        SELECT
            p.id AS product_id,
            p.name AS product_name,
            p.sku,

            SUM(si.quantity)
            AS quantity_sold,

            SUM(si.subtotal)
            AS sales_amount

        FROM sale_items si

        JOIN sales s
            ON s.id = si.sale_id

        JOIN products p
            ON p.id = si.product_id

        WHERE s.sale_date BETWEEN
            COALESCE($1::date, CURRENT_DATE)
            AND
            COALESCE($2::date, CURRENT_DATE)

        GROUP BY
            p.id,
            p.name,
            p.sku

        ORDER BY
            quantity_sold DESC

        LIMIT 10
        `,
        [
            startDate,
            endDate,
        ]
        );

        return res.status(200).json({
        success: true,
        report: result.rows,
        });

    } catch (error) {
        console.error(
        "Best selling products report error:",
        error
        );

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};

/*
|--------------------------------------------------------------------------
| PROFIT / LOSS REPORT
|--------------------------------------------------------------------------
| Revenue
| - Cost of Goods Sold
| = Gross Profit
|
| Gross Profit
| - Expenses
| - Damaged/Lost/Expired stock
| = Net Profit / Loss
|--------------------------------------------------------------------------
*/
export const getProfitLossReport = async (req, res) => {
    try {
        const {
            start_date,
            end_date,
        } = req.query;

        /*
        |--------------------------------------------------------------------------
        | SALES REVENUE + COST OF GOODS SOLD
        |--------------------------------------------------------------------------
        */
        const salesResult = await pool.query(
            `
            SELECT
                COALESCE(
                    SUM(si.subtotal),
                    0
                ) AS revenue,

                COALESCE(
                    SUM(si.cost_subtotal),
                    0
                ) AS cost_of_goods_sold

            FROM sale_items si

            JOIN sales s
                ON s.id = si.sale_id

            WHERE s.sale_date BETWEEN
                COALESCE($1::date, CURRENT_DATE)
                AND
                COALESCE($2::date, CURRENT_DATE)
            `,
            [
                start_date || null,
                end_date || null,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | TRUCK EXPENSES
        |--------------------------------------------------------------------------
        */
        const expenseResult = await pool.query(
            `
            SELECT
                COALESCE(
                    SUM(amount),
                    0
                ) AS total_expenses

            FROM truck_expenses

            WHERE expense_date BETWEEN
                COALESCE($1::date, CURRENT_DATE)
                AND
                COALESCE($2::date, CURRENT_DATE)
            `,
            [
                start_date || null,
                end_date || null,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | STOCK LOSSES
        |--------------------------------------------------------------------------
        | RETURN is excluded because returned goods go back to store stock.
        |--------------------------------------------------------------------------
        */
        const stockLossResult = await pool.query(
            `
            SELECT
                COALESCE(
                    SUM(tsei.cost_subtotal),
                    0
                ) AS inventory_loss

            FROM truck_stock_events tse

            JOIN truck_stock_event_items tsei
                ON tsei.event_id = tse.id

            WHERE tse.event_type IN (
                'DAMAGED',
                'LOST',
                'EXPIRED'
            )

            AND tse.event_date BETWEEN
                COALESCE($1::date, CURRENT_DATE)
                AND
                COALESCE($2::date, CURRENT_DATE)
            `,
            [
                start_date || null,
                end_date || null,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | CONVERT POSTGRES NUMERIC VALUES
        |--------------------------------------------------------------------------
        */
        const revenue =
            Number(salesResult.rows[0].revenue);

        const costOfGoodsSold =
            Number(
                salesResult.rows[0].cost_of_goods_sold
            );

        const totalExpenses =
            Number(
                expenseResult.rows[0].total_expenses
            );

        const inventoryLoss =
            Number(
                stockLossResult.rows[0].inventory_loss
            );

        /*
        |--------------------------------------------------------------------------
        | PROFIT CALCULATIONS
        |--------------------------------------------------------------------------
        */
        const grossProfit =
            revenue - costOfGoodsSold;

        const netProfit =
            grossProfit
            - totalExpenses
            - inventoryLoss;

        return res.status(200).json({
            success: true,

            period: {
                start_date:
                    start_date || "TODAY",

                end_date:
                    end_date || "TODAY",
            },

            report: {
                revenue:
                    revenue.toFixed(2),

                cost_of_goods_sold:
                    costOfGoodsSold.toFixed(2),

                gross_profit:
                    grossProfit.toFixed(2),

                operating_expenses:
                    totalExpenses.toFixed(2),

                inventory_loss:
                    inventoryLoss.toFixed(2),

                net_profit:
                    netProfit.toFixed(2),

                result:
                    netProfit > 0
                        ? "PROFIT"
                        : netProfit < 0
                        ? "LOSS"
                        : "BREAK_EVEN",
            },
        });

    } catch (error) {
        console.error(
            "Profit/loss report error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};