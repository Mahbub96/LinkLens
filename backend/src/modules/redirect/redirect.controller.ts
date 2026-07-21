import { Controller, Get, Param, Req, Res, Post, Body, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { RedirectService } from './redirect.service';
import { Public } from '../../common/decorators';

@ApiTags('Redirect')
@Controller()
export class RedirectController {
  constructor(private redirectService: RedirectService) {}

  /**
   * Main redirect endpoint – the Hot Path.
   * Handles: GET /r/:slug (default domain)
   */
  @Public()
  @Get('r/:slug')
  @ApiOperation({ summary: 'Redirect a short link (default domain)' })
  async redirectDefault(@Param('slug') slug: string, @Req() req: Request, @Res() res: Response) {
    try {
      const { url, statusCode } = await this.redirectService.resolve('default', slug, req);
      return res.redirect(statusCode, url);
    } catch (err: any) {
      return res.status(err.status || 404).json({ error: err.message || 'Link not found' });
    }
  }

  /**
   * Password verification for protected links.
   */
  @Public()
  @Post('r/:slug/verify')
  @ApiOperation({ summary: 'Verify password for a protected link' })
  async verifyPassword(
    @Param('slug') slug: string,
    @Body('password') password: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const valid = await this.redirectService.verifyPassword('default', slug, password);
    if (!valid) {
      return res.status(HttpStatus.FORBIDDEN).json({ error: 'Invalid password' });
    }
    const { url, statusCode } = await this.redirectService.resolve('default', slug, req);
    return res.redirect(statusCode, url);
  }

  /**
   * Client-side fingerprinting page – serves the anti-evasion HTML.
   * For links flagged with Advanced Threat Telemetry, this serves a loading
   * page that captures browser telemetry before redirecting.
   */
  @Public()
  @Get('r/:slug/fp')
  @ApiExcludeEndpoint()
  async fingerprintPage(@Param('slug') slug: string, @Res() res: Response) {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Redirecting...</title>
<style>
  body{margin:0;display:flex;align-items:center;justify-content:center;height:100vh;
  background:#0a0a0a;color:#fff;font-family:system-ui}
  .loader{width:40px;height:40px;border:3px solid #333;border-top:3px solid #6366f1;
  border-radius:50%;animation:spin 1s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
</style></head>
<body>
<div style="text-align:center">
  <div class="loader"></div>
  <p style="margin-top:16px;color:#888">Verifying your connection...</p>
</div>
<script>
(async()=>{
  const fp={
    tz:Intl.DateTimeFormat().resolvedOptions().timeZone,
    hc:navigator.hardwareConcurrency||0,
    dm:navigator.deviceMemory||0,
    sr:screen.width+'x'+screen.height,
    lang:navigator.language,
    canvas:await getCanvasHash(),
  };
  async function getCanvasHash(){
    try{
      const c=document.createElement('canvas');
      const ctx=c.getContext('2d');
      ctx.textBaseline='top';ctx.font='14px Arial';
      ctx.fillText('LinkLens FP',2,2);
      return c.toDataURL().slice(-32);
    }catch{return''}
  }
  const r=await fetch('/api/v1/fingerprint/${slug}',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(fp)
  });
  const data=await r.json();
  if(data.url)window.location.href=data.url;
})();
</script>
</body></html>`;
    res.type('html').send(html);
  }

  /**
   * Fingerprint data receiver endpoint.
   */
  @Public()
  @Post('api/v1/fingerprint/:slug')
  @ApiExcludeEndpoint()
  async receiveFingerprint(
    @Param('slug') slug: string,
    @Body() fingerprint: Record<string, any>,
    @Req() req: Request,
  ) {
    // Store fingerprint data in the click event by adding to headers
    (req as any).fingerprint = fingerprint;
    const { url } = await this.redirectService.resolve('default', slug, req);
    return { url };
  }
}
