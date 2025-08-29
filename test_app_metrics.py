from fastapi import FastAPI, Request
from backend.app.routers import visitors
from backend.app.middleware import setup_cors, SecurityHeadersMiddleware, InputValidationMiddleware, SecurityMonitoringMiddleware
from backend.app.metrics import REQUEST_COUNT, REQUEST_LATENCY, ACTIVE_CONNECTIONS
import time

app = FastAPI(title='Test App with Metrics', version='1.0.0')
setup_cors(app)
app.add_middleware(SecurityMonitoringMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(InputValidationMiddleware)
app.include_router(visitors.router, prefix='/api')

# Metrics middleware
@app.middleware('http')
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    if ACTIVE_CONNECTIONS:
        ACTIVE_CONNECTIONS.inc()
    
    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        
        if REQUEST_COUNT and REQUEST_LATENCY:
            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.url.path,
                status=str(response.status_code)
            ).inc()
            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.url.path
            ).observe(process_time)
        
        return response
    finally:
        if ACTIVE_CONNECTIONS:
            ACTIVE_CONNECTIONS.dec()

print('App with Metrics created successfully')
