// controllers/product.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
*/
export const createProduct = async (req, res) => {
    try {
        const {
        name,
        sku,
        unit,
        buying_price,
        selling_price,
        minimum_stock,
        description,
        } = req.body;

    // Validate required fields
    if (!name || !sku || !unit) {
        return res.status(400).json({
            success: false,
            message: "Name, SKU and unit are required",
        });
    }

    // Check if SKU already exists
    const existingProduct = await pool.query(
        "SELECT id FROM products WHERE sku = $1",
        [sku]
    );

    if (existingProduct.rows.length > 0) {
        return res.status(409).json({
            success: false,
            message: "A product with this SKU already exists",
        });
    }

    const result = await pool.query(
        `
        INSERT INTO products (
            name,
            sku,
            unit,
            buying_price,
            selling_price,
            minimum_stock,
            description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
        `,
        [
            name,
            sku,
            unit,
            buying_price || 0,
            selling_price || 0,
            minimum_stock || 0,
            description || null,
        ]
    );

        return res.status(201).json({
        success: true,
        message: "Product created successfully",
        product: result.rows[0],
        });
    } catch (error) {
        console.error("Create product error:", error);

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
    };


    /*
    |--------------------------------------------------------------------------
    | GET ALL PRODUCTS
    |--------------------------------------------------------------------------
    */
export const getProducts = async (req, res) => {
    try {
        const result = await pool.query(
        `
        SELECT *
        FROM products
        ORDER BY created_at DESC
        `
        );

        return res.status(200).json({
        success: true,
        count: result.rows.length,
        products: result.rows,
        });
    } catch (error) {
        console.error("Get products error:", error);

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
    };


    /*
    |--------------------------------------------------------------------------
    | GET ONE PRODUCT
    |--------------------------------------------------------------------------
    */
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
        "SELECT * FROM products WHERE id = $1",
        [id]
        );

        if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Product not found",
        });
        }

        return res.status(200).json({
        success: true,
        product: result.rows[0],
        });
    } catch (error) {
        console.error("Get product error:", error);

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
    };


    /*
    |--------------------------------------------------------------------------
    | UPDATE PRODUCT
    |--------------------------------------------------------------------------
    */
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const {
        name,
        sku,
        unit,
        buying_price,
        selling_price,
        minimum_stock,
        description,
        status,
        } = req.body;

        const result = await pool.query(
        `
        UPDATE products
        SET
            name = COALESCE($1, name),
            sku = COALESCE($2, sku),
            unit = COALESCE($3, unit),
            buying_price = COALESCE($4, buying_price),
            selling_price = COALESCE($5, selling_price),
            minimum_stock = COALESCE($6, minimum_stock),
            description = COALESCE($7, description),
            status = COALESCE($8, status),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $9
        RETURNING *
        `,
        [
            name,
            sku,
            unit,
            buying_price,
            selling_price,
            minimum_stock,
            description,
            status,
            id,
        ]
        );

        if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Product not found",
        });
        }

        return res.status(200).json({
        success: true,
        message: "Product updated successfully",
        product: result.rows[0],
        });
    } catch (error) {
        console.error("Update product error:", error);

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
    };


    /*
    |--------------------------------------------------------------------------
    | DELETE PRODUCT
    |--------------------------------------------------------------------------
    | For now this performs a real DELETE.
    | Later, if products already have purchase/sales history, we'll prefer
    | setting status to INACTIVE instead.
    |--------------------------------------------------------------------------
    */
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(
        "DELETE FROM products WHERE id = $1 RETURNING id, name, sku",
        [id]
        );

        if (result.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Product not found",
        });
        }

        return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
        product: result.rows[0],
        });
    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
    };