import { Link, useParams } from 'react-router-dom';
import RecordDetails from '../../components/common/RecordDetails';
import userService from '../../services/userService';

export default function UserDetails() {
  const { id } = useParams();

  return (
    <RecordDetails
      title="User"
      service={userService}
      dataKey="users"
      loadFromList
      backTo="/admin/users"
      editTo="/admin/users/:id/edit"
      fields={[
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
        },
        {
          // Backend returns "truck_name", not "assigned_truck_name".
          key: 'truck_name',
          label: 'Assigned truck',
        },
        {
          key: 'status',
          label: 'Status',
        },
      ]}
    >
      {() => (
        <div className="inline-actions">
          <Link
            className="btn btn--outline"
            to={`/admin/users/${id}/reset-password`}
          >
            Reset password
          </Link>

          <Link
            className="btn btn--outline"
            to={`/admin/users/${id}/assign-truck`}
          >
            Assign truck
          </Link>
        </div>
      )}
    </RecordDetails>
  );
}