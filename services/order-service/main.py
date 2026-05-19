import os, time, random
from fastapi import FastAPI, HTTPException
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

SERVICE_NAME = os.getenv("SERVICE_NAME", "order-service")
VERSION = os.getenv("VERSION", "1.0.0")
PORT = int(os.getenv("PORT", "8003"))
BROKEN_DB = os.getenv("BROKEN_DB", "false").lower() == "true"

app = FastAPI(title=f"{SERVICE_NAME} API", version=VERSION)
REQUESTS = Counter("http_requests_total", "Total HTTP requests", ["service", "endpoint", "method", "status"])
LATENCY = Histogram("http_request_duration_seconds", "Request latency", ["service", "endpoint"])
UP = Gauge("service_up", "Service health status", ["service"])

DATA = [{"id": 1, "name": "Sample order", "status": "active"}]

@app.middleware("http")
async def metrics_middleware(request, call_next):
    endpoint = request.url.path
    method = request.method
    with LATENCY.labels(SERVICE_NAME, endpoint).time():
        try:
            response = await call_next(request)
            status = str(response.status_code)
        except Exception:
            status = "500"
            REQUESTS.labels(SERVICE_NAME, endpoint, method, status).inc()
            raise
    REQUESTS.labels(SERVICE_NAME, endpoint, method, status).inc()
    return response

@app.get("/health")
def health():
    if BROKEN_DB and SERVICE_NAME == "order-service":
        UP.labels(SERVICE_NAME).set(0)
        raise HTTPException(status_code=503, detail="Database configuration error")
    UP.labels(SERVICE_NAME).set(1)
    return {"service": SERVICE_NAME, "status": "healthy", "version": VERSION}

@app.get("/ready")
def ready():
    return {"service": SERVICE_NAME, "ready": True}

@app.get("/items")
def list_items():
    time.sleep(random.uniform(0.01, 0.05))
    return {"service": SERVICE_NAME, "data": DATA}

@app.post("/items")
def create_item(payload: dict):
    if BROKEN_DB and SERVICE_NAME == "order-service":
        raise HTTPException(status_code=500, detail="Cannot write order: invalid DB_HOST")
    item = {"id": len(DATA)+1, **payload}
    DATA.append(item)
    return {"service": SERVICE_NAME, "created": item}

@app.get("/metrics")
def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
