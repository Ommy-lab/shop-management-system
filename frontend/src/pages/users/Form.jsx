import EntityForm from '../../components/common/EntityForm';
import userService from '../../services/userService';

/*
 * User form fields.
 */
const fields = [
  {
    name: 'name',
    label: 'Full name',
    required: true,
  },
  {
    name: 'email',
    label: 'Email',
    type: 'email',
    required: true,
  },
  {
    name: 'phone',
    label: 'Phone',
    type: 'tel',
    required: true,
  },
  {
    name: 'role',
    label: 'Role',
    type: 'select',
    required: true,
    options: [
      {
        value: 'ADMIN',
        label: 'Admin',
      },
      {
        value: 'STOREKEEPER',
        label: 'Storekeeper',
      },
      {
        value: 'SALESPERSON',
        label: 'Salesperson',
      },
    ],
  },
  {
    name: 'password',
    label: 'Temporary password',
    type: 'password',
  },
  {
    name: 'status',
    label: 'Status',
    type: 'select',
    options: [
      {
        value: 'ACTIVE',
        label: 'Active',
      },
      {
        value: 'INACTIVE',
        label: 'Inactive',
      },
    ],
  },
];

/*
 * Keep initial values outside the component so the object
 * remains stable between renders.
 */
const initial = {
  status: 'ACTIVE',
};

export default function UserForm() {
  return (
    <EntityForm
      title="User"
      service={userService}
      fields={fields}
      backTo="/admin/users"

      /*
       * The users API returns:
       *
       * {
       *   success: true,
       *   users: [...]
       * }
       */
      dataKey="users"

      /*
       * Users do not have GET /api/users/:id.
       * EntityForm will therefore use GET /api/users
       * and find the requested user by ID.
       */
      loadFromList

      initial={initial}
    />
  );
}