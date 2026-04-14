import { LuaTool, env } from 'lua-cli';
import { z } from 'zod';
import { FinservService } from '../../services/FinservService';
import { ImageTypeValues, UserGenderValues, NextOfKinRelationValues } from '../../models/enums';

export class UpdatePersonalInfoTool implements LuaTool {
  name = 'update_personal_info';
  description =
    "Save the user's personal KYC details: full name, date of birth, gender, and nationality. Call this after OTP is verified. Collect all fields conversationally — one question at a time — then call this tool once you have all values.";
  inputSchema = z.object({
    firstName: z.string().describe("User's first name"),
    lastName: z.string().describe("User's last name / surname"),
    dateOfBirth: z.string().describe("Date of birth in YYYY-MM-DD format"),
    gender: z.enum(UserGenderValues).describe("User's gender"),
    nationality: z.string().describe("User's nationality or country of citizenship"),
    email: z.string().email().optional().describe("Email address (optional but recommended)"),
    address: z.string().optional().describe("Residential address (optional)"),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.updatePersonalInfo(input);
  }
}

export class UploadDocumentTool implements LuaTool {
  name = 'upload_document';
  description =
    "Record an identity document photo that the user has sent. The Lua platform automatically provides a CDN URL for any image the user sends. Call this for each side of the document (front and back where required). Accepted types depend on the user's country — check the country config.";
  inputSchema = z.object({
    type: z
      .enum(ImageTypeValues)
      .describe(
        "The type of document uploaded. E.g. national_id_front, national_id_back, passport_front, passport_back, driver_license_front, driver_license_back, refugee_id_front, refugee_id_back, selfie"
      ),
    luaCdnUrl: z
      .string()
      .url()
      .describe('The CDN URL of the uploaded image provided by the Lua platform'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.uploadDocument(input);
  }
}

export class SkipDocumentUploadTool implements LuaTool {
  name = 'skip_document_upload';
  description =
    'Skip the document upload step in demo mode. Only available when DEMO_MODE=true. Use this when the user cannot upload a real image (e.g. during CLI testing). Do not offer this option on production channels where real images can be sent.';
  inputSchema = z.object({});

  async execute(_input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.skipDocumentUpload();
  }
}

export class AddNextOfKinTool implements LuaTool {
  name = 'add_next_of_kin';
  description =
    "Add a next of kin / emergency contact for the applicant. Required for loan applications. Collect name, relationship, and phone number. Add at least two contacts.";
  inputSchema = z.object({
    name: z.string().describe('Full name of the next of kin'),
    relation: z.enum(NextOfKinRelationValues).describe('Relationship to the applicant'),
    phoneNumber: z
      .string()
      .describe('Phone number of the next of kin in international format, e.g. +256712345678'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    const service = new FinservService();
    return service.addNextOfKin(input);
  }
}
