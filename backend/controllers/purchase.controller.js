// controllers/purchase.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE PURCHASE
|--------------------------------------------------------------------------
|
| Flow:
|
| Supplier
|    ↓
| Purchase
|    ↓
| Purchase Items
|    ↓
| Store Inventory increases
|    ↓
| Stock Movement is recorded
|
| Everything runs inside ONE PostgreSQL transaction.
|--------------------------------------------------------------------------
*/
export const createPurchase = async (req, res) => {
    // Get a dedicated PostgreSQL client because we need a transaction.
    const client = await pool.connect();

    try {
        const {
        supplier_id,
        purchase_date,
        payment_status,
        notes,
        items,
        } = req.body;

    /*
    |--------------------------------------------------------------------------
    | BASIC VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!supplier_id) {
        return res.status(400).json({
            success: false,
            message: "Supplier is required",
        });
    }

        if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Purchase must contain at least one product",
        });
    }

    const allowedPaymentStatuses = [
        "PAID",
        "PARTIAL",
        "UNPAID",
    ];

    if (
        payment_status &&
        !allowedPaymentStatuses.includes(payment_status)
        ) {
        return res.status(400).json({
            success: false,
            message: "Invalid payment status",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE PURCHASE ITEMS
    |--------------------------------------------------------------------------
    */

    for (const item of items) {
        if (
            !item.product_id ||
            !Number.isInteger(Number(item.quantity)) ||
            Number(item.quantity) <= 0 ||
            item.buying_price === undefined ||
            Number(item.buying_price) < 0
        ) {
            return res.status(400).json({
            success: false,
            message:
                "Each item must contain a valid product_id, quantity and buying_price",
            });
        }
    }

    /*
    |--------------------------------------------------------------------------
    | START DATABASE TRANSACTION
    |--------------------------------------------------------------------------
    */

    await client.query("BEGIN");

    /*
    |--------------------------------------------------------------------------
    | CHECK SUPPLIER
    |--------------------------------------------------------------------------
    */

    const supplierResult = await client.query(
        `
        SELECT id, name
        FROM suppliers
        WHERE id = $1
            AND status = 'ACTIVE'
        `,
        [supplier_id]
        );

        if (supplierResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
            success: false,
            message: "Active supplier not found",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK PRODUCTS + CALCULATE TOTAL
    |--------------------------------------------------------------------------
    */

    let totalAmount = 0;

    for (const item of items) {
        const productResult = await client.query(
            `
            SELECT id, name
            FROM products
            WHERE id = $1
            AND status = 'ACTIVE'
            `,
            [item.product_id]
        );

        if (productResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
            success: false,
            message: `Active product with ID ${item.product_id} not found`,
            });
        }

        const subtotal =
            Number(item.quantity) *
            Number(item.buying_price);

        totalAmount += subtotal;
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PURCHASE HEADER
    |--------------------------------------------------------------------------
    |
    | req.user.userId comes from our JWT authentication middleware.
    |--------------------------------------------------------------------------
    */

    const purchaseResult = await client.query(
        `
        INSERT INTO purchases (
            supplier_id,
            purchase_date,
            total_amount,
            payment_status,
            notes,
            created_by
        )
        VALUES (
            $1,
            COALESCE($2, CURRENT_DATE),
            $3,
            $4,
            $5,
            $6
        )
        RETURNING *
        `,
        [
            supplier_id,
            purchase_date || null,
            totalAmount,
            payment_status || "UNPAID",
            notes || null,
            req.user.userId,
        ]
    );

    const purchase = purchaseResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | PROCESS EACH PURCHASE ITEM
    |--------------------------------------------------------------------------
    */

    for (const item of items) {
        const quantity = Number(item.quantity);
        const buyingPrice = Number(item.buying_price);

        const subtotal = quantity * buyingPrice;

        // 1. Save the purchase item.
        await client.query(
            `
            INSERT INTO purchase_items (
            purchase_id,
            product_id,
            quantity,
            buying_price,
            subtotal
            )
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
            purchase.id,
            item.product_id,
            quantity,
            buyingPrice,
            subtotal,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | 2. UPDATE STORE INVENTORY
    |--------------------------------------------------------------------------
    |
    | If the product isn't already in inventory:
    |     INSERT it.
    |
    | If it already exists:
    |     ADD the purchased quantity.
    |--------------------------------------------------------------------------
    */

        await client.query(
            `
            INSERT INTO store_inventory (
            product_id,
            quantity
            )
            VALUES ($1, $2)

            ON CONFLICT (product_id)
            DO UPDATE SET
            quantity =
                store_inventory.quantity + EXCLUDED.quantity,

            updated_at = CURRENT_TIMESTAMP
            `,
            [
            item.product_id,
            quantity,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | 3. RECORD STOCK MOVEMENT
    |--------------------------------------------------------------------------
    */

        await client.query(
            `
            INSERT INTO stock_movements (
            product_id,
            movement_type,
            quantity,
            reference_type,
            reference_id,
            notes,
            created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
            item.product_id,
            "PURCHASE_IN",
            quantity,
            "PURCHASE",
            purchase.id,
            `Stock received from supplier ${supplierResult.rows[0].name}`,
            req.user.userId,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    |
    | Only now do we permanently save everything.
    |--------------------------------------------------------------------------
    */

    await client.query("COMMIT");

        return res.status(201).json({
        success: true,
        message:
            "Purchase created and store inventory updated successfully",
        purchase,
        });

    } catch (error) {
        // Undo ALL changes if anything fails.
        await client.query("ROLLBACK");

        console.error("Create purchase error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });

    } finally {
        // Always return the connection to the PostgreSQL pool.
        client.release();
    }
};

/*
|--------------------------------------------------------------------------
| GET ALL PURCHASES
|--------------------------------------------------------------------------
*/
export const getPurchases = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            p.id,
            p.purchase_date,
            p.total_amount,
            p.payment_status,
            p.notes,
            p.created_at,

            s.id AS supplier_id,
            s.name AS supplier_name,

            u.name AS created_by_name

        FROM purchases p

        JOIN suppliers s
            ON s.id = p.supplier_id

        JOIN users u
            ON u.id = p.created_by

        ORDER BY p.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            purchases: result.rows,
        });

    } catch (error) {
        console.error("Get purchases error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


    /*
    |--------------------------------------------------------------------------
    | GET PURCHASE DETAILS
    |--------------------------------------------------------------------------
    */
export const getPurchaseById = async (req, res) => {
    try {
        const { id } = req.params;

    // Get purchase header.
    const purchaseResult = await pool.query(
        `
        SELECT
            p.*,
            s.name AS supplier_name,
            s.phone AS supplier_phone,
            s.location AS supplier_location,
            u.name AS created_by_name

        FROM purchases p

        JOIN suppliers s
            ON s.id = p.supplier_id

        JOIN users u
            ON u.id = p.created_by

        WHERE p.id = $1
        `,
        [id]
        );

        if (purchaseResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Purchase not found",
        });
        }

    // Get all products belonging to this purchase.
    const itemsResult = await pool.query(
        `
        SELECT
            pi.id,
            pi.product_id,
            pr.name AS product_name,
            pr.sku,
            pr.unit,
            pi.quantity,
            pi.buying_price,
            pi.subtotal

        FROM purchase_items pi

        JOIN products pr
            ON pr.id = pi.product_id

        WHERE pi.purchase_id = $1

        ORDER BY pi.id
        `,
        [id]
        );

        return res.status(200).json({
        success: true,
        purchase: {
            ...purchaseResult.rows[0],
            items: itemsResult.rows,
        },
        });

    } catch (error) {
        console.error("Get purchase error:", error);

        return res.status(500).json({
        success: false,
        message: "Internal server error",
        });
    }
};