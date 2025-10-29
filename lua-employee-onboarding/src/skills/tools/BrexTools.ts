import BrexService from "@/src/services/BrexService";
import { LuaTool, env } from "lua-cli";
import { z } from "zod";

/**
 * Create Brex User Tool
 * 
 * Creates a new user in the Brex system as part of employee onboarding.
 * This should typically be called before registering bank account details.
 */
export class CreateBrexUserTool implements LuaTool {
  name = "create_brex_user";
  description = "Create a new employee user in the Brex system. This should be done before registering bank details. Returns a user ID needed for bank account registration.";

  inputSchema = z.object({
    email: z.string().email().describe("Employee's work email address"),
    firstName: z.string().min(1).describe("Employee's first name"),
    lastName: z.string().min(1).describe("Employee's last name"),
    departmentId: z.string().optional().describe("Department ID in Brex (optional)"),
    managerId: z.string().optional().describe("Manager's user ID in Brex (optional)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const brexApiToken = env("BREX_API_TOKEN");
      
      if (!brexApiToken) {
        return {
          success: false,
          error: "BREX_API_TOKEN not found in environment variables. Please configure your Brex API credentials.",
        };
      }

      const brexService = new BrexService(brexApiToken);
      const result = await brexService.createUser({
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        departmentId: input.departmentId,
        managerId: input.managerId,
      });

      if (result.success) {
        return {
          success: true,
          message: result.message,
          userId: result.userId,
          userDetails: {
            email: input.email,
            name: `${input.firstName} ${input.lastName}`,
            department: input.departmentId || 'Not assigned',
          },
          // Return the userId - it's needed for bank account registration
          nextSteps: "Use this userId to register the employee's bank account details.",
        };
      } else {
        return {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        };
      }
    } catch (error: any) {
      console.error("Create Brex User Error:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred while creating the Brex user.",
      };
    }
  }
}

/**
 * Verify Bank Account Tool
 * 
 * Verifies bank account details before registration to ensure accuracy.
 * This helps prevent errors and failed transfers.
 */
export class VerifyBankAccountTool implements LuaTool {
  name = "verify_bank_account";
  description = "Verify bank account routing and account numbers before registration. Use this to validate banking details and get the bank name.";

  inputSchema = z.object({
    accountNumber: z.string().min(4).max(17).describe("Bank account number to verify"),
    routingNumber: z.string().length(9).describe("9-digit ABA routing number to verify"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const brexApiToken = env("BREX_API_TOKEN");
      
      if (!brexApiToken) {
        return {
          success: false,
          error: "BREX_API_TOKEN not found in environment variables.",
        };
      }

      // Basic validation
      if (!/^\d{9}$/.test(input.routingNumber)) {
        return {
          success: false,
          error: "Invalid routing number format. Must be exactly 9 digits.",
        };
      }

      const brexService = new BrexService(brexApiToken);
      const result = await brexService.verifyBankAccount({
        accountNumber: input.accountNumber,
        routingNumber: input.routingNumber,
      });

      if (result.success) {
        return {
          success: true,
          verified: result.verified,
          bankName: result.bankName,
          message: result.message,
          // Return only last 4 digits for security
          accountInfo: {
            lastFourDigits: input.accountNumber.slice(-4),
            routingNumber: input.routingNumber,
          },
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error: any) {
      console.error("Verify Bank Account Error:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred during verification.",
      };
    }
  }
}

/**
 * Register Bank Account Tool
 * 
 * Registers a new hire's bank account information with Brex for ACH transfers.
 * All data is sent directly to Brex and not stored locally.
 */
export class RegisterBankAccountTool implements LuaTool {
  name = "register_bank_account";
  description = "Register employee bank account information with Brex for direct deposit and payments. Requires all banking details for ACH transfers.";

  inputSchema = z.object({
    userId: z.string().describe("Brex user ID for the employee"),
    employeeName: z.string().describe("Full name of the employee"),
    accountHolderName: z.string().describe("Name on the bank account (must match legal name)"),
    accountNumber: z.string().min(4).max(17).describe("Bank account number"),
    routingNumber: z.string().length(9).describe("9-digit ABA routing number"),
    accountType: z.enum(['CHECKING', 'SAVINGS']).describe("Type of bank account"),
    bankName: z.string().optional().describe("Name of the bank (optional but recommended)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const brexApiToken = env("BREX_API_TOKEN");
      
      if (!brexApiToken) {
        return {
          success: false,
          error: "BREX_API_TOKEN not found in environment variables. Please configure your Brex API credentials.",
        };
      }

      // Validate routing number format (basic check)
      if (!/^\d{9}$/.test(input.routingNumber)) {
        return {
          success: false,
          error: "Invalid routing number format. Must be exactly 9 digits.",
        };
      }

      // Validate account number (basic check)
      if (!/^\d+$/.test(input.accountNumber)) {
        return {
          success: false,
          error: "Invalid account number format. Must contain only digits.",
        };
      }

      const brexService = new BrexService(brexApiToken);
      const result = await brexService.registerBankAccount({
        userId: input.userId,
        employeeName: input.employeeName,
        accountHolderName: input.accountHolderName,
        accountNumber: input.accountNumber,
        routingNumber: input.routingNumber,
        accountType: input.accountType,
        bankName: input.bankName,
      });

      if (result.success) {
        return {
          success: true,
          message: result.message,
          accountId: result.accountId,
          status: result.status,
          data: {
            employeeName: input.employeeName,
            accountType: input.accountType,
            bankName: input.bankName || 'Not provided',
            // Never return sensitive data
            lastFourDigits: input.accountNumber.slice(-4),
          },
        };
      } else {
        return {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        };
      }
    } catch (error: any) {
      console.error("Register Bank Account Error:", error);
      return {
        success: false,
        error: error.message || "An unexpected error occurred while registering the bank account.",
      };
    }
  }
}

