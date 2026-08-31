// controllers/customer.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE CUSTOMER
|--------------------------------------------------------------------------
| Salespersons create customers for their assigned truck.
|--------------------------------------------------------------------------
*/
export const createCustomer = async (req, res) => {
    try {
        const {
        name,
        business_name,
        phone,
        location,
    } = req.body;

    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Customer name is required",
        });
    }

    // Salesperson must have a truck assigned.
    if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
    }

    const result = await pool.query(
        `
        INSERT INTO customers (
            truck_id,
            name,
            business_name,
            phone,
            location,
            created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
            req.user.truckId,
            name,
            business_name || null,
            phone || null,
            location || null,
            req.user.userId,
        ]
    );

    return res.status(201).json({
        success: true,
        message: "Customer created successfully",
        customer: result.rows[0],
    });
    } catch (error) {
        console.error("Create customer error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET MY CUSTOMERS
|--------------------------------------------------------------------------
| A salesperson only sees customers belonging to their truck.
|--------------------------------------------------------------------------
*/
export const getMyCustomers = async (req, res) => {
    try {
        if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
    }

    const result = await pool.query(
        `
        SELECT *
        FROM customers
        WHERE truck_id = $1
        ORDER BY created_at DESC
        `,
        [req.user.truckId]
    );

    return res.status(200).json({
        success: true,
        count: result.rows.length,
        customers: result.rows,
    });
    } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};