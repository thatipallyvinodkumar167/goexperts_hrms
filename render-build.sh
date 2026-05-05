#!/usr/bin/env bash
# exit on error
set -o errexit

npm install
# Install chrome into a VISIBLE local folder
npx puppeteer browsers install chrome --cache puppeteer-browser-cache
npx prisma generate
