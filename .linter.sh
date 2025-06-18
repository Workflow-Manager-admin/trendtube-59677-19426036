#!/bin/bash
cd /home/kavia/workspace/code-generation/trendtube-59677-19426036/trendtube_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

