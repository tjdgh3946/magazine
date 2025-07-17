#!/bin/bash

FILE="metadata.js"

if [ ! -f "$FILE" ]; then
  echo "❌ metadata.js not found"
  exit 1
fi

# Get last object block
last_block=$(awk '/{/{f=1} f; /}/{f=0}' metadata.js | tail -n 20)
echo "$last_block" > latest_meta.txt

# Count number of { to get index
total=$(grep -o '{' metadata.js | wc -l)
echo "SLIDE_INDEX=$((total))" >> $GITHUB_ENV


# 🧠 Extract the message field (supports multiline)
message=$(awk '
            BEGIN {found=0; msg=""}
            /message:/ {
              found=1
              sub(/^.*message:[[:space:]]*"/, "")
              if ($0 ~ /"[,]*[[:space:]]*$/) {
                sub(/"[,]*[[:space:]]*$/, "")
                msg = $0
                found=0
              } else {
                msg = $0
              }
              next
            }
            found {
              if ($0 ~ /"[,]*[[:space:]]*$/) {
                sub(/"[,]*[[:space:]]*$/, "")
                msg = msg "\n" $0
                found=0
              } else {
                msg = msg "\n" $0
              }
            }
            END {print msg}
          ' latest_meta.txt)

echo "💬 Message: \"$message\""

# 🧠 Step 4: construct Slack text
echo -e "\n📦 Final Slack Message:"
echo "New magazine uploaded! 🖼️"
echo "https://tjdgh3946.github.io/magazine/#/$total"
echo "💬 \"$message\""
