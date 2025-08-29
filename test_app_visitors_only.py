from fastapi import FastAPI
from backend.app.routers import visitors
from backend.app.middleware import setup_cors, SecurityHeadersMiddleware, InputValidationMiddleware, SecurityMonitoringMiddleware
from backend.app.middleware import setup_rate_limiting

app = FastAPI(title='Test App with Visitors Only', version='1.0.0')
setup_cors(app)
app.add_middleware(SecurityMonitoringMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(InputValidationMiddleware)
setup_rate_limiting(app)
app.include_router(visitors.router, prefix='/api')

print('App with visitors router only created successfully')
