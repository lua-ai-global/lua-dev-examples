import { LuaSkill } from "lua-cli";
import {
  StartOnboardingTool,
  CollectPersonalInfoTool,
  UploadDocumentTool,
  VerifyIdentityTool,
  AnswerQualifyingQuestionsTool,
  CreateAccountTool,
  CheckOnboardingStatusTool
} from "./tools/FinancialOnboardingTools";

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

// Test cases for financial onboarding skill
const testCases = [
    { tool: "start_onboarding", email: "john@example.com", accountType: "individual" },
];

async function runTests() {
    console.log("🏦 Financial Onboarding Assistant - Running tests...\n");

    // Test onboarding flow
    for (const [index, testCase] of testCases.entries()) {
        try {
            console.log(`Test ${index + 1}: ${testCase.tool}`);
            const result = await financialOnboardingSkill.run(testCase);
            console.log("✅ Success:", JSON.stringify(result, null, 2));
        } catch (error: any) {
            console.log("❌ Error:", error.message);
        }
        console.log(""); // Empty line for readability
    }
}

async function main() {
    try {
        await runTests();
    } catch (error) {
        console.error("💥 Unexpected error:", error);
        process.exit(1);
    }
}

main().catch(console.error);
