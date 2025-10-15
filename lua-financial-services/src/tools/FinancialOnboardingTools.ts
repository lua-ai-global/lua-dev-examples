import { LuaTool, Data, env } from "lua-cli";
import { z } from "zod";

// 1. Start Onboarding
export class StartOnboardingTool implements LuaTool {
  name = "start_onboarding";
  description = "Begin a new account onboarding application";
  
  inputSchema = z.object({
    email: z.string().email().describe("Applicant's email address"),
    accountType: z.enum(['individual', 'business']).describe("Type of account")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Create onboarding application
    const application = await Data.create('onboarding_applications', {
      email: input.email,
      accountType: input.accountType,
      status: 'started',
      currentStep: 'personal_info',
      createdAt: new Date().toISOString(),
      completedSteps: []
    }, input.email);
    
    return {
      applicationId: application.id,
      accountType: input.accountType,
      nextStep: 'personal_info',
      message: "Application started! Let's begin by collecting your personal information.",
      estimatedTime: "5-10 minutes to complete"
    };
  }
}

// 2. Collect Personal Information
export class CollectPersonalInfoTool implements LuaTool {
  name = "collect_personal_info";
  description = "Collect applicant's personal information";
  
  inputSchema = z.object({
    applicationId: z.string(),
    personalInfo: z.object({
      firstName: z.string(),
      lastName: z.string(),
      dateOfBirth: z.string().describe("YYYY-MM-DD"),
      ssn: z.string().describe("Social Security Number (will be encrypted)"),
      phone: z.string(),
      address: z.object({
        street: z.string(),
        city: z.string(),
        state: z.string(),
        zipCode: z.string(),
        country: z.string().default('USA')
      })
    })
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    // Get application
    const app = await Data.getEntry('onboarding_applications', input.applicationId);
    
    if (!app) {
      throw new Error('Application not found');
    }
    
    // Encrypt SSN before storing (in production, use proper encryption)
    const encryptedSSN = this.encryptSSN(input.personalInfo.ssn);
    
    // Update application with personal info
    await Data.update('onboarding_applications', input.applicationId, {
      ...app.data,
      personalInfo: {
        ...input.personalInfo,
        ssn: encryptedSSN // Store encrypted
      },
      currentStep: 'document_upload',
      completedSteps: [...app.data.completedSteps, 'personal_info'],
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      nextStep: 'document_upload',
      message: "Personal information saved securely. Next, please upload a government-issued ID.",
      documentsNeeded: [
        "Government-issued photo ID (driver's license or passport)",
        "Proof of address (utility bill or bank statement)"
      ]
    };
  }
  
  private encryptSSN(ssn: string): string {
    // In production, use proper encryption (AES-256, KMS, etc.)
    // This is a placeholder
    return Buffer.from(ssn).toString('base64');
  }
}

// 3. Upload Document (Stripe Identity API)
export class UploadDocumentTool implements LuaTool {
  name = "upload_document";
  description = "Upload identity verification document";
  
  inputSchema = z.object({
    applicationId: z.string(),
    documentType: z.enum(['drivers_license', 'passport', 'id_card', 'proof_of_address']),
    documentImageUrl: z.string().url().describe("URL of uploaded document image"),
    documentSide: z.enum(['front', 'back']).optional().describe("For driver's license")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const stripeKey = env('STRIPE_SECRET_KEY');
    
    if (!stripeKey) {
      throw new Error('Stripe API key not configured');
    }
    
    const app = await Data.getEntry('onboarding_applications', input.applicationId);
    
    const documents = app.data.documents || [];
    documents.push({
      type: input.documentType,
      side: input.documentSide,
      uploadedAt: new Date().toISOString(),
      status: 'uploaded'
    });
    
    await Data.update('onboarding_applications', input.applicationId, {
      ...app.data,
      documents,
      currentStep: 'identity_verification',
      updatedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      status: 'uploaded',
      message: "Document uploaded successfully. Verification in progress...",
      nextStep: "We'll verify your identity. This usually takes 1-2 minutes."
    };
  }
}

// 4. Verify Identity (Check Stripe Identity Results)
export class VerifyIdentityTool implements LuaTool {
  name = "verify_identity";
  description = "Check identity verification status";
  
  inputSchema = z.object({
    applicationId: z.string()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const app = await Data.getEntry('onboarding_applications', input.applicationId);
    
    if (!app.data.documents || app.data.documents.length === 0) {
      return {
        verified: false,
        message: "No documents uploaded yet. Please upload your ID first."
      };
    }
    
    // Simulate verification (in production, check with Stripe)
    const isVerified = true;
    
    // Update application
    if (isVerified) {
      await Data.update('onboarding_applications', input.applicationId, {
        ...app.data,
        identityVerified: true,
        verificationResult: {
          verified: true,
          verifiedAt: new Date().toISOString()
        },
        currentStep: 'qualifying_questions',
        completedSteps: [...app.data.completedSteps, 'identity_verification']
      });
    }
    
    return {
      verified: isVerified,
      status: 'verified',
      message: "✅ Identity verified successfully! Let's continue with some qualifying questions.",
      nextStep: 'qualifying_questions'
    };
  }
}

// 5. Answer Qualifying Questions
export class AnswerQualifyingQuestionsTool implements LuaTool {
  name = "answer_qualifying_questions";
  description = "Complete financial suitability questionnaire";
  
  inputSchema = z.object({
    applicationId: z.string(),
    answers: z.object({
      annualIncome: z.enum(['under_25k', '25k_50k', '50k_100k', '100k_250k', 'over_250k']),
      employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'retired', 'student']),
      investmentExperience: z.enum(['none', 'limited', 'moderate', 'extensive']),
      riskTolerance: z.enum(['conservative', 'moderate', 'aggressive']),
      investmentGoals: z.array(z.enum(['retirement', 'wealth_building', 'income', 'preservation'])),
      investmentHorizon: z.enum(['short_term', 'medium_term', 'long_term']),
      liquidNetWorth: z.enum(['under_10k', '10k_50k', '50k_100k', '100k_500k', 'over_500k']),
      sourceOfFunds: z.enum(['employment', 'business', 'investments', 'inheritance', 'other'])
    })
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const app = await Data.getEntry('onboarding_applications', input.applicationId);
    
    // Calculate suitability score
    const suitabilityScore = this.calculateSuitability(input.answers);
    
    // Determine if applicant qualifies
    const qualifies = suitabilityScore.score >= 60;
    
    // Update application
    await Data.update('onboarding_applications', input.applicationId, {
      ...app.data,
      qualifyingAnswers: input.answers,
      suitabilityScore: suitabilityScore,
      qualifies,
      currentStep: qualifies ? 'account_creation' : 'under_review',
      completedSteps: [...app.data.completedSteps, 'qualifying_questions'],
      updatedAt: new Date().toISOString()
    });
    
    if (!qualifies) {
      return {
        success: false,
        qualifies: false,
        score: suitabilityScore.score,
        message: "Thank you for your application. Based on your responses, we need to review your application manually. Our team will contact you within 2 business days.",
        nextSteps: "Our compliance team will review your application"
      };
    }
    
    return {
      success: true,
      qualifies: true,
      score: suitabilityScore.score,
      riskProfile: suitabilityScore.riskProfile,
      recommendedProducts: this.getRecommendedProducts(input.answers),
      message: "Great! You qualify for an account. Let's create your account now.",
      nextStep: 'account_creation'
    };
  }
  
  private calculateSuitability(answers: any) {
    let score = 0;
    
    // Income scoring
    const incomeScores: Record<string, number> = {
      'under_25k': 10,
      '25k_50k': 20,
      '50k_100k': 30,
      '100k_250k': 40,
      'over_250k': 50
    };
    score += incomeScores[answers.annualIncome] || 0;
    
    // Experience scoring
    const experienceScores: Record<string, number> = {
      'none': 5,
      'limited': 15,
      'moderate': 25,
      'extensive': 35
    };
    score += experienceScores[answers.investmentExperience] || 0;
    
    // Net worth scoring
    const netWorthScores: Record<string, number> = {
      'under_10k': 5,
      '10k_50k': 10,
      '50k_100k': 15,
      '100k_500k': 20,
      'over_500k': 25
    };
    score += netWorthScores[answers.liquidNetWorth] || 0;
    
    // Determine risk profile
    let riskProfile = 'conservative';
    if (answers.riskTolerance === 'aggressive' && answers.investmentHorizon === 'long_term') {
      riskProfile = 'aggressive';
    } else if (answers.riskTolerance === 'moderate') {
      riskProfile = 'moderate';
    }
    
    return {
      score,
      riskProfile,
      passedCompliance: score >= 60
    };
  }
  
  private getRecommendedProducts(answers: any) {
    const products = [];
    
    if (answers.investmentGoals.includes('retirement')) {
      products.push('IRA Account', '401(k) Rollover');
    }
    
    if (answers.riskTolerance === 'conservative') {
      products.push('Money Market Account', 'CD Account');
    } else if (answers.riskTolerance === 'aggressive') {
      products.push('Investment Account', 'Options Trading');
    } else {
      products.push('Savings Account', 'Investment Account');
    }
    
    return products;
  }
}

// 6. Create Account
export class CreateAccountTool implements LuaTool {
  name = "create_account";
  description = "Create verified financial services account";
  
  inputSchema = z.object({
    applicationId: z.string(),
    accountProducts: z.array(z.string()).describe("Selected account products"),
    agreeToTerms: z.boolean().describe("Must accept terms and conditions"),
    agreeToPrivacyPolicy: z.boolean()
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    if (!input.agreeToTerms || !input.agreeToPrivacyPolicy) {
      throw new Error('You must agree to the terms and conditions to create an account');
    }
    
    const app = await Data.getEntry('onboarding_applications', input.applicationId);
    
    // Verify all steps completed
    if (!app.data.identityVerified) {
      throw new Error('Identity verification must be completed first');
    }
    
    if (!app.data.qualifies) {
      throw new Error('Application is pending review');
    }
    
    // Generate account number
    const accountNumber = this.generateAccountNumber();
    
    // Update application as completed
    await Data.update('onboarding_applications', input.applicationId, {
      ...app.data,
      status: 'completed',
      accountId: `ACC_${Date.now()}`,
      accountNumber: accountNumber,
      products: input.accountProducts,
      completedSteps: [...app.data.completedSteps, 'account_creation'],
      completedAt: new Date().toISOString()
    });
    
    return {
      success: true,
      accountId: `ACC_${Date.now()}`,
      accountNumber: accountNumber.replace(/\d(?=\d{4})/g, '*'), // Mask all but last 4
      products: input.accountProducts,
      message: `🎉 Account created successfully! Your account number is ****${accountNumber.slice(-4)}. Check your email for login credentials.`,
      nextSteps: [
        "Check your email for account details",
        "Set up online banking",
        "Fund your account to start using services",
        "Download our mobile app for easy access"
      ]
    };
  }
  
  private generateAccountNumber(): string {
    return Math.floor(1000000000 + Math.random() * 9000000000).toString();
  }
}

// 7. Check Onboarding Status
export class CheckOnboardingStatusTool implements LuaTool {
  name = "check_onboarding_status";
  description = "Check the status of an onboarding application";
  
  inputSchema = z.object({
    applicationId: z.string(),
    email: z.string().email().describe("Email for verification")
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const app = await Data.getEntry('onboarding_applications', input.applicationId);
    
    if (!app || app.data.email !== input.email) {
      throw new Error('Application not found or email mismatch');
    }
    
    const stepStatus = {
      started: '🟢 Started',
      personal_info: app.data.completedSteps.includes('personal_info') ? '✅ Complete' : '⏳ Pending',
      document_upload: app.data.documents?.length > 0 ? '✅ Complete' : '⏳ Pending',
      identity_verification: app.data.identityVerified ? '✅ Verified' : '⏳ Pending',
      qualifying_questions: app.data.qualifyingAnswers ? '✅ Complete' : '⏳ Pending',
      account_creation: app.data.accountId ? '✅ Complete' : '⏳ Pending'
    };
    
    return {
      applicationId: input.applicationId,
      status: app.data.status,
      currentStep: app.data.currentStep,
      progress: stepStatus,
      completedSteps: app.data.completedSteps,
      nextStep: this.getNextStepMessage(app.data.currentStep),
      estimatedCompletion: app.data.status === 'completed' 
        ? 'Completed'
        : this.calculateEstimatedCompletion(app.data.completedSteps.length)
    };
  }
  
  private getNextStepMessage(currentStep: string): string {
    const messages: Record<string, string> = {
      personal_info: "Please provide your personal information",
      document_upload: "Please upload your government-issued ID",
      identity_verification: "Verifying your identity...",
      qualifying_questions: "Please answer the qualifying questions",
      account_creation: "Ready to create your account!",
      under_review: "Application under manual review",
      completed: "Application complete!"
    };
    return messages[currentStep] || "Continue with onboarding";
  }
  
  private calculateEstimatedCompletion(completedSteps: number): string {
    const totalSteps = 5;
    const remaining = totalSteps - completedSteps;
    return `${remaining * 2} minutes`;
  }
}

