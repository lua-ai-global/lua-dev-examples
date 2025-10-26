# Financial Services Onboarding

> KYC onboarding with document verification and compliance checks

## Overview

Complete financial services onboarding agent with **KYC (Know Your Customer)** verification using **Stripe Identity API** for document verification and **Lua Data API** for application management.

**What it does:**

* Guide users through onboarding journey
* Collect personal and financial information
* Upload and verify identity documents (ID, passport)
* Answer qualifying questions
* Perform compliance checks
* Create verified account

**APIs used:** Stripe Identity API (document verification) + Lua Data API (application tracking)

## Complete Implementation

### src/index.ts

```typescript
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
```

> **Note:** This demo now uses the **v3.0.0 pattern** with `LuaAgent`, including webhooks for Stripe Identity events, preprocessors for validation, and postprocessors for compliance disclaimers.

## Environment Setup

```bash
# .env
STRIPE_SECRET_KEY=sk_test_your_stripe_key
BANKING_API_KEY=your_banking_api_key (optional)
BANKING_API_URL=https://your-banking-api.com (optional)
```

## Testing

```bash
# Test individual tools
lua test

# Test conversation flow
lua chat
```

**Test conversation flow in sandbox mode:**

```
User: "I want to open an investment account"
AI: [Calls start_onboarding]
    "Great! Let's get you started. What's your email address?"

User: "john@example.com"
AI: "Perfect! I'll need some personal information. What's your full name?"

User: "John Doe, DOB 1990-01-15, SSN 123-45-6789..."
AI: [Calls collect_personal_info]
    "Information saved securely. Now I need to verify your identity. 
     Please upload a photo of your driver's license or passport."

User: [Uploads document]
AI: [Calls upload_document, then verify_identity]
    "✅ Identity verified! Now, let's answer some questions about your financial goals..."

User: "I make $75k/year, moderate experience, looking for retirement..."
AI: [Calls answer_qualifying_questions]
    "Based on your profile, you qualify! I recommend an IRA Account 
     and Investment Account. Shall we create your account?"

User: "Yes, create it"
AI: [Calls create_account]
    "🎉 Account created! Your account number is ****5678."
```

## Deployment

```bash
lua push
lua deploy
```

## Key Features

### Multi-Step Journey
Guided 7-step onboarding process with state management

### Document Verification
Stripe Identity API for ID verification

### Compliance Built-in
KYC/AML regulatory compliance patterns

### Risk Assessment
Automated suitability scoring system

### Secure by Design
Encrypted PII storage and secure handling

### Application Tracking
Real-time status checking with Lua Data

## Onboarding Journey

```
1. Start Application
   ↓
2. Collect Personal Info
   (Name, DOB, SSN, Address, Phone)
   ↓
3. Upload Documents
   (ID + Proof of Address)
   ↓
4. Identity Verification
   (Stripe Identity API)
   ↓
5. Qualifying Questions
   (Income, Experience, Risk Tolerance)
   ↓
6. Suitability Check
   (Automated scoring)
   ↓
7. Create Account
   ✅ Account Active
```

## Tool Details

### 1. Start Onboarding
- Creates new application in Lua Data
- Initializes workflow tracking
- Returns application ID

### 2. Collect Personal Info
- Gathers required personal data
- Encrypts sensitive information (SSN)
- Validates data completeness

### 3. Upload Document
- Accepts document image URLs
- Supports multiple document types
- Prepares for verification

### 4. Verify Identity
- Checks document verification status
- Returns verification results
- Updates application status

### 5. Answer Qualifying Questions
- Financial suitability assessment
- Risk profile calculation
- Product recommendations
- Compliance scoring

### 6. Create Account
- Final account creation
- Generates account number
- Returns login credentials

### 7. Check Status
- Real-time application tracking
- Progress visualization
- Next step guidance

## Compliance & Security

**⚠️ Important: This is a demonstration implementation**

For production deployment, you MUST:

- ✅ Implement proper encryption for PII (AES-256, KMS)
- ✅ Follow KYC/AML regulations (Bank Secrecy Act, Patriot Act)
- ✅ Maintain audit logs of all data access
- ✅ Use HTTPS only
- ✅ Implement data retention policies
- ✅ Follow GDPR/CCPA for data privacy
- ✅ Store documents in compliant storage (encrypted at rest)
- ✅ Conduct regular security audits
- ✅ Implement fraud detection
- ✅ Follow FinCEN guidelines

### Security Example

