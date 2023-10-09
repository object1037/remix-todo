import { createPagesFunctionHandler } from '@remix-run/cloudflare-pages'
import * as build from '@remix-run/dev/server-build'

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => ({ env: context.env }),
  mode: build.mode,
})
