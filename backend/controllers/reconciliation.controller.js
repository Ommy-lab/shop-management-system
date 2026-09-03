// controllers/reconciliation.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| BUSINESS TIMEZONE
|--------------------------------------------------------------------------
|
| The business operates using Tanzania local time.
|
| PostgreSQL may be running in UTC, so we should NOT rely on
| CURRENT_DATE directly.
|
| Africa/Dar_es_Salaam = UTC+3.
|
|--------------------------------------------------------------------------
*/
const BUSINESS_TIMEZONE = "Africa/Dar_es_Salaam";


/*
|--------------------------------------------------------------------------
| GET CURRENT BUSINESS DATE
|--------------------------------------------------------------------------
|
| Returns the current calendar date in Tanzania.
|
| Example:
|
| UTC:
| 2026-09-02 21:06
|
| Tanzania:
| 2026-09-03 00:06
|
| This function therefore returns:
|
| 2026-09-03
|
|--------------------------------------------------------------------------
*/
const getCurrentBusinessDate = async (client = pool) => {
    const result = await client.query(
        `
        SELECT
            (
                CURRENT_TIMESTAMP
                AT TIME ZONE '${BUSINESS_TIMEZONE}'
            )::date AS business_date
        `
    );

    return result.rows[0].business_date;
};


