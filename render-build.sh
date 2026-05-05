#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
npx puppeteer browsers install chrome
npx prisma generate
# if you have a custom build script
# node scripts/build.mjs
