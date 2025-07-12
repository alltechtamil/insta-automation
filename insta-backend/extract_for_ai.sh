#!/bin/bash

# ————— CONFIGURATION —————
output_file="./generated_for_llm.txt"
REMOVE_COMMENTS=true
HONOR_GITIGNORE=true
ADD_LINE_NUMBERS=false

INCLUDE_EMPTY_FILES=true

excluded_folders=("node_modules" "logs" "node_modules" ".git")
excluded_files=("package-lock.json" "mathan.json" "Readme.md" "CodeMate.js" "promptTemplate.js" ".prettierrc" ".eslintrc.json" "combined_for_llm.txt" ".prettierignore" ".gitignore" "server-new.js" "server-old.js" "notes.txt" 'example.env' "extract_for_llm.sh" "extract_for_ai.sh")

> "$output_file" 

{
  echo "================================================================"
  echo "Directory Structure"
  echo "================================================================"
  echo
  echo "================================================================"
  echo "Start of Codebase"
  echo "================================================================"
  echo
} >> "$output_file"

[ -d .git ] || git init &>/dev/null

folder_pat=$(IFS="|"; echo "${excluded_folders[*]}")
file_pat=$(IFS="|"; echo "${excluded_files[*]}")

if $HONOR_GITIGNORE; then
  mapfile -t files < <(git ls-files --cached --others --exclude-standard)
else
  prune_expr=""
  for d in "${excluded_folders[@]}"; do
    prune_expr+=" -path \"./$d\" -o"
  done
  prune_expr=${prune_expr# }    
  prune_expr=${prune_expr% -o}   

  mapfile -t files < <(eval "find . \\( $prune_expr \\) -prune -o -type f -print" \
    | sed 's|^\./||')
fi

for file in "${files[@]}"; do
  [[ "$file" =~ ^($file_pat)$ ]] && continue
  [[ "$file" =~ \.(jpg|jpeg|png|heic|pdf|svg|webp|ico|lockb|bin|exe|dll|zip|tar|gz|bz2)$ ]] && continue
  [[ "$file" == "${output_file#./}" ]] && continue

  if $REMOVE_COMMENTS && [[ "$file" =~ \.(js|ts|tsx|jsx|py|java|c|cpp|h|cs|sh)$ ]]; then
    cleaned=$(awk '
      function strip_blocks(s) {
        while (match(s, /\/\*[^*]*\*+([^/*][^*]*\*+)*\//)) {
          s = substr(s, 1, RSTART-1) substr(s, RSTART+RLENGTH)
        }
        return s
      }
      {
        line = $0
        line = strip_blocks(line)
        if (!/\/\/\s*(TODO|NOTE|WARNING|EXPLAIN|FIXME)/ && !/#\s*(TODO|NOTE)/) {
          sub(/\/\/.*/, "", line)
          sub(/#.*$/, "", line)
        }
        if (line ~ /^[[:space:]]*$/) next
        print line
      }
    ' "$file")
  else
    cleaned=$(awk 'NF' "$file")
  fi

  if $ADD_LINE_NUMBERS && [[ -n "$cleaned" ]]; then
    cleaned=$(printf "%s\n" "$cleaned" | cat -n | sed 's/^[[:space:]]*//')
  fi

  if [[ -n "$cleaned" ]] || [[ "$INCLUDE_EMPTY_FILES" == "true" ]]; then
    {
      echo "================================================"
      echo "FILE: $file"
      echo "================================================"
      if [[ -n "$cleaned" ]]; then
        printf "%s\n\n" "$cleaned"
      else
        echo "[Empty File]"
        echo
      fi
    } >> "$output_file"
  fi
done

{
  echo "================================================================"
  echo "End of Codebase"
  echo "================================================================"
} >> "$output_file"
