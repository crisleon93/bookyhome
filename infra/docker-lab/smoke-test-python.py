#!/usr/bin/env python3
"""
smoke-test-python.py — Prueba de humo BookyHome (sin curl)
Equivalente a scripts/smoke-test.sh pero usando solo urllib de la stdlib.
Uso: python3 smoke-test-python.py http://localhost:8000 http://localhost:5173
"""
import sys
import urllib.request
import urllib.error
import json
from datetime import datetime

API_URL      = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
FRONTEND_URL = sys.argv[2] if len(sys.argv) > 2 else "http://localhost:5173"

PASS = 0
FAIL = 0

def check(description, url, expected_code=200, body_contains=None):
    global PASS, FAIL
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "bookyhome-smoketest/1.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            status = r.status
            body   = r.read().decode("utf-8", errors="ignore")
    except urllib.error.HTTPError as e:
        status = e.code
        body   = ""
    except Exception as e:
        print(f"  ✘ FAIL {description} — error: {e}")
        FAIL += 1
        return

    if status != expected_code:
        print(f"  ✘ FAIL {description} — esperado HTTP {expected_code}, obtuvo HTTP {status} | {url}")
        FAIL += 1
        return

    if body_contains and body_contains not in body:
        print(f"  ✘ FAIL {description} — HTTP {status} OK pero body no contiene '{body_contains}'")
        FAIL += 1
        return

    print(f"  ✔ PASS {description} — HTTP {status}")
    PASS += 1

print("=" * 48)
print(" Prueba de humo — BookyHome")
print(f" API:      {API_URL}")
print(f" Frontend: {FRONTEND_URL}")
print(f" Fecha:    {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
print("=" * 48)

# API
check("API raíz",                    f"{API_URL}/",                          body_contains="BookyHome")
check("API /docs (Swagger)",          f"{API_URL}/docs",                      body_contains="swagger")
check("API /catalogo/categorias",     f"{API_URL}/catalogo/categorias")
check("API /catalogo/busqueda-avanzada", f"{API_URL}/catalogo/busqueda-avanzada")

# Health
try:
    with urllib.request.urlopen(f"{API_URL}/health", timeout=10) as r:
        hbody = r.read().decode()
        hdata = json.loads(hbody)
        if r.status == 200 and hdata.get("checks", {}).get("database", {}).get("status") == "ok":
            print(f"  ✔ PASS API /health — HTTP 200, base de datos sana")
            PASS += 1
        else:
            print(f"  ✘ FAIL API /health — DB no sana: {hdata}")
            FAIL += 1
except Exception as e:
    print(f"  ✘ FAIL API /health — {e}")
    FAIL += 1

# Catálogo con datos
try:
    with urllib.request.urlopen(f"{API_URL}/catalogo/busqueda-avanzada", timeout=10) as r:
        cbody = r.read().decode()
        if '"libros"' in cbody or '"data"' in cbody:
            print("  ✔ PASS Catálogo devuelve estructura JSON con resultados")
            PASS += 1
        else:
            print("  ✘ FAIL Catálogo no devuelve estructura JSON esperada")
            FAIL += 1
except Exception as e:
    print(f"  ✘ FAIL Catálogo — {e}")
    FAIL += 1

# Frontend
check("Frontend raíz", f"{FRONTEND_URL}/")

print("=" * 48)
print(f" Pasaron: {PASS}  |  Fallaron: {FAIL}")
print("=" * 48)
if FAIL > 0:
    print("RESULTADO: FALLA")
    sys.exit(1)
else:
    print("RESULTADO: OK — todas las pruebas pasaron")
    sys.exit(0)
