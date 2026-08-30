// controllers/supplier.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE SUPPLIER
|--------------------------------------------------------------------------
*/
export const createSupplier = async (req, res) => {
    try {
        const {
        name,
        phone,
        location,
        } = req.body;

    // Supplier name is the only required field for now.
    if (!name) {
        return res.status(400).json({
            success: false,
            message: "Supplier name is required",
        });
    }

    const result = await pool.query(
        `
        INSERT INTO suppliers (
            name,
            phone,
            location
        )
        VALUES ($1, $2, $3)
        RETURNING *
        `,
        [
            name,
            phone || null,
            location || null,
        ]
    );

    return res.status(201).json({
        success: true,
        message: "Supplier created successfully",
        supplier: result.rows[0],
    });
    } catch (error) {
        console.error("Create supplier error:", error);

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ALL SUPPLIERS
|--------------------------------------------------------------------------
*/
export const getSuppliers = async (req, res) => {
    try {
        const result = await pool.query(
        `
        SELECT *
        FROM suppliers
        ORDER BY created_at DESC
        `
    );

    return res.status(200).json({
        success: true,
        count: result.rows.length,
        suppliers: result.rows,
        });
    } catch (error) {
        console.error("Get suppliers error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ONE SUPPLIER
|--------------------------------------------------------------------------
*/
export const getSupplierById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
        `
        SELECT *
        FROM suppliers
        WHERE id = $1
        `,
        [id]
        );

    if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Supplier not found",
        });
    }

        return res.status(200).json({
            success: true,
            supplier: result.rows[0],
        });
    } catch (error) {
        console.error("Get supplier error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| UPDATE SUPPLIER
|--------------------------------------------------------------------------
*/
export const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const {
        name,
        phone,
        location,
        status,
        } = req.body;

        const result = await pool.query(
        `
        UPDATE suppliers
        SET
            name = COALESCE($1, name),
            phone = COALESCE($2, phone),
            location = COALESCE($3, location),
            status = COALESCE($4, status),
            updated_at = CURRENT_TIMESTAMP
            WHERE id = $5
            RETURNING *
            `,
            [
                name,
                phone,
                location,
                status,
                id,
            ]
    );

    if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Supplier not found",
        });
    }

        return res.status(200).json({
            success: true,
            message: "Supplier updated successfully",
            supplier: result.rows[0],
        });
    } catch (error) {
        console.error("Update supplier error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| DELETE SUPPLIER
|--------------------------------------------------------------------------
| For now we allow a hard delete.
| Once purchases reference suppliers, we'll normally prefer INACTIVE.
|--------------------------------------------------------------------------
*/
export const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
        `
        DELETE FROM suppliers
        WHERE id = $1
        RETURNING id, name
        `,
        [id]
        );

    if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Supplier not found",
        });
    }

        return res.status(200).json({
            success: true,
            message: "Supplier deleted successfully",
            supplier: result.rows[0],
        });
    } catch (error) {
        console.error("Delete supplier error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};