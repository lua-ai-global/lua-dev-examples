import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { FinservService } from '../../services/FinservService';
import { AccountTypeValues, EmploymentStatusValues } from '../../models/enums';

export class SelectAccountTypeTool implements LuaTool {
  name = 'select_account_type';
  description =
    "Record the type of bank account the user wants to open: savings, current, or business. Call this after documents have been uploaded for a bank-account application.";
  inputSchema = z.object({
    accountType: z
      .enum(AccountTypeValues)
      .describe(
        "The type of account: 'savings' for a basic savings account, 'current' for a transactional account, 'business' for a business account"
      ),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.selectAccountType(input.accountType);
  }
}

export class UpdateEmploymentDetailsTool implements LuaTool {
  name = 'update_employment_details';
  description =
    "Save employment and income details for a bank account application. Call this after account type is selected. Collects employment status, employer name (if applicable), monthly income, and optional initial deposit amount.";
  inputSchema = z.object({
    employmentStatus: z
      .enum(EmploymentStatusValues)
      .describe("The applicant's current employment status"),
    employerName: z
      .string()
      .optional()
      .describe('Name of the employer (required if employed)'),
    monthlyIncome: z
      .number()
      .positive()
      .describe("Applicant's monthly income in their local currency"),
    initialDepositAmount: z
      .number()
      .nonnegative()
      .optional()
      .describe('Amount the applicant plans to deposit when opening the account (optional)'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.updateEmploymentDetails(input);
  }
}

export class SubmitAccountApplicationTool implements LuaTool {
  name = 'submit_account_application';
  description =
    "Submit the completed bank account application. Only call this after presenting a full summary to the user and they have explicitly confirmed they agree to the terms and conditions. Returns a reference number on success.";
  inputSchema = z.object({
    agreedToTerms: z
      .boolean()
      .describe(
        'Whether the user has explicitly agreed to the terms and conditions. Must be true to proceed.'
      ),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.submitApplication(input.agreedToTerms);
  }
}
