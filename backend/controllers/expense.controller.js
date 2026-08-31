// controllers/expense.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE TRUCK EXPENSE
|--------------------------------------------------------------------------
| The logged-in salesperson records an expense against their assigned truck.
|--------------------------------------------------------------------------
*/
export const createExpense = async (req, res) => {
    try {
        const {
        category,
        amount,
        description,
        expense_date,
    } = req.body;

    // Salesperson must have an assigned truck.
    if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
    }

    if (!category || !category.trim()) {
        return res.status(400).json({
            success: false,
            message: "Expense category is required",
        });
    }

    const expenseAmount = Number(amount);

    if (
        !Number.isFinite(expenseAmount) ||
        expenseAmount <= 0
        ) {
        return res.status(400).json({
            success: false,
            message: "A valid expense amount is required",
        });
    }

    const result = await pool.query(
        `
        INSERT INTO truck_expenses (
            truck_id,
            salesperson_id,
            expense_date,
            category,
            amount,
            description
        )
        VALUES (
            $1,
            $2,
            COALESCE($3, CURRENT_DATE),
            $4,
            $5,
            $6
        )
        RETURNING *
        `,
        [
            req.user.truckId,
            req.user.userId,
            expense_date || null,
            category.trim(),
            expenseAmount,
            description || null,
        ]
    );

    return res.status(201).json({
        success: true,
        message: "Expense recorded successfully",
        expense: result.rows[0],
    });

    } catch (error) {
        console.error("Create expense error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET MY TRUCK EXPENSES
|--------------------------------------------------------------------------
*/
export const getMyExpenses = async (req, res) => {
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
            id,
            expense_date,
            category,
            amount,
            description,
            created_at

        FROM truck_expenses

        WHERE truck_id = $1
            AND salesperson_id = $2

        ORDER BY expense_date DESC, created_at DESC
        `,
        [
            req.user.truckId,
            req.user.userId,
        ]
    );

    return res.status(200).json({
        success: true,
        count: result.rows.length,
        expenses: result.rows,
    });

    } catch (error) {
    console.error("Get expenses error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
  }
};


/*
|--------------------------------------------------------------------------
| GET TODAY'S EXPENSE SUMMARY
|--------------------------------------------------------------------------
*/
export const getTodayExpenseSummary = async (req, res) => {
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
            COUNT(*) AS expense_count,

            COALESCE(
            SUM(amount),
            0
            ) AS total_expenses

        FROM truck_expenses

        WHERE truck_id = $1
            AND salesperson_id = $2
            AND expense_date = CURRENT_DATE
        `,
        [
            req.user.truckId,
            req.user.userId,
        ]
    );

    return res.status(200).json({
        success: true,
        summary: result.rows[0],
    });

    } catch (error) {
    console.error("Get expense summary error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};