/*
|--------------------------------------------------------------------------
| FIND LATEST UNRECONCILED BUSINESS DAY
|--------------------------------------------------------------------------
|
| This is the important part of the fix.
|
| We do NOT blindly use today's calendar date.
|
| Instead, we look for the latest date on which this truck/salesperson
| actually had business activity:
|
| - Sales
| - Payments received
| - Truck stock events
| - Truck expenses
|
| If the salesperson finishes at 00:06 on the following calendar day,
| the latest activity may still belong to yesterday.
|
| Example:
|
| September 2:
|     Sales = 42,000
|
| September 3 00:06:
|     salesperson closes truck
|
| This function returns:
|
|     2026-09-02
|
|--------------------------------------------------------------------------
*/
const getLatestUnreconciledBusinessDate = async (
    client,
    truckId,
    salespersonId
) => {

    const result = await client.query(
        `
        WITH activity_dates AS (

            /*
            |--------------------------------------------------------------
            | SALES
            |--------------------------------------------------------------
            */
            SELECT
                s.sale_date::date AS business_date

            FROM sales s

            WHERE s.truck_id = $1
                AND s.salesperson_id = $2


            UNION


            /*
            |--------------------------------------------------------------
            | PAYMENTS
            |--------------------------------------------------------------
            |
            | Payments belong to the day they were RECEIVED.
            |
            */
            SELECT
                (
                    sp.paid_at
                    AT TIME ZONE '${BUSINESS_TIMEZONE}'
                )::date AS business_date

            FROM sale_payments sp

            JOIN sales s
                ON s.id = sp.sale_id

            WHERE s.truck_id = $1
                AND sp.received_by = $2


            UNION


            /*
            |--------------------------------------------------------------
            | STOCK EVENTS
            |--------------------------------------------------------------
            */
            SELECT
                tse.event_date::date AS business_date

            FROM truck_stock_events tse

            WHERE tse.truck_id = $1
                AND tse.created_by = $2


            UNION


            /*
            |--------------------------------------------------------------
            | EXPENSES
            |--------------------------------------------------------------
            */
            SELECT
                te.expense_date::date AS business_date

            FROM truck_expenses te

            WHERE te.truck_id = $1
                AND te.salesperson_id = $2
        ),

        unreconciled_dates AS (

            SELECT
                a.business_date

            FROM activity_dates a

            WHERE NOT EXISTS (
                SELECT 1

                FROM truck_reconciliations tr

                WHERE tr.truck_id = $1
                    AND tr.salesperson_id = $2
                    AND tr.reconciliation_date = a.business_date
            )
        )

        SELECT
            business_date

        FROM unreconciled_dates

        ORDER BY business_date DESC

        LIMIT 1
        `,
        [
            truckId,
            salespersonId,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | IF THERE IS BUSINESS ACTIVITY THAT HAS NOT BEEN RECONCILED
    |--------------------------------------------------------------------------
    */

    if (result.rows.length > 0) {
        return result.rows[0].business_date;
    }

    /*
    |--------------------------------------------------------------------------
    | OTHERWISE USE CURRENT TANZANIA BUSINESS DATE
    |--------------------------------------------------------------------------
    */

    return await getCurrentBusinessDate(client);
};


/*
|--------------------------------------------------------------------------
| GET RECONCILIATION FIGURES
|--------------------------------------------------------------------------
|
| This helper calculates all figures for one specific business date.
|
| Both:
|
| - GET /today
| - POST /close
|
| use the same calculation logic.
|
| This prevents the preview and final reconciliation from calculating
| different numbers.
|
|--------------------------------------------------------------------------
*/
const calculateReconciliation = async (
    client,
    truckId,
    salespersonId,
    businessDate
) => {

    /*
    |--------------------------------------------------------------------------
    | SALES
    |--------------------------------------------------------------------------
    */

    const salesResult = await client.query(
        `
        SELECT
            COALESCE(
                SUM(total_amount),
                0
            ) AS total_sales

        FROM sales

        WHERE truck_id = $1
            AND salesperson_id = $2
            AND sale_date::date = $3
        `,
        [
            truckId,
            salespersonId,
            businessDate,
        ]
    );

    const totalSales = Number(
        salesResult.rows[0].total_sales
    );


    /*
    |--------------------------------------------------------------------------
    | PAYMENTS
    |--------------------------------------------------------------------------
    |
    | Payments are based on WHEN MONEY WAS RECEIVED.
    |
    | Therefore an old credit sale paid today belongs to today's
    | collections.
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
            AND (
                sp.paid_at
                AT TIME ZONE '${BUSINESS_TIMEZONE}'
            )::date = $3
        `,
        [
            truckId,
            salespersonId,
            businessDate,
        ]
    );

    const cashPayments = Number(
        paymentResult.rows[0].cash_payments
    );

    const mobileMoneyPayments = Number(
        paymentResult.rows[0].mobile_money_payments
    );

    const cardPayments = Number(
        paymentResult.rows[0].card_payments
    );

    const totalCollected = Number(
        paymentResult.rows[0].total_collected
    );


    /*
    |--------------------------------------------------------------------------
    | OUTSTANDING CREDIT
    |--------------------------------------------------------------------------
    |
    | Only credit originating from this business day's sales is counted.
    |
    |--------------------------------------------------------------------------
    */

    const debtResult = await client.query(
        `
        SELECT
            COALESCE(
                SUM(
                    GREATEST(
                        s.total_amount
                        -
                        COALESCE(
                            payment_summary.amount_paid,
                            0
                        ),
                        0
                    )
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
            AND s.sale_date::date = $3
        `,
        [
            truckId,
            salespersonId,
            businessDate,
        ]
    );

    const outstandingCredit = Math.max(
        0,
        Number(
            debtResult.rows[0].outstanding_credit
        )
    );


    /*
    |--------------------------------------------------------------------------
    | EXPENSES
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
            AND expense_date::date = $3
        `,
        [
            truckId,
            salespersonId,
            businessDate,
        ]
    );

    const totalExpenses = Number(
        expenseResult.rows[0].total_expenses
    );


    /*
    |--------------------------------------------------------------------------
    | STOCK EVENTS
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
            AND tse.created_by = $2
            AND tse.event_date::date = $3
        `,
        [
            truckId,
            salespersonId,
            businessDate,
        ]
    );

    const returnedQuantity = Number(
        stockEventResult.rows[0].returned_quantity
    );

    const damagedQuantity = Number(
        stockEventResult.rows[0].damaged_quantity
    );

    const lostQuantity = Number(
        stockEventResult.rows[0].lost_quantity
    );

    const expiredQuantity = Number(
        stockEventResult.rows[0].expired_quantity
    );


    /*
    |--------------------------------------------------------------------------
    | EXPECTED CASH
    |--------------------------------------------------------------------------
    |
    | Only physical cash should be handed over.
    |
    | Mobile money and card payments are electronic.
    |
    | Expenses are deducted from cash.
    |
    |--------------------------------------------------------------------------
    */

    const expectedCash = Math.max(
        0,
        cashPayments - totalExpenses
    );


    return {
        totalSales,

        cashPayments,
        mobileMoneyPayments,
        cardPayments,
        totalCollected,

        outstandingCredit,

        totalExpenses,

        expectedCash,

        returnedQuantity,
        damagedQuantity,
        lostQuantity,
        expiredQuantity,
    };
};


/*
|--------------------------------------------------------------------------
| CLOSE TRUCK DAY
|--------------------------------------------------------------------------
|
| Salesperson submits:
|
| - submitted_cash
| - optional notes
| - optional reconciliation_date
|
| If reconciliation_date is not supplied, the system automatically
| finds the latest unreconciled truck business day.
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
        | VALIDATE CASH
        |--------------------------------------------------------------------------
        */

        const submittedCash = Number(
            submitted_cash
        );

        if (
            !Number.isFinite(submittedCash) ||
            submittedCash < 0
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "Submitted cash must be a valid amount",
            });
        }


        await client.query("BEGIN");


        /*
        |--------------------------------------------------------------------------
        | DETERMINE BUSINESS DATE
        |--------------------------------------------------------------------------
        |
        | If the frontend explicitly sends a date, respect it.
        |
        | Otherwise find the latest unreconciled business day.
        |--------------------------------------------------------------------------
        */

        let closingDate;

        if (reconciliation_date) {

            const dateResult = await client.query(
                `
                SELECT
                    $1::date AS reconciliation_date
                `,
                [reconciliation_date]
            );

            closingDate =
                dateResult.rows[0].reconciliation_date;

        } else {

            closingDate =
                await getLatestUnreconciledBusinessDate(
                    client,
                    req.user.truckId,
                    req.user.userId
                );
        }


        /*
        |--------------------------------------------------------------------------
        | PREVENT DUPLICATE RECONCILIATION
        |--------------------------------------------------------------------------
        */

        const existingResult = await client.query(
            `
            SELECT id

            FROM truck_reconciliations

            WHERE truck_id = $1
                AND salesperson_id = $2
                AND reconciliation_date = $3
            `,
            [
                req.user.truckId,
                req.user.userId,
                closingDate,
            ]
        );


        if (existingResult.rows.length > 0) {

            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message:
                    "This truck has already been reconciled for this date",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | CALCULATE EVERYTHING FOR THE BUSINESS DATE
        |--------------------------------------------------------------------------
        */

        const figures =
            await calculateReconciliation(
                client,
                req.user.truckId,
                req.user.userId,
                closingDate
            );


        /*
        |--------------------------------------------------------------------------
        | CALCULATE CASH DIFFERENCE
        |--------------------------------------------------------------------------
        */

        const cashDifference =
            submittedCash - figures.expectedCash;


        /*
        |--------------------------------------------------------------------------
        | SAVE SNAPSHOT
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

                figures.totalSales,

                figures.cashPayments,
                figures.mobileMoneyPayments,
                figures.cardPayments,
                figures.totalCollected,

                figures.outstandingCredit,

                figures.totalExpenses,

                figures.expectedCash,
                submittedCash,
                cashDifference,

                figures.returnedQuantity,
                figures.damagedQuantity,
                figures.lostQuantity,
                figures.expiredQuantity,

                notes || null,
            ]
        );


        await client.query("COMMIT");


        /*
        |--------------------------------------------------------------------------
        | CASH STATUS
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

            message:
                "Truck day closed successfully",

            reconciliation: {
                ...reconciliationResult.rows[0],
                cash_status: cashStatus,
            },

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
                message:
                    "You are not assigned to a truck",
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
| GET TODAY'S / CURRENT TRUCK BUSINESS DAY
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This endpoint no longer blindly uses CURRENT_DATE.
|
| It finds the latest unreconciled business date.
|
|--------------------------------------------------------------------------
*/
export const getTodayReconciliation = async (req, res) => {

    try {

        if (!req.user.truckId) {
            return res.status(400).json({
                success: false,
                message:
                    "You are not assigned to a truck",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | FIND THE BUSINESS DATE
        |--------------------------------------------------------------------------
        */

        const businessDate =
            await getLatestUnreconciledBusinessDate(
                pool,
                req.user.truckId,
                req.user.userId
            );


        /*
        |--------------------------------------------------------------------------
        | CHECK WHETHER THAT DATE IS ALREADY RECONCILED
        |--------------------------------------------------------------------------
        */

        const existingResult = await pool.query(
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
                AND tr.reconciliation_date = $3
            `,
            [
                req.user.truckId,
                req.user.userId,
                businessDate,
            ]
        );


        /*
        |--------------------------------------------------------------------------
        | EXISTING RECONCILIATION
        |--------------------------------------------------------------------------
        */

        if (existingResult.rows.length > 0) {

            return res.status(200).json({

                success: true,

                reconciled: true,

                reconciliation: {
                    ...existingResult.rows[0],
                    reconciled: true,
                },

            });
        }


        /*
        |--------------------------------------------------------------------------
        | CALCULATE LIVE PREVIEW
        |--------------------------------------------------------------------------
        */

        const figures =
            await calculateReconciliation(
                pool,
                req.user.truckId,
                req.user.userId,
                businessDate
            );


        /*
        |--------------------------------------------------------------------------
        | RETURN PREVIEW
        |--------------------------------------------------------------------------
        */

        return res.status(200).json({

            success: true,

            reconciled: false,

            reconciliation: {

                reconciled: false,

                reconciliation_date:
                    businessDate,

                truck_id:
                    req.user.truckId,

                salesperson_id:
                    req.user.userId,

                total_sales:
                    figures.totalSales,

                cash_payments:
                    figures.cashPayments,

                mobile_money_payments:
                    figures.mobileMoneyPayments,

                card_payments:
                    figures.cardPayments,

                total_collected:
                    figures.totalCollected,

                outstanding_credit:
                    figures.outstandingCredit,

                total_expenses:
                    figures.totalExpenses,

                expected_cash:
                    figures.expectedCash,

                submitted_cash: null,

                cash_difference: null,

                returned_quantity:
                    figures.returnedQuantity,

                damaged_quantity:
                    figures.damagedQuantity,

                lost_quantity:
                    figures.lostQuantity,

                expired_quantity:
                    figures.expiredQuantity,

                status: "OPEN",

                notes: null,
            },

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

export const getReconciliationById = async (req, res) => {

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
                message:
                    "Reconciliation not found",
            });
        }


        return res.status(200).json({

            success: true,

            reconciliation:
                result.rows[0],

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
|
| Workflow:
|
| SUBMITTED
|     ↓
| APPROVED
|
|--------------------------------------------------------------------------
*/
export const approveReconciliation = async (req, res) => {

    try {

        const { id } = req.params;


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
                message:
                    "Reconciliation not found",
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

            reconciliation:
                result.rows[0],

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
|
| Workflow:
|
| SUBMITTED
|     ↓
| REJECTED
|
|--------------------------------------------------------------------------
*/
export const rejectReconciliation = async (req, res) => {

    try {

        const { id } = req.params;

        const { reason } = req.body;


        /*
        |--------------------------------------------------------------------------
        | VALIDATE REASON
        |--------------------------------------------------------------------------
        */

        if (!reason || !reason.trim()) {

            return res.status(400).json({
                success: false,
                message:
                    "Rejection reason is required",
            });
        }


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
                message:
                    "Reconciliation not found",
            });
        }


        const reconciliation =
            existingResult.rows[0];


        /*
        |--------------------------------------------------------------------------
        | ONLY SUBMITTED RECORDS CAN BE REJECTED
        |--------------------------------------------------------------------------
        */

        if (reconciliation.status !== "SUBMITTED") {

            return res.status(400).json({
                success: false,
                message:
                    "Only submitted reconciliations can be rejected",
            });
        }


        /*
        |--------------------------------------------------------------------------
        | REJECT
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
                            WHEN notes IS NULL
                                OR notes = ''
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

            reconciliation:
                result.rows[0],

        });

    } catch (error) {

        console.error(
            "Reject reconciliation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};