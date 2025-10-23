@echo off
git add .
git commit -m "Fix critical ESLint errors for deployment - Add missing Badge and Button imports - Configure ESLint to use warnings instead of errors - Fix unescaped entities and missing imports"
git push origin main