```typescript
// In production, use proper encryption
import crypto from 'crypto';

function encryptPII(data: string): string {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(env('ENCRYPTION_KEY'), 'hex');
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return JSON.stringify({
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  });
}
```

## Alternative Verification Services

This demo uses Stripe Identity, but you can integrate with:

**Onfido**
```typescript
const response = await fetch('https://api.onfido.com/v3/applicants', {
  method: 'POST',
  headers: {
    'Authorization': `Token token=${env('ONFIDO_API_KEY')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    first_name: input.firstName,
    last_name: input.lastName,
    email: input.email
  })
});
```

**Jumio**
```typescript
const response = await fetch('https://netverify.com/api/v4/initiate', {
  headers: {
    'Authorization': `Bearer ${env('JUMIO_API_TOKEN')}`
  }
});
```

**Plaid Identity**
```typescript
const response = await fetch('https://production.plaid.com/identity/get', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    client_id: env('PLAID_CLIENT_ID'),
    secret: env('PLAID_SECRET'),
    access_token: userAccessToken
  })
});
```

## Document Types Supported

### Government-Issued ID
- Driver's License (front and back)
- State ID
- Passport
- National ID card

**Verification checks:**
- Document authenticity
- Face match with selfie
- Data extraction (name, DOB, address)
- Expiration date validation

### Proof of Address
- Utility bill (within 3 months)
- Bank statement
- Lease agreement
- Government correspondence

**Verification checks:**
- Address matches ID
- Document date within acceptable range
- Name matches applicant

### Financial Documents (optional)
- Bank statements
- Tax returns (for high-value accounts)
- Pay stubs (employment verification)
- Investment account statements

**Used for:**
- Income verification
- Source of funds
- Net worth assessment

## Customization

### Add Selfie Verification

```typescript
export class CaptureSelfie Tool implements LuaTool {
  name = "capture_selfie";
  description = "Capture selfie for facial verification";
  
  inputSchema = z.object({
    applicationId: z.string(),
    selfieUrl: z.string().url()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const app = await Data.getEntry('onboarding_applications', input.applicationId);
    
    await Data.update('onboarding_applications', input.applicationId, {
      ...app.data,
      selfie: {
        url: input.selfieUrl,
        capturedAt: new Date().toISOString()
      }
    });
    
    return {
      success: true,
      message: "Selfie captured. Comparing with ID photo..."
    };
  }
}
```

### Add Fraud Detection

```typescript
// Check for suspicious activity
const fraudCheck = await fetch('https://fraud-api.com/check', {
  method: 'POST',
  body: JSON.stringify({
    email: app.data.email,
    ip_address: userIp,
    device_fingerprint: deviceId
  })
});

const fraudResult = await fraudCheck.json();

if (fraudResult.risk_score > 0.7) {
  await Data.update(applicationId, {
    ...app.data,
    status: 'fraud_review',
    flaggedForReview: true,
    flagReason: 'High fraud risk score'
  });
}
```

## Project Structure

```
lua-financial-services/
├── src/
│   ├── index.ts                          # Main skill definition
│   ├── seed.ts                           # Seed sample data
│   └── tools/
│       └── FinancialOnboardingTools.ts   # All 7 onboarding tools
├── lua.skill.yaml                        # Configuration
├── package.json                          # Dependencies
├── tsconfig.json                         # TypeScript config
├── .env                                  # API keys
└── README.md                             # This file
```

## Production Considerations

### Data Retention
- Keep applications for 7 years (regulatory requirement)
- Implement automated data deletion for rejected applications
- Archive completed applications to cold storage

### Audit Logging
```typescript
await Data.create('audit_logs', {
  action: 'document_uploaded',
  applicationId: input.applicationId,
  timestamp: new Date().toISOString(),
  ipAddress: userIp,
  userAgent: userAgent
});
```

### Compliance Monitoring
- Regular review of declined applications
- Monthly compliance reports
- Suspicious activity reporting (SAR)
- Customer due diligence (CDD)

## How It Works

1. **Application State Management**: Each application is stored in Lua Data with current step tracking
2. **Document Verification**: Documents are uploaded and verified through Stripe Identity
3. **Risk Scoring**: Automated suitability scoring based on financial profile
4. **Secure Storage**: PII is encrypted before storage
5. **Workflow Tracking**: Each step is validated before proceeding to next
6. **Account Creation**: Final account is created after all verifications pass

## Documentation

For complete API reference and guides, visit [Lua Documentation](https://docs.heylua.ai/)
