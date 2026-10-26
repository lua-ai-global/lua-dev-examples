import { Browser, LuaTool } from 'lua-cli';
import type { BrowserCommandResult, BrowserFileResult } from 'lua-cli';
import { z } from 'zod';
import { dataOf, explain, failedCommand, pause, thrown } from '../../lib/browser';

const SITE = 'https://the-internet.herokuapp.com';
const FIRST_DOWNLOAD_LINK = '#content a[href^="download/"]';
const SESSION = { browser: 'files', sessionKey: 'files' };
const UPLOAD_ATTEMPTS = 3;
const UPLOAD_WAIT_MS = 5000;

function fileOf(result: BrowserCommandResult): BrowserFileResult | undefined {
  const data = result.data as BrowserFileResult | undefined;
  return data && typeof data.fileId === 'string' ? data : undefined;
}

function saved(file: BrowserFileResult) {
  return {
    name: file.name,
    url: file.url,
    bytes: file.bytes,
    mime: file.mime,
    scanStatus: file.scanStatus,
  };
}

export default class SaveFilesTool implements LuaTool {
  name = 'save_files';
  description =
    'Save the demo download page as a PDF, save the first file it links to, and put that file back into the upload form on the same site.';

  inputSchema = z.object({
    selector: z
      .string()
      .optional()
      .describe('A CSS selector for the link to download instead of the first one on the page'),
  });

  async execute(input: z.infer<typeof this.inputSchema>) {
    try {
      const opened = await Browser.session_open({ ...SESSION, url: `${SITE}/download` });
      if (opened.error) return failedCommand('session_open', opened);

      const page = await Browser.pdf({ ...SESSION, name: 'download-page.pdf' });
      if (page.error) return failedCommand('pdf', page);
      const pdf = fileOf(page);

      const got = await Browser.download({
        ...SESSION,
        selector: input.selector ?? FIRST_DOWNLOAD_LINK,
        name: 'demo-download',
      });
      if (got.error) {
        return {
          ok: false,
          pdf: pdf ? saved(pdf) : undefined,
          download: failedCommand('download', got),
        };
      }
      const file = fileOf(got);
      if (!file) return { ok: false, pdf: pdf ? saved(pdf) : undefined, reason: 'The download saved no file.' };

      const upload = await this.uploadWhenClean(file.fileId);

      return {
        ok: upload.ok,
        pdf: pdf ? saved(pdf) : undefined,
        download: saved(file),
        upload,
        reason:
          'A file the browser has just saved is always being scanned. It opens from its url once the scan marks it clean.',
      };
    } catch (error) {
      return thrown(error);
    } finally {
      await Browser.close(SESSION).catch(() => undefined);
    }
  }

  private async uploadWhenClean(fileId: string) {
    let last: BrowserCommandResult | undefined;

    for (let attempt = 1; attempt <= UPLOAD_ATTEMPTS; attempt++) {
      const form = await Browser.navigate({ ...SESSION, url: `${SITE}/upload`, waitUntil: 'load' });
      if (form.error) return { ...failedCommand('navigate', form), attempts: attempt };

      last = await Browser.upload({ ...SESSION, selector: '#file-upload', file: fileId });
      if (!last.error) {
        const submitted = await Browser.click({ ...SESSION, selector: '#file-submit' });
        if (submitted.error) return { ...failedCommand('click', submitted), attempts: attempt };

        const shown = await Browser.get({ ...SESSION, what: 'text', selector: '#uploaded-files' });
        return { ok: true, attempts: attempt, uploadedFile: dataOf(shown) };
      }

      if (last.code !== 'file_not_clean' || attempt === UPLOAD_ATTEMPTS) break;
      await pause(UPLOAD_WAIT_MS);
    }

    return {
      ok: false,
      attempts: UPLOAD_ATTEMPTS,
      code: last?.code,
      error: last?.error,
      reason:
        explain(last?.code) ??
        'The file could not be uploaded. Hand the user its name and url, and let them open it once the scan clears.',
    };
  }
}
