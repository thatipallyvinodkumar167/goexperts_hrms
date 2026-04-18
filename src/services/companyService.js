import { hashPassword } from "../utils/hashPassword"


export const createCompanyService = async ({
    companyName,
    companyEmail,
    password,
     domain,
  password,
  adminName,
  adminEmail,
  createdById

}) => {
    //hashpassword
    const hashedPassword = await hashPassword(password);

    
}