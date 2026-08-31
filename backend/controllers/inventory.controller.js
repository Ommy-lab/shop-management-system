// controllers/inventory.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| GET CURRENT STORE INVENTORY
|--------------------------------------------------------------------------
*/
export const getStoreInventory = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            si.id,
            si.product_id,
            p.name AS product_name,
            p.sku,
            p.unit,
            si.quantity,
            p.buying_price,
            p.selling_price,
            p.minimum_stock,

            -- Estimated inventory value based on the product buying price.
            (si.quantity * p.buying_price) AS stock_value,

            -- Simple low-stock indicator.
            CASE
            WHEN si.quantity <= p.minimum_stock THEN true
            ELSE false
            END AS is_low_stock,

            si.updated_at

        FROM store_inventory si

        JOIN products p
            ON p.id = si.product_id

        ORDER BY p.name ASC
        `);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            inventory: result.rows,
        });
    } catch (error) {
        console.error("Get store inventory error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET LOW STOCK PRODUCTS
|--------------------------------------------------------------------------
*/
export const getLowStockProducts = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            si.product_id,
            p.name AS product_name,
            p.sku,
            p.unit,
            si.quantity,
            p.minimum_stock

        FROM store_inventory si

        JOIN products p
            ON p.id = si.product_id

        WHERE si.quantity <= p.minimum_stock

        ORDER BY si.quantity ASC
        `);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            products: result.rows,
        });
    } catch (error) {
        console.error("Get low stock products error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET STORE STOCK SUMMARY
|--------------------------------------------------------------------------
*/
export const getStoreInventorySummary = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            COUNT(*) AS total_products,

            COALESCE(SUM(si.quantity), 0) AS total_units,

            COALESCE(
            SUM(si.quantity * p.buying_price),
            0
            ) AS total_stock_value,

            COUNT(*) FILTER (
            WHERE si.quantity <= p.minimum_stock
            ) AS low_stock_products

        FROM store_inventory si

        JOIN products p
            ON p.id = si.product_id
        `);

        return res.status(200).json({
            success: true,
            summary: result.rows[0],
        });
    } catch (error) {
        console.error("Get inventory summary error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET STOCK MOVEMENT HISTORY
|--------------------------------------------------------------------------
*/
export const getStockMovements = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            sm.id,
            sm.product_id,
            p.name AS product_name,
            p.sku,
            sm.movement_type,
            sm.quantity,
            sm.reference_type,
            sm.reference_id,
            sm.notes,

            u.name AS created_by_name,

            sm.created_at

        FROM stock_movements sm

        JOIN products p
            ON p.id = sm.product_id

        LEFT JOIN users u
            ON u.id = sm.created_by

        ORDER BY sm.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            movements: result.rows,
        });
    } catch (error) {
        console.error("Get stock movements error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET MOVEMENTS FOR ONE PRODUCT
|--------------------------------------------------------------------------
*/
export const getProductStockMovements = async (req, res) => {
    try {
        const { productId } = req.params;

        const result = await pool.query(
        `
        SELECT
            sm.id,
            sm.product_id,
            p.name AS product_name,
            sm.movement_type,
            sm.quantity,
            sm.reference_type,
            sm.reference_id,
            sm.notes,
            u.name AS created_by_name,
            sm.created_at

        FROM stock_movements sm

        JOIN products p
            ON p.id = sm.product_id

        LEFT JOIN users u
            ON u.id = sm.created_by

        WHERE sm.product_id = $1

        ORDER BY sm.created_at DESC
        `,
        [productId]
    );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            movements: result.rows,
        });
    } catch (error) {
        console.error("Get product movements error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};