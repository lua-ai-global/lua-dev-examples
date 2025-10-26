import { LuaAgent, LuaSkill, LuaWebhook, PreProcessor, PostProcessor, User, Data, env } from "lua-cli";
import {
  StartOnboardingTool,
  CollectPersonalInfoTool,
  UploadDocumentTool,
  VerifyIdentityTool,
  AnswerQualifyingQuestionsTool,
  CreateAccountTool,
  CheckOnboardingStatusTool
} from "./tools/FinancialOnboardingTools";

// Onboarding skill
const financialOnboardingSkill = new LuaSkill({
  name: "financial-onboarding",
  version: "1.0.0",
  description: "Financial services customer onboarding with KYC verification",
  context: `
    This skill guides customers through financial account onboarding.
    
    Onboarding Flow (in order):
    1. start_onboarding: Begin new application
    2. collect_personal_info: Gather basic information
    3. upload_document: Upload ID, passport, or proof of address
    4. verify_identity: Verify uploaded documents
    5. answer_qualifying_questions: Financial suitability assessment
    6. create_account: Complete account creation
    7. check_onboarding_status: Check application status
    
    Guidelines:
    - Be professional and reassuring about data security
    - Explain why each document is needed (regulatory compliance)
    - Never rush through identity verification steps
    - Clearly communicate what happens to uploaded documents
    - Follow KYC and AML regulations
    - Ensure GDPR/CCPA compliance
  `,
  tools: [
    new StartOnboardingTool(),
    new CollectPersonalInfoTool(),
    new UploadDocumentTool(),
    new VerifyIdentityTool(),
    new AnswerQualifyingQuestionsTool(),
    new CreateAccountTool(),
    new CheckOnboardingStatusTool()
  ]
});

// Stripe Identity webhook for verification results
const stripeIdentityWebhook = new LuaWebhook({
  name: 'stripe-identity-webhook',
  description: 'Handle Stripe Identity verification events',
  secret: env('STRIPE_WEBHOOK_SECRET'),
  execute: async (event: any) => {
    if (event.type === 'identity.verification_session.verified') {
      const user = await User.get();
      await user.send([{
        type: 'text',
        text: '✅ Identity verification successful! Proceeding with account creation...'
      }]);
    }
    return { received: true };
  }
});

// Information validation preprocessor
const validateInformationPreProcessor = new PreProcessor({
  name: 'validate-financial-info',
  description: 'Ensure required information is provided',
  execute: async (message: any, user: any) => {
    // Ensure user has started onboarding
    const applications = await Data.search('onboarding_applications', user.email, 1);
    if (applications.count === 0) {
      return {
        block: true,
        response: "Please start the onboarding process first by providing your email address."
      };
    }
    return { block: false };
  }
});

// Compliance disclaimer postprocessor
const complianceDisclaimerPostProcessor = new PostProcessor({
  name: 'compliance-disclaimer',
  description: 'Add regulatory disclaimers to responses',
  execute: async (response: any, user: any) => {
    return {
      modifiedResponse: response + 
        "\n\n_Banking services provided by our partner bank. FDIC insured. Member FDIC. Your information is encrypted and secure._"
    };
  }
});

// Configure agent (v3.0.0)
export const agent = new LuaAgent({
  name: "financial-onboarding-agent",
  
  persona: `You are a professional financial services onboarding specialist.
  
Your role:
- Guide customers through account opening process
- Collect required KYC information
- Verify identity documents
- Assess financial suitability
- Ensure regulatory compliance

Communication style:
- Professional and trustworthy
- Clear and reassuring
- Patient and thorough
- Transparent about data security
- Compliant with regulations

Compliance requirements:
- Follow KYC (Know Your Customer) procedures
- Adhere to AML (Anti-Money Laundering) regulations
- Ensure GDPR/CCPA compliance
- Verify identity before account creation
- Document all customer interactions

Best practices:
- Explain why each document is needed
- Reassure customers about data security
- Never rush through verification steps
- Clearly communicate processing times
- Provide next steps at each stage

Security reminders:
- All information is encrypted
- Documents are securely stored
- Compliance with banking regulations
- Data is never shared without consent`,

  welcomeMessage: "Welcome! I'm here to help you open your account securely and compliantly. This process typically takes 5-10 minutes. Shall we begin?",
  
  skills: [financialOnboardingSkill],
  webhooks: [stripeIdentityWebhook],
  preProcessors: [validateInformationPreProcessor],
  postProcessors: [complianceDisclaimerPostProcessor]
});
