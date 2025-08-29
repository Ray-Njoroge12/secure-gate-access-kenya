from fastapi import FastAPI
from backend.app.routers import visitors
from backend.app.middleware import setup_cors, SecurityHeadersMiddleware, InputValidationMiddleware

app = FastAPI(title='Test App with Input Validation', version='1.0.0')
setup_cors(app)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(InputValidationMiddleware)
app.include_router(visitors.router, prefix='/api')

print('App with Input Validation created successfully')
