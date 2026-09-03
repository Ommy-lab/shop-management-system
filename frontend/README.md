# Shop Management System Frontend

Production-oriented React frontend for the existing Node.js, Express, and PostgreSQL Shop Management System backend.

## Run locally

1. Ensure the backend is running at `http://localhost:4000`.
2. Copy `.env.example` to `.env` if `.env` is missing.
3. Run `npm install`.
4. Run `npm run dev`.

The configured API root is `http://localhost:4000/api`.

## Quality commands

- `npm run lint`
- `npm run build`

## Implemented role access

- `SUPER_ADMIN`: dashboard, users, products, suppliers, trucks, purchases, inventory, truck loading, reconciliations, reports, and profit/loss.
- `ADMIN`: dashboard and business management modules, excluding Super Admin user management.
- `STOREKEEPER`: dashboard, inventory, low stock, movements, truck loading, truck inventory, and stock events.
- `SALESPERSON`: dashboard, assigned truck inventory, private customers, sales, payments, debts, expenses, stock events, and reconciliation.

Frontend route guards and role-aware navigation improve the experience; the backend remains the security authority.

## API integration behavior

- All requests use the shared Axios instance in `src/services/api.js`.
- JWT is attached from local storage to authenticated requests.
- `GET /auth/me` restores sessions after refresh.
- A `401` clears the expired token and returns the user to sign-in.
- No mock API or fabricated business data is included.
- Collection responses support common envelopes such as raw arrays, `data`, `items`, `rows`, and the documented module name.

## Documented endpoint gaps handled honestly

The supplied API contract does not define:

- a global payments list endpoint;
- `GET /customers/:id`;
- `GET /expenses/:id`;
- a salesperson-specific single reconciliation details endpoint.

The interface does not invent those calls. It guides users back to the supported collection or parent-sale workflow. Dashboard and report charts render only when the backend returns chartable historical rows.

## Payload verification

The backend source and live response samples were not included with the requirements. Before deployment, compare the form payload field names—especially dynamic `items`, price fields, assigned-truck identifiers, dashboard statistics, and reconciliation totals—with the actual controller contracts. Endpoint paths match the supplied specification exactly.
