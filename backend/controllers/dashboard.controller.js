// controllers/dashboard.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| SUPER ADMIN DASHBOARD
|--------------------------------------------------------------------------
| Full business overview across the entire system.
|--------------------------------------------------------------------------
*/
export const getSuperAdminDashboard = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT

            /* ---------------------------------------------------------------
            | USERS
            --------------------------------------------------------------- */
            (
            SELECT COUNT(*)
            FROM users
            WHERE status = 'ACTIVE'
            ) AS active_users,

            (
            SELECT COUNT(*)
            FROM users
            WHERE role = 'ADMIN'
                AND status = 'ACTIVE'
            ) AS active_admins,

            (
            SELECT COUNT(*)
            FROM users
            WHERE role = 'SALESPERSON'
                AND status = 'ACTIVE'
            ) AS active_salespersons,

            /* ---------------------------------------------------------------
            | TRUCKS
            --------------------------------------------------------------- */
            (
            SELECT COUNT(*)
            FROM trucks
            WHERE status = 'ACTIVE'
            ) AS active_trucks,

            /* ---------------------------------------------------------------
            | PRODUCTS
            --------------------------------------------------------------- */
            (
            SELECT COUNT(*)
            FROM products
            WHERE status = 'ACTIVE'
            ) AS active_products,

            (
            SELECT COUNT(*)
            FROM store_inventory si

            JOIN products p
                ON p.id = si.product_id

            WHERE si.quantity <= p.minimum_stock
            ) AS low_stock_products,

            /* ---------------------------------------------------------------
            | STORE VALUE
            --------------------------------------------------------------- */
            (
            SELECT COALESCE(
                SUM(
                si.quantity * p.buying_price
                ),
                0
            )

            FROM store_inventory si

            JOIN products p
                ON p.id = si.product_id
            ) AS store_stock_value,

            /* ---------------------------------------------------------------
            | TODAY'S SALES
            --------------------------------------------------------------- */
            (
            SELECT COALESCE(
                SUM(total_amount),
                0
            )

            FROM sales

            WHERE sale_date = CURRENT_DATE
            ) AS today_sales,

            /* ---------------------------------------------------------------
            | TODAY'S PURCHASES
            --------------------------------------------------------------- */
            (
            SELECT COALESCE(
                SUM(total_amount),
                0
            )

            FROM purchases

            WHERE purchase_date = CURRENT_DATE
            ) AS today_purchases,

            /* ---------------------------------------------------------------
            | PAYMENTS COLLECTED TODAY
            --------------------------------------------------------------- */
            (
            SELECT COALESCE(
                SUM(amount),
                0
            )

            FROM sale_payments

            WHERE paid_at::date = CURRENT_DATE
            ) AS today_collections,

            /* ---------------------------------------------------------------
            | TODAY'S EXPENSES
            --------------------------------------------------------------- */
            (
            SELECT COALESCE(
                SUM(amount),
                0
            )

            FROM truck_expenses

            WHERE expense_date = CURRENT_DATE
            ) AS today_expenses,

            /* ---------------------------------------------------------------
            | OUTSTANDING CUSTOMER DEBT
            --------------------------------------------------------------- */
            (
            SELECT COALESCE(
                SUM(
                s.total_amount
                -
                COALESCE(ps.amount_paid, 0)
                ),
                0
            )

            FROM sales s

            LEFT JOIN (
                SELECT
                sale_id,
                SUM(amount) AS amount_paid

                FROM sale_payments

                GROUP BY sale_id
            ) ps
                ON ps.sale_id = s.id

            WHERE s.payment_status IN (
                'UNPAID',
                'PARTIAL'
            )
            ) AS outstanding_debt,

            /* ---------------------------------------------------------------
            | PENDING RECONCILIATIONS
            --------------------------------------------------------------- */
            (
            SELECT COUNT(*)
            FROM truck_reconciliations
            WHERE status = 'SUBMITTED'
            ) AS pending_reconciliations
        `);

        // Get currently LOGGED IN SUPER_ADMIN
        // re.user.userId comes from the JWT after authenticateUser middleware

        const userResult =await pool.query(
            `
            SELECT
            id,
            name,
            email,
            phone,
            role
            
            FROM users
            
            WHERE id = $1`,

            [req.user.userId]
        );

    return res.status(200).json({
        success: true,

        // Information used for the dashboard header
        user: userResult.rows[0],

        dashboard: result.rows[0],
    });

  } catch (error) {
        console.error(
        "Super admin dashboard error:",
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
| ADMIN DASHBOARD
|--------------------------------------------------------------------------
| Business and financial overview.
|--------------------------------------------------------------------------
*/
export const getAdminDashboard = async (req, res) => {
    try {
        const summaryResult = await pool.query(`
        SELECT

            (
            SELECT COALESCE(
                SUM(total_amount),
                0
            )

            FROM sales

            WHERE sale_date = CURRENT_DATE
            ) AS today_sales,

            (
            SELECT COALESCE(
                SUM(total_amount),
                0
            )

            FROM purchases

            WHERE purchase_date = CURRENT_DATE
            ) AS today_purchases,

            (
            SELECT COALESCE(
                SUM(amount),
                0
            )

            FROM sale_payments

            WHERE paid_at::date = CURRENT_DATE
            ) AS today_collections,

            (
            SELECT COALESCE(
                SUM(amount),
                0
            )

            FROM truck_expenses

            WHERE expense_date = CURRENT_DATE
            ) AS today_expenses,

            (
            SELECT COALESCE(
                SUM(
                si.quantity * p.buying_price
                ),
                0
            )

            FROM store_inventory si

            JOIN products p
                ON p.id = si.product_id
            ) AS store_stock_value,

            (
            SELECT COUNT(*)

            FROM store_inventory si

            JOIN products p
                ON p.id = si.product_id

            WHERE si.quantity <= p.minimum_stock
            ) AS low_stock_products,

            (
            SELECT COALESCE(
                SUM(
                s.total_amount
                -
                COALESCE(ps.amount_paid, 0)
                ),
                0
            )

            FROM sales s

            LEFT JOIN (
                SELECT
                sale_id,
                SUM(amount) AS amount_paid

                FROM sale_payments

                GROUP BY sale_id
            ) ps
                ON ps.sale_id = s.id

            WHERE s.payment_status IN (
                'UNPAID',
                'PARTIAL'
            )
            ) AS outstanding_debt,

            (
            SELECT COUNT(*)
            FROM truck_reconciliations
            WHERE status = 'SUBMITTED'
            ) AS pending_reconciliations
        `);

        /*
        |--------------------------------------------------------------------------
        | TODAY'S SALES BY TRUCK
        |--------------------------------------------------------------------------
        */

        const truckSalesResult = await pool.query(`
        SELECT
            t.id AS truck_id,
            t.name AS truck_name,
            t.registration_number,

            COALESCE(
            SUM(s.total_amount),
            0
            ) AS total_sales

        FROM trucks t

        LEFT JOIN sales s
            ON s.truck_id = t.id
            AND s.sale_date = CURRENT_DATE

        WHERE t.status = 'ACTIVE'

        GROUP BY
            t.id

        ORDER BY total_sales DESC
        `);

        // Get the currently logged-in Admin information.
            const userResult = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                phone,
                role,
                status
            FROM users
            WHERE id = $1
            `,
            [req.user.userId]
            );

    return res.status(200).json({
        success: true,

        // Logged-in admin information
        user:userResult.rows[0],

        dashboard: {
            ...summaryResult.rows[0],

            truck_sales:
            truckSalesResult.rows,
        },
    });

    } catch (error) {
        console.error(
        "Admin dashboard error:",
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
| STOREKEEPER DASHBOARD
|--------------------------------------------------------------------------
| Physical store/inventory information only.
|--------------------------------------------------------------------------
*/
export const getStorekeeperDashboard = async (req,res) => {
    try {
        const summaryResult = await pool.query(`
        SELECT

            /* Total units currently inside store. */
            (
            SELECT COALESCE(
                SUM(quantity),
                0
            )

            FROM store_inventory
            ) AS total_store_units,

            /* Total buying-value of store inventory. */
            (
            SELECT COALESCE(
                SUM(
                si.quantity * p.buying_price
                ),
                0
            )

            FROM store_inventory si

            JOIN products p
                ON p.id = si.product_id
            ) AS store_stock_value,

            /* Products at or below minimum stock. */
            (
            SELECT COUNT(*)

            FROM store_inventory si

            JOIN products p
                ON p.id = si.product_id

            WHERE si.quantity <= p.minimum_stock
            ) AS low_stock_products,

            /* Goods purchased today. */
            (
            SELECT COALESCE(
                SUM(pi.quantity),
                0
            )

            FROM purchases pu

            JOIN purchase_items pi
                ON pi.purchase_id = pu.id

            WHERE pu.purchase_date = CURRENT_DATE
            ) AS units_received_today,

            /* Goods loaded to trucks today. */
            (
            SELECT COALESCE(
                SUM(tli.quantity),
                0
            )

            FROM truck_loads tl

            JOIN truck_load_items tli
                ON tli.truck_load_id = tl.id

            WHERE tl.load_date = CURRENT_DATE
            ) AS units_loaded_today,

            /* Usable products returned from trucks today. */
            (
            SELECT COALESCE(
                SUM(tsei.quantity),
                0
            )

            FROM truck_stock_events tse

            JOIN truck_stock_event_items tsei
                ON tsei.event_id = tse.id

            WHERE tse.event_type = 'RETURN'
                AND tse.event_date = CURRENT_DATE
            ) AS units_returned_today
        `);

    /*
    |--------------------------------------------------------------------------
    | LOW STOCK PRODUCT LIST
    |--------------------------------------------------------------------------
    */

    const lowStockResult = await pool.query(`
        SELECT
            p.id,
            p.name,
            p.sku,
            p.unit,
            p.minimum_stock,

            COALESCE(
            si.quantity,
            0
            ) AS quantity

        FROM products p

        LEFT JOIN store_inventory si
            ON si.product_id = p.id

        WHERE p.status = 'ACTIVE'
            AND COALESCE(
            si.quantity,
            0
            ) <= p.minimum_stock

        ORDER BY quantity ASC
        `);

        // Get the currently logged-in Admin information.
        const userResult = await pool.query(
        `
        SELECT
            id,
            name,
            email,
            phone,
            role,
            status
        FROM users
        WHERE id = $1
        `,
        [req.user.userId]
        );

    return res.status(200).json({
        success: true,

        //Logged-in storekeeper information
        user:userResult.rows[0],

        dashboard: {
            ...summaryResult.rows[0],

            low_stock_items:
            lowStockResult.rows,
        },
    });

    } catch (error) {
        console.error(
        "Storekeeper dashboard error:",
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
| SALESPERSON DASHBOARD
|--------------------------------------------------------------------------
| Only data belonging to the logged-in salesperson's assigned truck.
|--------------------------------------------------------------------------
*/
export const getSalespersonDashboard = async (req,res) => {
    try {
    /*
    |--------------------------------------------------------------------------
    | SALESPERSON MUST HAVE A TRUCK
    |--------------------------------------------------------------------------
    */

    if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | MAIN SUMMARY
    |--------------------------------------------------------------------------
    */

    const summaryResult = await pool.query(
        `
        SELECT

            /* Today's sales. */
            (
            SELECT COALESCE(
                SUM(total_amount),
                0
            )

            FROM sales

            WHERE truck_id = $1
                AND salesperson_id = $2
                AND sale_date = CURRENT_DATE
            ) AS today_sales,

            /* Payments collected today. */
            (
            SELECT COALESCE(
                SUM(sp.amount),
                0
            )

            FROM sale_payments sp

            JOIN sales s
                ON s.id = sp.sale_id

            WHERE s.truck_id = $1
                AND sp.received_by = $2
                AND sp.paid_at::date = CURRENT_DATE
            ) AS today_collections,

            /* Today's expenses. */
            (
            SELECT COALESCE(
                SUM(amount),
                0
            )

            FROM truck_expenses

            WHERE truck_id = $1
                AND salesperson_id = $2
                AND expense_date = CURRENT_DATE
            ) AS today_expenses,

            /* Number of customers attached to the truck. */
            (
            SELECT COUNT(*)

            FROM customers

            WHERE truck_id = $1
                AND status = 'ACTIVE'
            ) AS customers,

            /* Current units remaining inside the truck. */
            (
            SELECT COALESCE(
                SUM(quantity),
                0
            )

            FROM truck_inventory

            WHERE truck_id = $1
            ) AS truck_stock_units,

            /* Outstanding debt belonging to this truck. */
            (
            SELECT COALESCE(
                SUM(
                s.total_amount
                -
                COALESCE(ps.amount_paid, 0)
                ),
                0
            )

            FROM sales s

            LEFT JOIN (
                SELECT
                sale_id,
                SUM(amount) AS amount_paid

                FROM sale_payments

                GROUP BY sale_id
            ) ps
                ON ps.sale_id = s.id

            WHERE s.truck_id = $1
                AND s.payment_status IN (
                'UNPAID',
                'PARTIAL'
                )
            ) AS outstanding_debt,

            /* Returned stock today. */
            (
            SELECT COALESCE(
                SUM(tsei.quantity),
                0
            )

            FROM truck_stock_events tse

            JOIN truck_stock_event_items tsei
                ON tsei.event_id = tse.id

            WHERE tse.truck_id = $1
                AND tse.event_date = CURRENT_DATE
                AND tse.event_type = 'RETURN'
            ) AS returned_today,

            /* Damaged stock today. */
            (
            SELECT COALESCE(
                SUM(tsei.quantity),
                0
            )

            FROM truck_stock_events tse

            JOIN truck_stock_event_items tsei
                ON tsei.event_id = tse.id

            WHERE tse.truck_id = $1
                AND tse.event_date = CURRENT_DATE
                AND tse.event_type = 'DAMAGED'
            ) AS damaged_today
        `,
        [
            req.user.truckId,
            req.user.userId,
        ]
        );

    /*
    |--------------------------------------------------------------------------
    | CHECK TODAY'S RECONCILIATION STATUS
    |--------------------------------------------------------------------------
    */

    const reconciliationResult = await pool.query(
        `
        SELECT
            id,
            status,
            expected_cash,
            submitted_cash,
            cash_difference

        FROM truck_reconciliations

        WHERE truck_id = $1
            AND salesperson_id = $2
            AND reconciliation_date = CURRENT_DATE

        LIMIT 1
        `,
        [
            req.user.truckId,
            req.user.userId,
        ]
        );

        const todayReconciliation =
        reconciliationResult.rows.length > 0
            ? reconciliationResult.rows[0]
            : null;

        /*
        |--------------------------------------------------------------------------
        | CURRENT TRUCK
        |--------------------------------------------------------------------------
        */

    const truckResult = await pool.query(
        `
        SELECT
            id,
            name,
            registration_number

        FROM trucks

        WHERE id = $1
        `,
        [req.user.truckId]
        );

        // Get the currently logged-in Admin information.
            const userResult = await pool.query(
                `
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    role,
                    status
                FROM users
                WHERE id = $1
                `,
                [req.user.userId]
                );

        return res.status(200).json({
        success: true,

        // Logged-in salesperson information
        user:userResult.rows[0],

        dashboard: {
            truck:
            truckResult.rows[0] || null,

            ...summaryResult.rows[0],

            reconciliation:
            todayReconciliation,

            day_closed:
            Boolean(todayReconciliation),
        },
        });

    } catch (error) {
        console.error(
        "Salesperson dashboard error:",
        error
        );

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};