#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# Install chrome INTO node_modules so Render doesn't delete it
npx puppeteer browsers install chrome --cache node_modules/puppeteer-cache
npx prisma generate
