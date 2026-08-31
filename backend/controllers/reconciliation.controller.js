// controllers/reconciliation.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CLOSE TRUCK DAY
|--------------------------------------------------------------------------
|
| This endpoint calculates the day's financial and stock figures
| automatically.
|
| The salesperson only provides:
|
| - submitted_cash
| - optional notes
| - optional reconciliation_date
|
|--------------------------------------------------------------------------
*/
export const closeTruckDay = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
        submitted_cash,
        notes,
        reconciliation_date,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | CHECK TRUCK ASSIGNMENT
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
    | VALIDATE SUBMITTED CASH
    |--------------------------------------------------------------------------
    */

    const submittedCash = Number(submitted_cash);

    if (
        !Number.isFinite(submittedCash) ||
        submittedCash < 0
        ) {
        return res.status(400).json({
            success: false,
            message: "Submitted cash must be a valid amount",
        });
    }

    await client.query("BEGIN");

    /*
    |--------------------------------------------------------------------------
    | DETERMINE CLOSING DATE
    |--------------------------------------------------------------------------
    |
    | If no date is supplied, PostgreSQL uses today's date.
    |
    |--------------------------------------------------------------------------
    */

    const dateResult = await client.query(
        `
        SELECT COALESCE($1::date, CURRENT_DATE) AS reconciliation_date
        `,
        [reconciliation_date || null]
        );

    const closingDate =
        dateResult.rows[0].reconciliation_date;

    /*
    |--------------------------------------------------------------------------
    | PREVENT DUPLICATE DAILY RECONCILIATION
    |--------------------------------------------------------------------------
    */

    const existingResult = await client.query(
        `
        SELECT id
        FROM truck_reconciliations

        WHERE truck_id = $1
            AND reconciliation_date = $2
        `,
        [
        req.user.truckId,
        closingDate,
        ]
    );

    if (existingResult.rows.length > 0) {
        await client.query("ROLLBACK");

        return res.status(409).json({
            success: false,
            message: "This truck has already been reconciled for this date",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CALCULATE SALES
    |--------------------------------------------------------------------------
    |
    | Total value of sales created during the reconciliation date.
    |
    |--------------------------------------------------------------------------
    */

    const salesResult = await client.query(
        `
        SELECT
            COALESCE(SUM(total_amount), 0) AS total_sales

        FROM sales

        WHERE truck_id = $1
            AND salesperson_id = $2
            AND sale_date = $3
        `,
        [
            req.user.truckId,
            req.user.userId,
            closingDate,
        ]
        );

    const totalSales =
        Number(salesResult.rows[0].total_sales);

    /*
    |--------------------------------------------------------------------------
    | CALCULATE PAYMENTS COLLECTED DURING THE DAY
    |--------------------------------------------------------------------------
    |
    | Important:
    |
    | Payments are based on paid_at, NOT sale_date.
    |
    | This means if a customer pays an old debt today,
    | that money correctly appears in today's collections.
    |
    |--------------------------------------------------------------------------
    */

    const paymentResult = await client.query(
        `
        SELECT

            COALESCE(
            SUM(sp.amount) FILTER (
                WHERE sp.payment_method = 'CASH'
            ),
            0
            ) AS cash_payments,

            COALESCE(
            SUM(sp.amount) FILTER (
                WHERE sp.payment_method = 'MOBILE_MONEY'
            ),
            0
            ) AS mobile_money_payments,

            COALESCE(
            SUM(sp.amount) FILTER (
                WHERE sp.payment_method = 'CARD'
            ),
            0
            ) AS card_payments,

            COALESCE(
            SUM(sp.amount),
            0
            ) AS total_collected

        FROM sale_payments sp

        JOIN sales s
            ON s.id = sp.sale_id

        WHERE s.truck_id = $1
            AND sp.received_by = $2
            AND sp.paid_at::date = $3
        `,
        [
            req.user.truckId,
            req.user.userId,
            closingDate,
        ]
    );

    const cashPayments =
        Number(paymentResult.rows[0].cash_payments);

    const mobileMoneyPayments =
        Number(paymentResult.rows[0].mobile_money_payments);

    const cardPayments =
        Number(paymentResult.rows[0].card_payments);

    const totalCollected =
        Number(paymentResult.rows[0].total_collected);

    /*
    |--------------------------------------------------------------------------
    | CALCULATE OUTSTANDING CREDIT FROM TODAY'S SALES
    |--------------------------------------------------------------------------
    |
    | This calculates how much of today's sales remains unpaid.
    |
    |--------------------------------------------------------------------------
    */

    const debtResult = await client.query(
        `
        SELECT
            COALESCE(
            SUM(
                s.total_amount
                -
                COALESCE(payment_summary.amount_paid, 0)
            ),
            0
            ) AS outstanding_credit

        FROM sales s

        LEFT JOIN (
            SELECT
            sale_id,
            SUM(amount) AS amount_paid

            FROM sale_payments

            GROUP BY sale_id

        ) payment_summary
            ON payment_summary.sale_id = s.id

        WHERE s.truck_id = $1
            AND s.salesperson_id = $2
            AND s.sale_date = $3
        `,
        [
            req.user.truckId,
            req.user.userId,
            closingDate,
        ]
    );

    const outstandingCredit = Math.max(
        0,
        Number(debtResult.rows[0].outstanding_credit)
    );

    /*
    |--------------------------------------------------------------------------
    | CALCULATE EXPENSES
    |--------------------------------------------------------------------------
    */

    const expenseResult = await client.query(
        `
        SELECT
            COALESCE(
            SUM(amount),
            0
            ) AS total_expenses

        FROM truck_expenses

        WHERE truck_id = $1
            AND salesperson_id = $2
            AND expense_date = $3
        `,
        [
            req.user.truckId,
            req.user.userId,
            closingDate,
        ]
    );

    const totalExpenses =
        Number(expenseResult.rows[0].total_expenses);

    /*
    |--------------------------------------------------------------------------
    | CALCULATE STOCK EVENTS
    |--------------------------------------------------------------------------
    */

    const stockEventResult = await client.query(
        `
        SELECT

            COALESCE(
            SUM(tsei.quantity) FILTER (
                WHERE tse.event_type = 'RETURN'
            ),
            0
            ) AS returned_quantity,

            COALESCE(
            SUM(tsei.quantity) FILTER (
                WHERE tse.event_type = 'DAMAGED'
            ),
            0
            ) AS damaged_quantity,

            COALESCE(
            SUM(tsei.quantity) FILTER (
                WHERE tse.event_type = 'LOST'
            ),
            0
            ) AS lost_quantity,

            COALESCE(
            SUM(tsei.quantity) FILTER (
                WHERE tse.event_type = 'EXPIRED'
            ),
            0
            ) AS expired_quantity

        FROM truck_stock_events tse

        LEFT JOIN truck_stock_event_items tsei
            ON tsei.event_id = tse.id

        WHERE tse.truck_id = $1
            AND tse.event_date = $2
        `,
        [
            req.user.truckId,
            closingDate,
        ]
    );

    const returnedQuantity =
        Number(stockEventResult.rows[0].returned_quantity);

    const damagedQuantity =
        Number(stockEventResult.rows[0].damaged_quantity);

    const lostQuantity =
        Number(stockEventResult.rows[0].lost_quantity);

    const expiredQuantity =
        Number(stockEventResult.rows[0].expired_quantity);

    /*
    |--------------------------------------------------------------------------
    | EXPECTED CASH
    |--------------------------------------------------------------------------
    |
    | Only CASH payments are expected to be physically submitted.
    |
    | Mobile money and card payments are already electronic.
    |
    | For now we assume truck expenses are paid from collected cash.
    |
    |--------------------------------------------------------------------------
    */

    // Expected physical cash can never be below zero.
    // Expenses may consume collected cash, but not create negative cash
    const expectedCash = Math.max(
        0,
        cashPayments - totalExpenses
    );

    /*
    |--------------------------------------------------------------------------
    | CASH DIFFERENCE
    |--------------------------------------------------------------------------
    |
    | Positive = extra cash submitted
    | Zero     = balanced
    | Negative = shortage
    |
    |--------------------------------------------------------------------------
    */

    const cashDifference =
        submittedCash - expectedCash;

    /*
    |--------------------------------------------------------------------------
    | SAVE RECONCILIATION SNAPSHOT
    |--------------------------------------------------------------------------
    */

    const reconciliationResult = await client.query(
        `
        INSERT INTO truck_reconciliations (
            truck_id,
            salesperson_id,
            reconciliation_date,

            total_sales,

            cash_payments,
            mobile_money_payments,
            card_payments,
            total_collected,

            outstanding_credit,

            total_expenses,

            expected_cash,
            submitted_cash,
            cash_difference,

            returned_quantity,
            damaged_quantity,
            lost_quantity,
            expired_quantity,

            notes,

            status
        )

        VALUES (
            $1,
            $2,
            $3,

            $4,

            $5,
            $6,
            $7,
            $8,

            $9,

            $10,

            $11,
            $12,
            $13,

            $14,
            $15,
            $16,
            $17,

            $18,

            'SUBMITTED'
        )

        RETURNING *
        `,
        [
            req.user.truckId,
            req.user.userId,
            closingDate,

            totalSales,

            cashPayments,
            mobileMoneyPayments,
            cardPayments,
            totalCollected,

            outstandingCredit,

            totalExpenses,

            expectedCash,
            submittedCash,
            cashDifference,

            returnedQuantity,
            damagedQuantity,
            lostQuantity,
            expiredQuantity,

            notes || null,
        ]
    );

    await client.query("COMMIT");

    /*
    |--------------------------------------------------------------------------
    | DETERMINE CASH STATUS
    |--------------------------------------------------------------------------
    */

    let cashStatus = "BALANCED";

    if (cashDifference < 0) {
        cashStatus = "SHORTAGE";
    }

    if (cashDifference > 0) {
        cashStatus = "OVERAGE";
    }

    return res.status(201).json({
        success: true,
        message: "Truck day closed successfully",

        reconciliation:
            reconciliationResult.rows[0],

        cash_status: cashStatus,
        });

    } catch (error) {
    await client.query("ROLLBACK");

    console.error(
        "Close truck reconciliation error:",
        error
    );

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });

    } finally {
        client.release();
    }
};


