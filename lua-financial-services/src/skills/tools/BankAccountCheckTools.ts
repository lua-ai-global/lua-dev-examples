import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { FinservService } from '../../services/FinservService';

export class CheckBankAccountTool implements LuaTool {
  name = 'check_bank_account';
  description =
    'Check whether the user already has a bank account on file (either opened through this service or previously provided). Call this automatically when entering the bank-account-check stage for loan applications. Returns whether an account exists and what to do next.';
  inputSchema = z.object({});

  async execute(_input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.checkBankAccount();
  }
}

export class ProvideBankAccountNumberTool implements LuaTool {
  name = 'provide_bank_account_number';
  description =
    "Save the user's existing bank account number for loan disbursement. Call this when the user provides their own account number instead of opening a new account with us.";
  inputSchema = z.object({
    accountNumber: z
      .string()
      .min(5)
      .describe("The user's bank account number where the loan will be disbursed"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.provideBankAccountNumber(input.accountNumber);
  }
}

export class SwitchToOpenBankAccountTool implements LuaTool {
  name = 'switch_to_open_bank_account';
  description =
    "Switch the user's product to bank account opening when they don't have an account and want to open one before applying for a loan. This redirects them to the account opening flow first.";
  inputSchema = z.object({});

  async execute(_input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.switchToOpenBankAccount();
  }
}
