// controllers/sale.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE TRUCK SALE
|--------------------------------------------------------------------------
| A salesperson:
| - must be assigned to a truck
| - can only sell to a customer belonging to that truck
| - can only sell stock available in that truck
| - truck inventory is reduced automatically
|--------------------------------------------------------------------------
*/
export const createSale = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
        customer_id,
        sale_date,
        notes,
        items,
    } = req.body;

    /*
    |--------------------------------------------------------------------------
    | BASIC VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
    }

    if (!customer_id) {
        return res.status(400).json({
            success: false,
            message: "Customer is required",
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Sale must contain at least one product",
        });
    }


    for (const item of items) {
        if (
            !item.product_id ||
            !Number.isInteger(Number(item.quantity)) ||
            Number(item.quantity) <= 0
        ) {
            return res.status(400).json({
                success: false,
                message: "Each item must have a valid product_id and quantity",
            });
        }
    }

    await client.query("BEGIN");

    /*
    |--------------------------------------------------------------------------
    | CHECK CUSTOMER
    |--------------------------------------------------------------------------
    | The customer must belong to the salesperson's assigned truck.
    |--------------------------------------------------------------------------
    */

    const customerResult = await client.query(
        `
        SELECT id, name, truck_id
        FROM customers
        WHERE id = $1
            AND truck_id = $2
            AND status = 'ACTIVE'
        `,
        [customer_id, req.user.truckId]
    );

    if (customerResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
            success: false,
            message: "Customer not found for your assigned truck",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE TRUCK STOCK + CALCULATE TOTAL
    |--------------------------------------------------------------------------
    */

    let totalAmount = 0;

    const validatedItems = [];

    for (const item of items) {
        const stockResult = await client.query(
            `
            SELECT
            ti.quantity,
            p.name,
            p.selling_price

            FROM truck_inventory ti

            JOIN products p
            ON p.id = ti.product_id

            WHERE ti.truck_id = $1
            AND ti.product_id = $2
            AND p.status = 'ACTIVE'

            FOR UPDATE
            `,
        [req.user.truckId, item.product_id]
    );

        if (stockResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: `Product ID ${item.product_id} is not available in your truck`,
            });
    }

    const stock = stockResult.rows[0];

    const availableQuantity = Number(stock.quantity);
    const requestedQuantity = Number(item.quantity);
    const sellingPrice = Number(stock.selling_price);

        if (availableQuantity < requestedQuantity) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    `Insufficient truck stock for ${stock.name}. ` +
                    `Available: ${availableQuantity}, requested: ${requestedQuantity}`,
            });
        }

      const subtotal = requestedQuantity * sellingPrice;

    totalAmount += subtotal;

    validatedItems.push({
        product_id: item.product_id,
        quantity: requestedQuantity,
        selling_price: sellingPrice,
        subtotal,
    });
}

    /*
    |--------------------------------------------------------------------------
    | CREATE SALE HEADER
    |--------------------------------------------------------------------------
    */

const saleResult = await client.query(
    `
    INSERT INTO sales (
        truck_id,
        customer_id,
        salesperson_id,
        sale_date,
        total_amount,
        payment_status,
        notes
    )
    VALUES (
        $1,
        $2,
        $3,
        COALESCE($4, CURRENT_DATE),
        $5,
        'UNPAID',
        $6
    )
      RETURNING *
    `,
    [
        req.user.truckId,
        customer_id,
        req.user.userId,
        sale_date || null,
        totalAmount,
        notes || null,
    ]
);

    const sale = saleResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | CREATE SALE ITEMS + REDUCE TRUCK STOCK
    |--------------------------------------------------------------------------
    */

    for (const item of validatedItems) {
        await client.query(
            `
            INSERT INTO sale_items (
            sale_id,
            product_id,
            quantity,
            selling_price,
            subtotal
            )
            VALUES ($1, $2, $3, $4, $5)
            `,
            [
            sale.id,
            item.product_id,
            item.quantity,
            item.selling_price,
            item.subtotal,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | REDUCE TRUCK INVENTORY
    |--------------------------------------------------------------------------
    */

        await client.query(
            `
            UPDATE truck_inventory
            SET
            quantity = quantity - $1,
            updated_at = CURRENT_TIMESTAMP
            WHERE truck_id = $2
            AND product_id = $3
            `,
            [
            item.quantity,
            req.user.truckId,
            item.product_id,
            ]
        );
    }

    await client.query("COMMIT");

    return res.status(201).json({
        success: true,
        message: "Sale created successfully",
        sale: {
            ...sale,
            items: validatedItems,
        },
    });

    } catch (error) {
        await client.query("ROLLBACK");

    console.error("Create sale error:", error);

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
| GET MY SALES
|--------------------------------------------------------------------------
| Salesperson only sees sales from their assigned truck.
|--------------------------------------------------------------------------
*/
export const getMySales = async (req, res) => {
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
            s.id,
            s.sale_date,
            s.total_amount,
            s.payment_status,
            s.notes,
            s.created_at,

            c.name AS customer_name,
            c.business_name

        FROM sales s

        JOIN customers c
            ON c.id = s.customer_id

        WHERE s.truck_id = $1
            AND s.salesperson_id = $2

        ORDER BY s.created_at DESC
        `,
        [
            req.user.truckId,
            req.user.userId,
        ]
    );

    return res.status(200).json({
        success: true,
        count: result.rows.length,
        sales: result.rows,
    });

    } catch (error) {
    console.error("Get my sales error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
    }
};


/*
|--------------------------------------------------------------------------
| GET ONE SALE
|--------------------------------------------------------------------------
*/
export const getSaleById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user.truckId) {
        return res.status(400).json({
            success: false,
            message: "You are not assigned to a truck",
        });
        }

        const saleResult = await pool.query(
        `
        SELECT
            s.*,
            c.name AS customer_name,
            c.business_name,
            c.phone,
            c.location

        FROM sales s

        JOIN customers c
            ON c.id = s.customer_id

        WHERE s.id = $1
            AND s.truck_id = $2
            AND s.salesperson_id = $3
        `,
        [
        id,
        req.user.truckId,
        req.user.userId,
        ]
        );

        if (saleResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Sale not found",
        });
    }

    const itemsResult = await pool.query(
        `
        SELECT
            si.id,
            si.product_id,
            p.name AS product_name,
            p.sku,
            p.unit,
            si.quantity,
            si.selling_price,
            si.subtotal

        FROM sale_items si

        JOIN products p
            ON p.id = si.product_id

        WHERE si.sale_id = $1

        ORDER BY si.id
        `,
        [id]
    );

    return res.status(200).json({
        success: true,
        sale: {
            ...saleResult.rows[0],
            items: itemsResult.rows,
        },
    });

    } catch (error) {
        console.error("Get sale error:", error);

    return res.status(500).json({
        success: false,
        message: "Internal server error",
    });
}
};