/*
|--------------------------------------------------------------------------
| GET MY RECONCILIATION HISTORY
|--------------------------------------------------------------------------
*/
export const getMyReconciliations = async (req, res) => {
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
            tr.*,

            CASE
            WHEN tr.cash_difference = 0
                THEN 'BALANCED'

            WHEN tr.cash_difference < 0
                THEN 'SHORTAGE'

            ELSE 'OVERAGE'
            END AS cash_status

        FROM truck_reconciliations tr

        WHERE tr.truck_id = $1
            AND tr.salesperson_id = $2

        ORDER BY
            tr.reconciliation_date DESC,
            tr.created_at DESC
        `,
        [
            req.user.truckId,
            req.user.userId,
        ]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            reconciliations: result.rows,
        });

    } catch (error) {
        console.error(
        "Get reconciliations error:",
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
| GET TODAY'S RECONCILIATION
|--------------------------------------------------------------------------
*/
export const getTodayReconciliation = async (req, res) => {
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
            tr.*,

            CASE
            WHEN tr.cash_difference = 0
                THEN 'BALANCED'

            WHEN tr.cash_difference < 0
                THEN 'SHORTAGE'

            ELSE 'OVERAGE'
            END AS cash_status

        FROM truck_reconciliations tr

        WHERE tr.truck_id = $1
            AND tr.salesperson_id = $2
            AND tr.reconciliation_date = CURRENT_DATE
        `,
        [
            req.user.truckId,
            req.user.userId,
        ]
        );

        if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Today's truck has not been reconciled yet",
        });
    }

    return res.status(200).json({
        success: true,
        reconciliation: result.rows[0],
    });

    } catch (error) {
    console.error(
        "Get today's reconciliation error:",
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
| ADMIN: GET ALL RECONCILIATIONS
|--------------------------------------------------------------------------
| Admin and Super Admin can review truck closing records.
|--------------------------------------------------------------------------
*/
export const getAllReconciliations = async (req, res) => {
    try {
        const {
        status,
        truck_id,
        date,
    } = req.query;

    const values = [];

    const conditions = [];

    /*
    |--------------------------------------------------------------------------
    | OPTIONAL FILTERS
    |--------------------------------------------------------------------------
    */

    if (status) {
        values.push(status);

        conditions.push(
            `tr.status = $${values.length}`
        );
        }

        if (truck_id) {
        values.push(truck_id);

        conditions.push(
            `tr.truck_id = $${values.length}`
        );
        }

        if (date) {
        values.push(date);

        conditions.push(
            `tr.reconciliation_date = $${values.length}`
        );
    }

    const whereClause =
        conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await pool.query(
        `
        SELECT
        tr.id,
        tr.truck_id,
        t.name AS truck_name,
        t.registration_number,

        tr.salesperson_id,
        u.name AS salesperson_name,

        tr.reconciliation_date,

        tr.total_sales,

        tr.cash_payments,
        tr.mobile_money_payments,
        tr.card_payments,
        tr.total_collected,

        tr.outstanding_credit,

        tr.total_expenses,

        tr.expected_cash,
        tr.submitted_cash,
        tr.cash_difference,

        tr.returned_quantity,
        tr.damaged_quantity,
        tr.lost_quantity,
        tr.expired_quantity,

        tr.status,

        tr.notes,

        tr.approved_by,
        approver.name AS approved_by_name,

        tr.approved_at,
        tr.created_at,

        CASE

            WHEN tr.cash_difference = 0
                THEN 'BALANCED'

            WHEN tr.cash_difference < 0
                THEN 'SHORTAGE'

            ELSE 'OVERAGE'

            END AS cash_status

        FROM truck_reconciliations tr

        JOIN trucks t
            ON t.id = tr.truck_id

        JOIN users u
            ON u.id = tr.salesperson_id

        LEFT JOIN users approver
            ON approver.id = tr.approved_by

        ${whereClause}

        ORDER BY
            tr.reconciliation_date DESC,
            tr.created_at DESC
        `,
        values
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            reconciliations: result.rows,
        });

    } catch (error) {
        console.error(
        "Get all reconciliations error:",
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
| ADMIN: GET ONE RECONCILIATION
|--------------------------------------------------------------------------
*/
export const getReconciliationById = async (req,res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
        `
        SELECT
            tr.*,

            t.name AS truck_name,
            t.registration_number,

            u.name AS salesperson_name,
            u.phone AS salesperson_phone,

            approver.name AS approved_by_name,

            CASE

            WHEN tr.cash_difference = 0
                THEN 'BALANCED'

            WHEN tr.cash_difference < 0
                THEN 'SHORTAGE'

            ELSE 'OVERAGE'

            END AS cash_status

        FROM truck_reconciliations tr

        JOIN trucks t
            ON t.id = tr.truck_id

        JOIN users u
            ON u.id = tr.salesperson_id

        LEFT JOIN users approver
            ON approver.id = tr.approved_by

        WHERE tr.id = $1
        `,
        [id]
        );

        if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Reconciliation not found",
        });
        }

        return res.status(200).json({
            success: true,
            reconciliation: result.rows[0],
        });

    } catch (error) {
        console.error(
        "Get reconciliation error:",
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
| ADMIN: APPROVE RECONCILIATION
|--------------------------------------------------------------------------
*/
export const approveReconciliation = async (req,res) => {
    try {
        const { id } = req.params;

    /*
    |--------------------------------------------------------------------------
    | CHECK RECORD
    |--------------------------------------------------------------------------
    */

    const existingResult = await pool.query(
        `
        SELECT *
        FROM truck_reconciliations
        WHERE id = $1
        `,
        [id]
        );

    if (existingResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Reconciliation not found",
        });
    }

    const reconciliation =
        existingResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | ONLY SUBMITTED RECORDS CAN BE APPROVED
    |--------------------------------------------------------------------------
    */

    if (reconciliation.status !== "SUBMITTED") {
        return res.status(400).json({
            success: false,
            message:
                "Only submitted reconciliations can be approved",
        });
    }

    const result = await pool.query(
        `
        UPDATE truck_reconciliations

        SET
            status = 'APPROVED',
            approved_by = $1,
            approved_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP

        WHERE id = $2

        RETURNING *
        `,
        [
            req.user.userId,
            id,
        ]
    );

    return res.status(200).json({
        success: true,
        message:
            "Reconciliation approved successfully",

        reconciliation: result.rows[0],
    });

    } catch (error) {
    console.error(
        "Approve reconciliation error:",
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
| ADMIN: REJECT RECONCILIATION
|--------------------------------------------------------------------------
*/
export const rejectReconciliation = async (req,res) => {
    try {
        const { id } = req.params;

        const { reason } = req.body;

    if (!reason || !reason.trim()) {
        return res.status(400).json({
            success: false,
            message: "Rejection reason is required",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK RECORD
    |--------------------------------------------------------------------------
    */

    const existingResult = await pool.query(
        `
        SELECT *
        FROM truck_reconciliations
        WHERE id = $1
        `,
        [id]
    );

    if (existingResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Reconciliation not found",
        });
    }

    const reconciliation =
      existingResult.rows[0];

    if (reconciliation.status !== "SUBMITTED") {
        return res.status(400).json({
            success: false,
            message:
                "Only submitted reconciliations can be rejected",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | APPEND REJECTION REASON TO NOTES
    |--------------------------------------------------------------------------
    */

    const result = await pool.query(
        `
        UPDATE truck_reconciliations

        SET
            status = 'REJECTED',

            approved_by = $1,

            approved_at = CURRENT_TIMESTAMP,

            notes =
            CONCAT(
                COALESCE(notes, ''),
                CASE
                WHEN notes IS NULL OR notes = ''
                THEN ''
                ELSE E'\\n'
                END,
                'REJECTION REASON: ',
                $2
            ),

            updated_at = CURRENT_TIMESTAMP

        WHERE id = $3

        RETURNING *
        `,
        [
            req.user.userId,
            reason.trim(),
            id,
        ]
    );

    return res.status(200).json({
        success: true,
        message:
            "Reconciliation rejected successfully",

        reconciliation: result.rows[0],
    });

    } catch (error) {
        console.error(
            "Reject reconciliation error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};