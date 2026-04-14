import { LuaTool } from 'lua-cli';
import { z } from 'zod';
import { FinservService } from '../../services/FinservService';
import { ProductTypeValues } from '../../models/enums';

export class GetUserTool implements LuaTool {
  name = 'get_user_by_id';
  description =
    'Retrieve the current user state and determine which stage of the application they are in. Always call this first at the start of any conversation to know how to proceed.';
  inputSchema = z.object({});

  async execute(_input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.getUserById();
  }
}

export class LinkPhoneTool implements LuaTool {
  name = 'link_phone';
  description =
    "Register the user's phone number. This detects their country and loads the correct product availability, currency, and ID requirements. Call this as soon as the user provides their phone number.";
  inputSchema = z.object({
    phoneNumber: z
      .string()
      .describe("The user's phone number in international format, e.g. +256712345678"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.linkPhone(input.phoneNumber);
  }
}

export class SelectProductTool implements LuaTool {
  name = 'select_product';
  description =
    'Record which financial product the user wants to apply for. Must be called after the user selects a product from the available options.';
  inputSchema = z.object({
    product: z
      .enum(ProductTypeValues)
      .describe('The financial product the user has chosen'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.selectProduct(input.product);
  }
}

export class SendOtpTool implements LuaTool {
  name = 'send_otp';
  description =
    "Send a one-time password to the user's registered phone number for identity verification. Call this after the product is selected.";
  inputSchema = z.object({});

  async execute(_input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.sendOtp();
  }
}

export class VerifyOtpTool implements LuaTool {
  name = 'verify_otp';
  description =
    "Verify the OTP code entered by the user. Call this with the code the user provides after receiving their SMS.";
  inputSchema = z.object({
    code: z
      .string()
      .length(6)
      .describe('The 6-digit OTP code the user received on their phone'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.verifyOtp(input.code);
  }
}

export class DeleteAccountTool implements LuaTool {
  name = 'delete_account';
  description =
    'Permanently delete the user\'s account, profile, documents, and any pending applications. Cannot be used if the user has an active loan that has not yet been repaid. Always ask the user to explicitly confirm before calling this tool.';
  inputSchema = z.object({
    confirmed: z
      .boolean()
      .describe('Must be true — the user has explicitly confirmed they want to permanently delete their account'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    if (!input.confirmed) {
      return { status: false, message: 'Account deletion was not confirmed by the user.' };
    }
    const service = new FinservService();
    return service.deleteAccount();
  }
}

export class SetReferralSourceTool implements LuaTool {
  name = 'set_referral_source';
  description =
    'Record how the user heard about the service. Ask this towards the end of the application, before final submission.';
  inputSchema = z.object({
    source: z
      .enum([
        'Friend / Family',
        'Social media',
        'Radio / TV',
        'Bank branch',
        'Online search',
        'Other',
      ])
      .describe('How the user found out about the service'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.setReferralSource(input.source);
  }
}
