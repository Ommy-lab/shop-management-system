import EntityList from '../../components/common/EntityList';
import StatusBadge from '../../components/common/StatusBadge';
import userService from '../../services/userService';

export default function Users() {
  return (
    <EntityList
      title="Users"
      eyebrow="Super admin control"
      description="Create staff accounts, manage roles, and assign salespeople to trucks."
      service={userService}
      dataKey="users"
      searchFields={['name', 'email', 'phone', 'role']}
      addTo="/admin/users/new"
      detailBase="/admin/users"
      columns={[
        {
          key: 'name',
          label: 'Name',
        },
        {
          key: 'email',
          label: 'Email',
        },
        {
          key: 'phone',
          label: 'Phone',
        },
        {
          key: 'role',
          label: 'Role',
          render: (value) => value?.replaceAll('_', ' '),
        },
        {
          /*
           * The backend returns "truck_name".
           *
           * Example:
           * truck_name: "Truck 1"
           *
           * Do not use "assigned_truck_name" because
           * that field does not exist in the API response.
           */
          key: 'truck_name',
          label: 'Assigned truck',
        },
        {
          key: 'status',
          label: 'Status',
          render: (value) => <StatusBadge value={value} />,
        },
      ]}
    />
  );
}