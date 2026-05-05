#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# Install chrome into a local folder inside the project
npx puppeteer browsers install chrome --cache .puppeteer-cache
npx prisma generate
