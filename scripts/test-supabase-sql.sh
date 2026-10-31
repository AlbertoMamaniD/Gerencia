#!/usr/bin/env bash
# Ejecuta schema.sql + migraciones (dos veces, para comprobar idempotencia) y las pruebas RLS.
# Requiere psql y las variables PGHOST/PGUSER/PGPASSWORD (en CI las define el servicio postgres).
set -euo pipefail
cd "$(dirname "$0")/.."

run() {
  PGOPTIONS="-c client_min_messages=warning" psql -v ON_ERROR_STOP=1 -q -f "$1" > /dev/null
  echo "✓ $1"
}

run supabase/tests/00_supabase_stub.sql
run supabase/schema.sql
for pass in 1 2; do
  for migration in supabase/migrations/*.sql; do run "$migration"; done
done

# Cualquier "FALLO" en las pruebas lanza una excepción y psql termina con error.
if ! output=$(psql -v ON_ERROR_STOP=1 -q -f supabase/tests/rls_test.sql 2>&1); then
  echo "$output"
  echo "✗ Las pruebas de seguridad SQL fallaron."
  exit 1
fi
echo "$output" | grep -E "OK:" | sed 's/.*NOTICE: */  /'
echo "✓ Pruebas de seguridad SQL completadas."
