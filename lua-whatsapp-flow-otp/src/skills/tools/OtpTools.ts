import { LuaTool, env } from 'lua-cli';
import { z } from 'zod';

/**
 * Returns a `::: flow` block as `rawInsights`. The agent's persona instructs the model
 * to output `rawInsights` verbatim — that puts the literal fenced block into the WhatsApp
 * reply, which the platform then parses and converts into an interactive Flow CTA via the
 * Meta Graph API.
 *
 * The fields MUST be newline-separated. A single-line variant
 * (`::: flow flow_id=1 flow_cta=Go body=Hi :::`) will not parse — the extractor splits on
 * newlines and runs a `key[:=]value` regex on each line. With everything on one line the
 * greedy regex captures the rest of the string into `flow_id`, leaving `flow_cta` unset and
 * the block is dropped.
 */
export class SendVerificationFlowTool implements LuaTool {
  name = 'send_verification_flow';
  description =
    'Send a WhatsApp Flow that asks the user to enter their verification code. Call this when verification starts. The agent must output the returned `rawInsights` verbatim.';
  inputSchema = z.object({});

  async execute(_input: z.infer<typeof this.inputSchema>) {
    const flowId = env('WHATSAPP_FLOW_ID');

    if (!flowId) {
      return {
        success: false,
        message:
          'WHATSAPP_FLOW_ID is not configured. Set it to the published Flow ID from WhatsApp Manager.',
      };
    }

    const rawInsights = [
      '::: flow',
      `flow_id=${flowId}`,
      'flow_cta=Enter Code',
      'body=Tap the button below to securely enter your verification code.',
      ':::',
    ].join('\n');

    return { success: true, rawInsights };
  }
}

/**
 * Verifies the code the user submitted via the Flow. In a real app this would check against
 * a record you created when the OTP was issued; here it just accepts any 6-digit code so the
 * example runs end-to-end.
 */
export class VerifyOtpCodeTool implements LuaTool {
  name = 'verify_otp_code';
  description =
    'Verify the OTP code submitted by the user. Call this after receiving a "User completed a WhatsApp Flow." message — pass the code field from the submitted data.';
  inputSchema = z.object({
    code: z.string().describe('The OTP code the user entered into the Flow form'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const ok = /^\d{6}$/.test(input.code);
    return ok
      ? { success: true, message: 'Verification successful.' }
      : { success: false, message: 'That code is not valid. Please request a new one.' };
  }
}
