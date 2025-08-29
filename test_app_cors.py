from fastapi import FastAPI
from backend.app.routers import visitors
from backend.app.middleware import setup_cors

app = FastAPI(title='Test App with CORS', version='1.0.0')
setup_cors(app)
app.include_router(visitors.router, prefix='/api')

print('App with CORS created successfully')
