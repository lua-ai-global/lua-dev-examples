import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { FinservService } from '../../services/FinservService';
import { EmploymentStatusValues, BusinessCategoryValues, LoanTermValues } from '../../models/enums';

export class UpdateEmploymentStatusTool implements LuaTool {
  name = 'update_employment_status';
  description =
    "Save employment status for a personal loan application. Call this after documents are uploaded. Advances the stage to income-details.";
  inputSchema = z.object({
    employmentStatus: z
      .enum(EmploymentStatusValues)
      .describe("The applicant's current employment status"),
    employerName: z
      .string()
      .optional()
      .describe('Name of employer (required if status is employed)'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.updateEmploymentStatus(input);
  }
}

export class UpdateIncomeDetailsTool implements LuaTool {
  name = 'update_income_details';
  description =
    "Save monthly income and loan purpose for a personal loan application. Call this after employment status is recorded. Advances to loan-quote stage.";
  inputSchema = z.object({
    monthlyIncome: z
      .number()
      .positive()
      .describe("Applicant's net monthly income in their local currency"),
    purpose: z
      .string()
      .describe('What the loan will be used for, e.g. medical expenses, school fees, home improvement'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.updateIncomeDetails(input);
  }
}

export class UpdateBusinessDetailsTool implements LuaTool {
  name = 'update_business_details';
  description =
    "Save business name, category, and age for a business loan application. Call this after documents are uploaded. Advances to business-financials stage.";
  inputSchema = z.object({
    businessName: z
      .string()
      .describe('The registered or trading name of the business'),
    businessCategory: z
      .enum(BusinessCategoryValues)
      .describe('The industry or sector the business operates in'),
    businessAgeMonths: z
      .number()
      .int()
      .positive()
      .describe('How many months the business has been operating'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.updateBusinessDetails(input);
  }
}

export class UpdateBusinessFinancialsTool implements LuaTool {
  name = 'update_business_financials';
  description =
    "Save monthly revenue, employee count, and business address for a business loan application. Call this after business details are recorded. Advances to loan-quote stage.";
  inputSchema = z.object({
    monthlyRevenue: z
      .number()
      .positive()
      .describe("Average monthly revenue of the business in local currency"),
    employeeCount: z
      .number()
      .int()
      .nonnegative()
      .describe('Number of employees (include owner; use 1 for sole traders)'),
    businessAddress: z
      .string()
      .describe('Physical address or location of the business'),
    purpose: z
      .string()
      .optional()
      .describe('What the loan will be used for'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.updateBusinessFinancials(input);
  }
}

export class GetLoanQuoteTool implements LuaTool {
  name = 'get_loan_quote';
  description =
    "Generate a loan quote based on the requested amount and repayment term. Uses the country's configured interest rate. Returns total repayable amount, interest, and monthly instalment. Always present this quote to the user clearly before submitting.";
  inputSchema = z.object({
    requestedAmount: z
      .number()
      .positive()
      .describe('The loan amount requested in the user\'s local currency'),
    term: z
      .enum(LoanTermValues)
      .describe('The repayment period'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.getLoanQuote(input);
  }
}

export class CustomiseLoanQuoteTool implements LuaTool {
  name = 'customise_loan_quote';
  description =
    "Recalculate the loan quote with a different amount or term. Call this if the user wants to adjust their loan after seeing the initial quote.";
  inputSchema = z.object({
    requestedAmount: z
      .number()
      .positive()
      .describe('The revised loan amount in local currency'),
    term: z
      .enum(LoanTermValues)
      .describe('The revised repayment period'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.customiseLoanQuote(input);
  }
}

export class SubmitLoanApplicationTool implements LuaTool {
  name = 'submit_loan_application';
  description =
    "Submit the completed loan application. Only call this after presenting the full summary and loan quote to the user and they have explicitly agreed to the terms and conditions. Returns a reference number on success.";
  inputSchema = z.object({
    agreedToTerms: z
      .boolean()
      .describe(
        'Whether the user has explicitly confirmed they agree to the terms and conditions. Must be true to proceed.'
      ),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.submitApplication(input.agreedToTerms);
  }
}

export class RepayLoanTool implements LuaTool {
  name = 'repay_loan';
  description =
    'Mark the user\'s active loan as fully repaid. Use this when the user says they have repaid their loan or wants to settle it. Once repaid, the loan block on account deletion is lifted and the user is eligible to apply for new products.';
  inputSchema = z.object({});

  async execute(_input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.repayLoan();
  }
}
