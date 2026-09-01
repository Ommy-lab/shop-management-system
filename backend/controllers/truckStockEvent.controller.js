/*
|--------------------------------------------------------------------------
| controllers/truckStockEvent.controller.js
|--------------------------------------------------------------------------
*/

import pool from "../src/config/database.js";

/*
|--------------------------------------------------------------------------
| CREATE TRUCK STOCK EVENT
|--------------------------------------------------------------------------
|
| Supported events:
|
| RETURN  -> truck decreases + store increases
| DAMAGED -> truck decreases
| LOST    -> truck decreases
| EXPIRED -> truck decreases
|
|--------------------------------------------------------------------------
*/
export const createTruckStockEvent = async (req, res) => {
    const client = await pool.connect();

    try {
        const {
            event_type,
            event_date,
            notes,
            items,
        } = req.body;

        /*
        |--------------------------------------------------------------------------
        | CHECK TRUCK ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        if (!req.user.truckId) {
            return res.status(400).json({
                success: false,
                message: "You are not assigned to a truck",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATE EVENT TYPE
        |--------------------------------------------------------------------------
        */

        const allowedTypes = [
            "RETURN",
            "DAMAGED",
            "LOST",
            "EXPIRED",
        ];

        if (!allowedTypes.includes(event_type)) {
            return res.status(400).json({
                success: false,
                message: "Invalid truck stock event type",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | VALIDATE ITEMS
        |--------------------------------------------------------------------------
        */

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one product is required",
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
                        "Each item must have a valid product_id and quantity",
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
        | VALIDATE TRUCK INVENTORY + SNAPSHOT COST
        |--------------------------------------------------------------------------
        |
        | We store the current buying price at the moment the event happens.
        | This allows us to calculate the monetary value of:
        |
        | - damaged goods
        | - lost goods
        | - expired goods
        |
        | later in the profit/loss report.
        |--------------------------------------------------------------------------
        */

        const validatedItems = [];

        for (const item of items) {
            const inventoryResult = await client.query(
                `
                SELECT
                    ti.quantity,
                    p.name AS product_name,
                    p.buying_price

                FROM truck_inventory ti

                JOIN products p
                    ON p.id = ti.product_id

                WHERE ti.truck_id = $1
                    AND ti.product_id = $2

                FOR UPDATE
                `,
                [
                    req.user.truckId,
                    item.product_id,
                ]
            );

            if (inventoryResult.rows.length === 0) {
                await client.query("ROLLBACK");

                return res.status(404).json({
                    success: false,
                    message:
                        `Product ID ${item.product_id} ` +
                        `is not available in your truck`,
                });
            }

            const inventory =
                inventoryResult.rows[0];

            const available =
                Number(inventory.quantity);

            const requested =
                Number(item.quantity);

            /*
            |--------------------------------------------------------------------------
            | CHECK AVAILABLE QUANTITY
            |--------------------------------------------------------------------------
            */

            if (requested > available) {
                await client.query("ROLLBACK");

                return res.status(400).json({
                    success: false,
                    message:
                        `Insufficient truck stock for ` +
                        `${inventory.product_name}. ` +
                        `Available: ${available}, ` +
                        `requested: ${requested}`,
                });
            }

            /*
            |--------------------------------------------------------------------------
            | SNAPSHOT PRODUCT COST
            |--------------------------------------------------------------------------
            */

            const costPrice =
                Number(inventory.buying_price);

            const costSubtotal =
                requested * costPrice;

            /*
            |--------------------------------------------------------------------------
            | SAVE VALIDATED ITEM IN MEMORY
            |--------------------------------------------------------------------------
            */

            validatedItems.push({
                product_id: item.product_id,
                quantity: requested,
                cost_price: costPrice,
                cost_subtotal: costSubtotal,
            });
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE EVENT HEADER
        |--------------------------------------------------------------------------
        */

        const eventResult = await client.query(
            `
            INSERT INTO truck_stock_events (
                truck_id,
                event_type,
                event_date,
                notes,
                created_by
            )
            VALUES (
                $1,
                $2,
                COALESCE($3, CURRENT_DATE),
                $4,
                $5
            )
            RETURNING *
            `,
            [
                req.user.truckId,
                event_type,
                event_date || null,
                notes || null,
                req.user.userId,
            ]
        );

        const event =
            eventResult.rows[0];

        /*
        |--------------------------------------------------------------------------
        | PROCESS EVENT ITEMS
        |--------------------------------------------------------------------------
        */

        for (const item of validatedItems) {
            const quantity =
                item.quantity;

            /*
            |--------------------------------------------------------------------------
            | SAVE EVENT ITEM + COST SNAPSHOT
            |--------------------------------------------------------------------------
            */

            await client.query(
                `
                INSERT INTO truck_stock_event_items (
                    event_id,
                    product_id,
                    quantity,
                    cost_price,
                    cost_subtotal
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    $5
                )
                `,
                [
                    event.id,
                    item.product_id,
                    quantity,
                    item.cost_price,
                    item.cost_subtotal,
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | REDUCE TRUCK INVENTORY
            |--------------------------------------------------------------------------
            |
            | Every event removes the quantity from truck inventory:
            |
            | RETURN
            | DAMAGED
            | LOST
            | EXPIRED
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
                    quantity,
                    req.user.truckId,
                    item.product_id,
                ]
            );

            /*
            |--------------------------------------------------------------------------
            | USABLE RETURN
            |--------------------------------------------------------------------------
            |
            | A returned product is not a business loss.
            |
            | It leaves the truck but goes back into the main store.
            |--------------------------------------------------------------------------
            */

            if (event_type === "RETURN") {
                await client.query(
                    `
                    INSERT INTO store_inventory (
                        product_id,
                        quantity
                    )
                    VALUES (
                        $1,
                        $2
                    )

                    ON CONFLICT (product_id)

                    DO UPDATE SET
                        quantity =
                            store_inventory.quantity +
                            EXCLUDED.quantity,

                        updated_at =
                            CURRENT_TIMESTAMP
                    `,
                    [
                        item.product_id,
                        quantity,
                    ]
                );

                /*
                |--------------------------------------------------------------------------
                | CENTRAL STORE MOVEMENT
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
                    VALUES (
                        $1,
                        'TRUCK_RETURN',
                        $2,
                        'TRUCK_STOCK_EVENT',
                        $3,
                        $4,
                        $5
                    )
                    `,
                    [
                        item.product_id,
                        quantity,
                        event.id,
                        `Returned from truck ${req.user.truckId}`,
                        req.user.userId,
                    ]
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | COMMIT TRANSACTION
        |--------------------------------------------------------------------------
        */

        await client.query("COMMIT");

        return res.status(201).json({
            success: true,
            message:
                `${event_type} recorded successfully`,
            event: {
                ...event,

                /*
                |--------------------------------------------------------------------------
                | Return saved event items too.
                |--------------------------------------------------------------------------
                */
                items: validatedItems,
            },
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error(
            "Truck stock event error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
        });

    } finally {
        client.release();
    }
};


/*
|--------------------------------------------------------------------------
| GET MY TRUCK STOCK EVENTS
|--------------------------------------------------------------------------
*/
export const getMyTruckStockEvents = async (req, res) => {
    try {
        if (!req.user.truckId) {
            return res.status(400).json({
                success: false,
                message:
                    "You are not assigned to a truck",
            });
        }

        const result = await pool.query(
            `
            SELECT
                tse.id,
                tse.event_type,
                tse.event_date,
                tse.notes,
                tse.created_at,

                COUNT(tsei.id)
                    AS product_count,

                COALESCE(
                    SUM(tsei.quantity),
                    0
                ) AS total_quantity,

                /*
                |--------------------------------------------------------------------------
                | Total monetary value of the event.
                |--------------------------------------------------------------------------
                */
                COALESCE(
                    SUM(tsei.cost_subtotal),
                    0
                ) AS total_cost_value

            FROM truck_stock_events tse

            LEFT JOIN truck_stock_event_items tsei
                ON tsei.event_id = tse.id

            WHERE tse.truck_id = $1

            GROUP BY tse.id

            ORDER BY tse.created_at DESC
            `,
            [
                req.user.truckId,
            ]
        );

        return res.status(200).json({
            success: true,
            count: result.rows.length,
            events: result.rows,
        });

    } catch (error) {
        console.error(
            "Get truck stock events error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
        });
    }
};


/*
|--------------------------------------------------------------------------
| GET ONE TRUCK STOCK EVENT
|--------------------------------------------------------------------------
*/
export const getTruckStockEventById = async (req, res) => {
    try {
        const { id } = req.params;

        /*
        |--------------------------------------------------------------------------
        | CHECK TRUCK ASSIGNMENT
        |--------------------------------------------------------------------------
        */

        if (!req.user.truckId) {
            return res.status(400).json({
                success: false,
                message:
                    "You are not assigned to a truck",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | GET EVENT HEADER
        |--------------------------------------------------------------------------
        */

        const eventResult = await pool.query(
            `
            SELECT *
            FROM truck_stock_events

            WHERE id = $1
                AND truck_id = $2
            `,
            [
                id,
                req.user.truckId,
            ]
        );

        if (eventResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "Truck stock event not found",
            });
        }

        /*
        |--------------------------------------------------------------------------
        | GET EVENT ITEMS
        |--------------------------------------------------------------------------
        */

        const itemsResult = await pool.query(
            `
            SELECT
                tsei.id,
                tsei.product_id,

                p.name AS product_name,
                p.sku,
                p.unit,

                tsei.quantity,

                /*
                |--------------------------------------------------------------------------
                | Historical cost information.
                |--------------------------------------------------------------------------
                */
                tsei.cost_price,
                tsei.cost_subtotal

            FROM truck_stock_event_items tsei

            JOIN products p
                ON p.id = tsei.product_id

            WHERE tsei.event_id = $1

            ORDER BY tsei.id
            `,
            [id]
        );

        return res.status(200).json({
            success: true,

            event: {
                ...eventResult.rows[0],
                items: itemsResult.rows,
            },
        });

    } catch (error) {
        console.error(
            "Get truck stock event error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error",
        });
    }
};