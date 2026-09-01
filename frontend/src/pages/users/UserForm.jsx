import ResourceForm from '../../components/common/ResourceForm';
import { userService } from '../../services/userService';
export default function UserForm(){return <ResourceForm title="User" service={userService} fields={[{name:'name',label:'Name',required:true},{name:'email',label:'Email',type:'email',required:true},{name:'password',label:'Password',type:'password',required:false},{name:'role',label:'Role',type:'select',options:['ADMIN','STOREKEEPER','SALESPERSON'],required:true},{name:'status',label:'Status',type:'select',options:['ACTIVE','INACTIVE']}]} path="/admin/users"/>}
