import { User } from '../schemas/userSchema';
import { Organization } from './interfaceOrganization';
export interface Event {
  id: string;
  name: string;
  payment: boolean;
  location: string;
  information: string;
  updates: string;
  dateAndTime: Date;
  userId: string;
  organizationId: string;
  user?: User;
  organization?: Organization;
}
