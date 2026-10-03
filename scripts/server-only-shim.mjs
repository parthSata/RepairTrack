import { plugin } from 'bun'

// Next.js resolves 'server-only' from its own bundle; plain Bun scripts need an empty stand-in.
plugin({
  name: 'server-only-shim',
  setup(build) {
    build.module('server-only', () => ({ exports: {}, loader: 'object' }))
  },
})
