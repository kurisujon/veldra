import { Database } from './src/types/database'
type Fns = Database['public']['Functions'];
type Args = Fns['create_case_with_applicant']['Args'];
const x: Args = { p_first_name: '', p_last_name: '', p_date_of_birth: '' };
console.log("TS OK");
