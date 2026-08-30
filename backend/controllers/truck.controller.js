// controllers/truck.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE TRUCK
|--------------------------------------------------------------------------
*/
export const createTruck = async (req, res) => {
    try {
        const {
        name,
        registration_number,
        description,
    } = req.body;

    // Truck name is required.
    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Truck name is required",
        });
    }

    // If a registration number is provided,
    // make sure another truck does not already use it.
    if (registration_number) {
        const existingTruck = await pool.query(
            `
            SELECT id
            FROM trucks
            WHERE registration_number = $1
            `,
            [registration_number]
        );

        if (existingTruck.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: "A truck with this registration number already exists",
            });
        }
    }

    const result = await pool.query(
        `
        INSERT INTO trucks (
            name,
            registration_number,
            description
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
            name,
            registration_number || null,
            description || null,
        ]
    );

    return res.status(201).json({
        success: true,
        message: "Truck created successfully",
        truck: result.rows[0],
        });
    } catch (error) {
        console.error("Create truck error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ALL TRUCKS
|--------------------------------------------------------------------------
*/
export const getTrucks = async (req, res) => {
    try {
        const result = await pool.query(
        `
        SELECT *
        FROM trucks
        ORDER BY created_at DESC
        `
    );

    return res.status(200).json({
        success: true,
        count: result.rows.length,
        trucks: result.rows,
    });
    } catch (error) {
        console.error("Get trucks error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ONE TRUCK
|--------------------------------------------------------------------------
*/
export const getTruckById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
        `
        SELECT *
        FROM trucks
        WHERE id = $1
        `,
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Truck not found",
        });
    }

        return res.status(200).json({
            success: true,
            truck: result.rows[0],
        });
    } catch (error) {
        console.error("Get truck error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| UPDATE TRUCK
|--------------------------------------------------------------------------
*/
export const updateTruck = async (req, res) => {
    try {
        const { id } = req.params;

        const {
        name,
        registration_number,
        description,
        status,
    } = req.body;

    const result = await pool.query(
        `
        UPDATE trucks
        SET
            name = COALESCE($1, name),
            registration_number = COALESCE($2, registration_number),
            description = COALESCE($3, description),
            status = COALESCE($4, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
        `,
        [
            name,
            registration_number,
            description,
            status,
            id,
        ]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Truck not found",
        });
    }

        return res.status(200).json({
            success: true,
            message: "Truck updated successfully",
            truck: result.rows[0],
        });
    } catch (error) {
        console.error("Update truck error:", error);

    // PostgreSQL unique constraint error.
    if (error.code === "23505") {
        return res.status(409).json({
            success: false,
            message: "Truck registration number already exists",
        });
    }

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| DELETE TRUCK
|--------------------------------------------------------------------------
| For now we allow hard delete.
| Later, once inventory/sales are linked to trucks,
| we will normally set the truck to INACTIVE instead.
|--------------------------------------------------------------------------
*/
export const deleteTruck = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
        `
        DELETE FROM trucks
        WHERE id = $1
        RETURNING id, name, registration_number
        `,
        [id]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Truck not found",
        });
    }

        return res.status(200).json({
            success: true,
            message: "Truck deleted successfully",
            truck: result.rows[0],
        });
    } catch (error) {
        console.error("Delete truck error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};