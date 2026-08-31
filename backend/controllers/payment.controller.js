// controllers/payment.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| RECORD SALE PAYMENT
|--------------------------------------------------------------------------
| Allows a salesperson to receive full or partial payment for a sale.
|--------------------------------------------------------------------------
*/
export const recordSalePayment = async (req, res) => {
    const client = await pool.connect();

    try {
        const { sale_id } = req.params;

        const {
        amount,
        payment_method,
        transaction_reference,
        notes,
    } = req.body;

    // Salesperson must belong to a truck.
    if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
    }

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
        return res.status(400).json({
            success: false,
            message: "A valid payment amount is required",
        });
    }

    const allowedMethods = [
        "CASH",
        "MOBILE_MONEY",
        "CARD",
    ];

    if (!allowedMethods.includes(payment_method)) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment method",
        });
    }

    await client.query("BEGIN");

    /*
    |--------------------------------------------------------------------------
    | GET SALE
    |--------------------------------------------------------------------------
    | FOR UPDATE prevents two simultaneous payments from causing an
    | incorrect outstanding balance.
    |--------------------------------------------------------------------------
    */

    const saleResult = await client.query(
        `
        SELECT
            id,
            truck_id,
            salesperson_id,
            customer_id,
            total_amount,
            payment_status

        FROM sales

        WHERE id = $1
            AND truck_id = $2

        FOR UPDATE
        `,
        [
            sale_id,
            req.user.truckId,
        ]
    );

    if (saleResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
            success: false,
            message: "Sale not found for your truck",
        });
    }

    const sale = saleResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | CALCULATE PREVIOUS PAYMENTS
    |--------------------------------------------------------------------------
    */

    const previousPaymentsResult = await client.query(
        `
        SELECT
            COALESCE(SUM(amount), 0) AS amount_paid
        FROM sale_payments
        WHERE sale_id = $1
        `,
        [sale_id]
    );

    const totalAmount = Number(sale.total_amount);

    const previouslyPaid =
        Number(previousPaymentsResult.rows[0].amount_paid);

    const balanceBeforePayment =
        totalAmount - previouslyPaid;

    // Prevent overpayment.
    if (paymentAmount > balanceBeforePayment) {
        await client.query("ROLLBACK");

        return res.status(400).json({
            success: false,
            message: `Payment exceeds outstanding balance. Remaining balance is ${balanceBeforePayment}`,
        });
    }

    /*
    |--------------------------------------------------------------------------
    | SAVE PAYMENT
    |--------------------------------------------------------------------------
    */

    const paymentResult = await client.query(
        `
        INSERT INTO sale_payments (
            sale_id,
            amount,
            payment_method,
            transaction_reference,
            notes,
            received_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)

        RETURNING *
        `,
        [
            sale_id,
            paymentAmount,
            payment_method,
            transaction_reference || null,
            notes || null,
            req.user.userId,
        ]
    );

    /*
    |--------------------------------------------------------------------------
    | CALCULATE NEW PAYMENT STATUS
    |--------------------------------------------------------------------------
    */

    const newPaidAmount =
        previouslyPaid + paymentAmount;

    const remainingBalance =
        totalAmount - newPaidAmount;

    let paymentStatus = "UNPAID";

    if (newPaidAmount >= totalAmount) {
        paymentStatus = "PAID";
    } else if (newPaidAmount > 0) {
        paymentStatus = "PARTIAL";
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE SALE
    |--------------------------------------------------------------------------
    */

    await client.query(
        `
        UPDATE sales
        SET
            payment_status = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        `,
        [
            paymentStatus,
            sale_id,
        ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
        success: true,
        message: "Payment recorded successfully",

        payment: paymentResult.rows[0],

        sale_summary: {
            total_amount: totalAmount,
            amount_paid: newPaidAmount,
            balance: remainingBalance,
            payment_status: paymentStatus,
        },
        });

    } catch (error) {
        await client.query("ROLLBACK");

    console.error("Record payment error:", error);

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
| GET PAYMENT HISTORY FOR A SALE
|--------------------------------------------------------------------------
*/
export const getSalePayments = async (req, res) => {
    try {
        const { sale_id } = req.params;

    /*
    |--------------------------------------------------------------------------
    | SECURITY CHECK
    |--------------------------------------------------------------------------
    */

    const saleResult = await pool.query(
        `
        SELECT
            id,
            total_amount,
            payment_status

        FROM sales

        WHERE id = $1
            AND truck_id = $2
        `,
        [
            sale_id,
            req.user.truckId,
        ]
    );

    if (saleResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Sale not found for your truck",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | PAYMENT HISTORY
    |--------------------------------------------------------------------------
    */

    const paymentResult = await pool.query(
        `
        SELECT
            sp.id,
            sp.amount,
            sp.payment_method,
            sp.transaction_reference,
            sp.notes,
            sp.paid_at,
            u.name AS received_by_name

        FROM sale_payments sp

        JOIN users u
            ON u.id = sp.received_by

        WHERE sp.sale_id = $1

        ORDER BY sp.paid_at DESC
        `,
        [sale_id]
        );

        const totalPaidResult = await pool.query(
        `
        SELECT
            COALESCE(SUM(amount), 0) AS amount_paid

        FROM sale_payments

        WHERE sale_id = $1
        `,
        [sale_id]
    );

    const totalAmount =
        Number(saleResult.rows[0].total_amount);

    const amountPaid =
        Number(totalPaidResult.rows[0].amount_paid);

    return res.status(200).json({
        success: true,

        sale: {
            id: saleResult.rows[0].id,
            total_amount: totalAmount,
            amount_paid: amountPaid,
            balance: totalAmount - amountPaid,
            payment_status:
            saleResult.rows[0].payment_status,
        },

        payments: paymentResult.rows,
        });

    } catch (error) {
    console.error("Get sale payments error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
}
};