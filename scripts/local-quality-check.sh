#!/bin/sh
set -eu

run_checks() {
  project_dir="$1"
  label="$2"

  if [ ! -f "$project_dir/package.json" ]; then
    echo "Skipping $label: package.json not found"
    return 0
  fi

  echo ""
  echo "=== $label checks ==="
  (
    cd "$project_dir"

    if [ ! -d "node_modules" ]; then
      echo "node_modules not found in $project_dir. Installing dependencies..."
      if [ -f "package-lock.json" ]; then
        npm ci
      else
        npm install
      fi
    fi

    npm run check:all
  )
}

run_checks "cif-admin-panel" "Admin Panel"
run_checks "app-cif/frontend" "Mobile Frontend"
run_checks "app-cif/backend" "Backend"

echo ""
echo "Local quality gate completed successfully."
