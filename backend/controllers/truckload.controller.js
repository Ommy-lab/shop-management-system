// controllers/truckLoad.controller.js

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| LOAD PRODUCTS TO A TRUCK
|--------------------------------------------------------------------------
|
| Flow:
|
| Store Inventory
|      ↓
| Truck Load
|      ↓
| Truck Inventory increases
|      ↓
| Store Inventory decreases
|      ↓
| TRUCK_OUT stock movement recorded
|
| Everything is handled inside one PostgreSQL transaction.
|--------------------------------------------------------------------------
*/
export const loadTruck = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
        truck_id,
        load_date,
        notes,
        items,
        } = req.body;

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!truck_id) {
        return res.status(400).json({
            success: false,
            message: "Truck is required",
        });
    }

    if (!Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
            success: false,
            message: "Truck load must contain at least one product",
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
                message:
                    "Each item must contain a valid product_id and quantity",
            });
        }
    }

    /*
    |--------------------------------------------------------------------------
    | START TRANSACTION
    |--------------------------------------------------------------------------
    */

    await client.query("BEGIN");

    /*
    |--------------------------------------------------------------------------
    | CHECK TRUCK
    |--------------------------------------------------------------------------
    */

    const truckResult = await client.query(
        `
        SELECT id, name
        FROM trucks
        WHERE id = $1
            AND status = 'ACTIVE'
        `,
        [truck_id]
    );

    if (truckResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
            success: false,
            message: "Active truck not found",
        });
    }

    /*
    |--------------------------------------------------------------------------
    | CHECK STORE STOCK
    |--------------------------------------------------------------------------
    |
    | We validate every requested product before creating the load.
    |--------------------------------------------------------------------------
    */

    for (const item of items) {
        const inventoryResult = await client.query(
            `
            SELECT
            si.product_id,
            si.quantity,
            p.name AS product_name
            FROM store_inventory si

            JOIN products p
            ON p.id = si.product_id

            WHERE si.product_id = $1
            FOR UPDATE
            `,
            [item.product_id]
        );

        if (inventoryResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: `Product ID ${item.product_id} is not available in store inventory`,
            });
        }

        const currentStock =
            Number(inventoryResult.rows[0].quantity);

        const requestedQuantity =
            Number(item.quantity);

        if (currentStock < requestedQuantity) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message:
                    `Insufficient stock for ${inventoryResult.rows[0].product_name}. ` +
                    `Available: ${currentStock}, requested: ${requestedQuantity}`,
            });
        }
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE TRUCK LOAD
    |--------------------------------------------------------------------------
    */

    const loadResult = await client.query(
        `
        INSERT INTO truck_loads (
            truck_id,
            load_date,
            notes,
            created_by
        )
        VALUES (
            $1,
            COALESCE($2, CURRENT_DATE),
            $3,
            $4
        )
        RETURNING *
        `,
        [
            truck_id,
            load_date || null,
            notes || null,
            req.user.userId,
        ]
    );

    const truckLoad = loadResult.rows[0];

    /*
    |--------------------------------------------------------------------------
    | PROCESS LOAD ITEMS
    |--------------------------------------------------------------------------
    */

    for (const item of items) {
        const quantity = Number(item.quantity);

        // 1. Save the load item.
        await client.query(
            `
            INSERT INTO truck_load_items (
            truck_load_id,
            product_id,
            quantity
            )
            VALUES ($1, $2, $3)
            `,
            [
            truckLoad.id,
            item.product_id,
            quantity,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | 2. DECREASE STORE INVENTORY
    |--------------------------------------------------------------------------
    */

        await client.query(
            `
            UPDATE store_inventory
            SET
            quantity = quantity - $1,
            updated_at = CURRENT_TIMESTAMP
            WHERE product_id = $2
            `,
            [
            quantity,
            item.product_id,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | 3. INCREASE TRUCK INVENTORY
    |--------------------------------------------------------------------------
    |
    | If the product is not yet present in the truck inventory,
    | create it. Otherwise add to the existing quantity.
    |--------------------------------------------------------------------------
    */

        await client.query(
            `
            INSERT INTO truck_inventory (
            truck_id,
            product_id,
            quantity
            )
            VALUES ($1, $2, $3)

            ON CONFLICT (truck_id, product_id)
            DO UPDATE SET
            quantity =
                truck_inventory.quantity + EXCLUDED.quantity,

            updated_at = CURRENT_TIMESTAMP
            `,
            [
            truck_id,
            item.product_id,
            quantity,
            ]
        );

    /*
    |--------------------------------------------------------------------------
    | 4. RECORD STOCK MOVEMENT
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
            "TRUCK_OUT",
            quantity,
            "TRUCK_LOAD",
            truckLoad.id,
            `Loaded to ${truckResult.rows[0].name}`,
            req.user.userId,
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | COMMIT TRANSACTION
    |--------------------------------------------------------------------------
    */

    await client.query("COMMIT");

    return res.status(201).json({
        success: true,
        message: "Truck loaded successfully",
        truck_load: truckLoad,
    });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Load truck error:", error);

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
| GET TRUCK INVENTORY
|--------------------------------------------------------------------------
*/
export const getTruckInventory = async (req, res) => {
    try {
        const { truckId } = req.params;

        // Salespersons may only view the inventory of their assigned truck.
        if (
            req.user.role === "SALESPERSON" &&
            Number(truckId) !== Number(req.user.truckId)
        ) {
            return res.status(403).json({
                success: false,
                message: "You can only view your assigned truck inventory",
            });
        }

        const truckResult = await pool.query(
        `
        SELECT id, name, registration_number, status
        FROM trucks
        WHERE id = $1
        `,
        [truckId]
        );

        if (truckResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Truck not found",
        });
        }

        const inventoryResult = await pool.query(
        `
        SELECT
            ti.id,
            ti.truck_id,
            ti.product_id,
            p.name AS product_name,
            p.sku,
            p.unit,
            ti.quantity,
            p.selling_price,
            ti.updated_at

        FROM truck_inventory ti

        JOIN products p
            ON p.id = ti.product_id

        WHERE ti.truck_id = $1

        ORDER BY p.name ASC
        `,
        [truckId]
        );

    return res.status(200).json({
        success: true,
        truck: truckResult.rows[0],
        count: inventoryResult.rows.length,
        inventory: inventoryResult.rows,
    });

    } catch (error) {
        console.error("Get truck inventory error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ALL TRUCK LOADS
|--------------------------------------------------------------------------
*/
export const getTruckLoads = async (req, res) => {
    try {
        const result = await pool.query(`
        SELECT
            tl.id,
            tl.truck_id,
            t.name AS truck_name,
            t.registration_number,
            tl.load_date,
            tl.notes,
            u.name AS created_by_name,
            tl.created_at

        FROM truck_loads tl

        JOIN trucks t
            ON t.id = tl.truck_id

        JOIN users u
            ON u.id = tl.created_by

        ORDER BY tl.created_at DESC
        `);

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            loads: result.rows,
        });

    } catch (error) {
        console.error("Get truck loads error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ONE TRUCK LOAD
|--------------------------------------------------------------------------
*/
export const getTruckLoadById = async (req, res) => {
    try {
        const { id } = req.params;

        const loadResult = await pool.query(
        `
        SELECT
            tl.*,
            t.name AS truck_name,
            t.registration_number,
            u.name AS created_by_name

        FROM truck_loads tl

        JOIN trucks t
            ON t.id = tl.truck_id

        JOIN users u
            ON u.id = tl.created_by

        WHERE tl.id = $1
        `,
        [id]
        );

        if (loadResult.rows.length === 0) {
        return res.status(404).json({
            success: false,
            message: "Truck load not found",
        });
        }

        const itemsResult = await pool.query(
        `
        SELECT
            tli.id,
            tli.product_id,
            p.name AS product_name,
            p.sku,
            p.unit,
            tli.quantity

        FROM truck_load_items tli

        JOIN products p
            ON p.id = tli.product_id

        WHERE tli.truck_load_id = $1

        ORDER BY tli.id
        `,
        [id]
        );

        return res.status(200).json({
            success: true,
            truck_load: {
                ...loadResult.rows[0],
                items: itemsResult.rows,
        },
        });

    } catch (error) {
        console.error("Get truck load error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};