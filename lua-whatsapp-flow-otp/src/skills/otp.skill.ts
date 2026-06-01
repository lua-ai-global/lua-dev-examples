import { LuaSkill } from 'lua-cli';
import { SendVerificationFlowTool, VerifyOtpCodeTool } from './tools/OtpTools.js';

const otpSkill = new LuaSkill({
  name: 'whatsapp-flow-otp',
  description:
    'Sends a WhatsApp Flow that prompts the user for a verification code, then verifies the submitted code.',
  context: `
    Use this skill when the user wants to verify their account or you need to ask them for
    a one-time code.

    Two steps:

    1. Call \`send_verification_flow\` IMMEDIATELY when verification starts. The tool returns
       \`{ success: true, rawInsights: "..." }\` where \`rawInsights\` is a fenced \`::: flow\`
       block. You MUST output \`rawInsights\` VERBATIM — do not modify, reformat, split, or
       wrap it with any extra text. WhatsApp parses the block server-side and renders an
       interactive Flow CTA. Adding a prefix or paraphrasing it will prevent the CTA from
       rendering.

    2. When you receive a message starting with "User completed a WhatsApp Flow.", parse the
       submitted code from the "Submitted data" section and call \`verify_otp_code\` with it.
       Then briefly tell the user whether verification succeeded.

    Notes for the model:
    - The \`::: flow\` block uses newline-separated \`key=value\` fields. Never inline them on
      a single line — the parser splits on newlines.
    - Required fields: \`flow_id\`, \`flow_cta\`. Optional: \`body\`, \`header\`, \`footer\`,
      \`screen\`. The tool already provides them — you just output the string as-is.
  `,
  tools: [new SendVerificationFlowTool(), new VerifyOtpCodeTool()],
});

export default otpSkill;
